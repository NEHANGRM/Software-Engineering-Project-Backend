const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['class', 'exam', 'assignment', 'personal', 'study'], default: 'assignment' },
    startTime: { type: Date }, // For events/classes
    endTime: { type: Date },   // For events/classes
    deadline: { type: Date },  // For assignments/tasks
    isCompleted: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    estimatedDuration: { type: Number }, // in minutes, for tasks
    importance: { type: Boolean, default: false }, // User marked important
    recurrence: { type: String, enum: ['none', 'daily', 'weekly'], default: 'none' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
