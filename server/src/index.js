import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { cfg } from "./config.js";
import feedRouter from "./routes/feed.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/feed", feedRouter);

app.get("/", (req, res) => {
  res.send("Welcome to the Amazon Title Update API");
});

app.use((err, req, res, next) => {
  console.error(err?.response?.data || err);
  res.status(500).json({ error: "Internal Error", detail: err?.message });
});

async function start() {
  await mongoose.connect(cfg.mongoUrl);
  app.listen(cfg.port, () => {
    console.log(`Server is running on port http://localhost:${cfg.port}`);
  });
}

start();