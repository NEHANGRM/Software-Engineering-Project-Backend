const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('@google/generative-ai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

process.env.MONGODB_URI = 'mongodb://localhost:27017/eduplanai_test';
// Ensure API key is set for validations
process.env.GEMINI_API_KEY = 'test_api_key';

const app = require('../../index');
const { setupUser } = require('../test_helper');
const Event = require('../../models/Event');

let token;
let userId;
let mockGenerateContent;

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
    }
});

beforeEach(async () => {
    jest.clearAllMocks();

    if (mongoose.connection.readyState !== 0) {
        const collections = Object.keys(mongoose.connection.collections);
        for (const collectionName of collections) {
            const collection = mongoose.connection.collections[collectionName];
            await collection.deleteMany({});
        }
    }

    // Setup mocks
    mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
            text: () => JSON.stringify({
                date: "2024-01-01",
                sessions: [],
                summary: "Mock study plan"
            })
        }
    });

    GoogleGenerativeAI.mockImplementation(() => {
        return {
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: mockGenerateContent
            })
        };
    });

    token = await setupUser();

    // Get user ID from token or database if needed, but endpoint uses req.user._id from auth middleware.
    // Auth middleware decodes token.
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
});

describe('AI API Integration Tests', () => {
    describe('GET /api/ai/daily', () => {
        it('should return daily workload', async () => {
            // Create some events
            const event = new Event({
                userId: new mongoose.Types.ObjectId(), // Wait, setupUser creates a user but I don't know the ID here easily without decoding token or fetching.
                title: "Test Event",
                classification: "assignment",
                startTime: new Date(),
                endTime: new Date(new Date().getTime() + 3600000), // +1 hour
                estimatedDuration: "60m"
            });
            // We need the proper userId.
            // Let's decode token or just fetch the user.
            const user = await mongoose.model('User').findOne({ email: 'setup@example.com' });
            event.userId = user._id;
            await event.save();

            const res = await request(app)
                .get('/api/ai/daily')
                .set('Authorization', token);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('totalWorkloadMinutes');
            // Assuming the event created above is counted.
            // The query uses startOfDay/endOfDay. New Date() is today.
            // So it should be included.
            // classification "assignment" is counted as task.
            // estimatedDuration "60" -> 60 minutes.
            expect(res.body.totalTaskTime).toBeGreaterThanOrEqual(60);
        });
    });

    describe('POST /api/ai/generate-plan', () => {
        it('should generate a study plan', async () => {
            const res = await request(app)
                .post('/api/ai/generate-plan')
                .set('Authorization', token);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('summary');
            expect(mockGenerateContent).toHaveBeenCalled();
        });
    });
});
