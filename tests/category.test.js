const request = require("supertest");
const app = require("../src/app");

// Mock the Category model
jest.mock("../src/models/Category", () => ({
    create: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
}));

const Category = require("../src/models/Category");

describe("Category API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockCategory = {
        _id: "cat123",
        name: "Work",
        userId: "user123",
        color: "#ff0000",
    };

    describe("POST /api/categories", () => {
        it("should create a category", async () => {
            Category.create.mockResolvedValue(mockCategory);

            const res = await request(app).post("/api/categories").send({
                name: "Work",
                userId: "user123",
            });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty("_id", "cat123");
        });
    });

    describe("GET /api/categories/user/:userId", () => {
        it("should return user categories", async () => {
            Category.find.mockResolvedValue([mockCategory]);

            const res = await request(app).get("/api/categories/user/user123");

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBe(1);
            expect(Category.find).toHaveBeenCalledWith({ userId: "user123" });
        });
    });

    describe("PUT /api/categories/:id", () => {
        it("should update a category", async () => {
            Category.findByIdAndUpdate.mockResolvedValue({
                ...mockCategory,
                name: "Updated Work",
            });

            const res = await request(app)
                .put("/api/categories/cat123")
                .send({ name: "Updated Work" });

            expect(res.statusCode).toEqual(200);
            expect(res.body.name).toBe("Updated Work");
        });
    });

    describe("DELETE /api/categories/:id", () => {
        it("should delete a category", async () => {
            Category.findByIdAndDelete.mockResolvedValue(mockCategory);

            const res = await request(app).delete("/api/categories/cat123");

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe("Category deleted");
        });
    });
});
