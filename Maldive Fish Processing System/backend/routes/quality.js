import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import FishQualityBatch from "../models/FishQualityBatch.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const generateBatchData = (mlResponse, file) => {
  let score = Math.round(mlResponse.confidence * 100);

  let color = "rose";
  let level = "Low Quality";

  if (mlResponse.class === "High_Quality") {
    level = "High Quality";
    color = "emerald";
    score = score >= 85 ? score : 85 + Math.floor(Math.random() * 15);
  } else if (mlResponse.class === "Medium_Quality") {
    level = "Medium Quality";
    color = "amber";
    score =
      score >= 70 && score < 85 ? score : 70 + Math.floor(Math.random() * 14);
  } else {
    level = "Low Quality";
    color = "rose";
    score = score < 70 ? score : 55 + Math.floor(Math.random() * 14);
  }

  const voc = Math.floor(Math.random() * 120) + 60;

  const odorStatus =
    score >= 85
      ? "Fresh / Acceptable"
      : score >= 70
        ? "Monitor Required"
        : "Possible Spoilage Risk";

  const storageAdvice =
    score >= 85
      ? "Store in a dry, cool, sealed container."
      : score >= 70
        ? "Check moisture exposure and improve ventilation."
        : "Separate batch and inspect before distribution.";

  return {
    imageName: file.originalname,
    imageUrl: `/uploads/${file.filename}`,
    qualityClass: mlResponse.class,
    confidence: mlResponse.confidence,
    probabilities: mlResponse.probabilities,
    status: mlResponse.status,
    rawClass: mlResponse.raw_class,
    score,
    level,
    voc,
    odorStatus,
    storageAdvice,
    color,
  };
};

router.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const filePath = req.file.path;
    const formData = new FormData();
    formData.append(
      "file",
      fs.createReadStream(filePath),
      req.file.originalname,
    );

    const mlResponse = await axios.post(
      "http://localhost:8000/predict",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      },
    );

    const mlData = mlResponse.data;

    const batchData = generateBatchData(mlData, req.file);

    const savedBatch = await FishQualityBatch.create(batchData);

    res.status(201).json(savedBatch);
  } catch (error) {
    console.error(
      "Error analyzing image:",
      error?.response?.data || error.message,
    );
    res
      .status(500)
      .json({ message: "Error analyzing image", error: error.message });
  }
});

router.get("/batches", async (req, res) => {
  try {
    const batches = await FishQualityBatch.find().sort({ createdAt: -1 });
    res.json(batches);
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ message: "Error fetching batches" });
  }
});

export default router;
