let db = {};
let questions = [];
let index = 0;
let correct = 0;
let total = 0;
let currentCategory = "";
let currentGroup = "";

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
document.getElementById("groupTitle").textContent = currentGroup;

const jsonPath = `./data/${group}.json`;

fetch(jsonPath)
  .then(res => {
    if (!res.ok) {
      throw new Error(`JSON読込失敗: ${res.status} ${res.statusText}`);
    }
    return res.json();
  })
  .then(data => {
    db = data;
    initMenu();
  })
  .catch(err => {
    console.error(err);
    document.body.innerHTML = `
      <div class="container">
        <div class="error-card">
          <h2>読込エラー</h2>
          <p>${escapeHtml(err.message)}</p>
          <p>読込先: ${escapeHtml(jsonPath)}</p>
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

  const categories = Object.keys(db);

  if (categories.length === 0) {
    menu.innerHTML = "<p>この分類には問題がありません。</p>";
    return;
  }

  let html = `<h2 class="menu-title">${escapeHtml(currentGroup)}</h2>`;
  html += `<p class="subtext">テーマを選択してください</p>`;
  menu.innerHTML = html;

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "card-btn";
    btn.textContent = `${cat} (${db[cat].length}問)`;
    btn.onclick = () => startQuiz(cat);
    menu.appendChild(btn);
  });
}

function startQuiz(category) {
  currentCategory = category;
  questions = [...db[category]];

  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  index = 0;
  correct = 0;
  total = 0;

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("quiz").classList.remove("hidden");

  loadQuestion();
}

function loadQuestion() {
  const q = questions[index];
  if (!q) {
    throw new Error("問題データが見つかりません。");
  }

  setText("counter", `${index + 1} / ${questions.length}`);
  setText("type", `【${q.type || "問題"}】`);
  setText("question", q.question || "");

  const answerHtml =
    `<b>解答</b><br>${escapeHtml(q.answer || "").replace(/\n/g, "<br>")}` +
    `<br><br><b>解説</b><br>${escapeHtml(q.explanation || "").replace(/\n/g, "<br>")}`;

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
    location.href = "app.html?group=" + encodeURIComponent(currentGroup);
    return;
  }
  loadQuestion();
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