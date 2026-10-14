export function getChallengeDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
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
