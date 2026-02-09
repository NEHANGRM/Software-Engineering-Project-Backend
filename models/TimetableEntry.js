const mongoose = require('mongoose');

const TimetableEntrySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseName: { type: String, required: true },
    courseCode: { type: String },
    type: { type: String, default: 'class' }, // class, lab, etc.
    startTime: { type: String, required: true }, // "HH:mm"
    endTime: { type: String, required: true },   // "HH:mm"
    daysOfWeek: [{ type: Number }], // 1-7 (Mon-Sun)
    room: { type: String },
    semesterStart: { type: Date },
    semesterEnd: { type: Date },
    color: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TimetableEntry', TimetableEntrySchema);
