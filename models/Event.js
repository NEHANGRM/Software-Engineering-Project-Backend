const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    classification: { type: String, required: true }, // 'class', 'exam', 'meeting', etc.
    category: { type: String }, // Category ID or Name
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
    reminders: [{ type: Date }],
    color: { type: String },
    metadata: { type: Map, of: String }, // Flexible key-value pairs
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);
