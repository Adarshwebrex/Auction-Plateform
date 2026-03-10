const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware.js");
const { getAdminStats, getAdminInsights, updateUserRole, deleteUser, getUser, unbanUser } = require("../controllers/adminController.js");
const { getAuditLogs } = require("../controllers/auditController.js");
const User = require("../models/User.js");
const Auction = require("../models/Auction.js");
const Notification = require("../models/Notification.js");
const Order = require("../models/Order.js");
const UserModel = require("../models/User.js");
const KycSubmission = require("../models/KycSubmission.js");

// ONLY ADMINS CAN ACCESS
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

/* ============================
      GET ADMIN STATS
   ============================ */
router.get("/stats", protect, adminOnly, getAdminStats);
router.get("/insights", protect, adminOnly, getAdminInsights);
router.get("/audit-logs", protect, adminOnly, getAuditLogs);

/* ============================
      GET ALL USERS
   ============================ */
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* ============================
     SELLER RANKINGS (ADMIN)
   ============================ */
router.get("/seller-rankings", protect, adminOnly, async (req, res) => {
  try {
    const sortBy = (req.query.sortBy || "sold").toLowerCase(); // sold | revenue | auctions
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);

    // Aggregate sold items and revenue from orders
    const soldAgg = await Order.aggregate([
      { $match: { status: { $in: ["completed", "paid", "fulfilled"] } } },
      {
        $group: {
          _id: "$sellerId",
          soldCount: { $sum: 1 },
          revenue: { $sum: { $ifNull: ["$amount", 0] } },
        },
      },
    ]);

    // Count auctions hosted per seller
    const auctionsAgg = await Auction.aggregate([
      { $group: { _id: "$sellerId", auctionsHosted: { $sum: 1 } } },
    ]);

    // Merge maps
    const soldMap = new Map(soldAgg.map((x) => [String(x._id), x]));
    const aucMap = new Map(auctionsAgg.map((x) => [String(x._id), x]));

    // Collect all sellerIds from both
    const sellerIds = Array.from(
      new Set([...soldMap.keys(), ...aucMap.keys()])
    );

    // Fetch seller names
    const sellers = await User.find({ _id: { $in: sellerIds } }, "_id name email");
    const sellerMap = new Map(sellers.map((u) => [String(u._id), u]));

    const rows = sellerIds.map((sid) => {
      const s = soldMap.get(sid) || { soldCount: 0, revenue: 0 };
      const a = aucMap.get(sid) || { auctionsHosted: 0 };
      const u = sellerMap.get(sid);
      return {
        sellerId: sid,
        name: u?.name || "Unknown",
        email: u?.email || "",
        soldCount: s.soldCount || 0,
        revenue: s.revenue || 0,
        auctionsHosted: a.auctionsHosted || 0,
      };
    });

    const sortKey =
      sortBy === "revenue" ? "revenue" : sortBy === "auctions" ? "auctionsHosted" : "soldCount";
    rows.sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));

    // Add rank
    rows.forEach((r, i) => (r.rank = i + 1));

    const total = rows.length;
    const pages = Math.max(Math.ceil(total / Math.max(limit, 1)), 1);
    const start = (page - 1) * limit;
    const items = rows.slice(start, start + limit);

    res.json({ sortBy: sortKey, total, page, pages, limit, items });
  } catch (err) {
    console.error("Seller rankings error:", err);
    res.status(500).json({ message: "Failed to compute seller rankings" });
  }
});

/* ============================
      GET SINGLE USER
   ============================ */
router.get("/users/:userId", protect, adminOnly, getUser);
router.put("/users/:userId/unban", protect, adminOnly, unbanUser);

/* ============================
      UPDATE USER ROLE
   ============================ */
router.put("/users/:userId/role", protect, adminOnly, updateUserRole);

/* ============================
      DELETE USER
   ============================ */
router.delete("/users/:userId", protect, adminOnly, deleteUser);

/* ============================
      TOGGLE USER KYC
   ============================ */
router.put("/users/:userId/kyc", protect, adminOnly, async (req, res) => {
  try {
    const { verified } = req.body || {};
    const updated = await UserModel.findByIdAndUpdate(
      req.params.userId,
      { kycVerified: !!verified },
      { new: true }
    ).select("-password");
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json({ message: "KYC status updated", user: updated });
  } catch (e) {
    res.status(500).json({ message: "Failed to update KYC status" });
  }
});

/* ============================
      KYC SUBMISSIONS ADMIN
   ============================ */
// List submissions (optional ?status=pending|approved|rejected)
router.get("/kyc-submissions", protect, adminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const items = await KycSubmission.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name email kycVerified")
      .populate("reviewedBy", "name email");
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Failed to load KYC submissions" });
  }
});

// Approve submission
router.put("/kyc/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const sub = await KycSubmission.findByIdAndUpdate(
      req.params.id,
      { status: "approved", reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    );
    if (!sub) return res.status(404).json({ message: "Submission not found" });
    await UserModel.findByIdAndUpdate(sub.userId, { kycVerified: true, kycRequested: false });
    res.json({ message: "KYC approved", submission: sub });
  } catch (e) {
    res.status(500).json({ message: "Failed to approve KYC" });
  }
});

// Reject submission
router.put("/kyc/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const note = (req.body && req.body.note) || "";
    const sub = await KycSubmission.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", reviewedBy: req.user._id, reviewedAt: new Date(), note },
      { new: true }
    );
    if (!sub) return res.status(404).json({ message: "Submission not found" });
    await UserModel.findByIdAndUpdate(sub.userId, { kycVerified: false, kycRequested: false });
    res.json({ message: "KYC rejected", submission: sub });
  } catch (e) {
    res.status(500).json({ message: "Failed to reject KYC" });
  }
});

/* ============================
      GET ALL AUCTIONS
   ============================ */
router.get("/auctions", protect, adminOnly, async (req, res) => {
  try {
    const auctions = await Auction.find();
    res.json(auctions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch auctions" });
  }
});

/* ============================
     GET ALL ORDERS (ADMIN)
   ============================ */
router.get("/orders", protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("buyerId", "name email")
      .populate("sellerId", "name email")
      .populate("auctionId");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

/* ============================
      GET ALL NOTIFICATIONS (ADMIN)
   ============================ */
router.get("/notifications", protect, adminOnly, async (req, res) => {
  try {
    const notifs = await Notification.find().sort({ createdAt: -1 }).populate("userId", "name email");
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

/* ============================
      TEST: EMIT NOTIFICATION TO USER (ADMIN)
   ============================ */
router.post("/notify-test", protect, adminOnly, async (req, res) => {
  try {
    const { userId, message, link } = req.body;
    if (!userId || !message) return res.status(400).json({ message: "userId and message required" });

    // create and emit using existing controller helper
    const notifyCtrl = require("../controllers/notificationController");
    const created = await notifyCtrl.createNotification({ userId, message, link });

    res.json({ message: "Notification sent", created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send notification" });
  }
});

module.exports = router;
