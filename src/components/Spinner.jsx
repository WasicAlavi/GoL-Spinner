import React, { useEffect, useRef } from "react";

const GRID_ROWS = 30;
const GRID_COLS = 30;
const CELL_SIZE = 5;
const SPEED_MS = 400;
const scale = 1;

// Pulsar (period 3 oscillator) in RLE with header/comments
const PULSAR_RLE = `#N Pulsar
#O John Conway
#C A period 3 oscillator. Despite its size, this is the fourth most common oscillator (and by
#C far the most common of period greater than 2).
#C www.conwaylife.com/wiki/index.php?title=Pulsar
x = 13, y = 13, rule = B3/S23
2b3o3b3o2b2$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o2b2$2b3o3b3o2b$o4bobo4bo$o4bobo4bo$o4bobo4bo2$2b3o3b3o!`;

function parseRLE(rle) {
  const lines = rle.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#") && !/^x\s*=/.test(l));
  const body = lines.join("");
  const liveCells = [];
  let row = 0, col = 0, countStr = "";
  const flush = () => (countStr === "" ? 1 : parseInt(countStr, 10));
  let maxRow = 0, maxCol = 0;
  for (let ch of body) {
    if (/\d/.test(ch)) { countStr += ch; continue; }
    if (ch === "b") { col += flush(); countStr = ""; continue; }
    if (ch === "o") {
      const n = flush();
      for (let i = 0; i < n; i++) { liveCells.push([row, col++]); }
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col - 1);
      countStr = ""; continue;
    }
    if (ch === "$") { row += flush(); col = 0; countStr = ""; continue; }
    if (ch === "!") break;
  }
  return { cells: liveCells, height: maxRow + 1, width: maxCol + 1 };
}

function seedGrid(rows, cols, pattern) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  const patternHeight = pattern.height * scale;
  const patternWidth = pattern.width * scale;
  const offsetX = Math.max(0, Math.floor((rows - patternHeight) / 2));
  const offsetY = Math.max(0, Math.floor((cols - patternWidth) / 2));
  pattern.cells.forEach(([r, c]) => {
    const baseX = offsetX + r * scale;
    const baseY = offsetY + c * scale;
    for (let i = 0; i < scale; i++) {
      for (let j = 0; j < scale; j++) {
        const x = baseX + i;
        const y = baseY + j;
        if (grid[x] && grid[x][y] !== undefined) grid[x][y] = 1;
      }
    }
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
        if (g[row][col]) sum++;
      }
    }
    return sum;
  };

  return current.map((row, i) =>
    row.map((cell, j) => {
      const n = countNeighbors(current, i, j);
      if (cell) return n === 2 || n === 3 ? 1 : 0;
      return n === 3 ? 1 : 0;
    })
  );
}

export default function Spinner({
  text = "Loading...",
  color = "hsl(200, 80%, 60%)",
  background = "black",
}) {
  const canvasRef = useRef(null);
  const gridRef = useRef(seedGrid(GRID_ROWS, GRID_COLS, parseRLE(PULSAR_RLE)));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      // background
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // cells
      const grid = gridRef.current;
      for (let i = 0; i < GRID_ROWS; i++) {
        for (let j = 0; j < GRID_COLS; j++) {
          if (grid[i][j]) {
            ctx.fillStyle = color;
            ctx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }
      }
    };

    const step = () => {
      gridRef.current = nextGrid(gridRef.current, GRID_ROWS, GRID_COLS);
      draw();
    };

    draw(); // initial render
    const interval = setInterval(step, SPEED_MS);
    return () => clearInterval(interval);
  }, [color, background]);

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        width: "100%",
        height: "100%",
        textAlign: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        width={GRID_COLS * CELL_SIZE}
        height={GRID_ROWS * CELL_SIZE}
        style={{ borderRadius: "10px" }}
      />
      {text && (
        <div style={{ marginTop: "12px", color: "#ccc", fontSize: "14px" }}>
          {text}
        </div>
      )}
    </div>
  );
}


