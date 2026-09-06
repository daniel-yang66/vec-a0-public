"use client";
import { useEffect, useState } from "react";
import { FaRobot } from "react-icons/fa6";
import { IoIosSend } from "react-icons/io";
import { IoPerson } from "react-icons/io5";
import LLMCall from "../api/OpenRouter";
import { Notify } from "../utils/Toast";

export default function VecAgent({ context }) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello, I am VecAgent. Hope it's been a great day so far",
      instr: false,
    },
  ]);

  async function CallAgent(request, instr = false) {
    let agentResponse;
    setLoading(true);
    if (instr) setInitialLoad(true);
    try {
      agentResponse = await LLMCall([
        ...messages,
        { role: "user", content: request },
      ]);
      setMessages([
        ...messages,
        { role: "user", content: request },
        {
          role: "assistant",
          content: agentResponse.msg,
          reasoning_details: agentResponse.rsn,
          instr: instr,
        },
      ]);
    } catch {
      Notify("Agent Failure", "err");
      setMessages([
        ...messages,
        { role: "assistant", content: "Agent Failure", instr: instr },
      ]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }

  useEffect(() => {
    CallAgent(
      `Instructions: You are VecAgent, the flight information consultant of the flight tracker web app called VecA0. Use your vast knowledge base and the data provided to you next to respond to the user. Don't make up any data.

        Data: ${JSON.stringify(context)}
         `,
      true,
    );
  }, []);

  return (
    <div className="flex items-baseline gap-2 fixed bottom-12 left-4 z-[200]">
      <div
        className="w-16 h-16 grid items-center justify-items-center rounded-full bg-blue-500 mt-auto"
        onClick={() => setOpen(!open)}
      >
        <FaRobot className={`${"text-blue-950 text-[30px] md:text-[35px]"}`} />
      </div>
      <div
        className={`${open ? "" : "hidden"} relative w-[60vw] h-[35vh] md:w-[35vw] md:h-[40vh] rounded-lg bg-blue-500 flex flex-col gap-2 p-2`}
      >
        <div className="flex flex-col gap-2 overflow-auto">
          {(loading
            ? [
                ...messages,
                {
                  role: "assistant",
                  content: initialLoad ? "Reading flight data..." : "...",
                  loading: true,
                  instr: false,
                },
              ]
            : messages
          )
            .filter((msg) => msg.instr === false)
            .map((msg, i) => {
              return msg.role === "assistant" ? (
                <div
                  className="flex gap-2 items-center"
                  key={`${i}-${msg.content}`}
                >
                  <div className="w-8 h-8 grid items-center justify-items-center rounded-full bg-blue-950">
                    <FaRobot
                      className={`${"text-blue-400 text-[14px] md:text-[16px]"}`}
                    />
                  </div>
                  <div
                    className={`${msg.loading ? "animate-pulse" : ""} grid items-center w-[80%] h-full p-2 rounded-lg bg-blue-800 text-sm text-slate-300 font-semibold`}
                  >
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div
                  className="flex gap-2 items-center ml-auto"
                  key={`${i}-${msg.content}`}
                >
                  <div className="grid items-center w-[80%] h-full p-2 rounded-lg bg-blue-400 text-sm text-slate-800 font-semibold">
                    {msg.content}
                  </div>
                  <div className="w-8 h-8 grid items-center justify-items-center rounded-full bg-blue-950">
                    <IoPerson
                      className={`${"text-blue-400 text-[14px] md:text-[16px]"}`}
                    />
                  </div>
                </div>
              );
            })}
        </div>

        <form
          className="flex gap-[4px] items-center w-full h-8 mt-auto"
          onSubmit={(e) => {
            e.preventDefault();
            CallAgent(input);
            setInput("");
          }}
        >
          <input
            className="w-[80%] h-full p-2 rounded-lg bg-blue-800 text-slate-300 font-semibold"
            placeholder="Message"
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
          <div
            className="h-full w-[15%] rounded-lg grid items-center justify-items-center bg-blue-800"
            onClick={() => {
              CallAgent(input);
              setInput("");
            }}
          >
            <IoIosSend className="text-lg text-slate-300 bg-blue-800" />
          </div>
        </form>
      </div>
    </div>
  );
}
