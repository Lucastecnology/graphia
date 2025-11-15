// Módulo: modais.js — Gerencia modais com resultados formatados sem zeros extras

let currentResults = {
  roots: { raiz1: null, raiz2: null, delta: null },
  vertex: { xv: null, yv: null },
  concavity: { text: "", reason: "", a: null },
  derivative: { formula: "" },
  tangent: { equation: "", x0: null, m: null, bTangent: null }
};

// Formata número: remove .0000, mantém até 4 casas se necessário
function fmt(num) {
  if (num === null || num === undefined || !isFinite(num)) return "-";
  const str = parseFloat(num.toFixed(6)).toString();
  return str.replace(/\.?0+$/, "");
}

// Inicializa todos os listeners
export function initModals() {
  const btnMap = {
    "roots": "btn-roots",
    "vertex": "btn-vertex",
    "concavity": "btn-concavity",
    "derivative": "btn-derivative",
    "tangent": "btn-tangent",
    "questions": "btn-questions",
    "results": "btn-results"
  };

  Object.entries(btnMap).forEach(([type, id]) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", () => openModal(type));
  });

  // Fechar
  document.querySelectorAll(".modal-close").forEach(btn => btn.addEventListener("click", closeModal));
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.addEventListener("click", closeModal);

  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  // Delegação (fallback)
  document.addEventListener("click", e => {
    const btn = e.target.closest(".result-btn, #btn-results");
    if (!btn) return;
    const map = {
      "btn-roots": "roots",
      "btn-vertex": "vertex",
      "btn-concavity": "concavity",
      "btn-derivative": "derivative",
      "btn-tangent": "tangent",
      "btn-questions": "questions",
      "btn-results": "results"
    };
    const type = map[btn.id];
    if (type) {
      openModal(type);
      e.preventDefault();
      e.stopPropagation();
    }
  });
}

// Abre modal
function openModal(type) {
  const overlay = document.getElementById("modal-overlay");
  const modal = document.getElementById(`modal-${type}`);
  if (!modal || !overlay) return;

  updateModalContent(type);
  overlay.classList.add("active");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

// Fecha modal
function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.classList.remove("active");
  document.querySelectorAll(".modal").forEach(m => m.classList.remove("active"));
  document.body.style.overflow = "";
}

// Atualiza conteúdo por tipo
function updateModalContent(type) {
  const handlers = {
    roots: updateRootsModal,
    vertex: updateVertexModal,
    concavity: updateConcavityModal,
    derivative: updateDerivativeModal,
    tangent: updateTangentModal,
    questions: () => {}, // Questões são gerenciadas por questoes.js
    results: updateResultsModal
  };
  const fn = handlers[type];
  if (fn) fn();
}

// RAÍZES
function updateRootsModal() {
  const el = document.getElementById("modal-roots-result");
  if (!el) return;
  const { raiz1, raiz2, delta } = currentResults.roots;

  if (delta === null) {
    el.innerHTML = "Calcule a função primeiro para ver as raízes.";
    return;
  }

  let html = "";
  if (delta > 0) {
    html = `<strong>Duas raízes reais distintas:</strong><br>
            x₁ = ${fmt(raiz1)}<br>
            x₂ = ${fmt(raiz2)}<br><br>
            Δ = ${fmt(delta)} > 0`;
  } else if (delta === 0) {
    html = `<strong>Uma raiz real dupla:</strong><br>
            x = ${fmt(raiz1)}<br><br>
            Δ = 0`;
  } else {
    html = `<strong>Sem raízes reais</strong><br><br>
            Δ = ${fmt(delta)} < 0`;
  }
  el.innerHTML = html;
}

// VÉRTICE
function updateVertexModal() {
  const el = document.getElementById("modal-vertex-result");
  if (!el) return;
  const { xv, yv } = currentResults.vertex;

  if (xv === null || yv === null) {
    el.innerHTML = "Calcule a função primeiro para ver o vértice.";
    return;
  }

  el.innerHTML = `O vértice está em:<br><br>
                  <strong>V(${fmt(xv)}, ${fmt(yv)})</strong><br><br>
                  x<sub>v</sub> = ${fmt(xv)}<br>
                  y<sub>v</sub> = ${fmt(yv)}`;
}

// CONCAVIDADE
function updateConcavityModal() {
  const el = document.getElementById("modal-concavity-result");
  if (!el) return;
  const { text, reason, a } = currentResults.concavity;

  if (a === null) {
    el.innerHTML = "Calcule a função primeiro para ver a concavidade.";
    return;
  }

  el.innerHTML = `<strong>${text}</strong><br><br>
                  ${reason}<br><br>
                  Coeficiente a = ${fmt(a)}`;
}

// DERIVADA
function updateDerivativeModal() {
  const el = document.getElementById("modal-derivative-result");
  if (!el) return;
  const { formula } = currentResults.derivative;

  if (!formula) {
    el.innerHTML = "A derivada ainda não foi calculada.<br><br>" +
                   "Digite uma função quadrática válida e clique em <strong>Plotar</strong>.";
    return;
  }

  el.innerHTML = `A derivada da função é:<br><br><strong>${formula}</strong>`;
}

// TANGENTE
function updateTangentModal() {
  const el = document.getElementById("modal-tangent-result");
  if (!el) return;
  const { equation, x0, m, bTangent } = currentResults.tangent;

  if (x0 === null || m === null || bTangent === null) {
    el.innerHTML = "Calcule a função primeiro para ver a reta tangente.";
    return;
  }

  el.innerHTML = `Reta tangente em x₀ = ${fmt(x0)}:<br><br>
                  <strong>${equation}</strong><br><br>
                  m = ${fmt(m)}<br>
                  b = ${fmt(bTangent)}`;
}

// RESUMO
function updateResultsModal() {
  const el = document.getElementById("modal-results-result");
  if (!el) return;

  const r = currentResults;

  let html = `<div class='explanation'><h3>Resumo Rápido</h3>
              <p>Principais resultados da função:</p>
              <ol>
                <li>Raízes</li>
                <li>Vértice</li>
                <li>Tangente</li>
              </ol></div>
              <div class='result-display'><h3>Resultado</h3>`;

  // Raízes
  if (r.roots?.delta !== null) {
    if (r.roots.delta > 0)
      html += `<p><strong>Raízes:</strong> x₁ = ${fmt(r.roots.raiz1)}, x₂ = ${fmt(r.roots.raiz2)}</p>`;
    else if (r.roots.delta === 0)
      html += `<p><strong>Raiz dupla:</strong> x = ${fmt(r.roots.raiz1)}</p>`;
    else
      html += `<p><strong>Raízes:</strong> Nenhuma real</p>`;
  } else html += `<p><strong>Raízes:</strong> -</p>`;

  // Vértice
  if (r.vertex?.xv !== null)
    html += `<p><strong>Vértice:</strong> V(${fmt(r.vertex.xv)}, ${fmt(r.vertex.yv)})</p>`;
  else html += `<p><strong>Vértice:</strong> -</p>`;

  // Concavidade
  if (r.concavity?.a !== null)
    html += `<p><strong>Concavidade:</strong> ${r.concavity.text}</p>`;

  // Derivada
  if (r.derivative?.formula)
    html += `<p><strong>Derivada:</strong> ${r.derivative.formula}</p>`;

  // Tangente
  if (r.tangent?.equation)
    html += `<p><strong>Tangente (x₀=${fmt(r.tangent.x0)}):</strong> ${r.tangent.equation}</p>`;

  html += `</div>`;
  el.innerHTML = html;
}

// Atualiza resultados (chamado por grafico.js)
export function updateResults(results) {
  currentResults = { ...currentResults, ...results };
}

export { closeModal };