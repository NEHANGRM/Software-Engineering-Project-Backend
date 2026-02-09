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
        const { title, type, startDate, endDate, location, description, isCompleted, priority, estimatedDuration, isImportant, reminders, category, classification } = req.body;

        // Handle both 'type' and 'classification' for backward/forward compatibility
        const eventType = classification || type || 'event';

        const newEvent = new Event({
            userId: req.user._id,
            title,
            classification: eventType,
            type: eventType, // Keep both populated for safety
            startTime: startDate,
            endTime: endDate,
            location,
            notes: description,
            isCompleted: isCompleted || false,
            priority: priority || 'medium',
            estimatedDuration,
            isImportant: isImportant || false,
            reminders: reminders || [],
            category: category
        });
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (err) {
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
