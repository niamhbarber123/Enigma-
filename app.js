/* =========================================================
   Enigma • app.js (FULL)
   - Theme toggle (night mode)
   - Back button helper
   - Quotes: tiles + Save button only + daily shuffle + search + saved-only
========================================================= */

function $(id){ return document.getElementById(id); }

/* ---------- Back ---------- */
window.enigmaBack = function(){
  if (history.length > 1) history.back();
  else window.location.href = "index.html";
};

/* ---------- Theme ---------- */
function applyThemeFromStorage(){
  const night = localStorage.getItem("enigmaNightMode") === "1";
  document.body.classList.toggle("night", night);
}
function toggleTheme(){
  const now = !(localStorage.getItem("enigmaNightMode") === "1");
  localStorage.setItem("enigmaNightMode", now ? "1" : "0");
  applyThemeFromStorage();
}

/* =========================
   Quotes (tiles + save/unsave + daily shuffle)
========================= */
const QUOTES = [
  { q:"Nothing can dim the light that shines from within.", a:"Maya Angelou" },
  { q:"No one can make you feel inferior without your consent.", a:"Eleanor Roosevelt" },
  { q:"I raise up my voice—not so that I can shout, but so that those without a voice can be heard.", a:"Malala Yousafzai" },
  { q:"Well-behaved women seldom make history.", a:"Laurel Thatcher Ulrich" },
  { q:"Power is not given to you. You have to take it.", a:"Beyoncé" },
  { q:"I have learned over the years that when one’s mind is made up, this diminishes fear.", a:"Rosa Parks" },
  { q:"If you don’t like the road you’re walking, start paving another one.", a:"Dolly Parton" },
  { q:"My peace is my priority.", a:"Affirmation" },
  { q:"You may not control all the events that happen to you, but you can decide not to be reduced by them.", a:"Maya Angelou" },
  { q:"Think like a queen. A queen is not afraid to fail.", a:"Oprah Winfrey" }
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
  if (!grid) return;

  const search = $("quoteSearch");
  const toggleSavedOnlyBtn = $("toggleSavedOnlyBtn");

  let savedOnly = false;

  const saved = new Set(JSON.parse(localStorage.getItem("enigmaSavedQuotesV2") || "[]"));
  const savedCount = $("savedCount");
  if (savedCount) savedCount.textContent = String(saved.size);

  const list = dailyShuffledQuotes(QUOTES);

  function render(){
    const q = (search?.value || "").trim().toLowerCase();

    const filtered = list.filter(item=>{
      const id = quoteId(item);
      if (savedOnly && !saved.has(id)) return false;
      if (!q) return true;
      return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
    });

    grid.innerHTML = "";

    filtered.forEach(item=>{
      const id = quoteId(item);

      const tile = document.createElement("div");
      tile.className = "quote-tile" + (saved.has(id) ? " saved" : "");
      tile.innerHTML = `
        <div style="font-weight:900;color:#5a4b7a; line-height:1.35;">“${item.q}”</div>
        <small>— ${item.a}</small>
      `;

      // Save button ONLY (scroll-safe)
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quote-save-btn" + (saved.has(id) ? " saved" : "");
      btn.textContent = saved.has(id) ? "Saved 💜" : "Save 💜";

      btn.addEventListener("click", (e)=>{
        e.stopPropagation();
        if (saved.has(id)) saved.delete(id);
        else saved.add(id);

        localStorage.setItem("enigmaSavedQuotesV2", JSON.stringify(Array.from(saved)));
        if (savedCount) savedCount.textContent = String(saved.size);

        btn.classList.toggle("saved", saved.has(id));
        btn.textContent = saved.has(id) ? "Saved 💜" : "Save 💜";
        tile.classList.toggle("saved", saved.has(id));

        if (savedOnly) render();
      });

      tile.appendChild(btn);
      grid.appendChild(tile);
    });
  }

  render();

  if (search) search.addEventListener("input", render);

  if (toggleSavedOnlyBtn){
    toggleSavedOnlyBtn.addEventListener("click", ()=>{
      savedOnly = !savedOnly;
      toggleSavedOnlyBtn.textContent = savedOnly ? "Showing saved only" : "Show saved only";
      toggleSavedOnlyBtn.classList.toggle("active", savedOnly);
      render();
    });
  }

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
      location.reload();
    };
  }
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", ()=>{
  applyThemeFromStorage();
  const themeFab = $("themeFab");
  if (themeFab) themeFab.addEventListener("click", toggleTheme);

  initQuotes();
});
