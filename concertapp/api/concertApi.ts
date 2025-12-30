import api from "./api"

export const getConcert = async()=>{
    const response = await api.get("/concert")
    return response.data
};