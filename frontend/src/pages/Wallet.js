import { motion } from "framer-motion";
import { useEffect, useState, useContext } from "react";
import { api } from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import io from "socket.io-client";
import { toast } from "react-hot-toast";
import { useSettings } from "../context/SettingsContext";

export default function Wallet() {
  const [wonAuctions, setWonAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [activity, setActivity] = useState([]);
  const [pending, setPending] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [otpRequired, setOtpRequired] = useState(null); // null=unknown, true/false after probe
  const { auth } = useContext(AuthContext);
  const HIGH_VALUE_THRESHOLD = 100000;
  const { settings } = useSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("deposit");
  const [modalAmount, setModalAmount] = useState("");
  const [modalOtp, setModalOtp] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [limits, setLimits] = useState({ dailyCap: 0, withdrawnToday: 0, remaining: null, bannedUntil: null });

  useEffect(() => {
    if (auth.token) {
      fetchWonAuctions();
      fetchBalance();
      fetchActivity();
      fetchPending();
      fetchDecisions();
      fetchLimits();
      const s = io("http://localhost:4000");
      if (auth.userId) s.emit("registerUser", auth.userId);
      const refresh = () => fetchWonAuctions();
      s.on("auctionEnded", refresh);
      s.on("purchaseCompleted", refresh);
      return () => {
        s.off("auctionEnded", refresh);
        s.off("purchaseCompleted", refresh);
        s.close();
      };
    }
  }, [auth.token]);

  const fetchWonAuctions = async () => {
    try {
      const res = await api.get("/auctions/user/won");
      setWonAuctions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch won auctions", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await api.get("/auth/me");
      const b = Number(res?.data?.wallet) || 0;
      setBalance(b);
    } catch (err) {
      console.error("Failed to fetch balance", err);
    }
  };

  const fetchActivity = async () => {
    try {
      const res = await api.get("/wallet/history", { params: { limit: 10 } });
      setActivity(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch wallet activity", err);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await api.get("/wallet/requests", { params: { status: 'pending' } });
      setPending(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch pending approvals", err);
    }
  };

  const fetchDecisions = async () => {
    try {
      const res = await api.get("/wallet/requests");
      const all = Array.isArray(res.data) ? res.data : [];
      const decided = all.filter(r => r.status === 'approved' || r.status === 'rejected').slice(0, 10);
      setDecisions(decided);
    } catch (err) {
      console.error("Failed to fetch recent decisions", err);
    }
  };

  const fetchLimits = async () => {
    try {
      const res = await api.get("/wallet/limits");
      setLimits(res.data || {});
    } catch (err) {
      // ignore
    }
  };

  const handleGetOtp = async () => {
    try {
      const res = await api.post("/wallet/request-otp");
      toast.success(res?.data?.message || "OTP sent to your email");
      setOtpRequired(true);
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to send OTP";
      toast.error(msg);
      if (/OTP not required/i.test(msg)) {
        setOtpRequired(false);
      }
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setModalAmount("");
    setModalOtp("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (modalSubmitting) return;
    setModalOpen(false);
  };

  const submitModal = async () => {
    const amount = Number(modalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }
    setModalSubmitting(true);
    try {
      const payload = modalOtp ? { amount, otp: modalOtp } : { amount };
      const url = modalType === 'withdraw' ? '/wallet/withdraw' : '/wallet/deposit';
      const res = await api.post(url, payload);
      if (res.status === 202) {
        toast(modalType === 'withdraw' ? "Withdrawal requires admin approval" : "Deposit requires admin approval", { icon: '⏳' });
        await fetchPending();
        await fetchDecisions();
      } else {
        toast.success(modalType === 'withdraw' ? "Withdrawal successful" : "Funds added successfully");
        await fetchBalance();
        await fetchActivity();
        await fetchDecisions();
        await fetchLimits();
      }
      setModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || (modalType === 'withdraw' ? "Withdrawal failed" : "Deposit failed");
      if (err?.response?.status === 401 && /OTP required/i.test(msg)) {
        setOtpRequired(true);
        toast.error("OTP required. Please enter the OTP sent to your email.");
      } else if (err?.response?.status === 403) {
        await fetchLimits();
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleAddFunds = () => openModal('deposit');

  const handleWithdraw = () => openModal('withdraw');

  return (
    <>
    <div className="relative min-h-screen pt-32 px-6 max-w-screen mx-auto text-white overflow-hidden">

      {/* ===== CYBERPUNK TOKYO BACKGROUND ===== */}
      <div className="absolute inset-0  bg-[url('https://th.bing.com/th/id/OIP.tgh660d6GOZAiPP6clX9-QHaEK?w=327&h=183&c=7&r=0&o=7&cb=ucfimg2&dpr=1.2&pid=1.7&rm=3&ucfimg=1')]
                      bg-cover bg-center opacity-[0.18] mix-blend-screen pointer-events-none" />

      {/* ===== ARCANE FOG (Mystic Purple + Cyan) ===== */}
      <div className="absolute inset-0 
          bg-[radial-gradient(circle_at_20%_20%,rgba(160,70,255,0.45),transparent_65%),
              radial-gradient(circle_at_80%_80%,rgba(0,200,255,0.38),transparent_65%)]
          opacity-40 pointer-events-none" />

      {/* ===== CYBER RAIN ===== */}
      {[...Array(35)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[2px] h-[80px] bg-cyan-300/20 blur-[1px]"
          initial={{ x: Math.random() * 2000, y: -200 }}
          animate={{ y: "1800px" }}
          transition={{ repeat: Infinity, duration: Math.random() * 1 + 0.6 }}
        />
      ))}

      {/* ===== ARCANE GLYPH SPINNING ===== */}
      <motion.img
        src="https://th.bing.com/th/id/OIP.vI0cUZocC3Q7l9c8HKoWjwHaJR?w=146&h=183&c=7&r=0&o=7&cb=ucfimg2&dpr=1.2&pid=1.7&rm=3&ucfimg=1"
        className="absolute top-1/3 left-1/2 w-[800px] -translate-x-1/2 opacity-[0.12] pointer-events-none select-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* ===== WALLET TITLE ===== */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-5xl font-extrabold 
                   bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 
                   text-transparent bg-clip-text drop-shadow-[0_0_18px_rgba(0,200,255,0.6)]"
      >
        My Wallet
      </motion.h1>

      {/* ===== WALLET CARD ===== */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="relative z-10 mt-12 p-10 rounded-3xl 
                   bg-white/10 backdrop-blur-2xl border border-purple-500/30 
                   shadow-[0_0_45px_rgba(150,0,255,0.35)] space-y-10 overflow-hidden"
      >

        {/* ===== INNER ARCANE RING ===== */}
        <motion.img
          src="none"
          className="absolute -top-20 right-0 w-[450px] opacity-[0.05]"
          animate={{ rotate: -360 }}
          transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
        />

        {/* ===== BALANCE DISPLAY ===== */}
        <div>
          <p className="text-2xl text-gray-300">Available Balance</p>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl font-extrabold mt-2 
                       bg-gradient-to-r from-cyan-400 to-purple-400 
                       text-transparent bg-clip-text
                       drop-shadow-[0_0_20px_rgba(0,200,255,0.4)]"
          >
            ₹{balance.toLocaleString('en-IN')}
          </motion.p>
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div className="flex gap-6 flex-wrap">

          <motion.button
            whileHover={{ scale: 1.05 }}
            className="px-8 py-4 rounded-xl text-xl font-semibold 
                       bg-gradient-to-r from-cyan-500 to-blue-600
                       shadow-[0_0_25px_rgba(0,200,255,0.4)]
                       hover:brightness-110 transition"
            onClick={handleAddFunds}
            disabled={!!settings?.maintenanceMode}
          >
            Add Funds
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            className="px-8 py-4 rounded-xl text-xl font-semibold 
                       bg-gradient-to-r from-purple-600 to-pink-500
                       shadow-[0_0_25px_rgba(200,0,255,0.35)]
                       hover:brightness-110 transition"
            onClick={handleWithdraw}
            disabled={!!settings?.maintenanceMode || !!settings?.freezeWithdrawals || (!!limits?.bannedUntil && new Date(limits.bannedUntil) > new Date())}
          >
            Withdraw
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            className="px-6 py-3 rounded-xl text-base font-semibold 
                       bg-gradient-to-r from-yellow-500 to-orange-500
                       shadow-[0_0_20px_rgba(255,200,0,0.35)]
                       hover:brightness-110 transition"
            onClick={handleGetOtp}
            disabled={otpRequired === false || !!settings?.maintenanceMode}
          >
            {otpRequired === false ? 'OTP Not Required' : 'Get OTP'}
          </motion.button>

        </div>

        {settings?.maintenanceMode ? (
          <p className="text-yellow-300 text-sm mt-2">
            Maintenance mode is active. Wallet actions are temporarily disabled.
          </p>
        ) : null}
        {settings?.freezeWithdrawals && !settings?.maintenanceMode ? (
          <p className="text-red-300 text-sm mt-2">
            Withdrawals are temporarily frozen by the admin.
          </p>
        ) : null}
        {!!limits?.bannedUntil && new Date(limits.bannedUntil) > new Date() ? (
          <p className="text-red-400 text-sm mt-2">
            Your account is currently restricted from withdrawals until {new Date(limits.bannedUntil).toLocaleString()}.
          </p>
        ) : null}
        {limits?.dailyCap > 0 ? (
          <p className="text-cyan-300 text-sm mt-2">
            Daily cap: ₹{Number(limits.dailyCap).toLocaleString('en-IN')} · Withdrawn today: ₹{Number(limits.withdrawnToday||0).toLocaleString('en-IN')} · Remaining: ₹{Number(limits.remaining||0).toLocaleString('en-IN')}
          </p>
        ) : null}

        {/* ===== RECENT ACTIVITY ===== */}
        <div className="mt-6">
          <h3 className="text-2xl font-semibold text-purple-200 drop-shadow-[0_0_10px_rgba(150,0,255,0.4)]">Recent Activity</h3>
          {activity.length === 0 ? (
            <p className="text-gray-400 mt-3 italic">No recent activity</p>
          ) : (
            <div className="mt-3 space-y-2">
              {activity.map((tx) => (
                <div key={tx._id}
                     className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-cyan-500/20">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${tx.type === 'deposit' ? 'bg-emerald-600/20 border-emerald-400/30 text-emerald-200' : 'bg-pink-600/20 border-pink-400/30 text-pink-200'}`}>
                      {tx.type === 'deposit' ? 'Deposit' : 'Withdraw'}
                    </span>
                    <span className="text-gray-300 text-sm">
                      {new Date(tx.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className={`font-semibold ${tx.type === 'deposit' ? 'text-emerald-300' : 'text-pink-300'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== PENDING APPROVALS ===== */}
        <div className="mt-6">
          <h3 className="text-2xl font-semibold text-yellow-200 drop-shadow-[0_0_10px_rgba(255,200,0,0.4)]">Pending Approvals</h3>
          {pending.length === 0 ? (
            <p className="text-gray-400 mt-3 italic">No pending approvals</p>
          ) : (
            <div className="mt-3 space-y-2">
              {pending.map((r) => (
                <div key={r._id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${r.type === 'deposit' ? 'bg-emerald-600/20 border-emerald-400/30 text-emerald-200' : 'bg-pink-600/20 border-pink-400/30 text-pink-200'}`}>
                      {r.type === 'deposit' ? 'Deposit' : 'Withdraw'}
                    </span>
                    <span className="text-gray-300 text-sm">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="font-semibold text-yellow-300">₹{Number(r.amount || 0).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== RECENT DECISIONS (Approved/Rejected) ===== */}
        <div className="mt-6">
          <h3 className="text-2xl font-semibold text-cyan-200 drop-shadow-[0_0_10px_rgba(0,200,255,0.4)]">Recent Decisions</h3>
          {decisions.length === 0 ? (
            <p className="text-gray-400 mt-3 italic">No recent decisions</p>
          ) : (
            <div className="mt-3 space-y-2">
              {decisions.map((r) => (
                <div key={r._id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-cyan-500/20">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${r.type === 'deposit' ? 'bg-emerald-600/20 border-emerald-400/30 text-emerald-200' : 'bg-pink-600/20 border-pink-400/30 text-pink-200'}`}>
                      {r.type === 'deposit' ? 'Deposit' : 'Withdraw'}
                    </span>
                    <span className="text-gray-300 text-sm">{new Date(r.createdAt).toLocaleString()}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${r.status === 'approved' ? 'bg-emerald-700/20 border-emerald-400/30 text-emerald-200' : 'bg-red-700/20 border-red-400/30 text-red-200'}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    {r.note ? <span className="text-xs text-gray-300 max-w-md truncate" title={r.note}>Note: {r.note}</span> : null}
                    <div className="font-semibold text-cyan-300">₹{Number(r.amount || 0).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== WON AUCTIONS ===== */}
        <div className="mt-6">
          <h3 className="text-2xl font-semibold text-purple-200 drop-shadow-[0_0_10px_rgba(150,0,255,0.4)]">
            Won Auctions
          </h3>

          {loading ? (
            <p className="text-gray-400 mt-3">Loading...</p>
          ) : wonAuctions.length === 0 ? (
            <p className="text-gray-400 mt-3 italic">You haven't won any auctions yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {wonAuctions.map((auction) => (
                <motion.div
                  key={auction._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 p-4 rounded-lg border border-cyan-500/30 hover:bg-white/10 transition"
                >
                  <img
                    src={auction.image}
                    alt={auction.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h4 className="text-lg font-bold text-cyan-300">{auction.title}</h4>
                  <p className="text-gray-300 mt-1">₹{auction.currentPrice}</p>
                  <p className="text-xs mt-1 opacity-80">{auction.status === "bought" ? "Purchased" : "Won"}</p>
                  <p className="text-sm text-gray-400 mt-1">Seller: {auction.sellerId?.name}</p>
                  <Link
                    to={`/auctions/${auction._id}`}
                    className="inline-block mt-3 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-sm font-semibold hover:brightness-110 transition"
                  >
                    View Details
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </motion.div>
    </div>
    {modalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6 text-white shadow-xl">
          <h3 className="text-2xl font-bold mb-4">{modalType === 'withdraw' ? 'Withdraw' : 'Add Funds'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-semibold">Amount (₹)</label>
              <input
                type="number"
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-cyan-500"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold">OTP</label>
                <button
                  onClick={handleGetOtp}
                  className="text-sm px-3 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50"
                  disabled={otpRequired === false || modalSubmitting}
                >
                  {otpRequired === false ? 'Not Required' : 'Send OTP'}
                </button>
              </div>
              <input
                type="text"
                value={modalOtp}
                onChange={(e) => setModalOtp(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-cyan-500"
                placeholder="Enter OTP if required"
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            <button onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600" disabled={modalSubmitting}>Cancel</button>
            <button onClick={submitModal} className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-50" disabled={modalSubmitting}>
              {modalSubmitting ? 'Processing...' : (modalType === 'withdraw' ? 'Withdraw' : 'Add Funds')}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
