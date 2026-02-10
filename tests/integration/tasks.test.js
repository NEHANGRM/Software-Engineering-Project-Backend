const request = require('supertest');
const mongoose = require('mongoose');

// Set the environment to test before requiring the app
process.env.MONGODB_URI = 'mongodb://localhost:27017/eduplanai_test';

const app = require('../../index');
const { setupUser } = require('../test_helper');
const Task = require('../../models/Task');

let token;

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
    }
});

beforeEach(async () => {
    // Clear the database
    if (mongoose.connection.readyState !== 0) {
        const collections = Object.keys(mongoose.connection.collections);
        for (const collectionName of collections) {
            const collection = mongoose.connection.collections[collectionName];
            await collection.deleteMany({});
        }
    }
    // Setup a user and get token
    token = await setupUser();
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
});

describe('Tasks API Integration Tests', () => {
    describe('POST /api/tasks', () => {
        it('should create a new task', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', token)
                .send({
                    title: 'Test Task',
                    description: 'This is a test task',
                    priority: 'high',
                    deadline: new Date()
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.title).toEqual('Test Task');
        });

        it('should fail if title is missing', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', token)
                .send({
                    description: 'This is a test task without title'
                });

            // Assuming mongoose validation error returns 500 based on controller catch block: res.status(500).json({ error: err.message });
            // Or maybe 400 if validation middleware is added (but controller just catches err).
            // Let's check controller: catch(err) -> 500.
            // Mongoose validation error usually throws.
            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('GET /api/tasks', () => {
        it('should get all tasks for user', async () => {
            // Create a task first
            await request(app)
                .post('/api/tasks')
                .set('Authorization', token)
                .send({ title: 'Task 1' });

            const res = await request(app)
                .get('/api/tasks')
                .set('Authorization', token);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toEqual(1);
            expect(res.body[0].title).toEqual('Task 1');
        });
    });

    describe('PUT /api/tasks/:id', () => {
        it('should update a task', async () => {
            // Create a task
            const createRes = await request(app)
                .post('/api/tasks')
                .set('Authorization', token)
                .send({ title: 'Task to Update' });

            const taskId = createRes.body._id;

            const res = await request(app)
                .put(`/api/tasks/${taskId}`)
                .set('Authorization', token)
                .send({ title: 'Updated Task' });

            expect(res.statusCode).toEqual(200);
            expect(res.body.title).toEqual('Updated Task');
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        it('should delete a task', async () => {
            // Create a task
            const createRes = await request(app)
                .post('/api/tasks')
                .set('Authorization', token)
                .send({ title: 'Task to Delete' });

            const taskId = createRes.body._id;

            const res = await request(app)
                .delete(`/api/tasks/${taskId}`)
                .set('Authorization', token);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual("Task deleted");

            // Verify it's gone
            const getRes = await request(app)
                .get('/api/tasks')
                .set('Authorization', token);
            expect(getRes.body.length).toEqual(0);
        });
    });
});
