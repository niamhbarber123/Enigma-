/* =========================================================
   Enigma Wellbeing • app.js (FULL)
   - Theme toggle (+ sun/moon swap)
   - Back navigation
   - Word of the Day (deterministic daily + modal)
   - Breathe (timer + stopwatch + reversed inhale/exhale animation)
   - Quotes (search/random + save + view saved)
   - Music + Yoga (mood chips + styled button links)
   - Progress page (reads localStorage counts)
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
     DATE KEY
  ========================= */
  function todayKey() {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  }

  /* =========================
     DETERMINISTIC RNG
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

  /* =========================
     THEME (☀️/🌙)
  ========================= */
  function applyTheme() {
    const t = localStorage.getItem("enigmaTheme") || "light";
    const isNight = t === "night";
    document.body.classList.toggle("night", isNight);

    const btn = $("themeFab");
    if (btn) btn.textContent = isNight ? "☀️" : "🌙";
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
     WORD OF THE DAY
  ========================= */
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
    { w: "Authenticity", d: "Being real—no performance required." },
    { w: "Patience", d: "Letting growth take the time it takes." },
    { w: "Joy", d: "Noticing what feels bright—even briefly." },
    { w: "Integrity", d: "Aligning actions with values—even in small moments." },
    { w: "Compassion", d: "Meeting struggle with warmth instead of judgement." },
    { w: "Strength", d: "Endurance, boundaries, and quiet resilience." },
    { w: "Reflection", d: "Looking back kindly to learn and reset." },
    { w: "Grace", d: "Moving with softness through imperfect moments." }
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

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    const close = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
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
     BREATHE (timer + stopwatch)
     - REVERSED animation:
       inhale = smaller, exhale = bigger
  ========================= */
  function initBreathe() {
    const page = $("breathePage");
    if (!page) return;

    const phaseEl = $("breathPhase");
    const tipEl = $("breathTip");
    const circle = $("breatheCircle");

    const startBtn = $("breathStartBtn");
    const stopBtn = $("breathStopBtn");
    const completeBtn = $("breathCompleteBtn");

    // Optional controls (only if you add them in breathe.html)
    const durationSel = $("breathDurationSel");     // <select>
    const stopwatchBtn = $("breathStopwatchBtn");   // <button>
    const timerEl = $("breathTimer");               // <div>

    if (!phaseEl || !tipEl || !circle || !startBtn || !stopBtn || !completeBtn) return;

    let running = false;
    let intervalId = null;
    let tickId = null;

    // breathing pace (slower)
    const INHALE_MS = 5000;
    const EXHALE_MS = 5000;
    const HOLD_MS = 1000;

    // session timing
    let mode = "timer";      // "timer" | "stopwatch"
    let remainingMs = 60000; // for timer
    let elapsedMs = 0;       // for stopwatch

    function fmt(ms) {
      ms = Math.max(0, ms);
      const total = Math.floor(ms / 1000);
      const m = Math.floor(total / 60);
      const s = total % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    }

    function setTimerText() {
      if (!timerEl) return;
      timerEl.textContent = mode === "stopwatch" ? `Stopwatch: ${fmt(elapsedMs)}` : `Timer: ${fmt(remainingMs)}`;
    }

    function setIdle() {
      running = false;
      phaseEl.textContent = "Ready";
      tipEl.textContent = "Tap Start to begin.";
      circle.classList.remove("inhale", "exhale");
      if (intervalId) clearTimeout(intervalId);
      if (tickId) clearInterval(tickId);
      intervalId = null;
      tickId = null;
      setTimerText();
    }

    function finishSession() {
      setIdle();
      tipEl.textContent = "Nice work — session complete ✅";
      // store “breathed today”
      const key = "enigmaBreatheToday";
      localStorage.setItem(key, todayKey());
    }

    function stepInhale() {
      if (!running) return;
      phaseEl.textContent = "Inhale";
      tipEl.textContent = "Breathe in… (gentle)";
      circle.classList.remove("exhale");
      circle.classList.add("inhale"); // inhale = smaller (CSS does that)

      intervalId = setTimeout(() => {
        if (!running) return;
        phaseEl.textContent = "Hold";
        tipEl.textContent = "Hold…";
        intervalId = setTimeout(stepExhale, HOLD_MS);
      }, INHALE_MS);
    }

    function stepExhale() {
      if (!running) return;
      phaseEl.textContent = "Exhale";
      tipEl.textContent = "Breathe out… (slow)";
      circle.classList.remove("inhale");
      circle.classList.add("exhale"); // exhale = bigger (CSS does that)

      intervalId = setTimeout(() => {
        if (!running) return;
        phaseEl.textContent = "Hold";
        tipEl.textContent = "Hold…";
        intervalId = setTimeout(stepInhale, HOLD_MS);
      }, EXHALE_MS);
    }

    function startSession() {
      if (running) return;

      // determine mode + duration
      if (mode === "timer") {
        let mins = 1;
        if (durationSel) {
          const v = parseInt(durationSel.value, 10);
          if (Number.isFinite(v) && v > 0) mins = v;
        }
        remainingMs = mins * 60 * 1000;
        elapsedMs = 0;
      } else {
        elapsedMs = 0;
        remainingMs = 0;
      }

      running = true;
      setTimerText();

      // tick timer/stopwatch every second
      tickId = setInterval(() => {
        if (!running) return;
        if (mode === "timer") {
          remainingMs -= 1000;
          if (remainingMs <= 0) {
            remainingMs = 0;
            setTimerText();
            finishSession();
            return;
          }
        } else {
          elapsedMs += 1000;
        }
        setTimerText();
      }, 1000);

      // start breathing loop
      stepInhale();
    }

    // Buttons
    startBtn.addEventListener("click", (e) => {
      e.preventDefault();
      startSession();
    });

    stopBtn.addEventListener("click", (e) => {
      e.preventDefault();
      setIdle();
      tipEl.textContent = "Stopped. Tap Start to begin again.";
    });

    completeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      finishSession();
    });

    // Stopwatch toggle button (optional)
    if (stopwatchBtn) {
      stopwatchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        mode = mode === "timer" ? "stopwatch" : "timer";
        stopwatchBtn.classList.toggle("active", mode === "stopwatch");
        if (durationSel) durationSel.disabled = mode === "stopwatch";
        setTimerText();
      });
    }

    // duration selector updates label
    if (durationSel) {
      durationSel.addEventListener("change", () => {
        if (mode === "timer") {
          const mins = parseInt(durationSel.value, 10);
          remainingMs = (Number.isFinite(mins) ? mins : 1) * 60 * 1000;
          setTimerText();
        }
      });
    }

    // init
    setIdle();
  }

  /* =========================
     QUOTES
  ========================= */
  const SAVED_QUOTES_KEY = "enigmaSavedQuotesV1";

  function loadSavedQuotes() {
    try {
      const raw = localStorage.getItem(SAVED_QUOTES_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveSavedQuotes(arr) {
    localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(arr));
  }

  async function fetchQuotesBySearch(q) {
    // Quotable is commonly used; if it fails, we fall back to local list
    const url = `https://api.quotable.io/search/quotes?query=${encodeURIComponent(q)}&limit=12`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Quote API failed");
    const data = await res.json();
    const results = (data && data.results) ? data.results : [];
    return results.map((r) => ({
      text: r.content || "",
      author: r.author || "Unknown"
    })).filter((x) => x.text);
  }

  function localQuoteFallback() {
    return [
      { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
      { text: "You do not have to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
      { text: "It always seems impossible until it’s done.", author: "Nelson Mandela" },
      { text: "Small steps every day.", author: "Unknown" }
    ];
  }

  function renderQuotes(grid, quotes, saved) {
    grid.innerHTML = "";

    quotes.forEach((q) => {
      const tile = document.createElement("div");
      tile.className = "quote-tile";

      const text = document.createElement("div");
      text.className = "quote-text";
      text.textContent = `“${q.text}”`;

      const meta = document.createElement("div");
      meta.className = "quote-meta";

      const author = document.createElement("div");
      author.className = "quote-author";
      author.textContent = `— ${q.author || "Unknown"}`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quote-save-btn";

      const key = `${q.text}__${q.author || "Unknown"}`;
      const isSaved = saved.some((s) => `${s.text}__${s.author}` === key);
      btn.classList.toggle("saved", isSaved);
      btn.textContent = isSaved ? "💜 Saved" : "💜 Save";

      btn.addEventListener("click", () => {
        let now = loadSavedQuotes();
        const exists = now.some((s) => `${s.text}__${s.author}` === key);

        if (exists) {
          now = now.filter((s) => `${s.text}__${s.author}` !== key);
        } else {
          now.unshift({ text: q.text, author: q.author || "Unknown", day: todayKey() });
        }
        saveSavedQuotes(now);

        // update button + count
        const savedNow = loadSavedQuotes();
        btn.classList.toggle("saved", !exists);
        btn.textContent = !exists ? "💜 Saved" : "💜 Save";

        const countEl = $("savedCount");
        if (countEl) countEl.textContent = String(savedNow.length);
      });

      meta.appendChild(author);
      meta.appendChild(btn);

      tile.appendChild(text);
      tile.appendChild(meta);

      grid.appendChild(tile);
    });
  }

  function initQuotes() {
    const grid = $("quoteGrid");
    if (!grid) return;

    const input = $("quoteSearch");
    const searchBtn = $("quoteSearchBtn");
    const randomBtn = $("quoteRandomBtn");

    const viewSavedBtn = $("viewSavedBtn");
    const clearSavedBtn = $("clearSavedBtn");
    const savedCount = $("savedCount");
    const status = $("quoteStatus");

    const setStatus = (t) => { if (status) status.textContent = t; };

    // init count
    const saved = loadSavedQuotes();
    if (savedCount) savedCount.textContent = String(saved.length);

    async function doSearch(query) {
      setStatus("Searching…");
      try {
        const results = await fetchQuotesBySearch(query);
        if (!results.length) {
          setStatus("No results found — showing a few favourites instead.");
          renderQuotes(grid, localQuoteFallback(), loadSavedQuotes());
          return;
        }
        setStatus("Tap 💜 to save a quote.");
        renderQuotes(grid, results, loadSavedQuotes());
      } catch (e) {
        setStatus("Couldn’t reach the quote service — showing a few favourites.");
        renderQuotes(grid, localQuoteFallback(), loadSavedQuotes());
      }
    }

    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        const q = (input && input.value ? input.value : "").trim();
        if (!q) {
          setStatus("Type something to search (e.g. courage, hope).");
          return;
        }
        doSearch(q);
      });
    }

    if (randomBtn) {
      randomBtn.addEventListener("click", () => {
        const pool = ["courage", "hope", "calm", "confidence", "progress", "strength"];
        const seed = seedFromToday();
        const rand = mulberry32(seed + 99);
        const q = pool[Math.floor(rand() * pool.length)];
        if (input) input.value = q;
        doSearch(q);
      });
    }

    if (viewSavedBtn) {
      viewSavedBtn.addEventListener("click", () => {
        const savedNow = loadSavedQuotes();
        if (savedCount) savedCount.textContent = String(savedNow.length);

        if (!savedNow.length) {
          setStatus("No saved quotes yet.");
          grid.innerHTML = "";
          return;
        }
        setStatus("Your saved quotes:");
        renderQuotes(grid, savedNow.map((s) => ({ text: s.text, author: s.author })), savedNow);
      });
    }

    if (clearSavedBtn) {
      clearSavedBtn.addEventListener("click", () => {
        saveSavedQuotes([]);
        if (savedCount) savedCount.textContent = "0";
        setStatus("Saved quotes cleared.");
        grid.innerHTML = "";
      });
    }

    // first load: show a few
    renderQuotes(grid, localQuoteFallback(), loadSavedQuotes());
    setStatus("Tap 💜 to save a quote.");
  }

  /* =========================
     MUSIC
  ========================= */
  const MUSIC_TRACKS = [
    { mood: "All", title: "Calm breathing music", url: "https://www.youtube.com/results?search_query=calm+breathing+music" },
    { mood: "Focus", title: "Lo-fi focus mix", url: "https://www.youtube.com/results?search_query=lofi+focus+mix" },
    { mood: "Sleep", title: "Sleep music", url: "https://www.youtube.com/results?search_query=sleep+music+relaxing" },
    { mood: "Stressed", title: "Relaxing piano", url: "https://www.youtube.com/results?search_query=relaxing+piano+music" },
    { mood: "Anxious", title: "Ocean waves", url: "https://www.youtube.com/results?search_query=ocean+waves+relaxing" }
  ];

  function initMusic() {
    const chips = $("moodChips");
    const list = $("musicList");
    if (!chips || !list) return;

    const moods = ["All", "Anxious", "Stressed", "Focus", "Sleep"];
    let active = "All";

    function renderChips() {
      chips.innerHTML = "";
      moods.forEach((m) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.textContent = m;
        b.classList.toggle("active", m === active);
        b.addEventListener("click", () => {
          active = m;
          renderChips();
          renderList();
        });
        chips.appendChild(b);
      });
    }

    function renderList() {
      list.innerHTML = "";
      const items = MUSIC_TRACKS.filter((t) => active === "All" || t.mood === active);

      items.forEach((t) => {
        const a = document.createElement("a");
        a.className = "music-btn";
        a.href = t.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.innerHTML = `<span>${t.title}</span><span>↗</span>`;
        list.appendChild(a);
      });
    }

    renderChips();
    renderList();
  }

  /* =========================
     YOGA
  ========================= */
  const YOGA_VIDEOS = [
    { mood: "All", title: "Gentle yoga (all levels)", url: "https://www.youtube.com/results?search_query=gentle+yoga+all+levels" },
    { mood: "Anxiety", title: "10 min Yoga for Anxiety", url: "https://www.youtube.com/results?search_query=10+min+yoga+for+anxiety" },
    { mood: "Stress", title: "15 min Gentle Yoga for Stress", url: "https://www.youtube.com/results?search_query=15+min+gentle+yoga+for+stress" },
    { mood: "Sleep", title: "Yoga for Sleep (wind down)", url: "https://www.youtube.com/results?search_query=yoga+for+sleep+wind+down" },
    { mood: "Morning", title: "Morning Yoga (wake up)", url: "https://www.youtube.com/results?search_query=morning+yoga+wake+up" },
    { mood: "Stiff body", title: "Yoga for stiff back/hips", url: "https://www.youtube.com/results?search_query=yoga+stiff+back+hips" }
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
        b.type = "button";
        b.className = "chip";
        b.textContent = m;
        b.classList.toggle("active", m === active);
        b.addEventListener("click", () => {
          active = m;
          renderChips();
          renderList();
        });
        chips.appendChild(b);
      });
    }

    function renderList() {
      list.innerHTML = "";
      const items = YOGA_VIDEOS.filter((v) => active === "All" || v.mood === active);

      items.forEach((v) => {
        const a = document.createElement("a");
        a.className = "music-btn";
        a.href = v.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.innerHTML = `<span>${v.title}</span><span>↗</span>`;
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
    const musicTodayEl = $("pMusicToday");
    const savedQuotesEl = $("pSavedQuotes");
    const musicTotalEl = $("pMusicTotal");

    // breathed today (stored when finishing breathe)
    const breathed = localStorage.getItem("enigmaBreatheToday") === todayKey();
    if (breathedTodayEl) breathedTodayEl.textContent = breathed ? "Yes" : "No";

    // music mins (if you already track these elsewhere you can adjust)
    const minsToday = parseInt(localStorage.getItem("enigmaMusicMinsToday") || "0", 10) || 0;
    const minsTotal = parseInt(localStorage.getItem("enigmaMusicMinsTotal") || "0", 10) || 0;
    if (musicTodayEl) musicTodayEl.textContent = String(minsToday);
    if (musicTotalEl) musicTotalEl.textContent = String(minsTotal);

    // saved quotes
    const saved = loadSavedQuotes();
    if (savedQuotesEl) savedQuotesEl.textContent = String(saved.length);
  }

  /* =========================
     BOOT
  ========================= */
  document.addEventListener("DOMContentLoaded", () => {
    try { applyTheme(); } catch (e) {}
    try { initTheme(); } catch (e) {}

    // Home
    try { initWotd(); } catch (e) {}
    try { initDistraction(); } catch (e) {} // if you still use your distraction section

    // Pages
    try { initBreathe(); } catch (e) {}
    try { initQuotes(); } catch (e) {}
    try { initMusic(); } catch (e) {}
    try { initYoga(); } catch (e) {}
    try { initProgress(); } catch (e) {}
  });

  /* =========================================================
     DISTRACTION (your existing one can stay)
     If you already have it elsewhere, keep yours — this is a
     minimal “do nothing if missing” safety.
  ========================================================= */
  function initDistraction() {
    const card = $("distractionCard");
    if (!card) return;

    // If you already have your full distraction logic in another
    // version of app.js, paste it here instead.
    // This placeholder prevents errors if elements exist but
    // you haven’t pasted the full logic.
  }

})();
