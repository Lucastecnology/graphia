// Módulo: grafico.js — Constrói dados, configura e desenha o gráfico com Chart.js. Também atualiza os resultados na UI.
import { parseFunction } from "./analisador.js";
import { f, derivative } from "./matematica.js";

// Mantém instância atual do gráfico para permitir destruir antes de redesenhar
let chart;

export function plotFunction() {
  // 1) Lê e analisa a função digitada
  const funcInput = document.getElementById("funcInput").value;
  const parsed = parseFunction(funcInput);

  // Captura coeficientes a, b, c após normalização (ver analisador.js)
  const regexPattern = /^([+-]?\d*\.?\d*)\*?x\*\*2(?:\s*([+-]?\d*\.?\d*)\*?x)?(?:\s*([+-]?\d*\.?\d*))?$/;
  const match = parsed.match(regexPattern);

  if (!match) {
    alert("Digite uma função quadrática no formato ax² + bx + c (ex: x² + 2x + 1 ou -2x² - x + 3)");
    return;
  }

  // 2) Converte strings capturadas em números e trata ausências/sinais
  let aStr = (match[1] || "").replace(/\s/g, "") || "1";
  let bStr = (match[2] || "").replace(/\s/g, "") || "0";
  let cStr = (match[3] || "").replace(/\s/g, "") || "0";
  
  if (aStr === "+" || aStr === "") aStr = "1";
  if (aStr === "-") aStr = "-1";
  if (bStr === "+" || bStr === "" || !match[2]) bStr = "0";
  if (bStr === "-") bStr = "-1";
  if (cStr === "+" || cStr === "" || !match[3]) cStr = "0";
  if (cStr === "-") cStr = "-1";
  
  const a = parseFloat(aStr);
  const b = parseFloat(bStr);
  const c = parseFloat(cStr);
  
  if (isNaN(a) || isNaN(b) || isNaN(c)) {
    alert("Erro ao processar a função. Verifique o formato: ax² + bx + c");
    console.error("Erro no parsing:", { parsed, match, aStr, bStr, cStr, a, b, c });
    return;
  }

  // 3) Valida a ≠ 0 (parábola)
  if (a === 0) {
    alert("Coeficiente 'a' não pode ser zero para uma função quadrática.");
    return;
  }

  // 4) Lê ponto x0 para reta tangente
  const x0Input = document.getElementById("xPoint").value;
  if (x0Input === "") {
    alert("Digite um valor para o ponto de tangência (x0).");
    return;
  }
  const x0 = parseFloat(x0Input);
  if (isNaN(x0)) {
    alert("Valor inválido para x0.");
    return;
  }
  const y0 = f(a, b, c, x0);

  // 5) Coordenadas importantes (vértice, raízes e ranges)
  const xv = -b / (2 * a);
  const yv = f(a, b, c, xv);
  
  const delta = b * b - 4 * a * c;
  let raiz1Val, raiz2Val;
  
  if (delta > 0) {
    raiz1Val = (-b + Math.sqrt(delta)) / (2 * a);
    raiz2Val = (-b - Math.sqrt(delta)) / (2 * a);
  } else if (delta === 0) {
    raiz1Val = -b / (2 * a);
    raiz2Val = raiz1Val;
  }
  
  // Range X baseado na abertura e raízes
  let rangeX;
  const absA = Math.abs(a);
  const baseRange = Math.max(10 / Math.sqrt(absA), 4);
  
  if (delta >= 0 && raiz1Val !== undefined && raiz2Val !== undefined) {
    const distRaizes = Math.abs(raiz1Val - raiz2Val);
    if (distRaizes > 0.1) {
      rangeX = Math.max(distRaizes * 0.6, baseRange * 0.7);
    } else {
      rangeX = baseRange;
    }
  } else {
    if (Math.abs(xv) < 5) {
      rangeX = baseRange;
    } else {
      rangeX = Math.min(baseRange * 1.2, Math.abs(xv) * 0.4 + 4);
    }
  }
  
  // Mantém limites confortáveis de visualização
  rangeX = Math.min(rangeX, 12);
  rangeX = Math.max(rangeX, 4);
  
  const minX = xv - rangeX;
  const maxX = xv + rangeX;
  
  // Geração dos pontos da curva
  const xs = [];
  const ys = [];
  const step = 0.05;
  for (let x = minX; x <= maxX; x += step) {
    xs.push(x);
    ys.push(f(a, b, c, x));
  }

  // Range Y simétrico em torno do vértice
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const distAbove = maxY - yv;
  const distBelow = yv - minY;
  const maxDist = Math.max(distAbove, distBelow);
  const effectiveDist = Math.max(maxDist, 2);
  const padding = Math.max(effectiveDist * 0.08, 0.5);
  
  let yMin = yv - effectiveDist - padding;
  let yMax = yv + effectiveDist + padding;
  
  if (yMax - yMin < 4) {
    const halfRange = 2;
    yMin = yv - halfRange;
    yMax = yv + halfRange;
  }
  
  const finalRange = yMax - yMin;
  yMin = yv - finalRange / 2;
  yMax = yv + finalRange / 2;

  // Textos exibidos na lateral
  let raiz1 = "Nenhuma raiz real";
  let raiz2 = "";

  if (delta > 0) {
    raiz1 = raiz1Val.toFixed(4);
    raiz2 = raiz2Val.toFixed(4);
  } else if (delta === 0 && raiz1Val !== undefined) {
    raiz1 = raiz1Val.toFixed(4);
    raiz2 = " (raiz dupla)";
  }

  let concavityText = "";
  let concavityReason = "";
  const aFormatted = a % 1 === 0 ? a.toString() : a.toFixed(2);
  if (a > 0) {
    concavityText = "Concavidade: Para cima";
    concavityReason = `O coeficiente 'a' é positivo (${aFormatted} > 0), então a parábola abre para cima.`;
  } else {
    concavityText = "Concavidade: Para baixo";
    concavityReason = `O coeficiente 'a' é negativo (${aFormatted} < 0), então a parábola abre para baixo.`;
  }

  // Equação da tangente em x0
  let derivStr = `y' = ${2 * a}x`;
  if (b > 0) derivStr += ` + ${b}`;
  else if (b < 0) derivStr += ` ${b}`;

  const m = derivative(a, b, x0);
  const bTangent = y0 - m * x0;
  let tangentStr = `y = ${m.toFixed(4)}x`;
  if (bTangent > 0) tangentStr += ` + ${bTangent.toFixed(4)}`;
  else if (bTangent < 0) tangentStr += ` ${bTangent.toFixed(4)}`;

  // Série da reta tangente
  const tangentXs = [minX, maxX];
  const tangentYs = tangentXs.map(x => m * x + bTangent);

  // Atualiza painel de resultados
  document.getElementById("roots").innerText = `Raízes: ${raiz1}${raiz2 ? ' e ' + raiz2 : ''}`;
  document.getElementById("vertex").innerText = `Vértice: (${xv.toFixed(4)}, ${yv.toFixed(4)})`;
  document.getElementById("concavity").innerHTML = `${concavityText}<br><small>${concavityReason}</small>`;
  document.getElementById("derivative").innerText = `Derivada: ${derivStr}`;
  document.getElementById("tangent").innerText = `Reta Tangente em x=${x0}: ${tangentStr}`;

  // Plugin para desenhar rótulos 'x1' e 'x2' nas raízes (sobre o eixo x)
  const rootLabelsPlugin = {
    id: "rootLabels",
    afterDatasetsDraw(chartInstance, args, pluginOptions) {
      const { roots = [], color = "orange", font = "12px sans-serif", offset = { x: 6, y: -6 } } = pluginOptions || {};
      if (!roots.length) return;
      const { ctx, scales } = chartInstance;
      const xScale = scales.x;
      const yScale = scales.y;
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = font;
      roots.forEach(r => {
        const xPix = xScale.getPixelForValue(r.x);
        const yPix = yScale.getPixelForValue(0);
        if (Number.isFinite(xPix) && Number.isFinite(yPix)) {
          ctx.fillText(r.label, xPix + offset.x, yPix + offset.y);
        }
      });
      ctx.restore();
    }
  };

  // Desenha o gráfico com Chart.js
  const ctx = document.getElementById("graph").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: xs,
      datasets: [
        {
          label: "Função",
          data: ys.map((y, i) => ({ x: xs[i], y })),
          borderColor: "blue",
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
        },
        {
          label: "Reta Tangente",
          data: tangentYs.map((y, i) => ({ x: tangentXs[i], y })),
          borderColor: "red",
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
        },
        {
          label: "Ponto de Tangência",
          data: [{ x: x0, y: y0 }],
          pointBackgroundColor: "purple",
          pointRadius: 7,
          showLine: false,
        },
        {
          label: "Raízes",
          data: [
            raiz1Val !== undefined ? { x: raiz1Val, y: 0 } : null,
            raiz2Val !== undefined ? { x: raiz2Val, y: 0 } : null,
          ].filter(p => p !== null && !isNaN(p.x)),
          pointBackgroundColor: "orange",
          pointRadius: 5,
          showLine: false,
        },
        {
          label: "Vértice",
          data: [{ x: xv, y: yv }],
          pointBackgroundColor: "green",
          pointRadius: 6,
          showLine: false,
        },
      ],
    },
    plugins: [rootLabelsPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          title: { display: true, text: "x" },
          min: minX,
          max: maxX,
          grid: {
            color: (context) => (context.tick.value === 0 ? 'black' : '#ddd'),
            lineWidth: (context) => (context.tick.value === 0 ? 2 : 1),
          },
        },
        y: {
          title: { display: true, text: "y" },
          min: yMin,
          max: yMax,
          grid: {
            color: (context) => (context.tick.value === 0 ? 'black' : '#ddd'),
            lineWidth: (context) => (context.tick.value === 0 ? 2 : 1),
          },
        },
      },
      plugins: {
        legend: { display: false },
        rootLabels: {
          roots: [
            ...(raiz1Val !== undefined && isFinite(raiz1Val) ? [{ x: raiz1Val, label: "x1" }] : []),
            ...(raiz2Val !== undefined && isFinite(raiz2Val) ? [{ x: raiz2Val, label: "x2" }] : []),
          ],
          color: "orange",
          font: "12px sans-serif",
          offset: { x: 6, y: -6 }
        },
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "xy",
          },
          pan: {
            enabled: true,
            mode: "xy",
          },
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `(${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
            }
          }
        },
      },
      elements: {
        line: { tension: 0 },
        point: { radius: 5 },
      },
    },
  });
}


