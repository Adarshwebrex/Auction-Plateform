import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../utils/api";

export default function AdminAuditLogs() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  const [entityType, setEntityType] = useState("Auction");
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [entityId, setEntityId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [route, setRoute] = useState("");
  const [ip, setIp] = useState("");
  const [method, setMethod] = useState("");

  const query = useMemo(
    () => ({ entityType, action, userId, entityId, from, to, route, ip, method, page, limit: 25 }),
    [entityType, action, userId, entityId, from, to, route, ip, method, page]
  );

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") params.append(k, v);
        });
        const res = await api.get(`/admin/audit-logs?${params.toString()}`);
        setItems(res.data?.items || []);
        setTotal(res.data?.total || 0);
        setPages(res.data?.pages || 1);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [query]);

  const exportCsv = async () => {
    try {
      const params = {};
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params[k] = v;
      });
      const res = await api.get(`/admin/audit-logs`, {
        params: { ...params, format: "csv", page: 1 },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit-logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {}
  };

  return (
    <div className="relative min-h-screen pt-24 px-4 sm:px-6 text-white">

      {/* === HOLOGRAPHIC GRID BACKGROUND === */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 opacity-[0.18] bg-[url('https://i.imgur.com/4NJlQgg.png')] bg-[length:500px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-purple-700/10 to-black" />
      </div>

      <div className="max-w-7xl mx-auto space-y-10">

        {/* === HEADER === */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h1
            className="text-4xl font-extrabold tracking-tight 
            bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 
            bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,200,255,0.6)]"
          >
            Audit Logs
          </h1>
          <p className="text-gray-300/80 mt-1">
            Track system-wide changes, updates, and actions.
          </p>
        </motion.div>

        {/* === FILTER PANEL === */}
        <div
          className="
            flex items-end gap-4 flex-wrap 
            bg-gradient-to-br from-black/40 via-black/30 to-cyan-900/5 
            border border-cyan-400/20 
            backdrop-blur-xl 
            rounded-2xl p-5
            shadow-[0_0_25px_rgba(0,200,255,0.15)]
          "
        >
          {[
            {
              label: "Entity",
              value: entityType,
              setter: setEntityType,
              type: "select",
              options: [
                { v: "", l: "Any" },
                { v: "Auction", l: "Auction" },
                { v: "settings", l: "Settings" },
                { v: "user", l: "User" },
                { v: "order", l: "Order" },
              ],
            },
            {
              label: "Action",
              value: action,
              setter: setAction,
              type: "select",
              options: [
                { v: "", l: "Any" },
                { v: "create", l: "Create" },
                { v: "update", l: "Update" },
                { v: "delete", l: "Delete" },
              ],
            },
            { label: "User ID", value: userId, setter: setUserId, type: "input" },
            { label: "Entity ID", value: entityId, setter: setEntityId, type: "input" },
            { label: "Route contains", value: route, setter: setRoute, type: "input" },
            { label: "IP", value: ip, setter: setIp, type: "input" },
            {
              label: "Method",
              value: method,
              setter: setMethod,
              type: "select",
              options: [
                { v: "", l: "Any" },
                { v: "GET", l: "GET" },
                { v: "POST", l: "POST" },
                { v: "PUT", l: "PUT" },
                { v: "DELETE", l: "DELETE" },
                { v: "PATCH", l: "PATCH" },
              ],
            },
          ].map((f, i) => (
            <div key={i} className="flex flex-col">
              <label className="text-xs text-cyan-300 mb-1">{f.label}</label>

              {f.type === "select" ? (
                <select
                  value={f.value}
                  onChange={(e) => {
                    setPage(1);
                    f.setter(e.target.value);
                  }}
                  className="
                    bg-black/50 border border-cyan-400/30 
                    rounded-xl px-3 py-2 text-sm 
                    focus:ring-2 focus:ring-cyan-400"
                >
                  {f.options.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.l}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={f.value}
                  onChange={(e) => {
                    setPage(1);
                    f.setter(e.target.value.trim());
                  }}
                  className="
                    bg-black/50 border border-cyan-400/30 
                    rounded-xl px-3 py-2 text-sm 
                    focus:ring-2 focus:ring-cyan-400
                  "
                  placeholder={f.label}
                />
              )}
            </div>
          ))}

          {/* Date filters */}
          <div className="flex flex-col">
            <label className="text-xs text-cyan-300 mb-1">From</label>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => {
                setPage(1);
                setFrom(e.target.value);
              }}
              className="bg-black/50 border border-cyan-400/30 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-cyan-300 mb-1">To</label>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => {
                setPage(1);
                setTo(e.target.value);
              }}
              className="bg-black/50 border border-cyan-400/30 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setPage(1)}
              className="
                px-5 py-2 rounded-xl 
                bg-gradient-to-r from-cyan-600 to-purple-600 
                border border-cyan-400/40
                hover:shadow-[0_0_20px_rgba(0,200,255,0.5)]
                transition-all
              "
            >
              Apply
            </button>
            <button
              onClick={exportCsv}
              className="px-5 py-2 rounded-xl bg-black/50 border border-cyan-400/30 hover:bg-cyan-500/10 transition"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* === LOG TABLE === */}
        <div
          className="
            bg-black/30 border border-cyan-400/20 
            rounded-2xl overflow-hidden 
            backdrop-blur-lg 
            shadow-[0_0_40px_rgba(0,200,255,0.25)]
          "
        >
          <div className="overflow-x-auto no-scrollbar">
            <div
              className="
                min-w-[950px] grid grid-cols-12 gap-3 
                px-4 py-3 text-xs text-cyan-300 
                border-b border-cyan-400/20
                bg-black/40
              "
            >
              <div className="col-span-2">When</div>
              <div className="col-span-2">User</div>
              <div className="col-span-1">Action</div>
              <div className="col-span-2">Entity</div>
              <div className="col-span-5">Changes</div>
            </div>

            {loading ? (
              <div className="p-6 text-cyan-300/70">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-gray-400">No logs found.</div>
            ) : (
              <div className="min-w-[950px] divide-y divide-cyan-400/10">
                {items.map((it) => (
                  <motion.div
                    key={it._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="
                      grid grid-cols-12 gap-3 px-4 py-3 text-sm
                      hover:bg-cyan-500/10 transition-all duration-200
                    "
                  >
                    <div className="col-span-2 text-cyan-200">
                      {new Date(it.createdAt).toLocaleString()}
                    </div>

                    <div className="col-span-2">
                      <div className="text-white">{it.userId?.name || it.userId?.email}</div>
                      <div className="text-[10px] text-gray-400">{it.userId?._id}</div>
                    </div>

                    <div className="col-span-1">
                      <span
                        className={`
                          px-2 py-0.5 rounded text-xs border
                          ${
                            it.action === "create"
                              ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                              : it.action === "update"
                              ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-200"
                              : "bg-red-500/20 border-red-400/40 text-red-200"
                          }
                        `}
                      >
                        {it.action}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <div className="text-cyan-200">{it.entityType}</div>
                      <div className="text-[10px] text-gray-400">{it.entityId}</div>
                    </div>

                    <div className="col-span-5 text-gray-300">
                      {it.action === "create" && (
                        <div>Created: {Object.keys(it.after || {}).join(", ") || "—"}</div>
                      )}

                      {it.action === "delete" && (
                        <div>Deleted: {Object.keys(it.before || {}).join(", ") || "—"}</div>
                      )}

                      {it.action === "update" && (
                        <div className="space-y-1">
                          {Object.keys(it.after || {}).length === 0 ? (
                            <div className="text-gray-400">No changes recorded</div>
                          ) : (
                            <>
                              {Object.keys(it.after).map((k) => (
                                <div key={k} className="flex items-start gap-2">
                                  <span className="text-cyan-300 min-w-[120px]">{k}</span>
                                  <span className="text-gray-500 line-through max-w-[220px] truncate">
                                    {String((it.before || {})[k])}
                                  </span>
                                  <span className="text-cyan-400">→</span>
                                  <span className="text-white max-w-[260px] truncate">
                                    {String((it.after || {})[k])}
                                  </span>
                                </div>
                              ))}
                              <button
                                className="mt-2 text-xs text-cyan-300 hover:text-cyan-200 underline"
                                onClick={() => setExpanded((e)=>({ ...e, [it._id]: !e[it._id] }))}
                              >
                                {expanded[it._id] ? 'Hide details' : 'View details'}
                              </button>
                              {expanded[it._id] && (
                                <div className="mt-2 grid grid-cols-12 gap-3 text-xs">
                                  <div className="col-span-12 md:col-span-4 text-gray-400">
                                    <div><span className="text-cyan-300">Route:</span> {it.route || '—'}</div>
                                    <div><span className="text-cyan-300">Method:</span> {it.method || '—'}</div>
                                    <div><span className="text-cyan-300">IP:</span> {it.ip || '—'}</div>
                                  </div>
                                  <div className="col-span-12 md:col-span-4">
                                    <div className="text-cyan-300 mb-1">Before</div>
                                    <pre className="bg-black/40 border border-cyan-400/20 rounded-lg p-2 overflow-auto max-h-48">{JSON.stringify(it.before || {}, null, 2)}</pre>
                                  </div>
                                  <div className="col-span-12 md:col-span-4">
                                    <div className="text-cyan-300 mb-1">After</div>
                                    <pre className="bg-black/40 border border-cyan-400/20 rounded-lg p-2 overflow-auto max-h-48">{JSON.stringify(it.after || {}, null, 2)}</pre>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* === PAGINATION === */}
        <div className="flex items-center justify-between pt-3">
          <div className="text-xs text-cyan-300/60">Total: {total}</div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="
                px-4 py-2 rounded-xl bg-black/50 border border-cyan-400/30
                disabled:opacity-40 hover:bg-cyan-500/10 transition
              "
            >
              Prev
            </button>

            <span className="text-sm text-cyan-200">
              {page} / {pages}
            </span>

            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="
                px-4 py-2 rounded-xl bg-black/50 border border-cyan-400/30
                disabled:opacity-40 hover:bg-cyan-500/10 transition
              "
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
