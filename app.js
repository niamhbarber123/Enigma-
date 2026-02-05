/* =========================================================
   Enigma • app.js (WORD OF DAY + THEME)
========================================================= */

(function () {
  "use strict";

  function $(id){ return document.getElementById(id); }

  function todayKey(){
    return new Date().toISOString().split("T")[0];
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
     WORD OF THE DAY (affirmations)
     - deterministic pick by date
  ========================= */
  const AFFIRMATIONS = [
    { w:"Forgiveness", d:"I release what I can’t change and make space for peace." },
    { w:"Honesty", d:"I speak and act with truth and care." },
    { w:"Trust", d:"I can rely on myself and allow others to show up." },
    { w:"Responsibility", d:"I take ownership of what’s mine—calmly and clearly." },
    { w:"Flexibility", d:"I can adapt without losing myself." },
    { w:"Boldness", d:"I choose brave steps, even small ones." },
    { w:"Discretion", d:"I share with intention and protect my peace." },
    { w:"Discipline", d:"I follow through gently, one step at a time." },
    { w:"Detail", d:"I notice what matters and give it steady attention." },
    { w:"Prosperity", d:"I welcome growth, wellbeing, and abundance." },
    { w:"Acceptance", d:"I meet this moment as it is, without fighting it." },
    { w:"Surrender", d:"I let go of control and soften into the present." },
    { w:"Sincerity", d:"I show up as I truly am." },
    { w:"Serenity", d:"I invite quiet calm into my body and mind." },
    { w:"Humility", d:"I stay open to learning and grounded confidence." },
    { w:"Sensitivity", d:"My feelings give me information—and I handle them kindly." },

    { w:"Compassion", d:"I respond to myself with warmth and understanding." },
    { w:"Leadership", d:"I guide myself with clarity and care." },
    { w:"Integrity", d:"My values and actions align." },
    { w:"Action", d:"I take the next small step that helps." },
    { w:"Courage", d:"I can feel fear and still choose what matters." },
    { w:"Creativity", d:"I allow new ideas and gentle expression." },
    { w:"Gentleness", d:"Softness is strength. I don’t rush my healing." },
    { w:"Clarity", d:"I can choose one helpful thought at a time." },
    { w:"Balance", d:"I make room for rest and effort." },
    { w:"Fun", d:"I allow lightness and play without guilt." },
    { w:"Commitment", d:"I stay with what matters to me." },
    { w:"Patience", d:"I give myself time. Progress counts." },
    { w:"Freedom", d:"I release what weighs me down." },
    { w:"Reflection", d:"I pause to understand and choose wisely." },
    { w:"Giving", d:"I offer kindness without abandoning myself." },
    { w:"Enthusiasm", d:"I welcome light energy and hopeful momentum." },

    { w:"Joy", d:"I allow small moments of happiness to land." },
    { w:"Satisfaction", d:"I notice what’s already good enough today." },
    { w:"Grace", d:"I move through life with ease and self-forgiveness." },
    { w:"Simplicity", d:"I focus on what’s essential." },
    { w:"Communication", d:"I express my needs clearly and respectfully." },
    { w:"Appropriateness", d:"I choose what fits this moment with wisdom." },
    { w:"Strength", d:"I am resilient, even when I feel tender." },
    { w:"Love", d:"I am worthy of care, connection, and warmth." },
    { w:"Tenderness", d:"I treat myself softly, especially when it’s hard." },
    { w:"Perseverance", d:"I keep going—slowly, steadily, kindly." },
    { w:"Reliability", d:"I build trust by doing what I say I’ll do." },
    { w:"Initiative", d:"I begin—imperfectly—and that’s enough." },
    { w:"Confidence", d:"I trust my ability to cope and learn." },
    { w:"Authenticity", d:"I don’t shrink who I am to feel accepted." },
    { w:"Harmony", d:"I create alignment between my inner and outer world." },
    { w:"Pleasure", d:"I allow comfort and enjoyment without guilt." },
    { w:"Risk", d:"I can try, even if I’m not certain." },
    { w:"Efficiency", d:"I use my energy wisely and kindly." },
    { w:"Spontaneity", d:"I allow small, safe moments of freedom." },
    { w:"Fulfilment", d:"I build a life that feels meaningful to me." }
  ];

  // deterministic pick (same word all day, changes next day)
  function hashDayToIndex(dayStr, max){
    // dayStr like "2026-02-05"
    const digits = dayStr.replaceAll("-", "");
    let n = 0;
    for (let i = 0; i < digits.length; i++){
      n = (n * 31 + digits.charCodeAt(i)) >>> 0;
    }
    return n % max;
  }

  function initWordOfDay(){
    const wordEl = $("wotdWord");
    const defEl = $("wotdDef");
    const helpBtn = $("wotdHelpBtn");

    // Only on pages that include the widget
    if (!wordEl || !defEl) return;

    const day = todayKey();
    const idx = hashDayToIndex(day, AFFIRMATIONS.length);
    const pick = AFFIRMATIONS[idx];

    wordEl.textContent = pick.w;
    defEl.textContent = pick.d;

    if (helpBtn){
      helpBtn.addEventListener("click", ()=>{
        alert(
          "Using these words as affirmations means you can repeat them to yourself, write them down, or think about them regularly to help cultivate those qualities within yourself."
        );
      });
    }
  }

  /* =========================
     BOOT
  ========================= */
  document.addEventListener("DOMContentLoaded", ()=>{
    applyTheme();
    initTheme();
    initWordOfDay();
  });

})();
