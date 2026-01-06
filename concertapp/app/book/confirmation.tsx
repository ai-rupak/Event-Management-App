import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getConfirmedBooking } from "@/api/bookingApi";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

interface ConfirmedBooking {
  id: string;
  seats: number;
  category: {
    id: string;
    name: string;
    price: number;
  };
  concert: {
    id: string;
    name: string;
    venue: string;
    date: string;
    imageUrl: string;
  };
}

export default function ConfirmationScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<ConfirmedBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      console.error("No bookingId provided");
      setError("No booking ID found");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        console.log("Fetching confirmed booking:", bookingId);
        const data = await getConfirmedBooking(bookingId);
        console.log("Confirmed booking data:", data);
        setBooking(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch confirmed booking", err);
        setError(err?.message || "Failed to load booking");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-4">Loading booking details...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !booking) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center px-6">
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text className="text-white text-xl font-bold mt-4 text-center">
          Unable to Load Booking
        </Text>
        <Text className="text-gray-400 text-center mt-2">
          {error || "Booking not found"}
        </Text>
        <Pressable
          onPress={() => router.replace("/(tabs)")}
          className="mt-6 bg-white rounded-full px-8 py-3"
        >
          <Text className="text-black font-semibold">Go to Home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Destructure safely after null check
  const { concert, category, seats } = booking;
  const total = seats * category.price;
  const formattedDate = new Date(concert.date).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center justify-between">
          <Pressable
            className="p-2 rounded-full"
            onPress={() => router.replace("/(tabs)")}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">
            Booking Confirmed
          </Text>
          <View className="w-8" />
        </View>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Success Banner */}
        <View className="bg-green-600 rounded-2xl px-6 py-4 items-center mb-6">
          <Ionicons name="checkmark-circle" size={48} color="white" />
          <Text className="text-white text-xl font-semibold mt-2">
            Tickets Secured
          </Text>
          <Text className="text-green-100 text-center mt-1">
            Your booking is confirmed. Check your email for details.
          </Text>
        </View>

        {/* Concert Details Card */}
        <View className="bg-[#111] rounded-2xl px-4 py-4 mb-6 overflow-hidden">
          <Image
            source={{ uri: concert.imageUrl || "https://via.placeholder.com/400x200" }}
            className="w-full h-48 rounded-xl mb-4"
            resizeMode="cover"
          />
          <Text className="text-white text-xl font-bold mb-2">
            {concert.name}
          </Text>
          <View className="flex-row items-center mb-1">
            <Ionicons name="location" size={16} color="#9ca3af" />
            <Text className="text-gray-300 ml-2">{concert.venue}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="calendar" size={16} color="#9ca3af" />
            <Text className="text-gray-300 ml-2">{formattedDate}</Text>
          </View>
        </View>

        {/* Ticket Details Card */}
        <View className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl px-6 py-6 mb-6 items-center">
          <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mb-3">
            <Ionicons name="ticket" size={24} color="white" />
          </View>
          <Text className="text-white text-lg font-bold mb-1">
            {seats} x {category.name.toUpperCase()}
          </Text>
          <Text className="text-white/80 mb-4">
            ₹{category.price.toLocaleString()} each
          </Text>

          <View className="bg-white/10 rounded-lg px-4 py-3 w-full">
            <Text className="text-white/60 text-xs mb-1 text-center">Booking ID</Text>
            <Text className="text-white text-sm font-medium text-center">
              {booking.id.slice(-8).toUpperCase()}
            </Text>
          </View>

          <View className="bg-white/10 rounded-lg px-4 py-3 w-full mt-3">
            <Text className="text-white/60 text-xs mb-1 text-center">Total Paid</Text>
            <Text className="text-white text-xl font-bold text-center">
              ₹{total.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* What's Next Section */}
        <View className="bg-[#111] rounded-2xl px-4 py-4 mb-4">
          <Text className="text-white font-semibold mb-4 text-lg">What's Next?</Text>
          
          {/* Step 1: Email Confirmation */}
          <View className="flex-row items-start mb-4">
            <View className="w-8 h-8 bg-green-500/20 rounded-full items-center justify-center mr-3 mt-1">
              <Ionicons name="mail" size={16} color="#22c55e" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium mb-1">
                Check your email
              </Text>
              <Text className="text-gray-400 text-sm">
                Confirmation and tickets sent to your registered email
              </Text>
            </View>
          </View>

          {/* Step 2: Download Tickets */}
          <View className="flex-row items-start mb-4">
            <View className="w-8 h-8 bg-blue-500/20 rounded-full items-center justify-center mr-3 mt-1">
              <Ionicons name="download" size={16} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium mb-1">
                Download tickets
              </Text>
              <Text className="text-gray-400 text-sm">
                Add tickets to your digital wallet for easy access
              </Text>
            </View>
          </View>

          {/* Step 3: Arrival Info */}
          <View className="flex-row items-start">
            <View className="w-8 h-8 bg-purple-500/20 rounded-full items-center justify-center mr-3 mt-1">
              <Ionicons name="time" size={16} color="#a855f7" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium mb-1">
                Arrive early
              </Text>
              <Text className="text-gray-400 text-sm">
                Get there 30-60 minutes early to avoid queues
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="space-y-3">
          <Pressable
            onPress={() => router.push("/profile")}
            className="bg-white rounded-xl py-4 items-center"
          >
            <Text className="text-black font-semibold">View My Tickets</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(tabs)")}
            className="bg-gray-800 rounded-xl py-4 items-center"
          >
            <Text className="text-white font-semibold">Back to Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}