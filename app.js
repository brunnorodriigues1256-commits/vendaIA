const sections = document.querySelectorAll(".s");

document.querySelectorAll("[data-s]").forEach((button) => {
  button.onclick = () => {
    sections.forEach((section) => {
      section.classList.toggle("on", section.id === button.dataset.s);
    });
    window.scrollTo(0, 0);
  };
});

const remainingEl = document.getElementById("remaining");
const generateBtn = document.getElementById("generate");
const productEl = document.getElementById("product");
const audienceEl = document.getElementById("audience");
const objectiveEl = document.getElementById("objective");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

let n = Number(localStorage.getItem("vendaia_n") ?? 5);

remainingEl.textContent = n;

generateBtn.onclick = async () => {
  const product = productEl.value.trim();
  const audience = audienceEl.value.trim();
  const objective = objectiveEl.value;

  if (!product || !audience) {
    statusEl.textContent = "Preencha os dois campos.";
    return;
  }

  if (n <= 0) {
    statusEl.textContent = "Limite grátis atingido.";
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = "⏳ GERANDO...";
  statusEl.textContent = "A IA está criando seu anúncio...";
  resultEl.classList.remove("show");

  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000);

    const response = await fetch(
      "/.netlify/functions/generate-ad",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          product,
          audience,
          objective
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao gerar anúncio.");
    }

    resultEl.textContent = data.text || "A IA não retornou texto.";
    resultEl.classList.add("show");

    n--;
    localStorage.setItem("vendaia_n", n);
    remainingEl.textContent = n;

    statusEl.textContent = "Anúncio gerado com sucesso. ✅";

  } catch (error) {
    if (error.name === "AbortError") {
      statusEl.textContent =
        "A IA demorou muito para responder. Tente novamente.";
    } else {
      statusEl.textContent = "Erro: " + error.message;
    }
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "🚀 GERAR ANÚNCIO";
  }
};
