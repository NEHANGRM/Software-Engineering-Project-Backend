const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');

router.post('/', timetableController.createTimetableEntry);
router.get('/user/:userId', timetableController.getTimetableByUser);
router.put('/:id', timetableController.updateTimetableEntry);
router.delete('/:id', timetableController.deleteTimetableEntry);

module.exports = router;
