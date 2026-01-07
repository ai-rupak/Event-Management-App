import {
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  Text,
  View,
  RefreshControl,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getUserBookings } from "@/api/bookingApi";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";


interface Booking {
  id: string;
  seats: number;
  concertId: string;
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

interface AggregatedBooking {
  concertId: string;
  totalSeats: number;
  categories: Array<{
    id: string;
    name: string;
    price: number;
    seats: number;
  }>;
  concert: Booking["concert"];
}

const EventDetails = () => {
  const router = useRouter();

  const {
    data: rawBookings,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["userBookings"],
    queryFn: getUserBookings,
  });

  const bookings: AggregatedBooking[] = React.useMemo(() => {
    if (!rawBookings) return [];
    const reduced = rawBookings.reduce(
      (acc: { [key: string]: AggregatedBooking }, booking: Booking) => {
        const concertId = booking.concertId;
        if (!acc[concertId]) {
          acc[concertId] = {
            concertId,
            totalSeats: booking.seats,
            categories: [{ ...booking.category, seats: booking.seats }],
            concert: booking.concert,
          };
        } else {
          acc[concertId].totalSeats += booking.seats;
          acc[concertId].categories.push({
            ...booking.category,
            seats: booking.seats,
          });
        }
        return acc;
      },
      {}
    );
    return Object.values(reduced);
  }, [rawBookings]);

  const renderBookingCard = ({ item }: { item: AggregatedBooking }) => {
    const eventDate = new Date(item?.concert.date);
    const now = new Date();
    const isUpcoming = eventDate > now;

    const formattedDate = eventDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const formattedTime = eventDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return (
      <Pressable
        onPress={() => {
          router.push({
            pathname: "/ticket-details",
            params: { concertId: item.concertId },
          });
        }}
        className="bg-[#111] rounded-2xl overflow-hidden mb-4 border border-gray-800/50 active:opacity-80"
      >
        <View className="flex-row">
          {/* Event Image */}
          <View className="relative">
            <Image
              className="w-28 h-full"
              source={{ uri: item?.concert.imageUrl }}
              resizeMode="cover"
            />
            {/* Gradient Overlay */}
            <View className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111]" />
          </View>

          {/* Event Details */}
          <View className="flex-1 p-4">
            {/* Event Name */}
            <Text
              className="text-white font-bold text-lg mb-2"
              numberOfLines={2}
            >
              {item?.concert?.name}
            </Text>

            {/* Date & Time */}
            <View className="flex-row items-center mb-2">
              <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
              <Text className="text-gray-400 text-sm ml-2">
                {formattedDate} • {formattedTime}
              </Text>
            </View>

            {/* Venue */}
            <View className="flex-row items-center mb-3">
              <Ionicons name="location-outline" size={16} color="#9ca3af" />
              <Text
                className="text-gray-400 text-sm ml-2 flex-1"
                numberOfLines={1}
              >
                {item?.concert.venue}
              </Text>
            </View>

            {/* Tickets & Status Row */}
            <View className="flex-row items-center justify-between">
              {/* Ticket Count */}
              <View className="flex-row items-center bg-gray-800/50 px-3 py-1.5 rounded-lg">
                <Ionicons name="ticket-outline" size={14} color="#60a5fa" />
                <Text className="text-blue-400 text-xs font-semibold ml-1.5">
                  {item.totalSeats}{" "}
                  {item.totalSeats !== 1 ? "Tickets" : "Ticket"}
                </Text>
              </View>

              {/* Status Badge */}
              <View
                className={`px-3 py-1.5 rounded-full ${
                  isUpcoming ? "bg-emerald-500/20" : "bg-gray-700/50"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isUpcoming ? "text-emerald-400" : "text-gray-400"
                  }`}
                >
                  {isUpcoming ? "Upcoming" : "Past"}
                </Text>
              </View>
            </View>

            {/* View Details Link */}
            <Pressable
              className="flex-row items-center mt-3 self-start"
              onPress={() => {
                router.push({
                  pathname: "/ticket-details",
                  params: { concertId: item.concertId },
                });
              }}
            >
              <Text className="text-blue-400 text-sm font-medium">
                View Details
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color="#60a5fa"
                style={{ marginLeft: 4 }}
              />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text className="text-gray-400 mt-4">Loading your tickets...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text className="text-red-400 text-lg font-semibold mt-4">
          Failed to load tickets
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          {error instanceof Error ? error.message : "Something went wrong"}
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="mt-6 bg-blue-600 px-8 py-3 rounded-full active:opacity-80"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-5 pt-3 pb-4 border-b border-gray-800/50">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">My Tickets</Text>
            {bookings.length > 0 && (
              <Text className="text-gray-400 text-sm mt-1">
                {bookings.length} event{bookings.length !== 1 ? "s" : ""}
              </Text>
            )}
          </View>

          {/* Optional: Add filter or settings icon */}
          {bookings.length > 0 && (
            <Pressable className="p-2">
              <Ionicons name="options-outline" size={24} color="#9ca3af" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Tickets List */}
      <FlatList
        data={bookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.concertId}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#60a5fa"
            colors={["#60a5fa"]}
          />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20 px-6">
            {/* Empty State Illustration */}
            <View className="bg-gray-900/50 rounded-full p-8 mb-6">
              <Ionicons name="ticket-outline" size={80} color="#374151" />
            </View>

            <Text className="text-white text-xl font-bold text-center mb-2">
              No Tickets Yet
            </Text>

            <Text className="text-gray-400 text-base text-center mb-8 leading-6">
              Book your first event and start creating unforgettable memories!
            </Text>

            {/* CTA Button */}
            <Pressable
              onPress={() => router.push("/(tabs)")}
              className="bg-blue-600 px-8 py-4 rounded-full active:opacity-80 shadow-lg"
            >
              <View className="flex-row items-center">
                <Ionicons name="search" size={20} color="#fff" />
                <Text className="text-white font-bold text-base ml-2">
                  Explore Events
                </Text>
              </View>
            </Pressable>

            {/* Info Cards */}
            <View className="w-full mt-12 space-y-3">
              <View className="flex-row items-center bg-gray-900/30 p-4 rounded-xl border border-gray-800/30">
                <View className="bg-blue-500/10 p-2 rounded-lg mr-3">
                  <Ionicons name="calendar" size={24} color="#60a5fa" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold mb-1">
                    Easy Booking
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Reserve tickets in seconds
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center bg-gray-900/30 p-4 rounded-xl border border-gray-800/30">
                <View className="bg-emerald-500/10 p-2 rounded-lg mr-3">
                  <Ionicons name="qr-code" size={24} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold mb-1">
                    Digital Tickets
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Access tickets anytime
                  </Text>
                </View>
              </View>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default EventDetails;
