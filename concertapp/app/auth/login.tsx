import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { loginEmail } from "@/api/authApi";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import Ionicons from "@expo/vector-icons/Ionicons";

const login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  const mutation = useMutation({
    mutationFn: loginEmail,
    onSuccess: async (data) => {
      const { accessToken, refreshToken, user } = data;
      await setTokens(accessToken, refreshToken);
       setUser(user);
    },
    onError: (error) => {
      console.error("Login error", error);
    },
  });

  const handleLogin = () => {
    if (!email || !password) return;
    mutation.mutate({ email, password });
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-6"
      >
        {/* Header Section */}
        <View className="items-center mb-12">
          <View className="mb-6">
            <View className="w-16 h-16 bg-white rounded-full items-center justify-center">
              <Ionicons name="musical-notes" size={32} color="#000" />
            </View>
          </View>
          
          <Text className="text-white text-3xl font-bold mb-3">
            Welcome Back
          </Text>
          <Text className="text-gray-400 text-base text-center">
            Concerts • Dining • Events
          </Text>
        </View>

        {/* Form Section */}
        <View className="mb-6">
          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-2 ml-1">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white text-base"
            />
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-2 ml-1">Password</Text>
            <View className="relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white text-base pr-12"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4"
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#666"
                />
              </Pressable>
            </View>
          </View>

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={mutation.isPending}
            className="bg-white rounded-xl py-4 items-center mb-3 active:opacity-80"
          >
            <Text className="text-black font-semibold text-base">
              {mutation.isPending ? "Logging in..." : "Continue"}
            </Text>
          </Pressable>

          {/* Forgot Password */}
          <Pressable className="items-center py-2">
            <Text className="text-gray-400 text-sm">Forgot password?</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View className="flex-row items-center mb-6">
          <View className="h-[1px] bg-zinc-800 flex-1" />
          <Text className="text-gray-500 text-xs mx-4">OR</Text>
          <View className="h-[1px] bg-zinc-800 flex-1" />
        </View>

        {/* Google Sign In */}
        <Pressable className="bg-zinc-900 border border-zinc-800 rounded-xl py-4 flex-row items-center justify-center mb-8 active:opacity-80">
          <Image
            source={{
              uri: "https://toppng.com/uploads/preview/google-logo-transparent-png-11659866441wanynck5pd.png",
            }}
            style={{ width: 20, height: 20, marginRight: 12 }}
            resizeMode="contain"
          />
          <Text className="text-white font-medium text-base">
            Continue with Google
          </Text>
        </Pressable>

        {/* Sign Up Link */}
        <View className="flex-row justify-center items-center">
          <Text className="text-gray-400 text-sm">Don't have an account? </Text>
          <Pressable onPress={() => router.push("/auth/signup")}>
            <Text className="text-white font-semibold text-sm">Sign up</Text>
          </Pressable>
        </View>

        {/* Error Message */}
        {mutation.isError && (
          <View className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <Text className="text-red-400 text-sm text-center">
              Invalid email or password. Please try again.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default login;