/* =========================================================
   Enigma Wellbeing • app.js
   - Theme toggle (moon/sun)
   - Back navigation
   - Word of the Day (daily deterministic pick + modal)
   - Breathe (timer + optional open-ended, swapped inhale/exhale, slower)
   - Quotes (fetch + fallback + save)
   - Music + Yoga (chips + button lists)
   - Progress (basic stats)
   - Distraction
========================================================= */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // ---------- Back ----------
  window.enigmaBack = function () {
    if (history.length > 1) history.back();
    else location.href = "index.html";
  };

  // ---------- Date key ----------
  function todayKey() {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  }

  // ---------- Deterministic RNG ----------
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

  /* =========================
     THEME
  ========================= */
  function applyTheme() {
    const t = localStorage.getItem("enigmaTheme") || "light";
    document.body.classList.toggle("night", t === "night");
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const btn = $("themeFab");
    if (!btn) return;
    const night = document.body.classList.contains("night");
    // If currently night mode -> show sun to go back to light
    btn.textContent = night ? "☀️" : "🌙";
  }

  function toggleTheme() {
    const night = document.body.classList.toggle("night");
    localStorage.setItem("enigmaTheme", night ? "night" : "light");
    updateThemeIcon();
  }

  function initTheme() {
    const btn = $("themeFab");
    if (btn) btn.addEventListener("click", toggleTheme);
  }

  /* =========================
     WORD OF THE DAY
  ========================= */
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
    { w: "Simplicity", d: "Choosing what matters and letting go of the rest." },
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
    const seed = seedFromToday();
    const rand = mulberry32(seed);
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

    modal.style.display = "block";
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    const close = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      modal.style.display = "none";
    };

    if (backdrop) backdrop.addEventListener("click", close, { once: true });
    if (closeBtn) closeBtn.addEventListener("click", close, { once: true });

    window.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") {
        close();
        window.removeEventListener("keydown", esc);
      }
    });
  }

  function initWotd() {
    const tile = $("wotdTile");
    const wEl = $("wotdWord");
    const dEl = $("wotdDesc");
    const infoBtn = $("wotdInfoBtn");
    if (!tile || !wEl || !dEl) return;

    const { w, d } = pickWotd();
    wEl.textContent = w;
    dEl.textContent = d;

    const open = (e) => {
      if (e) e.preventDefault?.();
      showWotdModal(w, d);
    };

    tile.addEventListener("click", (e) => {
      if (e.target && e.target.id === "wotdInfoBtn") return;
      open(e);
    });

    tile.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") open(e);
    });

    if (infoBtn) {
      infoBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        open(e);
      });
    }
  }

  /* =========================
     STORAGE HELPERS (progress)
  ========================= */
  function getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function incDailyCounter(keyName) {
    const key = `enigmaDaily:${keyName}`;
    const s = getJSON(key, { day: todayKey(), count: 0 });
    if (s.day !== todayKey()) {
      s.day = todayKey();
      s.count = 0;
    }
    s.count += 1;
    setJSON(key, s);
    return s.count;
  }

  function getDailyCounter(keyName) {
    const key = `enigmaDaily:${keyName}`;
    const s = getJSON(key, { day: todayKey(), count: 0 });
    if (s.day !== todayKey()) return 0;
    return Number(s.count || 0);
  }

  /* =========================
     BREATHE
     - slow rhythm
     - inhale = smaller
     - exhale = bigger
     - timer with optional open-ended
  ========================= */
  function initBreathe() {
    const page = $("breathePage");
    if (!page) return;

    const phaseEl = $("breathPhase");
    const tipEl = $("breathTip");
    const timerEl = $("breathTimer");

    const circle = $("breatheCircle");
    const startBtn = $("breathStartBtn");
    const stopBtn = $("breathStopBtn");
    const completeBtn = $("breathCompleteBtn");
    const durationSel = $("breathDuration");

    if (!phaseEl || !tipEl || !timerEl || !circle || !startBtn || !stopBtn || !completeBtn || !durationSel) return;

    let running = false;
    let phase = "inhale"; // inhale starts
    let phaseTimer = null;
    let tickTimer = null;
    let startTs = 0;
    let durationSec = 60; // default 1 minute

    const IN_MS = 5000;   // slower inhale
    const OUT_MS = 5000;  // slower exhale

    function fmtTime(s) {
      const mm = String(Math.floor(s / 60)).padStart(2, "0");
      const ss = String(Math.floor(s % 60)).padStart(2, "0");
      return `${mm}:${ss}`;
    }

    function setPhase(newPhase) {
      phase = newPhase;
      circle.classList.remove("inhale", "exhale");
      circle.classList.add(phase); // CSS handles sizes

      // swapped meaning:
      // inhale retracts, exhale expands
      phaseEl.textContent = phase === "inhale" ? "Breathe in" : "Breathe out";
      tipEl.textContent = phase === "inhale" ? "Let your shoulders soften." : "Slowly release the breath.";
    }

    function stopAll() {
      if (phaseTimer) clearTimeout(phaseTimer);
      if (tickTimer) clearInterval(tickTimer);
      phaseTimer = null;
      tickTimer = null;
    }

    function stopSession(showEndedText = true) {
      running = false;
      stopAll();
      circle.classList.remove("inhale", "exhale");
      phaseEl.textContent = "Ready";
      if (showEndedText) tipEl.textContent = "Tap Start to begin.";
    }

    function tick() {
      const elapsed = Math.max(0, (Date.now() - startTs) / 1000);
      const limit = durationSec;

      // timer text
      if (limit > 0) {
        const remaining = Math.max(0, limit - elapsed);
        timerEl.textContent = fmtTime(remaining);
      } else {
        // open-ended: count up
        timerEl.textContent = fmtTime(elapsed);
      }

      // auto complete when set time finishes
      if (limit > 0 && elapsed >= limit) {
        stopSession(false);
        tipEl.textContent = "Nice work. You completed your session.";
        incDailyCounter("breathed");
      }
    }

    function scheduleNextPhase() {
      if (!running) return;

      if (phase === "inhale") {
        phaseTimer = setTimeout(() => {
          setPhase("exhale");
          scheduleNextPhase();
        }, IN_MS);
      } else {
        phaseTimer = setTimeout(() => {
          setPhase("inhale");
          scheduleNextPhase();
        }, OUT_MS);
      }
    }

    function startSession() {
      durationSec = Number(durationSel.value || 0);
      if (!Number.isFinite(durationSec)) durationSec = 0;

      running = true;
      startTs = Date.now();

      // start with inhale (retract)
      setPhase("inhale");

      // tick timer
      stopAll();
      tick();
      tickTimer = setInterval(tick, 200);

      // phase loop
      scheduleNextPhase();
    }

    startBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (running) return;
      startSession();
    });

    stopBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!running) return;
      stopSession(true);
    });

    completeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // manual completion
      stopSession(false);
      tipEl.textContent = "Completed. Well done.";
      incDailyCounter("breathed");
    });

    // initial timer display
    timerEl.textContent = fmtTime(Number(durationSel.value || 60));
    durationSel.addEventListener("change", () => {
      if (running) return;
      const v = Number(durationSel.value || 0);
      timerEl.textContent = v > 0 ? fmtTime(v) : "00:00";
    });
  }

  /* =========================
     QUOTES
  ========================= */
  const QUOTES_KEY = "enigmaSavedQuotesV1";

  function getSavedQuotes() {
    return getJSON(QUOTES_KEY, []);
  }
  function setSavedQuotes(list) {
    setJSON(QUOTES_KEY, list);
  }

  function renderQuoteTiles(container, quotes, savedList) {
    container.innerHTML = "";
    quotes.forEach((q) => {
      const tile = document.createElement("div");
      tile.className = "quote-tile";

      const text = document.createElement("div");
      text.className = "quote-text";
      text.textContent = `“${q.content}”`;

      const author = document.createElement("small");
      author.textContent = `— ${q.author || "Unknown"}`;

      const btn = document.createElement("button");
      btn.className = "quote-save-btn";
      btn.type = "button";

      const already = savedList.some((s) => s.content === q.content && s.author === q.author);
      btn.textContent = already ? "💜 Saved" : "💜 Save";
      if (already) btn.classList.add("saved");

      btn.addEventListener("click", () => {
        const current = getSavedQuotes();
        const exists = current.some((s) => s.content === q.content && s.author === q.author);
        if (!exists) {
          current.unshift({ content: q.content, author: q.author || "Unknown" });
          setSavedQuotes(current);
          btn.textContent = "💜 Saved";
          btn.classList.add("saved");
          const savedCount = $("savedCount");
          if (savedCount) savedCount.textContent = String(current.length);
        }
      });

      tile.appendChild(text);
      tile.appendChild(author);
      tile.appendChild(btn);
      container.appendChild(tile);
    });
  }

  async function fetchQuotes(query) {
    // Quotable search (usually CORS OK). Fallback if fails.
    const url = `https://api.quotable.io/search/quotes?query=${encodeURIComponent(query)}&limit=10`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Quote API failed");
    const data = await res.json();
    const results = (data.results || []).map((r) => ({
      content: r.content,
      author: r.author
    }));
    return results;
  }

  function motivationalFallback() {
    return [
      { content: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
      { content: "It always seems impossible until it’s done.", author: "Nelson Mandela" },
      { content: "You’ve survived 100% of your hardest days.", author: "Unknown" },
      { content: "Progress, not perfection.", author: "Unknown" },
      { content: "Small steps every day.", author: "Unknown" }
    ];
  }

  function initQuotes() {
    const grid = $("quoteGrid");
    if (!grid) return;

    const input = $("quoteSearch");
    const searchBtn = $("quoteSearchBtn");
    const randomBtn = $("quoteRandomBtn");
    const status = $("quoteStatus");
    const savedBtn = $("viewSavedBtn");
    const clearBtn = $("clearSavedBtn");
    const savedCount = $("savedCount");

    const saved = getSavedQuotes();
    if (savedCount) savedCount.textContent = String(saved.length);

    function showStatus(msg) {
      if (status) status.textContent = msg;
    }

    function showList(list) {
      renderQuoteTiles(grid, list, getSavedQuotes());
      showStatus(list.length ? "Tap 💜 to save." : "No results.");
      const updated = getSavedQuotes();
      if (savedCount) savedCount.textContent = String(updated.length);
    }

    // Initial: show fallback
    showList(motivationalFallback());

    if (searchBtn) {
      searchBtn.addEventListener("click", async () => {
        const q = (input?.value || "").trim();
        if (!q) {
          showStatus("Type something to search (e.g. courage, hope, Mandela).");
          return;
        }
        showStatus("Searching…");
        try {
          const results = await fetchQuotes(q);
          showList(results.length ? results : motivationalFallback());
        } catch {
          showStatus("Couldn’t reach the quote search right now — showing suggestions.");
          showList(motivationalFallback());
        }
      });
    }

    if (randomBtn) {
      randomBtn.addEventListener("click", () => {
        const list = motivationalFallback();
        const one = list[Math.floor(Math.random() * list.length)];
        showList([one]);
      });
    }

    if (savedBtn) {
      savedBtn.addEventListener("click", () => {
        const list = getSavedQuotes();
        showList(list.length ? list : motivationalFallback());
        showStatus(list.length ? "Your saved quotes." : "No saved quotes yet.");
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        setSavedQuotes([]);
        if (savedCount) savedCount.textContent = "0";
        showStatus("Saved quotes deleted.");
        showList(motivationalFallback());
      });
    }
  }

  /* =========================
     MUSIC
  ========================= */
  const MUSIC_TRACKS = [
    { mood: "All", title: "Calm breathing music", url: "https://www.youtube.com/results?search_query=calm+breathing+music" },
    { mood: "Focus", title: "Lo-fi focus mix", url: "https://www.youtube.com/results?search_query=lofi+focus+mix" },
    { mood: "Sleep", title: "Sleep music", url: "https://www.youtube.com/results?search_query=sleep+music" },
    { mood: "All", title: "Relaxing piano", url: "https://www.youtube.com/results?search_query=relaxing+piano" },
    { mood: "Anxious", title: "Ocean waves", url: "https://www.youtube.com/results?search_query=ocean+waves+sleep" }
  ];

  function initMusic() {
    const chips = $("moodChips");
    const list = $("musicList");
    if (!chips || !list) return;

    const moods = ["All", "Anxious", "Stressed", "Focus", "Sleep"];
    let activeMood = "All";

    function renderChips() {
      chips.innerHTML = "";
      moods.forEach((m) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip" + (m === activeMood ? " active" : "");
        b.textContent = m;
        b.addEventListener("click", () => {
          activeMood = m;
          renderChips();
          renderList();
        });
        chips.appendChild(b);
      });
    }

    function renderList() {
      list.innerHTML = "";
      const filtered = MUSIC_TRACKS.filter((t) => activeMood === "All" ? true : (t.mood === activeMood || t.mood === "All"));
      filtered.forEach((t) => {
        const a = document.createElement("a");
        a.className = "music-btn";
        a.href = t.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.innerHTML = `<span>${t.title}</span><span>›</span>`;
        list.appendChild(a);
      });
    }

    // minutes listened
    const startBtn = $("startListenBtn");
    const endBtn = $("endListenBtn");
    const minsTodayEl = $("minsToday");
    const minsTotalEl = $("minsTotal");
    const statusEl = $("listenStatus");

    const KEY = "enigmaMusicListenV1";
    const state = getJSON(KEY, { totalMin: 0, day: todayKey(), todayMin: 0, sessionStart: null });

    function syncDay() {
      if (state.day !== todayKey()) {
        state.day = todayKey();
        state.todayMin = 0;
        state.sessionStart = null;
      }
    }
    function renderMinutes() {
      syncDay();
      if (minsTodayEl) minsTodayEl.textContent = String(state.todayMin || 0);
      if (minsTotalEl) minsTotalEl.textContent = String(state.totalMin || 0);
      if (statusEl) statusEl.textContent = state.sessionStart ? "Session running…" : "No active session.";
    }

    function saveMusic() {
      setJSON(KEY, state);
      renderMinutes();
    }

    if (startBtn) {
      startBtn.addEventListener("click", () => {
        syncDay();
        if (state.sessionStart) return;
        state.sessionStart = Date.now();
        saveMusic();
      });
    }

    if (endBtn) {
      endBtn.addEventListener("click", () => {
        syncDay();
        if (!state.sessionStart) return;
        const elapsedMin = Math.max(0, Math.round((Date.now() - state.sessionStart) / 60000));
        state.sessionStart = null;
        state.todayMin += elapsedMin;
        state.totalMin += elapsedMin;
        saveMusic();
      });
    }

    renderChips();
    renderList();
    renderMinutes();
  }

  /* =========================
     YOGA
  ========================= */
  const YOGA_VIDEOS = [
    { mood: "All", title: "10 min Yoga for Anxiety", url: "https://www.youtube.com/results?search_query=10+min+yoga+for+anxiety" },
    { mood: "Stress", title: "15 min Gentle Yoga for Stress", url: "https://www.youtube.com/results?search_query=gentle+yoga+for+stress+15+minutes" },
    { mood: "Sleep", title: "Yoga for Sleep (wind down)", url: "https://www.youtube.com/results?search_query=yoga+for+sleep+wind+down" },
    { mood: "Morning", title: "Morning Yoga (wake up)", url: "https://www.youtube.com/results?search_query=morning+yoga+wake+up" },
    { mood: "Stiff body", title: "Yoga for stiff back/hips", url: "https://www.youtube.com/results?search_query=yoga+for+stiff+back+hips" },
    { mood: "All", title: "Gentle yoga (all levels)", url: "https://www.youtube.com/results?search_query=gentle+yoga+all+levels" }
  ];

  function initYoga() {
    const chips = $("yogaMoodChips");
    const list = $("yogaList");
    if (!chips || !list) return;

    const moods = ["All", "Anxiety", "Stress", "Sleep", "Morning", "Stiff body"];
    let activeMood = "All";

    function renderChips() {
      chips.innerHTML = "";
      moods.forEach((m) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip" + (m === activeMood ? " active" : "");
        b.textContent = m;
        b.addEventListener("click", () => {
          activeMood = m;
          renderChips();
          renderList();
        });
        chips.appendChild(b);
      });
    }

    function renderList() {
      list.innerHTML = "";
      const filtered = YOGA_VIDEOS.filter((t) => {
        if (activeMood === "All") return true;
        if (activeMood === "Anxiety") return t.title.toLowerCase().includes("anxiety");
        return t.mood === activeMood || t.mood === "All";
      });

      filtered.forEach((t) => {
        const a = document.createElement("a");
        a.className = "music-btn";
        a.href = t.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.innerHTML = `<span>${t.title}</span><span>›</span>`;
        list.appendChild(a);
      });
    }

    renderChips();
    renderList();
  }

  /* =========================
     PROGRESS
  ========================= */
  function initProgress() {
    const page = $("progressPage");
    if (!page) return;

    const breathedTodayEl = $("pBreathedToday");
    const savedQuotesEl = $("pSavedQuotes");
    const musicTodayEl = $("pMusicToday");
    const musicTotalEl = $("pMusicTotal");

    // breathed today
    if (breathedTodayEl) breathedTodayEl.textContent = String(getDailyCounter("breathed"));

    // saved quotes
    const saved = getSavedQuotes();
    if (savedQuotesEl) savedQuotesEl.textContent = String(saved.length);

    // music minutes
    const music = getJSON("enigmaMusicListenV1", { totalMin: 0, day: todayKey(), todayMin: 0 });
    if (musicTodayEl) musicTodayEl.textContent = String(music.day === todayKey() ? (music.todayMin || 0) : 0);
    if (musicTotalEl) musicTotalEl.textContent = String(music.totalMin || 0);
  }

  /* =========================
     DISTRACTION
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
    "What’s your favourite cosy drink?"
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
      const s = getJSON(KEY, null);
      if (!s) return null;
      if (s.day !== todayKey()) return null;
      if (!Array.isArray(s.order)) return null;
      return s;
    }

    function save(s) { setJSON(KEY, s); }
    function clear() { localStorage.removeItem(KEY); }

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
      const s = load();
      if (!s) return startNew();

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
      const s = load();
      if (!s) return startNew();
      advance(s);
    });

    endBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clear();
      setRunning(false);
      qEl.textContent = "Ended. You can start again any time.";
      answeredEl.textContent = "0";
    });

    // Resume today if active
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
    try { applyTheme(); } catch {}
    try { initTheme(); } catch {}
    try { initWotd(); } catch {}
    try { initBreathe(); } catch {}
    try { initQuotes(); } catch {}
    try { initMusic(); } catch {}
    try { initYoga(); } catch {}
    try { initProgress(); } catch {}
    try { initDistraction(); } catch {}
  });

})();
