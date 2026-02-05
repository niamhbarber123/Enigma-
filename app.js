/* =========================================================
   Enigma • app.js (FULL)
   Includes:
   - Theme (night mode)
   - Back navigation
   - Breathe animation
   - Quotes (save / daily shuffle)
   - Music (moods + links + minutes)
   - Tap to Colour (DESIGNS + PALETTE + modes)
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
    if(btn) btn.onclick = toggleTheme;
  }

  /* =========================
     BREATHE
  ========================= */
  function initBreathe(){
    if(!$("breathePage")) return;

    const circle = $("breatheCircle");
    const phase = $("breathPhase");
    const tip = $("breathTip");
    const start = $("breathStartBtn");
    const stop = $("breathStopBtn");

    let running = false, timer;

    function set(p,t){
      phase.textContent = p;
      tip.textContent = t;
    }

    function inhale(){
      circle.classList.add("inhale");
      circle.classList.remove("exhale");
      set("Inhale","Breathe in slowly…");
    }

    function exhale(){
      circle.classList.add("exhale");
      circle.classList.remove("inhale");
      set("Exhale","Breathe out gently…");
    }

    function loop(){
      if(!running) return;
      inhale();
      timer = setTimeout(()=>{
        if(!running) return;
        exhale();
        timer = setTimeout(loop, 4000);
      },4000);
    }

    start.onclick = ()=>{
      if(running) return;
      running = true;
      loop();
    };

    stop.onclick = ()=>{
      running = false;
      clearTimeout(timer);
      circle.classList.remove("inhale","exhale");
      set("Ready","Tap Start to begin.");
    };
  }

  /* =========================
     QUOTES
  ========================= */
  const QUOTES = [
    {q:"Nothing can dim the light that shines from within.",a:"Maya Angelou"},
    {q:"No one can make you feel inferior without your consent.",a:"Eleanor Roosevelt"},
    {q:"Well-behaved women seldom make history.",a:"Laurel Thatcher Ulrich"},
    {q:"My peace is my priority.",a:"Affirmation"}
  ];

  function initQuotes(){
    const grid = $("quoteGrid");
    if(!grid) return;

    const saved = new Set(JSON.parse(localStorage.getItem("enigmaQuotes")||"[]"));
    grid.innerHTML = "";

    QUOTES.forEach(q=>{
      const tile = document.createElement("div");
      tile.className = "quote-tile" + (saved.has(q.q)?" saved":"");
      tile.innerHTML = `
        <div>“${q.q}”</div>
        <small>— ${q.a}</small>
        <button class="quote-save-btn">${saved.has(q.q)?"Saved":"Save"}</button>
      `;

      tile.querySelector("button").onclick = ()=>{
        saved.has(q.q) ? saved.delete(q.q) : saved.add(q.q);
        localStorage.setItem("enigmaQuotes",JSON.stringify([...saved]));
        initQuotes();
      };

      grid.appendChild(tile);
    });
  }

  /* =========================
     MUSIC (Links + minutes)
  ========================= */
  const MOODS = ["All","Anxious","Stressed","Focus","Sleep"];
  const TRACKS = [
    {t:"Calm breathing music",m:"Anxious",u:"https://www.youtube.com/watch?v=odADwWzHR24"},
    {t:"Lo-fi focus mix",m:"Focus",u:"https://www.youtube.com/watch?v=jfKfPfyJRdk"},
    {t:"Sleep music",m:"Sleep",u:"https://www.youtube.com/watch?v=DWcJFNfaw9c"}
  ];

  function initMusic(){
    if(!$("musicPage")) return;

    let mood="All", start=null;

    function render(){
      $("musicList").innerHTML="";
      TRACKS.filter(x=>mood==="All"||x.m===mood).forEach(x=>{
        const a=document.createElement("a");
        a.href=x.u;a.target="_blank";
        a.className="music-btn";
        a.innerHTML=`<span>${x.t}</span><span>▶</span>`;
        $("musicList").appendChild(a);
      });
    }

    $("moodChips").innerHTML="";
    MOODS.forEach(m=>{
      const b=document.createElement("button");
      b.className="chip"+(m===mood?" active":"");
      b.textContent=m;
      b.onclick=()=>{mood=m;initMusic();};
      $("moodChips").appendChild(b);
    });

    $("startListenBtn").onclick=()=>{start=Date.now();$("listenStatus").textContent="Listening…";};
    $("endListenBtn").onclick=()=>{
      if(!start) return;
      const mins=Math.max(1,Math.round((Date.now()-start)/60000));
      const total=Number(localStorage.getItem("musicMins")||0)+mins;
      localStorage.setItem("musicMins",total);
      $("minsTotal").textContent=total;
      $("listenStatus").textContent=`Saved ${mins} min`;
      start=null;
    };

    $("minsTotal").textContent=localStorage.getItem("musicMins")||0;
    render();
  }

  /* =========================
     TAP TO COLOUR – GAME
  ========================= */

  const DESIGNS = [
    "Mandala","Flower","Butterfly","Waves","Heart","Sunrise"
  ];

  const PALETTE = [
    "#b8a6d9","#d6c9f0","#efe9f8","#cbb7e6",
    "#9fd6c2","#7fcdbb","#bfe7d8",
    "#a6c8ff","#7fb0e6","#4f8fd6",
    "#ffd6c9","#ffb6b6","#ffd97a",
    "#e6e8a6","#cde8a6",
    "#f2c6ff","#d4b6ff",
    "#cfcfd6","#9fa4b8","#6f748a"
  ];

  let currentDesign=null,currentColor=null,mode="cbn";

  function initDesigns(){
    const wrap=$("designChips"); if(!wrap) return;
    wrap.innerHTML="";
    DESIGNS.forEach(n=>{
      const b=document.createElement("button");
      b.className="chip";
      b.textContent=n;
      b.onclick=()=>{
        document.querySelectorAll("#designChips .chip").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        currentDesign=n;
      };
      wrap.appendChild(b);
    });
  }

  function initPalette(){
    const wrap=$("paletteDots"); if(!wrap) return;
    wrap.innerHTML="";
    PALETTE.forEach(c=>{
      const d=document.createElement("div");
      d.className="color-dot";
      d.style.background=c;
      d.onclick=()=>{
        document.querySelectorAll(".color-dot").forEach(x=>x.classList.remove("selected"));
        d.classList.add("selected");
        currentColor=c;
      };
      wrap.appendChild(d);
    });
  }

  function initModes(){
    const cbn=$("modeCbnBtn"),free=$("modeFreeBtn"),page=$("gamePage");
    if(!cbn||!free||!page) return;

    cbn.onclick=()=>{
      mode="cbn";
      cbn.classList.add("active");
      free.classList.remove("active");
      page.classList.remove("free-mode");
    };

    free.onclick=()=>{
      mode="free";
      free.classList.add("active");
      cbn.classList.remove("active");
      page.classList.add("free-mode");
    };
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
    initDesigns();
    initPalette();
    initModes();
  });

})();
