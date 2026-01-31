const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const StudySession = require('../models/StudySession');
require('dotenv').config();

async function inspectDB() {
    console.log("🔍 Connecting to Database...");

    // Connect
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduplanai');
        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ Connection failed:", err);
        return;
    }

    console.log("\n--- 👥 USERS ---");
    const users = await User.find({});
    console.log(`Found ${users.length} users.`);
    users.forEach(u => console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}`));

    console.log("\n--- 📝 TASKS ---");
    const tasks = await Task.find({});
    console.log(`Found ${tasks.length} tasks.`);
    tasks.forEach(t => console.log(`- ID: ${t._id}, Title: ${t.title}, Type: ${t.type}, User: ${t.userId}`));

    console.log("\n--- 🧠 STUDY SESSIONS (AI) ---");
    const sessions = await StudySession.find({});
    console.log(`Found ${sessions.length} sessions.`);
    sessions.forEach(s => console.log(`- ID: ${s._id}, Status: ${s.status}, Start: ${s.startTime}`));

    console.log("\n----------------");

    // Close connection
    await mongoose.connection.close();
    console.log("Connection closed.");
}

inspectDB();
