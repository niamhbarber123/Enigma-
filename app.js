/* =========================================================
   Enigma • app.js (FULL)
   - Theme (night mode)
   - Back helper
   - Breathe: working animation + changing text + session + streak
   - Quotes: tiles + save/unsave + daily shuffle + clear
   - Music: mood buttons + tappable link buttons + minutes listened
   - Game (Tap to Colour): designs + 20+ palette circles + simple tap-to-fill SVG
========================================================= */

function $(id){ return document.getElementById(id); }

/* -------------------------
   Back helper
------------------------- */
window.enigmaBack = function(){
  if (history.length > 1) history.back();
  else window.location.href = "index.html";
};

/* -------------------------
   Theme
------------------------- */
function applyThemeFromStorage(){
  const night = localStorage.getItem("enigmaNightMode") === "1";
  document.body.classList.toggle("night", night);
}
function toggleTheme(){
  const now = !(localStorage.getItem("enigmaNightMode") === "1");
  localStorage.setItem("enigmaNightMode", now ? "1" : "0");
  applyThemeFromStorage();
}

/* =========================================================
   STREAKS (shared)
========================================================= */
function todayKey(){
  return new Date().toISOString().slice(0,10); // YYYY-MM-DD
}
function addCompletion(type){
  const key = `enigmaDone_${type}_${todayKey()}`;
  localStorage.setItem(key, "1");

  // streak
  const streakKey = `enigmaStreak_${type}`;
  const lastKey = `enigmaLast_${type}`;
  const last = localStorage.getItem(lastKey);

  const today = todayKey();
  if (!last){
    localStorage.setItem(streakKey, "1");
  } else {
    // compare last date to today/yesterday
    const lastDate = new Date(last + "T00:00:00");
    const todayDate = new Date(today + "T00:00:00");
    const diffDays = Math.round((todayDate - lastDate) / 86400000);

    const current = parseInt(localStorage.getItem(streakKey) || "0", 10) || 0;
    if (diffDays === 1) localStorage.setItem(streakKey, String(current + 1));
    else if (diffDays === 0) { /* same day - no change */ }
    else localStorage.setItem(streakKey, "1");
  }

  localStorage.setItem(lastKey, today);
}

/* =========================================================
   BREATHE (breathe.html)
   Expected elements (if present):
   - #breathePhase (text)
   - #breatheCircle (div)
   - #startBreathe, #stopBreathe, #completeBreathe
========================================================= */
function initBreathe(){
  const phaseEl = $("breathePhase");
  const circle = $("breatheCircle");
  const startBtn = $("startBreathe");
  const stopBtn = $("stopBreathe");
  const completeBtn = $("completeBreathe");

  // If your current breathe.html doesn't have these ids,
  // this function will simply exit without breaking.
  if (!startBtn && !circle && !phaseEl) return;

  let timer = null;
  let stepIndex = 0;
  let running = false;

  // 60s total: 4 cycles of 15s (In 4, Hold 2, Out 6, Hold 3)
  const STEPS = [
    { label:"Inhale",  dur:4000, scale:1.18 },
    { label:"Hold",    dur:2000, scale:1.18 },
    { label:"Exhale",  dur:6000, scale:0.88 },
    { label:"Hold",    dur:3000, scale:0.88 }
  ];

  function setPhase(text){
    if (phaseEl) phaseEl.textContent = text;
  }

  function setCircle(scale){
    if (!circle) return;
    circle.style.transform = `scale(${scale})`;
  }

  function stop(){
    running = false;
    stepIndex = 0;
    if (timer) clearTimeout(timer);
    timer = null;
    setPhase("Ready");
    setCircle(1);
  }

  function nextStep(){
    if (!running) return;

    const step = STEPS[stepIndex % STEPS.length];
    setPhase(step.label);
    setCircle(step.scale);

    timer = setTimeout(()=>{
      stepIndex++;
      nextStep();
    }, step.dur);
  }

  function start(){
    if (running) return;
    running = true;
    stepIndex = 0;

    // start at exhale-ish neutral then begin inhale
    setCircle(0.92);
    setTimeout(()=>{ if (running) nextStep(); }, 150);
  }

  if (startBtn) startBtn.onclick = start;
  if (stopBtn) stopBtn.onclick = stop;

  if (completeBtn){
    completeBtn.onclick = ()=>{
      addCompletion("breathe");
      alert("Saved ✅");
    };
  }

  // if user leaves page / reload, stop
  window.addEventListener("pagehide", stop);
}

/* =========================================================
   QUOTES (quotes.html)
   Expected:
   - #quoteGrid
   - #savedCount
   - #viewSavedBtn
   - #clearSavedBtn
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
  { q:"I am deliberate and afraid of nothing.", a:"Audre Lorde" },
  { q:"You may encounter many defeats, but you must not be defeated.", a:"Maya Angelou" },
  { q:"Done is better than perfect.", a:"Sheryl Sandberg" },
  { q:"If they don’t give you a seat at the table, bring a folding chair.", a:"Shirley Chisholm" }
];

function quoteId(item){
  return `${item.a}::${item.q}`;
}

// deterministic RNG for daily shuffle
function mulberry32(seed){
  return function(){
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dailyShuffledQuotes(list){
  const today = todayKey(); // YYYY-MM-DD
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

  const storageKey = "enigmaSavedQuotesV2";
  const saved = new Set(JSON.parse(localStorage.getItem(storageKey) || "[]"));

  const savedCount = $("savedCount");
  if (savedCount) savedCount.textContent = String(saved.size);

  const list = dailyShuffledQuotes(QUOTES);

  grid.innerHTML = "";
  list.forEach(item=>{
    const id = quoteId(item);

    const tile = document.createElement("div");
    tile.className = "quote-tile" + (saved.has(id) ? " saved" : "");
    tile.innerHTML = `
      <div style="font-weight:900;color:#5a4b7a; line-height:1.35;">“${item.q}”</div>
      <small>— ${item.a}</small>
      <button class="quote-save-btn ${saved.has(id) ? "saved":""}" type="button">
        ${saved.has(id) ? "Saved ✓" : "Save"}
      </button>
    `;

    const btn = tile.querySelector(".quote-save-btn");

    btn.addEventListener("click", (e)=>{
      e.preventDefault();
      if (saved.has(id)) saved.delete(id);
      else saved.add(id);

      localStorage.setItem(storageKey, JSON.stringify(Array.from(saved)));
      tile.classList.toggle("saved", saved.has(id));
      btn.classList.toggle("saved", saved.has(id));
      btn.textContent = saved.has(id) ? "Saved ✓" : "Save";

      if (savedCount) savedCount.textContent = String(saved.size);
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
      localStorage.setItem(storageKey, "[]");
      initQuotes();
    };
  }
}

/* =========================================================
   MUSIC (sounds.html)
========================================================= */
const MOODS = ["All","Anxious","Stressed","Low mood","Focus","Sleep"];

const TRACKS = [
  { title:"Calm breathing music (1 hour)", mood:["Anxious","Stressed"], url:"https://www.youtube.com/results?search_query=calm+breathing+music+1+hour" },
  { title:"Relaxing piano for stress", mood:["Stressed","Low mood"], url:"https://www.youtube.com/results?search_query=relaxing+piano+for+stress" },
  { title:"Gentle uplifting ambient", mood:["Low mood"], url:"https://www.youtube.com/results?search_query=gentle+uplifting+ambient+music" },
  { title:"Lo-fi focus mix", mood:["Focus"], url:"https://www.youtube.com/results?search_query=lofi+focus+mix" },
  { title:"Sleep music (dark screen)", mood:["Sleep"], url:"https://www.youtube.com/results?search_query=sleep+music+dark+screen" },
  { title:"Nature sounds playlist", mood:["Anxious","Sleep"], url:"https://www.youtube.com/results?search_query=nature+sounds+playlist" },
  { title:"Meditation music playlist", mood:["Anxious","Stressed","Sleep"], url:"https://www.youtube.com/results?search_query=meditation+music+playlist" },
  { title:"Rain sounds (8 hours)", mood:["Sleep","Anxious"], url:"https://www.youtube.com/results?search_query=rain+sounds+8+hours" },
  { title:"Ocean waves", mood:["Sleep","Low mood"], url:"https://www.youtube.com/results?search_query=ocean+waves+relaxing+sounds" },
  { title:"Forest ambience", mood:["Focus","Low mood"], url:"https://www.youtube.com/results?search_query=forest+ambience+relaxing" }
];

function initMusic(){
  const chipWrap = $("moodChips");
  const list = $("musicList");
  if (!chipWrap || !list) return;

  const minsTodayEl = $("minsToday");
  const minsTotalEl = $("minsTotal");
  const statusEl = $("listenStatus");
  const startBtn = $("startListenBtn");
  const endBtn = $("endListenBtn");

  const totalKey = "enigmaMusicMinsTotal";
  const todayKeyLocal = "enigmaMusicMinsToday_" + todayKey();
  const sessionKey = "enigmaMusicSessionStart";

  function readInt(key){ return parseInt(localStorage.getItem(key) || "0", 10) || 0; }
  function setInt(key, val){ localStorage.setItem(key, String(val)); }

  function refreshMins(){
    if (minsTodayEl) minsTodayEl.textContent = String(readInt(todayKeyLocal));
    if (minsTotalEl) minsTotalEl.textContent = String(readInt(totalKey));
    const s = localStorage.getItem(sessionKey);
    if (statusEl) statusEl.textContent = s ? "Session active." : "No active session.";
  }

  if (startBtn){
    startBtn.onclick = ()=>{
      if (localStorage.getItem(sessionKey)) return;
      localStorage.setItem(sessionKey, String(Date.now()));
      refreshMins();
    };
  }
  if (endBtn){
    endBtn.onclick = ()=>{
      const start = parseInt(localStorage.getItem(sessionKey) || "0", 10);
      if (!start) return;
      const mins = Math.max(0, Math.round((Date.now() - start) / 60000));
      localStorage.removeItem(sessionKey);

      setInt(todayKeyLocal, readInt(todayKeyLocal) + mins);
      setInt(totalKey, readInt(totalKey) + mins);
      refreshMins();
    };
  }

  refreshMins();

  let activeMood = "All";

  function renderChips(){
    chipWrap.innerHTML = "";
    MOODS.forEach(m=>{
      const b = document.createElement("button");
      b.className = "chip" + (m===activeMood ? " active" : "");
      b.type = "button";
      b.textContent = m;
      b.onclick = ()=>{
        activeMood = m;
        renderChips();
        renderTracks();
        const showing = $("moodShowing");
        if (showing) showing.textContent = "Showing: " + activeMood;
      };
      chipWrap.appendChild(b);
    });
  }

  function renderTracks(){
    list.innerHTML = "";
    const filtered = TRACKS.filter(t => activeMood==="All" || t.mood.includes(activeMood));

    filtered.forEach(t=>{
      const btn = document.createElement("button");
      btn.className = "music-btn";
      btn.type = "button";
      btn.innerHTML = `<span>${t.title}</span><span>↗</span>`;
      btn.onclick = ()=> window.open(t.url, "_blank", "noopener,noreferrer");
      list.appendChild(btn);
    });

    if (!filtered.length){
      const empty = document.createElement("div");
      empty.className = "gentle-text";
      empty.textContent = "No tracks for this mood yet.";
      list.appendChild(empty);
    }
  }

  renderChips();
  renderTracks();
}

/* =========================================================
   GAME (Tap to Colour) — designs + palette circles
   Includes a SIMPLE SVG template so "designs don't disappear"
   Expected:
   - #paletteDots, #designChips, #canvasMount
   - #modeByNumber, #modeFree
   - #undoBtn, #eraserBtn, #clearBtn, #completeBtn
========================================================= */
const PALETTE_24 = [
  "#b8a6d9","#d6c8ef","#efe9f8","#cbb6e6","#a79ccf",
  "#bfe3d7","#9fd6c7","#7ccab9","#cfe8f7","#a7d6f5",
  "#7fbdf0","#ffd9cf","#f7c3d8","#ffe6a7","#f1f5c5",
  "#c9f0d3","#b0d0ff","#d3c7ff","#f2c7ff","#c7c7d1",
  "#c6e3ff","#dff6ff","#f8d7ff","#ffd6e0"
];

// Simple SVG “designs” (tap regions to fill)
const SVG_DESIGNS = {
  Mandala: `
    <svg viewBox="0 0 320 320" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="320" fill="rgba(255,255,255,0)"/>
      <circle class="fill" data-id="c1" cx="160" cy="160" r="120" fill="#ffffff" stroke="rgba(90,75,122,0.25)" stroke-width="3"/>
      <circle class="fill" data-id="c2" cx="160" cy="160" r="85" fill="#ffffff" stroke="rgba(90,75,122,0.25)" stroke-width="3"/>
      <circle class="fill" data-id="c3" cx="160" cy="160" r="50" fill="#ffffff" stroke="rgba(90,75,122,0.25)" stroke-width="3"/>
      <circle class="fill" data-id="c4" cx="160" cy="160" r="20" fill="#ffffff" stroke="rgba(90,75,122,0.25)" stroke-width="3"/>
    </svg>
  `,
  Flower: `
    <svg viewBox="0 0 320 320" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="320" fill="rgba(255,255,255,0)"/>
      <circle class="fill" data-id="f0" cx="160" cy="160" r="30" fill="#fff" stroke="rgba(90,75,122,0.25)" stroke-width="3"/>
      ${Array.from({length:8}).map((_,i)=>{
        const a=i*(Math.PI*2/8);
        const x=160+90*Math.cos(a), y=160+90*Math.sin(a);
        return `<ellipse class="fill" data-id="f${i+1}" cx="${x}" cy="${y}" rx="42" ry="58" fill="#fff" stroke="rgba(90,75,122,0.25)" stroke-width="3"/>`;
      }).join("")}
    </svg>
  `,
  Butterfly: `
    <svg viewBox="0 0 320 320" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="320" fill="rgba(255,255,255,0)"/>
      <path class="fill" data-id="b1" d="M160 160 C120 90, 60 110, 70 170 C80 230, 125 240, 160 200 Z" fill="#fff" stroke="rgba(90,75,122,0.25)" stroke-width="3"/>
      <path class="fill" data-id="b2" d="M160 160 C200 90, 260 110, 250 170 C240 230, 195 240, 160 200 Z" fill="#fff" stroke="rgba(90,75,122,0.25)" stroke-width="3"/>
      <rect class="fill" data-id="b3" x="150" y="120" width="20" height="120" rx="10" fill="#fff" stroke="rgba(90,75,122,0.25)" stroke-width="3"/>
    </svg>
  `,
  Waves: `
    <svg viewBox="0 0 320 320" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="320" fill="rgba(255,255,255,0)"/>
      ${[60,120,180,240].map((y,i)=>`
        <path class="fill" data-id="w${i}" d="M20 ${y} C60 ${y-40}, 120 ${y+40}, 160 ${y}
          C200 ${y-40}, 260 ${y+40}, 300 ${y}" fill="none" stroke="rgba(90,75,122,0.25)" stroke-width="16" stroke-linecap="round"/>
      `).join("")}
      <!-- clickable wide rects -->
      ${[60,120,180,240].map((y,i)=>`
        <rect class="fill" data-id="wr${i}" x="10" y="${y-30}" width="300" height="60" rx="30" fill="#fff" opacity="0.001"/>
      `).join("")}
    </svg>
  `,
  Heart: `
    <svg viewBox="0 0 320 320" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="320" fill="rgba(255,255,255,0)"/>
      <path class="fill" data-id="h1" d="M160 270 C80 210, 40 160, 70 120
        C95 85, 140 95, 160 130
        C180 95, 225 85, 250 120
        C280 160, 240 210, 160 270 Z"
        fill="#fff" stroke="rgba(90,75,122,0.25)" stroke-width="3"/>
    </svg>
  `,
  Sunrise: `
    <svg viewBox="0 0 320 320" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="320" fill="rgba(255,255,255,0)"/>
      <rect class="fill" data-id="s1" x="30" y="200" width="260" height="70" rx="20" fill="#fff" stroke="rgba(90,75,122,0.25)" stroke-width="3"/>
      <circle class="fill" data-id="s2" cx="160" cy="200" r="70" fill="#fff" stroke="rgba(90,75,122,0.25)" stroke-width="3"/>
      ${Array.from({length:8}).map((_,i)=>{
        const a=i*(Math.PI*2/8);
        const x=160+95*Math.cos(a), y=200+95*Math.sin(a);
        return `<circle class="fill" data-id="sr${i}" cx="${x}" cy="${y}" r="10" fill="#fff" stroke="rgba(90,75,122,0.25)" stroke-width="3"/>`;
      }).join("")}
    </svg>
  `
};

function initGame(){
  const dots = $("paletteDots");
  const designChips = $("designChips");
  const mount = $("canvasMount");
  if (!dots || !designChips || !mount) return;

  const gamePage = $("gamePage") || document.body;
  const status = $("gameStatus");

  const DESIGNS = Object.keys(SVG_DESIGNS);

  let activeDesign = DESIGNS[0];
  let activeColor = PALETTE_24[0];
  let isFree = false;
  let erasing = false;

  const history = []; // undo stack of {el, prevFill}

  function renderDesigns(){
    designChips.innerHTML = "";
    DESIGNS.forEach(d=>{
      const b = document.createElement("button");
      b.className = "chip" + (d===activeDesign ? " active" : "");
      b.type = "button";
      b.textContent = d;
      b.onclick = ()=>{
        activeDesign = d;
        renderDesigns();
        loadDesign();
      };
      designChips.appendChild(b);
    });
  }

  function renderPalette(){
    dots.innerHTML = "";
    PALETTE_24.forEach(col=>{
      const d = document.createElement("div");
      d.className = "color-dot" + (col===activeColor ? " selected" : "");
      d.style.background = col;
      d.setAttribute("role","button");
      d.setAttribute("tabindex","0");
      d.onclick = ()=>{
        activeColor = col;
        erasing = false;
        $("eraserBtn")?.classList.remove("active");
        renderPalette();
        if (status) status.textContent = `Colour selected`;
      };
      dots.appendChild(d);
    });
  }

  function setMode(free){
    isFree = free;
    $("modeByNumber")?.classList.toggle("active", !free);
    $("modeFree")?.classList.toggle("active", free);
    // If your SVG has number overlays, hide them using CSS hooks
    gamePage.classList.toggle("free-mode", free);
  }

  function loadDesign(){
    mount.innerHTML = SVG_DESIGNS[activeDesign] || "<div>Design missing</div>";

    // restore saved fills if present
    const saveKey = `enigmaFill_${activeDesign}`;
    const saved = JSON.parse(localStorage.getItem(saveKey) || "{}");

    mount.querySelectorAll(".fill").forEach(el=>{
      const id = el.getAttribute("data-id");
      if (id && saved[id]) el.setAttribute("fill", saved[id]);
      // make sure it’s tappable
      el.style.cursor = "pointer";

      el.addEventListener("click", ()=>{
        const fid = el.getAttribute("data-id");
        if (!fid) return;

        const prev = el.getAttribute("fill") || "#fff";
        history.push({ el, prevFill: prev });

        const next = erasing ? "#ffffff" : activeColor;
        el.setAttribute("fill", next);

        // save
        saved[fid] = next;
        localStorage.setItem(saveKey, JSON.stringify(saved));

        if (status) status.textContent = erasing ? "Erased" : "Coloured";
      });
    });

    if (status) status.textContent = `Design: ${activeDesign} • Tap parts to colour`;
  }

  // Buttons
  $("modeByNumber")?.addEventListener("click", ()=> setMode(false));
  $("modeFree")?.addEventListener("click", ()=> setMode(true));

  $("undoBtn")?.addEventListener("click", ()=>{
    const last = history.pop();
    if (!last) return;
    last.el.setAttribute("fill", last.prevFill);

    const id = last.el.getAttribute("data-id");
    if (id){
      const saveKey = `enigmaFill_${activeDesign}`;
      const saved = JSON.parse(localStorage.getItem(saveKey) || "{}");
      saved[id] = last.prevFill;
      localStorage.setItem(saveKey, JSON.stringify(saved));
    }
  });

  $("eraserBtn")?.addEventListener("click", ()=>{
    erasing = !erasing;
    $("eraserBtn")?.classList.toggle("active", erasing);
    if (status) status.textContent = erasing ? "Eraser on" : "Eraser off";
  });

  $("clearBtn")?.addEventListener("click", ()=>{
    if (!confirm("Clear this design?")) return;
    const saveKey = `enigmaFill_${activeDesign}`;
    localStorage.removeItem(saveKey);
    history.length = 0;
    loadDesign();
  });

  $("completeBtn")?.addEventListener("click", ()=>{
    addCompletion("colour");
    alert("Saved ✅");
  });

  renderDesigns();
  renderPalette();
  setMode(false);
  loadDesign();
}

/* =========================================================
   Boot
========================================================= */
document.addEventListener("DOMContentLoaded", ()=>{
  applyThemeFromStorage();

  const themeFab = $("themeFab");
  if (themeFab) themeFab.addEventListener("click", toggleTheme);

  initBreathe();
  initQuotes();
  initMusic();
  initGame();
});
