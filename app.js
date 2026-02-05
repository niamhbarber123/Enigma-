/* =========================================================
   Enigma • app.js (FULL)
   - Theme (night mode)
   - Back navigation
   - Word of the Day (daily)
   - Breathe animation (Start/Stop)
   - Quotes (internet search + random motivational + save/unsave)
   - Music (moods + links + minutes)
   - Yoga (moods + video links)
   - Distraction (typing required to count “Answered”)
========================================================= */

(function () {
  "use strict";

  /* =========================
     Helpers
  ========================= */
  function $(id){ return document.getElementById(id); }

  window.enigmaBack = function(){
    if (history.length > 1) history.back();
    else location.href = "index.html";
  };

  function todayKey(){
    return new Date().toISOString().split("T")[0];
  }

  function debounce(fn, wait){
    let t;
    return (...args)=>{
      clearTimeout(t);
      t = setTimeout(()=>fn(...args), wait);
    };
  }

  /* =========================
     THEME (Night mode)
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
     WORD OF THE DAY (daily, local)
     - deterministic pick by date (no API needed)
  ========================= */
  const WORDS = [
    { w:"Soothe", d:"To gently calm or comfort." },
    { w:"Steady", d:"Even, stable, not shaken by big feelings." },
    { w:"Gentle", d:"Soft and kind; not harsh or forceful." },
    { w:"Ground", d:"To come back to the present moment." },
    { w:"Breathe", d:"A reminder: slow in, long out." },
    { w:"Ease", d:"Less effort. More softness." },
    { w:"Pause", d:"A small stop that creates space." },
    { w:"Restore", d:"To return strength and calm." },
    { w:"Light", d:"A little brightness you can notice." },
    { w:"Safe", d:"Supported, protected, okay in this moment." },
    { w:"Quiet", d:"A calmer internal volume." },
    { w:"Release", d:"Let a little tension go." },
    { w:"Anchor", d:"Something you can return to again and again." },
    { w:"Kindness", d:"Softness towards yourself counts." },
    { w:"Patience", d:"Allow time. You’re not behind." },
    { w:"Balance", d:"Not perfect—just supported." },
    { w:"Clarity", d:"A little more understanding." },
    { w:"Courage", d:"Doing the next small thing anyway." },
    { w:"Hope", d:"A future that can still be okay." },
    { w:"Enough", d:"You are not required to be more right now." }
  ];

  function hashDateYYYYMMDD(str){
    // "2026-02-05" -> 20260205
    const n = parseInt(String(str).replaceAll("-",""), 10);
    return Number.isFinite(n) ? n : 20260101;
  }

  function initWordOfDay(){
    const wEl = $("wotdWord");
    const dEl = $("wotdDef");
    if (!wEl || !dEl) return;

    const seed = hashDateYYYYMMDD(todayKey());
    const idx = seed % WORDS.length;
    const item = WORDS[idx];

    wEl.textContent = item.w;
    // keep your “Your calm space” vibe but show definition underneath
    dEl.textContent = item.d;
  }

  /* =========================
     BREATHE (reliable)
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

      circle.classList.add("inhale");
      circle.classList.remove("exhale");
      setText("Inhale", "Breathe in slowly…");

      t1 = setTimeout(() => {
        if (!running) return;

        circle.classList.add("exhale");
        circle.classList.remove("inhale");
        setText("Exhale", "Breathe out gently…");

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
     QUOTES (internet + save/unsave)
     Uses Quotable API: /quotes/random and /search/quotes  [oai_citation:1‡GitHub](https://github.com/lukePeavey/quotable)
  ========================= */
  const QUOTABLE_BASE = "https://api.quotable.io";
  const SAVED_QUOTES_KEY = "enigmaSavedQuotesV3"; // store array of ids

  function getSavedSet(){
    return new Set(JSON.parse(localStorage.getItem(SAVED_QUOTES_KEY) || "[]"));
  }

  function setSavedSet(set){
    localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(Array.from(set)));
  }

  function updateSavedCount(){
    const c = $("savedCount");
    if (c) c.textContent = String(getSavedSet().size);
  }

  function quoteTile({ _id, content, author }){
    const saved = getSavedSet();
    const isSaved = saved.has(_id);

    const tile = document.createElement("div");
    tile.className = "quote-tile" + (isSaved ? " saved" : "");
    tile.innerHTML = `
      <div style="font-weight:900;color:#5a4b7a; line-height:1.35;">“${escapeHtml(content)}”</div>
      <small>— ${escapeHtml(author || "Unknown")}</small>
      <button class="quote-save-btn ${isSaved ? "saved" : ""}" type="button">
        ${isSaved ? "💜 Saved" : "💜 Save"}
      </button>
    `;

    const btn = tile.querySelector("button");
    btn.addEventListener("click", (e)=>{
      e.preventDefault();
      const s = getSavedSet();
      if (s.has(_id)) s.delete(_id);
      else s.add(_id);
      setSavedSet(s);
      tile.classList.toggle("saved", s.has(_id));
      btn.classList.toggle("saved", s.has(_id));
      btn.textContent = s.has(_id) ? "💜 Saved" : "💜 Save";
      updateSavedCount();
    }, { passive:false });

    return tile;
  }

  function escapeHtml(str){
    return String(str || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  async function fetchRandomMotivational(limit=12){
    // tags are optional; if tags fail, we fallback to unfiltered random
    const url1 = `${QUOTABLE_BASE}/quotes/random?limit=${limit}&tags=inspirational|motivational|wisdom`;
    const url2 = `${QUOTABLE_BASE}/quotes/random?limit=${limit}`;
    try{
      const r = await fetch(url1, { cache:"no-store" });
      if (!r.ok) throw new Error("tagged random failed");
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    }catch{
      const r2 = await fetch(url2, { cache:"no-store" });
      const data2 = await r2.json();
      return Array.isArray(data2) ? data2 : [];
    }
  }

  async function searchQuotesOnline(query, limit=20){
    const q = encodeURIComponent(query.trim());
    const url = `${QUOTABLE_BASE}/search/quotes?query=${q}&fields=content,author,tags&limit=${limit}`;
    const r = await fetch(url, { cache:"no-store" });
    if (!r.ok) throw new Error("search failed");
    const data = await r.json();
    return Array.isArray(data?.results) ? data.results : [];
  }

  async function initQuotes(){
    const grid = $("quoteGrid");
    if (!grid) return;

    const status = $("quoteStatus");
    const input = $("quoteSearch");
    const searchBtn = $("quoteSearchBtn");
    const randomBtn = $("quoteRandomBtn");
    const viewSavedBtn = $("viewSavedBtn");
    const clearSavedBtn = $("clearSavedBtn");

    updateSavedCount();

    async function renderList(list){
      grid.innerHTML = "";
      if (!list.length){
        grid.innerHTML = `<div class="gentle-text">No results. Try a different search.</div>`;
        return;
      }
      list.forEach(item=> grid.appendChild(quoteTile(item)));
    }

    async function loadRandom(){
      if (status) status.textContent = "Loading motivational quotes…";
      try{
        const list = await fetchRandomMotivational(14);
        await renderList(list);
        if (status) status.textContent = "Tap 💜 to save any quote you like.";
      }catch{
        if (status) status.textContent = "Couldn’t load quotes right now (check connection).";
        grid.innerHTML = `<div class="gentle-text">Try again in a moment.</div>`;
      }
    }

    async function runSearch(){
      const q = (input?.value || "").trim();
      if (!q){
        loadRandom();
        return;
      }
      if (status) status.textContent = `Searching: “${q}”…`;
      try{
        const list = await searchQuotesOnline(q, 20);
        await renderList(list);
        if (status) status.textContent = `Results for “${q}”. Tap 💜 to save.`;
      }catch{
        if (status) status.textContent = "Search failed (API blocked or offline). Showing random instead.";
        loadRandom();
      }
    }

    if (searchBtn) searchBtn.addEventListener("click", (e)=>{ e.preventDefault(); runSearch(); }, { passive:false });
    if (randomBtn) randomBtn.addEventListener("click", (e)=>{ e.preventDefault(); loadRandom(); }, { passive:false });

    if (input){
      input.addEventListener("keydown", (e)=>{
        if (e.key === "Enter") runSearch();
      });
      // optional: debounce search while typing (comment out if you don’t want it)
      input.addEventListener("input", debounce(()=>{}, 250));
    }

    if (viewSavedBtn){
      viewSavedBtn.addEventListener("click", async ()=>{
        const ids = Array.from(getSavedSet());
        if (!ids.length) return alert("No saved quotes yet.");

        // Quotable supports GET /quotes/:id; we’ll fetch a few quickly
        if (status) status.textContent = "Loading saved quotes…";
        const out = [];
        for (const id of ids.slice(0, 30)){
          try{
            const r = await fetch(`${QUOTABLE_BASE}/quotes/${encodeURIComponent(id)}`, { cache:"no-store" });
            if (!r.ok) continue;
            out.push(await r.json());
          }catch{}
        }
        await renderList(out);
        if (status) status.textContent = "Your saved quotes (tap 💜 to unsave).";
      });
    }

    if (clearSavedBtn){
      clearSavedBtn.addEventListener("click", ()=>{
        if (!confirm("Delete all saved quotes?")) return;
        localStorage.setItem(SAVED_QUOTES_KEY, "[]");
        updateSavedCount();
        loadRandom();
      });
    }

    // initial load
    loadRandom();
  }

  /* =========================
     MUSIC (moods + links + minutes)
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
     YOGA (moods + video links)
  ========================= */
  const YOGA_MOODS = ["All","Anxiety","Stress","Sleep","Morning","Stiff body"];
  const YOGA_VIDEOS = [
    { t:"10 min Yoga for Anxiety", m:"Anxiety", u:"https://www.youtube.com/results?search_query=10+minute+yoga+for+anxiety" },
    { t:"15 min Gentle Yoga for Stress", m:"Stress", u:"https://www.youtube.com/results?search_query=15+minute+gentle+yoga+for+stress" },
    { t:"Yoga for Sleep (wind down)", m:"Sleep", u:"https://www.youtube.com/results?search_query=yoga+for+sleep+bedtime" },
    { t:"Morning Yoga (wake up)", m:"Morning", u:"https://www.youtube.com/results?search_query=morning+yoga+10+minutes" },
    { t:"Yoga for stiff back/hips", m:"Stiff body", u:"https://www.youtube.com/results?search_query=yoga+for+stiff+back+hips" },
    { t:"Gentle yoga (all levels)", m:"All", u:"https://www.youtube.com/results?search_query=gentle+yoga+all+levels" }
  ];

  function initYoga(){
    const page = $("yogaPage");
    if (!page) return;

    const chipsWrap = $("yogaMoodChips");
    const list = $("yogaVideoList");
    if (!chipsWrap || !list) return;

    let mood = localStorage.getItem("enigmaYogaMood") || "All";

    function render(){
      chipsWrap.innerHTML = "";
      YOGA_MOODS.forEach(m=>{
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip" + (m === mood ? " active" : "");
        b.textContent = m;
        b.addEventListener("click", ()=>{
          mood = m;
          localStorage.setItem("enigmaYogaMood", mood);
          render();
        });
        chipsWrap.appendChild(b);
      });

      list.innerHTML = "";
      YOGA_VIDEOS
        .filter(x => mood === "All" || x.m === mood || x.m === "All")
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

    render();
  }

  /* =========================
     DISTRACTION (typing required to count Answered)
  ========================= */
  const DISTRACTION_QUESTIONS = [
    "Name 5 things you can see right now.",
    "What colour feels calming to you today?",
    "If today had a soundtrack, what would it be called?",
    "What’s one kind thing you’d say to a friend feeling this way?",
    "What’s a tiny ‘safe’ plan for the next 10 minutes?",
    "What’s a film or series that feels comforting?",
    "Name 3 colours you can spot around you.",
    "What’s one gentle thing you can say to yourself right now?",
    "What’s a small win you’ve had this week?",
    "What’s one thing that’s ‘not urgent’ right now?"
  ];

  function shuffleArray(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function initDistraction(){
    const card = $("distractionCard");
    if (!card) return;

    const qEl = $("distractionQuestion");
    const answeredEl = $("distractionAnsweredCount");
    const input = $("distractionInput");
    const hint = $("distractionHint");
    const startBtn = $("distractionStartBtn");
    const nextBtn = $("distractionNextBtn");
    const skipBtn = $("distractionSkipBtn");
    const endBtn = $("distractionEndBtn");

    if (!qEl || !answeredEl || !input || !startBtn || !nextBtn || !skipBtn || !endBtn) return;

    const KEY = "enigmaDistractionV2";

    function load(){
      try{
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s || s.day !== todayKey()) return null;
        return s;
      }catch{ return null; }
    }

    function save(s){
      localStorage.setItem(KEY, JSON.stringify(s));
    }

    function clear(){
      localStorage.removeItem(KEY);
    }

    function setButtons(running){
      startBtn.style.display = running ? "none" : "";
      nextBtn.style.display = running ? "" : "none";
      skipBtn.style.display = running ? "" : "none";
      endBtn.style.display = running ? "" : "none";
      input.style.display = running ? "" : "none";
      hint.style.display = running ? "" : "none";
    }

    function render(s){
      qEl.textContent = s.questions[s.i] || "Take one slow breath in… and out.";
      answeredEl.textContent = String(s.answered);
      input.value = "";
      nextBtn.disabled = true;
      nextBtn.classList.remove("active");
    }

    function newSession(){
      const questions = shuffleArray(DISTRACTION_QUESTIONS).slice(0, 10);
      const s = { day: todayKey(), questions, i: 0, answered: 0 };
      save(s);
      setButtons(true);
      render(s);
    }

    function next(s){
      if (s.i >= s.questions.length - 1){
        finish(s);
        return;
      }
      s.i += 1;
      save(s);
      render(s);
    }

    function finish(s){
      clear();
      setButtons(false);
      qEl.textContent = "All done. You can start again any time.";
      answeredEl.textContent = String(s.answered);
    }

    startBtn.addEventListener("click", (e)=>{
      e.preventDefault();
      newSession();
    }, { passive:false });

    input.addEventListener("input", ()=>{
      const ok = input.value.trim().length > 0;
      nextBtn.disabled = !ok;
      nextBtn.classList.toggle("active", ok);
    });

    nextBtn.addEventListener("click", (e)=>{
      e.preventDefault();
      const s = load() || (newSession(), load());
      if (!s) return;
      if (input.value.trim().length === 0) return;
      s.answered += 1;      // only answered count
      save(s);
      next(s);
    }, { passive:false });

    skipBtn.addEventListener("click", (e)=>{
      e.preventDefault();
      const s = load() || (newSession(), load());
      if (!s) return;
      next(s); // does NOT increment answered
    }, { passive:false });

    endBtn.addEventListener("click", (e)=>{
      e.preventDefault();
      const s = load();
      finish(s || { answered: 0 });
    }, { passive:false });

    // resume if active today
    const existing = load();
    if (existing){
      setButtons(true);
      render(existing);
    }else{
      setButtons(false);
      qEl.textContent = "Tap Start to begin.";
      answeredEl.textContent = "0";
    }
  }

  /* =========================
     BOOT
  ========================= */
  document.addEventListener("DOMContentLoaded",()=>{
    applyTheme();
    initTheme();
    initWordOfDay();
    initBreathe();
    initQuotes();
    initMusic();
    initYoga();
    initDistraction();
  });

})();
