const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduplanai', {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Routes Placeholder
app.get('/', (req, res) => {
    res.send('EduPlanAI Backend is running');
});

// Import Routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const eventRoutes = require('./routes/events');
const timetableRoutes = require('./routes/timetable');
const attendanceRoutes = require('./routes/attendance');
<<<<<<< HEAD
=======
const categoryRoutes = require('./routes/categories');
>>>>>>> 6158b10430d884491b82828fc72af39cabc7e9f3

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);
<<<<<<< HEAD
=======
app.use('/api/categories', categoryRoutes);
>>>>>>> 6158b10430d884491b82828fc72af39cabc7e9f3

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
