const TimetableEntry = require("../models/TimetableEntry");

exports.createTimetableEntry = async (req, res) => {
    try {
        const entry = await TimetableEntry.create(req.body);
        res.status(201).json(entry);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getTimetableByUser = async (req, res) => {
    try {
        const entries = await TimetableEntry.find({ userId: req.params.userId });
        res.json(entries);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateTimetableEntry = async (req, res) => {
    try {
        const entry = await TimetableEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!entry) return res.status(404).json({ message: "Entry not found" });
        res.json(entry);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteTimetableEntry = async (req, res) => {
    try {
        await TimetableEntry.findByIdAndDelete(req.params.id);
        res.json({ message: "Entry deleted" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
