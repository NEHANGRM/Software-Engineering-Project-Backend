const express = require("express");
const router = express.Router();
const intelligenceController = require("../controllers/intelligentcontroller");

// ---------------- ROUTES ---------------- //

// 1️⃣ Get daily workload summary
router.get("/daily/:userId", intelligenceController.getDailyWorkload);

// 2️⃣ Check overcommitment
router.get("/overcommitment/:userId", intelligenceController.checkOvercommitment);

// 3️⃣ Analyze procrastination trend
router.get("/procrastination/:userId", intelligenceController.analyzeProcrastination);

// 4️⃣ Analyze burnout risk
router.get("/burnout/:userId", intelligenceController.analyzeBurnout);

// 5️⃣ Suggest study sessions (AI-powered)
router.get("/studyplan/:userId", intelligenceController.suggestStudySessions);

module.exports = router;
