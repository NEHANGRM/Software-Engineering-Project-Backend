const request = require('supertest');
const mongoose = require('mongoose');

process.env.MONGODB_URI = 'mongodb://localhost:27017/eduplanai_test';

const app = require('../../index');
const { setupUser } = require('../test_helper');
const AttendanceRecord = require('../../models/AttendanceRecord');

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

describe('Attendance API Integration Tests', () => {
    describe('POST /api/attendance', () => {
        it('should mark attendance (create)', async () => {
            const res = await request(app)
                .post('/api/attendance')
                .set('Authorization', token)
                .send({
                    courseName: 'Test Course',
                    date: '2024-01-01',
                    status: 'present'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.status).toEqual('present');
        });

        it('should update attendance if exists (upsert)', async () => {
            // First mark
            await request(app)
                .post('/api/attendance')
                .set('Authorization', token)
                .send({
                    courseName: 'Test Course',
                    date: '2024-01-01',
                    status: 'present'
                });

            // Second mark (change status)
            const res = await request(app)
                .post('/api/attendance')
                .set('Authorization', token)
                .send({
                    courseName: 'Test Course',
                    date: '2024-01-01',
                    status: 'absent'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toEqual('absent');

            // Verify count is still 1
            const count = await AttendanceRecord.countDocuments();
            expect(count).toEqual(1);
        });
    });

    describe('GET /api/attendance', () => {
        it('should get attendance records', async () => {
            await request(app)
                .post('/api/attendance')
                .set('Authorization', token)
                .send({
                    courseName: 'Test Course',
                    date: '2024-01-01',
                    status: 'present'
                });

            const res = await request(app)
                .get('/api/attendance')
                .set('Authorization', token);

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toEqual(1);
        });
    });

    describe('GET /api/attendance/stats', () => {
        it('should get attendance stats', async () => {
            await request(app)
                .post('/api/attendance')
                .set('Authorization', token)
                .send({
                    courseName: 'CS101',
                    date: '2024-01-01',
                    status: 'present'
                });

            await request(app)
                .post('/api/attendance')
                .set('Authorization', token)
                .send({
                    courseName: 'CS101',
                    date: '2024-01-02',
                    status: 'absent'
                });

            const res = await request(app)
                .get('/api/attendance/stats')
                .set('Authorization', token);

            expect(res.statusCode).toEqual(200);
            // stats structure: { 'CS101': { total: 2, present: 1, absent: 1, ... } }
            // Actually stats is an object with courseName as keys.
            // Oh wait, getAttendanceStats implementation:
            // if (!stats[record.courseName]) ...
            // So res.body should have 'CS101'.

            // Wait, JSON conversion might lose keys if they are dynamic? No.

            expect(res.body).toHaveProperty('CS101');
            expect(res.body.CS101.total).toEqual(2);
            expect(res.body.CS101.present).toEqual(1);
            expect(res.body.CS101.absent).toEqual(1);
        });
    });

    describe('DELETE /api/attendance/:id', () => {
        it('should delete attendance record', async () => {
            const createRes = await request(app)
                .post('/api/attendance')
                .set('Authorization', token)
                .send({
                    courseName: 'Test Course',
                    date: '2024-01-01',
                    status: 'present'
                });

            const id = createRes.body._id;

            const res = await request(app)
                .delete(`/api/attendance/${id}`)
                .set('Authorization', token);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual("Record deleted");
        });
    });
});
