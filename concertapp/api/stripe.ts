import api from "./api"

export const getPublishableKey = async ()=>{
    const response = await api.get("/payment/pub-key");
    return response.data;
}

export const createPaymentIntent = async ( bookingId:string)=>{
    const response = await api.post("/payment/create-intent",{
        bookingId
    })
    return response.data;
}