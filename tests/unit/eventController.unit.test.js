const request = require('supertest');
const express = require('express');
const eventRoutes = require('../../routes/events');
const Event = require('../../models/Event');

jest.mock('../../models/Event');
jest.mock('../../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { _id: 'mockUserId' };
    next();
});

const app = express();
app.use(express.json());
app.use('/api/events', eventRoutes);

describe('Event Controller Unit Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/events', () => {
        it('should create an event with standard fields', async () => {
            const saveMock = jest.fn().mockResolvedValue({
                _id: 'newEvent',
                title: 'Standard Event',
                userId: 'mockUserId'
            });
            Event.mockImplementation((data) => ({
                ...data,
                save: saveMock
            }));

            const res = await request(app).post('/api/events').send({
                title: 'Standard Event',
                startTime: '2024-01-01',
                classification: 'class'
            });

            expect(res.statusCode).toBe(201);
            expect(saveMock).toHaveBeenCalled();
            // Verify constructor call
            const constructorCall = Event.mock.calls[0][0];
            expect(constructorCall).toHaveProperty('title', 'Standard Event');
            expect(constructorCall).toHaveProperty('classification', 'class');
            expect(constructorCall).toHaveProperty('startTime', '2024-01-01');
        });

        it('should handle field aliases (compatibility)', async () => {
            const saveMock = jest.fn().mockResolvedValue({});
            Event.mockImplementation((data) => ({ ...data, save: saveMock }));

            const res = await request(app).post('/api/events').send({
                title: 'Alias Event',
                type: 'meeting', // Alias for classification
                startDate: '2024-01-02', // Alias for startTime
                endDate: '2024-01-02',   // Alias for endTime
                description: 'Notes',    // Alias for notes
                important: true          // Alias for isImportant
            });

            expect(res.statusCode).toBe(201);
            const constructorCall = Event.mock.calls[0][0];
            expect(constructorCall.classification).toBe('meeting');
            expect(constructorCall.startTime).toBe('2024-01-02');
            expect(constructorCall.endTime).toBe('2024-01-02');
            expect(constructorCall.notes).toBe('Notes');
            expect(constructorCall.isImportant).toBe(true);
        });

        it('should require start time', async () => {
            const res = await request(app).post('/api/events').send({
                title: 'No Start Time'
            });
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('error', 'Start time is required');
        });
    });

    describe('GET /api/events', () => {
        it('should return all events', async () => {
            Event.find.mockResolvedValue([{ title: 'Event 1' }]);
            const res = await request(app).get('/api/events');
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(Event.find).toHaveBeenCalledWith({ userId: 'mockUserId' });
        });
    });

    describe('PUT /api/events/:id', () => {
        it('should update event', async () => {
            Event.findOneAndUpdate.mockResolvedValue({ title: 'Updated' });
            const res = await request(app).put('/api/events/1').send({ title: 'Updated' });
            expect(res.statusCode).toBe(200);
            expect(Event.findOneAndUpdate).toHaveBeenCalled();
        });

        it('should return 404 if not found', async () => {
            Event.findOneAndUpdate.mockResolvedValue(null);
            const res = await request(app).put('/api/events/999').send({});
            expect(res.statusCode).toBe(404);
        });
    });

    describe('DELETE /api/events/:id', () => {
        it('should delete event', async () => {
            Event.findOneAndDelete.mockResolvedValue({ _id: '1' });
            const res = await request(app).delete('/api/events/1');
            expect(res.statusCode).toBe(200);
        });
    });
});
