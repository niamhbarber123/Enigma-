/* =========================================================
   Enigma • app.js (WORKING + FIXES)
   Fixes:
   - Quotes render as separate cards (quote-tile)
   - Uses optional online quote search (Quotable) + fallback local list
========================================================= */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  window.enigmaBack = function(){
    if (history.length > 1) history.back();
    else location.href = "index.html";
  };

  function todayKey(){
    return new Date().toISOString().split("T")[0];
  }

  /* =========================
     THEME
  ========================= */
  function applyTheme(){
    const t = localStorage.getItem("enigmaTheme") || "light";
    document.body.classList.toggle("night", t === "night");
  }
  function toggleTheme(){
    const night = document.body.classList.toggle("night");
    localStorage.setItem("enigmaTheme", night ? "night" : "light");
  }
  function initTheme(){
    const btn = $("themeFab");
    if (btn) btn.addEventListener("click", toggleTheme);
  }

  /* =========================
     BREATHE
  ========================= */
  function initBreathe(){
    const page = $("breathePage");
    if (!page) return;

    const circle = $("breatheCircle");
    const phase  = $("breathPhase");
    const tip    = $("breathTip");
    const start  = $("breathStartBtn");
    const stop   = $("breathStopBtn");
    const done   = $("breathCompleteBtn");

    if (!circle || !phase || !tip || !start || !stop) return;

    let running = false;
    let t1 = null;
    let t2 = null;

    function setText(p, m){
      phase.textContent = p;
      tip.textContent = m;
      // Make the phase more “centered feeling” by ensuring it’s just a single word
    }

    function clearTimers(){
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      t1 = t2 = null;
    }

    function reset(){
      clearTimers();
      circle.classList.remove("inhale","exhale");
      setText("Ready", "Tap Start to begin.");
    }

    function cycle(){
      if (!running) return;

      // Inhale
      circle.classList.add("inhale");
      circle.classList.remove("exhale");
      setText("Breathe in", "Slow and gentle…");

      t1 = setTimeout(() => {
        if (!running) return;

        // Exhale
        circle.classList.add("exhale");
        circle.classList.remove("inhale");
        setText("Breathe out", "Let your shoulders drop…");

        t2 = setTimeout(() => {
          if (!running) return;
          cycle();
        }, 4000);

      }, 4000);
    }

    start.addEventListener("click", (e) => {
      e.preventDefault();
      if (running) return;
      running = true;
      cycle();
    }, { passive:false });

    stop.addEventListener("click", (e) => {
      e.preventDefault();
      running = false;
      reset();
    }, { passive:false });

    if (done){
      done.addEventListener("click", (e) => {
        e.preventDefault();
        const key = "enigmaBreatheCompletes";
        const obj = JSON.parse(localStorage.getItem(key) || "{}");
        const day = todayKey();
        obj[day] = (obj[day] || 0) + 1;
        localStorage.setItem(key, JSON.stringify(obj));
        done.textContent = "Saved ✅";
        setTimeout(()=> done.textContent = "Completed ✅", 1200);
      }, { passive:false });
    }

    reset();
  }

  /* =========================
     QUOTES (cards + saved)
  ========================= */
  const LOCAL_QUOTES = [
    { q:"Start where you are. Use what you have. Do what you can.", a:"Arthur Ashe" },
    { q:"You do not have to see the whole staircase, just take the first step.", a:"Martin Luther King Jr." },
    { q:"It always seems impossible until it’s done.", a:"Nelson Mandela" },
    { q:"Small steps every day.", a:"Unknown" },
    { q:"Progress, not perfection.", a:"Unknown" },
    { q:"Breathe. This is just a moment.", a:"Unknown" },
    { q:"Courage doesn’t always roar. Sometimes it’s the quiet voice saying: try again tomorrow.", a:"Mary Anne Radmacher" }
  ];

  const SAVED_KEY = "enigmaSavedQuotes_v2";

  function loadSaved(){
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); }
    catch { return []; }
  }
  function saveSaved(arr){
    localStorage.setItem(SAVED_KEY, JSON.stringify(arr));
  }
  function isSameQuote(a,b){
    return (a.q || "").trim() === (b.q || "").trim() && (a.a || "").trim() === (b.a || "").trim();
  }

  function renderQuoteCards(quotes){
    const grid = $("quoteGrid");
    if (!grid) return;

    const saved = loadSaved();

    grid.innerHTML = "";
    quotes.forEach(item=>{
      const isSaved = saved.some(s => isSameQuote(s, item));

      const tile = document.createElement("div");
      tile.className = "quote-tile" + (isSaved ? " saved" : "");
      tile.innerHTML = `
        <div class="quote-text">“${item.q}”</div>
        <small>— ${item.a || "Unknown"}</small>
        <button class="quote-save-btn ${isSaved ? "saved" : ""}" type="button">
          ${isSaved ? "💜 Saved" : "💜 Save"}
        </button>
      `;

      tile.querySelector("button").addEventListener("click", (e)=>{
        e.preventDefault();
        const now = loadSaved();
        const exists = now.some(s => isSameQuote(s, item));
        const next = exists ? now.filter(s => !isSameQuote(s, item)) : [item, ...now];
        saveSaved(next);
        renderQuoteCards(quotes);
        const countEl = $("savedCount");
        if (countEl) countEl.textContent = String(loadSaved().length);
      }, { passive:false });

      grid.appendChild(tile);
    });
  }

  async function fetchQuotesOnline(query){
    // Works on GitHub Pages (client-side fetch).
    // If it fails, we fall back to local quotes.
    const url = `https://api.quotable.io/search/quotes?query=${encodeURIComponent(query)}&limit=12`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Quote fetch failed");
    const data = await res.json();
    const results = (data && data.results) ? data.results : [];
    return results.map(r => ({ q: r.content, a: r.author || "Unknown" }));
  }

  function initQuotes(){
    const grid = $("quoteGrid");
    if (!grid) return;

    const searchInput = $("quoteSearch");
    const savedCount = $("savedCount");
    const toggleSavedOnlyBtn = $("toggleSavedOnlyBtn");
    const viewSavedBtn = $("viewSavedBtn");
    const clearSavedBtn = $("clearSavedBtn");

    // initial render
    const saved = loadSaved();
    if (savedCount) savedCount.textContent = String(saved.length);
    renderQuoteCards(LOCAL_QUOTES);

    // Search (Enter)
    if (searchInput){
      searchInput.addEventListener("keydown", async (e)=>{
        if (e.key !== "Enter") return;
        e.preventDefault();

        const q = (searchInput.value || "").trim();
        if (!q){
          renderQuoteCards(LOCAL_QUOTES);
          return;
        }

        grid.innerHTML = `<div class="gentle-text">Searching…</div>`;
        try{
          const online = await fetchQuotesOnline(q);
          renderQuoteCards(online.length ? online : LOCAL_QUOTES);
        }catch{
          renderQuoteCards(LOCAL_QUOTES);
        }
      });
    }

    // Show saved only
    if (toggleSavedOnlyBtn){
      let savedOnly = false;
      toggleSavedOnlyBtn.addEventListener("click", ()=>{
        savedOnly = !savedOnly;
        toggleSavedOnlyBtn.textContent = savedOnly ? "Show all" : "Show saved only";
        if (savedOnly) renderQuoteCards(loadSaved());
        else renderQuoteCards(LOCAL_QUOTES);
        if (savedCount) savedCount.textContent = String(loadSaved().length);
      });
    }

    // View saved
    if (viewSavedBtn){
      viewSavedBtn.addEventListener("click", ()=>{
        renderQuoteCards(loadSaved());
        if (savedCount) savedCount.textContent = String(loadSaved().length);
      });
    }

    // Clear saved
    if (clearSavedBtn){
      clearSavedBtn.addEventListener("click", ()=>{
        if (!confirm("Delete all saved quotes?")) return;
        saveSaved([]);
        if (savedCount) savedCount.textContent = "0";
        renderQuoteCards(LOCAL_QUOTES);
      });
    }
  }

  /* =========================
     MUSIC (kept from your build)
  ========================= */
  const MUSIC_MOODS = ["All","Anxious","Stressed","Focus","Sleep"];
  const TRACKS = [
    {t:"Calm breathing music",m:"Anxious",u:"https://www.youtube.com/watch?v=odADwWzHR24"},
    {t:"Lo-fi focus mix",m:"Focus",u:"https://www.youtube.com/watch?v=jfKfPfyJRdk"},
    {t:"Sleep music",m:"Sleep",u:"https://www.youtube.com/watch?v=DWcJFNfaw9c"},
    {t:"Relaxing piano",m:"Stressed",u:"https://www.youtube.com/watch?v=1ZYbU82GVz4"},
    {t:"Ocean waves",m:"Sleep",u:"https://www.youtube.com/watch?v=eKFTSSKCzWA"}
  ];

  function initMusic(){
    const page = $("musicPage");
    if (!page) return;

    const chipsWrap = $("moodChips");
    const list = $("musicList");
    const minsTodayEl = $("minsToday");
    const minsTotalEl = $("minsTotal");
    const startBtn = $("startListenBtn");
    const endBtn = $("endListenBtn");
    const status = $("listenStatus");

    if (!chipsWrap || !list) return;

    let mood = localStorage.getItem("enigmaMusicMood") || "All";
    let start = null;

    function renderTracks(){
      list.innerHTML = "";
      TRACKS
        .filter(x => mood === "All" || x.m === mood)
        .forEach(x=>{
          const a = document.createElement("a");
          a.href = x.u;
          a.target = "_blank";
          a.rel = "noopener";
          a.className = "music-btn";
          a.innerHTML = `<span>${x.t}</span><span>▶</span>`;
          list.appendChild(a);
        });
    }

    function renderChips(){
      chipsWrap.innerHTML = "";
      MUSIC_MOODS.forEach(m=>{
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip" + (m === mood ? " active" : "");
        b.textContent = m;
        b.addEventListener("click", ()=>{
          mood = m;
          localStorage.setItem("enigmaMusicMood", mood);
          renderChips();
          renderTracks();
        });
        chipsWrap.appendChild(b);
      });
    }

    function loadMinutes(){
      const day = todayKey();
      const store = JSON.parse(localStorage.getItem("enigmaMusicMinutes") || "{}");
      const today = Number(store[day] || 0);
      const total = Object.values(store).reduce((a,v)=>a + Number(v||0), 0);

      if (minsTodayEl) minsTodayEl.textContent = String(today);
      if (minsTotalEl) minsTotalEl.textContent = String(total);
    }

    function saveMinutes(addMins){
      const day = todayKey();
      const store = JSON.parse(localStorage.getItem("enigmaMusicMinutes") || "{}");
      store[day] = Number(store[day] || 0) + addMins;
      localStorage.setItem("enigmaMusicMinutes", JSON.stringify(store));
    }

    if (startBtn && status){
      startBtn.addEventListener("click", ()=>{
        if (start) return;
        start = Date.now();
        status.textContent = "Listening… tap End session when finished.";
      });
    }

    if (endBtn && status){
      endBtn.addEventListener("click", ()=>{
        if (!start) return;
        const mins = Math.max(1, Math.round((Date.now() - start) / 60000));
        start = null;
        saveMinutes(mins);
        loadMinutes();
        status.textContent = `Saved ${mins} min ✅`;
        setTimeout(()=> status.textContent = "No active session.", 1400);
      });
    }

    renderChips();
    renderTracks();
    loadMinutes();
  }

  /* =========================
     BOOT
  ========================= */
  document.addEventListener("DOMContentLoaded",()=>{
    applyTheme();
    initTheme();
    initBreathe();
    initQuotes();
    initMusic();
  });

})();
