const request = require('supertest');
const express = require('express');
const taskRoutes = require('../../routes/tasks');
const Task = require('../../models/Task');

// Mock the Task model
jest.mock('../../models/Task');

// Mock auth middleware to bypass real authentication
jest.mock('../../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { _id: 'mockUserId' };
    next();
});

const app = express();
app.use(express.json());
app.use('/api/tasks', taskRoutes);

describe('Task Controller Unit Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/tasks', () => {
        it('should return all tasks for the user', async () => {
            const mockTasks = [
                { _id: 'task1', title: 'Task 1', userId: 'mockUserId' },
                { _id: 'task2', title: 'Task 2', userId: 'mockUserId' }
            ];
            Task.find.mockResolvedValue(mockTasks);

            const res = await request(app).get('/api/tasks');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockTasks);
            expect(Task.find).toHaveBeenCalledWith({ userId: 'mockUserId' });
        });

        it('should handle errors', async () => {
            Task.find.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get('/api/tasks');

            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error', 'Database error');
        });
    });

    describe('POST /api/tasks', () => {
        it('should create a new task', async () => {
            const newTask = { title: 'New Task' };
            const savedTask = { _id: 'newTask', ...newTask, userId: 'mockUserId' };

            // Mock the save method on the instance
            Task.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue(savedTask)
            }));

            const res = await request(app).post('/api/tasks').send(newTask);

            expect(res.statusCode).toBe(201);
            // The controller returns the task object instance, which in our mock is just the object with save
            // Actually controller logic: const task = new Task(...); await task.save(); res.json(task);
            // So we need to ensure the mocked class returns an object that has the properties we expect.
            // Simplified mock:
        });
    });

    // Re-writing the POST test with better mock
    describe('POST /api/tasks (Refined)', () => {
        it('should create a new task', async () => {
            const taskData = { title: 'New Task', description: 'Test' };

            // We need to mock the constructor and the save method
            // When new Task() is called, it returns an object with save()
            // And also holds the data.
            const saveMock = jest.fn().mockResolvedValue();
            Task.mockImplementation((data) => ({
                ...data,
                save: saveMock
            }));

            const res = await request(app).post('/api/tasks').send(taskData);

            expect(res.statusCode).toBe(201);
            expect(res.body).toMatchObject(taskData);
            expect(res.body).toHaveProperty('userId', 'mockUserId');
            expect(saveMock).toHaveBeenCalled();
        });

        it('should handle creation errors', async () => {
            const saveMock = jest.fn().mockRejectedValue(new Error('Save failed'));
            Task.mockImplementation(() => ({
                save: saveMock
            }));

            const res = await request(app).post('/api/tasks').send({ title: 'Task' });

            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error', 'Save failed');
        });
    });

    describe('PUT /api/tasks/:id', () => {
        it('should update a task', async () => {
            const updatedTask = { _id: 'task1', title: 'Updated Task' };
            Task.findByIdAndUpdate.mockResolvedValue(updatedTask);

            const res = await request(app)
                .put('/api/tasks/task1')
                .send({ title: 'Updated Task' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(updatedTask);
            expect(Task.findByIdAndUpdate).toHaveBeenCalledWith(
                'task1',
                { title: 'Updated Task' },
                { new: true }
            );
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        it('should delete a task', async () => {
            Task.findByIdAndDelete.mockResolvedValue({ _id: 'task1' });

            const res = await request(app).delete('/api/tasks/task1');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('message', 'Task deleted');
            expect(Task.findByIdAndDelete).toHaveBeenCalledWith('task1');
        });
    });
});
