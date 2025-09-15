import React, { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_CELL_SIZE = 4; // logical pixels before DPR scaling
const GRID_ROWS = 40;
const GRID_COLS = 40;

// A small set of pretty oscillators/spaceships in RLE-ish inline strings
const RLE_PATTERNS = {
  pulsar: "2b3o3b3o$bo5bo$bo5bo$bo5bo$2b3o3b3o2$2b3o3b3o$bo5bo$bo5bo$bo5bo$2b3o3b3o!",
  pentadecathlon: "b3o$bo3bo$bo3bo$bo3bo$b3o$b3o$bo3bo$bo3bo$bo3bo$b3o!",
  beacon: "2o$2o$2b2o$2b2o!",
  toad: "b3o$3o!",
  blinker: "3o!",
};

const THEMES = [
  // Pastel rainbow
  { bg: "#0b0b10", dead: "rgba(0,0,0,0)", colorFn: (i, j, t) => `hsl(${(i * 9 + j * 6 + t) % 360}, 75%, 65%)` },
  // Neon teal/purple
  { bg: "#0a0615", dead: "rgba(0,0,0,0)", colorFn: (i, j, t) => `hsl(${(200 + Math.sin((i + j + t) * 0.03) * 40) % 360}, 85%, 60%)` },
  // Sunset
  { bg: "#0c0a12", dead: "rgba(0,0,0,0)", colorFn: (i, j, t) => `hsl(${(20 + (i * 3 + t) % 60)}, 90%, ${55 + ((j + t) % 10)}%)` },
];

function parseRLE(rle) {
  const liveCells = [];
  let row = 0, col = 0, countStr = "";
  const flush = () => (countStr === "" ? 1 : parseInt(countStr, 10));
  for (let ch of rle) {
    if (/\d/.test(ch)) { countStr += ch; continue; }
    if (ch === "b") { col += flush(); countStr = ""; continue; }
    if (ch === "o") { for (let i = 0; i < flush(); i++) liveCells.push([row, col++]); countStr = ""; continue; }
    if (ch === "$") { row += flush(); col = 0; countStr = ""; continue; }
    if (ch === "!") break;
  }
  return liveCells;
}

function seedGrid(patternCells, rows, cols) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  const offsetX = Math.floor((rows - 20) / 2); // reasonable centering for typical patterns
  const offsetY = Math.floor((cols - 20) / 2);
  patternCells.forEach(([r, c]) => {
    const x = offsetX + r, y = offsetY + c;
    if (grid[x] && grid[x][y] !== undefined) grid[x][y] = 1;
  });
  return grid;
}

function nextGrid(current, rows, cols) {
  const countNeighbors = (g, x, y) => {
    let sum = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const row = (x + i + rows) % rows;
        const col = (y + j + cols) % cols;
        if (g[row][col] > 0) sum++;
      }
    }
    return sum;
  };
  return current.map((row, i) => row.map((cell, j) => {
    const n = countNeighbors(current, i, j);
    if (cell) return n === 2 || n === 3 ? 1 : 0;
    return n === 3 ? 1 : 0;
  }));
}

export default function GameOfLifeSpinner({ size = 160, cellSize = DEFAULT_CELL_SIZE, speedMs = 80 }) {
  const canvasRef = useRef(null);
  const [t, setT] = useState(0);

  const { theme, initialGrid } = useMemo(() => {
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const patternKey = Object.keys(RLE_PATTERNS)[Math.floor(Math.random() * Object.keys(RLE_PATTERNS).length)];
    const pattern = parseRLE(RLE_PATTERNS[patternKey]);
    return { theme, initialGrid: seedGrid(pattern, GRID_ROWS, GRID_COLS) };
  }, []);

  // Keep grid state in a ref for faster animation updates without React re-rendering every frame
  const gridRef = useRef(initialGrid);

  // Animation loop with requestAnimationFrame, throttled by speedMs
  useEffect(() => {
    let rafId = 0;
    let then = performance.now();
    const loop = (now) => {
      const elapsed = now - then;
      if (elapsed >= speedMs) {
        then = now - (elapsed % speedMs);
        gridRef.current = nextGrid(gridRef.current, GRID_ROWS, GRID_COLS);
        setT((v) => (v + 4) % 360); // advance hue/time
        draw();
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speedMs]);

  // High-DPI canvas setup and draw
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const effectiveCellSize = Math.max(1, Math.floor(size / GRID_COLS));
    const logicalWidth = GRID_COLS * effectiveCellSize;
    const logicalHeight = GRID_ROWS * effectiveCellSize;

    // Resize only if needed
    if (canvas.width !== Math.floor(logicalWidth * dpr) || canvas.height !== Math.floor(logicalHeight * dpr)) {
      canvas.width = Math.floor(logicalWidth * dpr);
      canvas.height = Math.floor(logicalHeight * dpr);
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Background and circular mask effect
    ctx.save();
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    // Soft vignette
    const grad = ctx.createRadialGradient(
      logicalWidth / 2, logicalHeight / 2, logicalWidth * 0.1,
      logicalWidth / 2, logicalHeight / 2, logicalWidth * 0.7
    );
    grad.addColorStop(0, "rgba(255,255,255,0.06)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    // Cells
    const grid = gridRef.current;
    for (let i = 0; i < GRID_ROWS; i++) {
      for (let j = 0; j < GRID_COLS; j++) {
        if (!grid[i][j]) continue;
        ctx.fillStyle = theme.colorFn(i, j, t);
        ctx.fillRect(j * effectiveCellSize, i * effectiveCellSize, effectiveCellSize, effectiveCellSize);
      }
    }

    // Circular mask via composite to look like a spinner orb
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    const r = Math.min(logicalWidth, logicalHeight) / 2;
    ctx.arc(logicalWidth / 2, logicalHeight / 2, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Subtle glossy overlay
    const gloss = ctx.createLinearGradient(0, 0, 0, logicalHeight);
    gloss.addColorStop(0, "rgba(255,255,255,0.08)");
    gloss.addColorStop(0.5, "rgba(255,255,255,0)");
    ctx.fillStyle = gloss;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    ctx.restore();
  };

  useEffect(() => { draw(); /* initial paint */ }, []);

  return (
    <div style={{ width: size, height: size, display: "grid", placeItems: "center" }}>
      <canvas ref={canvasRef} style={{ borderRadius: "50%", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
    </div>
  );
}


