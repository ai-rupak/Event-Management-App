import { cancelPendingBooking, getPendingBooking } from "@/api/bookingApi";
import { getConcert } from "@/api/concertApi";
import { useBookingStore } from "@/stores/bookingStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TicketScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const [pendingSecondsLeft, setPendingSecondsLeft] = useState(0);
  const [showModal, setShowModal] = useState(false);
  
  // Track if we've already synced the pending booking to cart
  const hasSyncedPending = useRef(false);
  
  const {
    data: concert,
    isLoading: concertLoading,
    error: concertError,
  } = useQuery({
    queryKey: ["concert"],
    queryFn: getConcert,
  });

  const { 
    data: pendingBooking, 
    isLoading: pendingLoading,
    isFetched: pendingFetched 
  } = useQuery({
    queryKey: ["pendingBooking", categoryId],
    queryFn: () => getPendingBooking(categoryId as string),
    enabled: !!categoryId,
    retry: false,
  });

  const categoryData = concert?.categories?.find(
    (cat: { id: string }) => cat.id == categoryId
  );

  const cancelMutation = useMutation({
    mutationFn: () => cancelPendingBooking(categoryId as string),
    onSuccess: () => {
      // Clear the cart
      clearCart();
      
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ["pendingBooking", categoryId],
      });
      queryClient.invalidateQueries({
        queryKey: ["concert"],
      });
      
      // Reset state
      setShowModal(false);
      hasSyncedPending.current = false;
      setPendingSecondsLeft(0);
      
      Alert.alert("Success", "Session deleted. You can start a new booking.");
    },
    onError: (err: any) => {
      Alert.alert("Error", "Failed to cancel session: " + (err?.message || "Unknown error"));
    },
  });

  const tickets = useBookingStore((s) => s.tickets);
  const addTicket = useBookingStore((s) => s.addTicket);
  const removeTicket = useBookingStore((s) => s.removeTicket);
  const updateQuantity = useBookingStore((s) => s.updateQuantity);
  const getTotal = useBookingStore((s) => s.getTotal);
  const clearCart = useBookingStore((s) => s.clearCart);

  const myTicket = tickets?.find((t) => t.sectionId === categoryId);
  const quantity = myTicket?.quantity ?? 0;
  const totalTickets = tickets?.reduce((acc, t) => acc + t.quantity, 0);
  const totalPrice = getTotal();
  const { name: title, price } = categoryData || {};

  const isActiveSession = pendingBooking && pendingSecondsLeft > 0;

  const formattedDate = concert?.date
    ? new Date(concert.date).toLocaleString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "";

  const formattedTime = concert?.date
    ? new Date(concert.date)
        .toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        })
        .toUpperCase()
    : "";

  // Timer effect - manages countdown
  useEffect(() => {
    if (pendingBooking?.expiresAt) {
      const now = new Date().getTime();
      let diff = Math.floor(
        (new Date(pendingBooking.expiresAt).getTime() - now) / 1000
      );

      console.log("Tickets: Pending diff on fetch:", diff);

      if (diff <= 0) {
        console.log("Tickets: Session expired on client");
        setPendingSecondsLeft(0);
        queryClient.setQueryData(["pendingBooking", categoryId], null);
        return;
      }

      setPendingSecondsLeft(diff);

      const id = setInterval(() => {
        const updatedDiff = Math.floor(
          (new Date(pendingBooking.expiresAt).getTime() - Date.now()) / 1000
        );

        if (updatedDiff <= 0) {
          clearInterval(id);
          setPendingSecondsLeft(0);
          queryClient.invalidateQueries({
            queryKey: ["pendingBooking", categoryId],
          });
        } else {
          setPendingSecondsLeft(updatedDiff);
        }
      }, 1000);

      return () => clearInterval(id);
    } else {
      setPendingSecondsLeft(0);
    }
  }, [pendingBooking, categoryId, queryClient]);

  // Sync pending booking to cart ONCE when data is available
  useEffect(() => {
    if (
      pendingBooking && 
      pendingBooking.category.id === categoryId && 
      !hasSyncedPending.current &&
      pendingFetched
    ) {
      console.log("Syncing pending booking to cart:", pendingBooking.seats);
      clearCart();
      const { category, seats } = pendingBooking;
      addTicket(category.id, category.name, category.price, seats);
      hasSyncedPending.current = true;
      
      // Check if timer is still valid
      const now = new Date().getTime();
      const diff = Math.floor(
        (new Date(pendingBooking.expiresAt).getTime() - now) / 1000
      );
      
      // Only show modal if session is still valid
      if (diff > 0) {
        setShowModal(true);
      }
    }
  }, [pendingBooking, categoryId, addTicket, clearCart, pendingFetched]);

  // Auto-hide modal when timer expires
  useEffect(() => {
    if (showModal && pendingSecondsLeft <= 0) {
      setShowModal(false);
      hasSyncedPending.current = false;
    }
  }, [pendingSecondsLeft, showModal]);

  const handleAdd = () => {
    if (isActiveSession) {
      Alert.alert(
        "Session Active", 
        "You cannot modify tickets while a booking session is active. Please complete or cancel your current booking."
      );
      return;
    }
    if (!myTicket) {
      addTicket(categoryId as string, title, price, 1);
    } else {
      updateQuantity(categoryId as string, myTicket.quantity + 1);
    }
  };

  const handleRemove = () => {
    if (isActiveSession) {
      Alert.alert(
        "Session Active", 
        "You cannot modify tickets while a booking session is active. Please complete or cancel your current booking."
      );
      return;
    }
    if (!myTicket) return;
    const newQty = myTicket.quantity - 1;
    if (newQty <= 0) {
      removeTicket(categoryId as string);
    } else {
      updateQuantity(categoryId as string, newQty);
    }
  };

  const handleContinue = () => {
    if (isActiveSession) {
      // Close modal and navigate
      setShowModal(false);
      router.push("/book/review");
      return;
    }
    
    if (totalTickets === 0) {
      Alert.alert("No Tickets", "Please add at least one ticket to continue.");
      return;
    }
    
    router.push("/book/review");
  };

  // Loading states
  if (concertLoading || (pendingLoading && !pendingFetched)) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size={"large"} color={"#fff"} />
        <Text className="text-white mt-2">
          {concertLoading ? "Loading Concert..." : "Checking Session..."}
        </Text>
      </SafeAreaView>
    );
  }

  // Error states
  if (concertError || !concert || !categoryId || !categoryData) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-red-500 text-center px-4 mb-4">
          {concertError?.message || "Category not found"}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="px-6 py-3 bg-gray-700 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const pendingMm = String(Math.floor(pendingSecondsLeft / 60)).padStart(2, "0");
  const pendingSs = String(pendingSecondsLeft % 60).padStart(2, "0");

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center">
          <Pressable
            className="p-2 rounded-full"
            onPress={() => router.back()}
            android_ripple={{ color: "#333" }}
          >
            <Ionicons name="arrow-back" size={22} color={"white"} />
          </Pressable>

          <View className="ml-3 flex-1">
            <Text className="text-white text-lg font-semibold">
              {concert?.name}
            </Text>
            <Text className="text-gray-400 text-sm mt-1 numberOfLines={1}">
              {formattedDate} | {formattedTime} | {concert?.venue?.split(",")[0]}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <Text className="text-white text-xl font-bold mb-5">
          Choose Tickets
        </Text>

        <View className="bg-[#111] border border-gray-800 rounded-2xl px-4 py-5 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white font-semibold text-base">
              {title?.toUpperCase()}
            </Text>

            {quantity === 0 ? (
              <Pressable
                onPress={handleAdd}
                disabled={isActiveSession}
                className={`w-28 py-2 border rounded-lg items-center justify-center ${
                  isActiveSession
                    ? "border-red-500 bg-red-900/30"
                    : "border-gray-300 bg-gray-800"
                }`}
              >
                <Text
                  className={`font-medium text-sm ${
                    isActiveSession ? "text-red-400" : "text-white"
                  }`}
                >
                  {isActiveSession ? "Locked" : "Add Ticket"}
                </Text>
              </Pressable>
            ) : (
              <View className="w-28 py-2 rounded-lg bg-white flex-row items-center justify-between px-3">
                <Pressable
                  onPress={handleRemove}
                  disabled={isActiveSession}
                  className={`p-1 rounded ${isActiveSession ? "opacity-30" : ""}`}
                >
                  <Text
                    className={`text-lg font-bold ${
                      isActiveSession ? "text-gray-400" : "text-black"
                    }`}
                  >
                    -
                  </Text>
                </Pressable>

                <Text className="text-black font-semibold text-base">
                  {quantity}
                </Text>

                <Pressable
                  onPress={handleAdd}
                  disabled={isActiveSession}
                  className={`p-1 rounded ${isActiveSession ? "opacity-30" : ""}`}
                >
                  <Text
                    className={`text-lg font-bold ${
                      isActiveSession ? "text-gray-400" : "text-black"
                    }`}
                  >
                    +
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
          <Text className="text-gray-300 text-base mb-3">
            ₹ {price?.toLocaleString()} each
          </Text>

          <View className="space-y-1 mt-2">
            <Text className="text-gray-400 text-sm">
              • Each ticket grants entry to one individual in the {title} zone.
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              • This is a standing section.
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              • Seats will be allocated on a first-come, first-serve basis.
            </Text>
          </View>
        </View>

        {isActiveSession && (
          <View className="bg-orange-900/20 border border-orange-500/50 rounded-xl px-4 py-3 mb-4">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={20} color="#fb923c" />
              <Text className="text-orange-400 font-semibold ml-2">
                Session Active: {pendingMm}:{pendingSs}
              </Text>
            </View>
            <Text className="text-orange-300/80 text-sm mt-2">
              Your tickets are reserved. Complete payment before time runs out.
            </Text>
          </View>
        )}

        <View className="bg-[#111] border border-gray-800 rounded-2xl px-4 py-4 mb-4">
          <Text className="text-white font-semibold mb-2">Order Summary</Text>
          <Text className="text-gray-400 text-sm">
            {totalTickets} ticket{totalTickets !== 1 ? "s" : ""} • ₹{" "}
            {totalPrice.toLocaleString()}
          </Text>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4 flex-row items-center justify-between">
        <View>
          <Text className="text-gray-400 text-sm">
            {totalTickets} ticket{totalTickets !== 1 ? "s" : ""}{" "}
          </Text>
          <Text className="text-white text-lg font-semibold">
            ₹ {totalPrice.toLocaleString()}
          </Text>
        </View>

        <Pressable
          onPress={handleContinue}
          disabled={totalTickets === 0 && !isActiveSession}
          className={`px-6 py-3 rounded-full ${
            totalTickets === 0 && !isActiveSession
              ? "bg-gray-700"
              : "bg-white"
          }`}
        >
          <Text
            className={`font-semibold ${
              totalTickets === 0 && !isActiveSession
                ? "text-gray-400"
                : "text-black"
            }`}
          >
            {isActiveSession
              ? "Continue Payment"
              : totalTickets > 0
                ? "Continue"
                : "Select Tickets"}
          </Text>
        </Pressable>
      </View>

      <Modal 
        visible={showModal} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <View className="bg-white rounded-2xl p-6 w-[85%] max-w-md">
            <View className="flex-row items-center mb-3">
              <Ionicons name="alert-circle" size={28} color="#3b82f6" />
              <Text className="text-black text-xl font-bold ml-3">
                Active Session
              </Text>
            </View>
            
            <Text className="text-gray-700 mb-2 leading-6">
              You have an ongoing booking for:
            </Text>
            
            <View className="bg-blue-50 rounded-lg p-3 mb-4">
              <Text className="text-blue-900 font-semibold">
                {pendingBooking?.seats}x {pendingBooking?.category.name} tickets
              </Text>
              <Text className="text-blue-700 text-sm mt-1">
                Time remaining: {pendingMm}:{pendingSs}
              </Text>
            </View>
            
            <Text className="text-gray-600 text-sm mb-5">
              Complete payment now to secure your tickets, or delete this session to start over.
            </Text>

            <View className="flex-row gap-3">
              <Pressable
                disabled={cancelMutation.isPending}
                onPress={() => cancelMutation.mutate()}
                className={`flex-1 ${cancelMutation.isPending ? 'bg-gray-200' : 'bg-red-50'} px-4 py-3 rounded-xl border border-red-200`}
              >
                <Text className="text-red-600 font-semibold text-center">
                  {cancelMutation.isPending ? "Deleting..." : "Delete Session"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleContinue}
                className="flex-1 bg-blue-500 px-4 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold text-center">
                  Continue
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}