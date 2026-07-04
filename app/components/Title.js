"use client";
import { useRouter } from "next/navigation";
import { PiAirplaneInFlightFill } from "react-icons/pi";
import { TbRouteAltRight } from "react-icons/tb";

export default function Title({ loading }) {
  const router = useRouter();
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        if (!loading) {
          router.replace("/");
        }
      }}
      className={`grid ${
        loading
          ? "fixed top-[50vh] left-[50vw] -translate-x-1/2 -translate-y-1/2"
          : "justify-self-start"
      }  -mt-[1vh] md:mt-0 font-sans font-bold ${loading ? "animate-pulse z-40" : ""}`}
    >
      <div className="inline-flex items-top">
        <div className="inline-flex items-baseline text-blue-400 font-bold">
          <PiAirplaneInFlightFill
            className={`${
              !loading
                ? "text-[38px] md:text-[45px]"
                : "text-[52px] md:text-[59px]"
            }`}
          />
          <TbRouteAltRight
            className={`text-blue-500${
              !loading
                ? "text-[18px] md:text-[25px]"
                : "text-[32px] md:text-[39px]"
            }`}
          />
        </div>
        <div
          className={`inline-flex items-center ${
            !loading
              ? "text-[13px] md:text-[20px]"
              : "text-[27px] md:text-[34px]"
          } text-zinc-300 italic`}
        >
          <h1>Vec</h1>
          <h1>A0</h1>
        </div>
      </div>
    </div>
  );
}
