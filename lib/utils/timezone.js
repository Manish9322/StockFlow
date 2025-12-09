// Comprehensive timezone list with UTC offsets
export const TIMEZONES = [
  // Americas
  { value: "America/New_York", label: "Eastern Time (ET)", offset: "UTC-5/-4" },
  { value: "America/Chicago", label: "Central Time (CT)", offset: "UTC-6/-5" },
  { value: "America/Denver", label: "Mountain Time (MT)", offset: "UTC-7/-6" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", offset: "UTC-8/-7" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)", offset: "UTC-9/-8" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)", offset: "UTC-10" },
  { value: "America/Toronto", label: "Toronto", offset: "UTC-5/-4" },
  { value: "America/Vancouver", label: "Vancouver", offset: "UTC-8/-7" },
  { value: "America/Mexico_City", label: "Mexico City", offset: "UTC-6/-5" },
  { value: "America/Sao_Paulo", label: "São Paulo", offset: "UTC-3/-2" },
  { value: "America/Buenos_Aires", label: "Buenos Aires", offset: "UTC-3" },
  
  // Europe
  { value: "Europe/London", label: "London (GMT/BST)", offset: "UTC+0/+1" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Rome", label: "Rome (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Madrid", label: "Madrid (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Brussels", label: "Brussels (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Zurich", label: "Zurich (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Stockholm", label: "Stockholm (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Moscow", label: "Moscow (MSK)", offset: "UTC+3" },
  { value: "Europe/Istanbul", label: "Istanbul (TRT)", offset: "UTC+3" },
  
  // Asia
  { value: "Asia/Dubai", label: "Dubai (GST)", offset: "UTC+4" },
  { value: "Asia/Karachi", label: "Karachi (PKT)", offset: "UTC+5" },
  { value: "Asia/Kolkata", label: "India (IST)", offset: "UTC+5:30" },
  { value: "Asia/Dhaka", label: "Dhaka (BST)", offset: "UTC+6" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT)", offset: "UTC+7" },
  { value: "Asia/Singapore", label: "Singapore (SGT)", offset: "UTC+8" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)", offset: "UTC+8" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)", offset: "UTC+8" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)", offset: "UTC+9" },
  { value: "Asia/Seoul", label: "Seoul (KST)", offset: "UTC+9" },
  
  // Australia & Pacific
  { value: "Australia/Sydney", label: "Sydney (AEDT/AEST)", offset: "UTC+10/+11" },
  { value: "Australia/Melbourne", label: "Melbourne (AEDT/AEST)", offset: "UTC+10/+11" },
  { value: "Australia/Brisbane", label: "Brisbane (AEST)", offset: "UTC+10" },
  { value: "Australia/Perth", label: "Perth (AWST)", offset: "UTC+8" },
  { value: "Pacific/Auckland", label: "Auckland (NZDT/NZST)", offset: "UTC+12/+13" },
  
  // Africa
  { value: "Africa/Cairo", label: "Cairo (EET)", offset: "UTC+2" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)", offset: "UTC+2" },
  { value: "Africa/Lagos", label: "Lagos (WAT)", offset: "UTC+1" },
  { value: "Africa/Nairobi", label: "Nairobi (EAT)", offset: "UTC+3" },
  
  // UTC
  { value: "UTC", label: "UTC (Coordinated Universal Time)", offset: "UTC+0" },
];

// Get user's current timezone
export function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Format date with timezone
export function formatDateWithTimezone(date, timezone = "UTC", format = "full") {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  const options = {
    timeZone: timezone,
  };

  if (format === "full") {
    options.dateStyle = "medium";
    options.timeStyle = "short";
  } else if (format === "date") {
    options.dateStyle = "medium";
  } else if (format === "time") {
    options.timeStyle = "short";
  }

  try {
    return new Intl.DateTimeFormat("en-US", options).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateObj.toLocaleString();
  }
}

// Get timezone offset
export function getTimezoneOffset(timezone) {
  const tz = TIMEZONES.find((t) => t.value === timezone);
  return tz ? tz.offset : "UTC+0";
}

// Get current time in specific timezone
export function getCurrentTimeInTimezone(timezone) {
  const now = new Date();
  return formatDateWithTimezone(now, timezone, "time");
}
