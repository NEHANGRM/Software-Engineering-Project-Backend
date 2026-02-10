const request = require('supertest');
const mongoose = require('mongoose');

process.env.MONGODB_URI = 'mongodb://localhost:27017/eduplanai_test';

const app = require('../../index');
const { setupUser } = require('../test_helper');
const Category = require('../../models/Category');

let token;

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
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

describe('Categories API Integration Tests', () => {
    describe('POST /api/categories', () => {
        it('should create a new category', async () => {
            const res = await request(app)
                .post('/api/categories')
                .set('Authorization', token)
                .send({
                    name: 'Study',
                    color: '#FF0000',
                    icon: 'book'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.name).toEqual('Study');
        });
    });

    describe('GET /api/categories', () => {
        it('should get all categories for user', async () => {
            await request(app)
                .post('/api/categories')
                .set('Authorization', token)
                .send({
                    name: 'Work',
                });

            const res = await request(app)
                .get('/api/categories')
                .set('Authorization', token);

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toEqual(1);
        });
    });

    describe('PUT /api/categories/:id', () => {
        it('should update a category', async () => {
            const createRes = await request(app)
                .post('/api/categories')
                .set('Authorization', token)
                .send({
                    name: 'Old Name'
                });

            const id = createRes.body._id;

            const res = await request(app)
                .put(`/api/categories/${id}`)
                .set('Authorization', token)
                .send({ name: 'New Name' });

            expect(res.statusCode).toEqual(200);
            expect(res.body.name).toEqual('New Name');
        });
    });

    describe('DELETE /api/categories/:id', () => {
        it('should delete a category', async () => {
            const createRes = await request(app)
                .post('/api/categories')
                .set('Authorization', token)
                .send({
                    name: 'To Delete'
                });

            const id = createRes.body._id;

            const res = await request(app)
                .delete(`/api/categories/${id}`)
                .set('Authorization', token);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual("Category deleted");

            const getRes = await request(app)
                .get('/api/categories')
                .set('Authorization', token);
            expect(getRes.body.length).toEqual(0);
        });
    });
});
