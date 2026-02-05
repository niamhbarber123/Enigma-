/* =========================================================
   Enigma • app.js (FULL)
   - Theme toggle (moon button #themeFab)
   - Back button helper (enigmaBack)
   - Login gate helpers (optional)
   - Breathe: completed save
   - Quotes: tiles + save/unsave + daily shuffle
========================================================= */

/* =========================
   Basic helpers
========================= */
function $(id){ return document.getElementById(id); }

window.enigmaBack = function(){
  if (history.length > 1) history.back();
  else window.location.href = "/Enigma-/index.html";
};

/* =========================
   Theme (Night Mode)
   - toggles body.night
   - persists in localStorage "enigmaTheme"
========================= */
(function themeInit(){
  function setIcon(){
    const btn = $("themeFab");
    if (!btn) return;
    btn.textContent = document.body.classList.contains("night") ? "☀️" : "🌙";
  }

  function applyTheme(){
    const saved = localStorage.getItem("enigmaTheme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const useNight = saved ? (saved === "night") : prefersDark;
    document.body.classList.toggle("night", useNight);
    setIcon();
  }

  function toggleTheme(){
    const isNight = document.body.classList.toggle("night");
    localStorage.setItem("enigmaTheme", isNight ? "night" : "day");
    setIcon();
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();

    const btn = $("themeFab");
    if (!btn) return;

    // click + iOS touch
    btn.addEventListener("click", (e)=>{ e.preventDefault(); toggleTheme(); }, { passive:false });
    btn.addEventListener("touchend", (e)=>{ e.preventDefault(); toggleTheme(); }, { passive:false });
  });
})();

/* =========================
   Optional: Login helpers
========================= */
window.enigmaLogin = function(name){
  const clean = (name || "").trim();
  if (!clean) return false;
  localStorage.setItem("enigmaUser", clean);
  return true;
};

window.enigmaLogout = function(){
  localStorage.removeItem("enigmaUser");
  window.location.href = "/Enigma-/login.html";
};

window.requireLogin = function(){
  if (!localStorage.getItem("enigmaUser")) {
    window.location.href = "/Enigma-/login.html";
  }
};

/* =========================
   Breathe: completed save
========================= */
window.markBreatheDone = function(){
  const today = new Date().toISOString().split("T")[0];
  localStorage.setItem("enigmaBreatheDone", today);

  const msg = $("breatheDoneMsg");
  if (msg) msg.textContent = "Saved ✅ Well done.";
};

/* =========================================================
   Quotes (tiles + save/unsave + daily shuffle)
========================================================= */
const QUOTES = [
  { q:"Nothing can dim the light that shines from within.", a:"Maya Angelou" },
  { q:"No one can make you feel inferior without your consent.", a:"Eleanor Roosevelt" },
  { q:"I raise up my voice—not so that I can shout, but so that those without a voice can be heard.", a:"Malala Yousafzai" },
  { q:"Well-behaved women seldom make history.", a:"Laurel Thatcher Ulrich" },
  { q:"Power is not given to you. You have to take it.", a:"Beyoncé" },
  { q:"I have learned over the years that when one’s mind is made up, this diminishes fear.", a:"Rosa Parks" },
  { q:"If you don’t like the road you’re walking, start paving another one.", a:"Dolly Parton" },
  { q:"My peace is my priority.", a:"Affirmation" }
];

function quoteId(item){
  return `${item.a}::${item.q}`;
}

// deterministic RNG
function mulberry32(seed){
  return function(){
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dailyShuffledQuotes(list){
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const seed = parseInt(today.replaceAll("-", ""), 10) || 20260101;
  const rand = mulberry32(seed);

  const arr = list.slice();
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initQuotes(){
  const grid = $("quoteGrid");
  if (!grid) return; // not on quotes page

  const saved = new Set(JSON.parse(localStorage.getItem("enigmaSavedQuotesV2") || "[]"));

  const savedCount = $("savedCount");
  if (savedCount) savedCount.textContent = String(saved.size);

  const list = dailyShuffledQuotes(QUOTES);

  grid.innerHTML = "";
  list.forEach(item=>{
    const id = quoteId(item);

    const tile = document.createElement("div");
    tile.className = "quote-tile" + (saved.has(id) ? " saved" : "");
    tile.setAttribute("role","button");
    tile.setAttribute("tabindex","0");

    tile.innerHTML = `
      <div style="font-weight:900;color:#5a4b7a; line-height:1.35;">“${item.q}”</div>
      <small>— ${item.a}</small>
    `;

    const toggle = (e)=>{
      e.preventDefault();
      if (saved.has(id)) saved.delete(id);
      else saved.add(id);

      localStorage.setItem("enigmaSavedQuotesV2", JSON.stringify(Array.from(saved)));
      tile.classList.toggle("saved", saved.has(id));

      if (savedCount) savedCount.textContent = String(saved.size);
    };

    tile.addEventListener("click", toggle, { passive:false });
    tile.addEventListener("touchend", toggle, { passive:false });

    // keyboard accessibility
    tile.addEventListener("keydown", (e)=>{
      if (e.key === "Enter" || e.key === " ") toggle(e);
    });

    grid.appendChild(tile);
  });

  const viewBtn = $("viewSavedBtn");
  if (viewBtn){
    viewBtn.onclick = ()=>{
      const list = Array.from(saved);
      if (!list.length) return alert("No saved quotes yet.");
      alert("Saved quotes:\n\n" + list.map(x=> "• " + x.split("::")[1]).join("\n\n"));
    };
  }

  const clearBtn = $("clearSavedBtn");
  if (clearBtn){
    clearBtn.onclick = ()=>{
      if (!confirm("Delete all saved quotes?")) return;
      localStorage.setItem("enigmaSavedQuotesV2", "[]");
      initQuotes();
    };
  }
}

/* =========================
   Run page initialisers
========================= */
document.addEventListener("DOMContentLoaded", () => {
  // Quotes page
  initQuotes();

  // Optional: greet user on pages that have #welcomeName
  const nameEl = $("welcomeName");
  const user = localStorage.getItem("enigmaUser");
  if (nameEl && user) nameEl.textContent = user;
});
