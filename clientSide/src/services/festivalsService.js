/**
 * Festivals Service
 * Fetches calendar events (public holidays) from the server.
 * - India (IN): server uses serverSide/src/data/festivals.json (update yearly).
 * - Other countries (US, GB, etc.): server uses Nager.Date API (free, no key, always up-to-date).
 */

import api from "../lib/axios";

/**
 * Get festivals for a single year or a year range, optionally by country.
 * @param {Object} options
 * @param {number} [options.year] - Single year (e.g. 2025)
 * @param {number} [options.startYear] - Start year for range
 * @param {number} [options.endYear] - End year for range
 * @param {string} [options.country] - ISO country code (e.g. IN, US, GB). IN = local JSON; others = Nager.Date API.
 * @returns {Promise<Array<{ date: string, name: string, type: string }>>}
 */
export const getFestivals = async ({
  year,
  startYear,
  endYear,
  country = "IN",
} = {}) => {
  const params = { country: country.toUpperCase() };
  if (year != null) params.year = year;
  if (startYear != null) params.startYear = startYear;
  if (endYear != null) params.endYear = endYear;

  const response = await api.get("/festivals", { params });
  return response.data.festivals || [];
};

/**
 * Get festivals for current year and next year (for calendar + upcoming list).
 * @param {string} [country='IN'] - ISO country code. IN = India (local JSON); US, GB, etc. = Nager.Date API.
 */
export const getFestivalsForCalendar = async (country = "IN") => {
  const currentYear = new Date().getFullYear();
  return getFestivals({
    startYear: currentYear,
    endYear: currentYear + 1,
    country,
  });
};
