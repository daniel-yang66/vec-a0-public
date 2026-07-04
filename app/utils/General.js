export function GetTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 18) return "Afternoon";
  if (hour >= 18) return "Evening";
}
