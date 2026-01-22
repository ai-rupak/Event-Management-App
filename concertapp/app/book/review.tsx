import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConcert } from "@/api/concertApi";
import { useBookingStore } from "@/stores/bookingStore";
import {
  confirmBooking,
  createBooking,
  getPendingBooking,
  
} from "@/api/bookingApi";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getQueueStatus, joinQueue } from "@/api/queue";
import { createPaymentIntent } from "@/api/stripe";
import {
  initPaymentSheet,
  presentPaymentSheet,
} from "@stripe/stripe-react-native";

interface Booking {
  id: string;
  expiresAt: string;
  seats: number;
  category: {
    id: string;
    name: string;
    price: number;
  };
}

interface QueueStatus {
  status: "none" | "waiting" | "active";
  position?: number;
}

export default function ReviewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: concert, isLoading: concertLoading } = useQuery({
    queryKey: ["concert"],
    queryFn: getConcert,
  });

  const [booking, setBooking] = useState<Booking | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const hasInitializedTimer = useRef(false);
  const hasTriedCreation = useRef(false);
  const hasJoinedQueue = useRef(false);

  const tickets = useBookingStore((s) => s.tickets);
  const removeTicket = useBookingStore((s) => s.removeTicket);
  const updateQuantity = useBookingStore((s) => s.updateQuantity);
  const getTotal = useBookingStore((s) => s.getTotal);
  const clearCart = useBookingStore((s) => s.clearCart);

  const categoryId = tickets[0]?.sectionId;
  const totalSeats = tickets.reduce((sum, t) => sum + t.quantity, 0);

  // Queue query with proper error handling
  const queueQuery = useQuery({
    queryKey: ["queueStatus"],
    queryFn: async () => {
      console.log("🔄 Fetching queue status...");
      const status = await getQueueStatus();
      console.log("📥 Queue status received:", status);
      return status;
    },
    refetchInterval: (data) => {
      // Stop polling if we have a booking or if active
      if (booking || data?.status === "active") return false;
      return 3000;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Auto-join queue when status is "none"
  useEffect(() => {
    console.log("🔍 Queue join check:", {
      hasData: !!queueQuery.data,
      status: queueQuery.data?.status,
      isLoading: queueQuery.isLoading,
      hasJoined: hasJoinedQueue.current,
    });

    if (queueQuery.isLoading || hasJoinedQueue.current) {
      return;
    }

    if (queueQuery.data?.status === "none") {
      console.log("🚦 Status is 'none', joining queue now...");
      hasJoinedQueue.current = true;

      joinQueue()
        .then((result) => {
          console.log("✅ Joined queue:", result);
          // Refetch immediately to get updated status
          setTimeout(() => {
            queueQuery.refetch();
          }, 500);
        })
        .catch((err) => {
          console.error("❌ Failed to join queue:", err);
          hasJoinedQueue.current = false;
          Alert.alert("Queue Error", "Failed to join queue. Please try again.");
        });
    }
  }, [queueQuery.data?.status, queueQuery.isLoading]);

  // Update local queue status state
  useEffect(() => {
    if (queueQuery.data && !booking) {
      console.log("📊 Updating queue status state:", queueQuery.data);
      setQueueStatus(queueQuery.data);
    }
  }, [queueQuery.data, booking]);

  const { data: pendingBooking, isLoading: pendingLoading } = useQuery({
    queryKey: ["pendingBooking", categoryId],
    queryFn: () => getPendingBooking(categoryId as string) || '',
    enabled: !!categoryId,
  });

  const createMutation = useMutation({
    mutationFn: (data: { categoryId: string; seats: number }) =>
      createBooking(data),
    onSuccess: (data: Booking) => {
      console.log("✅ Booking created successfully:", data);
      setBooking(data);
      setExpiresAt(new Date(data.expiresAt));
      setQueueStatus(null);
      queryClient.invalidateQueries({
        queryKey: ["pendingBooking", categoryId],
      });
      queryClient.removeQueries({ queryKey: ["queueStatus"] });
    },
    onError: (err: any) => {
      console.error(
        "❌ Create booking error",
        err.response?.data || err.message,
      );
      Alert.alert(
        "Booking Failed",
        err.response?.data?.message ||
          err?.message ||
          "Failed to reserve tickets",
      );
      hasTriedCreation.current = false;
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (bookingId: string) => confirmBooking(bookingId),
    onSuccess: (data, bookingId) => {
      console.log("✅ Booking confirmed successfully");
      queryClient.removeQueries({ queryKey: ["queueStatus"] });
      clearCart();
      queryClient.invalidateQueries({
        queryKey: ["pendingBooking", categoryId],
      });
      setIsProcessingPayment(false);
      router.replace(`/book/confirmation?bookingId=${bookingId}`);
    },
    onError: (err: any) => {
      console.error("❌ Confirm booking error:", err);
      setIsProcessingPayment(false);
      Alert.alert(
        "Booking Confirmation Failed",
        err?.response?.data?.message || err?.message || "Failed to confirm booking. Please contact support.",
      );
    },
  });

  // Timer effect
  useEffect(() => {
    if (expiresAt) {
      const now = new Date().getTime();
      let diff = Math.floor((expiresAt.getTime() - now) / 1000);

      console.log("⏱️ Timer init diff from backend:", diff);

      if (diff <= 0) {
        handleExpiry(false);
        return;
      }

      hasInitializedTimer.current = true;
      setSecondsLeft(Math.max(0, diff));

      const id = setInterval(() => {
        const updateDiff = Math.floor(
          (expiresAt.getTime() - Date.now()) / 1000,
        );
        setSecondsLeft(Math.max(0, updateDiff));

        if (updateDiff <= 0) {
          clearInterval(id);
          handleExpiry();
        }
      }, 1000);

      return () => clearInterval(id);
    }
  }, [expiresAt]);

  const handleExpiry = (showAlert = true) => {
    console.log("⏰ Expiry triggered", { showAlert });
    if (showAlert) {
      Alert.alert(
        "Time Expired",
        "Your booking has expired. Please try again.",
      );
    }
    clearCart();
    setBooking(null);
    setExpiresAt(null);
    setQueueStatus(null);
    setIsProcessingPayment(false);
    hasInitializedTimer.current = false;
    hasTriedCreation.current = false;
    hasJoinedQueue.current = false;
    queryClient.invalidateQueries({ queryKey: ["pendingBooking"] });
    router.replace("/book");
  };

  // Check for expired pending booking
  useEffect(() => {
    if (pendingBooking && !booking) {
      const now = new Date().getTime();
      const diff = Math.floor(
        (new Date(pendingBooking.expiresAt).getTime() - now) / 1000,
      );

      if (diff <= 0) {
        console.log("⚠️ Frontend detected expired pending, invalidating");
        queryClient.setQueryData(["pendingBooking", categoryId], null);
        handleExpiry(false);
        return;
      }
    }
  }, [pendingBooking, categoryId, booking]);

  const handleConfirm = async () => {
    if (!booking?.id) {
      Alert.alert("Error", "No booking to confirm");
      return;
    }

    if (secondsLeft <= 0) {
      Alert.alert("Time Expired", "Your booking time has expired");
      return;
    }

    setIsProcessingPayment(true);

    try {
      console.log("💳 Creating payment intent for booking:", booking.id);
      
      // 1️⃣ Create PaymentIntent
      const paymentData = await createPaymentIntent(categoryId);
      
      console.log("✅ Payment intent created" ,paymentData);

      if (!paymentData?.paymentIntentClientSecret) {
        throw new Error("Invalid payment intent response");
      }

      const { paymentIntentClientSecret } = paymentData;

      // 2️⃣ Init Payment Sheet
      console.log("🔧 Initializing payment sheet...");
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Concert App",
        
        paymentIntentClientSecret,
        allowsDelayedPaymentMethods: true,
      });

      if (initError) {
        console.error("❌ Payment sheet init error:", initError);
        throw new Error(initError.message || "Failed to initialize payment");
      }

      console.log("✅ Payment sheet initialized");

      // 3️⃣ Present Payment Sheet
      console.log("📱 Presenting payment sheet...");
      const { error: payError } = await presentPaymentSheet();

      if (payError) {
        console.log("⚠️ Payment cancelled or failed:", payError);
        setIsProcessingPayment(false);
        
        // Don't show alert for user cancellation
        if (payError.code !== 'Canceled') {
          Alert.alert("Payment Failed", payError.message || "Payment was not completed");
        }
        return;
      }

      console.log("✅ Payment successful, confirming booking...");

      // 4️⃣ Confirm booking on backend
      confirmMutation.mutate(booking.id);

    } catch (err: any) {
      console.error("❌ Payment error:", err);
      setIsProcessingPayment(false);
      
      const errorMessage = err?.response?.data?.message 
        || err?.message 
        || "Payment failed. Please try again.";
      
      Alert.alert("Payment Failed", errorMessage);
    }
  };

  // MAIN LOGIC: Load existing pending OR create new booking
  useEffect(() => {
    console.log("🔄 Main effect triggered:", {
      concertLoading,
      pendingLoading,
      queueLoading: queueQuery.isLoading,
      hasBooking: !!booking,
      hasPending: !!pendingBooking,
      queueStatus: queueQuery.data?.status,
      hasTriedCreation: hasTriedCreation.current,
    });

    // Wait for all data to load
    if (concertLoading || pendingLoading || !concert || !categoryId) {
      console.log("⏳ Waiting for concert/category data...");
      return;
    }

    // Already have a booking set
    if (booking) {
      console.log("✓ Booking already set:", booking.id);
      return;
    }

    // Already creating
    if (createMutation.isPending) {
      console.log("⏳ Create mutation in progress...");
      return;
    }

    // Already tried to create
    if (hasTriedCreation.current) {
      console.log("✓ Already attempted creation");
      return;
    }

    // Case 1: Existing pending booking
    if (pendingBooking) {
      const now = new Date().getTime();
      let diff = Math.floor(
        (new Date(pendingBooking.expiresAt).getTime() - now) / 1000,
      );

      if (diff <= 0) {
        console.log("❌ Mount: Skipping expired pending");
        queryClient.setQueryData(["pendingBooking", categoryId], null);
        return;
      }

      console.log("✅ Loading existing pending booking:", pendingBooking);
      clearCart();
      useBookingStore
        .getState()
        .addTicket(
          pendingBooking.category.id,
          pendingBooking.category.name,
          pendingBooking.category.price,
          pendingBooking.seats,
        );

      setBooking(pendingBooking);
      setExpiresAt(new Date(pendingBooking.expiresAt));
      setQueueStatus(null);
      hasTriedCreation.current = true;
      return;
    }

    // Case 2: Create new booking - need queue approval
    console.log("🚦 Queue check before creation:", {
      isLoading: queueQuery.isLoading,
      hasData: !!queueQuery.data,
      status: queueQuery.data?.status,
      position: queueQuery.data?.position,
    });

    // Wait for queue data to load
    if (queueQuery.isLoading) {
      console.log("⏳ Queue query still loading...");
      return;
    }

    // No queue data yet - shouldn't happen but handle it
    if (!queueQuery.data) {
      console.log("⚠️ No queue data available, will retry");
      return;
    }

    // Check queue status
    const currentQueueStatus = queueQuery.data;

    if (currentQueueStatus.status === "waiting") {
      console.log(
        `⏳ Waiting in queue... Position: #${currentQueueStatus.position}`,
      );
      return;
    }

    if (currentQueueStatus.status === "none") {
      console.log("⏳ Queue status is 'none', waiting for join...");
      return;
    }

    // ACTIVE → create booking
    if (currentQueueStatus.status === "active") {
      if (tickets.length === 0 || totalSeats === 0) {
        console.log("⚠️ No tickets to create booking with");
        Alert.alert("No Tickets", "Please select tickets first");
        router.back();
        return;
      }

      console.log("✅ Queue slot active, creating booking");
      hasTriedCreation.current = true;
      createMutation.mutate({ categoryId, seats: totalSeats });
    }
  }, [
    concertLoading,
    pendingLoading,
    concert,
    categoryId,
    booking,
    createMutation.isPending,
    pendingBooking,
    tickets.length,
    totalSeats,
    queueQuery.data,
    queueQuery.isLoading,
  ]);

  const mm = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");

  const posterUri = concert?.imageUrl || "https://placeholder.com/100x150";
  const eventTitle = concert?.name || "";
  const venue = concert?.venue || "";

  const datetime = concert
    ? new Date(concert.date).toLocaleString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
    : "";

  const orderAmount = getTotal();
  const bookingFee = Math.max(0, Math.round(orderAmount * 0.0826));
  const grandTotal = orderAmount + bookingFee;

  const ticketsSummary = useMemo(
    () =>
      tickets.map((t) => ({
        id: t.sectionId,
        title: t.name,
        price: t.price,
        qty: t.quantity,
        lineTotal: t.price * t.quantity,
      })),
    [tickets],
  );

  console.log("📊 Review State:", {
    booking: booking?.id,
    pendingBooking: pendingBooking?.id,
    tickets: tickets.length,
    secondsLeft,
    queueStatus: queueStatus?.status,
    queuePosition: queueStatus?.position,
    isProcessingPayment,
  });

  const isLoading =
    createMutation.isPending || concertLoading || pendingLoading;
  const isError = createMutation.isError || !concert || !categoryId;

  // Show queue waiting screen
  const showQueueWaiting =
    !booking &&
    !pendingBooking &&
    queueStatus?.status === "waiting" &&
    !createMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-black">
      {isLoading && !showQueueWaiting ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-2">
            {createMutation.isPending ? "Reserving tickets..." : "Loading..."}
          </Text>
        </View>
      ) : isError ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500">
            Error: {createMutation.error?.message || "No tickets selected"}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 px-6 py-3 bg-gray-700 rounded-lg"
          >
            <Text className="text-white">Go Back</Text>
          </Pressable>
        </View>
      ) : showQueueWaiting ? (
        // Queue waiting screen
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-yellow-900/20 rounded-2xl p-6 items-center border border-yellow-700">
            <Ionicons name="time-outline" size={64} color="#fbbf24" />
            <Text className="text-yellow-300 text-2xl font-bold mt-4">
              High Demand
            </Text>
            <Text className="text-yellow-200 text-center mt-2">
              You're in the queue
            </Text>
            {queueStatus?.position && (
              <View className="mt-4 bg-yellow-900/40 px-6 py-3 rounded-full">
                <Text className="text-yellow-100 text-lg font-semibold">
                  Position: #{queueStatus.position}
                </Text>
              </View>
            )}
            <Text className="text-gray-400 text-center mt-4 text-sm">
              Please wait, we'll notify you when it's your turn
            </Text>
            <ActivityIndicator size="small" color="#fbbf24" className="mt-4" />
          </View>

          <Pressable
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 bg-gray-700 rounded-lg"
          >
            <Text className="text-white">Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Active queue banner */}
          {queueStatus?.status === "active" && !booking && (
            <View className="bg-green-900 px-4 py-3 mb-2">
              <Text className="text-green-300 text-center font-semibold">
                🎉 It's your turn! Complete your booking now
              </Text>
            </View>
          )}

          <View className="px-4 pt-3 pb-2">
            <View className="flex-row items-center">
              <Pressable
                className="p-2 rounded-full"
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </Pressable>

              <View className="ml-3">
                <Text className="text-white text-lg font-semibold">
                  Review your booking
                </Text>
              </View>
            </View>

            {booking && (
              <View className="px-4 mt-3">
                <View className="bg-[#1a1a1a] rounded-full px-4 py-2 items-center justify-center mb-4">
                  <Text className="text-gray-300">
                    Complete your booking in{" "}
                    <Text className="text-green-400 font-semibold">
                      {mm}:{ss}
                    </Text>{" "}
                    mins
                  </Text>
                </View>
              </View>
            )}
          </View>

          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 180 }}
          >
            <View className="flex-row items-start mb-4">
              <Image
                resizeMode="cover"
                className="w-16 h-20 rounded-md mr-3"
                source={{ uri: posterUri }}
              />

              <View className="flex-1">
                <Text className="text-white font-semibold mb-1">
                  {eventTitle}
                </Text>
                <Text className="text-gray-400">{venue}</Text>
              </View>
            </View>

            <View className="bg-[#111] border border-gray-800 rounded-2xl px-4 py-4 mb-5">
              <Text className="text-gray-300 font-semibold mb-3">
                {datetime}
              </Text>

              {ticketsSummary.length === 0 ? (
                <Text className="text-gray-400 mb-3">No tickets selected</Text>
              ) : (
                ticketsSummary.map((t) => (
                  <View key={t.id} className="mb-3">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 pr-3">
                        <Text className="text-white font-semibold">
                          {t.qty} x {t.title}
                        </Text>
                      </View>

                      <View className="items-end">
                        <Text className="text-white font-semibold">
                          ₹ {t.lineTotal.toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mt-3">
                      <View className="w-8 h-8 rounded-md bg-gray-800 p-1 mr-3 items-center justify-center">
                        <Ionicons
                          name="ticket-outline"
                          size={16}
                          color={"#9ca3af"}
                        />
                      </View>
                      <Text className="text-gray-400 text-sm">
                        M-Ticket: Entry using the QR code in your app
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          <View className="absolute bottom-4 left-0 right-0 border-t border-gray-800 p-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-white rounded-md px-2 py-1 mr-3">
                <Ionicons name="wallet-outline" size={18} color={"#111"} />
              </View>

              <View>
                <Text className="text-gray-400 text-xs">Pay Using</Text>
                <Text className="text-white font-semibold">Stripe Payment</Text>
              </View>
            </View>

            <Pressable
              className={`rounded-full flex-row items-center px-6 py-3 ${
                isProcessingPayment || 
                confirmMutation.isPending || 
                secondsLeft <= 0 || 
                !booking
                  ? "bg-gray-600"
                  : "bg-white"
              }`}
              onPress={handleConfirm}
              disabled={
                isProcessingPayment ||
                confirmMutation.isPending || 
                secondsLeft <= 0 || 
                !booking
              }
            >
              <View className="mr-4 items-end">
                <Text
                  className={`text-xs ${
                    isProcessingPayment || 
                    confirmMutation.isPending || 
                    secondsLeft <= 0 || 
                    !booking
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  ₹ {grandTotal.toFixed(1)}
                </Text>
                <Text
                  className={`font-semibold text-sm ${
                    isProcessingPayment || 
                    confirmMutation.isPending || 
                    secondsLeft <= 0 || 
                    !booking
                      ? "text-gray-300"
                      : "text-black"
                  }`}
                >
                  Total
                </Text>
              </View>
              {(isProcessingPayment || confirmMutation.isPending) ? (
                <ActivityIndicator size="small" color="#fff" className="mr-2" />
              ) : null}
              <Text
                className={`font-semibold ${
                  isProcessingPayment || 
                  confirmMutation.isPending || 
                  secondsLeft <= 0 || 
                  !booking
                    ? "text-gray-300"
                    : "text-black"
                }`}
              >
                {confirmMutation.isPending 
                  ? "Confirming..." 
                  : isProcessingPayment 
                  ? "Processing..." 
                  : "Pay now"}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}