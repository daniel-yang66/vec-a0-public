export function AvgCalc(data) {
  try {
    let total = 0;
    let count = 0;

    data.forEach((item, i) => {
      total += item;
      count += 1;
    });

    return isNaN(Math.round(total / count)) ? "--" : Math.round(total / count);
  } catch {
    return "--";
  }
}

export function Windcomponent(wd, bearing) {
  const hwind = wd ? Math.sin(((wd - bearing) * Math.PI) / 180) : 0;
  const vwind = wd ? Math.cos(((wd - bearing) * Math.PI) / 180) : 0;

  return {
    h: hwind,
    v: vwind,
  };
}
