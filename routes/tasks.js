const router = require('express').Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, taskController.getTasks);
router.post('/', auth, taskController.createTask);
router.put('/:id', auth, taskController.updateTask);
router.delete('/:id', auth, taskController.deleteTask);

module.exports = router;
