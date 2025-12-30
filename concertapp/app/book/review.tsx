import { View, Text, Alert, ActivityIndicator, Pressable, ScrollView, Image } from "react-native";
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
  position: number;
  status: string;
  timeSlot?: Date;
  highDemand: boolean;
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

  const hasInitializedTimer = useRef(false);

  const tickets = useBookingStore((s) => s.tickets);
  const removeTicket = useBookingStore((s) => s.removeTicket);
  const updateQuantity = useBookingStore((s) => s.updateQuantity);
  const getTotal = useBookingStore((s) => s.getTotal);
  const clearCart = useBookingStore((s) => s.clearCart);

  const categoryId = tickets[0]?.sectionId;

  const totalSeats = tickets.reduce((sum, t) => sum + t.quantity, 0);

  const { data: pendingBooking, isLoading: pendingLoading } = useQuery({
    queryKey: ["pendingBooking", categoryId],
    queryFn: () => getPendingBooking(categoryId as string),
    enabled: !!categoryId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => createBooking(data),
    onSuccess: (data: Booking) => {
      setBooking(data);
      setExpiresAt(new Date(data.expiresAt));
      setQueueStatus(null);
      queryClient.invalidateQueries({
        queryKey: ["pendingBooking", categoryId],
      });
    },
    onError: (err: any) => {
      console.error("Create booking error",err.response?.data || err.message);
      Alert.alert("Error", "Failed to reserve the tickets" + (err?.message || ""));
      router.back();
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (bookingId:string) => confirmBooking(bookingId),
    onSuccess: (data, bookingId) => {
      clearCart();
      queryClient.invalidateQueries({
        queryKey: ["pendingBooking", categoryId],
      });
      router.replace(`/book/confirmation?bookingId=${bookingId}`);
    },
    onError: (err: any) => {
      Alert.alert("Error", "Failed to confirm", err?.message);
    },
  });

    if (createMutation.isPending || concertLoading || pendingLoading) {
      return (
        <SafeAreaView className="flex-1 bg-black justify-center items-center">
          <ActivityIndicator size={"large"} color={"#fff"} />
        </SafeAreaView>
      );
    }

    if (createMutation.isError || !concert || !categoryId) {
      return (
        <SafeAreaView className="flex-1 bg-black justify-center items-center">
          <Text className="text-red-500">
            Error:
            {createMutation.error?.message || "No tickets selected"}
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text className="text-white">Go Back</Text>
          </Pressable>
        </SafeAreaView>
      );
    }


  useEffect(()=>{
    if(expiresAt){
      const now = new Date().getTime();
      let diff = Math.floor(
        (new Date(pendingBooking.expiresAt).getTime() - now) /1000
      );

      console.log("Timer init diff from backend" , diff);
      if(diff <=-30){
        handleExpiry(false);
        return;
      }else if(diff<=0){
        handleExpiry(false);
        return;
      }

      hasInitializedTimer.current = true;
      setSecondsLeft(Math.max(0,diff));

      const id = setInterval(()=>{
        const updateDiff = Math.floor(
          (expiresAt.getTime() - Date.now())/1000
        );

        if(updateDiff <=0){
          clearInterval(id);
          handleExpiry();
        }
      }, 1000);

      return ()=> clearInterval(id);
    }
  }, [expiresAt]);

  const handleExpiry = (showAlert = true) => {
  if (hasInitializedTimer.current || showAlert) {
    console.log("Expiry triggered", { showAlert });
    if (showAlert) {
      Alert.alert(
        "Time expired",
        "We have released the tickets you have chosen, please book again"
      );
    }
    clearCart();
    setBooking(null);
    setExpiresAt(null);
    setQueueStatus(null);
    queryClient.invalidateQueries({ queryKey: ["pendingBooking"] });
    router.replace("/book");
  }
};

  useEffect(() => {
    if (pendingBooking && expiresAt) {
      const now = new Date().getTime();
      const diff = Math.floor(
        (new Date(pendingBooking.expiresAt).getTime() - now) / 1000
      );

      if (diff <= 0) {
        console.log("Frontend detected expired pending (skew?), invalidating");
        queryClient.setQueryData(["pendingBooking", categoryId], null); // Force null
        handleExpiry(false);
        return;
      }
    }
  }, [pendingBooking, categoryId]);

 const handleConfirm = () =>{
  if(!booking?.id){
    Alert.alert("Error","No booking to confirm");
    return;
  }
  confirmMutation.mutate(booking.id);

 };

  useEffect(() => {
    if (
      !concertLoading &&
      concert &&
      !booking &&
      !createMutation.isPending &&
      !pendingLoading &&
      categoryId
    ) {
      console.log(
        "Review mount: checking pending for category",
        categoryId,
        pendingBooking
      );
      if (pendingBooking) {
        const now = new Date().getTime();
        let diff = Math.floor(
          (new Date(pendingBooking.expiresAt).getTime() - now) / 1000
        );

        if (diff <= 0) {
          console.log("Mount: Skipping expired pending");
          queryClient.setQueryData(["pendingBooking", categoryId], null);
          handleExpiry(false);
          return;
        }

        console.log("Loading existing pending for categories", pendingBooking);
        clearCart();
        useBookingStore
          .getState()
          .addTicket(
            pendingBooking.category.id,
            pendingBooking.category.name,
            pendingBooking.category.price,
            pendingBooking.seats
          );

        setBooking(pendingBooking);
        setExpiresAt(new Date(pendingBooking.expiresAt));
        setQueueStatus(null);
      } else if (tickets.length < 0) {
        createMutation.mutate({ categoryId, seats: totalSeats });
      } else {
        // router.back();
      }
    }
  }, [
    concertLoading,
    concert?.id,
    categoryId,
    booking,
    createMutation.isPending,
    pendingLoading,
    pendingBooking,
    totalSeats,
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
  const bookingFee = Math.max(0,Math.round(orderAmount * 0.0826));
  const grandTotal = orderAmount + bookingFee;

  const ticketsSummary = useMemo(()=> tickets.map((t)=>({
    id: t.sectionId,
    title:t.name,
    price:t.price,
    qty:t.quantity,
    lineTotal:t.price * t.quantity
  })),[tickets]);

//   function handlePayNow(){
//     if(ticketsSummary.length ==0 || !booking){ 
//       Alert.alert("No Tickets","Please select tickets to proceed");
//       return;
//     }
//     confirmMutation.mutate(booking?.id);
// }
console.log("tickets",booking)
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center">
          <Pressable className="p-2 rounded-full" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>

          <View className="ml-3">
            <Text className="text-white text-lg font-semibold">
              Review your booking
            </Text>
          </View>
        </View>

        <View className="px-4">
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
      </View>

    
      <ScrollView className="px-4"
      contentContainerStyle={{paddingBottom:180}}>
        <View className="flex-row items-start mb-4">
            <Image 
            resizeMode="cover"
            className="w-16 h-20 rounded-md mr-3"
            source={{uri:posterUri}}
            />

            <View className="flex-1">
                <Text className="text-white font-semibold mb-1">
                    {eventTitle}
                </Text>
                <Text className="text-gray-400">{venue}</Text>
            </View>
        </View>

        <View className="bg-[#111] border border-gray-800 rounded-2xl px-4 py-4 mb-5 ">
            <Text className="text-gray-300 font-semibold mb-3">{datetime}</Text>

            {ticketsSummary.length == 0 ? (
                <Text className="text-gray-400 mb-3">No tickets selected</Text>
            ):(ticketsSummary.map((t)=>(
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
                            <Pressable className="mt-2">
                                <Text className="text-gray-400 underline">Remove</Text>
                            </Pressable>
                        </View>
                    </View>

                    <View className="flex-row items-center mt-3">
                        <View className="w-8 h-8 rounded-md bg-gray-800 p-1 mr-3 items-center justify-center">
                            <Ionicons name="ticket-outline" size={16} color={"#9ca3af"} />
                        </View>
                        <Text className="text-gray-400 text-sm">M-Ticket: Entry using the QR code in your app</Text>
                    </View>
                </View>
            )))
            }
        </View>
      </ScrollView>

      <View className="absolute bottom-4 left-0 right-0 border-t border-gray-800 p-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
            <View className="bg-white rounded-md px-2 py-1 mr-3">
                <Ionicons name="wallet-outline" size={18} color={"#111"} />
            </View>

            <View>
                <Text className="text-gray-400 text-xs">Pay Using</Text>
                <Text className="text-white font-semibold">Google Pay UPI</Text>
            </View>
        </View>

        <Pressable className="bg-white rounded-full flex-row items-center px-6 py-3"
        onPress={handleConfirm}
        disabled={confirmMutation.isPending || secondsLeft <=0 || !booking}
        >
            <View className="mr-4 items-end">
                <Text className="text-gray-500 text-xs">
                    ₹ {grandTotal.toFixed(1)}
                </Text>
                <Text className="text-black font-semibold text-sm">Total</Text>
            </View>
            {confirmMutation.isPending ? (
                <ActivityIndicator size="small" color="#000" className="mr-2" />
            ):null}
            <Text className="text-black font-semibold">{confirmMutation.isPending? "Confirming...":"Pay now"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
