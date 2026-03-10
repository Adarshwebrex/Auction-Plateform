import { useEffect, useState } from "react";
import { api } from "../utils/api";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function AdminWalletApprovals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState({});

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function fetchItems() {
    try {
      setLoading(true);
      const res = await api.get("/wallet/admin/requests", {
        params: { status },
      });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load wallet requests");
    } finally {
      setLoading(false);
    }
  }

  async function act(id, approve) {
    try {
      if (approve) {
        await api.put(`/wallet/admin/requests/${id}/approve`);
        toast.success("Request approved");
      } else {
        const note = (notes[id] || "").trim();
        if (!note) {
          toast.error("Rejection note is required");
          return;
        }
        await api.put(`/wallet/admin/requests/${id}/reject`, { note });
        toast.success("Request rejected");
      }
      fetchItems();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Action failed");
    }
  }

  return (
    <div className="relative min-h-screen text-white pt-28 px-6 pb-24 max-w-6xl mx-auto">

      {/* Ambient Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-extrabold mb-10 bg-gradient-to-r from-emerald-400 to-blue-500 text-transparent bg-clip-text"
      >
        Wallet Approvals
      </motion.h1>

      {/* Status Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-4 mb-10"
      >
        <span className="text-gray-300 font-semibold">Filter Status</span>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="
            bg-black/40 backdrop-blur-xl
            border border-white/20
            rounded-xl px-4 py-2
            text-white outline-none
            focus:ring-2 focus:ring-blue-500/60
          "
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </motion.div>

      {/* Content */}
      {loading ? (
        <p className="text-gray-400 animate-pulse">Loading wallet requests…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400">No wallet requests found</p>
      ) : (
        <div className="space-y-6">
          {items.map((r) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              className="
                relative p-6 rounded-2xl
                bg-gradient-to-br from-white/10 to-white/5
                border border-white/15
                backdrop-blur-xl
                hover:shadow-[0_0_50px_rgba(59,130,246,0.25)]
                transition
              "
            >
              {/* Neon edge */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition pointer-events-none" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full border
                        ${
                          r.type === "deposit"
                            ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
                            : "bg-pink-500/20 border-pink-400/30 text-pink-200"
                        }`}
                    >
                      {r.type}
                    </span>
                    <span className="text-gray-400">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-gray-200">
                    User:{" "}
                    <span className="font-medium">
                      {r.userId?.name || r.userId?.email || r.userId}
                    </span>
                  </div>

                  <div className="text-lg font-bold">
                    ₹{Number(r.amount || 0).toLocaleString("en-IN")}
                  </div>

                  <div className="text-xs text-gray-400">
                    Status:{" "}
                    <span
                      className={
                        r.status === "approved"
                          ? "text-emerald-400"
                          : r.status === "rejected"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }
                    >
                      {r.status}
                    </span>
                  </div>

                  {r.status !== "pending" && r.note && (
                    <div className="text-xs text-yellow-200">
                      Note: {r.note}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {r.status === "pending" && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => act(r._id, true)}
                      className="
                        px-6 py-2 rounded-xl font-semibold
                        bg-gradient-to-r from-emerald-500 to-green-600
                        shadow-[0_0_25px_rgba(34,197,94,0.6)]
                      "
                    >
                      Approve
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => act(r._id, false)}
                      className="
                        px-6 py-2 rounded-xl font-semibold
                        bg-gradient-to-r from-red-500 to-pink-600
                        shadow-[0_0_25px_rgba(239,68,68,0.6)]
                      "
                    >
                      Reject
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Rejection Note */}
              {r.status === "pending" && (
                <div className="mt-4">
                  <label className="block text-xs text-gray-400 mb-1">
                    Rejection note (required for Reject)
                  </label>
                  <textarea
                    rows={2}
                    value={notes[r._id] || ""}
                    onChange={(e) =>
                      setNotes((p) => ({ ...p, [r._id]: e.target.value }))
                    }
                    placeholder="Add reason for rejection"
                    className="
                      w-full rounded-xl p-3 text-sm
                      bg-black/40 border border-white/20
                      focus:outline-none focus:ring-2 focus:ring-red-500/60
                    "
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
