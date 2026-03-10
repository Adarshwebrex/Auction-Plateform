const express = require("express");

// FIXED: correct folder name "middleware"
const { protect } = require("../middlewares/authMiddleware.js");

const Auction = require("../models/Auction.js");
const Order = require("../models/Order.js");
const User = require("../models/User.js");
const KycSubmission = require("../models/KycSubmission.js");
const cloudinary = require("../config/cloudinary.js");
const upload = require("../middlewares/uploadImage.js");

const {
  getSellerAuctions,
  getSellerOrders,
  getSellerStats,
  getSellerSalesGraph,
} = require("../controllers/sellerController.js");
const { getSellerWallet } = require("../controllers/sellerController.js");

const router = express.Router();

// ROLE CHECK
const sellerOnly = (req, res, next) => {
  if (req.user.role !== "seller") {
    return res.status(403).json({ message: "Access denied: Seller only" });
  }
  next();
};

// ---------------------------
// GET ALL AUCTIONS BY SELLER
// ---------------------------
router.get("/my-auctions", protect, sellerOnly, async (req, res) => {
  const auctions = await Auction.find({ sellerId: req.user._id });
  res.json(auctions);
});

// OPTIONAL CONTROLLER ROUTES (KEEP IF YOU HAVE THEM)
router.get("/auctions", protect, sellerOnly, getSellerAuctions);
router.get("/orders", protect, sellerOnly, getSellerOrders);
router.get("/stats", protect, sellerOnly, getSellerStats);
router.get("/wallet", protect, sellerOnly, getSellerWallet);
router.get("/sales-graph", protect, sellerOnly, getSellerSalesGraph);

// ---------------------------
// REQUEST KYC VERIFICATION
// ---------------------------
router.post("/kyc/request", protect, sellerOnly, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { kycRequested: true },
      { new: true }
    ).select("-password");
    res.json({ message: "KYC request submitted", user: updated });
  } catch (e) {
    res.status(500).json({ message: "Failed to submit KYC request" });
  }
});

// ---------------------------
// SUBMIT KYC DOCUMENTS
// ---------------------------
router.post(
  "/kyc/submit",
  protect,
  sellerOnly,
  upload.memory.fields([
    { name: "idProof", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
    { name: "bankProof", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files || {};
      async function uploadBuf(file, folder) {
        if (!file || !file[0] || !file[0].buffer) return "";
        const f = file[0];
        const dataUri = `data:${f.mimetype};base64,${f.buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: folder || "kyc",
          public_id: `${Date.now()}-${f.originalname}`,
        });
        return result.secure_url || result.url || "";
      }

      const [idProofUrl, addressProofUrl, bankProofUrl] = await Promise.all([
        uploadBuf(files.idProof, "kyc"),
        uploadBuf(files.addressProof, "kyc"),
        uploadBuf(files.bankProof, "kyc"),
      ]);

      const note = (req.body && req.body.note) || "";

      const sub = await KycSubmission.create({
        userId: req.user._id,
        idProofUrl,
        addressProofUrl,
        bankProofUrl,
        note,
      });

      await User.findByIdAndUpdate(req.user._id, { kycRequested: true });

      res.status(201).json({ message: "KYC submitted", submission: sub });
    } catch (e) {
      console.error("KYC submit error", e);
      res.status(500).json({ message: "Failed to submit KYC" });
    }
  }
);

// ---------------------------
// GET KYC STATUS (ME)
// ---------------------------
router.get("/kyc/status", protect, sellerOnly, async (req, res) => {
  try {
    const latest = await KycSubmission.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("status createdAt reviewedAt note");
    const user = await User.findById(req.user._id).select("kycVerified kycRequested");
    res.json({
      submission: latest || null,
      user: user ? { kycVerified: !!user.kycVerified, kycRequested: !!user.kycRequested } : { kycVerified: false, kycRequested: false },
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to load KYC status" });
  }
});

// ---------------------------
// GET MY RANK
// ---------------------------
router.get("/my-rank", protect, sellerOnly, async (req, res) => {
  try {
    // Aggregate sold items and revenue
    const Order = require("../models/Order.js");
    const Auction = require("../models/Auction.js");

    const soldAgg = await Order.aggregate([
      { $match: { status: { $in: ["completed", "paid", "fulfilled"] } } },
      { $group: { _id: "$sellerId", soldCount: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$amount", 0] } } } },
    ]);
    const auctionsAgg = await Auction.aggregate([
      { $group: { _id: "$sellerId", auctionsHosted: { $sum: 1 } } },
    ]);

    const soldMap = new Map(soldAgg.map((x) => [String(x._id), x]));
    const aucMap = new Map(auctionsAgg.map((x) => [String(x._id), x]));
    const sellerIds = Array.from(new Set([...soldMap.keys(), ...aucMap.keys()]));

    const rows = sellerIds.map((sid) => {
      const s = soldMap.get(sid) || { soldCount: 0, revenue: 0 };
      const a = aucMap.get(sid) || { auctionsHosted: 0 };
      return { sellerId: sid, soldCount: s.soldCount || 0, revenue: s.revenue || 0, auctionsHosted: a.auctionsHosted || 0 };
    });

    // We'll rank by soldCount by default
    rows.sort((A, B) => (B.soldCount || 0) - (A.soldCount || 0));
    rows.forEach((r, i) => (r.rank = i + 1));

    const me = rows.find((r) => r.sellerId === String(req.user._id)) || { rank: null, soldCount: 0, revenue: 0, auctionsHosted: 0 };
    res.json({
      rank: me.rank,
      soldCount: me.soldCount,
      revenue: me.revenue,
      auctionsHosted: me.auctionsHosted,
      totalSellers: rows.length,
    });
  } catch (err) {
    console.error("my-rank error:", err);
    res.status(500).json({ message: "Failed to retrieve rank" });
  }
});

module.exports = router;
