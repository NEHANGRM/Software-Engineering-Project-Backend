const router = require('express').Router();
const timetableController = require('../controllers/timetableController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, timetableController.getTimetable);
router.post('/', auth, timetableController.createTimetableEntry);
router.put('/:id', auth, timetableController.updateTimetableEntry);
router.delete('/:id', auth, timetableController.deleteTimetableEntry);

module.exports = router;
