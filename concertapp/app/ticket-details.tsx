import { getUserBookings } from "@/api/bookingApi";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

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
    gateOpenTime?: string;
  };
}

interface Ticket {
  bookingId: string;
  ticketIndex: number;
  seats: number;
  category: Booking["category"];
  concert: Booking["concert"];
}

export default function TicketDetailScreen() {
  const router = useRouter();
  const { concertId } = useLocalSearchParams<{ concertId: string }>();

  if (!concertId) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-lg">Invalid ticket details</Text>
      </SafeAreaView>
    );
  }

  const {
    data: rawBookings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["userBookings"],
    queryFn: getUserBookings,
  });

  const tickets: Ticket[] = React.useMemo(() => {
    if (!rawBookings) return [];
    return rawBookings
      .filter((booking: Booking) => booking.concertId === concertId)
      .flatMap((booking: Booking) =>
        Array.from({ length: booking.seats }, (_, i) => ({
          bookingId: booking.id,
          ticketIndex: i + 1,
          seats: 1,
          category: booking.category,
          concert: booking.concert,
        }))
      );
  }, [rawBookings, concertId]);

  if (tickets.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-lg">No tickets found</Text>
      </SafeAreaView>
    );
  }

  const concertDate = tickets[0]?.concert?.date
    ? new Date(tickets[0]?.concert.date)
    : null;
  let unlockTime: Date | null = null;
  if (concertDate) {
    unlockTime = new Date(concertDate);
    unlockTime.setHours(concertDate.getHours() - 4);
  }

  const isUnlocked = unlockTime ? new Date() >= unlockTime : false;

  const concert = tickets[0].concert;
  const formattedUnlockTime = unlockTime
    ? unlockTime.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
    : "";

  const formattedDate = new Date(concert?.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  const renderTicketCard = ({ item }: { item: Ticket }) => {
    const qrValue = JSON.stringify({
      bookingId: item.bookingId,
      ticketIndex: item?.ticketIndex,
      userId: "userId",
      concertId: item.concert.id,
      categoryId: item.category.id,
    });

    return (
      <View className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-3xl overflow-hidden mb-5 border border-zinc-800">
        {/* Ticket Header */}
        <View className="bg-zinc-800/40 px-5 py-4 border-b border-zinc-700/50">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white font-bold text-lg mb-1">
                {item?.concert?.name}
              </Text>
              <Text className="text-zinc-400 text-sm">
                Ticket #{item?.ticketIndex} • {item?.category.name}
              </Text>
            </View>
            <View className="bg-emerald-500/20 px-3 py-1.5 rounded-full">
              <Text className="text-emerald-400 text-xs font-semibold">
                ${item?.category.price}
              </Text>
            </View>
          </View>
        </View>

        {/* QR Code Section */}
        <View className="items-center py-8 px-5">
          <View className="bg-white p-5 rounded-2xl relative">
            <QRCode
              value={qrValue}
              size={180}
              color={isUnlocked ? "#000" : "#666"}
            />
            {!isUnlocked && (
              <View className="absolute inset-0 bg-black/70 rounded-2xl items-center justify-center backdrop-blur">
                <View className="bg-zinc-900/90 p-4 rounded-xl items-center">
                  <Ionicons name="lock-closed" size={40} color={"#ef4444"} />
                  <Text className="text-white text-xs font-semibold mt-3 text-center max-w-[200px]">
                    Unlocks 4 hours before event
                  </Text>
                  <Text className="text-zinc-400 text-[10px] mt-1 text-center">
                    {formattedUnlockTime}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Ticket Details */}
        <View className="px-5 pb-5">
          <View className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
            <View className="flex-row items-center mb-3">
              <Ionicons name="location" size={16} color={"#a3a3a3"} />
              <Text className="text-zinc-300 text-sm ml-2 flex-1">
                {item?.concert.venue}
              </Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Ionicons name="calendar" size={16} color={"#a3a3a3"} />
              <Text className="text-zinc-300 text-sm ml-2 flex-1">
                {formattedDate}
              </Text>
            </View>
            {concert.gateOpenTime && (
              <View className="flex-row items-center">
                <Ionicons name="time" size={16} color={"#a3a3a3"} />
                <Text className="text-zinc-300 text-sm ml-2 flex-1">
                  Gates open: {concert.gateOpenTime}
                </Text>
              </View>
            )}
          </View>

          <View className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex-row items-start">
            <Ionicons name="information-circle" size={18} color={"#fbbf24"} />
            <Text className="text-amber-200 text-xs ml-2 flex-1">
              Present this QR code at the venue entrance for scanning
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-5 pt-2 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center mb-4 active:opacity-70"
        >
          <View className="bg-zinc-900 p-2 rounded-full">
            <Ionicons name="arrow-back" size={20} color={"#fff"} />
          </View>
          <Text className="text-white text-lg font-semibold ml-3">Back</Text>
        </Pressable>
      </View>

      {/* Concert Hero Section */}
      <View className="px-5 mb-6">
        <View className="relative rounded-2xl overflow-hidden mb-4">
          <Image
            resizeMode="cover"
            className="w-full h-48"
            source={{ uri: concert.imageUrl }}
          />
          <View className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <View className="absolute bottom-0 left-0 right-0 p-4">
            <Text className="text-white font-bold text-2xl mb-1">
              {concert?.name}
            </Text>
            <View className="flex-row items-center">
              <View className="bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-semibold">
                  {tickets.length} Ticket{tickets.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
          <View className="flex-row items-center mb-2">
            <Ionicons name="calendar-outline" size={18} color={"#a3a3a3"} />
            <Text className="text-zinc-300 text-sm ml-2 flex-1">
              {formattedDate}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={18} color={"#a3a3a3"} />
            <Text className="text-zinc-300 text-sm ml-2 flex-1">
              {concert.venue}
            </Text>
          </View>
        </View>
      </View>

      {/* Tickets List */}
      <View className="flex-1">
        <View className="px-5 mb-3">
          <Text className="text-white text-xl font-bold">Your Tickets</Text>
          <Text className="text-zinc-400 text-sm mt-1">
            {isUnlocked
              ? "QR codes are ready to scan"
              : "QR codes will unlock closer to event time"}
          </Text>
        </View>

        <FlatList
          data={tickets}
          renderItem={renderTicketCard}
          keyExtractor={(item, index) => `${item.bookingId}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}