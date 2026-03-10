const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["create", "update", "delete"], required: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    before: { type: Object, default: {} },
    after: { type: Object, default: {} },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    route: { type: String, default: "" },
    method: { type: String, default: "" },
  },
  { timestamps: true }
);

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ route: 1, createdAt: -1 });
auditLogSchema.index({ ip: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
