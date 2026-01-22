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
import StripeWrapper from '@/providers/StripeWrapper';

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
  const { accessToken, isLoading } = useAuthStore();
  const segments = useSegments();

  // Load tokens ONCE
  useEffect(() => {
    if (!isLoading && accessToken !== undefined) return;
    loadTokens();
  }, []);

  // Auth-based routing
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "auth";

    if (!accessToken && !inAuthGroup) {
      router.replace("/auth/login");
    }

    if (accessToken && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [accessToken, isLoading, segments]);

  // ✅ Show loader while checking auth
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }




  return (
    <QueryProvider>
    <StripeWrapper>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="book" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
     </StripeWrapper>
    </QueryProvider>
  );
}
