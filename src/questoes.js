// Módulo: questoes.js — Gerencia questões aleatórias sobre equações do segundo grau

// Formata número: remove zeros desnecessários
function fmt(num) {
  if (num === null || num === undefined || !isFinite(num)) return "-";
  const str = parseFloat(num.toFixed(2)).toString();
  return str.replace(/\.?0+$/, "");
}

// Gera uma função quadrática aleatória
function generateRandomFunction() {
  // Gera coeficientes entre -5 e 5, mas a não pode ser 0
  const a = Math.floor(Math.random() * 10) - 4; // -4 a 5, mas vamos garantir que não seja 0
  const finalA = a === 0 ? 1 : a;
  const b = Math.floor(Math.random() * 11) - 5; // -5 a 5
  const c = Math.floor(Math.random() * 11) - 5; // -5 a 5
  
  return { a: finalA, b, c };
}

// Calcula as raízes de uma função quadrática
function calculateRoots(a, b, c) {
  const delta = b * b - 4 * a * c;
  if (delta < 0) return null;
  if (delta === 0) {
    const root = -b / (2 * a);
    return { type: 'double', root1: root, root2: root };
  }
  const root1 = (-b + Math.sqrt(delta)) / (2 * a);
  const root2 = (-b - Math.sqrt(delta)) / (2 * a);
  return { type: 'distinct', root1, root2 };
}

// Calcula o vértice
function calculateVertex(a, b, c) {
  const xv = -b / (2 * a);
  const yv = a * xv * xv + b * xv + c;
  return { xv, yv };
}

// Calcula a derivada
function calculateDerivative(a, b) {
  let formula = '';
  if (2 * a === 1) formula = 'x';
  else if (2 * a === -1) formula = '-x';
  else formula = `${2 * a}x`;
  
  if (b !== 0) {
    if (b > 0) formula += ` + ${b}`;
    else formula += ` ${b}`;
  }
  
  return { formula: `f'(x) = ${formula}` };
}

// Calcula a reta tangente em um ponto
function calculateTangent(a, b, c, x0) {
  const y0 = a * x0 * x0 + b * x0 + c;
  const m = 2 * a * x0 + b;
  const bTangent = y0 - m * x0;
  return { m, bTangent, equation: `y = ${fmt(m)}x${bTangent >= 0 ? ' + ' : ' '}${fmt(bTangent)}` };
}

// Tipos de questões
const questionTypes = [
  'roots',
  'vertex-x',
  'concavity',
  'derivative',
  'tangent'
];

// Gera uma questão aleatória
export function generateQuestion() {
  const { a, b, c } = generateRandomFunction();
  const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
  
  let question = {
    type,
    a,
    b,
    c,
    questionText: '',
    correctAnswer: '',
    functionText: ''
  };
  
  // Formata a função para exibição
  let funcStr = '';
  if (a === 1) funcStr = 'x²';
  else if (a === -1) funcStr = '-x²';
  else funcStr = `${a}x²`;
  
  if (b !== 0) {
    if (b > 0) funcStr += ` + ${b === 1 ? '' : b}x`;
    else funcStr += ` ${b === -1 ? '-' : b}x`;
  }
  
  if (c !== 0) {
    if (c > 0) funcStr += ` + ${c}`;
    else funcStr += ` ${c}`;
  }
  
  question.functionText = `f(x) = ${funcStr}`;
  
  // Gera a questão baseada no tipo
  switch (type) {
    case 'roots': {
      const roots = calculateRoots(a, b, c);
      if (!roots) {
        question.questionText = 'Quantas raízes reais a função possui? (Digite apenas o número)';
        question.correctAnswer = '0';
      } else if (roots.type === 'double') {
        question.questionText = 'Qual é o valor da raiz (ou raiz dupla) da função?';
        question.correctAnswer = fmt(roots.root1);
      } else {
        // Pergunta por uma das raízes aleatoriamente
        const askRoot1 = Math.random() > 0.5;
        question.questionText = askRoot1 
          ? 'Qual é o valor da primeira raiz (x₁) da função?'
          : 'Qual é o valor da segunda raiz (x₂) da função?';
        question.correctAnswer = askRoot1 ? fmt(roots.root1) : fmt(roots.root2);
      }
      break;
    }
    
    case 'vertex-x': {
      const { xv } = calculateVertex(a, b, c);
      question.questionText = 'Qual é o valor de x do vértice (xᵥ) da parábola?';
      question.correctAnswer = fmt(xv);
      break;
    }
    
    case 'concavity': {
      question.questionText = 'Qual é a concavidade da parábola? (Digite "cima" ou "baixo")';
      question.correctAnswer = a > 0 ? 'cima' : 'baixo';
      break;
    }
    
    case 'derivative': {
      const deriv = calculateDerivative(a, b);
      question.questionText = 'Qual é a derivada da função? (Digite no formato: f\'(x) = ... ou apenas a expressão)';
      // Armazena tanto a versão formatada quanto a normalizada para exibição
      question.correctAnswer = deriv.formula;
      question.correctAnswerNormalized = normalizeExpression(deriv.formula);
      break;
    }
    
    case 'tangent': {
      // Gera um ponto x0 aleatório entre -5 e 5
      const x0 = Math.floor(Math.random() * 11) - 5;
      const tangent = calculateTangent(a, b, c, x0);
      question.questionText = `Qual é a equação da reta tangente à função no ponto x = ${x0}? (Digite no formato: y = ... ou apenas a expressão)`;
      // Armazena tanto a versão formatada quanto a normalizada para exibição
      question.correctAnswer = tangent.equation;
      question.correctAnswerNormalized = normalizeExpression(tangent.equation);
      question.x0 = x0;
      break;
    }
  }
  
  return question;
}
function normalizeNumber(expr) {
  if (expr === null || expr === undefined) return "";
  const s = String(expr).trim();
  if (s === '') return '';

  return s
    .replace(/,/g, '.')  // troca vírgulas por pontos
    .replace(/\s+/g, '') // remove espaços internos para comparar expressões

}
// Normaliza uma expressão matemática para comparação
function normalizeExpression(expr) {
  return expr
    .trim()
    .replace(/,/g, '.') // aceita vírgula como separador decimal
    .toLowerCase()
    .replace(/\s+/g, '') // Remove todos os espaços
    .replace(/f'\(x\)\s*=\s*/g, '') // Remove f'(x) =
    .replace(/y\s*=\s*/g, '') // Remove y =
    .replace(/\+\s*0/g, '') // Remove + 0
    .replace(/0\s*\+/g, '') // Remove 0 +
    .replace(/^\+/, '') // Remove + no início
    .replace(/([+-])\s*\+/g, '$1') // Remove espaços antes de +
    .replace(/([+-])\s*-/g, (m, s) => s === '+' ? '-' : '+'); // Simplifica sinais
}

// Formata uma resposta para exibição: troca pontos decimais por vírgulas
function formatAnswerForDisplay(answer) {
  if (answer === null || answer === undefined) return '';
  // Se for um número, formata com fmt e troca ponto por vírgula
  if (typeof answer === 'number') {
    return fmt(answer).replace(/\./g, ',');
  }

  // Se for string, procura números com ponto decimal e troca o ponto por vírgula
  if (typeof answer === 'string') {
    // Substitui ocorrências como 0.5 ou -3.25 por 0,5 e -3,25
    return answer.replace(/-?\d+\.\d+/g, (m) => m.replace(/\./g, ','));
  }

  // Fallback: converte para string e troca pontos por vírgulas apenas dentro de números
  const s = String(answer);
  return s.replace(/-?\d+\.\d+/g, (m) => m.replace(/\./g, ','));
}

// Valida a resposta do usuário
export function validateAnswer(userAnswer, correctAnswer, questionType) {
  // Remove espaços extras e converte para minúsculas
  const normalizedUser = String(userAnswer).trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedCorrect = String(correctAnswer).trim().toLowerCase().replace(/\s+/g, ' ');
  
  // Para respostas numéricas, compara valores
  if (questionType === 'roots' || questionType === 'vertex-x') {
    // Aceita vírgula como separador decimal: normaliza antes de parseFloat
    const userNum = parseFloat(normalizeNumber(normalizedUser));
    const correctNum = parseFloat(normalizeNumber(normalizedCorrect));

    if (!isNaN(userNum) && !isNaN(correctNum)) {
      // Tolerância para comparação de números decimais
      return Math.abs(userNum - correctNum) < 0.0001;
    }
  }
  
  // Para concavidade, compara diretamente
  if (questionType === 'concavity') {
    const user = normalizedUser.replace(/\s+/g, '');
    const correct = normalizedCorrect.replace(/\s+/g, '');
    return user === correct;
  }
  
  // Para derivadas e retas tangentes, normaliza expressões matemáticas
  if (questionType === 'derivative' || questionType === 'tangent') {
    const userNorm = normalizeExpression(userAnswer);
    const correctNorm = normalizeExpression(correctAnswer);
    
    // Tenta comparar como expressões matemáticas
    // Primeiro, compara strings normalizadas
    if (userNorm === correctNorm) return true;
    
    // Se não bater exatamente, tenta extrair os coeficientes e comparar
    // Para derivada: formato esperado é algo como "2x + 3" ou "2x-3"
    // Para tangente: formato esperado é algo como "y = 2x + 3" ou "2x + 3"
    
    // Extrai coeficientes do formato ax + b ou ax - b
    const extractCoeffs = (expr) => {
      // Remove qualquer coisa antes de x (como "f'(x) = " ou "y = ")
      const cleanExpr = expr.replace(/^[^x]*/, '');
      const xMatch = cleanExpr.match(/([+-]?\d*\.?\d*)x/);
      // Procura por constantes que não sejam parte de um coeficiente de x
      const constMatch = cleanExpr.match(/(?:^|[+-])(\d+\.?\d*)(?!x)/);
      const a = xMatch ? (xMatch[1] === '' || xMatch[1] === '+' ? 1 : xMatch[1] === '-' ? -1 : parseFloat(xMatch[1])) : 0;
      // Para b, precisa considerar o sinal antes do número
      let b = 0;
      if (constMatch) {
        // Procura o sinal antes do número
        const beforeConst = cleanExpr.substring(0, cleanExpr.indexOf(constMatch[1]));
        const sign = beforeConst.match(/([+-])$/);
        b = sign && sign[1] === '-' ? -parseFloat(constMatch[1]) : parseFloat(constMatch[1]);
      }
      return { a, b };
    };
    
    try {
      const userCoeffs = extractCoeffs(userNorm);
      const correctCoeffs = extractCoeffs(correctNorm);
      
      // Compara coeficientes com tolerância
      return Math.abs(userCoeffs.a - correctCoeffs.a) < 0.0001 &&
             Math.abs(userCoeffs.b - correctCoeffs.b) < 0.0001;
    } catch (e) {
      // Se houver erro na extração, compara strings
      return userNorm === correctNorm;
    }
  }
  
  // Para respostas de texto, compara strings normalizadas
  return normalizedUser === normalizedCorrect;
}

// Inicializa o sistema de questões
export function initQuestions() {
  let currentQuestion = null;
  let attempts = 0;
  let maxAttempts = 3;
  
  const questionTextEl = document.getElementById('question-text');
  const questionFunctionEl = document.getElementById('question-function');
  const answerInputEl = document.getElementById('answer-input');
  const submitBtn = document.getElementById('submit-answer');
  const feedbackEl = document.getElementById('answer-feedback');
  const nextBtn = document.getElementById('next-question');
  const attemptsInfoEl = document.getElementById('attempts-info');
  
  // Função para carregar uma nova questão
  function loadQuestion() {
    currentQuestion = generateQuestion();
    attempts = 0;
    if (currentQuestion.type === "concavity") {
      maxAttempts = 1;  // só 1 tentativa
    } else {
      maxAttempts = 3;  // padrão para as outras
    }
    
    questionTextEl.textContent = currentQuestion.questionText;
    questionFunctionEl.textContent = currentQuestion.functionText;
    answerInputEl.value = '';
    answerInputEl.disabled = false;
    submitBtn.disabled = false;
    submitBtn.style.display = 'block';
    feedbackEl.style.display = 'none';
    nextBtn.style.display = 'none';
    attemptsInfoEl.textContent = '';
    
    // Foca no campo de resposta
    answerInputEl.focus();
  }

  // Garante que uma questão esteja carregada quando o modal abre
  function ensureQuestionLoaded() {
    if (!currentQuestion) {
      loadQuestion();
    } else {
      // Mantém a questão atual e só garante o foco para continuidade
      answerInputEl.focus();
    }
  }
  
  // Função para verificar a resposta
  function checkAnswer() {
    const userAnswer = answerInputEl.value.trim();
    
    if (!userAnswer) {
      feedbackEl.textContent = 'Por favor, digite uma resposta.';
      feedbackEl.style.display = 'block';
      feedbackEl.style.backgroundColor = '#fff3cd';
      feedbackEl.style.color = '#856404';
      feedbackEl.style.border = '2px solid #ffc107';
      return;
    }
    
    const isCorrect = validateAnswer(userAnswer, currentQuestion.correctAnswer, currentQuestion.type);
    
    attempts++;
    
    if (isCorrect) {
      feedbackEl.textContent = 'Resposta correta!';
      feedbackEl.style.display = 'block';
      feedbackEl.style.backgroundColor = '#d4edda';
      feedbackEl.style.color = '#155724';
      feedbackEl.style.border = '2px solid #28a745';
      answerInputEl.disabled = true;
      submitBtn.style.display = 'none';
      nextBtn.style.display = 'block';
      attemptsInfoEl.textContent = '';
    } else {
      if (attempts >= maxAttempts) {
        feedbackEl.innerHTML = `Resposta incorreta.<br><br><strong>Resposta correta:</strong> ${formatAnswerForDisplay(currentQuestion.correctAnswer)}`;
        feedbackEl.style.display = 'block';
        feedbackEl.style.backgroundColor = '#f8d7da';
        feedbackEl.style.color = '#721c24';
        feedbackEl.style.border = '2px solid #dc3545';
        answerInputEl.disabled = true;
        submitBtn.style.display = 'none';
        nextBtn.style.display = 'block';
        attemptsInfoEl.textContent = '';
      } else {
        feedbackEl.textContent = 'Resposta incorreta. Tente novamente.';
        feedbackEl.style.display = 'block';
        feedbackEl.style.backgroundColor = '#f8d7da';
        feedbackEl.style.color = '#721c24';
        feedbackEl.style.border = '2px solid #dc3545';
        attemptsInfoEl.textContent = `Tentativas restantes: ${maxAttempts - attempts}`;
        answerInputEl.focus();
        answerInputEl.select();
      }
    }
  }
  
  // Event listeners
  submitBtn.addEventListener('click', checkAnswer);
  
  answerInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !submitBtn.disabled) {
      checkAnswer();
    }
  });
  
  nextBtn.addEventListener('click', () => {
    loadQuestion();
  });
  
  // Carrega a primeira questão quando o modal é aberto
  const questionsModal = document.getElementById('modal-questions');
  if (questionsModal) {
    // Observa quando o modal é aberto
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (questionsModal.classList.contains('active')) {
            ensureQuestionLoaded();
          } else {
            // Mantém a questão atual quando o modal é fechado
            // (não redefinimos currentQuestion para preservar o estado)
          }
        }
      });
    });
    
    observer.observe(questionsModal, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
}

