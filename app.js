/* =========================================================
   Enigma Wellbeing • app.js (FULL)
   - Theme toggle (🌙/☀️)
   - Back navigation
   - Breathe (Start/Stop + save completes)
   - Quotes (search + random + save)
   - Music (mood chips + button links + minutes)
   - Yoga (mood chips + button links)
   - Progress (reads saved stats)
   - Word of the Day (daily deterministic + modal)
   - Distraction (typed answers required for Next; skip allowed; progress = answered only)
========================================================= */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  /* =========================
     Helpers
  ========================= */
  window.enigmaBack = function () {
    if (history.length > 1) history.back();
    else location.href = "index.html";
  };

  function todayKey() {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  }

  function safeJSON(raw, fallback) {
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  /* =========================
     THEME (🌙 / ☀️)
  ========================= */
  function setThemeIcon() {
    const btn = $("themeFab");
    if (!btn) return;
    btn.textContent = document.body.classList.contains("night") ? "☀️" : "🌙";
  }

  function applyTheme() {
    const t = localStorage.getItem("enigmaTheme") || "light";
    document.body.classList.toggle("night", t === "night");
    setThemeIcon();
  }

  function toggleTheme() {
    const night = document.body.classList.toggle("night");
    localStorage.setItem("enigmaTheme", night ? "night" : "light");
    setThemeIcon();
  }

  function initTheme() {
    const btn = $("themeFab");
    if (btn) btn.addEventListener("click", toggleTheme);
    setThemeIcon();
  }

  /* =========================
     BREATHE (buttons + cycle)
     NOTE: Your CSS controls sizes/colours.
     JS just toggles inhale/exhale classes.
  ========================= */
  function initBreathe() {
    const page = $("breathePage");
    if (!page) return;

    const circle = $("breatheCircle");
    const phase = $("breathPhase");
    const tip = $("breathTip");
    const start = $("breathStartBtn");
    const stop = $("breathStopBtn");
    const done = $("breathCompleteBtn");

    if (!circle || !phase || !tip || !start || !stop) return;

    let running = false;
    let t1 = null;
    let t2 = null;

    // Slower rhythm (seconds)
    const INHALE_MS = 6000; // inhale slower
    const EXHALE_MS = 6000; // exhale slower

    function setText(p, m) {
      phase.textContent = p;
      tip.textContent = m;
    }

    function clearTimers() {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      t1 = t2 = null;
    }

    function reset() {
      clearTimers();
      circle.classList.remove("inhale", "exhale");
      setText("Ready", "Tap Start to begin.");
    }

    // IMPORTANT: requested behaviour:
    // - inhale = smaller (retract)
    // - exhale = bigger (expand)
    function cycle() {
      if (!running) return;

      // Inhale (retract)
      circle.classList.add("inhale");
      circle.classList.remove("exhale");
      setText("Breathe in", "Slow inhale…");

      t1 = setTimeout(() => {
        if (!running) return;

        // Exhale (expand)
        circle.classList.add("exhale");
        circle.classList.remove("inhale");
        setText("Breathe out", "Slow exhale…");

        t2 = setTimeout(() => {
          if (!running) return;
          cycle();
        }, EXHALE_MS);
      }, INHALE_MS);
    }

    start.addEventListener("click", (e) => {
      e.preventDefault();
      if (running) return;
      running = true;
      cycle();
    });

    stop.addEventListener("click", (e) => {
      e.preventDefault();
      running = false;
      reset();
    });

    if (done) {
      done.addEventListener("click", (e) => {
        e.preventDefault();
        const key = "enigmaBreatheCompletes";
        const obj = safeJSON(localStorage.getItem(key) || "{}", {});
        const day = todayKey();
        obj[day] = (obj[day] || 0) + 1;
        localStorage.setItem(key, JSON.stringify(obj));
        done.textContent = "Saved ✅";
        setTimeout(() => (done.textContent = "Completed ✅"), 1200);
      });
    }

    reset();
  }

  /* =========================
     QUOTES (search internet via Quotable)
     - If fetch fails, falls back to built-ins
  ========================= */
  const FALLBACK_QUOTES = [
    { q: "Start where you are. Use what you have. Do what you can.", a: "Arthur Ashe" },
    { q: "It always seems impossible until it’s done.", a: "Nelson Mandela" },
    { q: "Small steps every day.", a: "Unknown" },
    { q: "Progress, not perfection.", a: "Unknown" }
  ];

  const QUOTE_SAVED_KEY = "enigmaSavedQuotesV2";

  function getSavedQuotes() {
    return safeJSON(localStorage.getItem(QUOTE_SAVED_KEY) || "[]", []);
  }

  function setSavedQuotes(list) {
    localStorage.setItem(QUOTE_SAVED_KEY, JSON.stringify(list));
  }

  function isSameQuote(a, b) {
    return (a.q || "").trim() === (b.q || "").trim() && (a.a || "").trim() === (b.a || "").trim();
  }

  function renderQuotes(list, { showSave = true } = {}) {
    const grid = $("quoteGrid");
    if (!grid) return;

    const saved = getSavedQuotes();

    grid.innerHTML = "";
    list.forEach((item) => {
      const tile = document.createElement("div");
      tile.className = "quote-tile";

      const savedAlready = saved.some((s) => isSameQuote(s, item));

      tile.innerHTML = `
        <div class="quote-text">“${item.q}”</div>
        <small>— ${item.a || "Unknown"}</small>
        ${showSave ? `<button class="quote-save-btn ${savedAlready ? "saved" : ""}" type="button">
          ${savedAlready ? "💜 Saved" : "💜 Save"}
        </button>` : ""}
      `;

      if (showSave) {
        const btn = tile.querySelector("button");
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const now = getSavedQuotes();
          const exists = now.some((s) => isSameQuote(s, item));
          const next = exists ? now.filter((s) => !isSameQuote(s, item)) : [item, ...now];
          setSavedQuotes(next);
          initQuotes(); // re-render (updates Saved count + buttons)
        });
      }

      grid.appendChild(tile);
    });
  }

  async function fetchQuotesByQuery(query) {
    // Quotable supports searching by keyword
    const url = `https://api.quotable.io/search/quotes?query=${encodeURIComponent(query)}&limit=12`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Quote fetch failed");
    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    return results.map((r) => ({ q: r.content, a: r.author }));
  }

  async function fetchRandomMotivational() {
    // tag=motivational exists on quotable
    const url = "https://api.quotable.io/random?tags=motivational|inspirational";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Random quote fetch failed");
    const r = await res.json();
    return [{ q: r.content, a: r.author }];
  }

  function initQuotes() {
    const grid = $("quoteGrid");
    if (!grid) return;

    const searchInput = $("quoteSearch");
    const searchBtn = $("quoteSearchBtn");
    const randomBtn = $("quoteRandomBtn");
    const viewSavedBtn = $("viewSavedBtn");
    const clearSavedBtn = $("clearSavedBtn");
    const savedCount = $("savedCount");
    const status = $("quoteStatus");

    const saved = getSavedQuotes();
    if (savedCount) savedCount.textContent = String(saved.length);

    // Default view: show a few motivational quotes (fallback)
    if (!grid.dataset.initialized) {
      grid.dataset.initialized = "1";
      renderQuotes(FALLBACK_QUOTES);
    }

    if (searchBtn && searchInput) {
      searchBtn.addEventListener("click", async () => {
        const q = (searchInput.value || "").trim();
        if (!q) return;
        if (status) status.textContent = "Searching…";
        try {
          const list = await fetchQuotesByQuery(q);
          if (!list.length) {
            renderQuotes(FALLBACK_QUOTES);
            if (status) status.textContent = "No results — showing some motivational quotes instead.";
          } else {
            renderQuotes(list);
            if (status) status.textContent = `Showing results for “${q}”. Tap 💜 to save.`;
          }
        } catch {
          renderQuotes(FALLBACK_QUOTES);
          if (status) status.textContent = "Couldn’t load quotes right now — showing saved/fallback quotes.";
        }
      });
    }

    if (randomBtn) {
      randomBtn.addEventListener("click", async () => {
        if (status) status.textContent = "Loading a random quote…";
        try {
          const list = await fetchRandomMotivational();
          renderQuotes(list);
          if (status) status.textContent = "Random motivational quote. Tap 💜 to save.";
        } catch {
          renderQuotes(FALLBACK_QUOTES);
          if (status) status.textContent = "Couldn’t load a random quote — showing fallback quotes.";
        }
      });
    }

    if (viewSavedBtn) {
      viewSavedBtn.addEventListener("click", () => {
        const now = getSavedQuotes();
        if (!now.length) {
          renderQuotes(FALLBACK_QUOTES);
          if (status) status.textContent = "No saved quotes yet. Tap 💜 to save one.";
        } else {
          renderQuotes(now);
          if (status) status.textContent = "Showing your saved quotes.";
        }
        const count = $("savedCount");
        if (count) count.textContent = String(getSavedQuotes().length);
      });
    }

    if (clearSavedBtn) {
      clearSavedBtn.addEventListener("click", () => {
        setSavedQuotes([]);
        const count = $("savedCount");
        if (count) count.textContent = "0";
        renderQuotes(FALLBACK_QUOTES);
        if (status) status.textContent = "Saved quotes cleared.";
      });
    }
  }

  /* =========================
     MUSIC (moods + links + minutes)
     FIX: renders each link as a separate .music-btn
  ========================= */
  const MUSIC_MOODS = ["All", "Anxious", "Stressed", "Focus", "Sleep"];
  const TRACKS = [
    { t: "Calm breathing music", m: "Anxious", u: "https://www.youtube.com/watch?v=odADwWzHR24" },
    { t: "Lo-fi focus mix", m: "Focus", u: "https://www.youtube.com/watch?v=jfKfPfyJRdk" },
    { t: "Sleep music", m: "Sleep", u: "https://www.youtube.com/watch?v=DWcJFNfaw9c" },
    { t: "Relaxing piano", m: "Stressed", u: "https://www.youtube.com/watch?v=1ZYbU82GVz4" },
    { t: "Ocean waves", m: "Sleep", u: "https://www.youtube.com/watch?v=eKFTSSKCzWA" }
  ];

  function initMusic() {
    const page = $("musicPage");
    // music.html doesn't have id="musicPage" in your snippet,
    // so also detect by required elements:
    const chipsWrap = $("moodChips");
    const list = $("musicList");
    if (!chipsWrap || !list) return;

    const minsTodayEl = $("minsToday");
    const minsTotalEl = $("minsTotal");
    const startBtn = $("startListenBtn");
    const endBtn = $("endListenBtn");
    const status = $("listenStatus");

    let mood = localStorage.getItem("enigmaMusicMood") || "All";
    let start = null;

    function renderTracks() {
      list.innerHTML = "";

      TRACKS
        .filter((x) => mood === "All" || x.m === mood)
        .forEach((x) => {
          const a = document.createElement("a");
          a.href = x.u;
          a.target = "_blank";
          a.rel = "noopener";
          a.className = "music-btn";
          a.innerHTML = `<span>${x.t}</span><span>▶</span>`;
          list.appendChild(a);
        });

      // If no tracks in that mood, show helpful note
      if (!list.children.length) {
        const div = document.createElement("div");
        div.className = "gentle-text";
        div.textContent = "No tracks for that mood yet.";
        list.appendChild(div);
      }
    }

    function renderChips() {
      chipsWrap.innerHTML = "";
      MUSIC_MOODS.forEach((m) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip" + (m === mood ? " active" : "");
        b.textContent = m;
        b.addEventListener("click", () => {
          mood = m;
          localStorage.setItem("enigmaMusicMood", mood);
          renderChips();
          renderTracks();
        });
        chipsWrap.appendChild(b);
      });
    }

    function loadMinutes() {
      const day = todayKey();
      const store = safeJSON(localStorage.getItem("enigmaMusicMinutes") || "{}", {});
      const today = Number(store[day] || 0);
      const total = Object.values(store).reduce((a, v) => a + Number(v || 0), 0);

      if (minsTodayEl) minsTodayEl.textContent = String(today);
      if (minsTotalEl) minsTotalEl.textContent = String(total);
    }

    function saveMinutes(addMins) {
      const day = todayKey();
      const store = safeJSON(localStorage.getItem("enigmaMusicMinutes") || "{}", {});
      store[day] = Number(store[day] || 0) + addMins;
      localStorage.setItem("enigmaMusicMinutes", JSON.stringify(store));
    }

    if (startBtn && status) {
      startBtn.addEventListener("click", () => {
        if (start) return;
        start = Date.now();
        status.textContent = "Listening… tap End session when finished.";
      });
    }

    if (endBtn && status) {
      endBtn.addEventListener("click", () => {
        if (!start) return;
        const mins = Math.max(1, Math.round((Date.now() - start) / 60000));
        start = null;
        saveMinutes(mins);
        loadMinutes();
        status.textContent = `Saved ${mins} min ✅`;
        setTimeout(() => (status.textContent = "No active session."), 1400);
      });
    }

    renderChips();
    renderTracks();
    loadMinutes();
  }

  /* =========================
     YOGA (moods + button links)
     FIX: renders each video as a separate .music-btn
  ========================= */
  const YOGA_MOODS = ["All", "Anxiety", "Stress", "Sleep", "Morning", "Stiff body"];
  const YOGA_VIDEOS = [
    { t: "10 min Yoga for Anxiety", m: "Anxiety", u: "https://www.youtube.com/results?search_query=10+minute+yoga+for+anxiety" },
    { t: "15 min Gentle Yoga for Stress", m: "Stress", u: "https://www.youtube.com/results?search_query=15+minute+gentle+yoga+for+stress" },
    { t: "Yoga for Sleep (wind down)", m: "Sleep", u: "https://www.youtube.com/results?search_query=yoga+for+sleep+bedtime" },
    { t: "Morning Yoga (wake up)", m: "Morning", u: "https://www.youtube.com/results?search_query=morning+yoga+10+minutes" },
    { t: "Yoga for stiff back/hips", m: "Stiff body", u: "https://www.youtube.com/results?search_query=yoga+for+stiff+back+hips" },
    { t: "Gentle yoga (all levels)", m: "All", u: "https://www.youtube.com/results?search_query=gentle+yoga+all+levels" }
  ];

  function initYoga() {
    const chipsWrap = $("yogaMoodChips");
    const list = $("yogaVideoList");
    if (!chipsWrap || !list) return;

    let mood = localStorage.getItem("enigmaYogaMood") || "All";

    function render() {
      chipsWrap.innerHTML = "";
      YOGA_MOODS.forEach((m) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip" + (m === mood ? " active" : "");
        b.textContent = m;
        b.addEventListener("click", () => {
          mood = m;
          localStorage.setItem("enigmaYogaMood", mood);
          render();
        });
        chipsWrap.appendChild(b);
      });

      list.innerHTML = "";
      YOGA_VIDEOS
        .filter((x) => mood === "All" || x.m === mood || x.m === "All")
        .forEach((x) => {
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
     PROGRESS
  ========================= */
  function initProgress() {
    const page = $("progressPage");
    if (!page) return;

    const pBreathedToday = $("pBreathedToday");
    const pMusicToday = $("pMusicToday");
    const pSavedQuotes = $("pSavedQuotes");
    const pMusicTotal = $("pMusicTotal");

    const day = todayKey();

    // Breathe completes per day
    const breatheStore = safeJSON(localStorage.getItem("enigmaBreatheCompletes") || "{}", {});
    const breathedToday = Number(breatheStore[day] || 0);

    // Music minutes
    const musicStore = safeJSON(localStorage.getItem("enigmaMusicMinutes") || "{}", {});
    const musicToday = Number(musicStore[day] || 0);
    const musicTotal = Object.values(musicStore).reduce((a, v) => a + Number(v || 0), 0);

    // Saved quotes
    const savedQuotes = getSavedQuotes();

    if (pBreathedToday) pBreathedToday.textContent = String(breathedToday);
    if (pMusicToday) pMusicToday.textContent = String(musicToday);
    if (pMusicTotal) pMusicTotal.textContent = String(musicTotal);
    if (pSavedQuotes) pSavedQuotes.textContent = String(savedQuotes.length);
  }

  /* =========================
     WORD OF THE DAY (daily deterministic + modal)
  ========================= */
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seedFromToday() {
    const s = todayKey().replaceAll("-", "");
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : 20260101;
  }

  const WOTD = [
    { w: "Forgiveness", d: "Releasing resentment so you can move forward lighter." },
    { w: "Honesty", d: "Choosing truth with kindness—to yourself and others." },
    { w: "Trust", d: "Allowing confidence in yourself, others, or the process." },
    { w: "Responsibility", d: "Owning your choices and responding with intention." },
    { w: "Flexibility", d: "Adapting without losing your centre." },
    { w: "Boldness", d: "Taking brave steps even when you feel unsure." },
    { w: "Discretion", d: "Using good judgement about what to share and when." },
    { w: "Discipline", d: "Doing what helps you—even when motivation fades." },
    { w: "Detail", d: "Noticing the small things that improve the whole." },
    { w: "Prosperity", d: "Growing resources and wellbeing in a healthy way." },
    { w: "Acceptance", d: "Letting reality be what it is—so you can respond wisely." },
    { w: "Surrender", d: "Loosening the grip on what you can’t control." },
    { w: "Sincerity", d: "Being genuine—your real self is enough." },
    { w: "Serenity", d: "A quiet steadiness, even when life is loud." },
    { w: "Humility", d: "Staying grounded and open to learning." },
    { w: "Sensitivity", d: "Noticing feelings and needs—yours and others’." },
    { w: "Compassion", d: "Meeting struggle with warmth instead of judgement." },
    { w: "Leadership", d: "Guiding with care, clarity, and example." },
    { w: "Integrity", d: "Aligning actions with values—even in small moments." },
    { w: "Action", d: "One doable step—progress over perfection." },
    { w: "Courage", d: "Feeling fear and still choosing what matters." },
    { w: "Creativity", d: "Letting new ideas and possibilities appear." },
    { w: "Gentleness", d: "Soft strength—especially with yourself." },
    { w: "Clarity", d: "Seeing what matters most, without the noise." },
    { w: "Balance", d: "Making space for rest, effort, joy, and recovery." },
    { w: "Fun", d: "Allowing lightness—your nervous system needs it." },
    { w: "Commitment", d: "Staying with what you choose, one day at a time." },
    { w: "Patience", d: "Letting growth take the time it takes." },
    { w: "Freedom", d: "Creating room to breathe, choose, and be yourself." },
    { w: "Reflection", d: "Looking back kindly to learn and reset." },
    { w: "Giving", d: "Offering support without emptying yourself." },
    { w: "Enthusiasm", d: "Inviting energy and interest into the day." },
    { w: "Joy", d: "Noticing what feels bright—even briefly." },
    { w: "Satisfaction", d: "Letting ‘enough’ be enough." },
    { w: "Grace", d: "Moving with softness through imperfect moments." },
    { w: "Simplicity", d: "Reducing the load—one less thing at a time." },
    { w: "Communication", d: "Sharing clearly, listening carefully." },
    { w: "Appropriateness", d: "Matching your response to the moment wisely." },
    { w: "Strength", d: "Endurance, boundaries, and quiet resilience." },
    { w: "Love", d: "Choosing care—for yourself and others." },
    { w: "Tenderness", d: "Being gentle with what’s sensitive." },
    { w: "Perseverance", d: "Keeping going, especially on the slow days." },
    { w: "Reliability", d: "Being steady and consistent—small promises kept." },
    { w: "Initiative", d: "Starting before you feel ready." },
    { w: "Confidence", d: "Trusting your ability to figure things out." },
    { w: "Authenticity", d: "Being real—no performance required." },
    { w: "Harmony", d: "Finding calm alignment within and around you." },
    { w: "Pleasure", d: "Letting good moments count." },
    { w: "Risk", d: "Trying something new, gently and safely." },
    { w: "Efficiency", d: "Using energy wisely—not doing everything." },
    { w: "Spontaneity", d: "Letting life surprise you in kind ways." },
    { w: "Fulfilment", d: "A sense of meaning—built over time." }
  ];

  function pickWotd() {
    const rand = mulberry32(seedFromToday());
    const i = Math.floor(rand() * WOTD.length);
    return WOTD[i] || { w: "Serenity", d: "A quiet steadiness, even when life is loud." };
  }

  function showWotdModal(word, desc) {
    const modal = $("wotdModal");
    const backdrop = $("wotdBackdrop");
    const closeBtn = $("wotdCloseBtn");
    const mw = $("wotdModalWord");
    const md = $("wotdModalDesc");
    if (!modal || !mw || !md) return;

    mw.textContent = word;
    md.textContent = desc;

    modal.classList.add("show");
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");

    const close = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      modal.style.display = "none";
    };

    if (backdrop) backdrop.addEventListener("click", close, { once: true });
    if (closeBtn) closeBtn.addEventListener("click", close, { once: true });
  }

  function initWotd() {
    const wEl = $("wotdWord");
    const dEl = $("wotdDesc");
    const infoBtn = $("wotdInfoBtn");
    const tile = $("wotdTile");
    if (!wEl || !dEl || !tile) return;

    const { w, d } = pickWotd();
    wEl.textContent = w;
    dEl.textContent = d;

    tile.addEventListener("click", (e) => {
      if (e.target && e.target.id === "wotdInfoBtn") return;
      e.preventDefault();
      showWotdModal(w, d);
    });

    if (infoBtn) {
      infoBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showWotdModal(w, d);
      });
    }
  }

  /* =========================
     DISTRACTION (typed answers required for Next)
  ========================= */
  const DISTRACTION_QUESTIONS = [
    "Name 5 things you can see right now.",
    "Name 4 things you can feel (touch/texture).",
    "Name 3 things you can hear.",
    "Name 2 things you can smell.",
    "Name 1 thing you can taste (or would like to taste).",
    "If you could teleport anywhere for 10 minutes, where would you go?",
    "What colour feels calming to you today?",
    "What’s a tiny ‘safe’ plan for the next 10 minutes?",
    "What’s one kind thing you’d say to a friend feeling this way?",
    "What’s your favourite cosy drink?",
    "If today had a soundtrack, what would it be called?",
    "If you could design a calm room, what 3 items are in it?",
    "What’s a small win you’ve had this week?",
    "What’s something you’re looking forward to (even small)?",
    "What would your ‘calm alter ego’ do next?",
    "What’s the softest thing you own?",
    "Name 3 colours you can spot around you.",
    "What’s one gentle stretch you can do right now?",
    "What is a ‘good enough’ goal for today?",
    "What’s one small thing you can do to be kind to yourself right now?"
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function initDistraction() {
    const card = $("distractionCard");
    if (!card) return;

    const qEl = $("distractionQuestion");
    const answeredEl = $("distractionAnsweredCount");
    const inputWrap = $("distractionInputWrap");
    const input = $("distractionInput");
    const startBtn = $("distractionStartBtn");
    const nextBtn = $("distractionNextBtn");
    const skipBtn = $("distractionSkipBtn");
    const endBtn = $("distractionEndBtn");

    if (!qEl || !answeredEl || !startBtn || !nextBtn || !skipBtn || !endBtn || !inputWrap || !input) return;

    const KEY = "enigmaDistractionSessionV2";

    function setRunning(running) {
      startBtn.style.display = running ? "none" : "";
      nextBtn.style.display = running ? "" : "none";
      skipBtn.style.display = running ? "" : "none";
      endBtn.style.display = running ? "" : "none";
      inputWrap.style.display = running ? "" : "none";
      if (!running) input.value = "";
    }

    function load() {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const s = safeJSON(raw, null);
      if (!s || s.day !== todayKey()) return null;
      if (!Array.isArray(s.order) || typeof s.i !== "number" || typeof s.answered !== "number") return null;
      return s;
    }

    function save(s) {
      localStorage.setItem(KEY, JSON.stringify(s));
    }

    function clear() {
      localStorage.removeItem(KEY);
    }

    function currentQ(s) {
      const idx = s.order[s.i];
      return DISTRACTION_QUESTIONS[idx] || "Take one slow breath in… and out.";
    }

    function render(s) {
      qEl.textContent = currentQ(s);
      answeredEl.textContent = String(s.answered);
      input.value = "";
      setRunning(true);
    }

    function startNew() {
      const order = shuffle([...Array(DISTRACTION_QUESTIONS.length).keys()]);
      const s = { day: todayKey(), order, i: 0, answered: 0 };
      save(s);
      render(s);
    }

    function advance(s) {
      if (s.i >= s.order.length - 1) {
        qEl.textContent = "You’re done. Take a slow breath.";
        setRunning(false);
        clear();
        return;
      }
      s.i += 1;
      save(s);
      render(s);
    }

    startBtn.addEventListener("click", (e) => {
      e.preventDefault();
      startNew();
    });

    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const s = load() || (startNew(), load());
      if (!s) return;

      const text = (input.value || "").trim();
      if (!text) {
        input.focus();
        qEl.textContent = "Type any answer (even one word) — or tap Skip.";
        setTimeout(() => {
          const s2 = load();
          if (s2) qEl.textContent = currentQ(s2);
        }, 900);
        return;
      }

      s.answered += 1;
      save(s);
      advance(s);
    });

    skipBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const s = load() || (startNew(), load());
      if (!s) return;
      advance(s);
    });

    endBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clear();
      setRunning(false);
      qEl.textContent = "Ended. You can start again any time.";
    });

    const existing = load();
    if (existing) render(existing);
    else {
      setRunning(false);
      qEl.textContent = "Tap Start to begin.";
      answeredEl.textContent = "0";
    }
  }

  /* =========================
     BOOT
  ========================= */
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    initTheme();

    initWotd();
    initDistraction();

    initBreathe();
    initQuotes();
    initMusic();
    initYoga();
    initProgress();
  });
})();
