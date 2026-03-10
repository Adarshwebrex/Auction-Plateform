const Settings = require("../models/Settings");
const AuditLog = require("../models/AuditLog");

exports.getSettings = async (req, res) => {
  const doc = await Settings.findOne({ key: "global" });
  if (!doc) {
    const created = await Settings.create({ key: "global" });
    return res.json(created);
  }
  res.json(doc);
};

exports.updateSettings = async (req, res) => {
  const allowed = [
    "platformFee",
    "maxAuctionDuration",
    "minStartingPrice",
    "emailNotifications",
    "autoEndAuctions",
    "maintenanceMode",
    "bidIncrement",
    "defaultCurrency",
    "refundWindowDays",
    "maxUploadMB",
    "enableRegistrations",
    "requireKYCForSellers",
    // Wallet and security
    "walletHighValueThreshold",
    "requireKYCForHighValue",
    "requireOTPForWithdrawals",
    "freezeWithdrawals",
    "withdrawalDailyCap",
    "withdrawalViolationLimit",
    "autoBanDurationDays",
    // Anti-sniping and limits/support
    "enableSnipingProtection",
    "snipingExtensionMinutes",
    "maxAuctionsPerSeller",
    "supportEmail",
    "taxRatePercent",
  ];
  const update = {};
  for (const k of allowed) if (k in req.body) update[k] = req.body[k];

  // Capture previous state for audit logging
  const prev = await Settings.findOne({ key: "global" });

  const doc = await Settings.findOneAndUpdate(
    { key: "global" },
    { $set: update },
    { new: true, upsert: true }
  );
  try {
    // Invalidate and refresh in-process cache immediately so toggles (e.g., maintenanceMode) take effect
    global.SETTINGS_CACHE = doc;
    global.SETTINGS_TS = Date.now();
  } catch (e) {}

  // Audit: log when panic mode or maintenance mode toggled
  try {
    const actor = req.user && req.user._id;
    if (actor && doc && (prev || Object.keys(update).length)) {
      const keysToTrack = ["freezeWithdrawals", "maintenanceMode"];
      const before = {};
      const after = {};
      let changed = false;
      for (const k of keysToTrack) {
        const beforeVal = prev ? prev[k] : undefined;
        const afterVal = doc[k];
        if (beforeVal !== afterVal && (k in update)) {
          before[k] = beforeVal;
          after[k] = afterVal;
          changed = true;
        }
      }
      if (changed) {
        await AuditLog.create({
          userId: actor,
          action: "update",
          entityType: "settings",
          entityId: doc._id,
          before,
          after,
          ip: (req.ip || ""),
          userAgent: (req.headers["user-agent"] || ""),
          route: req.originalUrl || "",
          method: (req.method || "").toUpperCase(),
        });
      }
    }
  } catch (e) {}
  res.json(doc);
};
