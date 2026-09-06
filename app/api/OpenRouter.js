"use server";
export default async function LLMCall(msgs) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3.5-lightning",
        messages: msgs,
        reasoning: { enabled: true },
      }),
    },
  );

  const result = await response.json();
  const message = result.choices[0].message.content;
  const reasoning = result.choices[0].message.reasoning_details;

  return { msg: message, rsn: reasoning };
}
