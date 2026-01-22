import api from "./api";


export const joinQueue = async () => {
  const res = await api.post("/queue/join");
  return res.data;
};

export const getQueueStatus = async () => {
  const res = await api.get("/queue/status");
  return res.data;
};
