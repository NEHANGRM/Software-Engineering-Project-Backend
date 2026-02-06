const Event = require("../models/Event");

/**
 * Create a new event
 */
exports.createEvent = async (req, res) => {
  try {
    const {
      userId,
      title,
      classification, // was type
      category, // was subject
      location,
      startTime,
      endTime,
      notes,
      attachments,
      voiceNotes,
      isImportant,
      priority,
      isCompleted,
      estimatedDuration,
      metadata,
      reminders
    } = req.body;

    if (!userId || !title || !startTime) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const event = await Event.create({
      userId,
      title,
      classification,
      category,
      location,
      startTime,
      endTime,
      notes,
      attachments,
      voiceNotes,
      isImportant,
      priority,
      isCompleted,
      estimatedDuration,
      metadata,
      reminders
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


/**
 * Get all events for a user
 */
exports.getEventsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const events = await Event.find({ userId }).sort({ startTime: 1 });
    res.json(events);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Update an event
 */
exports.updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const updates = req.body;

    const event = await Event.findByIdAndUpdate(eventId, updates, { new: true });

    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Delete an event
 */
exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findByIdAndDelete(eventId);

    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
