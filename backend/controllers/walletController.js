const User = require("../models/User");
const WalletTx = require("../models/WalletTx");
const WalletRequest = require("../models/WalletRequest");
const AuditLog = require("../models/AuditLog");
const { createNotification } = require("./notificationController");
const { sendMail } = require("../config/mailer");

const HIGH_VALUE_THRESHOLD = 100000;

exports.deposit = async (req, res) => {
  try {
    const raw = req.body?.amount;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Settings overrides
    const s = (req.app && req.app.locals && req.app.locals.settings) || {};
    const threshold = Number(s?.walletHighValueThreshold || HIGH_VALUE_THRESHOLD);
    const requireKYCForHighValue = !!s?.requireKYCForHighValue;
    const requireOTP = (amount > threshold) || !!s?.requireOTPForWithdrawals;
    if (requireKYCForHighValue && amount > threshold && !req.user.kycVerified) {
      return res.status(400).json({ message: "KYC required for high-value operations" });
    }

    // OTP for high-value deposits or when globally required
    if (requireOTP) {
      const otp = (req.body && String(req.body.otp || '').trim()) || '';
      const now = Date.now();
      if (!otp) {
        return res.status(401).json({ message: "OTP required for deposit" });
      }
      const exp = req.user.twoFactorOtpExpires ? new Date(req.user.twoFactorOtpExpires).getTime() : 0;
      if (!req.user.twoFactorTempOtp || now > exp || otp !== String(req.user.twoFactorTempOtp)) {
        return res.status(401).json({ message: "Invalid or expired OTP" });
      }
      try {
        await User.findByIdAndUpdate(userId, { twoFactorTempOtp: '', twoFactorOtpExpires: null });
      } catch (e) {}
    }

    // For high-value deposits, create pending request for admin approval
    if (amount > threshold) {
      const reqDoc = await WalletRequest.create({ userId, type: "deposit", amount, status: "pending" });
      return res.status(202).json({ message: "Deposit requires admin approval", requestId: reqDoc._id });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $inc: { wallet: amount } },
      { new: true, select: "wallet" }
    );

    if (!updated) return res.status(404).json({ message: "User not found" });

    try {
      await WalletTx.create({
        userId,
        type: "deposit",
        amount,
        balanceAfter: updated.wallet,
      });
    } catch (e) {
      // do not fail request on logging error
    }

    return res.json({ balance: updated.wallet, message: "Deposit successful" });
  } catch (e) {
    console.error("wallet.deposit", e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin endpoints for high-value wallet requests
exports.adminListRequests = async (req, res) => {
  try {
    const status = req.query.status || "pending";
    const filter = status ? { status } : {};
    const items = await WalletRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name email wallet");
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Failed to load wallet requests" });
  }
};

exports.adminApproveRequest = async (req, res) => {
  try {
    const id = req.params.id;
    const note = (req.body && req.body.note) || "";
    const r = await WalletRequest.findById(id);
    if (!r) return res.status(404).json({ message: "Request not found" });
    if (r.status !== "pending") return res.status(400).json({ message: "Request is not pending" });

    const user = await User.findById(r.userId).select("wallet");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (r.type === "deposit") {
      user.wallet = (user.wallet || 0) + r.amount;
      await user.save();
      await WalletTx.create({ userId: r.userId, type: "deposit", amount: r.amount, balanceAfter: user.wallet });
    } else if (r.type === "withdraw") {
      if ((user.wallet || 0) < r.amount) return res.status(400).json({ message: "Insufficient balance" });
      user.wallet = (user.wallet || 0) - r.amount;
      await user.save();
      await WalletTx.create({ userId: r.userId, type: "withdraw", amount: r.amount, balanceAfter: user.wallet });
    }

    r.status = "approved";
    r.actionedBy = req.user._id;
    r.actionedAt = new Date();
    r.note = note;
    await r.save();

    try {
      await createNotification({
        userId: r.userId,
        message: `✅ Wallet ${r.type} of ₹${Number(r.amount).toLocaleString('en-IN')} approved`,
        link: "/wallet",
      });
    } catch (e) { /* ignore notification failure */ }

    res.json({ message: "Request approved", request: r });
  } catch (e) {
    console.error("adminApproveRequest", e);
    res.status(500).json({ message: "Failed to approve request" });
  }
};

exports.adminRejectRequest = async (req, res) => {
  try {
    const id = req.params.id;
    const note = ((req.body && req.body.note) || "").trim();
    const r = await WalletRequest.findById(id);
    if (!r) return res.status(404).json({ message: "Request not found" });
    if (r.status !== "pending") return res.status(400).json({ message: "Request is not pending" });
    if (!note) return res.status(400).json({ message: "Rejection note is required" });

    r.status = "rejected";
    r.actionedBy = req.user._id;
    r.actionedAt = new Date();
    r.note = note;
    await r.save();

    try {
      await createNotification({
        userId: r.userId,
        message: `❌ Wallet ${r.type} of ₹${Number(r.amount).toLocaleString('en-IN')} rejected. Reason: ${note}`,
        link: "/wallet",
      });
    } catch (e) { /* ignore notification failure */ }

    res.json({ message: "Request rejected", request: r });
  } catch (e) {
    console.error("adminRejectRequest", e);
    res.status(500).json({ message: "Failed to reject request" });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const raw = req.body?.amount;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Settings overrides
    const s = (req.app && req.app.locals && req.app.locals.settings) || {};
    if (s && s.freezeWithdrawals) {
      return res.status(503).json({ message: "Withdrawals are temporarily frozen. Please try again later." });
    }
    // Check ban window
    if (req.user?.bannedUntil) {
      const bannedUntilTs = new Date(req.user.bannedUntil).getTime();
      if (Date.now() < bannedUntilTs) {
        return res.status(403).json({ message: "Your account is temporarily restricted from withdrawals. Please try again later.", bannedUntil: req.user.bannedUntil });
      } else {
        // ban expired, clear and log
        try {
          const prev = await User.findById(userId).select("bannedUntil withdrawalViolationCount");
          await User.findByIdAndUpdate(userId, { bannedUntil: null });
          await AuditLog.create({
            userId: req.user._id,
            action: "update",
            entityType: "user",
            entityId: req.user._id,
            before: { bannedUntil: prev?.bannedUntil },
            after: { bannedUntil: null },
            ip: (req.ip || ""),
            userAgent: (req.headers["user-agent"] || ""),
            route: req.originalUrl || "",
            method: (req.method || "").toUpperCase(),
          });
          req.user.bannedUntil = null;
        } catch (e) {}
      }
    }

    // Per-day cap enforcement
    const dailyCap = Number(s?.withdrawalDailyCap || 0);
    if (dailyCap > 0) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const agg = await WalletTx.aggregate([
        { $match: { userId, type: "withdraw", createdAt: { $gte: dayStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const withdrawnToday = (agg && agg[0] && agg[0].total) ? Number(agg[0].total) : 0;
      if (withdrawnToday + amount > dailyCap) {
        // increment violation and possibly ban
        const violationLimit = Math.max(1, Number(s?.withdrawalViolationLimit || 3));
        const autoBanDays = Math.max(0, Number(s?.autoBanDurationDays || 7));
        const u = await User.findById(userId).select("withdrawalViolationCount bannedUntil");
        const nextCount = (u?.withdrawalViolationCount || 0) + 1;
        const update = { withdrawalViolationCount: nextCount };
        let willBanUntil = null;
        if (autoBanDays > 0 && nextCount >= violationLimit) {
          willBanUntil = new Date(Date.now() + autoBanDays * 24 * 60 * 60 * 1000);
          update.bannedUntil = willBanUntil;
        }
        try {
          await User.findByIdAndUpdate(userId, update);
          if (willBanUntil) {
            await AuditLog.create({
              userId: req.user._id,
              action: "update",
              entityType: "user",
              entityId: req.user._id,
              before: { withdrawalViolationCount: u?.withdrawalViolationCount || 0, bannedUntil: u?.bannedUntil || null },
              after: { withdrawalViolationCount: nextCount, bannedUntil: willBanUntil },
              ip: (req.ip || ""),
              userAgent: (req.headers["user-agent"] || ""),
              route: req.originalUrl || "",
              method: (req.method || "").toUpperCase(),
            });
          }
        } catch (e) {}
        const remaining = Math.max(0, dailyCap - withdrawnToday);
        return res.status(400).json({ message: `Daily withdrawal cap reached. Remaining today: ₹${remaining.toLocaleString('en-IN')}` });
      }
    }
    const threshold = Number(s?.walletHighValueThreshold || HIGH_VALUE_THRESHOLD);
    const requireKYCForHighValue = !!s?.requireKYCForHighValue;
    const requireOTP = (amount > threshold) || !!s?.requireOTPForWithdrawals;

    if (requireKYCForHighValue && amount > threshold && !req.user.kycVerified) {
      return res.status(400).json({ message: "KYC required for high-value operations" });
    }

    // OTP for high-value withdrawals or when globally required
    if (requireOTP) {
      const otp = (req.body && String(req.body.otp || '').trim()) || '';
      const now = Date.now();
      if (!otp) {
        return res.status(401).json({ message: "OTP required for withdrawal" });
      }
      const exp = req.user.twoFactorOtpExpires ? new Date(req.user.twoFactorOtpExpires).getTime() : 0;
      if (!req.user.twoFactorTempOtp || now > exp || otp !== String(req.user.twoFactorTempOtp)) {
        return res.status(401).json({ message: "Invalid or expired OTP" });
      }
      // clear OTP on successful validation
      try {
        await User.findByIdAndUpdate(userId, { twoFactorTempOtp: '', twoFactorOtpExpires: null });
      } catch (e) {}
    }

    // For high-value withdrawals, create pending request for admin approval
    if (amount > threshold) {
      const reqDoc = await WalletRequest.create({ userId, type: "withdraw", amount, status: "pending" });
      return res.status(202).json({ message: "Withdrawal requires admin approval", requestId: reqDoc._id });
    }

    const user = await User.findById(userId).select("wallet");
    if (!user) return res.status(404).json({ message: "User not found" });

    if ((user.wallet || 0) < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    user.wallet = (user.wallet || 0) - amount;
    await user.save();

    try {
      await WalletTx.create({
        userId,
        type: "withdraw",
        amount,
        balanceAfter: user.wallet,
      });
    } catch (e) {
      // do not fail request on logging error
    }

    return res.json({ balance: user.wallet, message: "Withdrawal successful" });
  } catch (e) {
    console.error("wallet.withdraw", e);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.history = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const items = await WalletTx.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    return res.json(items);
  } catch (e) {
    console.error("wallet.history", e);
    return res.status(500).json({ message: "Server error" });
  }
};

// User: list own high-value wallet requests
exports.userRequests = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const status = req.query.status;
    const filter = { userId };
    if (status) filter.status = status;
    const items = await WalletRequest.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Failed to load requests" });
  }
};

// Lightweight limits endpoint: returns today's cap usage and ban status
exports.limits = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const s = (req.app && req.app.locals && req.app.locals.settings) || {};
    const dailyCap = Number(s?.withdrawalDailyCap || 0);
    let withdrawnToday = 0;
    if (dailyCap > 0) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const agg = await WalletTx.aggregate([
        { $match: { userId, type: "withdraw", createdAt: { $gte: dayStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      withdrawnToday = (agg && agg[0] && agg[0].total) ? Number(agg[0].total) : 0;
    }
    const remaining = dailyCap > 0 ? Math.max(0, dailyCap - withdrawnToday) : null;
    const bannedUntil = req.user?.bannedUntil || null;
    return res.json({ dailyCap, withdrawnToday, remaining, bannedUntil });
  } catch (e) {
    return res.status(500).json({ message: "Failed to load limits" });
  }
};

// Issue OTP for wallet operations (always available)
exports.requestWithdrawalOtp = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 5 * 60 * 1000);
    await User.findByIdAndUpdate(userId, {
      twoFactorTempOtp: otp,
      twoFactorOtpExpires: expires,
    });

    let sent = false;
    let deliveryNote = '';
    // Resolve user's email from DB as fallback if not present on req.user
    let toEmail = req.user?.email;
    try {
      if (!toEmail) {
        const u = await User.findById(userId).select('email');
        toEmail = u?.email;
      }
    } catch (e) { /* ignore lookup failure */ }

    if (toEmail) {
      try {
        await sendMail({
          to: toEmail,
          subject: "Your Wallet OTP",
          text: `Your OTP is ${otp}. It expires in 5 minutes.`,
          html: `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
        });
        sent = true;
      } catch (e) {
        deliveryNote = 'Email delivery failed';
      }
    } else {
      deliveryNote = 'No email configured on account';
    }

    const payload = {
      message: sent ? 'OTP sent to email' : 'OTP generated',
      delivery: sent ? 'email' : 'none',
    };
    if (deliveryNote) payload.note = deliveryNote;
    if (process.env.NODE_ENV !== 'production') payload.debugOtp = otp;
    res.json(payload);
  } catch (e) {
    res.status(500).json({ message: "Failed to issue OTP" });
  }
};
