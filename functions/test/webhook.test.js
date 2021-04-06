// FIREBASE_CONFIG and GOOGLE CLOUD PROJECT environment variables to initialize firebase-admin
const FIREBASE_CONFIG = require("../FIREBASE_CONFIG");
const test = require("firebase-functions-test")(FIREBASE_CONFIG, "./hi9-test-eb7977ba99cd.json");

const { expect } = require("chai");
const { webhook } = require("../index");
const request = require("supertest")(webhook);

describe("GET /users", () => {
    let response;

    before(async () => {
        response = await request.get("/users");
    })

    it("should return status code 200", () => {
        expect(response.status).to.be.equal(200);
    });

    it("should return a list of users", () => {
        expect(response.body).to.be.an("array").that.is.not.empty;
    });

    // GET /users/:id
    it("should return a specific user if an ID is passed as query param", async () => {
        const { body } = await request.get(`/users/mock`);

        expect(body).to.be.deep.equal({
            id: "mock",
            user: {
                username: "mock1",
                email: "mock1",
                age: 1
            }
        })
    });

    it("should return status code 500 if the query param is not a valid input", async () => {
        const { status } = await request.get("/users/fakeid");

        expect(status).to.equal(500);
    });
});

describe("POST /users", () => {
    let response;

    before(async () => {
        response = await request.post("/users").send({
            username: "mock1",
            email: "mock1",
            age: 1
        });
    });

    // Clean up after test cases are done
    after(async () => {
        await request.delete(`/users/${response.body.id}`)
    });

    it("should return status code 201", () => {
        expect(response.status).to.equal(201);
    });

    it("should create a new record in the database", async () => {
        const { body: { user } } = await request.get(`/users/${response.body.id}`);

        expect(user).to.be.deep.equal({
            username: "mock1",
            email: "mock1",
            age: 1
        });
    });

    it("should return status code 500 if the request body is not valid", async () => {
        const invalidResponse = await request.post("/users").send({
            username: "",
            email: "",
            age: 0
        });

        expect(invalidResponse.status).to.be.equal(500);
    })
});

describe("PUT /users/:id", () => {
    let response;

    before(async () => {
        response = await request.put("/users/mock").send({
            username: "mock2"
        });
    });

    // After all tests restore default value for testing validation in the GET /users/:id test case
    after(async () => {
        await request.put("/users/mock").send({
            username: "mock1"
        });
    })

    it("should return status code 200", () => {
        expect(response.status).to.be.equal(200);
    });

    it("should update the specified record", () => {
        expect(response.body.user).to.be.deep.equal({
            username: "mock2",
            email: "mock1",
            age: 1
        });
    });

    it("should return status code 404 if the ID query param is missing", async () => {
        const invalidResponse = await request.put("/users");

        expect(invalidResponse.status).to.be.equal(404);
    });

    it("should create a new record if the user with the specified ID does not exist in the database", async () => {
        const newUserPut = await request.put("/users/mock2").send({
            username: "mock2",
            email: "mock2",
            age: 2
        });

        expect(newUserPut.body.user).to.be.deep.equal({
            username: "mock2",
            email: "mock2",
            age: 2
        });

        // Clean up
        await request.delete("/users/mock2")
    })
});

describe("DELETE /users/:id", () => {
    let response;
    let sampleUser;

    before(async () => {
        sampleUser = await request.post("/users").send({
            username: "mock2",
            email: "mock2",
            age: 2
        });

        response = await request.delete(`/users/${sampleUser.body.id}`);
    });

    it("should return status code 200", () => {
        expect(response.status).to.be.equal(200);
    });

    it("should return the ID of the user deleted", () => {
        expect(response.body.id).to.be.equal(sampleUser.body.id);
    });

    it("should return status code 404 if the ID query param is missing", async () => {
        const invalidResponse = await request.delete("/users");

        expect(invalidResponse.status).to.be.equal(404);
    })
})