export function ConvertSpeed(unit, spd) {
  if (spd === "--" || !spd) return "--";
  return unit === "av" || unit === "imp"
    ? unit === "imp"
      ? Math.round(spd * 1.15)
      : Math.round(spd)
    : Math.round(spd * 1.852);
}

export function ConvertAlt(unit, val, type = "default") {
  if (val === "--" || !val) return "--";
  return unit === "imp" || unit === "av"
    ? Math.round(type === "default" ? val * 100 : val)
    : Math.round(type === "default" ? val * 30.48 : val * 0.3048);
}

export function ConvertDist(unit, val) {
  if (val === "--" || !val) return "--";
  return unit === "imp" || unit === "av"
    ? unit === "imp"
      ? Math.round(val)
      : Math.round(val * 0.869)
    : Math.round(val * 1.61);
}

export function ConvertVis(vis, vUnit, unit) {
  if (vis === "--" || !vis) return "--";
  if (vis === 9999) {
    vis = 9999;
  } else if ((vUnit === "km") & (unit === "imp" || unit === "av")) {
    vis = Math.round(vis * 0.621);
  } else if ((vUnit === "m") & (unit === "imp" || unit === "av")) {
    vis = Math.round(vis * 0.000621);
  } else if ((vUnit === "m") & (unit === "met")) {
    vis = Math.round(vis * 1000);
  } else if ((vUnit === "sm") & (unit === "met")) {
    vis = Math.round(vis * 1.61);
  }

  return vis;
}

export function ConvertTemp(unit, temp, type = "default") {
  if (temp === "--" || !temp) return "--";
  if (type === "default") {
    return unit === "met" || unit === "av"
      ? temp
      : Math.round(temp * (9 / 5) + 32);
  } else {
    return unit === "met" || unit === "av"
      ? Math.round(temp - 273)
      : Math.round((temp - 273) * (9 / 5) + 32);
  }
}

export function ConvertMb(alt) {
  const altitudeToMb = {
    800: 975,
    1600: 950,
    2500: 925,
    3300: 900,
    5000: 850,
    6500: 800,
    8000: 750,
    10000: 700,
    12000: 650,
    14000: 600,
    16000: 550,
    18000: 500,
    20000: 450,
    22000: 400,
    24000: 350,
    26000: 300,
    30000: 250,
    34000: 200,
    39000: 150,
    46000: 100,
  };
  try {
    const match = Object.keys(altitudeToMb).reduce((closest, current) => {
      const currFt = Number(current);
      const closestFt = Number(closest);

      return Math.abs(currFt - alt) < Math.abs(closestFt - alt)
        ? current
        : closest;
    });
    return { mb: `${altitudeToMb[match]} mb`, ft: match };
  } catch {
    return null;
  }
}
