"use client";
import { useEffect, useState } from "react";
import { FaRobot } from "react-icons/fa6";
import { IoIosSend } from "react-icons/io";
import { IoPerson } from "react-icons/io5";
import LLMCall from "../api/OpenRouter";
import { Notify } from "../utils/Toast";

export default function VecAgent({ context, refresh }) {
  const [input, setInput] = useState("");
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello, I am Vector. You may ask me questions about the flight.",
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
        { role: "user", content: request, instr: instr },
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
        {
          role: "assistant",
          content: "Agent Failure",
          instr: instr,
        },
      ]);
    } finally {
      setLoading(false);
      // setText("");
      setInitialLoad(false);
    }
  }

  useEffect(() => {
    if (!context) return;
    if (refresh === "0") {
      setMessages([
        {
          role: "assistant",
          content:
            "Hello, I am Vector. You may ask me questions about the flight.",
          instr: false,
        },
      ]);
      CallAgent(
        `Instructions: You are Vector, the flight information consultant and aviation knowledge expert of VecA0. Use your own knowledge base and data provided to you to respond. Do not make up any data. Important: Be very concise and present your information in a structured manner. Ensure your language can be understood by the general population. Do not provide additional info unless explicitly asked. Double check your responses. Separate sentences with vertical separator and single spaces on both sides. Ensure proper punctuation is used for readability. When user asks for expected conditions or anything forward-looking, check if any forecasts apply instead of replying with the current or latest conditions, especially for weather. Very Important: DO NOT get departure and arrival information mixed up.

        Flight Units: {
        speed: km/h,
        alt: meters,
        v_speed: km/h
        }

        Ensure any numbers reported are in aviation units unless imperial or metric is requested (Flight units above are not in aviation units)

        The departure and arrival times are the pushback and gate-in times respectively, not takeoff and landing times.

        Data: ${JSON.stringify(context)}
         `,
        true,
      );
    } else {
      CallAgent(
        `This is newly updated data and use it for upcoming responses: ${JSON.stringify(context)}
         `,
        true,
      );
    }
  }, [context, refresh]);

  if (context) {
    return (
      <div className="flex items-baseline gap-2 fixed bottom-12 left-4 z-[200]">
        <div
          className="w-16 h-16 grid items-center justify-items-center rounded-full bg-blue-500 mt-auto"
          onClick={() => setOpen(!open)}
        >
          <FaRobot
            className={`${"text-blue-950 text-[30px] md:text-[35px]"}`}
          />
        </div>
        <div
          className={`${open ? "" : "hidden"} relative w-[70vw] h-[40vh] md:w-[50vw] md:h-[50vh] rounded-lg bg-blue-500 flex flex-col gap-2 p-2`}
        >
          <div className="flex flex-col gap-2 overflow-auto">
            {(loading
              ? [
                  ...messages,
                  {
                    role: "user",
                    content: text,
                    instr: initialLoad ? true : false,
                  },
                  {
                    role: "assistant",
                    content: initialLoad
                      ? refresh === "1"
                        ? "Getting latest updates..."
                        : "Reading flight data..."
                      : "...",
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
                    <div className="w-8 h-8 shrink-0 grid items-center justify-items-center rounded-full bg-blue-950">
                      <FaRobot
                        className={`${"text-blue-400 text-[14px] md:text-[16px]"}`}
                      />
                    </div>
                    <div
                      className={`${msg.loading ? "animate-pulse" : ""} grid items-center ,max-w-[80%] h-full p-2 rounded-lg bg-blue-800 text-sm text-slate-300 font-semibold`}
                    >
                      {msg.content.split(" | ").map((str, i) => {
                        return <p key={i}>{str}</p>;
                      })}
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex gap-2 justify-end items-center ml-auto"
                    key={`${i}-${msg.content}`}
                  >
                    <div className="grid items-center max-w-[80%] h-full p-2 rounded-lg bg-blue-400 text-sm text-slate-800 font-semibold">
                      {msg.content}
                    </div>
                    <div className="w-8 h-8 shrink-0 grid items-center justify-items-center rounded-full bg-blue-950">
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
              if (loading) return;
              CallAgent(input);
              setInput("");
            }}
          >
            <input
              className="w-[80%] h-full p-2 rounded-lg bg-blue-800 text-slate-300 font-semibold"
              placeholder="Message"
              onChange={(e) => {
                setInput(e.target.value);
                setText(e.target.value);
              }}
              value={input}
            />
            <div
              className="h-full w-[15%] rounded-lg grid items-center justify-items-center bg-blue-800"
              onClick={() => {
                if (loading) return;
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
  } else {
    return <></>;
  }
}
