// routes/feed.js
import express from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import axios from "axios";
import { cfg } from "../config.js";
import { spApiRequest } from "../spapai.js"; // your low-level SP-API helper
import { buildProductTitleXML } from "../xml.js"; // XML builder
import { FeedJob } from "../models/feed.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/feed → upload CSV and submit feed to Amazon
router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "CSV file is required" });

    // Parse CSV
    const csv = req.file.buffer.toString("utf-8");
    const records = parse(csv, { columns: true, skip_empty_lines: true });
    if (!records.length) return res.status(400).json({ error: "CSV has no rows" });

    // Build Amazon XML
    const xml = buildProductTitleXML({ sellerId: cfg.sellerId, rows: records });

    // 1️⃣ Create feed document
    const doc = await spApiRequest({
      method: "POST",
      path: "/feed/2021-06-30/document",
      json: { contentType: "text/xml; charset=UTF-8" },
    });

    const { feedDocumentId, url } = doc;

    // 2️⃣ Upload XML to Amazon's pre-signed S3 URL
    await axios.put(url, xml, {
      headers: { "Content-Type": "text/xml; charset=UTF-8" },
      maxBodyLength: Infinity,
    });

    // 3️⃣ Submit the feed
    const create = await spApiRequest({
      method: "POST",
      path: "/feed/2021-06-30/feeds",
      json: {
        feedType: "POST_PRODUCT_DATA",
        marketplaceIds: [cfg.marketplaceId],
        inputFeedDocumentId: feedDocumentId,
      },
    });

    // 4️⃣ Save to MongoDB
    const job = await FeedJob.create({
      feedId: create.feedId,
      processingStatus: create.processingStatus || "IN_QUEUE",
      inputCount: create.inputCount,
      marketplaceId: cfg.marketplaceId,
    });

    // Return feedId + initial status
    res.json({
      success: true,
      feedId: job.feedId,
      status: job.processingStatus,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/feed/:feedId/status → return feed status from SP-API
router.get("/:feedId/status", async (req, res, next) => {
  try {
    const { feedId } = req.params;

    // Fetch latest status from SP-API
    const feed = await spApiRequest({
      method: "GET",
      path: `/feed/2021-06-30/feeds/${encodeURIComponent(feedId)}`,
    });

    // Update MongoDB
    const update = await FeedJob.findOneAndUpdate(
      { feedId },
      {
        processingStatus: feed.processingStatus,
        resultDocumentId: feed.resultDocumentId || null,
      },
      { new: true }
    );

    res.json({
      feedId,
      status: update.processingStatus,
      resultDocumentId: update.resultDocumentId || null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/feed/:feedId/result → download feed processing report
router.get("/:feedId/result", async (req, res, next) => {
  try {
    const { feedId } = req.params;

    const job = await FeedJob.findOne({ feedId });
    if (!job?.resultDocumentId)
      return res.status(404).json({ error: "resultDocumentId not ready" });

    // Get result document from SP-API
    const doc = await spApiRequest({
      method: "GET",
      path: `/feed/2021-06-30/documents/${encodeURIComponent(job.resultDocumentId)}`,
    });

    const out = await axios.get(doc.url); // download from S3
    res.type("text/plain").send(out.data);
  } catch (err) {
    next(err);
  }
});

export default router;