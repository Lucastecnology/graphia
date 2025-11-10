// Módulo: matematica.js — Funções matemáticas puras da parábola (f(x) e sua derivada)
export function f(a, b, c, x) {
  // f(x) = ax² + bx + c
  return a * x * x + b * x + c;
}

export function derivative(a, b, x) {
  // f'(x) = 2ax + b
  return 2 * a * x + b;
}


