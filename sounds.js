/* =========================================================
   Enigma • sounds.js
   - Mood-based link suggestions
   - Starts a "listening session" when user taps a link
   - Tracks minutes from tap -> when user returns and ends session
========================================================= */

const LINKS = [
  // NOTE: you can swap these for your favourites
  { title:"🌧 Rain ambience", mood:["anxious","stressed","sleep","all"], url:"https://www.youtube.com/watch?v=2OEL4P1Rz04" },
  { title:"🌊 Ocean waves", mood:["anxious","sleep","all"], url:"https://www.youtube.com/watch?v=bn9F19Hi1Lk" },
  { title:"🌿 Forest ambience", mood:["stressed","focus","all"], url:"https://www.youtube.com/watch?v=odJxJRAxdFU" },
  { title:"🎹 Calm piano", mood:["low","anxious","all"], url:"https://www.youtube.com/watch?v=q76bMs-NwRk" },
  { title:"🔔 Meditation bells", mood:["anxious","sleep","all"], url:"https://www.youtube.com/watch?v=nmFUDkj1Aq0" },
  { title:"🧘 Breath-focused music", mood:["anxious","stressed","all"], url:"https://www.youtube.com/watch?v=MIr3RsUWrdo" },
  { title:"📚 Focus lo-fi", mood:["focus","all"], url:"https://www.youtube.com/watch?v=jfKfPfyJRdk" },
  { title:"🌙 Sleep soundscape", mood:["sleep","all"], url:"https://www.youtube.com/watch?v=1ZYbU82GVz4" }
];

const KEY_SESSION = "enigmaListenSession";
const KEY_TOTAL = "enigmaMinutesTotal";
const KEY_TODAY = "enigmaMinutesByDay";

function isoToday(){ return new Date().toISOString().split("T")[0]; }
function getJSON(key, fallback){
  try{ return JSON.parse(localStorage.getItem(key) || ""); } catch { return fallback; }
}
function setJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function minutesBetween(msA, msB){
  const diff = Math.max(0, msB - msA);
  return Math.round(diff / 60000); // whole minutes
}

function renderStats(){
  const today = isoToday();
  const byDay = getJSON(KEY_TODAY, {});
  const total = parseInt(localStorage.getItem(KEY_TOTAL) || "0", 10);

  const todayEl = document.getElementById("todayMinutes");
  const totalEl = document.getElementById("totalMinutes");
  if (todayEl) todayEl.textContent = String(byDay[today] || 0);
  if (totalEl) totalEl.textContent = String(total || 0);
}

function setSessionStatus(text){
  const el = document.getElementById("sessionStatus");
  if (el) el.textContent = text;
}

function startSession(label){
  const now = Date.now();
  setJSON(KEY_SESSION, { start: now, label });
  setSessionStatus(`Listening: ${label} (session running…)`);
}

function endSession(){
  const session = getJSON(KEY_SESSION, null);
  if (!session || !session.start){
    setSessionStatus("No active session.");
    return;
  }

  const now = Date.now();
  const mins = minutesBetween(session.start, now);
  setJSON(KEY_SESSION, null);

  const today = isoToday();
  const byDay = getJSON(KEY_TODAY, {});
  byDay[today] = (byDay[today] || 0) + mins;
  setJSON(KEY_TODAY, byDay);

  const total = parseInt(localStorage.getItem(KEY_TOTAL) || "0", 10) + mins;
  localStorage.setItem(KEY_TOTAL, String(total));

  renderStats();
  setSessionStatus(mins > 0
    ? `Session ended ✅ +${mins} min added.`
    : `Session ended ✅ (0 min recorded).`
  );
}

function renderLinks(activeMood){
  const wrap = document.getElementById("soundLinks");
  if (!wrap) return;

  wrap.innerHTML = "";

  const filtered = LINKS.filter(item => {
    if (activeMood === "all") return true;
    return item.mood.includes(activeMood) || item.mood.includes("all");
  });

  filtered.forEach(item => {
    const a = document.createElement("a");
    a.className = "sound-link";
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener";

    a.textContent = item.title;

    // highlight currently selected
    a.addEventListener("click", () => {
      document.querySelectorAll(".sound-link").forEach(x => x.classList.remove("active"));
      a.classList.add("active");
      startSession(item.title);
    });

    wrap.appendChild(a);
  });
}

function initMoodChips(){
  const chips = document.getElementById("moodChips");
  const hint = document.getElementById("moodHint");
  if (!chips) return;

  let mood = "all";
  renderLinks(mood);

  chips.querySelectorAll(".chip").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      chips.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");

      mood = btn.dataset.mood || "all";
      if (hint) hint.textContent = `Showing: ${btn.textContent}`;
      renderLinks(mood);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderStats();
  initMoodChips();

  // restore session label if exists
  const session = getJSON(KEY_SESSION, null);
  if (session && session.label){
    setSessionStatus(`Listening: ${session.label} (session running…)`);
  } else {
    setSessionStatus("No active session.");
  }

  const endBtn = document.getElementById("endSessionBtn");
  if (endBtn) endBtn.addEventListener("click", endSession);

  // Helpful: if user returns to tab, keep status accurate
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden){
      // no auto-end (user chooses), just refresh stats
      renderStats();
    }
  });
});
