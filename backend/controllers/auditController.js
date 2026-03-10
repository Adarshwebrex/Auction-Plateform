const AuditLog = require("../models/AuditLog");

// GET /admin/audit-logs
// Optional query: entityType, entityId, userId, action, from, to, page, limit
exports.getAuditLogs = async (req, res) => {
  try {
    const { entityType, entityId, userId, action, from, to, route, ip, method, format } = req.query || {};
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "25", 10), 1), 200);
    const skip = (page - 1) * limit;

    const filter = {};
    if (entityType) filter.entityType = String(entityType);
    if (entityId) filter.entityId = entityId;
    if (userId) filter.userId = userId;
    if (action) filter.action = String(action);
    if (route) filter.route = String(route);
    if (ip) filter.ip = String(ip);
    if (method) filter.method = String(method).toUpperCase();

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email role"),
      AuditLog.countDocuments(filter),
    ]);

    if ((format || "").toLowerCase() === "csv") {
      const headers = [
        "createdAt","userName","userEmail","userRole","action","entityType","entityId","route","method","ip","before","after"
      ];
      const rows = items.map((it) => [
        it.createdAt?.toISOString?.() || "",
        (it.userId && it.userId.name) || "",
        (it.userId && it.userId.email) || "",
        (it.userId && it.userId.role) || "",
        it.action || "",
        it.entityType || "",
        String(it.entityId || ""),
        it.route || "",
        it.method || "",
        it.ip || "",
        JSON.stringify(it.before || {}),
        JSON.stringify(it.after || {}),
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))].join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=audit-logs-${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1), limit });
  } catch (e) {
    res.status(500).json({ message: "Failed to load audit logs" });
  }
};
