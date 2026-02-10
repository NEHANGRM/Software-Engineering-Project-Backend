const authController = require('../controllers/authController');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            req.body = { name: 'Test User', email: 'test@example.com', password: 'password123' };

            // Mock User.findOne to return null (user doesn't exist)
            User.findOne.mockResolvedValue(null);

            // Mock bcrypt.genSalt and hash
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedPassword');

            // Mock User constructor and save
            const mockSave = jest.fn();
            User.mockImplementation(() => ({
                save: mockSave,
                _id: 'newUserId',
                name: 'Test User',
                email: 'test@example.com'
            }));

            // Mock jwt.sign
            jwt.sign.mockReturnValue('validToken');

            await authController.register(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(mockSave).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                token: 'validToken',
                user: expect.objectContaining({ email: 'test@example.com' })
            }));
        });

        it('should return 400 if email already exists', async () => {
            req.body = { email: 'existing@example.com', password: 'password123' };

            User.findOne.mockResolvedValue({ email: 'existing@example.com' });

            await authController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Email already exists" });
        });
    });

    describe('login', () => {
        it('should login successfully with correct credentials', async () => {
            req.body = { email: 'test@example.com', password: 'password123' };

            const mockUser = {
                _id: 'userId',
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashedPassword'
            };

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('validToken');

            await authController.login(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                token: 'validToken',
                user: expect.objectContaining({ email: 'test@example.com' })
            }));
        });

        it('should return 400 for invalid credentials', async () => {
            req.body = { email: 'test@example.com', password: 'wrongpassword' };

            const mockUser = {
                password: 'hashedPassword'
            };

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false); // Password mismatch

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
        });

        it('should return 400 if user not found', async () => {
            req.body = { email: 'nonexistent@example.com', password: 'password123' };

            User.findOne.mockResolvedValue(null);

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
        });
    });
});
