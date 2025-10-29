const els = {
  startBtn: document.getElementById('startBtn'),
  resetBtn: document.getElementById('resetBtn'),
  checkBtn: document.getElementById('checkBtn'),
  nextBtn: document.getElementById('nextBtn'),
  answerInput: document.getElementById('answerInput'),
  kanaChar: document.getElementById('kanaChar'),
  feedback: document.getElementById('feedback'),
  modeDisplay: document.getElementById('modeDisplay'),
  progressDisplay: document.getElementById('progressDisplay'),
  resultModal: document.getElementById('resultModal'),
  resultText: document.getElementById('resultText'),
  closeModalBtn: document.getElementById('closeModalBtn'),
};

let locked = false; // avoid double submits

function getSelectedMode() {
  const checked = document.querySelector('input[name="mode"]:checked');
  return checked ? checked.value : 'random';
}

async function startGame() {
  const mode = getSelectedMode();
  await fetch('/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  els.feedback.textContent = '';
  els.feedback.className = 'feedback';
  els.answerInput.value = '';
  els.answerInput.focus();
  await loadQuestion();
}

async function resetGame() {
  const mode = getSelectedMode();
  await fetch('/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  els.feedback.textContent = '';
  els.feedback.className = 'feedback';
  els.answerInput.value = '';
  els.kanaChar.textContent = '?';
  els.modeDisplay.textContent = '모드: -';
  els.progressDisplay.textContent = '문제: - / 10';
}

async function loadQuestion() {
  const res = await fetch('/get_question');
  const data = await res.json();
  if (data.done) {
    showResult(data.score, data.total, data.accuracy);
    return;
  }
  els.kanaChar.textContent = data.kana;
  els.modeDisplay.textContent = `모드: ${translateMode(data.mode)}`;
  els.progressDisplay.textContent = `문제: ${data.questionNumber} / ${data.total}`;
}

function translateMode(mode) {
  if (mode === 'hiragana') return '히라가나';
  if (mode === 'katakana') return '가타카나';
  return '랜덤';
}

async function checkAnswer() {
  if (locked) return; // prevent spamming
  locked = true;
  try {
    const answer = els.answerInput.value.trim();
    if (!answer) {
      els.feedback.textContent = '답을 입력하세요.';
      els.feedback.className = 'feedback';
      return;
    }
    const res = await fetch('/check_answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    });
    const data = await res.json();
    if (data.correct) {
      els.feedback.textContent = '정답!';
      els.feedback.className = 'feedback correct';
    } else {
      els.feedback.textContent = `오답. 정답: ${data.correctAnswer}`;
      els.feedback.className = 'feedback wrong';
    }
    els.answerInput.value = '';

    if (data.done) {
      showResult(data.score, data.total, data.accuracy);
    } else {
      // Automatically load next question after a short delay
      setTimeout(loadQuestion, 600);
      els.progressDisplay.textContent = `문제: ${data.questionNumber} / ${data.total}`;
    }
  } finally {
    locked = false;
  }
}

function showResult(score, total, accuracy) {
  els.resultText.textContent = `점수: ${score} / ${total} (정확도 ${accuracy}%)`;
  els.resultModal.classList.remove('hidden');
}

function closeModal() {
  els.resultModal.classList.add('hidden');
}

async function nextQuestion() {
  els.feedback.textContent = '';
  els.feedback.className = 'feedback';
  els.answerInput.value = '';
  await loadQuestion();
  els.answerInput.focus();
}

// Wire events
els.startBtn.addEventListener('click', startGame);
els.resetBtn.addEventListener('click', resetGame);
els.checkBtn.addEventListener('click', checkAnswer);
els.nextBtn.addEventListener('click', nextQuestion);
els.closeModalBtn.addEventListener('click', closeModal);


