import { verifyOTP } from "@/api/authApi";
import { useAuthStore } from "@/stores/authStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const setTokens = useAuthStore((state) => state.setTokens);

  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput | null>(null);

  const digits = Array.from({ length: 6 }).map((_, i) => code[i] ?? "");

  const mutation = useMutation({
    mutationFn: verifyOTP,
    onSuccess: async (data) => {
      console.log("data object", data);
      await setTokens(data.accessToken, data.refreshToken);

      router.push("/");
    },
    onError: (error) => {
      console.error("Error", error);
    },
  });

  const handleVerify = () => {
    mutation.mutate({ email, otp: code });
  };

  const RESEND_SECONDS = 30;
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    setCanResend(false);
    setSecondsLeft(RESEND_SECONDS);

    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setCanResend(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (code.length >= 6) {
      Keyboard.dismiss();
    }
  }, [code]);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-4 pt-3">
        <View className="flex-row items-center">
          <Pressable className="p-2 rounded-full">
            <Ionicons
              name="arrow-back"
              size={22}
              color="white"
              onPress={() => router.back()}
            />
          </Pressable>

          <View className="ml-3">
            <Text className="text-white text-lg font-semibold">
              OTP Verification
            </Text>
          </View>
        </View>
        <View className="px-6 mt-6">
          <Text className="text-white text-base mb-4">
            We have sent a verification code to{" "}
          </Text>
          <Text className="text-white text-lg font-semibold mb-6">{email}</Text>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(text) => {
              const cleaned = text.replace(/\D/g, "").slice(0, 6);
              setCode(cleaned);
            }}
            keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
            maxLength={6}
            style={{ position: "absolute", opacity: 0, height: 0, width: 0 }}
            autoFocus
          />

          <View className="flex-row justify-between px-2 mb-6">
            {digits?.map((d, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.9}
                onPress={() => inputRef.current?.focus}
                className="w-14 h-14 rounded-lg border border-gray-600 items-center justify-center"
                style={{
                  borderColor: d ? "#fff" : "#4b5563",
                  backgroundColor: d ? "transparent" : "transparent",
                }}
              >
                <Text className="text-white text-2xl">{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-gray-400 mb-3">
            Didn't get the OTP ?{" "}
            <Text className="text-gray-300">
              (Request again in {secondsLeft > 0 ? `${secondsLeft}` : "0.00"})
            </Text>
          </Text>

          <View className="flex-row gap-3 mb-6">
            <Pressable
              disabled={!canResend}
              className={`px-5 py-2 rounded-xl border ${canResend ? "border-gray-600" : "border-gray-800"}`}
            >
              <Text className={`${canResend ? "text-white" : "text-gray-600"}`}>
                SMS
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {}}
              disabled={!canResend}
              className={`px-5 py-2 rounded-xl border ${canResend ? "border-gray-600" : "border-gray-800"}`}
            >
              <Text className={`${canResend ? "text-white" : "text-gray-600"}`}>
                WhatsApp
              </Text>
            </Pressable>
          </View>

          <Pressable className="mb-6">
            <Text className="text-gray-300 underline text-center">
              Back to Login
            </Text>
          </Pressable>
        </View>
      </View>
      <View className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4 flex-row items-center justify-between">
        <View>
          <Text className="text-gray-400 text-sm">Verification</Text>
          <Text className="text-white text-lg font-semibold">Enter code</Text>
        </View>

        <Pressable
        onPress={handleVerify}
          disabled={code.length < 6}
          className={`px-6 py-3 rounded-full ${code.length < 6 ? "bg-gray-700" : "bg-white"}`}
        >
          <Text
            className={`${code.length < 6 ? "text-gray-300" : "text-black"} font-semibold`}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
