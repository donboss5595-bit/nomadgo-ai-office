
import { timingSafeEqual } from "node:crypto";

const company = `
Сен Шиелі ауданында жұмыс істейтін NomadGO такси
агрегаторының AI командасының мүшесісің.

NomadGO туралы:
- Аймақ: Қазақстан, Қызылорда облысы, Шиелі.
- Өнім: клиент пен жүргізушіні байланыстыратын такси қолданбасы.
- Бәсекелес: inDrive.
- Мақсат: күніне 4000-5000 орындалған тапсырысқа жету.
- Тарихи тіркелгендер: 10513 клиент, 2300 жүргізуші.
- Тарифтің соңғы белгілі моделі: жүргізуші комиссиясы 8%,
  клиенттен 50 теңге және жүргізушіден 50 теңге.
- Бұл мәліметтер ескірген болуы мүмкін.
- Негізгі мәселелер: жүргізушінің тапсырысты қабылдамауы,
  белсенді клиенттердің азаюы, бәсекелестік.
- Бұрын акциялар, сыйлықтар, бонустар жасалған.
- Жаңа үлкен сыйлық бюджеті ұсынылмасын.

Жауапты қазақша, түсінікті және нақты бер.
Мүмкін болса іс-қимыл жоспары мен өлшенетін KPI бер.
Шынайы жүйеге қосылмағаныңды ұмытпа.
Бүгінгі статистиканы ойдан шығарма.
Тапсырманы нақты өмірде орындадым деп айтпа.
`;

const agents = {
  assar: `
Сен Ассарсың, NomadGO-ның бас AI үйлестірушісісің.
Бизнес стратегиясын құрып, агенттердің нәтижелерін
салыстырып, директорға қорытынды ұсыныс бер.
`,
  analyst: `
Сен бизнес аналитигісің.
Тапсырыстар, қабылдау коэффициенті, аяқталған
сапарлар, комиссия, табыс және жүргізушілердің
белсенділігі бойынша талдау жаса.
Берілген деректерді пайдалан, жоқ сандарды ойдан шығарма.
`,
  dispatcher: `
Сен такси диспетчерісің.
Жүргізуші тапшылығы, тапсырысты қабылдау,
күту уақыты, операциялық процестер бойынша
практикалық шешімдер дайында.
`,
  marketer: `
Сен маркетологсың.
Instagram, TikTok, WhatsApp, клиенттерді қайта
тарту және арзан жарнама стратегияларын дайында.
Мүмкіндігінше дайын мәтін мен нақты жоспар бер.
`
};

function checkPassword(value, secret) {
  if (typeof value !== "string" || !secret) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function askAI(agent, messages, limit = 1200) {
  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_completion_tokens: limit,
        messages: [
          {
            role: "system",
            content: company + "\n" + agents[agent]
          },
          ...messages
        ]
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "OpenAI error",
      response.status,
      data.error?.code
    );

    if (data.error?.code === "credit_balance_exhausted") {
      throw new Error("API балансында ақша жоқ");
    }

    throw new Error("OpenAI қатесі: " + response.status);
  }

  return data.choices?.[0]?.message?.content
    || "Жауап алынбады";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({error:"Method not allowed"});
  }

  if (!process.env.OFFICE_PASSWORD) {
    return res.status(503).json({
      error:"OFFICE_PASSWORD орнатылмаған"
    });
  }

  if (!checkPassword(
    req.headers["x-office-password"],
    process.env.OFFICE_PASSWORD
  )) {
    return res.status(401).json({error:"Пароль қате"});
  }

  const body = req.body || {};

  if (body.action === "verify") {
    return res.status(200).json({ok:true});
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error:"OPENAI_API_KEY жоқ"
    });
  }

  const agent = Object.prototype.hasOwnProperty.call(
    agents, body.agent
  ) ? body.agent : "assar";

  try {
    // Жеке тапсырманы AI орындауы
    if (body.action === "execute") {
      if (
        typeof body.task !== "string" ||
        !body.task.trim() ||
        body.task.length > 2500
      ) {
        return res.status(400).json({
          error:"Тапсырма дұрыс емес"
        });
      }

      const result = await askAI(agent, [
        {
          role:"user",
          content:
            "Мына тапсырманы орындап, нақты дайын нәтиже бер:\n\n" +
            body.task +
            "\n\nЕгер сыртқы жүйеге қол жеткізу керек болса, " +
            "не істей алмайтыныңды және не дайындағаныңды ажырат."
        }
      ], 1600);

      return res.status(200).json({
        agent,
        result
      });
    }

    // Әдеттегі чат
    if (
      !Array.isArray(body.messages) ||
      body.messages.length < 1 ||
      body.messages.length > 30
    ) {
      return res.status(400).json({
        error:"Хабарламалар дұрыс емес"
      });
    }

    const messages = [];

    for (const m of body.messages.slice(-20)) {
      if (
        !m ||
        !["user", "assistant"].includes(m.role) ||
        typeof m.content !== "string" ||
        m.content.length > 4000
      ) {
        return res.status(400).json({
          error:"Хабарлама форматы дұрыс емес"
        });
      }

      messages.push({
        role:m.role,
        content:m.content
      });
    }

    const reply = await askAI(agent, messages, 1000);
    return res.status(200).json({reply});

  } catch (error) {
    console.error("AI task error:", error.message);
    return res.status(502).json({
      error:error.message || "AI сервер қатесі"
    });
  }
}
