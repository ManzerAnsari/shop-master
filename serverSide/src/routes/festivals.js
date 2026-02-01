import { Router } from "express";
import https from "https";
import FestivalCache from "../models/FestivalCache.js";

const router = Router();
const NAGER_HOST = "date.nager.at";
const CALENDARIFIC_HOST = "calendarific.com";

/**
 * Fetch public holidays from Nager.Date (free, no API key).
 * Supports 100+ countries (not India). Returns normalized { date, name, type }.
 */
function fetchFromNagerDate(year, countryCode) {
  return new Promise((resolve) => {
    const req = https.get(
      `https://${NAGER_HOST}/api/v3/PublicHolidays/${year}/${countryCode}`,
      (res) => {
        if (res.statusCode !== 200) {
          resolve(null);
          return;
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            resolve(
              (data || []).map((h) => ({
                date: h.date,
                name: h.name || h.localName,
                type: (h.types && h.types[0]) || "Public",
              }))
            );
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * Fetch public holidays from Calendarific (free tier, API key required).
 * Supports India and 230+ countries. Set CALENDARIFIC_API_KEY in .env.
 * Get a free key at https://calendarific.com/
 */
function fetchFromCalendarific(year, countryCode, apiKey) {
  if (!apiKey) return Promise.resolve(null);
  return new Promise((resolve) => {
    const path = `/api/v2/holidays?api_key=${encodeURIComponent(apiKey)}&country=${countryCode}&year=${year}`;
    const req = https.get(
      { hostname: CALENDARIFIC_HOST, path, method: "GET" },
      (res) => {
        if (res.statusCode !== 200) {
          resolve(null);
          return;
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            const holidays = data.response?.holidays || [];
            resolve(
              holidays.map((h) => ({
                date: h.date?.iso || (h.date && `${h.date.year}-${String(h.date.month).padStart(2, "0")}-${String(h.date.day).padStart(2, "0")}`) || "",
                name: h.name || "",
                type: h.type?.[0] || "national",
              })).filter((h) => h.date)
            );
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * Remove cached festival data for years no one checks anymore (older than previous year).
 * Runs in background; does not block the response.
 */
function cleanupOldFestivalCache() {
  const currentYear = new Date().getFullYear();
  const keepFromYear = currentYear - 1; // keep current year and previous year
  FestivalCache.deleteMany({ year: { $lt: keepFromYear } })
    .then((result) => {
      if (result.deletedCount > 0) {
        console.log(`Festival cache cleanup: removed ${result.deletedCount} old year(s)`);
      }
    })
    .catch((err) => console.error("Festival cache cleanup error:", err));
}

/**
 * GET /api/festivals?year=2025&country=IN
 * GET /api/festivals?startYear=2025&endYear=2026&country=US
 * - Fetches from DB cache first (by country + year). If missing, calls external API, saves to DB, then returns.
 * - India (IN): external API = Calendarific. Set CALENDARIFIC_API_KEY in .env.
 * - US, GB, etc.: external API = Nager.Date (free, no key).
 * - Old cache (year < currentYear - 1) is removed in background so DB stays small.
 */
router.get("/", async (req, res) => {
  try {
    const country = (req.query.country || "IN").toUpperCase();
    const year = req.query.year ? parseInt(req.query.year, 10) : null;
    const startYear = req.query.startYear ? parseInt(req.query.startYear, 10) : null;
    const endYear = req.query.endYear ? parseInt(req.query.endYear, 10) : null;

    const currentYear = new Date().getFullYear();
    const yearsToFetch = [];
    if (year && !isNaN(year)) yearsToFetch.push(year);
    else if (startYear != null && endYear != null && !isNaN(startYear) && !isNaN(endYear)) {
      for (let y = startYear; y <= endYear; y++) yearsToFetch.push(y);
    } else {
      yearsToFetch.push(currentYear, currentYear + 1);
    }

    const all = [];
    let source = "cache";

    for (const y of yearsToFetch) {
      const cached = await FestivalCache.findOne({ country, year: y });
      if (cached && Array.isArray(cached.festivals) && cached.festivals.length > 0) {
        all.push(...cached.festivals);
        continue;
      }

      // Cache miss: fetch from external API
      let list = null;
      if (country === "IN") {
        const apiKey = process.env.CALENDARIFIC_API_KEY;
        list = await fetchFromCalendarific(y, country, apiKey);
      } else {
        list = await fetchFromNagerDate(y, country);
      }

      if (list && list.length > 0) {
        source = country === "IN" ? "calendarific" : "nager.date";
        await FestivalCache.findOneAndUpdate(
          { country, year: y },
          { $set: { country, year: y, festivals: list } },
          { upsert: true }
        );
        all.push(...list);
      }
    }

    if (all.length > 0) {
      all.sort((a, b) => a.date.localeCompare(b.date));
    }

    // Remove old cache in background (year < currentYear - 1)
    cleanupOldFestivalCache();

    if (all.length > 0) {
      return res.json({ festivals: all, source, country });
    }

    if (country === "IN" && !process.env.CALENDARIFIC_API_KEY) {
      return res.json({
        festivals: [],
        source: "none",
        country,
        message: "Set CALENDARIFIC_API_KEY in .env for India holidays (free at calendarific.com).",
      });
    }
    return res.json({ festivals: [], source: "none", country });
  } catch (err) {
    console.error("Festivals route error:", err);
    return res.status(500).json({ message: "Failed to load festivals" });
  }
});

export default router;
