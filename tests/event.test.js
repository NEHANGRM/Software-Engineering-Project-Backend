const request = require("supertest");
const app = require("../src/app");

// Mock the Event model
jest.mock("../src/models/Event", () => ({
    create: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
}));

const Event = require("../src/models/Event");

describe("Event API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockEvent = {
        _id: "evt123",
        title: "Test Event",
        userId: "user123",
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
    };

    describe("POST /api/events", () => {
        it("should create a new event", async () => {
            Event.create.mockResolvedValue(mockEvent);

            const res = await request(app).post("/api/events").send({
                userId: "user123",
                title: "Test Event",
                startTime: new Date().toISOString(),
            });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty("_id", "evt123");
            expect(Event.create).toHaveBeenCalled();
        });

        it("should fail if required fields are missing", async () => {
            const res = await request(app).post("/api/events").send({
                title: "Incomplete Event",
            });

            expect(res.statusCode).toEqual(400);
        });
    });

    describe("GET /api/events/user/:userId", () => {
        it("should return events for a user", async () => {
            // Mock chaining sort()
            const mockFind = {
                sort: jest.fn().mockResolvedValue([mockEvent]),
            };
            Event.find.mockReturnValue(mockFind);

            const res = await request(app).get("/api/events/user/user123");

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBe(1);
            expect(Event.find).toHaveBeenCalledWith({ userId: "user123" });
        });
    });

    describe("PUT /api/events/:id", () => {
        it("should update an event", async () => {
            Event.findByIdAndUpdate.mockResolvedValue({
                ...mockEvent,
                title: "Updated Title",
            });

            const res = await request(app)
                .put("/api/events/evt123")
                .send({ title: "Updated Title" });

            expect(res.statusCode).toEqual(200);
            expect(res.body.title).toBe("Updated Title");
        });
    });

    describe("DELETE /api/events/:id", () => {
        it("should delete an event", async () => {
            Event.findByIdAndDelete.mockResolvedValue(mockEvent);

            const res = await request(app).delete("/api/events/evt123");

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe("Event deleted successfully");
        });
    });
});
