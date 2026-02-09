const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    type: {
        type: String,
        enum: ['exam', 'lab', 'lecture', 'submission', 'note', 'event', 'class', 'assignment', 'meeting', 'personal', 'other'],
        default: 'event'
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: { type: String },
    notes: { type: String },
    subject: { type: String },
    isImportant: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false }, // Added for task completion
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);
