const CHALLENGE_TIME_ZONE = "America/Chicago";

export function formatCurrentChallengeDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHALLENGE_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
}

export function getChallengeDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHALLENGE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)!.value;
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    isWeekday: !["Sat", "Sun"].includes(part("weekday")),
  };
}
