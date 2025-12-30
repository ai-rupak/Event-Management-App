import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
// import 'react-native-reanimated';
import '../global.css';
import { useColorScheme } from '@/components/useColorScheme';
import { QueryProvider } from '@/providers/QueryProvider';
import { loadTokens, useAuthStore } from '@/stores/authStore';
import { View } from '@/components/Themed';
import { ActivityIndicator } from 'react-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const {accessToken,isLoading} = useAuthStore();
  const segments = useSegments();
  

  useEffect(()=>{
    loadTokens();
  },[]);

  
  useEffect(() => {
    if(!isLoading){
      <View className='flex-1 justify-center items-center'>
        <ActivityIndicator size={"large"}/>
      </View>
    }

    const inAuthGroup = segments[0] === "auth";

    if(!accessToken && !inAuthGroup) {
      router.replace("/auth")
    }else{
      router.replace("/(tabs)")
    }
    
  
    
  }, [accessToken,isLoading,useSegments,router]);
  

  return (
    <QueryProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false , gestureEnabled: true , animation:'fade' }} initialRouteName='auth'>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="book" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
    </QueryProvider>
  );
}
