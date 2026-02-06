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
     WORD OF THE DAY (daily affirmations + modal)
  ========================= */
  const WOTD = [
    { w:"Forgiveness", d:"Letting go of what weighs you down so you can move forward lighter." },
    { w:"Honesty", d:"Speaking and living in a way that matches what’s true for you." },
    { w:"Trust", d:"Allowing yourself to rely on what is steady—step by step." },
    { w:"Responsibility", d:"Owning your choices with kindness and clarity." },
    { w:"Flexibility", d:"Adapting without losing your centre." },
    { w:"Boldness", d:"Taking gentle risks even when you feel unsure." },
    { w:"Discretion", d:"Choosing what to share, and when, to protect your peace." },
    { w:"Discipline", d:"Small steady actions that support your future self." },
    { w:"Detail", d:"Noticing the small things that improve your day." },
    { w:"Prosperity", d:"Making room for abundance—time, energy, love, and opportunity." },
    { w:"Acceptance", d:"Meeting this moment as it is, without a fight." },
    { w:"Surrender", d:"Releasing control of what you can’t carry alone." },
    { w:"Sincerity", d:"Being real—soft, honest, and wholehearted." },
    { w:"Serenity", d:"A calm presence that you can return to, again and again." },
    { w:"Humility", d:"Staying grounded while still valuing yourself." },
    { w:"Sensitivity", d:"Treating your feelings as information, not a problem." },
    { w:"Compassion", d:"Offering yourself the care you would give to someone you love." },
    { w:"Leadership", d:"Guiding yourself with courage and steadiness." },
    { w:"Integrity", d:"Aligning what you think, say, and do." },
    { w:"Action", d:"One small step that turns intention into progress." },
    { w:"Courage", d:"Feeling fear and moving forward gently anyway." },
    { w:"Creativity", d:"Letting yourself make, imagine, and explore without pressure." },
    { w:"Gentleness", d:"Soft strength—being kind without giving up." },
    { w:"Clarity", d:"Choosing what matters most and letting the rest quieten." },
    { w:"Balance", d:"Making space for effort and rest." },
    { w:"Fun", d:"Letting yourself enjoy something small, just because." },
    { w:"Commitment", d:"Keeping a promise to yourself in a realistic way." },
    { w:"Patience", d:"Trusting the pace of small improvements." },
    { w:"Freedom", d:"Creating space to breathe, choose, and begin again." },
    { w:"Reflection", d:"Pausing to understand and choose wisely." },
    { w:"Giving", d:"Sharing warmth—without abandoning your own needs." },
    { w:"Enthusiasm", d:"Welcoming energy and interest back into your day." },
    { w:"Joy", d:"Noticing what is good, even in small doses." },
    { w:"Satisfaction", d:"Allowing ‘enough’ to be enough." },
    { w:"Grace", d:"Softening your inner voice and giving yourself room." },
    { w:"Simplicity", d:"Reducing the noise so the next step feels easier." },
    { w:"Communication", d:"Saying what you need clearly and kindly." },
    { w:"Appropriateness", d:"Choosing what fits this moment without overdoing it." },
    { w:"Strength", d:"Staying with yourself through hard moments." },
    { w:"Love", d:"Offering warmth to yourself and others, without conditions." },
    { w:"Tenderness", d:"Treating your heart like it matters." },
    { w:"Perseverance", d:"Continuing gently, even if it’s slow." },
    { w:"Reliability", d:"Being someone you can count on—especially to yourself." },
    { w:"Initiative", d:"Starting small without waiting for perfect." },
    { w:"Confidence", d:"Trusting your ability to figure it out." },
    { w:"Authenticity", d:"Letting yourself be real, not perfect." },
    { w:"Harmony", d:"Creating calm alignment inside and around you." },
    { w:"Pleasure", d:"Letting comfort and enjoyment be allowed." },
    { w:"Risk", d:"Trying something new in a safe, manageable way." },
    { w:"Efficiency", d:"Making the next step simpler and lighter." },
    { w:"Spontaneity", d:"Letting yourself choose something uplifting in the moment." },
    { w:"Fulfilment", d:"Building a life that feels meaningful, one piece at a time." }
  ];

  function hashStr(str){
    let h = 2166136261;
    for (let i=0; i<str.length; i++){
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  function initWordOfDay(){
    const pill = $("wotdPill");
    const wordEl = $("wotdWord");
    const infoBtn = $("wotdInfoBtn");

    const modal = $("wotdModal");
    const closeBg = $("wotdCloseBg");
    const closeBtn = $("wotdCloseBtn");
    const closeBtn2 = $("wotdCloseBtn2");
    const modalWord = $("wotdModalWord");
    const modalDesc = $("wotdModalDesc");

    if (!pill || !wordEl || !infoBtn || !modal || !modalWord || !modalDesc) return;

    const idx = hashStr(todayKey()) % WOTD.length;
    const item = WOTD[idx];

    wordEl.textContent = item.w;
    modalWord.textContent = item.w;
    modalDesc.textContent = item.d;

    function openModal(){
      modal.classList.add("show");
      modal.setAttribute("aria-hidden","false");
    }
    function closeModal(){
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden","true");
    }

    // tapping the tile opens
    pill.addEventListener("click", (e)=>{
      e.preventDefault();
      openModal();
    });

    // ? button tap must NOT trigger the <a>
    function infoHandler(e){
      e.preventDefault();
      e.stopPropagation();
      openModal();
    }
    infoBtn.addEventListener("touchstart", infoHandler, { passive:false });
    infoBtn.addEventListener("click", infoHandler, { passive:false });

    closeBg?.addEventListener("click", closeModal);
    closeBtn?.addEventListener("click", closeModal);
    closeBtn2?.addEventListener("click", closeModal);

    document.addEventListener("keydown", (e)=>{
      if (e.key === "Escape") closeModal();
    });
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
