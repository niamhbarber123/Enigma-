/* =========================================================
   Enigma Wellbeing • app.js (FULL + WORKING)
   - Theme (night mode)
   - Back navigation
   - Breathe animation (Start/Stop + completion count)
   - Quotes (motivational + web search open + save locally)
   - Music (moods + links + minutes)
   - Yoga (moods + video links)
   - Distraction (typing required to count answered + skip + end)
   - Word of the Day (daily affirmation word + ? modal)
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
    return new Date().toISOString().slice(0,10); // YYYY-MM-DD
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
      setText("Breathe in", "Slowly fill your lungs…");

      t1 = setTimeout(() => {
        if (!running) return;

        // Exhale
        circle.classList.add("exhale");
        circle.classList.remove("inhale");
        setText("Breathe out", "Gently let it go…");

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
     QUOTES (motivational + local save)
     NOTE: “Search the internet” means we open a search results page,
     because GitHub Pages can’t call APIs safely without a backend/key.
  ========================= */
  const MOTIVATIONAL_QUOTES = [
    {q:"Start where you are. Use what you have. Do what you can.", a:"Arthur Ashe"},
    {q:"It always seems impossible until it’s done.", a:"Nelson Mandela"},
    {q:"You do not have to see the whole staircase, just take the first step.", a:"Martin Luther King Jr."},
    {q:"Courage doesn’t always roar. Sometimes it’s the quiet voice saying ‘try again tomorrow.’", a:"Mary Anne Radmacher"},
    {q:"Progress, not perfection.", a:"Unknown"},
    {q:"Small steps every day.", a:"Unknown"},
    {q:"Breathe. This is just a moment.", a:"Unknown"},
    {q:"You’ve survived 100% of your hardest days.", a:"Unknown"},
    {q:"Do one thing today that your future self will thank you for.", a:"Unknown"},
    {q:"Believe you can and you’re halfway there.", a:"Theodore Roosevelt"}
  ];

  function getSavedQuotes(){
    try{
      return new Set(JSON.parse(localStorage.getItem("enigmaQuotes") || "[]"));
    }catch{
      return new Set();
    }
  }

  function saveQuotesSet(set){
    localStorage.setItem("enigmaQuotes", JSON.stringify([...set]));
  }

  function renderQuoteTiles(list, savedSet){
    const grid = $("quoteGrid");
    if (!grid) return;

    grid.innerHTML = "";
    list.forEach(item=>{
      const tile = document.createElement("div");
      tile.className = "quote-tile" + (savedSet.has(item.q) ? " saved" : "");
      tile.innerHTML = `
        <div class="quote-text">“${item.q}”</div>
        <small>— ${item.a || "Unknown"}</small>
        <button class="quote-save-btn ${savedSet.has(item.q) ? "saved" : ""}" type="button">
          ${savedSet.has(item.q) ? "💜 Saved" : "💜 Save"}
        </button>
      `;

      tile.querySelector("button").addEventListener("click", (e)=>{
        e.preventDefault();
        if (savedSet.has(item.q)) savedSet.delete(item.q);
        else savedSet.add(item.q);
        saveQuotesSet(savedSet);
        // re-render
        renderQuoteTiles(list, savedSet);
        const sc = $("savedCount");
        if (sc) sc.textContent = String(savedSet.size);
      }, { passive:false });

      grid.appendChild(tile);
    });
  }

  function initQuotes(){
    const grid = $("quoteGrid");
    if (!grid) return;

    const input = $("quoteSearch");
    const searchBtn = $("quoteSearchBtn");
    const randomBtn = $("quoteRandomBtn");
    const viewSavedBtn = $("viewSavedBtn");
    const clearSavedBtn = $("clearSavedBtn");
    const savedCount = $("savedCount");
    const status = $("quoteStatus");

    const saved = getSavedQuotes();
    if (savedCount) savedCount.textContent = String(saved.size);

    // initial list
    renderQuoteTiles(MOTIVATIONAL_QUOTES, saved);

    function openInternetSearch(query){
      const q = (query || "").trim();
      const finalQuery = q.length ? q : "motivational quotes";
      const url = `https://www.google.com/search?q=${encodeURIComponent(finalQuery)}`;
      window.open(url, "_blank", "noopener");
      if (status) status.textContent = `Opened internet search for: ${finalQuery}`;
    }

    searchBtn?.addEventListener("click", (e)=>{
      e.preventDefault();
      openInternetSearch(input?.value || "");
    }, { passive:false });

    randomBtn?.addEventListener("click", (e)=>{
      e.preventDefault();
      // pick 10 random from local list
      const copy = MOTIVATIONAL_QUOTES.slice();
      copy.sort(()=> Math.random() - 0.5);
      renderQuoteTiles(copy.slice(0, 10), getSavedQuotes());
      if (status) status.textContent = "Showing a random motivational set.";
    }, { passive:false });

    viewSavedBtn?.addEventListener("click", (e)=>{
      e.preventDefault();
      const s = getSavedQuotes();
      const savedOnly = MOTIVATIONAL_QUOTES.filter(x=> s.has(x.q));
      renderQuoteTiles(savedOnly.length ? savedOnly : [{q:"No saved quotes yet — tap 💜 on a quote to save.", a:""}], s);
      if (status) status.textContent = savedOnly.length ? "Showing saved quotes." : "No saved quotes yet.";
      if (savedCount) savedCount.textContent = String(s.size);
    }, { passive:false });

    clearSavedBtn?.addEventListener("click", (e)=>{
      e.preventDefault();
      if (!confirm("Delete all saved quotes?")) return;
      localStorage.removeItem("enigmaQuotes");
      const s = getSavedQuotes();
      if (savedCount) savedCount.textContent = String(s.size);
      renderQuoteTiles(MOTIVATIONAL_QUOTES, s);
      if (status) status.textContent = "Saved quotes deleted.";
    }, { passive:false });
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
    const page = $("musicList");
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
     DISTRACTION (typing required to count answered)
  ========================= */
  const DISTRACTION_QUESTIONS = [
    "Name 5 things you can see right now.",
    "Name 4 things you can feel (touch/texture).",
    "Name 3 things you can hear.",
    "What colour feels calming to you today?",
    "If your thoughts were weather, what’s the forecast?",
    "What’s a tiny ‘good enough’ goal for today?",
    "What’s one kind thing you’d say to a friend right now?",
    "Name 3 colours you can spot around you.",
    "What’s your favourite cosy drink?",
    "What’s one small win you’ve had this week?",
    "If you could teleport anywhere for 10 minutes, where would you go?",
    "What’s one gentle thing you can do slowly on purpose right now?"
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

    const startBtn = $("distractionStartBtn");
    const nextBtn  = $("distractionNextBtn");
    const skipBtn  = $("distractionSkipBtn");
    const endBtn   = $("distractionEndBtn");

    if (!qEl || !answeredEl || !input || !startBtn || !nextBtn || !skipBtn || !endBtn) return;

    const SESSION_KEY = "enigmaDistractionSession2";

    function setButtons(running){
      startBtn.style.display = running ? "none" : "";
      nextBtn.style.display  = running ? "" : "none";
      skipBtn.style.display  = running ? "" : "none";
      endBtn.style.display   = running ? "" : "none";
    }

    function loadSession(){
      try{
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s || s.day !== todayKey()) return null;
        if (!Array.isArray(s.order) || typeof s.i !== "number") return null;
        return s;
      }catch{
        return null;
      }
    }

    function saveSession(s){
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    }

    function clearSession(){
      localStorage.removeItem(SESSION_KEY);
    }

    function currentQuestion(s){
      const idx = s.order[s.i];
      return DISTRACTION_QUESTIONS[idx] || "Take one slow breath in… and out.";
    }

    function updateUI(s){
      qEl.textContent = currentQuestion(s);
      answeredEl.textContent = String(s.answered);
      input.value = "";
      setButtons(true);
    }

    function startNew(){
      const max = Math.min(12, DISTRACTION_QUESTIONS.length);
      const order = shuffleArray([...Array(DISTRACTION_QUESTIONS.length).keys()]).slice(0, max);

      const s = { day: todayKey(), order, i: 0, answered: 0 };
      saveSession(s);
      updateUI(s);
      input.focus?.();
    }

    function advance(s){
      if (s.i >= s.order.length - 1){
        // end automatically
        clearSession();
        setButtons(false);
        qEl.textContent = "All done ✅";
        return;
      }
      s.i += 1;
      saveSession(s);
      updateUI(s);
    }

    startBtn.addEventListener("click", (e)=>{
      e.preventDefault();
      startNew();
    }, { passive:false });

    nextBtn.addEventListener("click", (e)=>{
      e.preventDefault();
      const s = loadSession();
      if (!s) return startNew();

      const val = (input.value || "").trim();
      if (!val){
        // require typing to count as answered
        qEl.textContent = "Type any answer (even one word) — or tap Skip.";
        return;
      }

      s.answered += 1;
      saveSession(s);
      advance(s);
    }, { passive:false });

    skipBtn.addEventListener("click", (e)=>{
      e.preventDefault();
      const s = loadSession();
      if (!s) return startNew();
      advance(s);
    }, { passive:false });

    endBtn.addEventListener("click", (e)=>{
      e.preventDefault();
      clearSession();
      setButtons(false);
      qEl.textContent = "Ended ✅";
    }, { passive:false });

    // Resume
    const existing = loadSession();
    if (existing){
      updateUI(existing);
    }else{
      setButtons(false);
      qEl.textContent = "Tap Start to begin.";
      answeredEl.textContent = "0";
      input.value = "";
    }
  }

  /* =========================
   WORD OF THE DAY (Home)
========================= */
const WOTD_TIP =
  "Using these words as affirmations means you can repeat them to yourself, write them down, or think about them regularly to help cultivate those qualities within yourself.";

const WOTD_WORDS = [
  { w:"Forgiveness", d:"Letting go of resentment and allowing healing to begin." },
  { w:"Honesty", d:"Choosing truth with yourself and others, kindly and clearly." },
  { w:"Trust", d:"Allowing steady confidence to grow, one step at a time." },
  { w:"Responsibility", d:"Owning your choices and caring for what matters." },
  { w:"Flexibility", d:"Adapting with ease when plans change or life shifts." },
  { w:"Boldness", d:"Taking brave steps even when you feel uncertain." },
  { w:"Discretion", d:"Knowing what to share, and what to keep safely private." },
  { w:"Discipline", d:"Gently returning to what supports you, again and again." },
  { w:"Detail", d:"Noticing the small things that improve quality and care." },
  { w:"Prosperity", d:"Welcoming growth, wellbeing, and enoughness into your life." },
  { w:"Acceptance", d:"Meeting the moment as it is, without fighting reality." },
  { w:"Surrender", d:"Releasing control over what you cannot change." },
  { w:"Sincerity", d:"Showing up with realness, not performance." },
  { w:"Serenity", d:"A calm steadiness that stays with you through waves." },
  { w:"Humility", d:"Staying grounded, open, and willing to learn." },
  { w:"Sensitivity", d:"Listening to your feelings and needs with respect." },
  { w:"Compassion", d:"Treating yourself with the same kindness you’d offer others." },
  { w:"Leadership", d:"Guiding with care, clarity, and steady presence." },
  { w:"Integrity", d:"Being aligned with your values, even when it’s hard." },
  { w:"Action", d:"One small step that moves you forward." },
  { w:"Courage", d:"Doing it scared, and doing it anyway." },
  { w:"Creativity", d:"Letting new ideas and playful thinking flow." },
  { w:"Gentleness", d:"Softness in your thoughts, words, and pace." },
  { w:"Clarity", d:"Finding the next right thing without overthinking." },
  { w:"Balance", d:"Making room for rest, effort, and joy." },
  { w:"Fun", d:"Allowing lightness and play into your day." },
  { w:"Commitment", d:"Staying with what matters to you, patiently." },
  { w:"Patience", d:"Trusting timing and taking pressure off the process." },
  { w:"Freedom", d:"Creating space to breathe, choose, and live fully." },
  { w:"Reflection", d:"Pausing to understand and choose wisely." },
  { w:"Giving", d:"Offering care, time, or support in a way that feels right." },
  { w:"Enthusiasm", d:"Welcoming energy and interest back into your day." },
  { w:"Joy", d:"Noticing small bright moments as they appear." },
  { w:"Satisfaction", d:"Letting ‘enough’ be enough." },
  { w:"Grace", d:"Giving yourself room to be human." },
  { w:"Simplicity", d:"Reducing noise and choosing what matters most." },
  { w:"Communication", d:"Expressing needs clearly and listening with care." },
  { w:"Appropriateness", d:"Choosing what fits the moment with wisdom." },
  { w:"Strength", d:"Steady resilience—soft and powerful at once." },
  { w:"Love", d:"Warmth, care, and connection—starting with you." },
  { w:"Tenderness", d:"Handling yourself with gentler hands." },
  { w:"Perseverance", d:"Continuing, even slowly, even imperfectly." },
  { w:"Reliability", d:"Being someone you can count on—especially to yourself." },
  { w:"Initiative", d:"Starting small without waiting for perfect readiness." },
  { w:"Confidence", d:"Trusting your ability to cope and learn." },
  { w:"Authenticity", d:"Being real, not polished." },
  { w:"Harmony", d:"Letting different parts of life work together peacefully." },
  { w:"Pleasure", d:"Allowing good feelings without guilt." },
  { w:"Risk", d:"Trying something new with care and courage." },
  { w:"Efficiency", d:"Doing what matters with less strain." },
  { w:"Spontaneity", d:"Letting yourself be light and flexible in the moment." },
  { w:"Fulfilment", d:"A sense of meaning built through small, aligned choices." }
];

function stableDailyIndex(max){
  // stable per day (same on refresh) without relying on API
  const key = todayKey();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return hash % max;
}

function initWordOfTheDay(){
  const pill = $("wotdPill");
  if (!pill) return;

  const wordEl = $("wotdWord");
  const descEl = $("wotdDesc");
  const infoBtn = $("wotdInfoBtn");

  const pick = WOTD_WORDS[stableDailyIndex(WOTD_WORDS.length)];

  if (wordEl) wordEl.textContent = pick.w;
  if (descEl) descEl.textContent = pick.d;

  // prevent anchor jump
  pill.addEventListener("click", (e)=> e.preventDefault(), { passive:false });

  if (infoBtn){
    infoBtn.addEventListener("click", (e)=>{
      e.preventDefault();
      e.stopPropagation();
      alert(WOTD_TIP); // ✅ only confirmed sentence
    }, { passive:false });
  }
}
  /* =========================
     PROGRESS page
  ========================= */
  function initProgress(){
    const page = $("progressPage");
    if (!page) return;

    const day = todayKey();

    // breathed today
    const breatheStore = JSON.parse(localStorage.getItem("enigmaBreatheCompletes") || "{}");
    const breathedToday = Number(breatheStore[day] || 0);

    // music today/total
    const musicStore = JSON.parse(localStorage.getItem("enigmaMusicMinutes") || "{}");
    const musicToday = Number(musicStore[day] || 0);
    const musicTotal = Object.values(musicStore).reduce((a,v)=>a + Number(v||0), 0);

    // saved quotes total
    let savedQuotesCount = 0;
    try{
      savedQuotesCount = JSON.parse(localStorage.getItem("enigmaQuotes") || "[]").length;
    }catch{ savedQuotesCount = 0; }

    $("pBreathedToday") && ($("pBreathedToday").textContent = String(breathedToday));
    $("pMusicToday") && ($("pMusicToday").textContent = String(musicToday));
    $("pSavedQuotes") && ($("pSavedQuotes").textContent = String(savedQuotesCount));
    $("pMusicTotal") && ($("pMusicTotal").textContent = String(musicTotal));
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
    initYoga();
    initDistraction();
    initWordOfDay();
    initProgress();
  });

})();
