/* =========================================================
   Enigma Wellbeing • app.js
   - Theme toggle (moon/sun)
   - Back navigation
   - Word of the Day (deterministic daily pick + modal)
   - Distraction tool
   - Quotes save count support
   - Music session minutes support
   - Breathing minutes support
   - Progress page rendering
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
    document.body.classList.toggle("night", t === "night");

    // Swap icon moon/sun
    const btn = $("themeFab");
    if (btn) btn.textContent = (t === "night") ? "☀️" : "🌙";
  }

  function toggleTheme() {
    const night = document.body.classList.toggle("night");
    localStorage.setItem("enigmaTheme", night ? "night" : "light");
    const btn = $("themeFab");
    if (btn) btn.textContent = night ? "☀️" : "🌙";
  }

  function initTheme() {
    const btn = $("themeFab");
    if (!btn) return;
    btn.addEventListener("click", toggleTheme);
  }

  /* =========================
     DETERMINISTIC RNG (for WOTD)
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
     WORD OF THE DAY
  ========================= */
  const WOTD = [
    { w: "Simplicity", d: "Choosing what matters and letting go of the rest." },
    { w: "Reflection", d: "Pausing to understand and choose wisely." },
    { w: "Compassion", d: "Meeting struggle with warmth instead of judgement." },
    { w: "Clarity", d: "Seeing what matters most, without the noise." },
    { w: "Gentleness", d: "Soft strength—especially with yourself." },
    { w: "Courage", d: "Feeling fear and still choosing what matters." },
    { w: "Patience", d: "Letting growth take the time it takes." },
    { w: "Balance", d: "Making space for rest, effort, joy, and recovery." },
    { w: "Integrity", d: "Aligning actions with values—even in small moments." },
    { w: "Serenity", d: "A quiet steadiness, even when life is loud." },
    { w: "Acceptance", d: "Letting reality be what it is—so you can respond wisely." },
    { w: "Discretion", d: "Using good judgement about what to share and when." }
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
    const wEl = $("wotdWord");
    const dEl = $("wotdDesc");
    const infoBtn = $("wotdInfoBtn");
    const tile = $("wotdTile");

    // Only runs on Home (or any page that has the WOTD IDs)
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
     DISRACTION (same as your logic)
  ========================= */
  const DISTRACTION_QUESTIONS = [
    "Name 5 things you can see right now.",
    "Name 4 things you can feel (touch/texture).",
    "Name 3 things you can hear.",
    "Name 2 things you can smell.",
    "Name 1 thing you can taste (or would like to taste).",
    "What’s a tiny ‘safe’ plan for the next 10 minutes?"
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

    function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
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

    startBtn.addEventListener("click", (e) => { e.preventDefault(); startNew(); });

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
     QUOTES (saved count only)
     Your existing quotes search can stay — this ensures saved count works everywhere.
  ========================= */
  function getSavedQuotes() {
    try {
      const raw = localStorage.getItem("enigmaSavedQuotes") || "[]";
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function initSavedCountBadge() {
    const el = $("savedCount");
    if (!el) return;
    el.textContent = String(getSavedQuotes().length);
  }

  /* =========================
     MUSIC minutes (for progress)
     Assumes your sounds page sets minsToday/minsTotal. This provides fallback keys.
  ========================= */
  function getMusicTotals() {
    const today = todayKey();
    const todayMin = Number(localStorage.getItem("enigmaMusicTodayMin:" + today) || "0") || 0;
    const totalMin = Number(localStorage.getItem("enigmaMusicTotalMin") || "0") || 0;
    return { todayMin, totalMin };
  }

  /* =========================
     BREATHING minutes (for progress)
     We store seconds totals by day + overall.
  ========================= */
  function getBreatheTotals() {
    const today = todayKey();
    const todaySec = Number(localStorage.getItem("enigmaBreatheTodaySec:" + today) || "0") || 0;
    const totalSec = Number(localStorage.getItem("enigmaBreatheTotalSec") || "0") || 0;

    function fmt(sec) {
      // show as “X min” if >= 60, else “Y sec”
      if (sec >= 60) return Math.round(sec / 60) + " min";
      return sec + " sec";
    }

    return { todaySec, totalSec, todayFmt: fmt(todaySec), totalFmt: fmt(totalSec) };
  }

  /* =========================
     PROGRESS
  ========================= */
  function initProgress() {
    const root = $("progressPage");
    if (!root) return;

    const breathedToday = $("pBreathedToday");
    const musicToday = $("pMusicToday");
    const savedQuotes = $("pSavedQuotes");
    const musicTotal = $("pMusicTotal");
    const breathedTotal = $("pBreathedTotal");

    const b = getBreatheTotals();
    const m = getMusicTotals();
    const q = getSavedQuotes();

    if (breathedToday) breathedToday.textContent = b.todayFmt;
    if (breathedTotal) breathedTotal.textContent = b.totalFmt;

    if (musicToday) musicToday.textContent = String(m.todayMin);
    if (musicTotal) musicTotal.textContent = String(m.totalMin);

    if (savedQuotes) savedQuotes.textContent = String(q.length);
  }

  /* =========================
     BOOT
  ========================= */
  document.addEventListener("DOMContentLoaded", () => {
    try { applyTheme(); } catch (e) {}
    try { initTheme(); } catch (e) {}

    // ✅ FIX: WOTD was stuck because this wasn’t being called
    try { initWotd(); } catch (e) {}

    try { initDistraction(); } catch (e) {}
    try { initSavedCountBadge(); } catch (e) {}
    try { initProgress(); } catch (e) {}
  });

})();
