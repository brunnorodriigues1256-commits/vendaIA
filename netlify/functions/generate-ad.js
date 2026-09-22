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

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "GEMINI_API_KEY não configurada no Netlify."
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
2. Texto principal
3. 3 benefícios
4. CTA

Deixe o texto pronto para publicar no Instagram.
Não invente características específicas do produto que não foram informadas.
`;

    const models = [
      "gemini-3.8-flash",
      "gemini-3.6-flash"
    ];

    let lastError = "Erro ao consultar o Gemini.";

    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/" +
            model +
            ":generateContent?key=" +
            encodeURIComponent(apiKey),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt
                    }
                  ]
                }
              ]
            })
          }
        );

        const data = await response.json();

        if (response.ok) {
          const text =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "O Gemini não retornou texto.";

          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              text
            })
          };
        }

        lastError =
          data.error?.message ||
          "Erro ao consultar o Gemini.";

        if (response.status !== 429 && response.status !== 503) {
          break;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 1500)
        );
      }
    }

    return {
      statusCode: 503,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error:
          "O Gemini está temporariamente ocupado. Tente novamente em alguns segundos."
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
