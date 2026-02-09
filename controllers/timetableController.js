const TimetableEntry = require('../models/TimetableEntry');

exports.getTimetable = async (req, res) => {
    try {
        const timetable = await TimetableEntry.find({ userId: req.user._id });
        res.json(timetable);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createTimetableEntry = async (req, res) => {
    try {
        const entry = new TimetableEntry({ ...req.body, userId: req.user._id });
        await entry.save();
        res.status(201).json(entry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateTimetableEntry = async (req, res) => {
    try {
        const entry = await TimetableEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(entry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteTimetableEntry = async (req, res) => {
    try {
        await TimetableEntry.findByIdAndDelete(req.params.id);
        res.json({ message: "Entry deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
