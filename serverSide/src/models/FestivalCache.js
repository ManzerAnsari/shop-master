import mongoose from "mongoose";

const festivalEntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, default: "Public" },
  },
  { _id: false }
);

const festivalCacheSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, uppercase: true },
    year: { type: Number, required: true },
    festivals: {
      type: [festivalEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

festivalCacheSchema.index({ country: 1, year: 1 }, { unique: true });

export default mongoose.model("FestivalCache", festivalCacheSchema);
