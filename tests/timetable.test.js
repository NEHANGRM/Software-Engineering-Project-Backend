const request = require("supertest");
const app = require("../src/app");

// Mock the TimetableEntry model
jest.mock("../src/models/TimetableEntry", () => ({
    create: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
}));

const TimetableEntry = require("../src/models/TimetableEntry");

describe("Timetable API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockEntry = {
        _id: "time123",
        courseName: "Math",
        userId: "user123",
        startTime: new Date(),
        endTime: new Date(),
        daysOfWeek: [1, 3],
    };

    describe("POST /api/timetable", () => {
        it("should create a timetable entry", async () => {
            TimetableEntry.create.mockResolvedValue(mockEntry);

            const res = await request(app).post("/api/timetable").send({
                courseName: "Math",
                userId: "user123",
                startTime: new Date(),
                endTime: new Date(),
            });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty("_id", "time123");
        });
    });

    describe("GET /api/timetable/user/:userId", () => {
        it("should fetch timetable", async () => {
            TimetableEntry.find.mockResolvedValue([mockEntry]);

            const res = await request(app).get("/api/timetable/user/user123");

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBe(1);
        });
    });

    describe("PUT /api/timetable/:id", () => {
        it("should update entry", async () => {
            TimetableEntry.findByIdAndUpdate.mockResolvedValue({
                ...mockEntry,
                courseName: "Advanced Math",
            });

            const res = await request(app)
                .put("/api/timetable/time123")
                .send({ courseName: "Advanced Math" });

            expect(res.statusCode).toEqual(200);
            expect(res.body.courseName).toBe("Advanced Math");
        });
    });

    describe("DELETE /api/timetable/:id", () => {
        it("should delete entry", async () => {
            TimetableEntry.findByIdAndDelete.mockResolvedValue(mockEntry);

            const res = await request(app).delete("/api/timetable/time123");

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe("Entry deleted");
        });
    });
});
