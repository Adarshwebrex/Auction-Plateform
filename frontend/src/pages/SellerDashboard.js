import { useEffect, useState } from "react";
import { api } from "../utils/api";
import SellerLayout from "../components/seller/SellerLayout";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useFormatCurrency } from "../utils/currency";

const glowVariants = {
  initial: { opacity: 0, y: -10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function SellerDashboard() {
  const [stats, setStats] = useState({});
  const [auctions, setAuctions] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(9);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAuctions, setLoadingAuctions] = useState(true);
  const { format } = useFormatCurrency();

  // Load stats once on mount
  useEffect(() => {
    api
      .get("/seller/stats")
      .then((res) => setStats(res.data))
      .finally(() => setLoadingStats(false));

    // Fetch my rank
    api
      .get("/seller/my-rank")
      .then((res) => setMyRank(res.data))
      .catch(() => {})
      .finally(() => {});
  }, []);

  // Load auctions on filters/pagination change
  useEffect(() => {
    fetchAuctions();
  }, [page, search, statusFilter]);

  const fetchAuctions = async () => {
    try {
      setLoadingAuctions(true);
      const q = new URLSearchParams();
      q.append("page", page);
      q.append("limit", limit);
      if (search) q.append("search", search);
      if (statusFilter) q.append("status", statusFilter);

      const res = await api.get(`/seller/auctions?${q.toString()}`);
      setAuctions(res.data.auctions || []);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error("Failed to load auctions", err);
    } finally {
      setLoadingAuctions(false);
    }
  };

  return (
    <SellerLayout>

      {/* ===== AURORA BACKGROUND + PARTICLES (V14) ===== */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-20 w-[380px] h-[380px] bg-cyan-500 blur-[180px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-32 w-[420px] h-[420px] bg-purple-600 blur-[200px] opacity-30 animate-[pulse_6s_ease-in-out_infinite]"></div>

        {/* Floating particles */}
        {[...Array(26)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[5px] h-[5px] rounded-full bg-cyan-300 opacity-40"
            initial={{
              x: Math.random() * 1400,
              y: Math.random() * 900,
              opacity: 0,
            }}
            animate={{
              y: ["0%", "-180%"],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 6 + 4,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="p-10 text-white relative z-20">

        {/* ===== TITLE WITH NEON SWEEP ===== */}
        <motion.h1
          variants={glowVariants}
          initial="initial"
          animate="animate"
          className="text-5xl font-extrabold mb-8 bg-gradient-to-r from-cyan-400 to-purple-500 
          text-transparent bg-clip-text drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]
          animate-[shine_3s_linear_infinite]"
        >
          Seller Dashboard
        </motion.h1>

        {myRank && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-600/20 border border-emerald-400/30 text-emerald-300 text-sm">
              Rank #{myRank.rank ?? '—'} of {myRank.totalSellers}
            </span>
            <span className="px-3 py-1 rounded-full bg-cyan-600/20 border border-cyan-400/30 text-cyan-300 text-sm">
              Sold: {myRank.soldCount}
            </span>
            <span className="px-3 py-1 rounded-full bg-yellow-600/20 border border-yellow-400/30 text-yellow-300 text-sm">
              Revenue: {format(myRank.revenue)}
            </span>
          </div>
        )}

        {/* ===== STATS GRID ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {loadingStats ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <StatCard label="Total Listings" value={stats.totalListings} glow="cyan" />
              <StatCard label="Items Sold" value={stats.soldItems} glow="emerald" />
              <StatCard label="Revenue" value={format(stats.revenue)} glow="yellow" />
            </>
          )}
        </div>

        {/* ===== SEARCH & FILTER ===== */}
        <div className="flex flex-wrap items-center gap-4 mt-10">
          <motion.input
            whileFocus={{ scale: 1.04, boxShadow: "0 0 15px rgba(0,255,255,0.5)" }}
            type="text"
            placeholder="Search auctions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl 
            focus:border-cyan-400 outline-none w-full md:w-72 transition"
          />

          <motion.select
            whileHover={{ scale: 1.03 }}
            whileFocus={{ scale: 1.05, boxShadow: "0 0 12px rgba(180,0,255,0.5)" }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-black backdrop-blur-xl 
            focus:border-purple-400 focus:bg-white/10 outline-none transition"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="ended">Ended</option>
          </motion.select>
        </div>

        {/* ===== AUCTION GRID ===== */}
        <h2 className="text-3xl font-semibold mt-14 mb-6 drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]">
          Your Auctions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loadingAuctions
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl p-5 animate-pulse"
                >
                  <div className="h-48 w-full rounded-xl bg-white/10" />
                  <div className="h-4 bg-white/10 rounded mt-4 w-3/4" />
                  <div className="h-3 bg-white/10 rounded mt-2 w-1/2" />
                  <div className="flex gap-4 mt-5">
                    <div className="h-10 flex-1 bg-white/10 rounded-xl" />
                    <div className="h-10 flex-1 bg-white/10 rounded-xl" />
                  </div>
                </div>
              ))
            : auctions.map((a, i) => (
            <motion.div
              key={a._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{
                scale: 1.05,
                rotate: 1,
                boxShadow: "0 0 25px rgba(0,255,255,0.45)",
              }}
              className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl 
                         p-5 shadow-lg hover:shadow-[0_0_25px_rgba(0,255,255,0.4)] transition"
            >
              <img
                src={a.image}
                className="rounded-xl h-48 w-full object-cover shadow-lg"
                alt="auction"
              />

              <h3 className="text-xl font-semibold mt-4">{a.title}</h3>

              <p className="text-sm text-gray-300 mt-1">
                Status:{" "}
                <span className={
                  a.status === "active"
                    ? "text-green-400"
                    : a.status === "upcoming"
                    ? "text-yellow-400"
                    : "text-red-400"
                }>
                  {a.status.toUpperCase()}
                </span>
              </p>

              <div className="flex gap-4 mt-5">
                <Link
                  to={`/seller/edit/${a._id}`}
                  className="flex-1 py-2 text-center rounded-xl bg-blue-600 hover:bg-blue-700 transition"
                >
                  Edit
                </Link>

                <button
                  onClick={() =>
                    api.delete(`/auctions/${a._id}`).then(() => fetchAuctions())
                  }
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
            ))}
        </div>

        {/* ===== PAGINATION ===== */}
        <div className="flex items-center gap-4 mt-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 disabled:opacity-40"
          >
            Prev
          </motion.button>

          <span className="text-lg">Page {page} of {pages}</span>

          <motion.button
            whileHover={{ scale: 1.05 }}
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(p + 1, pages))}
            className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 disabled:opacity-40"
          >
            Next
          </motion.button>
        </div>
      </div>
    </SellerLayout>
  );
}

/* ======================================
   STAT CARD COMPONENT (NEON + GLOW)
====================================== */
function StatCard({ label, value, glow }) {
  const glowColors = {
    cyan: "shadow-[0_0_20px_rgba(0,255,255,0.6)]",
    emerald: "shadow-[0_0_20px_rgba(0,255,180,0.6)]",
    yellow: "shadow-[0_0_20px_rgba(255,255,0,0.6)]",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl 
      text-white ${glowColors[glow]} transition`}
    >
      <p className="text-lg font-semibold">{label}</p>
      <p className="text-4xl font-extrabold mt-2">{value}</p>
    </motion.div>
  );
}

// Loading placeholder for stat cards
function StatSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl animate-pulse">
      <div className="h-4 w-1/2 bg-white/10 rounded" />
      <div className="h-10 w-1/3 bg-white/10 rounded mt-3" />
    </div>
  );
}
