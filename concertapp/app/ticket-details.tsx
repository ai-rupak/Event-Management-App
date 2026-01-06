import { getUserBookings } from "@/api/bookingApi";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg"

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
        <Text>Invalid ticket details</Text>
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
          seats: 1, //
          category: booking.category,
          concert: booking.concert,
        }))
      );
  }, [rawBookings, concertId]);
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
      <View className="bg-[#111] rounded-2xl p-4 mb-4 ">
        <View className="flex-row items-start mb-3">
          <Image
            className="w-16 h-20 rounded-lg mr-3"
            source={{ uri: item?.concert.imageUrl }}
          />
          <View className="flex-1">
            <Text className="text-white font-semibold text-sm">
              {item?.concert?.name}
            </Text>
            <Text className="text-gray-400 text-xs mb-1">
              {item?.concert?.name} Seat{item?.ticketIndex}
            </Text>
            <Text className="text-white text-xs">
              {item?.category.price} {item?.concert.venue}
            </Text>
          </View>
        </View>

        <View className="items-center relative">
            <QRCode
            value={qrValue}
            size={200}
            color={isUnlocked ? "#000" : "#666"} // Gray when locked to simulate blur/desaturated
            />
            {isUnlocked && (
                <View className="absolute inset-0 bg-black/50 rounded-lg items-center justify-center">
                    <Ionicons name="lock-closed" size={48} color={"#fff"}/>
                    <Text className="text-white text-xs mt-2 text-center px-4">
                        QR code will be unlocked on {formattedUnlockTime}
                    </Text>
                </View>
            )}
        </View>
        <Text className="text-gray-400 text-xs mt-3 text-center">
            M-Ticket: Show the QR at the gate for entry
        </Text>
      </View>

    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-4 pt-4 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center mb-2"
        >
          <Ionicons name="arrow-back" size={24} color={"#fff"} />
          <Text className="text-white text-xl font-bold ml-2">Back</Text>
        </Pressable>
        <Text className="text-white text-xl font-bold"> Your Tickets</Text>
      </View>

      <View>
        <Image
          resizeMode="cover"
          className="w-full h-32 rounded-xl"
          source={{ uri: concert.imageUrl }}
        />
        <Text className="text-white font-semibold text-lg ml-3">
          {concert?.name}
        </Text>
        <Text className="text-gray-400 text-sm mt-1">{formattedDate}</Text>

        <Text className="text-white text-sm mt-1">
          {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
        </Text>
        <View className="flex-row items-center mr-2">
          <View className="w-2 h-2 bg-gray-500 rounded-full mr-2" />
          <Text className="text-gray-400 text-sm flex-1">{concert.venue}</Text>
        </View>
      </View>

      <FlatList
        data={tickets}
        renderItem={renderTicketCard}
        keyExtractor={(item) => `${item.bookingId}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        ListFooterComponent={
          <Text className="text-white text-base font-semibold mb-3">
            Tickets
          </Text>
        }
      />
    </SafeAreaView>
  );
}
