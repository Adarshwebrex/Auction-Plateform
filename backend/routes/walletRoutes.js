const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { adminOnly } = require("../middlewares/adminMiddleware");
const { deposit, withdraw, history, adminListRequests, adminApproveRequest, adminRejectRequest } = require("../controllers/walletController");
const { requestWithdrawalOtp, limits } = require("../controllers/walletController");

// POST /api/wallet/deposit
router.post("/deposit", protect, deposit);

// POST /api/wallet/withdraw
router.post("/withdraw", protect, withdraw);
router.post("/request-otp", protect, requestWithdrawalOtp);
// GET /api/wallet/limits
router.get("/limits", protect, limits);

// GET /api/wallet/history?limit=10
router.get("/history", protect, history);
router.get("/requests", protect, require("../controllers/walletController").userRequests);

// Admin endpoints for high-value approvals
router.get("/admin/requests", protect, adminOnly, adminListRequests);
router.put("/admin/requests/:id/approve", protect, adminOnly, adminApproveRequest);
router.put("/admin/requests/:id/reject", protect, adminOnly, adminRejectRequest);

module.exports = router;
