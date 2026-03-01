const request = require('supertest');
const mongoose = require('mongoose');

process.env.MONGODB_URI = 'mongodb://localhost:27017/eduplanai_test';

const app = require('../../index');
const { setupUser } = require('../test_helper');
const TimetableEntry = require('../../models/TimetableEntry');

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

describe('Timetable API Integration Tests', () => {
    describe('POST /api/timetable', () => {
        it('should create a new timetable entry', async () => {
            const res = await request(app)
                .post('/api/timetable')
                .set('Authorization', token)
                .send({
                    courseName: 'Test Course',
                    daysOfWeek: [1, 3, 5],
                    startTime: "09:00",
                    endTime: "10:00"
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('courseName', 'Test Course');
        });
    });

    describe('GET /api/timetable', () => {
        it('should get timetable entries', async () => {
            const createRes = await request(app)
                .post('/api/timetable')
                .set('Authorization', token)
                .send({
                    courseName: 'Course 1',
                    daysOfWeek: [2],
                    startTime: "11:00",
                    endTime: "12:00"
                });

            expect(createRes.statusCode).toEqual(201);

            const res = await request(app)
                .get('/api/timetable')
                .set('Authorization', token);

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('PUT /api/timetable/:id', () => {
        it('should update a timetable entry', async () => {
            const createRes = await request(app)
                .post('/api/timetable')
                .set('Authorization', token)
                .send({
                    courseName: 'Original Course',
                    daysOfWeek: [1],
                    startTime: "09:00",
                    endTime: "10:00"
                });

            const id = createRes.body._id;

            const res = await request(app)
                .put(`/api/timetable/${id}`)
                .set('Authorization', token)
                .send({ courseName: 'Updated Course' });

            expect(res.statusCode).toEqual(200);
            expect(res.body.courseName).toEqual('Updated Course');
        });
    });

    describe('DELETE /api/timetable/:id', () => {
        it('should delete a timetable entry', async () => {
            const createRes = await request(app)
                .post('/api/timetable')
                .set('Authorization', token)
                .send({
                    courseName: 'Course to Delete',
                    daysOfWeek: [1],
                    startTime: "09:00",
                    endTime: "10:00"
                });

            const id = createRes.body._id;

            const res = await request(app)
                .delete(`/api/timetable/${id}`)
                .set('Authorization', token);

            expect(res.statusCode).toEqual(200);

            const getRes = await request(app)
                .get('/api/timetable')
                .set('Authorization', token);
            expect(getRes.body.length).toEqual(0);
        });
    });
});
