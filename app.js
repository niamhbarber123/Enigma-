/* =========================
   Tap-to-Colour (Colour-by-Number + designs)
   Requires these elements on game.html:
   - #designGrid, #palette, #grid, #saveMsg
   - #modeNumberBtn, #modeFreeBtn
========================= */

const ENIGMA_GAME_KEY = "enigmaColourGameV3";
let enigmaColourMode = "number";     // "number" or "free"
let enigmaCurrentDesign = "mandala"; // design id
let enigmaSelectedColour = "#d9d2ff";
let enigmaSelectedNumber = 1;
let enigmaUndoStack = [];

/* 16 calming colours */
const ENIGMA_COLOURS = [
  { n: 1,  c: "#d9d2ff" }, { n: 2,  c: "#b8a6d9" }, { n: 3,  c: "#efe9f8" }, { n: 4,  c: "#b8e0d2" },
  { n: 5,  c: "#8fcfbf" }, { n: 6,  c: "#a8d8ff" }, { n: 7,  c: "#7fb5e6" }, { n: 8,  c: "#ffd5c7" },
  { n: 9,  c: "#f4c2c2" }, { n: 10, c: "#ffeaa6" }, { n: 11, c: "#d6c9ef" }, { n: 12, c: "#cfd9d6" },
  { n: 13, c: "#ffffff" }, { n: 14, c: "#f2eff8" }, { n: 15, c: "#cbbfff" }, { n: 16, c: "#9ad0d6" }
];

/* ---- Designs (14x14 templates; 0 = blank, 1..16 = numbers) ---- */
const designs = [
  { id: "mandala",  name: "Mandala",   desc: "Balanced calm",   template: tplMandala() },
  { id: "flower",   name: "Flower",    desc: "Soft petals",     template: tplFlower() },
  { id: "butterfly",name: "Butterfly", desc: "Light & hopeful", template: tplButterfly() },
  { id: "waves",    name: "Waves",     desc: "Flow gently",     template: tplWaves() },
  { id: "heart",    name: "Heart",     desc: "Self kindness",   template: tplHeart() },
  { id: "sunrise",  name: "Sunrise",   desc: "New start",       template: tplSunrise() }
];

/* ---- Storage helpers ---- */
function getGameData(){
  return JSON.parse(localStorage.getItem(ENIGMA_GAME_KEY) || "{}");
}
function setGameData(data){
  localStorage.setItem(ENIGMA_GAME_KEY, JSON.stringify(data));
}
function getDesignSave(){
  const data = getGameData();
  return data[enigmaCurrentDesign] || {};
}
function setDesignSave(saveObj){
  const data = getGameData();
  data[enigmaCurrentDesign] = saveObj;
  setGameData(data);
}
function setSaveMsg(msg){
  const el = document.getElementById("saveMsg");
  if (el) el.textContent = msg;
}

/* ---- Mode switching ---- */
function setColourMode(mode){
  enigmaColourMode = mode;
  localStorage.setItem("enigmaColourMode", mode);

  const nb = document.getElementById("modeNumberBtn");
  const fb = document.getElementById("modeFreeBtn");
  if (nb && fb){
    nb.classList.toggle("active", mode === "number");
    fb.classList.toggle("active", mode === "free");
  }

  setSaveMsg(
    mode === "number"
      ? "Colour-by-number: pick a number, then tap matching tiles."
      : "Free colour: pick any colour and tap tiles."
  );

  renderColourBoard();
}

/* ---- Init ---- */
function initColourGame(){
  const grid = document.getElementById("grid");
  const palette = document.getElementById("palette");
  const designGrid = document.getElementById("designGrid");
  if (!grid || !palette || !designGrid) return;

  // Restore last design + mode
  const lastDesign = localStorage.getItem("enigmaLastDesignV3");
  if (lastDesign && designs.some(d => d.id === lastDesign)) enigmaCurrentDesign = lastDesign;

  const lastMode = localStorage.getItem("enigmaColourMode");
  if (lastMode === "free" || lastMode === "number") enigmaColourMode = lastMode;

  // Build palette
  palette.innerHTML = "";
  ENIGMA_COLOURS.forEach((item, idx) => {
    const chip = document.createElement("div");
    chip.className = "palette-chip" + (idx === 0 ? " active" : "");
    chip.style.background = item.c;

    const num = document.createElement("div");
    num.className = "palette-num";
    num.textContent = String(item.n);
    chip.appendChild(num);

    chip.addEventListener("click", () => {
      document.querySelectorAll(".palette-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      enigmaSelectedColour = item.c;
      enigmaSelectedNumber = item.n;

      if (enigmaColourMode === "number"){
        setSaveMsg(`Selected number ${item.n}. Tap tiles showing ${item.n}.`);
      } else {
        setSaveMsg(`Selected colour.`);
      }
    });

    palette.appendChild(chip);
  });

  // Build designs picker with small preview
  designGrid.innerHTML = "";
  designs.forEach(d => {
    const tile = document.createElement("div");
    tile.className = "design-tile" + (d.id === enigmaCurrentDesign ? " active" : "");

    const prev = document.createElement("div");
    prev.className = "design-preview";

    const flat = d.template.flat();
    for (let i = 0; i < 100; i++){
      const dot = document.createElement("div");
      const v = flat[Math.floor((i / 100) * flat.length)] || 0;
      dot.className = "preview-dot" + (v === 0 ? " off" : "");
      prev.appendChild(dot);
    }

    const txt = document.createElement("div");
    txt.innerHTML = `<div class="design-title">${d.name}</div><div class="design-sub">${d.desc}</div>`;

    tile.appendChild(prev);
    tile.appendChild(txt);

    tile.addEventListener("click", () => {
      enigmaCurrentDesign = d.id;
      localStorage.setItem("enigmaLastDesignV3", d.id);
      document.querySelectorAll(".design-tile").forEach(t => t.classList.remove("active"));
      tile.classList.add("active");
      enigmaUndoStack = [];
      renderColourBoard();
      setSaveMsg("Design loaded ✨");
    });

    designGrid.appendChild(tile);
  });

  // Mode buttons reflect current mode
  document.getElementById("modeNumberBtn")?.classList.toggle("active", enigmaColourMode === "number");
  document.getElementById("modeFreeBtn")?.classList.toggle("active", enigmaColourMode === "free");

  renderColourBoard();
  setSaveMsg(enigmaColourMode === "number"
    ? "Colour-by-number: pick a number, then tap matching tiles."
    : "Free colour: pick any colour and tap tiles."
  );
}

/* ---- Render board ---- */
function renderColourBoard(){
  const grid = document.getElementById("grid");
  if (!grid) return;

  const design = designs.find(d => d.id === enigmaCurrentDesign);
  const tpl = design ? design.template : blankTemplate();
  const save = getDesignSave(); // key "r,c" -> colour

  grid.innerHTML = "";
  for (let r = 0; r < 14; r++){
    for (let c = 0; c < 14; c++){
      const key = `${r},${c}`;
      const number = tpl[r][c];

      const cell = document.createElement("div");
      cell.className = "cell";

      // blank spaces
      if (number === 0){
        cell.style.background = "transparent";
        cell.style.boxShadow = "none";
        cell.style.pointerEvents = "none";
        grid.appendChild(cell);
        continue;
      }

      // apply saved colour
      if (save[key]){
        cell.style.background = save[key];
        cell.classList.add("filled");
      }

      // number label
      const label = document.createElement("div");
      label.className = "num";
      label.textContent = String(number);
      cell.appendChild(label);

      cell.addEventListener("click", () => {
        const prev = save[key] || "";
        enigmaUndoStack.push({ key, prev });

        // In number mode, only allow filling matching numbers
        if (enigmaColourMode === "number" && number !== enigmaSelectedNumber){
          setSaveMsg(`That tile is ${number}. Select colour ${number} to fill it.`);
          return;
        }

        // fill or erase depending on selected colour
        const newColour = enigmaSelectedColour || "";
        if (newColour){
          save[key] = newColour;
          cell.style.background = newColour;
          cell.classList.add("filled");
        } else {
          delete save[key];
          cell.style.background = "";
          cell.classList.remove("filled");
        }

        setDesignSave(save);
      });

      grid.appendChild(cell);
    }
  }
}

/* ---- Tools ---- */
function enigmaUndo(){
  const last = enigmaUndoStack.pop();
  if (!last) return;

  const save = getDesignSave();
  if (last.prev){
    save[last.key] = last.prev;
  } else {
    delete save[last.key];
  }
  setDesignSave(save);
  renderColourBoard();
  setSaveMsg("Undone ↩︎");
}

function enigmaEraser(){
  enigmaSelectedColour = "";
  setSaveMsg("Eraser selected 🧼 Tap a tile to clear it.");
}

function enigmaClear(){
  if (!confirm("Clear this design?")) return;
  setDesignSave({});
  enigmaUndoStack = [];
  renderColourBoard();
  setSaveMsg("Cleared ✨");
}

function markColouringComplete(){
  localStorage.setItem("enigmaColourComplete", new Date().toISOString());
  setSaveMsg("Completed 🎉 Well done — take a calm breath.");
}

/* ---- Templates ---- */
function blankTemplate(){
  return Array.from({ length: 14 }, () => Array.from({ length: 14 }, () => 0));
}

/* A ring-ish base for mandala style */
function ringTemplate(){
  const t = blankTemplate();
  const cx = 6.5, cy = 6.5;
  for (let r = 0; r < 14; r++){
    for (let c = 0; c < 14; c++){
      const dx = r - cx, dy = c - cy;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < 6.6 && d > 1.8){
        const band = Math.max(1, Math.min(8, Math.floor(d)));
        t[r][c] = band;
      }
    }
  }
  return t;
}

function tplMandala(){
  const t = ringTemplate();
  for (let r=0;r<14;r++){
    for (let c=0;c<14;c++){
      if (t[r][c] !== 0){
        if ((r+c) % 4 === 0) t[r][c] = 11;
        if ((r*c) % 11 === 0) t[r][c] = 2;
      }
    }
  }
  // center block
  for (let r=5;r<=8;r++){
    for (let c=5;c<=8;c++){
      t[r][c] = 3;
    }
  }
  return t;
}

function tplFlower(){
  const t = blankTemplate();
  const cx=6.5, cy=6.5;
  for (let r=0;r<14;r++){
    for (let c=0;c<14;c++){
      const dx=r-cx, dy=c-cy;
      const d=Math.sqrt(dx*dx+dy*dy);
      if (d < 6.2){
        if (d < 2.2) t[r][c] = 10;                     // center
        else if (Math.abs(dx*dy) < 6) t[r][c] = 1;      // petal lines
        else t[r][c] = 11;                               // background
      }
    }
  }
  return t;
}

function tplButterfly(){
  const t = blankTemplate();
  for (let r=2;r<12;r++){
    for (let c=1;c<13;c++){
      const left = c < 7;
      const wing = left ? (7-c) : (c-6);
      const height = Math.abs(r-6.5);
      if (wing >= 1 && wing <= 5 && height <= 4.8){
        if (wing >= 4) t[r][c] = 6;
        else if (height < 1.2) t[r][c] = 8;
        else t[r][c] = 4;
      }
    }
  }
  // body
  for (let r=3;r<11;r++){
    t[r][6] = 12;
    t[r][7] = 12;
  }
  return t;
}

function tplWaves(){
  const t = blankTemplate();
  for (let r=2;r<12;r++){
    for (let c=1;c<13;c++){
      const wave = 6 + 2*Math.sin((c/12)*Math.PI*2);
      if (Math.abs(r - wave) < 1.2) t[r][c] = 16;      // crest
      if (r > wave && r < wave+3) t[r][c] = 6;         // mid
      if (r >= wave+3) t[r][c] = 7;                    // deep
    }
  }
  return t;
}

function tplHeart(){
  const t = blankTemplate();
  for (let r=2;r<12;r++){
    for (let c=1;c<13;c++){
      const x = (c-6.5)/6;
      const y = (r-6.5)/6;
      const a = x*x + y*y - 0.3;
      const heart = a*a*a - x*x*y*y*y;
      if (heart <= 0){
        t[r][c] = (r < 6) ? 9 : 8;
      }
    }
  }
  return t;
}

function tplSunrise(){
  const t = blankTemplate();
  for (let r=1;r<13;r++){
    for (let c=1;c<13;c++){
      if (r > 8) t[r][c] = 7;       // horizon
      else t[r][c] = 14;            // sky
    }
  }
  const cx=6.5, cy=8.5;
  for (let r=2;r<12;r++){
    for (let c=1;c<13;c++){
      const dx=r-cx, dy=c-cy;
      const d=Math.sqrt(dx*dx+dy*dy);
      if (d < 3.2 && r <= 8){
        t[r][c] = 10;               // sun
      }
    }
  }
  for (let r=2;r<9;r++){
    for (let c=1;c<13;c++){
      if (t[r][c] === 14 && Math.abs(c-6.5) < 4) t[r][c] = 3;   // glow
      if (t[r][c] === 14 && Math.abs(c-6.5) < 2) t[r][c] = 11;  // inner glow
    }
  }
  return t;
}
