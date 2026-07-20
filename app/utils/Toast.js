"use client";
import { toast } from "react-toastify";
import { MdErrorOutline } from "react-icons/md";
import { LuCheck } from "react-icons/lu";

function Message(text, type) {
  return (
    <div
      className={` ${
        type === "err" ? "bg-orange-500" : "bg-emerald-500"
      } rounded-lg overflow-auto flex gap-2 items-center justify-center text-md font-bold text-slate-200 p-2 w-full`}
    >
      {type === "err" ? <MdErrorOutline /> : <LuCheck />}
      <p>{text}</p>
    </div>
  );
}
export function Notify(text, type) {
  toast(Message(text, type), {
    closeButton: false,
    autoClose: 3000,
  });
}
