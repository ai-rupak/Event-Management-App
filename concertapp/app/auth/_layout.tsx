import { Stack } from "expo-router";


export default function AuthLayout(){
    return (
        <Stack initialRouteName="login">
            <Stack.Screen name="login" options={{headerShown:false , title:"Login"}} />
            <Stack.Screen name="signup" options={{headerShown:false , title:"Sign Up"}} />
            <Stack.Screen name="otp" options={{headerShown:false }} />
        </Stack>
    )
}