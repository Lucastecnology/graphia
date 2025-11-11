// Módulo: modais.js — Gerencia a abertura e fechamento dos popups modais

// Armazena os dados atuais da função para exibir nos modais
let currentResults = {
  roots: { raiz1: null, raiz2: null, delta: null },
  vertex: { xv: null, yv: null },
  concavity: { text: "", reason: "", a: null },
  derivative: { formula: "" },
  tangent: { equation: "", x0: null, m: null, bTangent: null }
};

// Inicializa os event listeners dos botões e modais
export function initModals() {
  // Botões para abrir modais
  document.getElementById("btn-roots").addEventListener("click", () => openModal("roots"));
  document.getElementById("btn-vertex").addEventListener("click", () => openModal("vertex"));
  document.getElementById("btn-concavity").addEventListener("click", () => openModal("concavity"));
  document.getElementById("btn-derivative").addEventListener("click", () => openModal("derivative"));
  document.getElementById("btn-tangent").addEventListener("click", () => openModal("tangent"));

  // Botões de fechar modal
  const closeButtons = document.querySelectorAll(".modal-close");
  closeButtons.forEach(btn => {
    btn.addEventListener("click", closeModal);
  });

  // Fechar ao clicar no overlay
  const overlay = document.getElementById("modal-overlay");
  overlay.addEventListener("click", closeModal);

  // Fechar com a tecla ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });
}

// Abre um modal específico
function openModal(modalType) {
  const overlay = document.getElementById("modal-overlay");
  const modal = document.getElementById(`modal-${modalType}`);
  
  if (!modal) return;

  // Atualiza o conteúdo do modal com os resultados atuais
  updateModalContent(modalType);

  // Mostra o overlay e o modal
  overlay.classList.add("active");
  modal.classList.add("active");

  // Previne scroll do body
  document.body.style.overflow = "hidden";
}

// Fecha o modal atual
function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  const modals = document.querySelectorAll(".modal");

  overlay.classList.remove("active");
  modals.forEach(modal => {
    modal.classList.remove("active");
  });

  // Restaura scroll do body
  document.body.style.overflow = "";
}

// Atualiza o conteúdo do modal com os resultados atuais
function updateModalContent(modalType) {
  switch (modalType) {
    case "roots":
      updateRootsModal();
      break;
    case "vertex":
      updateVertexModal();
      break;
    case "concavity":
      updateConcavityModal();
      break;
    case "derivative":
      updateDerivativeModal();
      break;
    case "tangent":
      updateTangentModal();
      break;
  }
}

// Atualiza o modal de raízes
function updateRootsModal() {
  const resultElement = document.getElementById("modal-roots-result");
  const { raiz1, raiz2, delta } = currentResults.roots;

  if (delta === null) {
    resultElement.innerHTML = "Calcule a função primeiro para ver as raízes.";
    return;
  }

  let resultText = "";
  if (delta > 0 && raiz1 !== null && raiz2 !== null) {
    resultText = `A função tem <strong>duas raízes reais distintas</strong>:<br>`;
    resultText += `x₁ = ${raiz1.toFixed(4)}<br>`;
    resultText += `x₂ = ${raiz2.toFixed(4)}<br><br>`;
    resultText += `Δ = ${delta.toFixed(4)} > 0`;
  } else if (delta === 0 && raiz1 !== null) {
    resultText = `A função tem <strong>uma raiz real dupla</strong>:<br>`;
    resultText += `x₁ = x₂ = ${raiz1.toFixed(4)}<br><br>`;
    resultText += `Δ = ${delta.toFixed(4)} = 0`;
  } else {
    resultText = `A função <strong>não possui raízes reais</strong>.<br><br>`;
    resultText += `Δ = ${delta.toFixed(4)} < 0`;
  }

  resultElement.innerHTML = resultText;
}

// Atualiza o modal de vértice
function updateVertexModal() {
  const resultElement = document.getElementById("modal-vertex-result");
  const { xv, yv } = currentResults.vertex;

  if (xv === null || yv === null) {
    resultElement.innerHTML = "Calcule a função primeiro para ver o vértice.";
    return;
  }

  let resultText = `O vértice da parábola está no ponto:<br><br>`;
  resultText += `<strong>V(${xv.toFixed(4)}, ${yv.toFixed(4)})</strong><br><br>`;
  resultText += `x<sub>v</sub> = ${xv.toFixed(4)}<br>`;
  resultText += `y<sub>v</sub> = ${yv.toFixed(4)}`;

  resultElement.innerHTML = resultText;
}

// Atualiza o modal de concavidade
function updateConcavityModal() {
  const resultElement = document.getElementById("modal-concavity-result");
  const { text, reason, a } = currentResults.concavity;

  if (a === null) {
    resultElement.innerHTML = "Calcule a função primeiro para ver a concavidade.";
    return;
  }

  const aFormatted = a % 1 === 0 ? a.toString() : a.toFixed(2);
  let resultText = `<strong>${text}</strong><br><br>`;
  resultText += `${reason}<br><br>`;
  resultText += `Coeficiente a = ${aFormatted}`;

  resultElement.innerHTML = resultText;
}

// Atualiza o modal de derivada
function updateDerivativeModal() {
  const resultElement = document.getElementById("modal-derivative-result");
  const { formula } = currentResults.derivative;

  if (!formula) {
    resultElement.innerHTML = "Calcule a função primeiro para ver a derivada.";
    return;
  }

  const resultText = `A derivada da sua função é:<br><br>`;
  resultText += `<strong>${formula}</strong>`;

  resultElement.innerHTML = resultText;
}

// Atualiza o modal de reta tangente
function updateTangentModal() {
  const resultElement = document.getElementById("modal-tangent-result");
  const { equation, x0, m, bTangent } = currentResults.tangent;

  if (x0 === null || m === null || bTangent === null) {
    resultElement.innerHTML = "Calcule a função primeiro para ver a reta tangente.";
    return;
  }

  let resultText = `Reta tangente no ponto x₀ = ${x0.toFixed(4)}:<br><br>`;
  resultText += `<strong>${equation}</strong><br><br>`;
  resultText += `Coeficiente angular (m) = ${m.toFixed(4)}<br>`;
  resultText += `Coeficiente linear (b) = ${bTangent.toFixed(4)}`;

  resultElement.innerHTML = resultText;
}

// Função para atualizar os resultados (chamada de grafico.js)
export function updateResults(results) {
  currentResults = { ...currentResults, ...results };
}

// Exporta a função closeModal para uso externo se necessário
export { closeModal };

