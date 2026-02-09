const Event = require('../models/Event');

exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find({ userId: req.user._id });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        // Destructure using keys sent by Frontend (AddEventModal.jsx)
        // Frontend sends: title, type, category, startTime, endTime, location, notes, priority, important, reminders
        const {
            title,
            type,
            classification,
            category,
            startTime,
            startDate, // fallback
            endTime,
            endDate,   // fallback 
            location,
            notes,
            description, // fallback
            priority,
            important,
            isImportant, // fallback
            reminders,
            estimatedDuration,
            isCompleted
        } = req.body;

        // Handle both 'type' and 'classification' for backward/forward compatibility
        const eventType = classification || type || 'event';

        // Handle field aliases (Frontend -> Backend Model)
        const eventStart = startTime || startDate;
        const eventEnd = endTime || endDate;
        const eventNotes = notes || description;
        const eventImportant = important !== undefined ? important : (isImportant !== undefined ? isImportant : false);

        if (!eventStart) {
            return res.status(400).json({ error: "Start time is required" });
        }

        const newEvent = new Event({
            userId: req.user._id,
            title,
            classification: eventType,
            type: eventType, // Keep both populated for safety
            startTime: eventStart,
            endTime: eventEnd,
            location,
            notes: eventNotes,
            isCompleted: isCompleted || false,
            priority: priority || 'medium',
            estimatedDuration,
            isImportant: eventImportant,
            reminders: reminders || [],
            category: category
        });
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (err) {
        console.error("Create Event Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true }
        );
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.json({ message: "Event deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
