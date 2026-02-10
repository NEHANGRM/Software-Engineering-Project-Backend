const request = require('supertest');
const express = require('express');
const aiRoutes = require('../../routes/ai');
const Event = require('../../models/Event');

// Mock Dependencies
jest.mock('../../models/Event');
jest.mock('@google/generative-ai');

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Authentication Mock
jest.mock('../../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { _id: 'mockUserId' };
    next();
});

const app = express();
app.use(express.json());
app.use('/api/ai', aiRoutes);

describe('AI Controller Unit Tests', () => {
    let mockGenerateContent;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GEMINI_API_KEY = 'mock_key';

        mockGenerateContent = jest.fn();
        GoogleGenerativeAI.mockImplementation(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: mockGenerateContent
            })
        }));
    });

    describe('GET /api/ai/daily (Workload Analysis)', () => {
        it('should calculate workload correctly', async () => {
            const mockEvents = [
                {
                    classification: 'assignment',
                    estimatedDuration: '60m',
                    startTime: new Date(),
                    endTime: new Date()
                },
                {
                    classification: 'class',
                    startTime: new Date(new Date().setHours(10, 0, 0, 0)),
                    endTime: new Date(new Date().setHours(11, 0, 0, 0)) // 60 mins
                }
            ];
            Event.find.mockResolvedValue(mockEvents);

            const res = await request(app).get('/api/ai/daily');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('totalTaskTime', 60);
            expect(res.body).toHaveProperty('totalEventTime', 60);
            expect(res.body).toHaveProperty('totalWorkloadMinutes', 120);
        });

        it('should handle zero events', async () => {
            Event.find.mockResolvedValue([]);
            const res = await request(app).get('/api/ai/daily');
            expect(res.body.totalWorkloadMinutes).toBe(0);
        });
    });

    describe('POST /api/ai/generate-plan', () => {
        it('should generate a study plan', async () => {
            // Mock Events
            Event.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([]) // Mock the chain .find().select()
            });

            // Mock AI Response
            const mockAIResponse = {
                date: "2024-01-01",
                sessions: [],
                summary: "Mock Plan"
            };

            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => JSON.stringify(mockAIResponse)
                }
            });

            const res = await request(app).post('/api/ai/generate-plan');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockAIResponse);
            expect(mockGenerateContent).toHaveBeenCalled();
        });

        it('should return error if apiKey missing', async () => {
            delete process.env.GEMINI_API_KEY;
            const res = await request(app).post('/api/ai/generate-plan');
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('message');
        });

        it('should handle AI errors', async () => {
            process.env.GEMINI_API_KEY = 'mock_key';
            Event.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });

            mockGenerateContent.mockRejectedValue(new Error('AI invalid'));

            const res = await request(app).post('/api/ai/generate-plan');
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error', 'AI invalid');
        });
    });

    describe('GET /api/ai/overcommitment', () => {
        it('should detect overcommitment', async () => {
            // > 8 hours (480 mins)
            const mockEvents = [
                { classification: 'assignment', estimatedDuration: '500m', startTime: new Date(), endTime: new Date() }
            ];
            Event.find.mockResolvedValue(mockEvents);

            const res = await request(app).get('/api/ai/overcommitment');

            expect(res.statusCode).toBe(200);
            expect(res.body.overcommitment).toBe(true);
            expect(res.body.warning).toContain('Too much workload');
        });
    });

    describe('GET /api/ai/procrastination', () => {
        it('should analyze procrastination', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const mockEvents = [
                {
                    classification: 'assignment',
                    isCompleted: false,
                    endTime: yesterday,
                    createdAt: new Date(yesterday.getTime() - 100000)
                }
            ];
            Event.find.mockResolvedValue(mockEvents);

            const res = await request(app).get('/api/ai/procrastination');

            expect(res.statusCode).toBe(200);
            expect(res.body.missedDeadlines).toBe(1);
            // 1 task total, 1 missed -> 100%
            expect(res.body.procrastinationScore).toBe("100.0%");
        });
    });
});
