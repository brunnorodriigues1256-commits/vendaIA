exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Método não permitido."
        })
      };
    }

    const body = JSON.parse(event.body || "{}");

    const product = String(body.product || "").trim();
    const audience = String(body.audience || "").trim();
    const objective = String(body.objective || "").trim();

    if (!product || !audience || !objective) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Preencha todos os campos."
        })
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "OPENAI_API_KEY não configurada no Netlify."
        })
      };
    }

    const prompt = `
Você é um especialista em marketing digital.

Crie um anúncio em português do Brasil para:

Produto: ${product}
Público-alvo: ${audience}
Objetivo: ${objective}

Entregue:
1. Título chamativo
2. Texto principal persuasivo
3. 3 benefícios
4. CTA (chamada para ação)

Deixe o texto pronto para publicar no Instagram.
Não invente características específicas do produto que não foram informadas.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        input: prompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: data.error?.message || "Erro ao consultar a OpenAI."
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: data.output_text || "A IA não retornou texto."
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: error.message || "Erro interno da função."
      })
    };
  }
};
