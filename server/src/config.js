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
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    roleArn: process.env.ROLE_ARN,
  },
  sellerId: process.env.SELLER_ID,
};
