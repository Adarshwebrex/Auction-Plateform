const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: "user" }, // user, admin, seller
    phone: { type: String, default: "" },
    username: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    timezone: { type: String, default: "" },
    address: { type: String, default: "" },
    addresses: [
      new mongoose.Schema(
        {
          label: { type: String, default: "" },
          name: { type: String, default: "" },
          line1: { type: String, default: "" },
          line2: { type: String, default: "" },
          city: { type: String, default: "" },
          state: { type: String, default: "" },
          postalCode: { type: String, default: "" },
          country: { type: String, default: "" },
          phone: { type: String, default: "" },
          isDefault: { type: Boolean, default: false },
        },
        { _id: false }
      ),
    ],
    avatar: { type: String, default: "" },
    wallet: { type: Number, default: 0 },
    kycVerified: { type: Boolean, default: false },
    kycRequested: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorTempOtp: { type: String, default: "" },
    twoFactorOtpExpires: { type: Date, default: null },
    twoFactorLastSentAt: { type: Date, default: null },
    lastReauthAt: { type: Date, default: null },
    // Policy enforcement
    withdrawalViolationCount: { type: Number, default: 0 },
    bannedUntil: { type: Date, default: null },
    storeBio: { type: String, default: "" },
    twitter: { type: String, default: "" },
    instagram: { type: String, default: "" },
    website: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    panNumber: { type: String, default: "" },
    prefs: {
      type: Object,
      default: {
        notifyOnBid: true,
        notifyOnOrder: true,
        allowOfferMessages: true,
        defaultShippingProvider: "Custom",
        defaultHandlingDays: 3,
        requireKYC: false,
        payoutMethod: "bank",
      }
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
