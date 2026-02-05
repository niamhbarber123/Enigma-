/* =========================================================
   Enigma • app.js (FULL)
   Fixes:
   - Theme toggle (moon)
   - Back button helper
   - Breathe: start/stop + animated circle + phase text
   - Quotes: tiles + save/unsave + daily shuffle + search + saved-only
   - Music: mood chips + track buttons + minutes listened
   - Colour: design chips + 20+ palette dots + mode toggle + free-mode hides numbers
========================================================= */

(function () {
  "use strict";

  /* -------------------------
     Helpers
  ------------------------- */

  function $(id) { return document.getElementById(id); }

  // Back button function used in HTML onclick
  window.enigmaBack = function enigmaBack() {
    if (history.length > 1) history.back();
    else window.location.href = "index.html";
  };

  function todayKey() {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  /* -------------------------
     Theme (Night mode)
  ------------------------- */

  function applyThemeFromStorage() {
    const saved = localStorage.getItem("enigmaTheme") || "light";
    document.body.classList.toggle("night", saved === "night");
  }

  function toggleTheme() {
    const isNight = document.body.classList.toggle("night");
    localStorage.setItem("enigmaTheme", isNight ? "night" : "light");
  }

  function initThemeButton() {
    const btn = $("themeFab");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleTheme();
    }, { passive: false });
  }

  /* =========================================================
     BREATHE
  ========================================================= */

  function initBreathe() {
    const page = $("breathePage");
    if (!page) return;

    const phaseEl = $("breathPhase");
    const tipEl = $("breathTip");
    const circle = $("breatheCircle");
    const startBtn = $("breathStartBtn");
    const stopBtn = $("breathStopBtn");
    const completeBtn = $("breathCompleteBtn");

    if (!phaseEl || !tipEl || !circle || !startBtn || !stopBtn) return;

    let running = false;
    let timer = null;

    // 4-4 rhythm: inhale 4s, exhale 4s (loop)
    const INHALE_MS = 4000;
    const EXHALE_MS = 4000;

    function setPhase(name, tip) {
      phaseEl.textContent = name;
      tipEl.textContent = tip;
    }

    function animateInhale() {
      // circle grows
      circle.classList.remove("exhale");
      circle.classList.add("inhale");
      setPhase("Inhale", "Breathe in slowly through your nose…");
    }

    function animateExhale() {
      // circle shrinks
      circle.classList.remove("inhale");
      circle.classList.add("exhale");
      setPhase("Exhale", "Breathe out gently…");
    }

    function stop() {
      running = false;
      if (timer) clearTimeout(timer);
      timer = null;

      circle.classList.remove("inhale", "exhale");
      setPhase("Ready", "Tap Start to begin.");
    }

    function loop() {
      if (!running) return;

      animateInhale();
      timer = setTimeout(() => {
        if (!running) return;
        animateExhale();
        timer = setTimeout(() => {
          if (!running) return;
          loop();
        }, EXHALE_MS);
      }, INHALE_MS);
    }

    startBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (running) return;
      running = true;
      loop();
    }, { passive: false });

    stopBtn.addEventListener("click", (e) => {
      e.preventDefault();
      stop();
    }, { passive: false });

    if (completeBtn) {
      completeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const key = "enigmaBreatheCompletes";
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        const day = todayKey();
        data[day] = (data[day] || 0) + 1;
        localStorage.setItem(key, JSON.stringify(data));
        completeBtn.textContent = "Saved ✅";
        setTimeout(() => (completeBtn.textContent = "Completed ✅"), 1200);
      }, { passive: false });
    }

    // Ensure initial UI
    stop();
  }

  /* =========================================================
     QUOTES (tiles + save/unsave + daily shuffle)
  ========================================================= */

  const QUOTES = [
    { q: "Nothing can dim the light that shines from within.", a: "Maya Angelou" },
    { q: "No one can make you feel inferior without your consent.", a: "Eleanor Roosevelt" },
    { q: "I raise up my voice—not so that I can shout, but so that those without a voice can be heard.", a: "Malala Yousafzai" },
    { q: "Well-behaved women seldom make history.", a: "Laurel Thatcher Ulrich" },
    { q: "Power is not given to you. You have to take it.", a: "Beyoncé" },
    { q: "I have learned over the years that when one’s mind is made up, this diminishes fear.", a: "Rosa Parks" },
    { q: "If you don’t like the road you’re walking, start paving another one.", a: "Dolly Parton" },
    { q: "My peace is my priority.", a: "Affirmation" },
    { q: "You don’t have to be perfect to be powerful.", a: "Affirmation" },
    { q: "Do not wait for permission to be yourself.", a: "Affirmation" }
  ];

  function quoteId(item) {
    return `${item.a}::${item.q}`;
  }

  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function dailyShuffledQuotes(list) {
    const today = todayKey();
    const seed = parseInt(today.replaceAll("-", ""), 10) || 20260101;
    const rand = mulberry32(seed);

    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function initQuotes() {
    const grid = $("quoteGrid");
    if (!grid) return;

    const search = $("quoteSearch");
    const savedCount = $("savedCount");
    const viewBtn = $("viewSavedBtn");
    const clearBtn = $("clearSavedBtn");
    const savedOnlyBtn = $("toggleSavedOnlyBtn");

    const SAVED_KEY = "enigmaSavedQuotesV2";
    const saved = new Set(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"));

    let showSavedOnly = false;

    function updateCount() {
      if (savedCount) savedCount.textContent = String(saved.size);
    }

    function render() {
      const query = (search?.value || "").trim().toLowerCase();
      const list = dailyShuffledQuotes(QUOTES);

      const filtered = list.filter(item => {
        const id = quoteId(item);
        if (showSavedOnly && !saved.has(id)) return false;
        if (!query) return true;
        return item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query);
      });

      grid.innerHTML = "";

      filtered.forEach(item => {
        const id = quoteId(item);
        const tile = document.createElement("div");
        tile.className = "quote-tile" + (saved.has(id) ? " saved" : "");
        tile.innerHTML = `
          <div style="font-weight:900;color:#5a4b7a; line-height:1.35;">“${item.q}”</div>
          <small>— ${item.a}</small>
          <button class="quote-save-btn ${saved.has(id) ? "saved" : ""}" type="button" aria-label="Save quote">
            ${saved.has(id) ? "💜 Saved" : "💜 Save"}
          </button>
        `;

        const btn = tile.querySelector(".quote-save-btn");
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (saved.has(id)) saved.delete(id);
          else saved.add(id);
          localStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(saved)));
          updateCount();
          render();
        }, { passive: false });

        grid.appendChild(tile);
      });

      updateCount();
    }

    updateCount();
    render();

    if (search) {
      search.addEventListener("input", () => render());
    }

    if (savedOnlyBtn) {
      savedOnlyBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showSavedOnly = !showSavedOnly;
        savedOnlyBtn.classList.toggle("active", showSavedOnly);
        savedOnlyBtn.textContent = showSavedOnly ? "Showing saved only" : "Show saved only";
        render();
      }, { passive: false });
    }

    if (viewBtn) {
      viewBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const arr = Array.from(saved);
        if (!arr.length) return alert("No saved quotes yet.");
        alert("Saved quotes:\n\n" + arr.map(x => "• " + x.split("::")[1]).join("\n\n"));
      }, { passive: false });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!confirm("Delete all saved quotes?")) return;
        localStorage.setItem(SAVED_KEY, "[]");
        saved.clear();
        updateCount();
        render();
      }, { passive: false });
    }
  }

 /* =========================
   MUSIC (YouTube links)
========================= */

const MOODS = ["All","Anxious","Stressed","Low mood","Focus","Sleep"];

const TRACKS = [
  { title:"Calm breathing music (1 hour)", mood:"Anxious", url:"https://www.youtube.com/watch?v=odADwWzHR24" },
  { title:"Relaxing piano for stress", mood:"Stressed", url:"https://www.youtube.com/watch?v=1ZYbU82GVz4" },
  { title:"Gentle uplifting ambient", mood:"Low mood", url:"https://www.youtube.com/watch?v=2OEL4P1Rz04" },
  { title:"Lo-fi focus mix", mood:"Focus", url:"https://www.youtube.com/watch?v=jfKfPfyJRdk" },
  { title:"Sleep music (dark screen)", mood:"Sleep", url:"https://www.youtube.com/watch?v=DWcJFNfaw9c" },
  { title:"Nature sounds playlist", mood:"All", url:"https://www.youtube.com/watch?v=eKFTSSKCzWA" },
  { title:"Meditation music playlist", mood:"All", url:"https://www.youtube.com/watch?v=inpok4MKVLM" }
];

let currentMood = "All";
let sessionStart = null;

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initMusic();
});

function initMusic(){
  if(!document.getElementById("musicPage")) return;

  renderMoodChips();
  renderTracks();
  loadMinutes();

  document.getElementById("startListenBtn").onclick = startSession;
  document.getElementById("endListenBtn").onclick = endSession;
}

/* ---------- Moods ---------- */
function renderMoodChips(){
  const wrap = document.getElementById("moodChips");
  const label = document.getElementById("moodLabel");

  wrap.innerHTML = "";
  MOODS.forEach(m=>{
    const btn = document.createElement("button");
    btn.className = "chip" + (m===currentMood ? " active" : "");
    btn.textContent = m;

    btn.onclick = ()=>{
      currentMood = m;
      renderMoodChips();
      renderTracks();
      label.textContent = "Showing: " + m;
    };

    wrap.appendChild(btn);
  });
}

/* ---------- Tracks ---------- */
function renderTracks(){
  const list = document.getElementById("musicList");
  list.innerHTML = "";

  TRACKS.filter(t => currentMood==="All" || t.mood===currentMood)
    .forEach(t=>{
      const a = document.createElement("a");
      a.href = t.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.className = "music-btn";
      a.innerHTML = `<span>${t.title}</span><span>▶︎</span>`;
      list.appendChild(a);
    });
}

/* ---------- Minutes listened ---------- */
function startSession(){
  if(sessionStart) return;
  sessionStart = Date.now();
  document.getElementById("listenStatus").textContent = "Listening session active…";
}

function endSession(){
  if(!sessionStart) return;

  const mins = Math.max(1, Math.round((Date.now() - sessionStart)/60000));
  sessionStart = null;

  const todayKey = "enigmaMinsToday";
  const totalKey = "enigmaMinsTotal";

  const today = Number(localStorage.getItem(todayKey) || 0) + mins;
  const total = Number(localStorage.getItem(totalKey) || 0) + mins;

  localStorage.setItem(todayKey, today);
  localStorage.setItem(totalKey, total);

  loadMinutes();
  document.getElementById("listenStatus").textContent =
    `Session saved (+${mins} min).`;
}

function loadMinutes(){
  document.getElementById("minsToday").textContent =
    localStorage.getItem("enigmaMinsToday") || 0;
  document.getElementById("minsTotal").textContent =
    localStorage.getItem("enigmaMinsTotal") || 0;
}
  /* =========================================================
     COLOUR (design chips + palette circles + mode)
  ========================================================= */

  const DESIGNS = [
    { key: "mandala", label: "Mandala" },
    { key: "flower", label: "Flower" },
    { key: "butterfly", label: "Butterfly" },
    { key: "waves", label: "Waves" },
    { key: "heart", label: "Heart" },
    { key: "sunrise", label: "Sunrise" }
  ];

  // 20+ calming colours (slightly deeper than before)
  const PALETTE = [
    "#6B4FA3", "#9B7BD0", "#C3B2EA", "#F1EAFE", "#4F6BD8",
    "#7AA6F9", "#9DD1FF", "#2E8B8B", "#63BFAF", "#A7E2D3",
    "#2C7A4B", "#66B36A", "#B8E6A7", "#F2D46D", "#F5B86B",
    "#E98E7A", "#F2A7B8", "#D46AA6", "#6A6A74", "#B9B9C6",
    "#1F3A93", "#355C7D"
  ];

  function initGame() {
    // Your game page likely uses ids: designChips, paletteDots, modeCbnBtn, modeFreeBtn
    const designWrap = $("designChips");
    const paletteWrap = $("paletteDots");
    const modeCbn = $("modeCbnBtn");
    const modeFree = $("modeFreeBtn");

    // If page doesn't exist, exit.
    if (!designWrap && !paletteWrap && !modeCbn && !modeFree) return;

    // Page container used to apply "free-mode" class
    const pageMain = document.querySelector("main.page") || document.body;

    let activeDesign = localStorage.getItem("enigmaDesign") || "";
    let activeColor = localStorage.getItem("enigmaColor") || PALETTE[0];
    let mode = localStorage.getItem("enigmaColourMode") || "cbn"; // cbn | free

    function applyMode() {
      const isFree = mode === "free";
      pageMain.classList.toggle("free-mode", isFree);
      if (modeCbn) modeCbn.classList.toggle("active", !isFree);
      if (modeFree) modeFree.classList.toggle("active", isFree);
    }

    function renderDesigns() {
      if (!designWrap) return;
      designWrap.innerHTML = "";
      DESIGNS.forEach(d => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip" + (d.key === activeDesign ? " active" : "");
        b.textContent = d.label;
        b.addEventListener("click", (e) => {
          e.preventDefault();
          activeDesign = d.key;
          localStorage.setItem("enigmaDesign", activeDesign);
          renderDesigns();

          // If you later plug in real SVG/canvas designs, trigger it here:
          // loadDesign(activeDesign);
        }, { passive: false });
        designWrap.appendChild(b);
      });
    }

    function renderPalette() {
      if (!paletteWrap) return;
      paletteWrap.innerHTML = "";
      PALETTE.forEach(col => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "color-dot" + (col === activeColor ? " selected" : "");
        dot.style.background = col;
        dot.setAttribute("aria-label", `Pick colour ${col}`);
        dot.addEventListener("click", (e) => {
          e.preventDefault();
          activeColor = col;
          localStorage.setItem("enigmaColor", activeColor);
          renderPalette();

          // If you later plug in colouring logic, set brush colour here:
          // setBrushColor(activeColor);
        }, { passive: false });
        paletteWrap.appendChild(dot);
      });
    }

    if (modeCbn) {
      modeCbn.addEventListener("click", (e) => {
        e.preventDefault();
        mode = "cbn";
        localStorage.setItem("enigmaColourMode", mode);
        applyMode();
      }, { passive: false });
    }

    if (modeFree) {
      modeFree.addEventListener("click", (e) => {
        e.preventDefault();
        mode = "free";
        localStorage.setItem("enigmaColourMode", mode);
        applyMode();
      }, { passive: false });
    }

    renderDesigns();
    renderPalette();
    applyMode();
  }

  /* =========================================================
     Boot
  ========================================================= */

  document.addEventListener("DOMContentLoaded", () => {
    applyThemeFromStorage();
    initThemeButton();

    initBreathe();
    initQuotes();
    initMusic();
    initGame();
  });
})();
