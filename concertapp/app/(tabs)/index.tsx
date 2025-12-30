import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getConcert } from '@/api/concertApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ConcertScreen() {

  const router = useRouter();

  const {
    data:concert,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['concert'],
    queryFn: getConcert});

      console.log(concert);
    if (isLoading) {
      return (
        <SafeAreaView>
          <ActivityIndicator size={"large"} color={"#fff"} />
        </SafeAreaView>
      )
    }

    if(error){
      return(
        <SafeAreaView className='flex-1 bg-black justify-center items-center'>
          <Text className='text-red-600'>Something went wrong!{error?.message}</Text>
        </SafeAreaView>
      )
    }

    const minPrice = Math.min(...concert.categories?.map((cat:{price:number}) => cat.price));
const formattedDate = new Date(concert.date).toLocaleString("en-US",{
  weekday: "short",
  day: "numeric",
  month: "short",
})

const formattedTime = new Date(concert.date).toLocaleTimeString("en-US",{
  hour: "numeric",
  minute: "numeric",
  hour12: true
}).toUpperCase();

const gatesOpen = new Date(concert.gatesOpenTime).toLocaleTimeString("en-US",{
  hour: "numeric",
  minute: "numeric",
  hour12: true
}).toUpperCase();

const languagesDisplay = concert.languages? `Event will be in ${concert.languages.split(",").join(" & ")}`:"";

  return (
    <SafeAreaView className="flex-1 bg-black ">
      <ScrollView>
        <Image source={{uri:concert.imageUrl}}className='w-full h-[450px] rounded-none'/>

        <View className='px-5 py-4'>
          <View className='flex-row gap-3 mb-2'>
            <Text className='text-gray-400 text-sm'>
              Music
            </Text>

            <Text className='text-gray-400 text-sm'>
              Concert
            </Text>
          </View>

          <Text className='text-white text-2xl font-semibold mb-1'>{concert?.name}</Text>
          <Text className='text-gray-300 text-base mb-4'>{formattedDate} , {formattedTime}</Text>

          <View className='flex-row items-center mb-3'>
            <Ionicons name="location-outline" size={18} color={"#aaa"}/>
            <Text className='text-gray-300 ml-2'>{concert?.venue}</Text>
            <Text className='text-gray-500 ml-auto text-sm'>35 Km away</Text>
          </View>

          <View className='flex-row items-center mb-6'>
            <Ionicons name="calendar-outline" size={18} color={"#aaa"}/>
            <Text className='text-gray-300 ml-2'>Gates Open at {gatesOpen} • View Schedule </Text>
          </View>

          <View className='bg-[#111] border border-gray-800 rounded-2xl p-4 mb-6'>
            <Text className='text-yellow-500 font-semibold mb-2'>
              Why this events stands out
            </Text>
            <Text className='text-gray-300 text-sm leading-5'>
              {concert?.about || "An amazing concert event featuring top artists, thrilling performances, and unforgettable experiences. Join us for a night of music, fun, and memories that will last a lifetime!"}
            </Text>
          </View>

          <Text className="text-gray-200 text-lg font-semibold mb-3">
            Who is taking the stage
          </Text>

          <View className="bg-[#111] border border-gray-800 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-3">
              <Image 
                source={{
                  uri: "https://i.pinimg.com/originals/d0/93/70/d09370f5e9d82709ef936c8efc6f9c75.jpg",
                }}
                className="w-14 h-14 rounded-full mr-4"
              />
            <View>
              <Text className="text-white font-semibold">
                Anirudh Ravichander
              </Text>
              <Text className="text-gray-400 text-sm">
                Rockstart Indian, Music
              </Text>
            </View>
            </View>

            <View className='space-y-3'>
              {["Hukum","PowerHouse","Chaleya","Monica"].map((song,index)=>(
                <View className='flex-row justify-between items-center bg-[#1a1a1a] px-4 py-3 rounded-xl'
                  key={index}>
                  <Text className='text-gray-300 text-sm'>
                    {index + 1}. {song}
                  </Text>
                  <Ionicons name="play-circle-outline" size={22} color={"#fff"} />
                </View>
              ))}
            </View>
          </View>

          
          <View className="bg-[#111] border border-gray-800 rounded-2xl p-4 mb-6">
            
          

          // Event Details and Information View
          <Text className="text-gray-200 text-lg font-semibold mb-3">About the Event</Text>
          <Text className="text-gray-400 text-sm leading-5 mb-6">{concert?.about}</Text>

          <Text className="text-gray-200 text-lg font-semibold mb-3">Things to Know</Text>
            <View className="space-y-3 mb-10">
              <Text className="text-gray-400 mb-2">{languagesDisplay}</Text>
              <Text className="text-gray-400 mb-2">🎟 Ticket needed for ages 5 and above</Text>
              <Text className="text-gray-400 mb-2">⚡ Entry allowed for ages 5 and above</Text>
              <Text className="text-gray-400 mb-2">🅿️ Free parking available</Text>
            </View>
          </View>

          <Text className='text-gray-200 text-lg font-semibold mb-3'>Organized By</Text>

          <View className='bg-[#111] border-gray-800 rounded-2xl p-4 flex-row items-center justify-between mb-8'>
            <View className='flex-row items-center'>
              <View className='w-12 h-12 rounded-full bg-purple-600 justify-center items-center mr-3'>
                <Ionicons name="person" size={24} color={"#fff"} />
              </View>

              <View>
                <Text className='text-white font-semibold'>
                  {concert?.organizedBy}
                </Text>

                <Text className='text-gray-400 text-xs mt-1'>
                  2 Hosted Events • 3.2 years hosting
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className='absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4 flex-row items-center justify-between'>
        <Text className='text-white text-lg font-semibold'>₹ {minPrice} onwards</Text>
        <TouchableOpacity onPress={()=> router.push("/book")} className='bg-white px-9 py-3 rounded-full'>
              <Text className='text-black font-semibold'>Book Tickets</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
