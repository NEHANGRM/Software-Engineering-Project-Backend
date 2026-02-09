const router = require('express').Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, attendanceController.getAttendance);
router.post('/', auth, attendanceController.markAttendance);
router.delete('/:id', auth, attendanceController.deleteAttendance);
router.get('/stats', auth, attendanceController.getStats);

module.exports = router;
