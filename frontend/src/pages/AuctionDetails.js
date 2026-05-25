import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../utils/api";
import { useState, useEffect, useContext, useRef } from "react";
import io from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useSettings } from "../context/SettingsContext";
import { useFormatCurrency } from "../utils/currency";
import Modal from "../components/ui/Modal";
import LiveAuctionStream from "../components/live/LiveAuctionStream";
import ARViewer from "../components/experience/ARViewer";
import EnhancedChat from "../components/chat/EnhancedChat";
import AuctionAnalytics from "../components/analytics/AuctionAnalytics";

let socket;

export default function AuctionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [bid, setBid] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [related, setRelated] = useState([]);
  const [bids, setBids] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [inWishlist, setInWishlist] = useState(false);
  const [shipTo, setShipTo] = useState("");
  const [insure, setInsure] = useState(false);
  const [shipQuote, setShipQuote] = useState(null);
  const driftRef = useRef(0);
  const { auth } = useContext(AuthContext);
  const { settings } = useSettings();
  const { format } = useFormatCurrency();
  const auctionCategories = new Set(["antique", "vintage", "collectables"]);
  const [spinIdx, setSpinIdx] = useState(0);
  const [mediaTab, setMediaTab] = useState('image'); // image | video | spin
  const [myMaxBid, setMyMaxBid] = useState(null);
  const [showMaxModal, setShowMaxModal] = useState(false);
  const [maxInput, setMaxInput] = useState("");
  const [showZoom, setShowZoom] = useState(false);
  const [outbid, setOutbid] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [wishPulse, setWishPulse] = useState(false);
  const [showARViewer, setShowARViewer] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // details, stream, analytics, chat

  // FETCH DATA
  useEffect(() => {
    fetchData();

    // Initialize socket and join auction room
    if (!socket) socket = io("http://localhost:4000");
    socket.emit("join", { room: `auction:${id}` });

    const onBidPlaced = (data) => {
      if (data?.auctionId === id || data?.id === id) {
        // If another user bids and surpasses/equals my max, consider me outbid
        const myId = auth?.userId || localStorage.getItem("userId");
        if (myId && String(data.userId) !== String(myId)) {
          if (myMaxBid && Number(data.amount) >= Number(myMaxBid)) {
            setOutbid(true);
            toast((t) => (
              <span>
                You are outbid. <button onClick={() => { raiseByIncrement(); toast.dismiss(t.id); }} className="underline text-cyan-300">Raise +increment</button>
              </span>
            ));
          }
        }
        setAuction((prev) => prev ? { ...prev, currentPrice: data.amount } : prev);
        setBids((prev) => [{ amount: data.amount, userId: data.userId }, ...prev]);
      }
    };
    const onUpdateBidLegacy = (data) => {
      if (data?.id === id) {
        setAuction((prev) => prev ? { ...prev, currentPrice: data.amount } : prev);
        setBids((prev) => [{ amount: data.amount, userId: data.userId }, ...prev]);
      }
    };

    const onAuctionEnded = (data) => {
      if (data?.auctionId === id || data?.id === id) {
        toast("Auction has ended");
        setAuction((prev) => prev ? { ...prev, status: "ended" } : prev);
      }
    };

    socket.on("bidPlaced", onBidPlaced);
    socket.on("updateBid", onUpdateBidLegacy);
    socket.on("auctionEnded", onAuctionEnded);

    return () => {
      socket.emit("leave", { room: `auction:${id}` });
      socket.off("bidPlaced", onBidPlaced);
      socket.off("updateBid", onUpdateBidLegacy);
      socket.off("auctionEnded", onAuctionEnded);
    };
  }, [id]);

  const fetchData = async () => {
    const res = await api.get(`/auctions/${id}`);
    setAuction(res.data);
    try {
      const item = {
        id: res?.data?._id || id,
        title: res?.data?.title || "",
        image: Array.isArray(res?.data?.images) && res.data.images.length ? res.data.images[0] : (res?.data?.image || ""),
        price: Number(res?.data?.currentPrice || 0),
        viewedAt: Date.now()
      };
      const raw = localStorage.getItem("recently_viewed");
      const list = Array.isArray(JSON.parse(raw || "null")) ? JSON.parse(raw) : [];
      const filtered = list.filter((x) => (x.id || x._id) !== item.id);
      const updated = [item, ...filtered].slice(0, 20);
      localStorage.setItem("recently_viewed", JSON.stringify(updated));
    } catch {}
    setSpinIdx(0);
    // Compute drift using server date header if available
    try {
      const serverDate = res?.headers?.date ? new Date(res.headers.date).getTime() : null;
      if (serverDate) {
        driftRef.current = serverDate - Date.now();
      }
    } catch {}

    // Fetch bids separately
    try {
      const bidsRes = await api.get(`/bids/${id}`);
      setBids(bidsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch bids", err);
      setBids([]);
    }

    // Fetch personal bids when logged in
    try {
      if (auth?.token) {
        // Load my max bid for proxy bidding UI
        try {
          const mb = await api.get(`/bids/${id}/max`);
          setMyMaxBid(mb?.data?.maxAmount ?? null);
        } catch {}
        const myBidsRes = await api.get(`/bids/${id}/me`);
        setMyBids(myBidsRes.data || []);
      } else {
        setMyBids([]);
        setMyMaxBid(null);
      }
    } catch (err) {
      setMyBids([]);
    }

    const relatedRes = await api.get(`/auctions`, { params: { category: res.data.category } });
    const relData = relatedRes.data.items || relatedRes.data; // support new pagination
    setRelated((relData || []).slice(0, 3));

    startTimer(res.data.endTime);

    // Initialize wishlist state
    try {
      if (auth?.token) {
        const wl = await api.get(`/wishlist`);
        const list = wl.data || [];
        const present = Array.isArray(list) ? list.some((x) => (x._id || x.auctionId?._id) === id) : false;
        setInWishlist(present);
      } else {
        setInWishlist(false);
      }
    } catch {
      setInWishlist(false);
    }
  };

  // TIMER
  const startTimer = (endTime) => {
    const interval = setInterval(() => {
      const now = new Date(Date.now() + (driftRef.current || 0));
      const end = new Date(endTime);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Ended");
        clearInterval(interval);
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      if (h > 0) {
        setTimeLeft(`${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }
      setUrgent(totalSeconds <= 60);
    }, 1000);
  };

  // PLACE BID
  const placeBid = async () => {
    try {
      if (bid <= auction.currentPrice) {
        toast.error("Bid must be higher than current price");
        return;
      }
      // client-side enforcement of bid increment if configured
      const inc = Number(settings?.bidIncrement || 0);
      if (inc > 0) {
        const required = Number(auction.currentPrice) + inc;
        if (Number(bid) < required) {
          toast.error(`Minimum next bid is ₹${required} (increment ₹${inc})`);
          return;
        }
      }
      const amount = Number(bid);
      // Optimistic update
      const prevPrice = auction.currentPrice;
      const prevBids = bids;
      setAuction((prev) => ({ ...prev, currentPrice: amount }));
      setBids((prev) => [{ amount, userId: auth?.userId }, ...prev]);

      await api.post(`/bids/${id}`, { amount });
      socket && socket.emit("newBid", { id, amount });
      setBid("");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to place bid";
      toast.error(msg);
      // Rollback optimistic update
      fetchData();
    }
  };

  // WATCHLIST TOGGLE
  async function toggleWishlist() {
    try {
      if (!auth?.token) return navigate("/login");
      if (inWishlist) {
        await api.delete(`/wishlist/${id}`);
        setInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await api.post(`/wishlist`, { auctionId: id });
        setInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update wishlist");
    }
  }

  // BUY NOW
  const buyNow = async () => {
    navigate(`/payment/${id}`);
  };

  // Raise current bid by increment quickly
  const raiseByIncrement = async () => {
    const inc = Number(settings?.bidIncrement || 1);
    const next = Number(auction?.currentPrice || 0) + inc;
    setBid(String(next));
    await placeBid();
    setOutbid(false);
  };

  // START CHAT WITH SELLER
  const startChat = async () => {
    try {
      if (!auth?.token) return navigate("/login");
      const rawSeller = auction?.seller ?? auction?.sellerId;
      const sellerId = typeof rawSeller === "string" ? rawSeller : rawSeller?._id;
      const payload = { auctionId: auction?._id || id };
      if (sellerId) payload.sellerId = sellerId;
      const res = await api.post("/chat/start", payload);
      const chatId = res?.data?._id;
      // Navigate to full-page chat room
      if (chatId) navigate(`/chat/${chatId}`);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to start chat";
      toast.error(msg);
    }
  };

  if (!auction) return <p className="text-white p-10">Loading...</p>;

  const isAuction = auctionCategories.has((auction.category || "").toLowerCase());
  const relatedPrices = (related || []).map((r) => Number(r.currentPrice || 0)).filter((n) => n > 0);
  let fairLow = null, fairHigh = null;
  if (relatedPrices.length >= 3) {
    const sorted = [...relatedPrices].sort((a,b)=>a-b);
    const mid = sorted[Math.floor(sorted.length/2)];
    fairLow = Math.round(mid * 0.85);
    fairHigh = Math.round(mid * 1.15);
  }

  function estimateShipping() {
    const base = 120;
    const zone = shipTo && /\d{6}/.test(shipTo) ? 1 : 2;
    const weightKg = Number(auction?.weightKg || 2);
    const perKg = zone === 1 ? 60 : 90;
    let cost = base + perKg * Math.ceil(weightKg);
    if (insure) cost += Math.ceil((Number(auction?.currentPrice || 0)) * 0.01);
    setShipQuote({ cost, eta: zone === 1 ? "2-4 days" : "4-7 days" });
  }

  // Open modal to set/update proxy max bid (component scope)
  const openMaxBidModal = () => {
    if (!auth?.token) return navigate("/login");
    setMaxInput(myMaxBid ? String(myMaxBid) : "");
    setShowMaxModal(true);
  };

  const saveMaxBid = async () => {
    try {
      const maxAmount = Number(maxInput);
      if (!maxAmount || Number.isNaN(maxAmount)) {
        toast.error("Enter a valid amount");
        return;
      }
      if (!(maxAmount > (auction?.currentPrice || 0))) {
        toast.error("Max must exceed current price");
        return;
      }
      await api.post(`/bids/${id}/max`, { maxAmount });
      setMyMaxBid(maxAmount);
      toast.success("Max bid saved");
      setShowMaxModal(false);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save max bid");
    }
  };

  return (
    <div className="relative pt-24 px-6 max-w-7xl mx-auto text-white overflow-hidden">

      {/* CYBERPUNK BACKGROUND */}
      <div className="absolute inset-0  bg-[url('https://th.bing.com/th/id/OIP.tgh660d6GOZAiPP6clX9-QHaEK?w=327&h=183&c=7&r=0&o=7&cb=ucfimg2&dpr=1.2&pid=1.7&rm=3&ucfimg=1')]
                      bg-cover bg-center opacity-[0.12] mix-blend-screen pointer-events-none" />

      {/* ARCANE FOG */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(170,60,255,0.4),transparent_70%),
                                        radial-gradient(circle_at_80%_80%,rgba(0,200,255,0.45),transparent_70%)] opacity-40" />

      {/* CYBER RAIN */}
      {[...Array(35)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[2px] h-[80px] bg-cyan-300/20 blur-[1px]"
          initial={{ x: Math.random() * 2000, y: -200 }}
          animate={{ y: "1800px" }}
          transition={{ repeat: Infinity, duration: Math.random() * 1 + 0.6 }}
        />
      ))}

      {/* ARCANE SPELL CIRCLE */}
      <motion.img
        src="https://th.bing.com/th/id/OIP.vI0cUZocC3Q7l9c8HKoWjwHaJR?w=146&h=183&c=7&r=0&o=7&cb=ucfimg2&dpr=1.2&pid=1.7&rm=3&ucfimg=1"
        className="absolute top-40 left-1/2 -translate-x-1/2 w-[900px] opacity-[0.1] pointer-events-none select-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* HEADER */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-5xl font-extrabold drop-shadow-[0_0_15px_rgba(0,200,255,0.5)]"
      >
        {auction.title}
      </motion.h1>

      <p className="relative z-10 text-purple-300 mt-1 tracking-wider text-sm">
        {auction.category}
      </p>

      {/* NEW FEATURE TABS */}
      <div className="relative z-10 mt-6">
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1 backdrop-blur-sm border border-white/10">
          {[
            { id: 'details', label: 'Details', icon: 'info' },
            { id: 'stream', label: 'Live Stream', icon: 'video' },
            { id: 'analytics', label: 'Analytics', icon: 'chart' },
            { id: 'chat', label: 'Chat', icon: 'message' },
            { id: 'ar', label: '3D/AR View', icon: 'cube' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 rounded-md transition-all text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="relative z-10 mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* IMAGE + STATUS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-purple-500/20 
                     shadow-[0_0_35px_rgba(150,0,255,0.25)] relative overflow-hidden min-w-0"
        >
          {/* Hologram overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/10 pointer-events-none" />

          {(() => {
            const media = Array.isArray(auction.media) ? auction.media : [];
            const images = media.filter(m => m?.type === 'image').map(m => m.url);
            const videos = media.filter(m => m?.type === 'video').map(m => m.url);
            const spins  = media.filter(m => m?.type === 'spin').map(m => m.url);
            const imgs = images.length > 0 ? images : (Array.isArray(auction.images) && auction.images.length ? auction.images : [auction.image]);

            const hasVideo = videos.length > 0;
            const hasSpin = spins.length > 0;

            const tabs = [
              { key: 'image', label: `Images (${imgs.length})`, show: imgs && imgs.length },
              { key: 'video', label: `Video${hasVideo && videos.length>1 ? 's' : ''}${hasVideo? ` (${videos.length})`: ''}`, show: hasVideo },
              { key: 'spin',  label: '360°', show: hasSpin },
            ].filter(t=>t.show);

            return (
              <div>
                {tabs.length > 1 && (
                  <div className="mb-3 flex gap-2">
                    {tabs.map(t => (
                      <button key={t.key} onClick={()=> setMediaTab(t.key)} className={`px-3 py-1.5 rounded-lg text-sm border ${mediaTab===t.key ? 'bg-cyan-600/30 border-cyan-400/50' : 'bg-white/5 border-white/10'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}

                {mediaTab === 'video' && hasVideo ? (
                  <video src={videos[0]} controls className="w-full rounded-2xl border border-white/10" />
                ) : mediaTab === 'spin' && hasSpin ? (
                  <div className="w-full h-80 rounded-2xl border border-white/10 bg-black/30 flex items-center justify-center text-sm text-gray-300">
                    360° viewer coming soon
                  </div>
                ) : (
                  <>
                    <img
                      src={imgs[Math.min(spinIdx, imgs.length - 1)]}
                      className="rounded-2xl shadow-[0_0_25px_rgba(0,200,255,0.25)] w-full cursor-zoom-in"
                      loading="lazy"
                      onClick={() => setShowZoom(true)}
                      alt={auction.title}
                    />
                    {imgs.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                        {imgs.map((u, i) => (
                          <button key={i} onClick={() => setSpinIdx(i)} className={`w-16 h-16 rounded-lg overflow-hidden border ${i===spinIdx?"border-cyan-400":"border-white/10"}`}>
                            <img src={u} loading="lazy" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })()}

          <div className="mt-4 flex justify-between items-center">
            <span className={`px-4 py-1 rounded-full text-sm 
              ${auction.status === "active" ? "bg-green-500/30 text-green-300" : "bg-red-500/30 text-red-300"}`}>
              {auction.status.toUpperCase()}
            </span>

            <span className={`text-lg font-semibold ${urgent ? 'text-red-300 animate-pulse' : 'text-cyan-300'}`}>
              {timeLeft === "Ended" ? "Auction Ended" : `Ends in: ${timeLeft}`}
            </span>
          </div>

          {/* Watchlist */}
          {auth?.token && (
            <button
              onClick={async () => { await toggleWishlist(); setWishPulse(true); setTimeout(()=>setWishPulse(false), 400); }}
              className={`mt-4 px-4 py-2 rounded-lg border transform transition ${wishPulse ? 'scale-110' : ''} ${inWishlist ? "bg-pink-600/60 border-pink-400" : "bg-white/10 border-white/20"}`}
            >
              {inWishlist ? "Remove from Watchlist" : "Add to Watchlist"}
            </button>
          )}

          {/* REVIEWS LINKS */}
          <div className="mt-8 flex items-center gap-4">
            <Link
              to={`/reviews/${id}`}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition"
            >
              View Reviews
            </Link>
            <Link
              to={`/reviews/add/${id}`}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 transition"
            >
              Write a Review
            </Link>
          </div>
        </motion.div>

        {/* DETAILS PANEL */}
        <motion.div
          initial={{ x: 35, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="p-8 rounded-3xl bg-white/5 backdrop-blur-2xl 
                     border border-purple-500/20 shadow-[0_0_35px_rgba(170,0,255,0.2)] space-y-6 min-w-0"
        >
          <h2 className="text-3xl font-bold">
            {isAuction ? "Highest Bid" : "Price"}: <span className="text-cyan-400">{format(auction.currentPrice)}</span>
          </h2>
          {isAuction && (
            <div className="text-xs text-gray-300 flex flex-col gap-1">
              <span>Soft close active: bids in the last {Number(auction?.softCloseSeconds || 120)}s extend the timer.</span>
              {typeof auction?.reservePrice === 'number' && auction?.reservePrice > 0 && (
                <span className={`${Number(auction.currentPrice) >= Number(auction.reservePrice) ? 'text-emerald-300' : 'text-yellow-300'}`}>
                  {Number(auction.currentPrice) >= Number(auction.reservePrice) ? 'Reserve met' : `Reserve not met (₹${format(auction.reservePrice).replace(/[^0-9₹.,]/g,'')})`}
                </span>
              )}
            </div>
          )}
          {!isAuction && fairLow && fairHigh && (
            <p className="text-sm text-emerald-300">Fair price range: {format(fairLow)} – {format(fairHigh)}</p>
          )}
          {!isAuction && (
            <p className="text-sm text-gray-300">Stock: {typeof auction.quantity === 'number' ? auction.quantity : 0}</p>
          )}

          <p className="text-gray-300">{auction.description}</p>

          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Destination (PIN or Country)</label>
                <input value={shipTo} onChange={(e)=>setShipTo(e.target.value)} placeholder="e.g., 560001 or USA" className="w-full bg-black/30 p-3 rounded-xl border border-white/10" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={insure} onChange={(e)=>setInsure(e.target.checked)} />
                Add insurance (~1%)
              </label>
              <button onClick={estimateShipping} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20">Estimate Shipping</button>
            </div>
            {shipQuote && (
              <div className="mt-3 text-sm text-gray-200">
                <span className="mr-4">Estimated cost: <span className="text-cyan-300 font-semibold">{format(shipQuote.cost)}</span></span>
                <span>ETA: <span className="text-gray-300">{shipQuote.eta}</span></span>
              </div>
            )}
          </div>

          {/* BUY NOW (only for non-auction categories) */}
          {!isAuction && auction.buyNowPrice && auction.status === "active" && (
            auction.quantity > 0 ? (
              <button
                onClick={buyNow}
                className="w-full py-3 text-lg rounded-xl bg-gradient-to-r from-purple-600 to-pink-500
                           shadow-[0_0_25px_rgba(200,0,255,0.4)] hover:brightness-110 transition disabled:bg-gray-700 disabled:cursor-not-allowed"
                disabled={!!settings?.maintenanceMode}
              >
                Buy Now for {format(auction.buyNowPrice)}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3 text-lg rounded-xl bg-gray-700 cursor-not-allowed opacity-70"
              >
                Out of stock
              </button>
            )
          )}

          {/* BID INPUT (only for auction categories) */}
          {isAuction && auth.token && auction.status === "active" && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                value={bid}
                onChange={(e) => setBid(e.target.value)}
                placeholder="Enter your bid"
                className="w-full sm:flex-grow bg-black/30 p-3 rounded-xl border border-purple-500/20 
                           text-purple-200 shadow-[0_0_15px_rgba(150,0,255,0.15)] outline-none focus:border-cyan-400"
              />
              <button
                onClick={placeBid}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600
                           shadow-[0_0_25px_rgba(0,200,255,0.4)] hover:brightness-110 transition disabled:bg-gray-700 disabled:cursor-not-allowed"
                disabled={!!settings?.maintenanceMode}
              >
                Place Bid
              </button>
              <button
                onClick={openMaxBidModal}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 disabled:bg-gray-700 disabled:cursor-not-allowed"
                disabled={!!settings?.maintenanceMode}
              >
                Set Max Bid
              </button>
            </div>
          )}
          {isAuction && auth.token && outbid && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/15 border border-red-400/30 text-red-200 flex items-center justify-between">
              <span>You have been outbid.</span>
              <button onClick={raiseByIncrement} className="px-3 py-1 rounded bg-red-600 hover:bg-red-700">Raise +increment</button>
            </div>
          )}
          {isAuction && auth.token && (
            <p className="text-xs text-gray-400 mt-1">{myMaxBid ? `Your max bid: ₹${myMaxBid}` : 'You have no max bid set.'}</p>
          )}
          {isAuction && settings?.bidIncrement ? (
            <p className="text-xs text-gray-400 mt-2">
              Minimum increment: ₹{settings.bidIncrement}. Next bid should be at least ₹{Number(auction.currentPrice) + Number(settings.bidIncrement)}.
            </p>
          ) : null}

          {/* BID HISTORY */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-purple-200">Bid History</h3>

            {bids.length === 0 && (
              <p className="text-gray-400 mt-2">No bids yet.</p>
            )}

            <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar pr-2 mt-3">
              {bids.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 p-3 rounded-lg border border-white/10 text-gray-200 
                             shadow-[0_0_15px_rgba(180,0,255,0.2)]"
                >
                  {format(b.amount)}
                </motion.div>
              ))}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveTab('analytics')}
              className="px-4 py-2 bg-purple-600/20 border border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors text-sm font-medium"
            >
              View Analytics
            </button>
            <button
              onClick={() => setActiveTab('ar')}
              className="px-4 py-2 bg-blue-600/20 border border-blue-500/50 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors text-sm font-medium"
            >
              3D/AR View
            </button>
            <button
              onClick={() => setActiveTab('stream')}
              className="px-4 py-2 bg-green-600/20 border border-green-500/50 text-green-300 rounded-lg hover:bg-green-600/30 transition-colors text-sm font-medium"
            >
              Live Stream
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className="px-4 py-2 bg-orange-600/20 border border-orange-500/50 text-orange-300 rounded-lg hover:bg-orange-600/30 transition-colors text-sm font-medium"
            >
              Join Chat
            </button>
          </div>

          {/* YOUR BIDS */}
          {auth?.token && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-purple-200">Your Bids</h3>
              {myBids.length === 0 && (
                <p className="text-gray-400 mt-2">You have not placed any bids yet.</p>
              )}
              <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar pr-2 mt-3">
                {myBids.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 p-3 rounded-lg border border-white/10 text-gray-200 
                               shadow-[0_0_15px_rgba(180,0,255,0.2)]"
                  >
                    {format(b.amount)}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* SELLER INFO */}
          <div className="mt-10">
            <h3 className="text-xl font-semibold text-purple-200">Seller</h3>

            <div className="flex items-center gap-4 mt-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 
                              flex items-center justify-center font-bold text-xl">
                {(auction.seller?.name || auction.sellerId?.name || "S").slice(0,1)}
              </div>

              <div>
                <p className="font-semibold flex items-center gap-2">
                  {auction.seller?.name || auction.sellerId?.name}
                  {(auction.seller?.kycVerified || auction.sellerId?.kycVerified) && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-600/30 border border-emerald-400/40 text-emerald-200">Verified</span>
                  )}
                </p>
                <p className="text-gray-400">{auction.seller?.email || auction.sellerId?.email}</p>
              </div>
            </div>

            {auth?.token && (() => {
              const rawSeller = auction?.seller ?? auction?.sellerId;
              const sellerId = typeof rawSeller === "string" ? rawSeller : rawSeller?._id;
              const myId = auth?.userId || localStorage.getItem("userId");
              const isMine = sellerId && myId && sellerId === myId;
              return !isMine;
            })() && (
              <button
                onClick={startChat}
                className="mt-4 w-full py-3 text-lg rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition"
              >
                Chat with Seller
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* NEW FEATURE TAB CONTENT */}
      <div className="relative z-10 mt-10">
        {activeTab === 'details' && (
          <div className="text-center text-white/60 py-8">
            <p>Original auction details are shown above</p>
          </div>
        )}

        {activeTab === 'stream' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white">Live Auction Stream</h2>
            <LiveAuctionStream 
              auctionId={id}
              isLive={auction?.status === 'active'}
              onStreamStart={() => toast.success('Stream started')}
              onStreamEnd={() => toast.info('Stream ended')}
            />
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white">Auction Analytics</h2>
            <AuctionAnalytics 
              auctionId={id}
              timeRange="7d"
            />
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white">Live Auction Chat</h2>
            <EnhancedChat 
              auctionId={id}
              userId={auth?.user?.id || 'guest'}
              userName={auth?.user?.name || 'Guest User'}
            />
          </motion.div>
        )}

        {activeTab === 'ar' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white">3D/AR Product View</h2>
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <p className="text-white/60 mb-4">Experience this item in 3D and Augmented Reality</p>
              <button
                onClick={() => setShowARViewer(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Open 3D/AR Viewer
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Sticky mini-timer for urgency */}
      {isAuction && urgent && auction?.status === 'active' && timeLeft !== 'Ended' && (
        <div className="fixed bottom-6 right-6 z-40 px-4 py-2 rounded-full bg-red-600 text-white shadow-lg animate-pulse">
          Ends in: {timeLeft}
        </div>
      )}

      {/* RELATED AUCTIONS */}
      <div className="relative z-10 mt-20">
        <h2 className="text-3xl font-bold mb-6 text-purple-200">You May Also Like</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {related.map((r) => (
            <motion.div
              key={r._id}
              whileHover={{ scale: 1.03 }}
              className="bg-white/5 p-5 rounded-xl border border-purple-500/20 
                         shadow-[0_0_25px_rgba(160,0,255,0.25)] hover:bg-white/10 transition"
            >
              <img src={r.image} loading="lazy" className="rounded-xl h-40 w-full object-cover" />
              <h3 className="text-lg font-bold mt-3">{r.title}</h3>
              <p className="text-cyan-300">{format(r.currentPrice)}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Image Zoom Modal */}
      <Modal open={showZoom} onClose={() => setShowZoom(false)}>
        <h3 className="text-xl font-bold mb-3">Image Preview</h3>
        {(() => {
          const imgs = Array.isArray(auction.images) && auction.images.length > 0 ? auction.images : [auction.image];
          const current = imgs[Math.min(spinIdx, imgs.length - 1)];
          return (
            <img src={current} className="w-full max-h-[70vh] object-contain rounded-xl border border-white/10" />
          );
        })()}
      </Modal>

      {/* AR Viewer Modal */}
      {showARViewer && (
        <ARViewer
          auction={auction}
          images={Array.isArray(auction.images) && auction.images.length > 0 ? auction.images : [auction.image]}
          onClose={() => setShowARViewer(false)}
        />
      )}
    </div>
  );
}
