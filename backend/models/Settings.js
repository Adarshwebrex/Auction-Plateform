const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    platformFee: { type: Number, default: 5 },
    maxAuctionDuration: { type: Number, default: 30 },
    minStartingPrice: { type: Number, default: 100 },
    emailNotifications: { type: Boolean, default: true },
    autoEndAuctions: { type: Boolean, default: true },

    maintenanceMode: { type: Boolean, default: false },
    bidIncrement: { type: Number, default: 50 },
    defaultCurrency: { type: String, default: "INR" },
    refundWindowDays: { type: Number, default: 7 },
    maxUploadMB: { type: Number, default: 5 },
    enableRegistrations: { type: Boolean, default: true },
    requireKYCForSellers: { type: Boolean, default: false },
    // Wallet-related feature flags
    walletHighValueThreshold: { type: Number, default: 100000 },
    requireKYCForHighValue: { type: Boolean, default: false },
    requireOTPForWithdrawals: { type: Boolean, default: false },
    // Panic mode: instantly freeze withdrawals
    freezeWithdrawals: { type: Boolean, default: false },
    // Withdrawal risk controls
    withdrawalDailyCap: { type: Number, default: 0 }, // 0 = unlimited
    withdrawalViolationLimit: { type: Number, default: 3 },
    autoBanDurationDays: { type: Number, default: 7 },
    // Anti-sniping and platform limits/support
    enableSnipingProtection: { type: Boolean, default: true },
    snipingExtensionMinutes: { type: Number, default: 2 },
    maxAuctionsPerSeller: { type: Number, default: 50 },
    supportEmail: { type: String, default: "support@example.com" },
    taxRatePercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
