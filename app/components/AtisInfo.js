export default function AtisInfo({ atis }) {
  if (!atis)
    return (
      <div className="w-full h-full overflow-auto grid items-center justify-items-center text-2xl font-bold">
        No ATIS Available
      </div>
    );
  else {
    return (
      <div className="w-full h-full overflow-auto">
        {atis.map((item, i) => {
          return (
            <p
              key={i}
              className={`${i === 0 ? "text-green-400 text-xl mb-2 font-bold" : "text-blue-300 text-lg font-semibold"}`}
            >
              {item}
            </p>
          );
        })}
      </div>
    );
  }
}
