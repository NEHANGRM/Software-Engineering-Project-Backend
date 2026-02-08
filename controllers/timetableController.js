const TimetableEntry = require('../models/TimetableEntry');

exports.getTimetable = async (req, res) => {
    try {
        const entries = await TimetableEntry.find({ userId: req.user._id });
        res.json(entries);
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
        const entry = await TimetableEntry.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true }
        );
        if (!entry) return res.status(404).json({ message: "Entry not found" });
        res.json(entry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteTimetableEntry = async (req, res) => {
    try {
        const entry = await TimetableEntry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!entry) return res.status(404).json({ message: "Entry not found" });
        res.json({ message: "Entry deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
