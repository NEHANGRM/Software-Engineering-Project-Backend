const timetableController = require('../controllers/timetableController');
const TimetableEntry = require('../models/TimetableEntry');

// Mock the model
jest.mock('../models/TimetableEntry');

describe('Timetable Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { _id: 'userId123' },
            body: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    // ──────────────────────────────────────────
    //  getTimetable
    // ──────────────────────────────────────────
    describe('getTimetable', () => {
        it('should return all timetable entries for the user', async () => {
            const mockEntries = [
                { _id: 'e1', courseName: 'Math', startTime: '09:00', endTime: '10:00', daysOfWeek: [1, 3] },
                { _id: 'e2', courseName: 'Physics', startTime: '11:00', endTime: '12:00', daysOfWeek: [2, 4] }
            ];

            TimetableEntry.find.mockResolvedValue(mockEntries);

            await timetableController.getTimetable(req, res);

            expect(TimetableEntry.find).toHaveBeenCalledWith({ userId: 'userId123' });
            expect(res.json).toHaveBeenCalledWith(mockEntries);
        });

        it('should return 500 on database error', async () => {
            TimetableEntry.find.mockRejectedValue(new Error('DB Error'));

            await timetableController.getTimetable(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
        });
    });

    // ──────────────────────────────────────────
    //  createTimetableEntry
    // ──────────────────────────────────────────
    describe('createTimetableEntry', () => {
        it('should create a timetable entry and return 201', async () => {
            req.body = {
                courseName: 'Math',
                courseCode: 'MATH101',
                instructor: 'Dr. Smith',
                room: 'Room 301',
                daysOfWeek: [1, 3, 5],
                startTime: '09:00',
                endTime: '10:00'
            };

            const mockEntry = { _id: 'e1', ...req.body, userId: 'userId123' };
            const mockSave = jest.fn().mockResolvedValue(mockEntry);

            TimetableEntry.mockImplementation(() => ({
                ...mockEntry,
                save: mockSave
            }));

            await timetableController.createTimetableEntry(req, res);

            expect(mockSave).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should return 500 on save failure', async () => {
            req.body = {
                courseName: 'Math',
                daysOfWeek: [1],
                startTime: '09:00',
                endTime: '10:00'
            };

            TimetableEntry.mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(new Error('Save failed'))
            }));

            await timetableController.createTimetableEntry(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Save failed' });
        });
    });

    // ──────────────────────────────────────────
    //  updateTimetableEntry
    // ──────────────────────────────────────────
    describe('updateTimetableEntry', () => {
        it('should update and return the entry', async () => {
            req.params.id = 'e1';
            req.body = { courseName: 'Advanced Math' };

            const updatedEntry = { _id: 'e1', courseName: 'Advanced Math', userId: 'userId123' };

            TimetableEntry.findOneAndUpdate.mockResolvedValue(updatedEntry);

            await timetableController.updateTimetableEntry(req, res);

            expect(TimetableEntry.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'e1', userId: 'userId123' },
                req.body,
                { new: true }
            );
            expect(res.json).toHaveBeenCalledWith(updatedEntry);
        });

        it('should return 404 if entry not found', async () => {
            req.params.id = 'nonexistent';
            req.body = { courseName: 'Math' };

            TimetableEntry.findOneAndUpdate.mockResolvedValue(null);

            await timetableController.updateTimetableEntry(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Entry not found' });
        });

        it('should return 500 on database error', async () => {
            req.params.id = 'e1';
            req.body = { courseName: 'Math' };

            TimetableEntry.findOneAndUpdate.mockRejectedValue(new Error('DB Error'));

            await timetableController.updateTimetableEntry(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
        });
    });

    // ──────────────────────────────────────────
    //  deleteTimetableEntry
    // ──────────────────────────────────────────
    describe('deleteTimetableEntry', () => {
        it('should delete and return success message', async () => {
            req.params.id = 'e1';

            TimetableEntry.findOneAndDelete.mockResolvedValue({ _id: 'e1' });

            await timetableController.deleteTimetableEntry(req, res);

            expect(TimetableEntry.findOneAndDelete).toHaveBeenCalledWith({
                _id: 'e1',
                userId: 'userId123'
            });
            expect(res.json).toHaveBeenCalledWith({ message: 'Entry deleted' });
        });

        it('should return 404 if entry not found', async () => {
            req.params.id = 'nonexistent';

            TimetableEntry.findOneAndDelete.mockResolvedValue(null);

            await timetableController.deleteTimetableEntry(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Entry not found' });
        });

        it('should return 500 on database error', async () => {
            req.params.id = 'e1';

            TimetableEntry.findOneAndDelete.mockRejectedValue(new Error('DB Error'));

            await timetableController.deleteTimetableEntry(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
        });
    });
});
