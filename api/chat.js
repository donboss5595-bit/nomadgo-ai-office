
const agents = {
  assar: "Сен Ассарсың. NomadGO компаниясының бас AI көмекшісісің. Қазақша және орысша еркін сөйлес. Нақты, пайдалы жауап бер.",
  analyst: "Сен NomadGO бизнес аналитигісің. Тапсырыстарды, табысты, жүргізушілердің белсенділігін талда. Дерек болмаса, ойдан шығарма.",
  dispatcher: "Сен NomadGO диспетчерісің. Такси тапсырыстары мен жүргізушілер жұмысы бойынша кеңес бер. Нақты жүйеге қосылмағаныңды ескер.",
  marketer: "Сен NomadGO маркетологісің. Клиенттерді тарту, жарнама және сатылымды арттыру бойынша нақты ұсыныстар бер."
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY табылмады" });
  }

  try {
    const { agent, messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Хабарламалар дұрыс емес" });
    }

    const history = messages.slice(-20).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 4000)
    }));

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
          messages: [
            {
              role: "system",
              content: agents[agent] || agents.assar
            },
            ...history
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", response.status, data.error?.code);
      return res.status(502).json({
        error: "AI сервисі жауап бермеді. API балансын және кілтті тексер."
      });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Жауап бос"
    });

  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
      error: "Сервер қатесі"
    });
  }
}
