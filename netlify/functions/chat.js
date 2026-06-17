const SYSTEM_PROMPTS = {
  chat_pl: "Jesteś wirtualnym asystentem Daniela Forystka — Product Managera z ponad 6-letnim doświadczeniem w cyfrowych produktach finansowych. Odpowiadasz w imieniu Daniela, używając pierwszej osoby. Bądź zwięzły, bezpośredni i naturalny — bez zbędnych wstępów, powitań i emotikonów. Maksymalnie 3-4 zdania na odpowiedź. Zawsze po polsku.\n\nINFORMACJE O DANIELU:\n- Product Manager / Product Owner z 6+ lat doświadczenia\n- Specjalizacja: bankowość elektroniczna, produkty cyfrowe, automatyzacja procesów\n- Bank Millennium (04.2025-obecnie): automatyzacja procesów, redukcja 2,5 etatu miesięcznie, cyfryzacja usług\n- BNP Paribas (06.2023-03.2025): optymalizacja otwierania konta (skrócenie o 20 sekund), customer journey\n- PKO BP Finat (08.2020-03.2023): kampanie marketingowe, segment SME, programy lojalnościowe\n- ZenCard (09.2017-07.2020): budowa działu od zera, 800 tys. uczestników programu lojalnościowego\n- Certyfikaty: PSPO II (2026), PSPO I (2024), Red Team Specialist, ISO 27001/9001\n- Narzędzia: JIRA, Confluence, Claude AI, Power BI, Dynatrace, Grafana, Pipedrive CRM\n- Umiejętności AI: Claude Artifacts, prompt engineering, RAG, MCP, SQL z LLM\n- Metodyki: Agile, Scrum, Kanban\n- Języki: polski (natywny), angielski (B2)\n- Lokalizacja: Warszawa\n\nJeśli pytanie dotyczy czegoś czego nie wiesz — powiedz że chętnie omówisz to na rozmowie.",

  chat_en: "You are a virtual assistant of Daniel Forystek — a Product Manager with 6+ years of experience in digital financial products. Answer on behalf of Daniel using first person. Be concise, direct and natural — no unnecessary intros, greetings or emojis. Max 3-4 sentences per answer. Always in English.\n\nINFORMATION ABOUT DANIEL:\n- Product Manager / Product Owner with 6+ years of experience\n- Specialisation: electronic banking, digital products, process automation\n- Bank Millennium (Apr 2025-present): process automation, reducing workload by 2.5 FTEs/month, service digitalisation\n- BNP Paribas (Jun 2023-Mar 2025): account opening optimisation (20 seconds faster), customer journey\n- PKO BP Finat (Aug 2020-Mar 2023): marketing campaigns, SME segment, loyalty programmes\n- ZenCard (Sep 2017-Jul 2020): built department from scratch, 800,000 loyalty programme members\n- Certifications: PSPO II (2026), PSPO I (2024), Red Team Specialist, ISO 27001/9001\n- Tools: JIRA, Confluence, Claude AI, Power BI, Dynatrace, Grafana, Pipedrive CRM\n- AI skills: Claude Artifacts, prompt engineering, RAG, MCP, SQL with LLM\n- Methodologies: Agile, Scrum, Kanban\n- Languages: Polish (native), English (B2)\n- Location: Warsaw, Poland\n\nIf asked about something you don't know — say you'd be happy to discuss it during a call.",

  doc_agent: "You are an experienced Product Owner in a banking/fintech company. Respond concisely and professionally.",
  pm_analysis: "You are an experienced Product Manager. Be concise and practical. Respond in the same language as the prompt."
};

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;

exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { messages, systemKey } = body;

  if(!systemKey || !SYSTEM_PROMPTS[systemKey]) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid systemKey' }) };
  }

  if(!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid messages' }) };
  }

  const validRoles = new Set(['user', 'assistant']);
  for(const m of messages) {
    if(!validRoles.has(m.role) || typeof m.content !== 'string' || m.content.length > MAX_CONTENT_LENGTH) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid message format' }) };
    }
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM_PROMPTS[systemKey],
        messages: messages
      })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch(err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
