const request = require('supertest');
const mongoose = require('mongoose');

process.env.MONGODB_URI = 'mongodb://localhost:27017/eduplanai_test';
process.env.GEMINI_API_KEY = 'test_api_key'; // In case event controller uses it? Unlikely but safe.

const app = require('../../index');
const { setupUser } = require('../test_helper');
const Event = require('../../models/Event');

let token;

beforeAll(async () => {
    // Wait for mongoose connection initiated by app require to be fully ready
    if (mongoose.connection.readyState !== 1) {
        await mongoose.connection.asPromise();
    }
});

beforeEach(async () => {
    if (mongoose.connection.readyState !== 0) {
        const collections = Object.keys(mongoose.connection.collections);
        for (const collectionName of collections) {
            const collection = mongoose.connection.collections[collectionName];
            await collection.deleteMany({});
        }
    }
    token = await setupUser();
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
});

describe('Events API Integration Tests', () => {
    describe('POST /api/events', () => {
        it('should create a new event', async () => {
            const res = await request(app)
                .post('/api/events')
                .set('Authorization', token)
                .send({
                    title: 'Test Event',
                    classification: 'class',
                    startTime: new Date(),
                    endTime: new Date(new Date().getTime() + 3600000),
                    location: 'Room 101'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.title).toEqual('Test Event');
        });
    });

    describe('GET /api/events', () => {
        it('should get all events for user', async () => {
            await request(app)
                .post('/api/events')
                .set('Authorization', token)
                .send({
                    title: 'Event 1',
                    classification: 'meeting',
                    startTime: new Date()
                });

            const res = await request(app)
                .get('/api/events')
                .set('Authorization', token);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toEqual(1);
        });
    });

    describe('PUT /api/events/:id', () => {
        it('should update an event', async () => {
            const createRes = await request(app)
                .post('/api/events')
                .set('Authorization', token)
                .send({
                    title: 'Original Event',
                    classification: 'event',
                    startTime: new Date()
                });

            const eventId = createRes.body._id;

            const res = await request(app)
                .put(`/api/events/${eventId}`)
                .set('Authorization', token)
                .send({ title: 'Updated Event' });

            expect(res.statusCode).toEqual(200);
            expect(res.body.title).toEqual('Updated Event');
        });
    });

    describe('DELETE /api/events/:id', () => {
        it('should delete an event', async () => {
            const createRes = await request(app)
                .post('/api/events')
                .set('Authorization', token)
                .send({
                    title: 'Event to Delete',
                    classification: 'event',
                    startTime: new Date()
                });

            const eventId = createRes.body._id;

            const res = await request(app)
                .delete(`/api/events/${eventId}`)
                .set('Authorization', token);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual("Event deleted");

            const getRes = await request(app)
                .get('/api/events')
                .set('Authorization', token);
            expect(getRes.body.length).toEqual(0);
        });
    });
});
