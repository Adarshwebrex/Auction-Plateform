import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    platformFee: 5,
    maxAuctionDuration: 30,
    minStartingPrice: 100,
    emailNotifications: true,
    autoEndAuctions: true,
    maintenanceMode: false,
    bidIncrement: 50,
    defaultCurrency: "INR",
    refundWindowDays: 7,
    maxUploadMB: 5,
    enableRegistrations: true,
    requireKYCForSellers: false,
    walletHighValueThreshold: 100000,
    requireKYCForHighValue: false,
    requireOTPForWithdrawals: false,
    freezeWithdrawals: false,
    withdrawalDailyCap: 0,
    withdrawalViolationLimit: 3,
    autoBanDurationDays: 7,
    enableSnipingProtection: true,
    snipingExtensionMinutes: 2,
    maxAuctionsPerSeller: 50,
    supportEmail: "support@example.com",
    taxRatePercent: 0,
  });

  const [saving, setSaving] = useState(false);

  // Load current settings on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/settings");
        if (res.data) setSettings((prev) => ({ ...prev, ...res.data }));
      } catch (e) {
        // silent
      }
    })();
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      const res = await api.put("/settings", settings);
      setSettings((prev) => ({ ...prev, ...res.data }));
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div className="pt-28 px-8 pb-20 max-w-3xl mx-auto text-white">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-12"
      >
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
        >
          ← Back
        </button>
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          Admin Settings
        </h1>
      </motion.div>

      <div className="space-y-6">
        {/* Platform Fee */}
        <SettingInput
          label="Platform Fee (%)"
          value={settings.platformFee}
          type="number"
          onChange={(val) => handleChange("platformFee", val)}
          description="Commission percentage taken on each auction sale"
        />

        {/* Max Auction Duration */}
        <SettingInput
          label="Max Auction Duration (days)"
          value={settings.maxAuctionDuration}
          type="number"
          onChange={(val) => handleChange("maxAuctionDuration", val)}
          description="Maximum number of days an auction can run"
        />

        {/* Min Starting Price */}
        <SettingInput
          label="Minimum Starting Price (₹)"
          value={settings.minStartingPrice}
          type="number"
          onChange={(val) => handleChange("minStartingPrice", val)}
          description="Minimum allowed starting price for auctions"
        />

        {/* Email Notifications */}
        <SettingToggle
          label="Email Notifications"
          checked={settings.emailNotifications}
          onChange={(val) => handleChange("emailNotifications", val)}
          description="Send email notifications to users about auction updates"
        />

        {/* Auto End Auctions */}
        <SettingToggle
          label="Auto End Auctions"
          checked={settings.autoEndAuctions}
          onChange={(val) => handleChange("autoEndAuctions", val)}
          description="Automatically end auctions when the end time is reached"
        />

        {/* Maintenance Mode */}
        <SettingToggle
          label="Maintenance Mode"
          checked={settings.maintenanceMode}
          onChange={(val) => handleChange("maintenanceMode", val)}
          description="Temporarily disable user actions while maintenance is underway"
        />

        {/* Bid Increment */}
        <SettingInput
          label="Minimum Bid Increment (₹)"
          value={settings.bidIncrement}
          type="number"
          onChange={(val) => handleChange("bidIncrement", val)}
          description="Smallest allowed increment between consecutive bids"
        />

        {/* Default Currency */}
        <SettingInput
          label="Default Currency"
          value={settings.defaultCurrency}
          type="text"
          onChange={(val) => handleChange("defaultCurrency", val)}
          description="ISO currency code used for display"
        />

        {/* Refund Window */}
        <SettingInput
          label="Refund Window (days)"
          value={settings.refundWindowDays}
          type="number"
          onChange={(val) => handleChange("refundWindowDays", val)}
          description="Number of days buyers can request refunds"
        />

        {/* Max Upload Size */}
        <SettingInput
          label="Max Image Upload (MB)"
          value={settings.maxUploadMB}
          type="number"
          onChange={(val) => handleChange("maxUploadMB", val)}
          description="Limit for uploaded image size"
        />

        {/* Enable Registrations */}
        <SettingToggle
          label="Enable New Registrations"
          checked={settings.enableRegistrations}
          onChange={(val) => handleChange("enableRegistrations", val)}
          description="Allow users to sign up while enabled"
        />

        {/* Require KYC */}
        <SettingToggle
          label="Require KYC for Sellers"
          checked={settings.requireKYCForSellers}
          onChange={(val) => handleChange("requireKYCForSellers", val)}
          description="Show verification prompts and badge for verified sellers"
        />

        <div className="pt-4">
          <h2 className="text-2xl font-bold mb-4">Wallet & Security</h2>
          <SettingInput
            label="High-Value Transaction Threshold (₹)"
            value={settings.walletHighValueThreshold}
            type="number"
            onChange={(val) => handleChange("walletHighValueThreshold", val)}
            description="Transactions above this amount are considered high-value"
          />
          <SettingToggle
            label="Require KYC for High-Value Transactions"
            checked={settings.requireKYCForHighValue}
            onChange={(val) => handleChange("requireKYCForHighValue", val)}
            description="Buyers must complete KYC to transact over the threshold"
          />
          <SettingToggle
            label="Require OTP for Withdrawals"
            checked={settings.requireOTPForWithdrawals}
            onChange={(val) => handleChange("requireOTPForWithdrawals", val)}
            description="Adds an OTP verification step for wallet withdrawals"
          />
          <SettingToggle
            label="Freeze Withdrawals (Panic Mode)"
            checked={settings.freezeWithdrawals}
            onChange={(val) => handleChange("freezeWithdrawals", val)}
            description="Instantly blocks all withdrawals for non-admins"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <SettingInput
              label="Per-Day Withdrawal Cap (₹)"
              value={settings.withdrawalDailyCap}
              type="number"
              onChange={(val) => handleChange("withdrawalDailyCap", Number(val))}
              description="0 = unlimited; blocks withdrawals exceeding this total in a day"
            />
            <SettingInput
              label="Violation Threshold"
              value={settings.withdrawalViolationLimit}
              type="number"
              onChange={(val) => handleChange("withdrawalViolationLimit", Number(val))}
              description="Number of cap violations before auto-ban"
            />
            <SettingInput
              label="Auto-Ban Duration (days)"
              value={settings.autoBanDurationDays}
              type="number"
              onChange={(val) => handleChange("autoBanDurationDays", Number(val))}
              description="Ban duration applied when threshold is hit"
            />
          </div>
        </div>

        <div className="pt-4">
          <h2 className="text-2xl font-bold mb-4">Anti-Sniping</h2>
          <SettingToggle
            label="Enable Sniping Protection"
            checked={settings.enableSnipingProtection}
            onChange={(val) => handleChange("enableSnipingProtection", val)}
            description="Extend end time if a bid is placed near auction close"
          />
          <SettingInput
            label="Sniping Extension (minutes)"
            value={settings.snipingExtensionMinutes}
            type="number"
            onChange={(val) => handleChange("snipingExtensionMinutes", val)}
            description="Number of minutes to extend when sniping is detected"
          />
        </div>

        <div className="pt-4">
          <h2 className="text-2xl font-bold mb-4">Platform Limits & Support</h2>
          <SettingInput
            label="Max Auctions Per Seller"
            value={settings.maxAuctionsPerSeller}
            type="number"
            onChange={(val) => handleChange("maxAuctionsPerSeller", val)}
            description="Upper limit of concurrent auctions a seller can host"
          />
          <SettingInput
            label="Support Email"
            value={settings.supportEmail}
            type="text"
            onChange={(val) => handleChange("supportEmail", val)}
            description="Contact email displayed in help and system emails"
          />
          <SettingInput
            label="Tax Rate (%)"
            value={settings.taxRatePercent}
            type="number"
            onChange={(val) => handleChange("taxRatePercent", val)}
            description="Platform-wide default tax percentage (if applicable)"
          />
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={saving}
        className="mt-12 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-xl transition disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Settings"}
      </motion.button>
      </div>
    </AdminLayout>
  );
}

function SettingInput({ label, value, type, onChange, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white/5 border border-white/10 rounded-lg"
    >
      <label className="block text-lg font-semibold mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />
      <p className="text-gray-400 text-sm mt-2">{description}</p>
    </motion.div>
  );
}

function SettingToggle({ label, checked, onChange, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between"
    >
      <div>
        <label className="block text-lg font-semibold mb-1">{label}</label>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-14 h-8 rounded-full transition ${
          checked ? "bg-green-500" : "bg-gray-600"
        }`}
      >
        <div
          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition transform ${
            checked ? "translate-x-6" : ""
          }`}
        />
      </button>
    </motion.div>
  );
}
