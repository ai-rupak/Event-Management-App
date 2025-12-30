import { cancelPendingBooking, getPendingBooking } from "@/api/bookingApi";
import { getConcert } from "@/api/concertApi";
import { useBookingStore } from "@/stores/bookingStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
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
  const queryClient = new QueryClient();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const [pendingSecondsLeft, setPendingSecondsLeft] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const {
    data: concert,
    isLoading: concertLoading,
    error: concertError,
  } = useQuery({
    queryKey: ["concert"],
    queryFn: getConcert,
  });

  const { data: pendingBooking, isLoading: pendingLoading } = useQuery({
    queryKey: ["pendingBooking", categoryId],
    queryFn: () => getPendingBooking(categoryId as string),
    enabled: !!categoryId,
  });

  const formattedDate = new Date(concert.date).toLocaleString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const formattedTime = new Date(concert.date)
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
    .toUpperCase();

  const categoryData = concert?.categories?.find(
    (cat: { id: string }) => cat.id == categoryId
  );


  const cancelMutation = useMutation({
  mutationFn: () => cancelPendingBooking(categoryId as string),
  onSuccess : () => {
    queryClient.invalidateQueries({
      queryKey: ["pendingBooking", categoryId]
    });
    setShowModal(false);
    hasShownModal.current = false;
    Alert.alert("Canceled", "session deleted you can start a new bookinh")
  },
  onError: (err: any) => {
    Alert.alert("Error", "Failed to cancel session" + err.message)
  }
})

  if (!categoryData) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-white">Category not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-white">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (pendingLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size={"large"} color={"#fff"} />
        <Text className="text-white mt-2">Checking Session...</Text>
      </SafeAreaView>
    );
  }

  if (concertLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size={"large"} color={"#fff"} />
        <Text className="text-white mt-2">Loading Concert ...</Text>
      </SafeAreaView>
    );
  }

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
  const { name: title, price } = categoryData;

  const isActiveSession = pendingBooking && pendingSecondsLeft > 0;

  const hasShownModal = useRef(false);

  useEffect(() => {
    if (pendingBooking) {
      const now = new Date().getTime();
      let diff = Math.floor(
        (new Date(pendingBooking.expiresAt).getTime() - now) / 1000
      );

      console.log("Tickets: Pending diff on fetch:", diff);

      if (diff <= 0) {
        console.log("Tickets: Frontend expiry on fetch, invalidate");
        queryClient.setQueryData(["pendingBooking", categoryId], null);
        setPendingSecondsLeft(0);
        return;
      }

      setPendingSecondsLeft(diff);

      const id = setInterval(() => {
        const updatedDiff = Math.floor(
          (new Date(pendingBooking.expiresAt).getTime() - Date.now()) / 1000
        );

        setPendingSecondsLeft(Math.max(0, updatedDiff));

        if (updatedDiff <= 0) {
          clearInterval(id);
          queryClient.invalidateQueries({
            queryKey: ["pendingBooking", categoryId],
          }); // Refetch to confirm null
        }
      }, 1000);

      return () => clearInterval(id);
    } else {
      setPendingSecondsLeft(0);
    }
  }, [pendingBooking, categoryId]);

  useEffect(() => {
  if (pendingBooking && categoryId === pendingBooking.category.id) {
    clearCart();
    const { category, seats } = pendingBooking;
    addTicket(category.id, category.name, category.price, seats);
  }
}, [pendingBooking, categoryId, addTicket, clearCart]);

  useEffect(() => {
  const isActiveSession = pendingBooking && pendingSecondsLeft > 0;
  if (
    isActiveSession &&
    !pendingLoading &&
    !concertLoading &&
    !hasShownModal.current
  ) {
    hasShownModal.current = true;
    setShowModal(true);
  }
}, [pendingBooking, pendingLoading, concertLoading, pendingSecondsLeft]);

  useEffect(()=>{
    if(showModal && pendingSecondsLeft <=0){
      setShowModal(false);
    }
  },[pendingSecondsLeft, showModal]);

  const handleAdd = () => {
    if (isActiveSession) return;
    if (!myTicket) {
      addTicket(categoryId as string, title, price, 1);
    } else {
      updateQuantity(categoryId as string, myTicket.quantity + 1);
    }
  };

  const handleRemove = () => {
    if (isActiveSession) return;
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
      queryClient.invalidateQueries({
        queryKey: ["pendingBooking", categoryId],
      });
      router.replace("/book/review");
    }
    if (totalTickets == 0) {
      Alert.alert("No Tickets", "Please add at least one ticket");
      return;
    }
    router.push("/book/review");
  };

  console.log("Tickets:",pendingBooking);
  const pendingMm = String(Math.floor(pendingSecondsLeft / 60)).padStart(2, '0');
  const pendingSs = String(pendingSecondsLeft % 60).padStart(2, '0');

  if (concertError || !concert || !categoryId) {
  return (
    <SafeAreaView className="flex-1 bg-black justify-center items-center">
      <Text className="text-red-500">
        Error loading data: {concertError?.message || "No category"}
      </Text>
      <Pressable
        onPress={() => router.back()}
        className="mt-4 p-3 bg-gray-700 rounded"
      >
        <Text className="text-white">Go Back</Text>
      </Pressable>
    </SafeAreaView>
  );
}
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
            <Text className="text-gray-400 text-sm mt-1">
              {formattedDate} | {formattedTime} onwards | {concert?.venue}
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
              {title.toUpperCase()}
            </Text>

            {quantity == 0 ? (
              <Pressable
                onPress={handleAdd}
                className={`w-28 py-2 border rounded-lg items-center justify-center ${isActiveSession ? "border-red-500 bg-red-100" : "border-gray-300 bg-gray-800"}`}
              >
                <Text
                  className={`font-medium ${isActiveSession ? "text-red-600" : "text-white"}`}
                >
                  {isActiveSession ? "Session Active" : "Add Ticket"}
                </Text>
              </Pressable>
            ) : (
              <View className="w-28 py-2 rounded-lg bg-white flex-row items-center justify-between px-3">
                <Pressable
                  onPress={handleRemove}
                  className={`p-1 rounded ${isActiveSession ? "opacity-50" : ""}`}
                >
                  <Text
                    className={`text-lg font-bold ${isActiveSession ? "text-gray-400" : "text-black"}`}
                  >
                    -
                  </Text>
                </Pressable>

                <Text className="text-black font-semibold text-base">
                  {quantity}
                </Text>

                <Pressable
                  className={`p-1 rounded ${isActiveSession ? "opacity-50" : ""}`}
                  onPress={handleAdd}
                >
                  <Text
                    className={`text-lg font-bold ${isActiveSession ? "text-gray-400" : "text-black"}`}
                  >
                    +
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
          <Text className="text-gray-300 text-base mb-3">
            ₹ {price.toLocaleString()} each
          </Text>

          <View className="space-y-1 mt-2">
            <Text className="text-gray-400 text-sm">
              • Each ticket grants entry to one individual in the {title} zone.
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              • This is a standing section.
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              • Seats will be allocated on a first-come , first-serve basis.
            </Text>
          </View>
        </View>
        <View className="bg-[#111] border border-gray-800 rounded-2xl px-4 py-4 mb-4">
          <Text className="text-white font-semibold mb-2">Order Summary</Text>
          <Text className="text-gray-400 text-sm">
            {totalTickets} ticket{totalTickets !== 1 ? "s" : ""} • ₹ {""}
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
            ₹ {""}
            {totalPrice.toLocaleString()}
          </Text>
        </View>

        <Pressable
          onPress={handleContinue}
          disabled={(totalTickets === 0 && !isActiveSession) || pendingLoading}
          className={`px-6 py-3 rounded-full ${
            (totalTickets === 0 && !isActiveSession) || pendingLoading
              ? "bg-gray-700"
              : "bg-white"
          }`}
        >
          <Text
            className={`font-semibold ${
              (totalTickets === 0 && !isActiveSession) || pendingLoading
                ? "text-gray-300"
                : "text-black"
            }`}
          >
            {isActiveSession
              ? "Continue Session"
              : totalTickets > 0
                ? "Continue"
                : "Select Tickets"}
          </Text>
        </Pressable>
      </View>

      <Modal visible={showModal} transparent={true} animationType="fade">
        <Pressable className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-2xl p-6 w-4/5">
            <Text className="text-black text-lg font-bold mb-2">
              Active Session Detected
            </Text>
            <Text className="text-black mb-4">
              You have an active booking for {pendingBooking?.seats} x{" "}
              {pendingBooking?.category.name} tickets ({pendingMm}:{pendingSs}{" "}
              left).
              <Text className="font-semibold">
                {" "}
                Complete payment to secure them.
              </Text>
            </Text>

            <View className="flex-row justify-between gap-2">
                <Pressable
                disabled={cancelMutation.isPending}
                onPress={()=>{
                  setShowModal(false);
                  cancelMutation.mutate();
                }}
                className="flex-1 bg-red-100 px-4 py-3 rounded-lg items-center">
                  <Text className="text-red-600 font-semibold">{cancelMutation?.isPending ? "Deleting" : "Delete Session"}</Text>
                </Pressable>

                <Pressable
                onPress={handleContinue}
                className="flex-1 bg-blue-500 px-4 py-3 rounded-lg items-center">
                  <Text className="text-white font-semibold">Continue Booking</Text>
                </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
