const attendanceController = require('../controllers/attendanceController');
const AttendanceRecord = require('../models/AttendanceRecord');

// Mock the model
jest.mock('../models/AttendanceRecord');

describe('Attendance Controller', () => {
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
    //  getAttendance
    // ──────────────────────────────────────────
    describe('getAttendance', () => {
        it('should return all attendance records for the user', async () => {
            const mockRecords = [
                { _id: 'rec1', courseName: 'Math', status: 'present', userId: 'userId123' },
                { _id: 'rec2', courseName: 'Physics', status: 'absent', userId: 'userId123' }
            ];

            AttendanceRecord.find.mockResolvedValue(mockRecords);

            await attendanceController.getAttendance(req, res);

            expect(AttendanceRecord.find).toHaveBeenCalledWith({ userId: 'userId123' });
            expect(res.json).toHaveBeenCalledWith(mockRecords);
        });

        it('should return 500 on database error', async () => {
            AttendanceRecord.find.mockRejectedValue(new Error('DB Error'));

            await attendanceController.getAttendance(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
        });
    });

    // ──────────────────────────────────────────
    //  markAttendance (upsert)
    // ──────────────────────────────────────────
    describe('markAttendance', () => {
        it('should create a new attendance record (upsert – insert)', async () => {
            req.body = {
                courseName: 'Math',
                date: '2026-02-10',
                status: 'present'
            };

            const mockRecord = {
                _id: 'rec1',
                userId: 'userId123',
                courseName: 'Math',
                date: new Date('2026-02-10'),
                status: 'present'
            };

            AttendanceRecord.findOneAndUpdate.mockResolvedValue(mockRecord);

            await attendanceController.markAttendance(req, res);

            expect(AttendanceRecord.findOneAndUpdate).toHaveBeenCalledWith(
                {
                    userId: 'userId123',
                    courseName: 'Math',
                    date: new Date('2026-02-10')
                },
                { ...req.body, userId: 'userId123' },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockRecord);
        });

        it('should update an existing record for the same course and date (upsert – update)', async () => {
            req.body = {
                courseName: 'Math',
                date: '2026-02-10',
                status: 'late'
            };

            const updatedRecord = {
                _id: 'rec1',
                userId: 'userId123',
                courseName: 'Math',
                date: new Date('2026-02-10'),
                status: 'late'
            };

            AttendanceRecord.findOneAndUpdate.mockResolvedValue(updatedRecord);

            await attendanceController.markAttendance(req, res);

            expect(AttendanceRecord.findOneAndUpdate).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedRecord);
        });

        it('should return 500 on database error', async () => {
            req.body = { courseName: 'Math', date: '2026-02-10', status: 'present' };

            AttendanceRecord.findOneAndUpdate.mockRejectedValue(new Error('DB Error'));

            await attendanceController.markAttendance(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
        });
    });

    // ──────────────────────────────────────────
    //  deleteAttendance
    // ──────────────────────────────────────────
    describe('deleteAttendance', () => {
        it('should delete a record and return success message', async () => {
            req.params.id = 'rec1';

            AttendanceRecord.findOneAndDelete.mockResolvedValue({ _id: 'rec1' });

            await attendanceController.deleteAttendance(req, res);

            expect(AttendanceRecord.findOneAndDelete).toHaveBeenCalledWith({
                _id: 'rec1',
                userId: 'userId123'
            });
            expect(res.json).toHaveBeenCalledWith({ message: 'Record deleted' });
        });

        it('should return 404 if record not found', async () => {
            req.params.id = 'nonexistent';

            AttendanceRecord.findOneAndDelete.mockResolvedValue(null);

            await attendanceController.deleteAttendance(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Record not found' });
        });

        it('should return 500 on database error', async () => {
            req.params.id = 'rec1';

            AttendanceRecord.findOneAndDelete.mockRejectedValue(new Error('DB Error'));

            await attendanceController.deleteAttendance(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
        });
    });

    // ──────────────────────────────────────────
    //  getAttendanceStats
    // ──────────────────────────────────────────
    describe('getAttendanceStats', () => {
        it('should group stats by courseName with correct counts', async () => {
            const mockRecords = [
                { courseName: 'Math', status: 'present' },
                { courseName: 'Math', status: 'present' },
                { courseName: 'Math', status: 'absent' },
                { courseName: 'Physics', status: 'late' },
                { courseName: 'Physics', status: 'present' }
            ];

            AttendanceRecord.find.mockResolvedValue(mockRecords);

            await attendanceController.getAttendanceStats(req, res);

            expect(res.json).toHaveBeenCalledWith({
                Math: { total: 3, present: 2, absent: 1, late: 0, excused: 0 },
                Physics: { total: 2, present: 1, absent: 0, late: 1, excused: 0 }
            });
        });

        it('should exclude cancelled records from totals', async () => {
            const mockRecords = [
                { courseName: 'Math', status: 'present' },
                { courseName: 'Math', status: 'cancelled' },
                { courseName: 'Math', status: 'absent' }
            ];

            AttendanceRecord.find.mockResolvedValue(mockRecords);

            await attendanceController.getAttendanceStats(req, res);

            expect(res.json).toHaveBeenCalledWith({
                Math: { total: 2, present: 1, absent: 1, late: 0, excused: 0 }
            });
        });

        it('should return empty object when no records exist', async () => {
            AttendanceRecord.find.mockResolvedValue([]);

            await attendanceController.getAttendanceStats(req, res);

            expect(res.json).toHaveBeenCalledWith({});
        });

        it('should return 500 on database error', async () => {
            AttendanceRecord.find.mockRejectedValue(new Error('DB Error'));

            await attendanceController.getAttendanceStats(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
        });
    });
});
