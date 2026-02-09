const mongoose = require("mongoose");

const voiceNoteSchema = new mongoose.Schema({
  url: String,          // file path or cloud URL
  duration: Number,     // seconds
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const eventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  title: {
    type: String,
    required: true
  },

  // Unified Classification (replacing 'type')
  classification: {
    type: String,
    enum: ["class", "exam", "assignment", "meeting", "other"],
    default: "other"
  },

  // Link to Category ID
  category: {
    type: String, // Storing as String ID to match frontend logic
    ref: "Category",
    default: null
  },

  startTime: {
    type: Date,
    required: true
  },

  endTime: {
    type: Date,
    // endTime might be null for simple tasks/deadlines in some logic, but usually DB requires consistency. 
    // We will make it required but it can be same as startTime if single point.
    required: false
  },

  location: String,

  notes: String,

  attachments: [String], // File paths or URLs

  voiceNotes: [voiceNoteSchema],

  isImportant: {
    type: Boolean,
    default: false
  },

  // Task-specific fields
  isCompleted: {
    type: Boolean,
    default: false
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },

  estimatedDuration: String,

  // Track how long the user ACTUALLY spent (for behavior analysis)
  actualDuration: String,

  // Metadata for sync/timetable links
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },

  reminders: [Date],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Event", eventSchema);
