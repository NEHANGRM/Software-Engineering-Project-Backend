const router = require('express').Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/authMiddleware');

// 1️⃣ Get daily workload summary
router.get("/daily", auth, aiController.getDailyWorkload);

// 2️⃣ Check overcommitment
router.get("/overcommitment", auth, aiController.checkOvercommitment);

// 3️⃣ Analyze procrastination trend
router.get("/procrastination", auth, aiController.analyzeProcrastination);

// 4️⃣ Analyze burnout risk
router.get("/burnout", auth, aiController.analyzeBurnout);

// 5️⃣ Suggest study sessions (AI-powered)
router.post('/generate-plan', auth, aiController.generateStudyPlan); // Kept as POST/generate-plan for compatibility or could be GET/studyplan
// Added alias for GET if preferred
router.get("/studyplan", auth, aiController.generateStudyPlan);

module.exports = router;
