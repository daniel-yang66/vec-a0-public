"use client";

import { useEffect, useState } from "react";

export default function Notams({ notams }) {
  const [search, setSearch] = useState();
  const [activeNotams, setActiveNotams] = useState();

  useEffect(() => {
    if (!notams) return;

    let readNotams = [];
    const active = notams.filter((item, i) => {
      const first_term = item.body.split(" ")[0];

      const body =
        item.location.slice(1) === first_term
          ? item.body.split(" ").slice(1).join(" ")
          : item.body;
      const criteria = search
        ? !readNotams.includes(
            `${body}-${item.effective}-${item.expiration}`,
          ) && item.body.toUpperCase().includes(search)
        : !readNotams.includes(`${body}-${item.effective}-${item.expiration}`);

      readNotams.push(`${body}-${item.effective}-${item.expiration}`);
      return criteria;
    });
    setActiveNotams(active);
  }, [search, notams]);

  if (!notams)
    return (
      <div className="w-full h-full overflow-auto grid items-center justify-items-center text-2xl font-bold">
        No NOTAMS Available
      </div>
    );
  else {
    return (
      <div className="w-full h-full overflow-auto ">
        <input
          onChange={(e) => setSearch(e.target.value.toUpperCase().trim())}
          className="w-4/5 p-2  rounded-lg bg-blue-400 font-semibold text-slate-900 mb-4"
          placeholder="Search TWY/RWY/ILS..."
        />
        <div className="w-full h-[80%] overflow-auto flex flex-col gap-2">
          {activeNotams && activeNotams.length > 0 ? (
            activeNotams.map((item, i) => {
              return (
                <div
                  className="flex-none relative h-28 w-[95%] bg-blue-900 text-slate-300 rounded-lg flex flex-col items-center gap-2 text-md font-semibold p-2 overflow-auto"
                  key={i}
                >
                  <div className="flex justify-between w-full text-green-400">
                    <h3>
                      {item.notam_id ? item.notam_id : "--"}{" "}
                      {item.type ? `(${item.type})` : "--"}
                    </h3>
                    <h3>
                      {item.effective ? item.effective : "--"} to{" "}
                      {item.expiration ? item.expiration : "--"}
                    </h3>
                  </div>
                  <p>{item.body}</p>
                </div>
              );
            })
          ) : (
            <></>
          )}
        </div>
      </div>
    );
  }
}
