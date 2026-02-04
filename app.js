// ---------- USER ----------
if (!localStorage.getItem("enigmaUser")) {
  localStorage.setItem("enigmaUser", "guest");
}

// ---------- CHECK-IN ----------
function saveCheckin() {
  const mood = document.getElementById("mood").value;
  localStorage.setItem("dailyMood", mood);
  alert("Check-in saved 💜");
}

// ---------- MOOD RECOMMENDATIONS ----------
function getRecommendation() {
  const mood = localStorage.getItem("dailyMood");
  let message = "Take a gentle moment today 💜";

  if (mood?.includes("Good")) message = "Celebrate a small win ✨";
  if (mood?.includes("Okay")) message = "A short breathe might help 🌬️";
  if (mood?.includes("Low")) message = "Be kind to yourself today 🤍";
  if (mood?.includes("Anxious")) message = "Try grounding or breathing 🌿";

  return message;
}

// ---------- QUOTES ----------
function saveQuote(text) {
  let saved = JSON.parse(localStorage.getItem("quotes")) || [];
  if (!saved.includes(text)) saved.push(text);
  localStorage.setItem("quotes", JSON.stringify(saved));
  alert("Saved 💜");
}

// ---------- BREATHE ----------
function completeBreathe() {
  localStorage.setItem("breatheDone", "yes");
  alert("Well done for taking time 🌬️");
}

// ---------- REMINDERS ----------
function setReminder() {
  localStorage.setItem("reminder", "on");
  alert("Daily reminder set 💜 (browser based)");
}
