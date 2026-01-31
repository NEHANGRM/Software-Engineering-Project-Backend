const mongoose = require('mongoose');

const StudySessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    relatedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ['planned', 'completed', 'missed', 'skipped'], default: 'planned' },
    reasoning: { type: String } // Explainable AI: Why this session was created
});

module.exports = mongoose.model('StudySession', StudySessionSchema);
