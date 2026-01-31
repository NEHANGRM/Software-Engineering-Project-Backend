const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['exam', 'lab', 'lecture', 'submission', 'note', 'event'], default: 'event' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: { type: String },
    notes: { type: String },
    subject: { type: String },
    isImportant: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);
