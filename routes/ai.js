const router = require('express').Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/authMiddleware');

router.post('/generate-plan', auth, aiController.generateStudyPlan);
router.get('/insights', auth, aiController.getInsights);

module.exports = router;
