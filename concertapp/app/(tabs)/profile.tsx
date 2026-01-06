import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useAuthStore } from "@/stores/authStore";

type CardProps = {
  icon: React.ReactNode;
  label: string;
};

type MenuRowProps = {
  label: string;
  icon: React.ReactNode;
  value?: string;
  onPress?: () => void;
};

const Card: React.FC<CardProps> = ({ icon, label }) => {
  return (
    <TouchableOpacity className="w-[30%] bg-neutral-900 rounded-2xl p-4 items-center">
      {icon}
      <Text className="text-white mt-3 text-center text-sm">{label}</Text>
    </TouchableOpacity>
  );
};

const MenuRow: React.FC<MenuRowProps> = ({ icon, label, value, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-neutral-900 rounded-2xl px-4 py-4 flex-row items-center mb-2"
    >
      {icon}
      <Text className="text-white ml-4 text-base flex-1">{label}</Text>
      {value && <Text className="text-neutral-400 mr-3">{value}</Text>}
      <Ionicons name="chevron-forward" size={22} color={"white"} />
    </TouchableOpacity>
  );
};

export default function TabTwoScreen() {
  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1 bg-black px-5 pt-4">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity className="">
            <Ionicons name="chevron-back" size={26} color={"white"} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold ml-3">Profile</Text>
        </View>

        <View className="flex-row items-center mb-8">
          <Image
            source={{}}
            className="w-20 h-20 rounded-full bg-neutral-800"
          />
          <View className="ml-4">
            <Text className="text-white text-lg font-semibold">Rupak Swar</Text>
            <Text className="text-neutral-400 mt-1">+91 7431911822</Text>
          </View>

          <TouchableOpacity className="ml-auto">
            <Feather name="edit-2" size={20} color={"white"} />
          </TouchableOpacity>
        </View>

        <Text className="text-white text-lg font-semibold mb-3">
          All Bookings
        </Text>
        <View className="flex-row justify-between mb-8">
          <Card
            icon={<Feather name="coffee" size={28} color="white" />}
            label="bookings"
          />

          <Card
            icon={<Feather name="film" size={28} color="white" />}
            label="Movie tickets"
          />

          <TouchableOpacity
            onPress={() => {
              router.push("/event-details");
            }}
            className="w-[30%] bg-neutral-900 rounded-2xl p-4 items-center"
          >
            <FontAwesome5 name="guitar" size={26} color="white" />
            <Text className="text-white mt-3 text-center text-sm">
              Event tickets
            </Text>
          </TouchableOpacity>
        </View>
        <Text className="text-white text-lg font-semibold mb-3">Vouchers</Text>

        <MenuRow
          label="Collected Vouchers"
          icon={<Ionicons name="gift-outline" size={26} color={"white"} />}
          value={"12"}
        />

        <Text className="text-white text-lg font-semibold mb-3">Payments</Text>

        <MenuRow
          label="Dining transaction"
          icon={<MaterialIcons name="receipt" size={22} color={"white"} />}
        />
        <MenuRow
          label="Store transactions"
          icon={<MaterialIcons name="receipt-long" size={22} color={"white"} />}
        />
        <MenuRow
          label="District Money"
          icon={<Ionicons name="wallet-outline" size={24} color={"white"} />}
        />
        <MenuRow
          label="Claim a Gift Card"
          icon={<Ionicons name="card-outline" size={24} color={"white"} />}
        />

        <Text className="text-white text-lg font-semibold mb-3">Manage</Text>

        <MenuRow
          label="Your reviews"
          icon={<Feather name="bookmark" size={20} color={"white"} />}
        />

        <MenuRow
          label="Hotlists"
          icon={<Feather name="bell" size={20} color={"white"} />}
        />

        <MenuRow
          label="Payment settings"
          icon={<Ionicons name="settings-outline" size={20} color={"white"} />}
        />

        <MenuRow
          label="Apperance"
          icon={<Feather name="aperture" size={20} color={"white"} />}
        />
        <MenuRow
          label="Logout"
          icon={<Ionicons name="exit-outline" size={20} color={"#ef4444"} />}
          onPress={handleLogout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
