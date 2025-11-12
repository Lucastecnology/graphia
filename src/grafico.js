// Módulo: grafico.js — Constrói dados, configura e desenha o gráfico com Chart.js. Também atualiza os resultados na UI.
import { parseFunction } from "./analisador.js";
import { f, derivative } from "./matematica.js";
import { updateResults } from "./modais.js";

// Mantém instância atual do gráfico para permitir destruir antes de redesenhar
let chart;

// Mantém os parâmetros da função atual para redesenho dinâmico durante pan/zoom
let currentFunctionParams = { a: 0, b: 0, c: 0, x0: 0 };

// Função para atualizar os pontos da parábola e reta tangente baseado na área visível
function updateParabolaPoints(chartInstance, a, b, c, x0) {
  if (!chartInstance || !chartInstance.scales) return;
  
  const xScale = chartInstance.scales.x;
  const yScale = chartInstance.scales.y;
  
  // Obtém os limites atuais das escalas (área visível atual)
  // Tenta usar os valores calculados das escalas, se não disponíveis usa as opções
  let minX = xScale.min;
  let maxX = xScale.max;
  
  // Se os valores calculados não estão disponíveis, usa as opções
  if (minX === null || maxX === null || !isFinite(minX) || !isFinite(maxX)) {
    minX = xScale.options.min;
    maxX = xScale.options.max;
  }
  
  // Verifica se os valores são válidos
  if (minX === null || maxX === null || !isFinite(minX) || !isFinite(maxX)) {
    console.warn('Escalas não estão prontas para atualização');
    return; // Se as escalas não estão prontas, não atualiza
  }
  
  // Adiciona margem extra para garantir que a curva cubra toda a área visível
  // Aumenta a margem para evitar que a curva fique cortada nas bordas
  const xRange = maxX - minX;
  const margin = Math.max(xRange * 0.3, Math.abs(xRange) * 0.1 + 2);
  const adjustedMinX = minX - margin;
  const adjustedMaxX = maxX + margin;
  
  // Calcula o passo baseado no range (mais pontos quando mais zoomado)
  const range = adjustedMaxX - adjustedMinX;
  // Ajusta o passo para garantir que temos pontos suficientes para uma curva suave
  const step = Math.max(0.005, Math.min(0.15, range / 800));
  
  // Gera novos pontos da parábola
  const xs = [];
  const ys = [];
  for (let x = adjustedMinX; x <= adjustedMaxX; x += step) {
    xs.push(x);
    ys.push(f(a, b, c, x));
  }
  
  // Atualiza o dataset da função
  const functionDataset = chartInstance.data.datasets[0];
  if (functionDataset) {
    functionDataset.data = xs.map((x, i) => ({ x, y: ys[i] }));
  }
  
  // Atualiza a reta tangente para cobrir a área visível
  const y0 = f(a, b, c, x0);
  const m = derivative(a, b, x0);
  const bTangent = y0 - m * x0;
  
  const tangentDataset = chartInstance.data.datasets[1];
  if (tangentDataset) {
    const tangentXs = [adjustedMinX, adjustedMaxX];
    const tangentYs = tangentXs.map(x => m * x + bTangent);
    tangentDataset.data = tangentXs.map((x, i) => ({ x, y: tangentYs[i] }));
  }
  
  // Atualiza o gráfico sem alterar as escalas (mantém os limites definidos durante o pan)
  chartInstance.update('none'); // Atualiza sem animação para melhor performance
}

// Sincroniza os ticks: força o passo numérico de Y a ser igual ao passo numérico de X
// e alinha os limites de Y para múltiplos desse passo (modo "coordenadas fixas").
function syncTickSpacing(chartInstance) {
  if (!chartInstance || !chartInstance.scales) return;
  const xScale = chartInstance.scales.x;
  const yScale = chartInstance.scales.y;
  const chartArea = chartInstance.chartArea;
  if (!xScale || !yScale || !chartArea) return;

  const xMin = (typeof xScale.min === 'number') ? xScale.min : xScale.options.min;
  const xMax = (typeof xScale.max === 'number') ? xScale.max : xScale.options.max;
  const yMin = (typeof yScale.min === 'number') ? yScale.min : yScale.options.min;
  const yMax = (typeof yScale.max === 'number') ? yScale.max : yScale.options.max;
  if (!isFinite(xMin) || !isFinite(xMax) || !isFinite(yMin) || !isFinite(yMax)) return;

  const xRange = xMax - xMin;
  const yRange = yMax - yMin;
  if (xRange <= 0 || yRange <= 0) return;

  // Debug: log quando a função é chamada
  console.debug('[syncTickSpacing] chamada', { xScaleReady: !!xScale, yScaleReady: !!yScale });

  // Tentativa de obter o passo atual renderizado do eixo X
  let xStep = null;
  try {
    const ticks = xScale.ticks;
    if (Array.isArray(ticks) && ticks.length >= 2) {
      const t0 = ticks[0];
      const t1 = ticks[1];
      const v0 = (t0 && typeof t0.value !== 'undefined') ? t0.value : t0;
      const v1 = (t1 && typeof t1.value !== 'undefined') ? t1.value : t1;
      if (isFinite(v0) && isFinite(v1)) xStep = Math.abs(v1 - v0);
    }
  } catch (e) {
    // ignore
  }

  if (!xStep || !isFinite(xStep) || xStep <= 0) {
    xStep = (xScale.options && xScale.options.ticks && xScale.options.ticks.stepSize) || null;
  }
  if (!xStep || !isFinite(xStep) || xStep <= 0) {
    xStep = xRange / 10;
  }

  // Se ainda inválido, aborta
  if (!isFinite(xStep) || xStep === 0) return;

  // Passo de Y igual ao passo de X (coordenadas fixas)
  let yStep = xStep;

  // Se o passo for absurdo em relação ao range Y, aplica fallback amigável
  function niceTick(value) {
    if (!isFinite(value) || value <= 0) return value;
    const pow = Math.pow(10, Math.floor(Math.log10(value)));
    const n = value / pow;
    if (n <= 1.5) return 1 * pow;
    if (n <= 3) return 2 * pow;
    if (n <= 7) return 5 * pow;
    return 10 * pow;
  }

  if (!isFinite(yStep) || Math.abs(yStep) < 1e-12 || Math.abs(yStep) > Math.abs(yRange) * 2) {
    yStep = niceTick(Math.abs(yRange) / 6) || (yRange / 6);
  }

  // Calcula limites de Y alinhados a múltiplos de yStep
  const newYMin = Math.floor(yMin / yStep) * yStep;
  const newYMax = Math.ceil(yMax / yStep) * yStep;

  // Debug: mostra os valores calculados
  console.debug('[syncTickSpacing] valores', {
    xMin, xMax, xRange, xStep,
    yMin, yMax, yRange, yStep,
    newYMin, newYMax,
    ticksX: xScale.ticks && xScale.ticks.slice ? xScale.ticks.slice(0,5) : xScale.ticks
  });

  // Aplica nas opções e nas propriedades da escala
  yScale.options.ticks = yScale.options.ticks || {};
  yScale.options.ticks.stepSize = yStep;
  yScale.options.ticks.maxTicksLimit = 15;
  yScale.options.min = newYMin;
  yScale.options.max = newYMax;

  try {
    yScale.min = newYMin;
    yScale.max = newYMax;
  } catch (e) {
    // ignore
  }

  try { chartInstance.update('none'); } catch (e) { /* ignore */ }
}

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

  // Salva os parâmetros para uso na atualização dinâmica
  currentFunctionParams.a = a;
  currentFunctionParams.b = b;
  currentFunctionParams.c = c;

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
  
  // Salva x0 para uso na atualização dinâmica
  currentFunctionParams.x0 = x0;

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
  
  // Range X amplo para permitir navegação - parábola "infinita"
  const absA = Math.abs(a);
  const baseRange = Math.max(50 / Math.sqrt(absA), 20);
  
  // Range inicial amplo para permitir navegação com pan
  let rangeX = baseRange * 2;
  
  const minX = xv - rangeX;
  const maxX = xv + rangeX;
  
  // Geração dos pontos da curva com passo adequado
  // Adiciona margem para garantir que a curva não fique cortada
  const initialMargin = Math.max((maxX - minX) * 0.3, 2);
  const adjustedMinX = minX - initialMargin;
  const adjustedMaxX = maxX + initialMargin;
  
  const xs = [];
  const ys = [];
  const step = 0.1; // Passo um pouco maior para melhor performance com range maior
  for (let x = adjustedMinX; x <= adjustedMaxX; x += step) {
    xs.push(x);
    ys.push(f(a, b, c, x));
  }

  // Range Y simétrico em torno do vértice - mais amplo para navegação
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const distAbove = maxY - yv;
  const distBelow = yv - minY;
  const maxDist = Math.max(distAbove, distBelow);
  // Reduz MUITO o tamanho vertical da parábola para ficar quase achatada
  // Usa um multiplicador muito pequeno para efetivamente "encolher" a curva
  const effectiveDist = Math.max(maxDist * 0.005, 1); // Range Y extremamente compacto
  const padding = Math.max(effectiveDist * 0.02, 0.1);
  
  let yMin = yv - effectiveDist - padding;
  let yMax = yv + effectiveDist + padding;
  
  if (yMax - yMin < 8) {
    const halfRange = 4;
    yMin = yv - halfRange;
    yMax = yv + halfRange;
  }

  // Calcula step size adequado para os ticks baseado nos ranges
  const xRangeForTicks = maxX - minX;
  const yRangeForTicks = yMax - yMin;
  
  // Calcula step size para X
  let xStepSize;
  if (xRangeForTicks <= 5) xStepSize = 1;
  else if (xRangeForTicks <= 20) xStepSize = 2;
  else if (xRangeForTicks <= 50) xStepSize = 5;
  else if (xRangeForTicks <= 100) xStepSize = 10;
  else if (xRangeForTicks <= 200) xStepSize = 20;
  else xStepSize = Math.max(10, Math.floor(xRangeForTicks / 10));
  
  // Calcula step size para Y
  let yStepSize;
  if (yRangeForTicks <= 5) yStepSize = 1;
  else if (yRangeForTicks <= 20) yStepSize = 2;
  else if (yRangeForTicks <= 50) yStepSize = 5;
  else if (yRangeForTicks <= 100) yStepSize = 10;
  else if (yRangeForTicks <= 200) yStepSize = 20;
  else yStepSize = Math.max(10, Math.floor(yRangeForTicks / 10));

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

  // Atualiza os dados nos modais
  updateResults({
    roots: {
      raiz1: raiz1Val,
      raiz2: raiz2Val,
      delta: delta
    },
    vertex: {
      xv: xv,
      yv: yv
    },
    concavity: {
      text: concavityText,
      reason: concavityReason,
      a: a
    },
    derivative: {
      formula: derivStr
    },
    tangent: {
      equation: tangentStr,
      x0: x0,
      m: m,
      bTangent: bTangent
    }
  });

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

  // Plugin para desenhar os números dos ticks no próprio eixo (no ponto onde y=0 ou x=0)
  // Isso remove os números da borda e coloca-os sobre os eixos centrais.
  const axisCenterLabels = {
    id: 'axisCenterLabels',
    afterDraw(chartInstance) {
      const { ctx, scales } = chartInstance;
      if (!scales || !scales.x || !scales.y) return;
      const xScale = scales.x;
      const yScale = scales.y;
      const chartArea = chartInstance.chartArea || { left: 0, right: ctx.canvas.width, top: 0, bottom: ctx.canvas.height };

      ctx.save();
      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';

      // Desenha rótulos de X sobre o eixo horizontal (na altura y=0 se possível)
      const yForX = Number.isFinite(yScale.getPixelForValue(0)) ? yScale.getPixelForValue(0) : (chartArea.top + chartArea.bottom) / 2;
      const xTicks = xScale.ticks || [];
      xTicks.forEach(t => {
        const val = (t && typeof t.value !== 'undefined') ? t.value : t;
        if (!isFinite(val)) return;
        const xPix = xScale.getPixelForValue(val);
        if (!Number.isFinite(xPix)) return;
        ctx.textAlign = 'center';
        ctx.textBaseline = (yForX < (chartArea.top + chartArea.bottom) / 2) ? 'bottom' : 'top';
        // pequeno offset para não sobrepor a linha do eixo
        const offsetY = (ctx.textBaseline === 'bottom') ? -6 : 6;
        ctx.fillText(String(val), xPix, yForX + offsetY);
      });

      // Desenha rótulos de Y sobre o eixo vertical (na largura x=0 se possível)
      const xForY = Number.isFinite(xScale.getPixelForValue(0)) ? xScale.getPixelForValue(0) : (chartArea.left + chartArea.right) / 2;
      const yTicks = yScale.ticks || [];
      yTicks.forEach(t => {
        const val = (t && typeof t.value !== 'undefined') ? t.value : t;
        if (!isFinite(val)) return;
        const yPix = yScale.getPixelForValue(val);
        if (!Number.isFinite(yPix)) return;
        ctx.textAlign = (xForY < (chartArea.left + chartArea.right) / 2) ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        const offsetX = (ctx.textAlign === 'left') ? 6 : -6;
        ctx.fillText(String(val), xForY + offsetX, yPix);
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
  plugins: [rootLabelsPlugin, axisCenterLabels],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
          x: {
          type: "linear",
            position: "top",
          title: { display: true, text: "Y",
            font:{ size: 24, weight: "bold",
            },
           },
          min: minX,
          max: maxX,
          ticks: {
              stepSize: xStepSize,
              display: false,
            maxTicksLimit: 15, // Limita o número de ticks para não ficarem muito próximos
          },
          grid: {
            color: (context) => (context.tick.value === 0 ? 'black' : '#ddd'),
            lineWidth: (context) => (context.tick.value === 0 ? 2 : 1),
          },
        },
        y: {
          position: "right",
          title: { display: true, text: "X",  font:{ size: 24, weight: "bold",
          },
         },
          min: yMin,
          max: yMax,
          ticks: {
            stepSize: yStepSize,
            display: false,
            maxTicksLimit: 15, // Limita o número de ticks para não ficarem muito próximos
          },
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
            enabled: false, // Desabilita o pan do plugin para usar nossa implementação customizada
            mode: "xy",
          },
          // Callback para atualizar a parábola quando o usuário faz zoom
          onZoomComplete: ({ chart }) => {
            // Aguarda um pequeno delay para garantir que as escalas foram atualizadas
            setTimeout(() => {
              updateParabolaPoints(chart, currentFunctionParams.a, currentFunctionParams.b, currentFunctionParams.c, currentFunctionParams.x0);
              syncTickSpacing(chart);
            }, 50);
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
  
  // Força uma atualização inicial do gráfico para garantir que seja renderizado
  chart.update();
  
  // Atualiza os pontos da parábola após criar o gráfico para garantir que cubra a área visível
  // Usa um pequeno delay para garantir que o gráfico foi renderizado e as escalas estão prontas
  setTimeout(() => {
    if (chart && chart.scales && chart.scales.x && chart.scales.y) {
      updateParabolaPoints(chart, a, b, c, x0);
      syncTickSpacing(chart);
    }
  }, 150);
  
  // Adiciona handler customizado para pan com botão esquerdo do mouse
  setupPanHandler(chart);
}

// Variáveis globais para o handler de pan
let panState = {
  isPanning: false,
  lastPanPoint: null,
  chartInstance: null,
  handlers: {
    mousedown: null,
    mousemove: null,
    mouseup: null,
    mouseleave: null,
    mouseenter: null
  }
};

function setupPanHandler(chartInstance) {
  if (!chartInstance || !chartInstance.canvas) return;
  
  // Remove listeners antigos se existirem
  if (panState.chartInstance && panState.chartInstance.canvas) {
    const oldCanvas = panState.chartInstance.canvas;
    if (panState.handlers.mousedown) {
      oldCanvas.removeEventListener('mousedown', panState.handlers.mousedown);
    }
    if (panState.handlers.mousemove) {
      oldCanvas.removeEventListener('mousemove', panState.handlers.mousemove);
      document.removeEventListener('mousemove', panState.handlers.mousemove);
    }
    if (panState.handlers.mouseup) {
      oldCanvas.removeEventListener('mouseup', panState.handlers.mouseup);
      document.removeEventListener('mouseup', panState.handlers.mouseup);
      oldCanvas.removeEventListener('mouseleave', panState.handlers.mouseup);
    }
    if (panState.handlers.mouseenter) {
      oldCanvas.removeEventListener('mouseenter', panState.handlers.mouseenter);
    }
  }
  
  const canvas = chartInstance.canvas;
  panState.chartInstance = chartInstance;
  panState.isPanning = false;
  panState.lastPanPoint = null;
  
  // Handler para quando o mouse é pressionado
  panState.handlers.mousedown = function(e) {
    // Verifica se é botão esquerdo (button === 0) sem teclas modificadoras
    if (e.button === 0 && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
      const rect = canvas.getBoundingClientRect();
      panState.isPanning = true;
      panState.lastPanPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
      e.stopPropagation();
    }
  };
  canvas.addEventListener('mousedown', panState.handlers.mousedown);
  
  // Handler para quando o mouse se move (usado tanto no canvas quanto no document para continuar funcionando fora do canvas)
  panState.handlers.mousemove = function(e) {
    if (panState.isPanning && panState.chartInstance && panState.lastPanPoint) {
      const rect = canvas.getBoundingClientRect();
      const currentPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      const deltaX = panState.lastPanPoint.x - currentPoint.x;
      const deltaY = panState.lastPanPoint.y - currentPoint.y;
      
      // Só faz pan se o movimento for significativo
      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        const chart = panState.chartInstance;
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        
        if (xScale && yScale) {
          // Obtém os valores atuais das escalas
          const currentXMin = xScale.min;
          const currentXMax = xScale.max;
          const currentYMin = yScale.min;
          const currentYMax = yScale.max;
          
          // Usa os métodos do Chart.js para converter pixels em valores
          const xRange = currentXMax - currentXMin;
          const yRange = currentYMax - currentYMin;
          
          // Obtém o tamanho do canvas em pixels
          const chartArea = chart.chartArea;
          const canvasWidth = chartArea.right - chartArea.left;
          const canvasHeight = chartArea.bottom - chartArea.top;
          
          if (canvasWidth > 0 && canvasHeight > 0 && xRange > 0 && yRange > 0) {
            // Converte movimento em pixels para movimento em unidades do gráfico
            const xDelta = (deltaX / canvasWidth) * xRange;
            const yDelta = (deltaY / canvasHeight) * yRange;
            
            // Lógica do pan: quando arrastamos, o gráfico se move na direção oposta ao movimento do mouse
            // Mouse para direita (deltaX positivo) → gráfico vai para esquerda → vemos valores maiores de X
            // Mouse para baixo (deltaY positivo) → gráfico vai para cima → vemos valores menores de Y
            
            // Para X: aumentar min/max = ver valores maiores = gráfico se move para esquerda
            const newXMin = currentXMin + xDelta;
            const newXMax = currentXMax + xDelta;
            
            // Para Y: no Chart.js, valores maiores estão em cima
            // Diminuir min/max = ver valores menores = gráfico se move para cima
            const newYMin = currentYMin - yDelta;
            const newYMax = currentYMax - yDelta;
            
            // Atualiza as opções das escalas
            xScale.options.min = newXMin;
            xScale.options.max = newXMax;
            yScale.options.min = newYMin;
            yScale.options.max = newYMax;
            
            // Força a atualização das escalas antes de atualizar o gráfico
            xScale.min = newXMin;
            xScale.max = newXMax;
            yScale.min = newYMin;
            yScale.max = newYMax;
            
            // Atualiza apenas as escalas sem recriar os pontos (isso mantém o gráfico estável durante o pan)
            chart.update('none');
          }
        }
        
        panState.lastPanPoint = currentPoint;
      }
      
      e.preventDefault();
      e.stopPropagation();
    }
  };
  canvas.addEventListener('mousemove', panState.handlers.mousemove);
  document.addEventListener('mousemove', panState.handlers.mousemove);
  
  // Handler para quando o mouse é solto
  panState.handlers.mouseup = function(e) {
    if (panState.isPanning) {
      const chart = panState.chartInstance;
      panState.isPanning = false;
      panState.lastPanPoint = null;
      
      if (canvas) {
        canvas.style.cursor = 'grab';
      }
      
      // Após o pan terminar, aguarda um pequeno delay para garantir que as escalas foram atualizadas
      // e então atualiza os pontos da parábola para a nova área visível
      if (chart) {
        // Força uma atualização das escalas antes de atualizar os pontos
        chart.update('none');
        
        setTimeout(() => {
          updateParabolaPoints(
            chart, 
            currentFunctionParams.a, 
            currentFunctionParams.b, 
            currentFunctionParams.c, 
            currentFunctionParams.x0
          );
          syncTickSpacing(chart);
        }, 50);
      }
      
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  canvas.addEventListener('mouseup', panState.handlers.mouseup);
  document.addEventListener('mouseup', panState.handlers.mouseup);
  canvas.addEventListener('mouseleave', panState.handlers.mouseup);
  
  // Muda o cursor quando o mouse está sobre o canvas (mas não está fazendo pan)
  panState.handlers.mouseenter = function(e) {
    if (!panState.isPanning) {
      canvas.style.cursor = 'grab';
    }
  };
  canvas.addEventListener('mouseenter', panState.handlers.mouseenter);
  
  // Define cursor inicial
  canvas.style.cursor = 'grab';
}


