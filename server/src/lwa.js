import axios from "axios";
import { cfg } from "./config.js";

export async function getLwaAccessToken() {
  const url = "https://api.amazon.com/auth/o2/token";
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: cfg.lwa.refreshToken,
    client_id: cfg.lwa.clientId,
    client_secret: cfg.lwa.clientSecret,
  });
  const { data } = await axios.post(url, body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return data.access_token;
}
