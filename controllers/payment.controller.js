const { StatusCodes } = require("http-status-codes");
const axios = require('axios');
const crypto = require("crypto");
const { saveTransactionIntentWithRetry } = require("../utils/helpers");
const { grantDigitalGoodForWashService } = require("../services/WashRequestService");
const secret = process.env.PAYSTACK_SECRET_KEY;
const TransactionModel = require("../models/Transaction.model");

exports.initiatePaystackPayment = async (req, res) => {
    try {
        const { email, amount } = req.body;
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
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: false,
                error: "Failed to initialize payment: " + response.data.message,
            });
        }

        //return response from paystack to client
        const payload = {
            status: true,
            message: "Payment initialized successfully",
            data: response.data
        };

        // Save transaction intent in background (must not affect API response)
        saveTransactionIntentWithRetry({
            email,
            userId: req.user.id,
            amount: amountInKobo,
            reference: response.data.data.reference,
            details: {
                authorization_url: response.data.data.authorization_url,
                purpose: "wash_request",
                gateway: "paystack",
            },
            status: "initiated",
        });

        return res.status(StatusCodes.OK).json(payload);
        //check response from paystack and return appropriate response to client


    } catch (error) {
        console.error("initialize payment error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: false,
            error: "Internal server error",
        });
    }
}

exports.processTransaction = async (reference) => {
    try {
        const tx = await TransactionModel.findOneAndUpdate(
            {
                reference,
                status: "completed",
                granted: { $ne: true },
            },
            {
                $set: {
                    granted: true,
                },
            },
            {
                new: true,
            }
        );

        if (!tx) return;

        const washRequest = await grantDigitalGoodForWashService(reference);
        return washRequest;

    } catch (err) {
        console.error("Transaction failed:", err);
    }
}

exports.verifyPaystackPayment = async (req, res) => {

    try {

        // 🔐 Verify signature
        const hash = crypto
            .createHmac("sha512", secret)
            .update(req.body)
            .digest("hex");

        const signature = req.headers["x-paystack-signature"];

        if (hash !== signature) {
            console.error("Invalid Paystack signature");
            return res.sendStatus(400);
        }

        const event = JSON.parse(req.body.toString());

        // Only handle successful charges
        if (event.event !== "charge.success") {
            return res.sendStatus(200);
        }

        const reference = event.data.reference;
        const paidAmount = event.data.amount; // amount in kobo
        // 🔎 Find transaction
        const transaction = await TransactionModel.findOne({ reference });

        if (!transaction) {
            return res.sendStatus(200); // prevent retries
        }

        // 🛑 Idempotency check
        if (transaction.status === "completed") {
            return res.sendStatus(200);
        }
        let transactionAmount = Number(transaction.amount * 100 || 0);
        console.log("Paid Amount:", paidAmount, "Expected Amount:", transactionAmount);
        // 🔒 Validate amount
        if (paidAmount !== transactionAmount) {
            console.error("Amount mismatch!");
            transaction.status = "cancelled";
            await transaction.save();
            return res.sendStatus(200);
        }

        // ✅ Mark success
        transaction.status = "completed";
        transaction.paidAt = new Date();
        await transaction.save();

        //perform post-payment actions (e.g. grant digital good, send email, etc.)
        await exports.processTransaction(reference);

        return res.sendStatus(200);

    } catch (error) {
        console.error("Webhook error:", error);
        return res.sendStatus(500);
    }

}

exports.verifyPaystackPaymentByReference = async (req, res) => {

    try {
        const { reference } = req.params;

        if (!reference) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: false,
                error: "Reference is required",
            });
        }

        const verificationResponse = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        if (!verificationResponse.data?.status) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: false,
                error: verificationResponse.data?.message || "Payment verification failed",
            });
        }

        const paymentData = verificationResponse.data.data;
        const transaction = await TransactionModel.findOne({ reference });

        if (!transaction) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: false,
                error: "Transaction not found",
            });
        }

        // Idempotent success response
        if (transaction.status === "completed") {
            return res.status(StatusCodes.OK).json({
                status: true,
                message: "Payment already verified",
                data: paymentData,
            });
        }

        const paidAmount = Number(paymentData.amount || 0);
        const expectedAmount = Number(transaction.amount || 0);

        const isSuccessful = paymentData.status === "success";
        const isAmountMatch =
            paidAmount === expectedAmount || paidAmount === (expectedAmount * 100);

        if (!isSuccessful || !isAmountMatch) {
            transaction.status = "cancelled";
            await transaction.save();

            return res.status(StatusCodes.BAD_REQUEST).json({
                status: false,
                error: !isSuccessful ? "Payment not successful" : "Amount mismatch",
                data: paymentData,
            });
        }

        transaction.status = "completed";
        transaction.paidAt = new Date();
        await transaction.save();

        await exports.processTransaction(reference);

        return res.status(StatusCodes.OK).json({
            status: true,
            message: "Payment verified successfully",
            data: paymentData,
        });

    } catch (error) {
        console.error("Verify payment by reference error:", error?.response?.data || error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: false,
            error: "Internal server error",
        });
    }
}
