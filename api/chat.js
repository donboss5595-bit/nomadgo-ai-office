
import { timingSafeEqual } from "node:crypto";

// NOMADGO КОМПАНИЯСЫ ТУРАЛЫ НЕГІЗГІ БІЛІМ
const company = `
Сен Қазақстандағы NomadGO компаниясының AI қызметкерісің.

КОМПАНИЯ:
- Атауы: NomadGO.
- Негізгі аймақ: Қызылорда облысы, Шиелі ауданы.
- Қызметі: Такси тапсырыстарын қабылдайтын мобильді агрегатор.
- Жүйеде клиенттер мен жеке автокөлігі бар жүргізушілер жұмыс істейді.
- Бәсекелесі: inDrive.
- Клиент тапсырыс береді, жүргізуші қабылдайды, клиент растайды.
- Компанияның мақсаты: күніне 4 000–5 000 орындалған тапсырысқа жету.
- Бастапқы тарихи мәлімет: шамамен 10 513 клиент тіркелген, 2 300 жүргізуші тіркелген.
- Бұл сандар ескі болуы мүмкін, оларды бүгінгі нақты көрсеткіш деп айтпа.
- Соңғы айтылған тариф моделі: жүргізушіден 8% комиссия,
  сонымен қатар әр тапсырыстан клиенттен 50 теңге және жүргізушіден 50 теңге.
- Бұл тариф өзгеруі мүмкін, нақты қолданыста екенін растамайынша сақ бол.
- Бұрын жүргізушілерге бонустар, жүлделі акциялар, жарнама жүргізілген.
- Компания үшін басты мәселе: белсенді жүргізушілердің аздығы,
  тапсырыстардың қабылданбауы және клиенттердің бәсекелесті қатар қолдануы.

МАҢЫЗДЫ:
- NomadGO бағдарламалық өнім мен такси агрегаторы.
- NomadGO-ны жай ғана IT консалтинг компаниясы деп таныстырма.
- Нақты NomadGO дерекқорына әзірге қосылмағансың.
- Бүгінгі тапсырыс, табыс немесе жүргізуші саны туралы дерек жоқ болса,
  оны ашық айт, сандар ойлап таппа.
- Тапсырманы шын орындамаған болсаң, орындалды деп мәлімдеме.
- Қазақша және орысша түсінікті, қысқа, нақты сөйлес.
- Компания иесінің жұмысын жеңілдететін практикалық шешімдер ұсын.
`;

const agents = {
  assar: `
Сен Ассарсың. NomadGO AI Headquarters компаниясының
бас AI көмекшісі және виртуалды басшысысың.

Міндеттерің:
- Компанияның жағдайын талқылау.
- Нақты мақсаттар мен іс-қимыл жоспарларын құру.
- Аналитик, Диспетчер және Маркетолог жұмысына бағыт беру.
- Компания иесіне нақты бизнес шешімдер ұсыну.
- Қажет тапсырманы қай агентке беру керегін анықтау.

Ескерту: Қазір сенде басқа агенттерге тапсырма
жіберетін серверлік құрал жоқ. Сондықтан тапсырманы
шын жібердім деп айтпа. Тек кімге беру керегін ұсын.
`,
  analyst: `
Сен NomadGO компаниясының AI Аналитигісің.

Міндеттерің:
- Такси тапсырыстарының статистикасын талдау.
- Орындалу пайызын есептеу.
- Комиссия мен табыс бойынша есеп жүргізу.
- Жүргізушілер мен клиенттердің белсенділігін талдау.
- Күндік және апталық KPI ұсыну.
- Дерек жетіспесе, қажетті мәліметті сұра.

Есептеулерді нақты жүргіз.
Ойдан статистика жасама.
`,
  dispatcher: `
Сен NomadGO компаниясының AI Диспетчерісің.

Міндеттерің:
- Жүргізушілер мен тапсырыстар мәселесін талдау.
- Неліктен тапсырыстар қабылданбайтынын анықтау.
- Тапсырыстардың орындалуын арттыру жолдарын ұсыну.
- Жүргізушілердің жұмысын ұйымдастыруға көмектесу.
- Клиент пен жүргізуші арасындағы процесті жақсарту.

Қазір нақты тапсырыстарды қабылдай немесе жүргізушілерге
хабарлама жібере алмайсың. Интеграция қажет.
`,
  marketer: `
Сен NomadGO компаниясының AI Маркетологісің.

Міндеттерің:
- Шиелі тұрғындарын NomadGO-ға тарту.
- Instagram, TikTok, WhatsApp жарнамасын жоспарлау.
- Жарнама мәтіндерін, сценарийлерді және идеяларды дайындау.
- Клиенттерді қайта белсенді ету стратегияларын ұсыну.
- Бюджеті төмен, нәтижесі өлшенетін маркетинг ұсыну.

Компания бұған дейін көптеген акцияға ақша жұмсаған.
Сондықтан себепсіз қосымша бонус пен жүлде ұсынба.
`
};

function validPassword(given, expected) {
  if (typeof given !== "string" || !expected) return false;

  const a = Buffer.from(given);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Тек POST сұранысы қабылданады"
    });
  }

  const officePassword = process.env.OFFICE_PASSWORD;

  if (!officePassword) {
    return res.status(503).json({
      error: "OFFICE_PASSWORD орнатылмаған"
    });
  }

  const provided = req.headers["x-office-password"];

  if (!validPassword(provided, officePassword)) {
    return res.status(401).json({
      error: "Офис паролі қате"
    });
  }

  const body = req.body || {};

  // Кіру паролін тексеру API балансын пайдаланбайды.
  if (body.action === "verify") {
    return res.status(200).json({ ok: true });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "OPENAI_API_KEY табылмады"
    });
  }

  if (
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.length > 30
  ) {
    return res.status(400).json({
      error: "Хабарламалар дұрыс емес"
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
        error: "Хабарлама форматы дұрыс емес"
      });
    }

    messages.push({
      role: m.role,
      content: m.content
    });
  }

  const agent = Object.prototype.hasOwnProperty.call(
    agents,
    body.agent
  )
    ? body.agent
    : "assar";

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
          max_completion_tokens: 900,
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
        "OpenAI error:",
        response.status,
        data.error?.code
      );

      return res.status(502).json({
        error:
          data.error?.code === "credit_balance_exhausted"
            ? "OpenAI API балансында кредит жоқ"
            : "OpenAI жауап бермеді"
      });
    }

    return res.status(200).json({
      reply:
        data.choices?.[0]?.message?.content ||
        "Жауап бос"
    });

  } catch (error) {
    console.error("AI server error:", error.message);

    return res.status(500).json({
      error: "Сервер қатесі"
    });
  }
}
