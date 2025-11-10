// Módulo: init.js — Ponto de inicialização do app; registra o handler do botão e renderiza o gráfico inicial
import { plotFunction } from "./grafico.js";

// Debounce simples para evitar redesenhos excessivos enquanto o usuário digita
function debounce(fn, wait) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), wait);
  };
}

document.addEventListener("DOMContentLoaded", function() {
  // Desenha imediatamente usando os valores padrão do formulário
  plotFunction();
  
  // Atualiza em tempo real conforme o usuário digita/ajusta valores
  const funcInput = document.getElementById("funcInput");
  const xPointInput = document.getElementById("xPoint");
  const debouncedPlot = debounce(plotFunction, 200);
  if (funcInput) funcInput.addEventListener("input", debouncedPlot);
  if (xPointInput) xPointInput.addEventListener("input", debouncedPlot);
});


