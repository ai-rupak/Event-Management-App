import { useAuthStore } from "@/stores/authStore";
import api from "./api";


export const signUpEmail = async (data:{
    email:string;
    password:string;
    name?:string
})=>{
    const response = await api.post("/auth/signup/email",data);
    return response.data;
};

export const verifyOTP = async (data:{
    email:string;
    otp:string;
    })=>{
        const response = await api.post("/auth/verify-otp",data);
        const {accessToken , refreshToken} = response.data;

        await useAuthStore.getState().setTokens(accessToken,refreshToken);

        return response.data;
};

export const loginEmail = async (data:{
    email:string;
    password:string;
})=>{
    const response = await api.post("/auth/login/email",data);
    const {accessToken , refreshToken} = response.data;

    await useAuthStore.getState().setTokens(accessToken,refreshToken);

    return response.data;
}