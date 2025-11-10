let chart;

function parseFunction(input) {
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

function f(a, b, c, x) {
  return a * x * x + b * x + c;
}

function derivative(a, b, x) {
  return 2 * a * x + b;
}

function plotFunction() {
  const funcInput = document.getElementById("funcInput").value;
  const parsed = parseFunction(funcInput);

  // Regex melhorado para capturar coeficientes a, b, c
  // Permite termos opcionais: -2*x**2+5*x-6, -2x**2+5x-6, -2x**2, -2x**2+5x, etc
  // Formato esperado após parseFunction: [sinal][número]*x**2[sinal][número]*x[sinal][número]
  const regexPattern = /^([+-]?\d*\.?\d*)\*?x\*\*2(?:\s*([+-]?\d*\.?\d*)\*?x)?(?:\s*([+-]?\d*\.?\d*))?$/;
  const match = parsed.match(regexPattern);

  if (!match) {
    alert("Digite uma função quadrática no formato ax² + bx + c (ex: x² + 2x + 1 ou -2x² - x + 3)");
    return;
  }

  // Parse dos coeficientes com valores padrão
  let aStr = (match[1] || "").replace(/\s/g, "") || "1";
  let bStr = (match[2] || "").replace(/\s/g, "") || "0";
  let cStr = (match[3] || "").replace(/\s/g, "") || "0";
  
  // Trata casos onde o coeficiente é apenas sinal (ex: -x² -> -1, +x² -> 1)
  if (aStr === "+" || aStr === "") aStr = "1";
  if (aStr === "-") aStr = "-1";
  if (bStr === "+" || bStr === "" || !match[2]) bStr = "0";
  if (bStr === "-") bStr = "-1";
  if (cStr === "+" || cStr === "" || !match[3]) cStr = "0";
  if (cStr === "-") cStr = "-1";
  
  const a = parseFloat(aStr);
  const b = parseFloat(bStr);
  const c = parseFloat(cStr);
  
  // Validação: verifica se o parsing foi bem-sucedido
  if (isNaN(a) || isNaN(b) || isNaN(c)) {
    alert("Erro ao processar a função. Verifique o formato: ax² + bx + c");
    console.error("Erro no parsing:", { parsed, match, aStr, bStr, cStr, a, b, c });
    return;
  }

  // Verifica se a é zero (não é quadrática)
  if (a === 0) {
    alert("Coeficiente 'a' não pode ser zero para uma função quadrática.");
    return;
  }

  // Ponto de tangência
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

  // Calcula o vértice primeiro para centralizar o gráfico
  const xv = -b / (2 * a);
  const yv = f(a, b, c, xv);
  
  // Calcula as raízes para determinar o range adequado
  const delta = b * b - 4 * a * c;
  let raiz1Val, raiz2Val;
  
  if (delta > 0) {
    raiz1Val = (-b + Math.sqrt(delta)) / (2 * a);
    raiz2Val = (-b - Math.sqrt(delta)) / (2 * a);
  } else if (delta === 0) {
    raiz1Val = -b / (2 * a);
    raiz2Val = raiz1Val;
  }
  
  // Calcula um range X dinâmico baseado no vértice e características da parábola
  // Para deixar a parábola mais "fechada", usa um range menor e mais inteligente
  let rangeX;
  
  // Calcula a "abertura" da parábola baseada no coeficiente a
  // Parábolas com |a| maior são mais "fechadas", com |a| menor são mais "abertas"
  const absA = Math.abs(a);
  const baseRange = Math.max(10 / Math.sqrt(absA), 4); // Range base inversamente proporcional a |a|
  
  if (delta >= 0 && raiz1Val !== undefined && raiz2Val !== undefined) {
    // Se há raízes, usa a distância entre elas como referência
    const distRaizes = Math.abs(raiz1Val - raiz2Val);
    if (distRaizes > 0.1) {
      // Range é aproximadamente a distância entre as raízes + margem
      rangeX = Math.max(distRaizes * 0.6, baseRange * 0.7);
    } else {
      // Raízes muito próximas (raiz dupla) - usa range base
      rangeX = baseRange;
    }
  } else {
    // Se não há raízes reais, usa range base ajustado pela posição do vértice
    // Se o vértice está perto da origem, usa range menor
    if (Math.abs(xv) < 5) {
      rangeX = baseRange;
    } else {
      // Vértice longe da origem - range proporcional mas limitado
      rangeX = Math.min(baseRange * 1.2, Math.abs(xv) * 0.4 + 4);
    }
  }
  
  // Limita o range para manter a parábola "fechada" mas visível
  rangeX = Math.min(rangeX, 12);  // Máximo reduzido de 15 para 12
  rangeX = Math.max(rangeX, 4);   // Mínimo de 4 para garantir visualização
  
  // Centraliza o range em torno do vértice (sempre perfeitamente simétrico)
  // Isso garante que ambos os lados da parábola apareçam igualmente
  // O range é sempre simétrico: vértice no centro, mesma distância para cada lado
  const minX = xv - rangeX;
  const maxX = xv + rangeX;
  
  // Gera pontos do gráfico com range mais fechado
  const xs = [];
  const ys = [];
  const step = 0.05; // Step menor para suavidade
  for (let x = minX; x <= maxX; x += step) {
    xs.push(x);
    ys.push(f(a, b, c, x));
  }

  // Calcula o range dinâmico do eixo Y garantindo simetria perfeita
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  // Para parábolas: calcula a distância máxima do vértice em qualquer direção
  // Quando a > 0: vértice é mínimo, então distância é maxY - yv
  // Quando a < 0: vértice é máximo, então distância é yv - minY
  const distAbove = maxY - yv;  // Distância acima do vértice (sempre positiva ou zero)
  const distBelow = yv - minY;  // Distância abaixo do vértice (sempre positiva ou zero)
  
  // Usa a maior distância para criar simetria perfeita
  const maxDist = Math.max(distAbove, distBelow);
  
  // Se a distância for muito pequena (parábola quase plana), usa um valor mínimo
  const effectiveDist = Math.max(maxDist, 2);
  
  // Adiciona padding (8% da distância) para deixar mais "fechado" e visualmente agradável
  const padding = Math.max(effectiveDist * 0.08, 0.5);
  
  // Cria range perfeitamente simétrico em torno do vértice
  // Sempre usa a mesma distância acima e abaixo do vértice
  let yMin = yv - effectiveDist - padding;
  let yMax = yv + effectiveDist + padding;
  
  // Garante um range mínimo para visualização (mantém simetria perfeita)
  if (yMax - yMin < 4) {
    const halfRange = 2;
    yMin = yv - halfRange;
    yMax = yv + halfRange;
  }
  
  // Garantia final de simetria perfeita: sempre centraliza exatamente no vértice
  // Isso garante que ambos os lados da parábola tenham exatamente a mesma altura
  const finalRange = yMax - yMin;
  yMin = yv - finalRange / 2;
  yMax = yv + finalRange / 2;

  // Formata as raízes para exibição
  let raiz1 = "Nenhuma raiz real";
  let raiz2 = "";

  if (delta > 0) {
    raiz1 = raiz1Val.toFixed(4);
    raiz2 = raiz2Val.toFixed(4);
  } else if (delta === 0 && raiz1Val !== undefined) {
    raiz1 = raiz1Val.toFixed(4);
    raiz2 = " (raiz dupla)";
  }

  // Concavidade
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

  // Derivada e reta tangente
  let derivStr = `y' = ${2 * a}x`;
  if (b > 0) derivStr += ` + ${b}`;
  else if (b < 0) derivStr += ` ${b}`;
  // Se b=0, nada adiciona

  const m = derivative(a, b, x0);
  const bTangent = y0 - m * x0;
  let tangentStr = `y = ${m.toFixed(4)}x`;
  if (bTangent > 0) tangentStr += ` + ${bTangent.toFixed(4)}`;
  else if (bTangent < 0) tangentStr += ` ${bTangent.toFixed(4)}`;
  // Se bTangent=0, nada adiciona

  // Pontos da reta tangente
  const tangentXs = [minX, maxX];
  const tangentYs = tangentXs.map(x => m * x + bTangent);

  // Atualiza resultados na interface
  document.getElementById("roots").innerText = `Raízes: ${raiz1}${raiz2 ? ' e ' + raiz2 : ''}`;
  document.getElementById("vertex").innerText = `Vértice: (${xv.toFixed(4)}, ${yv.toFixed(4)})`;
  document.getElementById("concavity").innerHTML = `${concavityText}<br><small>${concavityReason}</small>`;
  document.getElementById("derivative").innerText = `Derivada: ${derivStr}`;
  document.getElementById("tangent").innerText = `Reta Tangente em x=${x0}: ${tangentStr}`;

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

// Inicializa o gráfico ao carregar a página com os valores padrão
document.addEventListener("DOMContentLoaded", function() {
  plotFunction();
});
