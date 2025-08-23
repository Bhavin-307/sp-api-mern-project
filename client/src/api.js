import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
});

export async function uploadCsv(file) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post("/feed", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getStatus(feedId) {
  const { data } = await api.get(`/feed/${feedId}/status`);
  return data;
}

export async function downloadResult(feedId) {
  const res = await api.get(`/feed/${feedId}/result`, {
    responseType: "blob",
  });
  return res.data;
}
