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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { signUpEmail } from "@/api/authApi";
import axios from "axios";
import Ionicons from "@expo/vector-icons/Ionicons";

const signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: signUpEmail,
    onSuccess: () => {
      router.push({ pathname: "/auth/otp", params: { email } });
    },
    onError: (error) => {
      console.error("Error", error);
    },
  });

  const handleSignUp = () => {
    if (!name || !email || !password) return;
    mutation.mutate({ email, password, name });
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-6"
      >
        {/* Header Section */}
        <View className="items-center mb-10">
          <View className="mb-6">
            <View className="w-16 h-16 bg-white rounded-full items-center justify-center">
              <Ionicons name="musical-notes" size={32} color="#000" />
            </View>
          </View>

          <Text className="text-white text-3xl font-bold mb-3">
            Create Account
          </Text>
          <Text className="text-gray-400 text-base text-center">
            Join us for amazing concert experiences
          </Text>
        </View>

        {/* Form Section */}
        <View className="mb-6">
          {/* Name Input */}
          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-2 ml-1">Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#666"
              autoCapitalize="words"
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white text-base"
            />
          </View>

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
                placeholder="Create a password"
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
            <Text className="text-gray-500 text-xs mt-2 ml-1">
              Must be at least 8 characters
            </Text>
          </View>

          {/* Sign Up Button */}
          <Pressable
            onPress={handleSignUp}
            disabled={mutation.isPending}
            className="bg-white rounded-xl py-4 items-center mb-3 active:opacity-80"
          >
            <Text className="text-black font-semibold text-base">
              {mutation.isPending ? "Creating account..." : "Create Account"}
            </Text>
          </Pressable>

          {/* Terms Text */}
          <Text className="text-gray-500 text-xs text-center mb-4">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* Divider */}
        <View className="flex-row items-center mb-6">
          <View className="h-[1px] bg-zinc-800 flex-1" />
          <Text className="text-gray-500 text-xs mx-4">OR</Text>
          <View className="h-[1px] bg-zinc-800 flex-1" />
        </View>

        {/* Google Sign Up */}
        <Pressable className="bg-zinc-900 border border-zinc-800 rounded-xl py-4 flex-row items-center justify-center mb-6 active:opacity-80">
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

        {/* Login Link */}
        <View className="flex-row justify-center items-center">
          <Text className="text-gray-400 text-sm">
            Already have an account?{" "}
          </Text>
          <Pressable onPress={() => router.push("/auth/login")}>
            <Text className="text-white font-semibold text-sm">Log in</Text>
          </Pressable>
        </View>

        {/* Error Message */}
        {mutation.isError && (
          <View className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <Text className="text-red-400 text-sm text-center">
              {axios.isAxiosError(mutation.error)
                ? mutation.error.response?.data?.error ||
                  `Server Error ${mutation.error.response?.status}`
                : "Network error. Please try again."}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default signup;