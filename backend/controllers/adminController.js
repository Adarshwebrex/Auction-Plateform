const User = require("../models/User.js");
const Auction = require("../models/Auction.js");
const Bid = require("../models/Bid.js");
const Order = require("../models/Order.js");
const AuditLog = require("../models/AuditLog.js");

exports.getAdminStats = async (req, res) => {
  try {
    console.log("IM INSIDE ADMIN CONTROLLER 🔥");

    const totalUsers = await User.countDocuments();
    console.log("found user docs");
    const totalAuctions = await Auction.countDocuments();
    console.log("found auction docs");
    const activeAuctions = await Auction.countDocuments({ status: "active" });
    console.log("found active auction docs");
    const endedAuctions = await Auction.countDocuments({ status: "ended" });
    console.log("found ended auction docs");

    const auctions = await Auction.find();
    const revenue = auctions.reduce((sum, a) => sum + (a.currentPrice || 0), 0);
    console.log("calculated revenue");

    const bidGraph = await Bid.aggregate([
      {
        $group: {
          _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }
    ]);

    // Revenue graph derived from Orders grouped by date
    const revenueGraph = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d" } },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          amount: 1,
          _id: 0,
        },
      },
    ]);

    // Recent activity: latest bids (user + auction) flattened to readable strings
    const recentBids = await Bid.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name email")
      .populate("auctionId", "title");

    const activity = recentBids.map((b) => {
      const user = b.userId ? (b.userId.name || b.userId.email) : "Unknown user";
      const auction = b.auctionId ? b.auctionId.title : "Unknown auction";
      return `${user} bid ₹${b.amount} on ${auction}`;
    });

    res.json({
      totalUsers,
      totalAuctions,
      activeAuctions,
      endedAuctions,
      revenue,
      bidGraph,
      revenueGraph,
      activity,
    });

  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    res.status(500).json({ message: "Admin stats failed", error: err.message });
  }
};

// ADMIN INSIGHTS: top categories, conversion metrics, dispute rate
exports.getAdminInsights = async (req, res) => {
  try {
    // Top categories by auction count
    const topByAuctions = await Auction.aggregate([
      { $group: { _id: { $toLower: "$category" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, category: "$_id", count: 1 } }
    ]);

    // Revenue by category from Orders (join to Auction)
    const revenueByCategory = await Order.aggregate([
      { $match: { status: { $nin: ["cancelled"] } } },
      { $lookup: { from: "auctions", localField: "auctionId", foreignField: "_id", as: "auction" } },
      { $unwind: "$auction" },
      { $group: { _id: { $toLower: "$auction.category" }, revenue: { $sum: { $ifNull: ["$amount", 0] } }, orders: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $project: { _id: 0, category: "$_id", revenue: 1, orders: 1 } }
    ]);

    // Conversion metrics
    const totalAuctions = await Auction.countDocuments();
    const ordersAgg = await Order.aggregate([{ $group: { _id: "$auctionId" } }]);
    const auctionsWithOrders = ordersAgg.length;
    const bidsAgg = await (require("../models/Bid"))
      .aggregate([{ $group: { _id: "$auctionId" } }]);
    const auctionsWithBids = bidsAgg.length;

    const conversion = {
      totalAuctions,
      auctionsWithOrders,
      auctionsWithBids,
      auctionToOrderRate: totalAuctions ? +(auctionsWithOrders / totalAuctions).toFixed(3) : 0,
      bidToOrderRate: auctionsWithBids ? +(auctionsWithOrders / auctionsWithBids).toFixed(3) : 0,
    };

    // Dispute rate (based on Order.status if such statuses are used)
    const totalOrders = await Order.countDocuments();
    const disputedOrders = await Order.countDocuments({ status: { $in: ["disputed", "chargeback", "refunded"] } });
    const disputeRate = totalOrders ? +(disputedOrders / totalOrders).toFixed(3) : 0;

    res.json({
      topByAuctions,
      revenueByCategory,
      conversion,
      disputes: { totalOrders, disputedOrders, disputeRate },
    });
  } catch (err) {
    console.error("ADMIN INSIGHTS ERROR:", err);
    res.status(500).json({ message: "Admin insights failed", error: err.message });
  }
};

// UPDATE user role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "seller", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select("-password");

    res.json({ message: "User role updated", user });
  } catch (err) {
    console.error("UPDATE ROLE ERROR:", err);
    res.status(500).json({ message: "Failed to update user role" });
  }
};

// DELETE user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// GET single user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("GET USER ERROR:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

// UNBAN user (clear withdrawal ban & violations)
exports.unbanUser = async (req, res) => {
  try {
    const id = req.params.userId;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const before = {
      bannedUntil: user.bannedUntil || null,
      withdrawalViolationCount: user.withdrawalViolationCount || 0,
    };

    user.bannedUntil = null;
    user.withdrawalViolationCount = 0;
    await user.save();

    try {
      await AuditLog.create({
        userId: req.user._id,
        action: "update",
        entityType: "user",
        entityId: user._id,
        before,
        after: { bannedUntil: null, withdrawalViolationCount: 0 },
        ip: (req.ip || ""),
        userAgent: (req.headers["user-agent"] || ""),
        route: req.originalUrl || "",
        method: (req.method || "").toUpperCase(),
      });
    } catch (e) {}

    const sanitized = await User.findById(id).select("-password");
    res.json({ message: "User unbanned", user: sanitized });
  } catch (err) {
    console.error("UNBAN USER ERROR:", err);
    res.status(500).json({ message: "Failed to unban user" });
  }
};
