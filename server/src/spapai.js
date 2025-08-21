import axios from "axios";
import { cfg } from "./config.js";
import { getLwaAccessToken } from "./lwa.js";
import { signAws } from "./sigv4.js";

const BASE = `https://${cfg.host}`;

export async function spApiRequest({ method, path, json }) {
  const accessToken = await getLwaAccessToken();
  const body = json ? JSON.stringify(json) : "";
  const headers = {
    "content-type": "application/json",
    "x-amz-access-token": accessToken,
  };

  const { authorization, amzDate } = signAws({
    method,
    host: cfg.host,
    path,
    headers,
    body,
  });

  const res = await axios.request({
    method,
    url: BASE + path,
    data: body || undefined,
    headers: {
      ...headers,
      "x-amz-date": amzDate,
      authorization,
    },
  });

  return res.data;
}
