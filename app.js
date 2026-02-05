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
   Night mode (theme toggle)
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
  // show sun when currently in night mode (tap to go day)
  btn.textContent = document.body.classList.contains("night") ? "☀️" : "🌙";
  btn.setAttribute("aria-label", document.body.classList.contains("night") ? "Switch to day mode" : "Switch to night mode");
}

/* =========================
   Quotes: toggle select/deselect + saved list
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
    <div style="font-weight:900; color:#5a4b7a;">Saved quotes</div>
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
   Colour game init hook
   (Your full colour-by-number game code should still be in this file
   if you previously pasted it. If it lives elsewhere, that’s fine.)
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

  // Mark saved quote tiles on quotes page
  const saved = getSavedQuotes();
  document.querySelectorAll(".quote-tile").forEach(tile => {
    const item = `${tile.getAttribute("data-quote")} — ${tile.getAttribute("data-author")}`;
    if (saved.includes(item)) tile.classList.add("saved");
  });

  renderSavedQuotes();
  safeInitColourGame();
});
