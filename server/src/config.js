import dotenv from "dotenv";
dotenv.config();

export const cfg = {
  port: process.env.PORT || 4000,
  mongoUrl: process.env.MONGO_URI,
  host: process.env.SPAPI_HOST,
  region: process.env.SPAPI_REGION,
  marketplaceId: process.env.MARKETPLACE_ID,
  lwa: {
    clientId: process.env.LWA_CLIENT_ID,
    clientSecret: process.env.LWA_CLIENT_SECRET,
    refreshToken: process.env.LWA_REFRESH_TOKEN,
  },
  sellerId: process.env.SELLER_ID,
};
