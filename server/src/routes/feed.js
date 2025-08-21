import express from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import axios from "axios";
import { cfg } from "../config.js";
import { spApiRequest } from "../spapai.js";
import { buildProductTitleXML } from "../xml.js";
import { FeedJob } from "../models/feed.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).send("CSV file is required");

    const csv = req.file.buffer.toString("utf-8");
    const records = parse(csv, { columns: true, skip_empty_lines: true });
    if (!records.length) return res.status(400).send("CSV has no rows");

    const xml = buildProductTitleXML({ sellerId: cfg.sellerId, rows: records });

    const doc = await spApiRequest({
      method: "POST",
      path: "/feed/2021-06-30/document",
      json: { contentType: "text/xml; charset=UTF-8" },
    });
    const { feedDocumentId, url } = doc;

    await axios.put(url, xml, {
      headers: { "Content-Type": "text/xml; charset=UTF-8" },
      maxBodyLength: Infinity,
    });

    const create = await spApiRequest({
      method: "POST",
      path: "/feed/2021-06-30/feeds",
      json: {
        feedType: "POST_PRODUCT_DATA",
        marketplaceIds: [cfg.marketplaceId],
        inputFeedDocumentId: feedDocumentId,
      },
    });

    const job = await FeedJob.create({
      feedId: create.feedId,
      processingStatus: create.processingStatus || "IN_QUEUE",
      inputCount: create.inputCount,
      marketplaceId: cfg.marketplaceId,
    });

    res.json({
      success: true,
      feedId: job.feedId,
      status: job.processingStatus,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:feedId/status", async (req, res, next) => {
  try {
    const { feedId } = req.params;
    const feed = await spApiRequest({
      method: "GET",
      path: `/feed/2021-06-30/feeds/${encodeURIComponent(feedId)}`,
    });

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

router.get("/:feedId/result", async (req, res, next) => {
  try {
    const { feedId } = req.params;

    const job = await FeedJob.findOne({ feedId });
    if (!job?.resultDocumentId)
      return res.status(404).json({ error: "resultDocumentId not ready" });

    const doc = await spApiRequest({
      method: "GET",
      path: `/feed/2021-06-30/documents/${encodeURIComponent(
        job.resultDocumentId
      )}`,
    });

    const out = await axios.get(doc.url);
    res.type("text/plain").send(out.data);
  } catch (err) {
    next(err);
  }
});

export default router