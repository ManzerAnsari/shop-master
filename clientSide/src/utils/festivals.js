/**
 * Festival data is loaded from the server (GET /api/festivals) so dates can be
 * updated when they change each year. Update serverSide/src/data/festivals.json
 * for lunar/variable festivals (Diwali, Eid, Holi, etc.).
 *
 * Fallback used only when the API is unavailable (e.g. offline).
 */
export const FALLBACK_FESTIVALS = [
  { date: "2025-01-14", name: "Makar Sankranti", type: "major" },
  { date: "2025-01-26", name: "Republic Day", type: "national" },
  { date: "2025-02-26", name: "Maha Shivaratri", type: "major" },
  { date: "2025-03-14", name: "Holi", type: "major" },
  { date: "2025-03-31", name: "Eid al-Fitr", type: "major" },
  { date: "2025-04-14", name: "Baisakhi", type: "major" },
  { date: "2025-08-15", name: "Independence Day", type: "national" },
  { date: "2025-08-27", name: "Ganesh Chaturthi", type: "major" },
  { date: "2025-10-02", name: "Gandhi Jayanti", type: "national" },
  { date: "2025-10-20", name: "Diwali", type: "major" },
  { date: "2025-12-25", name: "Christmas", type: "major" },
];

/**
 * Find a festival on a given date from a list (from API or fallback).
 * @param {string} dateString - YYYY-MM-DD
 * @param {Array<{ date: string, name: string, type?: string }>} [festivals] - From API or FALLBACK_FESTIVALS
 */
export const getFestivalForDate = (dateString, festivals = FALLBACK_FESTIVALS) => {
  const date = new Date(dateString);
  const month = date.getMonth();
  const day = date.getDate();

  return festivals.find((f) => {
    const fDate = new Date(f.date);
    return fDate.getMonth() === month && fDate.getDate() === day;
  });
};

/**
 * Get festivals that occur in the next N days from a list (from API or fallback).
 * @param {Array<{ date: string, name: string, type?: string }>} [festivals] - From API or FALLBACK_FESTIVALS
 * @param {number} withinDays - Default 60
 * @returns {Array<{ name: string, date: string, type: string, daysUntil: number }>}
 */
export const getUpcomingFestivals = (festivals = FALLBACK_FESTIVALS, withinDays = 60) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + withinDays);

  const result = festivals
    .filter((f) => {
      const d = new Date(f.date);
      d.setHours(0, 0, 0, 0);
      return d >= today && d <= end;
    })
    .map((f) => {
      const d = new Date(f.date);
      d.setHours(0, 0, 0, 0);
      return {
        ...f,
        date: f.date,
        daysUntil: Math.ceil((d - today) / (1000 * 60 * 60 * 24)),
      };
    });

  return result.sort((a, b) => new Date(a.date) - new Date(b.date));
};
