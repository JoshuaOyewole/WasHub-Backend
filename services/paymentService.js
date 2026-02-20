"use strict";
const { StatusCodes } = require("http-status-codes");
const axios = require('axios');
const TransactionModel = require("../models/Transaction.model");
const crypto = require("crypto");


exports.saveTransactionIntent = async (transactionData) => {
    console.log("Saving transaction intent:", transactionData);
    if (!transactionData) {
        throw new Error("Missing required transaction data");
    }
    try {

        // Save transaction intent to database (implementation depends on your database)
        await TransactionModel.create(transactionData);
    } catch (error) {
        console.error("save transaction intent error:", error);
        throw new Error("Failed to save transaction intent");

    }

}

exports.initiatePaystackPayment = async (payload) => {
    const { email, amount } = payload;
    const amountInKobo = amount * 100;
    const reference = crypto.randomUUID();// Generate a unique reference using crypto


    const params = JSON.stringify({
        "email": email,
        "amount": amountInKobo,
        "reference": reference, // Generate a unique reference

    });

    const response = await axios.post('https://api.paystack.co/transaction/initialize', params, {
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.data.status) {
        return ({
            status: false,
            error: "Failed to initialize payment: " + response.data.message,
        });
    }
    return {
        status: true,
        data: response.data.data,
    };
}
exports.verifyPayment = async (reference) => {
    if (!reference) {
        throw new Error("Reference is required");
    }
    try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });

        const data = response.data.data;
        return data;
    } catch (error) {
        return {
            error: error.message || "Failed to verify payment",
            status: false,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        };
    }
}

module.exports = {
    ...exports,
};

