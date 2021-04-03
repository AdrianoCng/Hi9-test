const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");

// Initialize firebase
admin.initializeApp(functions.config().firebase);

// Initialize Firestore Database
const db = admin.firestore();

const app = express();

// Use json as main parser for processing requests body
app.use(express.json());

// Export Cloud Function passing our Express server to handle requests
exports.webhook = functions.https.onRequest(app);

// CREATE RECORD
app.post("/users", async (req, res) => {
    try {
        const { username, email, age } = req.body;

        const data = {
            username,
            email,
            age
        };

        const userRef = await db.collection("users").add(data);

        const user = await userRef.get();

        res.status(201).json({
            id: userRef.id,
            user: user.data()
        });

    } catch (error) {
        res.status(500).send(error);
    };
});

// READ RECORD BY ID
app.get("/users/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if (!id) throw new Error("id is required");

        const user = await db.collection("users").doc(id).get();

        if (!user.exists) throw new Error("User does not exist");

        res.status(200).json({
            id: user.id,
            user: user.data()
        });
    } catch (error) {
        res.status(500).send(error);
    };
});

// READ ALL RECORDS
app.get("/users", async (req, res) => {
    try {
        const users = [];

        const snapshots = await db.collection("users").get();

        snapshots.forEach(doc => {
            users.push({
                id: doc.id,
                user: doc.data()
            });
        });

        res.status(200).json(users);
    } catch (error) {
        res.status(500).send(error);
    };
});

// UPDATE RECORD
app.put("/users/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if (!id) throw new Error("ID is required");

        await db.collection("users").doc(id).set(req.body, { merge: true });

        const user = await db.collection("users").doc(id).get();

        res.status(200).json({
            id,
            user: user.data()
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

// DELETE RECORD
app.delete("/users/:id", async (req, res) => {
    try {
        const id = req.params.id;

        await db.collection("users").doc(id).delete();

        res.status(200).json({
            id
        });
    } catch (error) {
        res.status(500).send(error);
    };
});