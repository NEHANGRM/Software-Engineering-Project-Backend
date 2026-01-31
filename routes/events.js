const router = require('express').Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, eventController.getEvents);
router.post('/', auth, eventController.createEvent);
router.delete('/:id', auth, eventController.deleteEvent);

module.exports = router;
