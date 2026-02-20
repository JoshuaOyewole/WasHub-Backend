const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
    },


    reference: {
        type: String,
        required: [true, "Reference is required"],
        unique: true,
    },
    details: {
        gateway: {
            type: String,
            enum: ["paystack", "flutterwave", "stripe"],
            required: [true, "Payment gateway is required"],
        },
        purpose: {
            type: String,
            required: [true, "Purpose is required"],
            enum: ["wash_request", "subscription", "other"],
        },
    },
    status: {
        type: String,
        enum: ["initiated", "completed", "cancelled"],
        default: "initiated",
    },
    granted: {
        type: Boolean,
        default: false,
    },
    paidAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const TransactionModel = mongoose.model("Transaction", transactionSchema);

module.exports = TransactionModel;