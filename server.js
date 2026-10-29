import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { taskModel } from './db.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        status: "Ok"
    });
});

app.post("/api/tasks", async (req, res) => {
    const { title, description, status } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
    }

    try {
        const task = await taskModel.create({ title, description, status });
        res.status(201).json({
            message: "Task created successfully.",
            task
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Failed to create task" });
    }
});

app.get("/api/tasks", async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);

    try {
        const tasks = await taskModel.find()
            .skip((page - 1) * limit)
            .limit(limit);
        const total = await taskModel.countDocuments();

        res.json({
            page,
            limit,
            total,
            tasks
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve tasks" });
    }
});

app.patch("/api/tasks/:id", async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid task ID" });
    }

    if (!status) {
        return res.status(400).json({ error: "Status is required" });
    }

    try {
        const task = await taskModel.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!task) {
            return res.status(404).json({
                error: "No such task exist with the provided task ID"
            });
        }

        res.json({
            message: "Task status updated.",
            task
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Failed to update task" });
    }
});

const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(3000, () => console.log("Server is listening on PORT 3000"));
    })
    .catch((err) => {
        console.log("Could not connect to MongoDB", err.message);
    });
