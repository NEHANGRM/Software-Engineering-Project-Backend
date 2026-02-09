require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Event = require('../src/models/Event');
const intelligentController = require('../src/controllers/intelligentcontroller');

async function testStudyPlan() {
    try {
        // 1. Connect to MongoDB
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        // 2. Find or Create a Test User
        let user = await User.findOne({ email: "testuser@example.com" });
        if (!user) {
            user = await new User({
                name: "Test User",
                email: "testuser@example.com",
                password: "password123"
            }).save();
            console.log("Created new test user:", user._id);
        } else {
            console.log("Using existing test user:", user._id);
        }

        // 3. Create sample tasks and events for today if none exist
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // Check if tasks exist
        const tasks = await Event.find({ userId: user._id, startTime: { $gte: startOfDay, $lte: endOfDay } });

        if (tasks.length === 0) {
            console.log("Creating dummy tasks for testing...");

            // A Class (Fixed Event)
            await new Event({
                userId: user._id,
                title: "Database Management Class",
                classification: "class",
                startTime: new Date(new Date().setHours(10, 0, 0, 0)),
                endTime: new Date(new Date().setHours(12, 0, 0, 0)),
                isCompleted: false
            }).save();

            // An Assignment (Task to be scheduled)
            await new Event({
                userId: user._id,
                title: "write Backend API Documentation",
                classification: "assignment",
                startTime: new Date(new Date().setHours(20, 0, 0, 0)), // due tonight
                endTime: new Date(new Date().setHours(22, 0, 0, 0)),
                estimatedDuration: "2h",
                priority: "high",
                isCompleted: false
            }).save();
        }

        // 4. Call the controller function directly (mocking req/res)
        console.log("\n--- REQUESTING AI STUDY PLAN ---\n");

        const req = {
            params: { userId: user._id.toString() },
            query: { date: new Date().toISOString() }
        };

        const res = {
            json: (data) => {
                console.log("✅ SUCCESS! AI Generated Plan:");
                console.log(JSON.stringify(data, null, 2));
            },
            status: (code) => {
                console.log(`❌ STATUS CODE: ${code}`);
                return {
                    json: (err) => console.error("Error Response:", err)
                };
            }
        };

        await intelligentController.suggestStudySessions(req, res);

    } catch (error) {
        console.error("Test Failed:", error);
    } finally {
        await mongoose.connection.close();
    }
}

testStudyPlan();
