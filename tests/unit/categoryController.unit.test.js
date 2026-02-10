const request = require('supertest');
const express = require('express');
const categoryRoutes = require('../../routes/categories');
const Category = require('../../models/Category');

jest.mock('../../models/Category');
jest.mock('../../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { _id: 'mockUserId' };
    next();
});

const app = express();
app.use(express.json());
app.use('/api/categories', categoryRoutes);

describe('Category Controller Unit Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/categories', () => {
        it('should return categories', async () => {
            Category.find.mockResolvedValue([{ name: 'Test' }]);
            const res = await request(app).get('/api/categories');
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
        });
    });

    describe('POST /api/categories', () => {
        it('should create category', async () => {
            const saveMock = jest.fn().mockResolvedValue({ name: 'New' });
            Category.mockImplementation((data) => ({ ...data, save: saveMock }));

            const res = await request(app).post('/api/categories').send({ name: 'New' });
            expect(res.statusCode).toBe(201);
            expect(saveMock).toHaveBeenCalled();
        });
    });

    describe('PUT /api/categories/:id', () => {
        it('should update category', async () => {
            Category.findOneAndUpdate.mockResolvedValue({ name: 'Updated' });
            const res = await request(app).put('/api/categories/1').send({ name: 'Updated' });
            expect(res.statusCode).toBe(200);
        });

        it('should return 404 if not found', async () => {
            Category.findOneAndUpdate.mockResolvedValue(null);
            const res = await request(app).put('/api/categories/999');
            expect(res.statusCode).toBe(404);
        });
    });

    describe('DELETE /api/categories/:id', () => {
        it('should delete category', async () => {
            Category.findOneAndDelete.mockResolvedValue({ _id: '1' });
            const res = await request(app).delete('/api/categories/1');
            expect(res.statusCode).toBe(200);
        });
    });
});
