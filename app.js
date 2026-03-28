let menuData = {};
let questions = [];
let index = 0;
let correct = 0;
let total = 0;
let currentGroup = "";
let currentQuizTitle = "";

const params = new URLSearchParams(location.search);
const group = params.get("group");

if (!group) {
  document.body.innerHTML = `
    <div class="container">
      <div class="error-card">
        <h2>グループ指定がありません。</h2>
        <p><a href="index.html">トップへ戻る</a></p>
      </div>
    </div>
  `;
  throw new Error("group parameter is missing.");
}

currentGroup = group;

const groupTitleEl = document.getElementById("groupTitle");
if (groupTitleEl) {
  groupTitleEl.textContent = currentGroup;
}

const groupJsonPath = `./${group}.json`;

fetch(groupJsonPath)
  .then(res => {
    if (!res.ok) {
      throw new Error(`JSON読込失敗: ${res.status} ${res.statusText}`);
    }
    return res.json();
  })
  .then(data => {
    menuData = data;
    initMenu();
  })
  .catch(err => {
    console.error(err);
    document.body.innerHTML = `
      <div class="container">
        <div class="error-card">
          <h2>読込エラー</h2>
          <p>${escapeHtml(err.message)}</p>
          <p>読込先: ${escapeHtml(groupJsonPath)}</p>
          <p><a href="index.html">戻る</a></p>
        </div>
      </div>
    `;
  });

function initMenu() {
  const menu = document.getElementById("menu");
  if (!menu) {
    throw new Error("app.html に id='menu' がありません。");
  }

  const quizzes = Array.isArray(menuData.quizzes) ? menuData.quizzes : [];

  if (quizzes.length === 0) {
    menu.innerHTML = "<p>この分類には問題がありません。</p>";
    return;
  }

  let html = `<h2 class="menu-title">${escapeHtml(menuData.menu_name || currentGroup)}</h2>`;
  html += `<p class="subtext">テーマを選択してください</p>`;
  menu.innerHTML = html;

  quizzes.forEach(quiz => {
    const btn = document.createElement("button");
    btn.className = "card-btn";

    const title = quiz.title || quiz.file_stem || "無題";
    const count = Number.isFinite(quiz.question_count) ? quiz.question_count : 0;

    btn.textContent = `${title} (${count}問)`;
    btn.onclick = () => loadQuizFile(quiz);
    menu.appendChild(btn);
  });
}

function loadQuizFile(quiz) {
  if (!quiz || !quiz.relative_path) {
    alert("クイズファイル情報が不足しています。");
    return;
  }

  currentQuizTitle = quiz.title || quiz.file_stem || "";

  fetch(`./${quiz.relative_path}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`クイズJSON読込失敗: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      questions = normalizeQuestions(data);

      if (!questions.length) {
        throw new Error("問題データが0件です。");
      }

      shuffleArray(questions);

      index = 0;
      correct = 0;
      total = 0;

      const menuEl = document.getElementById("menu");
      const quizEl = document.getElementById("quiz");

      if (menuEl) menuEl.classList.add("hidden");
      if (quizEl) quizEl.classList.remove("hidden");

      const titleEl = document.getElementById("groupTitle");
      if (titleEl) {
        titleEl.textContent = `${menuData.menu_name || currentGroup} / ${currentQuizTitle}`;
      }

      setText("stats", "今回の成績: 0% (0/0)");
      loadQuestion();
    })
    .catch(err => {
      console.error(err);
      alert(`読込エラー\n${err.message}\n\n対象: ${quiz.relative_path}`);
    });
}

function normalizeQuestions(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.questions)) return data.questions;
  if (Array.isArray(data.quizzes)) return data.quizzes;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function loadQuestion() {
  const q = questions[index];
  if (!q) {
    throw new Error("問題データが見つかりません。");
  }

  setText("counter", `${index + 1} / ${questions.length}`);
  setText("type", `【${q.type || q.format || "問題"}】`);
  setText("question", q.question || q.quiz || q.title || "");

  const answerText = q.answer || q.correct_answer || "";
  const explanationText = q.explanation || q.commentary || q.note || "";

  const answerHtml =
    `<b>解答</b><br>${escapeHtml(answerText).replace(/\n/g, "<br>")}` +
    `<br><br><b>解説</b><br>${escapeHtml(explanationText).replace(/\n/g, "<br>")}`;

  setHTML("answer", answerHtml);

  document.getElementById("answer").classList.add("hidden");
  document.getElementById("judge").classList.add("hidden");
  document.getElementById("nextBtn").classList.add("hidden");
  document.getElementById("showAnswerBtn").classList.remove("hidden");
}

function showAnswer() {
  document.getElementById("answer").classList.remove("hidden");
  document.getElementById("judge").classList.remove("hidden");
  document.getElementById("showAnswerBtn").classList.add("hidden");
}

function mark(ok) {
  total++;
  if (ok) correct++;

  const rate = Math.round((correct / total) * 100);
  setText("stats", `今回の成績: ${rate}% (${correct}/${total})`);

  document.getElementById("judge").classList.add("hidden");
  document.getElementById("nextBtn").classList.remove("hidden");
}

function nextQuestion() {
  index++;

  if (index >= questions.length) {
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    alert(`全問終了しました\n正解率: ${rate}% (${correct}/${total})`);

    document.getElementById("quiz").classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");

    const titleEl = document.getElementById("groupTitle");
    if (titleEl) {
      titleEl.textContent = menuData.menu_name || currentGroup;
    }
    return;
  }

  loadQuestion();
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`app.html に id='${id}' がありません。`);
  el.textContent = text;
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`app.html に id='${id}' がありません。`);
  el.innerHTML = html;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}