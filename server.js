require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


// ================= MONGODB SCHEMA =================

const expenseSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true,
            trim: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        participants: {
            type: [String],
            required: true
        },

        paidBy: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true,
        collection: "expense"
    }
);

const Expense = mongoose.model("Expense", expenseSchema);


// ================= HOME PAGE =================

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});


// ================= GET ALL EXPENSES =================

app.get("/api/expenses", async function(req, res) {

    try {

        const expenses = await Expense
            .find()
            .sort({ createdAt: -1 });

        res.json(expenses);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load expenses"
        });

    }

});


// ================= ADD EXPENSE =================

app.post("/api/expenses", async function(req, res) {

    try {

        const {
            description,
            amount,
            category,
            participants,
            paidBy
        } = req.body;


        // Check required details

        if (
            !description ||
            !amount ||
            !category ||
            !Array.isArray(participants) ||
            participants.length < 2 ||
            !paidBy
        ) {

            return res.status(400).json({
                message: "Please provide all expense details"
            });

        }


        // Remove empty names and duplicates

        const cleanParticipants = [
            ...new Set(
                participants
                    .map(name => name.trim())
                    .filter(Boolean)
            )
        ];


        // At least 2 people required

        if (cleanParticipants.length < 2) {

            return res.status(400).json({
                message: "At least two participants are required"
            });

        }


        // Payer must be a participant

        if (!cleanParticipants.includes(paidBy)) {

            return res.status(400).json({
                message: "Payer must be one of the participants"
            });

        }


        // Create expense

        const expense = await Expense.create({

            description: description.trim(),

            amount: Number(amount),

            category: category.trim(),

            participants: cleanParticipants,

            paidBy: paidBy.trim()

        });


        res.status(201).json(expense);


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to save expense"
        });

    }

});


// ================= DELETE ONE EXPENSE =================

app.delete("/api/expenses/:id", async function(req, res) {

    try {

        const deleted =
            await Expense.findByIdAndDelete(
                req.params.id
            );


        if (!deleted) {

            return res.status(404).json({
                message: "Expense not found"
            });

        }


        res.json({
            message: "Expense deleted successfully"
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to delete expense"
        });

    }

});


// ================= DELETE ALL EXPENSES =================

app.delete("/api/expenses", async function(req, res) {

    try {

        await Expense.deleteMany({});

        res.json({
            message: "All expenses cleared"
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to clear expenses"
        });

    }

});


// ================= START SERVER =================

async function startServer() {

    try {

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log(
            "MongoDB connected successfully"
        );


        app.listen(PORT, function() {

            console.log(
                `Server running at http://localhost:${PORT}`
            );

        });


    } catch (error) {

        console.error(
            "MongoDB connection failed:",
            error.message
        );

    }

}

startServer();
