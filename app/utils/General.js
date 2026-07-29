export function GetTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 18) return "Afternoon";
  if (hour >= 18) return "Evening";
}

export function AircraftType(txt) {
  if (
    txt.startsWith("A32") ||
    txt.startsWith("A2") ||
    txt.startsWith("A319") ||
    txt.startsWith("A318") ||
    txt.startsWith("B73") ||
    txt.startsWith("B75") ||
    txt.startsWith("B3")
  ) {
    return "narrowbody";
  } else if (txt.startsWith("B74") || txt.startsWith("A38")) {
    return "jumbo_jet";
  } else if (
    txt.startsWith("A30") ||
    (txt.startsWith("A") && txt >= "A33") ||
    (txt.startsWith("B") && txt >= "B76")
  ) {
    return "widebody";
  } else {
    return "regional_jet";
  }
}
