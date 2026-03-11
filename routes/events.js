const router = require('express').Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, eventController.getEvents);
router.post('/', auth, eventController.createEvent);
router.put('/:id', auth, eventController.updateEvent);
router.delete('/:id', auth, eventController.deleteEvent);
router.put('/:id/status', auth, eventController.markStatus);

module.exports = router;
