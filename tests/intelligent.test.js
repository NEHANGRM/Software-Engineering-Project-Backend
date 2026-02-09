const request = require("supertest");
const app = require("../src/app");

// Mock Event model (Intelligence controller depends on Event)
jest.mock("../src/models/Event", () => ({
    find: jest.fn(),
}));

const Event = require("../src/models/Event");

describe("Intelligent Features API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/intelligence/overcommitment/:userId", () => {
        it("should detect overcommitment if hours > 8", async () => {
            // Mock events returning huge duration
            // 300 + 200 = 500 mins (> 480 threshold)
            Event.find.mockResolvedValue([
                {
                    classification: "assignment",
                    estimatedDuration: "300",
                    startTime: new Date(),
                    endTime: new Date(),
                },
                {
                    classification: "exam",
                    estimatedDuration: "200",
                    startTime: new Date(),
                    endTime: new Date(),
                },
            ]);

            const res = await request(app).get("/api/intelligence/overcommitment/user123");

            expect(res.statusCode).toEqual(200);
            expect(res.body.overcommitment).toBe(true);
            expect(res.body.totalWorkload).toBe(500);
        });

        it("should NOT detect overcommitment if hours < 8", async () => {
            Event.find.mockResolvedValue([
                {
                    classification: "assignment",
                    estimatedDuration: "60", // 1 hour
                    startTime: new Date(),
                    endTime: new Date(),
                },
            ]);

            const res = await request(app).get("/api/intelligence/overcommitment/user123");

            expect(res.statusCode).toEqual(200);
            expect(res.body.overcommitment).toBe(false);
        });
    });

    describe("GET /api/intelligence/procrastination/:userId", () => {
        it("should detect high procrastination if deadlines missed", async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            Event.find.mockResolvedValue([
                {
                    classification: "assignment",
                    isCompleted: false,
                    endTime: yesterday, // Missed deadline
                    startTime: yesterday,
                    createdAt: new Date(yesterday.getTime() - 86400000),
                },
            ]);

            const res = await request(app).get("/api/intelligence/procrastination/user123");

            expect(res.statusCode).toEqual(200);
            expect(res.body.missedDeadlines).toBe(1);
            // 1 missed out of 1 total = 100% procrastination score
            expect(res.body.procrastinationScore).toBe("100.0%");
        });
    });
});
