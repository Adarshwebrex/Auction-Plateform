import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../utils/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiSearch, FiFilter, FiX } from "react-icons/fi";
import { AuctionCardSkeleton, CardSkeleton } from "../components/ui/Skeleton";
import { PageLoader, InlineLoader } from "../components/ui/LoadingSpinner";
import { MobileSearchBar, MobileFilterPanel, MobileBidCard, MobileBottomNav, useSwipeGestures } from "../components/ui/MobileOptimized";
import { toast } from "react-hot-toast";

export default function Auctions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("none");
  const [timeLeft, setTimeLeft] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  const debounceRef = useRef(null);
  const requestSeq = useRef(0);

  // Compare & Shipping prefs
  const [compareIds, setCompareIds] = useState([]);
  const [locationPin, setLocationPin] = useState("");

  // Mobile-specific states
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeBottomNav, setActiveBottomNav] = useState('browse');
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Mobile gesture handling
  const swipeHandlers = useSwipeGestures(
    () => setShowMobileFilters(true), // Swipe left to open filters
    () => setShowMobileFilters(false) // Swipe right to close filters
  );

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("compareList") || "[]");
      if (Array.isArray(saved)) setCompareIds(saved);
      const pin = localStorage.getItem("shipPin") || "";
      setLocationPin(pin);
    } catch {}
  }, []);

  function toggleCompare(id) {
    setCompareIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 4);
      try { localStorage.setItem("compareList", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function savePin() {
    try { localStorage.setItem("shipPin", locationPin.trim()); } catch {}
  }

  const categories = [
    "Artifacts",
    "Coins",
    "Vintage",
    "Books",
    "Watches",
    "Weapons",
    "Paintings",
  ];

  // Map UI sort to API sort
  const apiSort = useMemo(() => {
    if (sort === "high") return "price_desc";
    if (sort === "low") return "price_asc";
    if (sort === "ending") return "end_soon";
    return "created_desc";
  }, [sort]);

  // Scroll to top on page change
  useEffect(() => {
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
  }, [page]);

  // Keep page within bounds whenever total pages change
  useEffect(() => {
    setPage((p) => {
      const max = Math.max(1, Number(pages) || 1);
      const np = Math.min(Math.max(1, p), max);
      return np;
    });
  }, [pages]);

  // Fetch data (debounced on search/page/filter changes) with stale-response guard
  useEffect(() => {
    setLoading(true);
    setError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const seq = ++requestSeq.current;
    debounceRef.current = setTimeout(() => {
      api
        .get("/auctions", {
          params: {
            q: search || undefined,
            category: category !== "all" ? category : undefined,
            priceMin: priceMin || undefined,
            priceMax: priceMax || undefined,
            timeLeft: timeLeft || undefined,
            sort: apiSort,
            page,
            limit,
          },
        })
        .then((res) => {
          if (seq !== requestSeq.current) return; // ignore stale response
          const data = res.data;
          // Support both paged and array responses
          if (Array.isArray(data)) {
            setItems(data);
            setPages(1);
            setTotal(data.length);
          } else {
            setItems(data.items || []);
            // normalize numeric values in case backend sends strings
            setPages(Number(data.pages) || 1);
            setTotal(Number(data.total) || 0);
          }
        })
        .catch((e) => {
          if (seq !== requestSeq.current) return; // ignore stale error
          setError(e?.response?.data?.message || "Failed to load auctions");
        })
        .finally(() => {
          if (seq !== requestSeq.current) return;
          setLoading(false);
        });
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search, category, apiSort, timeLeft, priceMin, priceMax, page]);

  function resetAndRefetch(updater) {
    setPage(1);
    updater();
  }

  async function saveThisSearch() {
    try {
      const name = window.prompt("Name this search", search ? `Results for "${search}"` : "Saved Search");
      if (!name) return;
      const query = {
        q: search || undefined,
        category: category !== "all" ? category : undefined,
        priceMin: priceMin || undefined,
        priceMax: priceMax || undefined,
        timeLeft: timeLeft || undefined,
        sort: apiSort,
      };
      await api.post('/saved-searches', { name, query, notifications: true });
      alert('Search saved. You can manage it in Saved Searches.');
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to save search');
    }
  }

  return (
    <div className="relative min-h-screen bg-[#04010a] text-white px-6 pt-32 pb-20 overflow-hidden">

      {/* =============== CYBERPUNK CITY OVERLAY =============== */}
      <div className="absolute inset-0 -z-10 bg-[url('https://th.bing.com/th/id/OIP.tgh660d6GOZAiPP6clX9-QHaEK?w=327&h=183&c=7&r=0&o=7&cb=ucfimg2&dpr=1.2&pid=1.7&rm=3&ucfimg=1')]
                      bg-cover bg-center opacity-[0.18] pointer-events-none mix-blend-screen" />

      {/* =============== MYSTIC ARCANE FOG =============== */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(150,60,255,0.36),transparent_70%),
                                        radial-gradient(circle_at_80%_80%,rgba(255,60,200,0.28),transparent_70%)] opacity-40 pointer-events-none" />

      {/* =============== CYBER RAIN STREAKS =============== */}
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute -z-10 w-[2px] h-[75px] bg-purple-400/30 blur-[1px] pointer-events-none"
          initial={{ x: Math.random() * 2000, y: -200 }}
          animate={{ y: "1800px" }}
          transition={{
            repeat: Infinity,
            duration: Math.random() * 0.8 + 0.5,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* =============== FLOATING ARCANE RUNES =============== */}
      <motion.img
        src="https://th.bing.com/th/id/OIP.vI0cUZocC3Q7l9c8HKoWjwHaJR?w=146&h=183&c=7&r=0&o=7&cb=ucfimg2&dpr=1.2&pid=1.7&rm=3&ucfimg=1"
        className="absolute -z-10 top-1/2 left-1/2 w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-[0.12] pointer-events-none select-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      />

      {/* =============== SEARCH & FILTERS BAR =============== */}
      <div className="relative z-10 max-w-7xl mx-auto mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

        {/* Search Bar */}
        <div className="flex items-center bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 w-full md:w-1/3 backdrop-blur-xl shadow-[0_0_15px_rgba(150,0,255,0.15)]">
          <FiSearch className="text-purple-300 text-xl" />
          <input
            placeholder="Search auctions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-purple-200 ml-3 w-full"
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center">

          {/* Category */}
          <select
            value={category}
            onChange={(e) => resetAndRefetch(() => setCategory(e.target.value))}
            className="bg-white/5 text-purple-600 border border-purple-500/20 px-4 py-3 rounded-xl backdrop-blur-xl shadow-[0_0_10px_rgba(150,0,255,0.2)] outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c.toLowerCase()}>
                {c}
              </option>
            ))}
          </select>

          {/* Time Left */}
          <select
            value={timeLeft}
            onChange={(e) => resetAndRefetch(() => setTimeLeft(e.target.value))}
            className="bg-white/5 text-purple-600 border border-purple-500/20 px-4 py-3 rounded-xl backdrop-blur-xl shadow-[0_0_10px_rgba(150,0,255,0.2)] outline-none"
          >
            <option value="">Any Time Left</option>
            <option value="1h">Ending in 1 hour</option>
            <option value="24h">Ending in 24 hours</option>
            <option value="7d">Ending in 7 days</option>
          </select>

          {/* Price Range */}
          <input
            type="number"
            inputMode="numeric"
            placeholder="Min ₹"
            value={priceMin}
            onChange={(e) => resetAndRefetch(() => setPriceMin(e.target.value))}
            className="w-28 bg-white/5 text-purple-200 border border-purple-500/20 px-3 py-3 rounded-xl backdrop-blur-xl outline-none"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="Max ₹"
            value={priceMax}
            onChange={(e) => resetAndRefetch(() => setPriceMax(e.target.value))}
            className="w-28 bg-white/5 text-purple-200 border border-purple-500/20 px-3 py-3 rounded-xl backdrop-blur-xl outline-none"
          />

          {/* Sorting */}
          <select
            value={sort}
            onChange={(e) => resetAndRefetch(() => setSort(e.target.value))}
            className="bg-white/5 text-purple-600 border border-purple-500/20 px-4 py-3 rounded-xl backdrop-blur-xl shadow-[0_0_10px_rgba(150,0,255,0.2)] outline-none"
          >
            <option value="none">Sort By</option>
            <option value="high">Highest Bid</option>
            <option value="low">Lowest Bid</option>
            <option value="ending">Ending Soon</option>
          </select>

          <FiFilter className="text-2xl text-purple-300 hidden md:block" />
          <button
            onClick={saveThisSearch}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-sm"
          >
            Save this search
          </button>
          <a href="/saved-searches" className="text-sm text-cyan-300 underline">Saved Searches</a>
        </div>
      </div>

      {/* ================== LOADING SKELETON ================== */}
      {loading && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1,2,3].map((i) => (
            <div key={i} className="h-64 bg-white/5 rounded-xl animate-pulse 
              shadow-[0_0_20px_rgba(160,0,255,0.15)]" />
          ))}
        </div>
      )}

      {/* ================== ERROR ================== */}
      {!loading && error && (
        <p className="text-center text-red-400">{error}</p>
      )}

      {/* ================== NO RESULTS ================== */}
      {!loading && !error && items.length === 0 && (
        <p className="text-center text-gray-400">No auctions found.</p>
      )}

      {/* ================== AUCTIONS GRID ================== */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">

        {items.map((a, i) => (
          <motion.div
            key={a._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative bg-white/5 border border-purple-500/20 rounded-2xl 
                       shadow-[0_0_28px_rgba(160,0,255,0.25)] hover:shadow-[0_0_45px_rgba(200,0,255,0.4)]
                       hover:bg-white/10 transition p-4 flex flex-col group backdrop-blur-xl"
          >

            {/* ==== ARCANE HOVER RING ==== */}
            <motion.img
              src="none"
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 opacity-0 group-hover:opacity-20 pointer-events-none transition"
            />

            {/* Image */}
            <div className="relative">
              <img
                src={a.image}
                className="rounded-xl h-48 w-full object-cover border border-purple-500/20"
                alt={a.title}
              />

              {/* Status Badge */}
              <span className={`absolute top-3 left-3 px-3 py-1 text-xs rounded-full 
                ${a.status === "active" ? "bg-pink-500/80" :
                  a.status === "ended" ? "bg-purple-700/80" :
                  "bg-blue-500/80"}`}
              >
                {a.status.toUpperCase()}
              </span>

              {/* Compare checkbox */}
              <label className="absolute top-3 right-3 bg-black/40 backdrop-blur px-2 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer select-none border border-white/10">
                <input
                  type="checkbox"
                  checked={compareIds.includes(a._id)}
                  onChange={() => toggleCompare(a._id)}
                />
                Compare
              </label>

              {/* Shipping estimate chip (if PIN set) */}
              {locationPin && (
                <span className="absolute bottom-3 right-3 px-2 py-1 rounded-lg text-xs bg-white/10 border border-white/20">
                  {(() => {
                    const zone = /\d{6}/.test(locationPin) ? 1 : 2;
                    const weight = Math.ceil(Number(a.weightKg || 2));
                    const base = 120; const perKg = zone === 1 ? 60 : 90;
                    return `Est. ₹${base + perKg * weight}`;
                  })()}
                </span>
              )}

            </div>

            {/* Info */}
            <div className="mt-4 flex-1">
              <h2 className="text-lg font-bold text-purple-200">{a.title}</h2>

              <p className="mt-1 text-gray-300 text-sm">
                Current Bid:{" "}
                <span className="text-pink-400 font-semibold">₹{a.currentPrice}</span>
              </p>

              <p className="mt-1 text-gray-500 text-xs">
                Ends: {new Date(a.endTime).toLocaleString()}
              </p>
            </div>

            {/* CTA */}
            <Link
              to={`/auction/${a._id}`}
              className="block mt-4 w-full text-center py-2 rounded-xl 
                         bg-gradient-to-r from-purple-600 to-pink-500 
                         hover:brightness-110 transition shadow-[0_0_25px_rgba(200,0,255,0.3)]"
            >
              View Details
            </Link>
          </motion.div>
        ))}

      </div>

      {/* ================== PAGINATION ================== */}
      {!loading && !error && pages > 1 && (
        <div className="relative z-10 max-w-7xl mx-auto mt-10 flex justify-center items-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => {
              console.debug('[Auctions] Prev clicked. Current page=', page);
              setPage((p) => Math.max(1, p - 1));
            }}
            className="px-4 py-2 rounded-lg bg-white/10 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-gray-300">Page {page} of {pages} • {total} results</span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => {
              console.debug('[Auctions] Next clicked. Current page=', page, 'of', pages);
              setPage((p) => Math.min(Number(pages) || 1, p + 1));
            }}
            className="px-4 py-2 rounded-lg bg-white/10 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
      {/* Compare bar & shipping PIN (page-scoped, at page bottom) */}
      {compareIds.length > 0 && (
        <div className="w-full px-6 mt-8 mb-8">
          <div className="max-w-7xl mx-auto flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-300">Compare:</span>
              <span className="text-cyan-300 font-semibold">{compareIds.length}</span>
              <a href="/compare" className="ml-2 px-3 py-1 rounded-lg bg-cyan-600/80 hover:bg-cyan-600 text-white text-sm">Open</a>
            </div>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="text-gray-300">PIN/Country:</span>
              <input
                value={locationPin}
                onChange={(e)=> setLocationPin(e.target.value)}
                onBlur={savePin}
                placeholder="560001 or USA"
                className="w-36 bg-black/40 border border-white/10 rounded px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
