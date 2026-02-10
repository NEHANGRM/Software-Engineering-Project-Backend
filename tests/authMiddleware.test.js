const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            header: jest.fn()
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    it('should call next() with a valid Bearer token', () => {
        req.header.mockReturnValue('Bearer validToken123');

        const mockPayload = { _id: 'userId123' };
        jwt.verify.mockReturnValue(mockPayload);

        authMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('validToken123', 'test-secret');
        expect(req.user).toEqual(mockPayload);
        expect(next).toHaveBeenCalled();
    });

    it('should return 401 if no Authorization header is present', () => {
        req.header.mockReturnValue(null);

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access Denied' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if token is invalid', () => {
        req.header.mockReturnValue('Bearer invalidToken');

        jwt.verify.mockImplementation(() => {
            throw new Error('jwt malformed');
        });

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Token' });
        expect(next).not.toHaveBeenCalled();
    });
});
