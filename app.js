/* =========================================================
   Enigma • app.js (FULL)
   Theme + Back
   Quotes tiles (save/unsave + daily shuffle)
   Journal (save + view entries)
   Breathe (inhale/exhale loop + completed)
   Game (designs restored + modes + palette + simple colouring)
   Music links (YouTube) + mood filter + minutes listened
========================================================= */

/* ---------- Utilities ---------- */
function $(id){ return document.getElementById(id); }

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
document.addEventListener("DOMContentLoaded", ()=>{
  applyThemeFromStorage();
  const themeFab = $("themeFab");
  if (themeFab) themeFab.addEventListener("click", toggleTheme);
});

/* =========================================================
   QUOTES (tiles + save/unsave + daily shuffle)
========================================================= */
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

function quoteId(item){ return `${item.a}::${item.q}`; }

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

/* =========================================================
   JOURNAL (save + view entries)
========================================================= */
function initJournal(){
  const text = $("journalText");
  const saveBtn = $("saveEntryBtn");
  const viewBtn = $("viewEntriesBtn");
  const clearBtn = $("clearEntriesBtn");
  const msg = $("journalMsg");
  const entriesCard = $("entriesCard");
  const grid = $("entriesGrid");
  if (!text || !saveBtn || !viewBtn || !clearBtn || !msg || !entriesCard || !grid) return;

  const KEY = "enigmaJournalEntriesV1";

  function load(){
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch { return []; }
  }
  function store(list){ localStorage.setItem(KEY, JSON.stringify(list)); }

  function render(){
    const entries = load();
    grid.innerHTML = "";
    entries.slice().reverse().forEach(e=>{
      const tile = document.createElement("div");
      tile.className = "entry-tile";
      tile.innerHTML = `
        <h3>${e.date}</h3>
        <p>${(e.text || "").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
        <small>${e.time}</small>
      `;
      grid.appendChild(tile);
    });
    msg.textContent = entries.length ? `You have ${entries.length} saved entries.` : "No entries yet.";
  }

  saveBtn.addEventListener("click", ()=>{
    const val = (text.value || "").trim();
    if (!val) { msg.textContent = "Write something first."; return; }

    const now = new Date();
    const entry = {
      text: val,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})
    };

    const entries = load();
    entries.push(entry);
    store(entries);
    text.value = "";
    msg.textContent = "Saved ✅";
    render();
  });

  viewBtn.addEventListener("click", ()=>{
    entriesCard.style.display = entriesCard.style.display === "none" ? "block" : "none";
    render();
  });

  clearBtn.addEventListener("click", ()=>{
    if (!confirm("Delete all journal entries?")) return;
    localStorage.removeItem(KEY);
    render();
    msg.textContent = "Deleted ✅";
  });

  render();
}

/* =========================================================
   BREATHE (bigger + wording changes)
========================================================= */
window.markBreatheDone = function(){
  const key = "enigmaBreatheDoneCount";
  const v = parseInt(localStorage.getItem(key) || "0", 10) + 1;
  localStorage.setItem(key, String(v));
  const msg = $("breatheDoneMsg");
  if (msg) msg.textContent = `Completed ✅ (${v} total)`;
};

function initBreathe(){
  const stage = $("breatheStage");
  const text = $("breatheText");
  const startBtn = $("breatheStartBtn");
  const stopBtn = $("breatheStopBtn");
  if (!stage || !text || !startBtn || !stopBtn) return;

  let running = false;
  let timer = null;

  function setPhase(phase){
    stage.classList.remove("inhale","exhale");
    stage.classList.add(phase);
    text.textContent = phase === "inhale" ? "Inhale" : "Exhale";
  }

  function loop(){
    if (!running) return;
    setPhase("inhale");
    timer = setTimeout(()=>{
      if (!running) return;
      setPhase("exhale");
      timer = setTimeout(loop, 4000);
    }, 4000);
  }

  startBtn.addEventListener("click", ()=>{
    if (running) return;
    running = true;
    loop();
  });

  stopBtn.addEventListener("click", ()=>{
    running = false;
    clearTimeout(timer);
    stage.classList.remove("inhale","exhale");
    stage.classList.add("inhale");
    text.textContent = "Ready";
  });

  text.textContent = "Ready";
}

/* =========================================================
   GAME (designs restored + free-mode hides numbers)
========================================================= */
const COLOUR_DESIGNS = [
  { id:"mandala", name:"Mandala" },
  { id:"flower", name:"Flower" },
  { id:"butterfly", name:"Butterfly" },
  { id:"waves", name:"Waves" },
  { id:"heart", name:"Heart" },
  { id:"sunrise", name:"Sunrise" }
];

const PALETTE = [
  "#d8cdf3", "#b8a6d9", "#efe9f8", "#c7eadc",
  "#9ed9c8", "#b8e0ff", "#7fb5ff", "#ffd6cc",
  "#f7c0c8", "#ffe8a8", "#c9c2ff", "#b6b0e8"
];

let gameState = {
  designId: null,
  mode: "number", // "number" or "free"
  selectedColor: PALETTE[0],
  lastPaint: null,
  history: []
};

function setColourMode(mode){
  gameState.mode = mode;
  const grid = $("grid");
  if (grid){
    grid.classList.toggle("free-mode", mode === "free");
  }
  const nBtn = $("modeNumberBtn");
  const fBtn = $("modeFreeBtn");
  if (nBtn) nBtn.classList.toggle("active", mode === "number");
  if (fBtn) fBtn.classList.toggle("active", mode === "free");
}

function buildPalette(){
  const wrap = $("palette");
  if (!wrap) return;
  wrap.innerHTML = "";
  PALETTE.forEach((c, idx)=>{
    const d = document.createElement("div");
    d.className = "palette-chip" + (c === gameState.selectedColor ? " active" : "");
    d.style.background = c;
    d.innerHTML = `<div class="palette-num">${idx+1}</div>`;
    d.addEventListener("click", ()=>{
      gameState.selectedColor = c;
      buildPalette();
    });
    wrap.appendChild(d);
  });
}

function buildGrid(){
  const grid = $("grid");
  const msg = $("saveMsg");
  if (!grid) return;

  grid.innerHTML = "";
  // Simple 14x14 grid; numbers 1..5 for colour-by-number
  const size = 14;
  for(let i=0; i<size*size; i++){
    const cell = document.createElement("div");
    cell.className = "cell";
    const n = (i % 5) + 1;
    cell.dataset.num = String(n);
    cell.innerHTML = `<span class="num">${n}</span>`;
    cell.addEventListener("click", ()=> paintCell(cell));
    grid.appendChild(cell);
  }
  if (msg) msg.textContent = "Tap cells to colour.";
}

function paintCell(cell){
  if (!cell) return;

  // if mode is "number", allow any colour (kept simple)
  // if mode is "free", allow any colour too, but hide numbers via CSS class
  const prev = cell.style.backgroundColor || "";
  cell.style.backgroundColor = gameState.selectedColor;
  cell.classList.add("filled");

  gameState.history.push({ cellIndex: Array.from(cell.parentNode.children).indexOf(cell), prev });
}

window.enigmaUndo = function(){
  const grid = $("grid");
  if (!grid) return;
  const last = gameState.history.pop();
  if (!last) return;

  const cell = grid.children[last.cellIndex];
  if (!cell) return;

  cell.style.backgroundColor = last.prev;
  if (!last.prev) cell.classList.remove("filled");
};

window.enigmaEraser = function(){
  gameState.selectedColor = "";
  buildPalette();
};

window.enigmaClear = function(){
  const grid = $("grid");
  if (!grid) return;
  Array.from(grid.children).forEach(cell=>{
    cell.style.backgroundColor = "";
    cell.classList.remove("filled");
  });
  gameState.history = [];
};

window.markColouringComplete = function(){
  const key = "enigmaColourComplete";
  const v = parseInt(localStorage.getItem(key) || "0", 10) + 1;
  localStorage.setItem(key, String(v));
  const msg = $("saveMsg");
  if (msg) msg.textContent = `Completed ✅ (${v} total)`;
};

function loadDesign(id){
  gameState.designId = id;
  buildGrid();
}

function initGame(){
  const designGrid = $("designGrid");
  if (!designGrid) return;

  // designs
  designGrid.innerHTML = "";
  COLOUR_DESIGNS.forEach(d=>{
    const btn = document.createElement("button");
    btn.className = "design-tile";
    btn.type = "button";
    btn.textContent = d.name;
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".design-tile").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      loadDesign(d.id);
    });
    designGrid.appendChild(btn);
  });

  // mode
  const nBtn = $("modeNumberBtn");
  const fBtn = $("modeFreeBtn");
  if (nBtn) nBtn.addEventListener("click", ()=> setColourMode("number"));
  if (fBtn) fBtn.addEventListener("click", ()=> setColourMode("free"));

  setColourMode("number");
  buildPalette();
}

/* =========================================================
   MUSIC LINKS (YouTube) + mood + minutes listened
========================================================= */
const MUSIC_LINKS = [
  { mood:"anxious", title:"Calm breathing music (1 hour)", url:"https://www.youtube.com/results?search_query=calm+breathing+music+1+hour" },
  { mood:"stressed", title:"Relaxing piano for stress", url:"https://www.youtube.com/results?search_query=relaxing+piano+for+stress" },
  { mood:"low", title:"Gentle uplifting ambient", url:"https://www.youtube.com/results?search_query=gentle+uplifting+ambient+music" },
  { mood:"focus", title:"Lo-fi focus mix", url:"https://www.youtube.com/results?search_query=lofi+focus+mix" },
  { mood:"sleep", title:"Sleep music (dark screen)", url:"https://www.youtube.com/results?search_query=sleep+music+dark+screen" },
  { mood:"all", title:"Nature sounds playlist", url:"https://www.youtube.com/results?search_query=nature+sounds+playlist" },
  { mood:"all", title:"Meditation music playlist", url:"https://www.youtube.com/results?search_query=meditation+music+playlist" }
];

const LISTEN_KEY = "enigmaListenMinutesV1";
const LISTEN_TODAY_KEY = "enigmaListenMinutesTodayV1";
const LISTEN_DATE_KEY = "enigmaListenMinutesDateV1";
const LISTEN_SESSION_KEY = "enigmaListenSessionStartV1";

function ensureToday(){
  const today = new Date().toISOString().split("T")[0];
  const savedDate = localStorage.getItem(LISTEN_DATE_KEY);
  if (savedDate !== today){
    localStorage.setItem(LISTEN_DATE_KEY, today);
    localStorage.setItem(LISTEN_TODAY_KEY, "0");
  }
}

function getMinutes(key){
  return parseInt(localStorage.getItem(key) || "0", 10);
}
function setMinutes(key, val){
  localStorage.setItem(key, String(Math.max(0, Math.floor(val))));
}

function updateMinutesUI(){
  const todayEl = $("todayMinutes");
  const totalEl = $("totalMinutes");
  if (todayEl) todayEl.textContent = String(getMinutes(LISTEN_TODAY_KEY));
  if (totalEl) totalEl.textContent = String(getMinutes(LISTEN_KEY));
}

function startSession(){
  if (localStorage.getItem(LISTEN_SESSION_KEY)) return;
  localStorage.setItem(LISTEN_SESSION_KEY, String(Date.now()));
  const s = $("sessionStatus");
  if (s) s.textContent = "Session started. Tap a link, then press End session when finished.";
}

function endSession(){
  const start = parseInt(localStorage.getItem(LISTEN_SESSION_KEY) || "0", 10);
  if (!start){
    const s = $("sessionStatus");
    if (s) s.textContent = "No active session.";
    return;
  }
  const mins = Math.max(1, Math.round((Date.now() - start) / 60000));
  localStorage.removeItem(LISTEN_SESSION_KEY);

  setMinutes(LISTEN_TODAY_KEY, getMinutes(LISTEN_TODAY_KEY) + mins);
  setMinutes(LISTEN_KEY, getMinutes(LISTEN_KEY) + mins);

  updateMinutesUI();
  const s = $("sessionStatus");
  if (s) s.textContent = `Saved ${mins} minute(s) ✅`;
}

function renderMusicLinks(mood){
  const wrap = $("soundLinks");
  if (!wrap) return;

  wrap.innerHTML = "";
  const list = MUSIC_LINKS.filter(x => mood === "all" ? true : (x.mood === mood || x.mood === "all"));

  list.forEach(item=>{
    const a = document.createElement("a");
    a.className = "sound-link";
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = item.title;

    // ensure iPhone registers it as direct tap
    a.addEventListener("click", ()=>{
      document.querySelectorAll(".sound-link").forEach(x=>x.classList.remove("active"));
      a.classList.add("active");
    });

    wrap.appendChild(a);
  });
}

function initMusic(){
  const chips = $("moodChips");
  const hint = $("moodHint");
  if (!chips || !hint) return;

  ensureToday();
  updateMinutesUI();

  let mood = "all";
  renderMusicLinks(mood);

  chips.querySelectorAll(".chip").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      chips.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      mood = btn.dataset.mood || "all";
      hint.textContent = `Showing: ${mood === "all" ? "All" : mood}`;
      renderMusicLinks(mood);
    });
  });

  const startBtn = $("startSessionBtn");
  const endBtn = $("endSessionBtn");
  if (startBtn) startBtn.addEventListener("click", startSession);
  if (endBtn) endBtn.addEventListener("click", endSession);

  // if session already running:
  const s = $("sessionStatus");
  if (s){
    s.textContent = localStorage.getItem(LISTEN_SESSION_KEY)
      ? "Session running… press End session when finished."
      : "No active session.";
  }
}

/* =========================================================
   Boot per page
========================================================= */
document.addEventListener("DOMContentLoaded", ()=>{
  initQuotes();
  initJournal();
  initBreathe();
  initGame();
  initMusic();
});
