/* =========================
   Helpers
========================= */
function isoToday(){ return new Date().toISOString().split("T")[0]; }
function escapeHtml(str){
  return (str || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

/* =========================
   Night mode
========================= */
function applyThemeFromStorage(){
  const saved = localStorage.getItem("enigmaTheme"); // "night" | "day" | null
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useNight = saved ? (saved === "night") : prefersDark;
  document.body.classList.toggle("night", useNight);
  updateThemeIcon();
}

function toggleTheme(){
  const isNight = document.body.classList.toggle("night");
  localStorage.setItem("enigmaTheme", isNight ? "night" : "day");
  updateThemeIcon();
}

function updateThemeIcon(){
  const btn = document.getElementById("themeFab");
  if (!btn) return;
  btn.textContent = document.body.classList.contains("night") ? "☀️" : "🌙";
}

/* =========================
   Breathe (sync wording to animation)
========================= */
let __breathTimers = [];
function clearBreathTimers(){
  __breathTimers.forEach(t => clearTimeout(t));
  __breathTimers = [];
}
function setBreathText(text){
  const el = document.getElementById("breathText");
  if (el) el.textContent = text;
}
function startBreathingSynced(){
  const circle = document.querySelector(".breathe-circle");
  const textEl = document.getElementById("breathText");
  if (!circle || !textEl) return;

  function scheduleCycle(){
    clearBreathTimers();
    setBreathText("Inhale");
    __breathTimers.push(setTimeout(() => setBreathText("Hold"), 4000));
    __breathTimers.push(setTimeout(() => setBreathText("Exhale"), 6000));
  }

  scheduleCycle();
  circle.addEventListener("animationiteration", scheduleCycle);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) scheduleCycle();
  });
}

function completeBreathe(){
  localStorage.setItem("enigmaBreatheDone", isoToday());
  alert("Well done 🌬️ Take that calm with you.");
}

/* =========================
   Quotes: select/deselect (toggle) + saved list
========================= */
function getSavedQuotes(){
  return JSON.parse(localStorage.getItem("enigmaSavedQuotes") || "[]");
}
function setSavedQuotes(arr){
  localStorage.setItem("enigmaSavedQuotes", JSON.stringify(arr));
}

function toggleQuote(tile){
  const text = tile.getAttribute("data-quote");
  const author = tile.getAttribute("data-author");
  const item = `${text} — ${author}`;

  let saved = getSavedQuotes();
  if (saved.includes(item)){
    saved = saved.filter(x => x !== item);
    setSavedQuotes(saved);
    tile.classList.remove("saved");
  } else {
    saved.push(item);
    setSavedQuotes(saved);
    tile.classList.add("saved");
  }
}

function deleteSavedQuote(item){
  let saved = getSavedQuotes();
  saved = saved.filter(x => x !== item);
  setSavedQuotes(saved);
  renderSavedQuotes();
}

function clearAllSavedQuotes(){
  if (!confirm("Clear all saved quotes?")) return;
  setSavedQuotes([]);
  renderSavedQuotes();
}

function renderSavedQuotes(){
  const list = document.getElementById("savedQuotesList");
  if (!list) return;

  const items = getSavedQuotes();
  list.innerHTML = "";

  if (items.length === 0){
    const div = document.createElement("div");
    div.className = "card";
    div.textContent = "No saved quotes yet 💜";
    list.appendChild(div);
    return;
  }

  const top = document.createElement("div");
  top.className = "card";
  top.innerHTML = `
    <div style="font-weight:800; color:#5a4b7a;">Saved quotes</div>
    <div style="height:10px;"></div>
    <button class="primary" style="background:#f4c2c2; color:#5a4b7a;" onclick="clearAllSavedQuotes()">Clear all</button>
  `;
  list.appendChild(top);

  items.forEach(q => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div style="white-space:pre-wrap;">${escapeHtml(q)}</div>
      <div style="height:10px;"></div>
      <button class="primary" style="background:#ffeaa6; color:#5a4b7a;" onclick='deleteSavedQuote(${JSON.stringify(q)})'>Delete</button>
    `;
    list.appendChild(div);
  });
}

/* =========================
   Journal
========================= */
function getJournalEntries(){
  return JSON.parse(localStorage.getItem("enigmaJournalEntries") || "[]");
}

function saveJournalEntry(){
  const textEl = document.getElementById("journalText");
  const msgEl = document.getElementById("journalMsg");
  if (!textEl) return;

  const text = textEl.value.trim();
  if (!text){
    if (msgEl) msgEl.textContent = "Write a little first 💜";
    return;
  }

  const entries = getJournalEntries();
  entries.unshift({ date: new Date().toLocaleString(), text });

  localStorage.setItem("enigmaJournalEntries", JSON.stringify(entries));
  textEl.value = "";
  if (msgEl) msgEl.textContent = "Saved ✨";
  renderJournal();
}

function deleteJournalEntry(index){
  const entries = getJournalEntries();
  entries.splice(index, 1);
  localStorage.setItem("enigmaJournalEntries", JSON.stringify(entries));
  renderJournal();
}

function renderJournal(){
  const list = document.getElementById("journalList");
  if (!list) return;

  const entries = getJournalEntries();
  list.innerHTML = "";

  if (entries.length === 0){
    const empty = document.createElement("div");
    empty.className = "card";
    empty.textContent = "No entries yet. Your words are safe here 💜";
    list.appendChild(empty);
    return;
  }

  entries.forEach((e, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div style="font-weight:800; margin-bottom:8px; color:#5a4b7a;">${escapeHtml(e.date)}</div>
      <div style="white-space:pre-wrap;">${escapeHtml(e.text)}</div>
      <div style="height:10px;"></div>
      <button class="primary" style="background:#f4c2c2; color:#5a4b7a;" onclick="deleteJournalEntry(${i})">Delete</button>
    `;
    list.appendChild(card);
  });
}

/* =========================
   Check-in + streak
========================= */
function pickMood(btn, mood){
  window.__enigmaMood = mood;
  document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function saveCheckin(){
  const mood = window.__enigmaMood || "";
  const note = document.getElementById("checkinNote")?.value || "";
  if (!mood){ alert("Please choose how you're feeling 💜"); return; }

  const today = isoToday();
  const lastDate = localStorage.getItem("enigmaLastCheckinDate");
  let streak = parseInt(localStorage.getItem("enigmaStreak") || "0", 10);

  const y = new Date(); y.setDate(y.getDate() - 1);
  const yesterday = y.toISOString().split("T")[0];

  if (lastDate !== today){
    streak = (lastDate === yesterday) ? streak + 1 : 1;
    localStorage.setItem("enigmaStreak", String(streak));
    localStorage.setItem("enigmaLastCheckinDate", today);
  }

  localStorage.setItem("enigmaDailyMood", mood);
  localStorage.setItem("enigmaDailyNote", note);

  const msg = document.getElementById("checkinSavedMsg");
  if (msg) msg.textContent = `Saved 🌿 Streak: ${streak} day(s)`;
}

function getRecommendation(){
  const mood = localStorage.getItem("enigmaDailyMood") || "";
  if (mood === "calm") return "🧘 Gentle yoga or a short walk could feel lovely today.";
  if (mood === "okay") return "💬 Read a quote that resonates.";
  if (mood === "low") return "🌬️ Try a slow breathing session.";
  if (mood === "anxious") return "🎨 Tap-to-colour can help ground you.";
  return "🌱 Try a daily check-in to get gentle suggestions.";
}

/* =========================
   Progress
========================= */
function populateProgress(){
  const moodEl = document.getElementById("pMood");
  const streakEl = document.getElementById("pStreak");
  const recEl = document.getElementById("pRec");
  const favEl = document.getElementById("pFavCount");
  const breatheEl = document.getElementById("pBreathe");

  if (moodEl) moodEl.textContent = localStorage.getItem("enigmaDailyMood") || "Not checked in yet";
  if (streakEl) streakEl.textContent = localStorage.getItem("enigmaStreak") || "0";
  if (recEl) recEl.textContent = getRecommendation();
  if (favEl) favEl.textContent = String(getSavedQuotes().length);

  const breatheDone = localStorage.getItem("enigmaBreatheDone");
  if (breatheEl) breatheEl.textContent = (breatheDone === isoToday()) ? "Yes 🌬️" : "Not today yet";
}

/* =========================
   Tap-to-colour game init hook
   IMPORTANT:
   - If you already pasted the full colour-by-number game logic earlier (initColourGame etc.),
     it will run.
   - If not, the page will still load, but game grid won’t render.
========================= */
function safeInitColourGame(){
  try {
    if (typeof initColourGame === "function") initColourGame();
  } catch(e) {}
}

/* =========================
   Boot
========================= */
document.addEventListener("DOMContentLoaded", () => {
  applyThemeFromStorage();

  // Ensure moon icon correct on load
  updateThemeIcon();

  // Mark saved quote tiles (quotes page)
  const saved = getSavedQuotes();
  document.querySelectorAll(".quote-tile").forEach(tile => {
    const item = `${tile.getAttribute("data-quote")} — ${tile.getAttribute("data-author")}`;
    if (saved.includes(item)) tile.classList.add("saved");
  });

  renderSavedQuotes();
  renderJournal();
  populateProgress();
  startBreathingSynced();
  safeInitColourGame();
});
