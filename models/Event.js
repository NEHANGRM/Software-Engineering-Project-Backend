const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
<<<<<<< HEAD
    type: {
        type: String,
        enum: ['exam', 'lab', 'lecture', 'submission', 'note', 'event', 'class', 'assignment', 'meeting', 'personal', 'other'],
        default: 'event'
    },
=======
    classification: { type: String, required: true }, // 'class', 'exam', 'meeting', etc.
    category: { type: String }, // Category ID or Name
>>>>>>> 6158b10430d884491b82828fc72af39cabc7e9f3
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    location: { type: String },
    notes: { type: String },
    attachments: [{ type: String }],
    voiceNotes: [{
        id: String,
        filePath: String,
        recordedAt: Date,
        duration: Number,
        tags: [String]
    }],
    isCompleted: { type: Boolean, default: false },
    completionColor: { type: String },
    priority: { type: String, default: 'medium' },
    estimatedDuration: { type: String },
    isImportant: { type: Boolean, default: false },
<<<<<<< HEAD
    isCompleted: { type: Boolean, default: false }, // Added for task completion
=======
    reminders: [{ type: Date }],
    color: { type: String },
    metadata: { type: Map, of: String }, // Flexible key-value pairs
>>>>>>> 6158b10430d884491b82828fc72af39cabc7e9f3
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);
