/* =========================================================
   Enigma Wellbeing • app.js (FULL)
   Fixes:
   - Theme toggle (moon/sun swap + persistence)
   - Back navigation
   - Word of the Day (loads correctly + modal)
   - Distraction (works + progress)
   - Breathe (timer + stopwatch + slower + inhale retract / exhale expand)
   - Music (chips + button list)
   - Yoga (chips + button list)
   - Quotes (search + random + save)
   - Progress page totals
========================================================= */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  /* =========================
     BACK
  ========================= */
  window.enigmaBack = function () {
    if (history.length > 1) history.back();
    else location.href = "index.html";
  };

  /* =========================
     DATE HELPERS
  ========================= */
  function todayKey() {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  }

  /* =========================
     THEME
  ========================= */
  function applyTheme() {
    const t = localStorage.getItem("enigmaTheme") || "light";
    const night = t === "night";
    document.body.classList.toggle("night", night);

    const btn = $("themeFab");
    if (btn) btn.textContent = night ? "☀️" : "🌙";
  }

  function toggleTheme() {
    const night = document.body.classList.toggle("night");
    localStorage.setItem("enigmaTheme", night ? "night" : "light");
    const btn = $("themeFab");
    if (btn) btn.textContent = night ? "☀️" : "🌙";
  }

  function initTheme() {
    const btn = $("themeFab");
    if (btn) btn.addEventListener("click", toggleTheme);
  }

  /* =========================
     WOTD (WORD OF THE DAY)
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
    { w: "Courage", d: "Feeling fear and still choosing what matters." },
    { w: "Gentleness", d: "Soft strength—especially with yourself." },
    { w: "Clarity", d: "Seeing what matters most, without the noise." },
    { w: "Balance", d: "Making space for rest, effort, joy, and recovery." },
    { w: "Simplicity", d: "Reducing the load—one less thing at a time." },
    { w: "Serenity", d: "A quiet steadiness, even when life is loud." },
    { w: "Integrity", d: "Aligning actions with values—even in small moments." },
    { w: "Authenticity", d: "Being real—no performance required." },
    { w: "Patience", d: "Letting growth take the time it takes." },
    { w: "Joy", d: "Noticing what feels bright—even briefly." }
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
    modal.setAttribute("aria-hidden", "false");

    const close = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    };

    if (backdrop) backdrop.onclick = close;
    if (closeBtn) closeBtn.onclick = close;

    window.addEventListener(
      "keydown",
      function esc(e) {
        if (e.key === "Escape") close();
        window.removeEventListener("keydown", esc);
      }
    );
  }

  function initWotd() {
    const wEl = $("wotdWord");
    const dEl = $("wotdDesc");
    const infoBtn = $("wotdInfoBtn");
    const tile = $("wotdTile");

    // only runs on Home where these exist
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
     DISTRACTION
  ========================= */
  const DISTRACTION_QUESTIONS = [
    "Name 5 things you can see right now.",
    "Name 4 things you can feel (touch/texture).",
    "Name 3 things you can hear.",
    "Name 2 things you can smell.",
    "Name 1 thing you can taste (or would like to taste).",
    "What colour feels calming to you today?",
    "What’s a tiny ‘safe’ plan for the next 10 minutes?",
    "What’s one kind thing you’d say to a friend feeling this way?",
    "What’s a small win you’ve had this week?",
    "What’s something you’re looking forward to (even small)?"
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

    const KEY = "enigmaDistractionSessionV3";

    function setRunning(running) {
      startBtn.style.display = running ? "none" : "";
      nextBtn.style.display = running ? "" : "none";
      skipBtn.style.display = running ? "" : "none";
      endBtn.style.display = running ? "" : "none";
      inputWrap.style.display = running ? "" : "none";
      if (!running) input.value = "";
    }

    function load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s || s.day !== todayKey()) return null;
        if (!Array.isArray(s.order) || typeof s.i !== "number" || typeof s.answered !== "number") return null;
        return s;
      } catch {
        return null;
      }
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

    startBtn.onclick = (e) => {
      e.preventDefault();
      startNew();
    };

    nextBtn.onclick = (e) => {
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

      // update progress (today)
      localStorage.setItem("enigmaDistractionAnsweredToday", String(s.answered));

      advance(s);
    };

    skipBtn.onclick = (e) => {
      e.preventDefault();
      const s = load() || (startNew(), load());
      if (!s) return;
      advance(s);
    };

    endBtn.onclick = (e) => {
      e.preventDefault();
      clear();
      setRunning(false);
      qEl.textContent = "Ended. You can start again any time.";
      answeredEl.textContent = "0";
      localStorage.setItem("enigmaDistractionAnsweredToday", "0");
    };

    const existing = load();
    if (existing) {
      render(existing);
    } else {
      setRunning(false);
      qEl.textContent = "Tap Start to begin.";
      answeredEl.textContent = "0";
      localStorage.setItem("enigmaDistractionAnsweredToday", "0");
    }
  }

  /* =========================
     BREATHE (timer + stopwatch)
     - inhale retracts (smaller)
     - exhale expands (bigger)
     - slower pacing
  ========================= */
  function fmtTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function initBreathe() {
    const page = $("breathePage");
    if (!page) return;

    const phaseEl = $("breathPhase");
    const tipEl = $("breathTip");
    const circle = $("breatheCircle");

    const startBtn = $("breathStartBtn");
    const stopBtn = $("breathStopBtn");
    const completeBtn = $("breathCompleteBtn");

    const durationSel = $("breathDuration");
    const modeBtn = $("breathModeBtn");
    const timerEl = $("breathTimerDisplay");

    if (!phaseEl || !tipEl || !circle || !startBtn || !stopBtn || !completeBtn) return;

    let running = false;
    let mode = "timer"; // "timer" | "stopwatch"
    let timer = null;
    let tick = null;
    let elapsed = 0;
    let remaining = 60;

    // slower breaths
    const INHALE_MS = 5500;
    const EXHALE_MS = 5500;

    function setMode(nextMode) {
      mode = nextMode;
      if (modeBtn) modeBtn.textContent = mode === "timer" ? "⏱ Timer" : "⏳ Stopwatch";
      if (durationSel) durationSel.disabled = mode !== "timer";
      if (timerEl) timerEl.textContent = mode === "timer" ? fmtTime(remaining) : fmtTime(elapsed);
    }

    function setIdle() {
      running = false;
      phaseEl.textContent = "Ready";
      tipEl.textContent = "Tap Start to begin.";
      circle.classList.remove("inhale", "exhale");
      clearInterval(tick);
      tick = null;
      clearTimeout(timer);
      timer = null;
    }

    function doPhase(label, cls) {
      phaseEl.textContent = label;
      circle.classList.remove("inhale", "exhale");
      circle.classList.add(cls);
    }

    function loopBreath() {
      if (!running) return;

      // INHALE = retract (smaller)
      doPhase("Inhale", "inhale");
      tipEl.textContent = "Breathe in slowly…";
      timer = setTimeout(() => {
        if (!running) return;

        // EXHALE = expand (bigger)
        doPhase("Exhale", "exhale");
        tipEl.textContent = "Breathe out slowly…";
        timer = setTimeout(() => {
          if (!running) return;
          loopBreath();
        }, EXHALE_MS);
      }, INHALE_MS);
    }

    function startSession() {
      if (running) return;
      running = true;

      // set duration
      if (mode === "timer") {
        const mins = durationSel ? parseInt(durationSel.value, 10) : 1;
        remaining = Number.isFinite(mins) ? mins * 60 : 60;
        if (timerEl) timerEl.textContent = fmtTime(remaining);
      } else {
        elapsed = 0;
        if (timerEl) timerEl.textContent = fmtTime(elapsed);
      }

      loopBreath();

      // tick display
      tick = setInterval(() => {
        if (!running) return;

        if (mode === "timer") {
          remaining -= 1;
          if (timerEl) timerEl.textContent = fmtTime(remaining);

          if (remaining <= 0) {
            finishSession(true);
          }
        } else {
          elapsed += 1;
          if (timerEl) timerEl.textContent = fmtTime(elapsed);
        }
      }, 1000);
    }

    function finishSession(auto) {
      if (!running) return;
      running = false;

      clearInterval(tick);
      tick = null;
      clearTimeout(timer);
      timer = null;

      circle.classList.remove("inhale", "exhale");
      phaseEl.textContent = "Done";
      tipEl.textContent = auto ? "Nice. Session complete." : "Stopped.";

      // progress: breathed today
      localStorage.setItem("enigmaBreathedToday", "1");
    }

    // Buttons
    startBtn.onclick = (e) => {
      e.preventDefault();
      startSession();
    };

    stopBtn.onclick = (e) => {
      e.preventDefault();
      finishSession(false);
    };

    completeBtn.onclick = (e) => {
      e.preventDefault();
      // manual mark
      localStorage.setItem("enigmaBreathedToday", "1");
      phaseEl.textContent = "Completed ✅";
      tipEl.textContent = "Saved to your progress.";
    };

    if (modeBtn) {
      modeBtn.onclick = (e) => {
        e.preventDefault();
        setMode(mode === "timer" ? "stopwatch" : "timer");
      };
    }

    // default setup
    setMode("timer");
    setIdle();
  }

  /* =========================
     MUSIC
  ========================= */
  const MUSIC_TRACKS = [
    { mood: "All", label: "Calm breathing music", url: "https://www.youtube.com/results?search_query=calm+breathing+music" },
    { mood: "Focus", label: "Lo-fi focus mix", url: "https://www.youtube.com/results?search_query=lofi+focus+mix" },
    { mood: "Sleep", label: "Sleep music", url: "https://www.youtube.com/results?search_query=sleep+music" },
    { mood: "Stressed", label: "Relaxing piano", url: "https://www.youtube.com/results?search_query=relaxing+piano" },
    { mood: "Anxious", label: "Ocean waves", url: "https://www.youtube.com/results?search_query=ocean+waves+10+hours" }
  ];

  function initMusic() {
    const list = $("musicList");
    const chips = $("moodChips");
    if (!list || !chips) return;

    const moods = ["All", "Anxious", "Stressed", "Focus", "Sleep"];
    let active = "All";

    function renderChips() {
      chips.innerHTML = "";
      moods.forEach((m) => {
        const b = document.createElement("button");
        b.className = "chip" + (m === active ? " active" : "");
        b.type = "button";
        b.textContent = m;
        b.onclick = () => {
          active = m;
          renderChips();
          renderList();
        };
        chips.appendChild(b);
      });
    }

    function renderList() {
      list.innerHTML = "";
      const items = MUSIC_TRACKS.filter((t) => active === "All" ? true : t.mood === active);

      items.forEach((t) => {
        const a = document.createElement("a");
        a.className = "music-btn";
        a.href = t.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.innerHTML = `<span>${t.label}</span><span>›</span>`;
        list.appendChild(a);
      });
    }

    // listening minutes
    const minsTodayEl = $("minsToday");
    const minsTotalEl = $("minsTotal");
    const startBtn = $("startListenBtn");
    const endBtn = $("endListenBtn");
    const status = $("listenStatus");

    const KEY = "enigmaMusicSession";
    const TOTAL_KEY = "enigmaMusicTotalMins";

    function getTodayKey() {
      return "enigmaMusicToday_" + todayKey();
    }

    function refreshMins() {
      const todayMins = parseInt(localStorage.getItem(getTodayKey()) || "0", 10);
      const totalMins = parseInt(localStorage.getItem(TOTAL_KEY) || "0", 10);
      if (minsTodayEl) minsTodayEl.textContent = String(todayMins);
      if (minsTotalEl) minsTotalEl.textContent = String(totalMins);
    }

    function loadSession() {
      try {
        return JSON.parse(localStorage.getItem(KEY) || "null");
      } catch {
        return null;
      }
    }

    function saveSession(s) {
      localStorage.setItem(KEY, JSON.stringify(s));
    }

    function clearSession() {
      localStorage.removeItem(KEY);
    }

    if (startBtn && endBtn && status) {
      startBtn.onclick = () => {
        const existing = loadSession();
        if (existing && existing.start) {
          status.textContent = "Session already running.";
          return;
        }
        saveSession({ start: Date.now() });
        status.textContent = "Session started.";
      };

      endBtn.onclick = () => {
        const s = loadSession();
        if (!s || !s.start) {
          status.textContent = "No active session.";
          return;
        }
        const minutes = Math.max(0, Math.round((Date.now() - s.start) / 60000));
        clearSession();

        const todayKeyName = getTodayKey();
        const todayMins = parseInt(localStorage.getItem(todayKeyName) || "0", 10) + minutes;
        const totalMins = parseInt(localStorage.getItem(TOTAL_KEY) || "0", 10) + minutes;

        localStorage.setItem(todayKeyName, String(todayMins));
        localStorage.setItem(TOTAL_KEY, String(totalMins));

        status.textContent = `Session ended (+${minutes} min).`;
        refreshMins();
      };
    }

    renderChips();
    renderList();
    refreshMins();
  }

  /* =========================
     YOGA
  ========================= */
  const YOGA_VIDS = [
    { mood: "Anxiety", label: "10 min Yoga for Anxiety", url: "https://www.youtube.com/results?search_query=10+minute+yoga+for+anxiety" },
    { mood: "Stress", label: "15 min Gentle Yoga for Stress", url: "https://www.youtube.com/results?search_query=15+minute+gentle+yoga+for+stress" },
    { mood: "Sleep", label: "Yoga for Sleep (wind down)", url: "https://www.youtube.com/results?search_query=yoga+for+sleep+wind+down" },
    { mood: "Morning", label: "Morning Yoga (wake up)", url: "https://www.youtube.com/results?search_query=morning+yoga+wake+up" },
    { mood: "Stiff body", label: "Yoga for stiff back/hips", url: "https://www.youtube.com/results?search_query=yoga+for+stiff+back+hips" },
    { mood: "All", label: "Gentle yoga (all levels)", url: "https://www.youtube.com/results?search_query=gentle+yoga+all+levels" }
  ];

  function initYoga() {
    const chips = $("yogaChips");
    const list = $("yogaList");
    if (!chips || !list) return;

    const moods = ["All", "Anxiety", "Stress", "Sleep", "Morning", "Stiff body"];
    let active = "All";

    function renderChips() {
      chips.innerHTML = "";
      moods.forEach((m) => {
        const b = document.createElement("button");
        b.className = "chip" + (m === active ? " active" : "");
        b.type = "button";
        b.textContent = m;
        b.onclick = () => {
          active = m;
          renderChips();
          renderList();
        };
        chips.appendChild(b);
      });
    }

    function renderList() {
      list.innerHTML = "";
      const items = YOGA_VIDS.filter((t) => active === "All" ? true : t.mood === active);

      items.forEach((t) => {
        const a = document.createElement("a");
        a.className = "music-btn";
        a.href = t.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.innerHTML = `<span>${t.label}</span><span>›</span>`;
        list.appendChild(a);
      });
    }

    renderChips();
    renderList();
  }

  /* =========================
     QUOTES (API + Save)
  ========================= */
  const SAVED_KEY = "enigmaSavedQuotesV1";

  function loadSavedQuotes() {
    try {
      return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveSavedQuotes(arr) {
    localStorage.setItem(SAVED_KEY, JSON.stringify(arr));
  }

  function initQuotes() {
    const grid = $("quoteGrid");
    if (!grid) return;

    const input = $("quoteSearch");
    const searchBtn = $("quoteSearchBtn");
    const randomBtn = $("quoteRandomBtn");
    const savedBtn = $("viewSavedBtn");
    const clearBtn = $("clearSavedBtn");
    const countEl = $("savedCount");
    const status = $("quoteStatus");

    function setCount() {
      if (!countEl) return;
      countEl.textContent = String(loadSavedQuotes().length);
    }

    function tile(q) {
      const wrap = document.createElement("div");
      wrap.className = "quote-tile";
      wrap.innerHTML = `
        <div class="quote-text">“${escapeHtml(q.content)}”</div>
        <div class="quote-meta">
          <div class="quote-author">— ${escapeHtml(q.author || "Unknown")}</div>
          <button class="quote-save-btn" type="button">💜 Save</button>
        </div>
      `;

      const btn = wrap.querySelector("button");
      btn.onclick = () => {
        const saved = loadSavedQuotes();
        const exists = saved.some((s) => s.content === q.content && s.author === q.author);
        if (!exists) {
          saved.unshift({ content: q.content, author: q.author || "Unknown" });
          saveSavedQuotes(saved);
          btn.textContent = "💜 Saved";
          btn.classList.add("saved");
          setCount();
        } else {
          btn.textContent = "💜 Saved";
          btn.classList.add("saved");
        }
      };

      return wrap;
    }

    function renderQuotes(arr) {
      grid.innerHTML = "";
      arr.forEach((q) => grid.appendChild(tile(q)));
    }

    function escapeHtml(s) {
      return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    async function fetchRandom() {
      if (status) status.textContent = "Loading…";
      try {
        const r = await fetch("https://api.quotable.io/random");
        const data = await r.json();
        renderQuotes([{ content: data.content, author: data.author }]);
        if (status) status.textContent = "Tip: only the 💜 button saves.";
      } catch {
        if (status) status.textContent = "Couldn’t load quotes right now.";
      }
    }

    async function fetchSearch(q) {
      if (status) status.textContent = "Searching…";
      try {
        const url = "https://api.quotable.io/search/quotes?query=" + encodeURIComponent(q) + "&limit=10";
        const r = await fetch(url);
        const data = await r.json();
        const results = (data.results || []).map((x) => ({ content: x.content, author: x.author }));
        renderQuotes(results.length ? results : [{ content: "No results found. Try another word.", author: "Enigma" }]);
        if (status) status.textContent = "Tip: only the 💜 button saves.";
      } catch {
        if (status) status.textContent = "Search failed. Try again.";
      }
    }

    if (searchBtn) {
      searchBtn.onclick = () => {
        const q = (input && input.value ? input.value : "").trim();
        if (!q) return fetchRandom();
        fetchSearch(q);
      };
    }

    if (randomBtn) randomBtn.onclick = () => fetchRandom();

    if (savedBtn) {
      savedBtn.onclick = () => {
        const saved = loadSavedQuotes();
        if (!saved.length) {
          renderQuotes([{ content: "No saved quotes yet. Tap 💜 to save one.", author: "Enigma" }]);
        } else {
          renderQuotes(saved);
        }
        setCount();
      };
    }

    if (clearBtn) {
      clearBtn.onclick = () => {
        saveSavedQuotes([]);
        setCount();
        renderQuotes([{ content: "Saved quotes cleared.", author: "Enigma" }]);
      };
    }

    setCount();
    // default load = random
    fetchRandom();
  }

  /* =========================
     PROGRESS
  ========================= */
  function initProgress() {
    const page = $("progressPage");
    if (!page) return;

    const breathedTodayEl = $("pBreathedToday");
    const musicTodayEl = $("pMusicToday");
    const savedQuotesEl = $("pSavedQuotes");
    const musicTotalEl = $("pMusicTotal");

    const breathedToday = localStorage.getItem("enigmaBreathedToday") === "1" ? 1 : 0;
    const musicToday = parseInt(localStorage.getItem("enigmaMusicToday_" + todayKey()) || "0", 10);
    const musicTotal = parseInt(localStorage.getItem("enigmaMusicTotalMins") || "0", 10);
    const savedQuotes = loadSavedQuotes().length;

    if (breathedTodayEl) breathedTodayEl.textContent = String(breathedToday);
    if (musicTodayEl) musicTodayEl.textContent = String(musicToday);
    if (savedQuotesEl) savedQuotesEl.textContent = String(savedQuotes);
    if (musicTotalEl) musicTotalEl.textContent = String(musicTotal);
  }

  /* =========================
     BOOT
  ========================= */
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    initTheme();

    // HOME
    initWotd();
    initDistraction();

    // FEATURE PAGES
    initBreathe();
    initMusic();
    initYoga();
    initQuotes();
    initProgress();
  });

})();
