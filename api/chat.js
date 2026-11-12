
import { timingSafeEqual } from "node:crypto";

const agents = {
  assar: "Сен NomadGO компаниясының бас AI көмекшісі Ассарсың. Қазақша және орысша сөйлес. Компанияны басқару, жоспарлау және тапсырмаларды үйлестіру бойынша көмектес. Нақты жүйеде орындамаған әрекетті орындалды деп айтпа.",
  analyst: "Сен NomadGO аналитигісің. Тапсырыстар, қаржы, жүргізушілер белсенділігі және статистиканы талда. Нақты деректер берілмесе, сандарды ойдан шығарма.",
  dispatcher: "Сен NomadGO диспетчерісің. Такси тапсырыстарын басқару және жүргізушілер жұмысы туралы кеңес бер. Әзірге нақты такси жүйесіне қосылмағансың.",
  marketer: "Сен NomadGO маркетологісің. Жарнама, клиент тарту, Instagram, TikTok және маркетингтік стратегия бойынша көмектес."
};

function validPassword(given, expected) {
  if (!given || !expected) return false;

  const a = Buffer.from(given);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Тек POST сұранысына рұқсат"
    });
  }

  const officePassword = process.env.OFFICE_PASSWORD;

  if (!officePassword) {
    return res.status(503).json({
      error: "OFFICE_PASSWORD серверде орнатылмаған"
    });
  }

  const provided = req.headers["x-office-password"];

  if (
    typeof provided !== "string" ||
    !validPassword(provided, officePassword)
  ) {
    return res.status(401).json({
      error: "Пароль қате"
    });
  }

  const body = req.body || {};

  // Пароль тексерісі API балансын пайдаланбайды.
  if (body.action === "verify") {
    return res.status(200).json({
      ok: true
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "OPENAI_API_KEY серверде табылмады"
    });
  }

  if (
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.length > 30
  ) {
    return res.status(400).json({
      error: "Хабарламалар форматы дұрыс емес"
    });
  }

  const messages = [];

  for (const item of body.messages.slice(-20)) {
    if (
      !item ||
      !["user", "assistant"].includes(item.role) ||
      typeof item.content !== "string" ||
      item.content.length > 4000
    ) {
      return res.status(400).json({
        error: "Хабарлама дұрыс емес немесе тым ұзын"
      });
    }

    messages.push({
      role: item.role,
      content: item.content
    });
  }

  const agentPrompt =
    Object.prototype.hasOwnProperty.call(agents, body.agent)
      ? agents[body.agent]
      : agents.assar;

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_completion_tokens: 700,
          messages: [
            {
              role: "system",
              content: agentPrompt
            },
            ...messages
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "OpenAI error:",
        response.status,
        data.error?.code
      );

      return res.status(502).json({
        error:
          data.error?.code === "credit_balance_exhausted"
            ? "OpenAI API балансында кредит жоқ"
            : "AI сервисі жауап бермеді"
      });
    }

    return res.status(200).json({
      reply:
        data.choices?.[0]?.message?.content ||
        "Жауап бос"
    });

  } catch (error) {
    console.error("Server error:", error.message);

    return res.status(500).json({
      error: "Сервер қатесі"
    });
  }
}
