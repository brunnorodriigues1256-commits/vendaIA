exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Método não permitido." })
      };
    }

    const { product, audience, objective } = JSON.parse(event.body || "{}");

    if (!product || !audience || !objective) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Preencha todos os campos." })
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "A chave da IA ainda não está configurada no Netlify."
        })
      };
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: `Crie um anúncio para vender este produto:

Produto: ${product}
Público: ${audience}
Objetivo: ${objective}

Crie:
- Título chamativo
- Texto principal persuasivo
- Benefícios
- Chamada para ação (CTA)

Escreva em português do Brasil, pronto para publicar no Instagram.`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: data.error?.message || "Erro ao consultar a IA."
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: data.output_text || "Não foi possível gerar o anúncio."
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Erro interno."
      })
    };
  }
};
