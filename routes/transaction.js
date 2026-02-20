const express = require("express")
const router = express.Router();

const { getTokenFromHeaders, userOnly } = require("../middlewares/auth");
const { initiatePaystackPayment, verifyPaystackPayment, verifyPaystackPaymentByReference } = require("../controllers/payment.controller");


router.post("/paystack/webhook", verifyPaystackPayment);

router.use(getTokenFromHeaders);
router.use(userOnly);


router.post("/initiate", initiatePaystackPayment);
router.get("/verify/:reference", verifyPaystackPaymentByReference);


module.exports = router;