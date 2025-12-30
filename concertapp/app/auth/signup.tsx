import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { signUpEmail } from '@/api/authApi';
import axios from 'axios';

const signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const mutation = useMutation({
    mutationFn:signUpEmail,
    onSuccess:()=>{
      router.push({pathname:"/auth/otp",params:{email}})
    },
    onError:(error)=>{
      console.error("Error",error);
    }
  });

  const handleSignUp = ()=>{
    mutation.mutate({email,password,name});
  }
  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS == "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="px-6 pt-8 items-center" style={{ minHeight: 200 }}>
          <Text className="text-white text-xl font-bold mt-4 text-center">
            Create your account
          </Text>

          <Text className="text-gray-400 font-semibold mt-2">
            Sign up with email to continue
          </Text>
        </View>

        <View className="bg-[#3b3b3e80] rounded-3xl px-5 py-6">
          <Text className="text-white text-2xl font-semibold mb-8 text-center">Log in or sign up</Text>
          <View>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              placeholderTextColor={"#6b6b6b"}
              
              className="bg-[#111] border border-gray-800 px-4 py-3 text-white mb-4"
              autoCapitalize="words"
            />

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={"#6b6b6b"}
              keyboardType="email-address"
              className="bg-[#111] border border-gray-800 px-4 py-3 text-white mb-4"
              autoCapitalize="none"
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={"#6b6b6b"}
              secureTextEntry
              className="bg-[#111] border border-gray-800 px-4 py-3 text-white mb-4"
              
            />
          </View>

          <Pressable onPress={handleSignUp} className="bg-white rounded-full py-3 items-center mb-2">
            <Text className="text-black font-semibold">Create an account</Text>
          </Pressable>

          <View className="flex-row items-center justify-center space-x-3 mt-2 mb-3">
            <View className="h-[1px] bg-gray-700 flex-1"></View>
            <Text className="text-gray-400 uppercase text-xs">or </Text>
            <View className="h-[1px] bg-gray-700 flex-1"></View>
          </View>

          <Pressable className="bg-white rounded-xl py-3 px-4 flex-row items-center justify-center mb-2">
            <Image
            source={{
              uri:"https://toppng.com/uploads/preview/google-logo-transparent-png-11659866441wanynck5pd.png"
            }}
            style={{width:20,height:20,marginRight:10}}
            resizeMode="contain"
            />
            <Text className="text-black font-semibold">Continue with Google</Text>
          </Pressable>

          <View className="flex-row justify-center mt-4 pb-2">
            <Text className="text-gray-400 mr-2">Already have an account?</Text>
              <Pressable onPress={() => router.push('/auth/login')}>
                <Text className="text-white font-semibold">
                  Login 
                </Text>
              </Pressable>
            
          </View>

          {mutation.isError && (
            <Text>
              {axios.isAxiosError(mutation.error)
              ?mutation.error.response?.data?.error || 
              `Server Error ${mutation.error.response?.status}`
              :"Network error"
            }
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default signup

const styles = StyleSheet.create({})