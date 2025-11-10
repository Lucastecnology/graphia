// Módulo: analisador.js — Responsável por normalizar/interpretar a string de função digitada (ex.: "2x²+5x-6" -> "2*x**2+5*x-6")
export function parseFunction(input) {
  // Remove espaços e substitui vírgulas por pontos
  let parsed = input.trim().replace(/ /g, "").replace(/,/g, ".");
  
  // Substitui x² por x**2
  parsed = parsed.replace(/x²/g, "x**2");
  
  // Substitui ^ por **
  parsed = parsed.replace(/\^/g, "**");
  
  // Normaliza: adiciona + no início se não começar com sinal (para facilitar parsing)
  if (!/^[+-]/.test(parsed)) {
    parsed = "+" + parsed;
  }
  
  // Adiciona 1 antes de x quando x está sozinho (ex: +x -> +1x, -x -> -1x)
  parsed = parsed.replace(/([+-])x/g, "$11x");
  
  // Adiciona * entre números e x (ex: 2x -> 2*x, mas preserva sinais)
  parsed = parsed.replace(/(\d)(x)/g, "$1*$2");
  
  // Remove o + inicial que adicionamos (se ainda estiver lá)
  if (parsed.startsWith("+") && parsed.length > 1) {
    parsed = parsed.substring(1);
  }
  
  return parsed;
}


