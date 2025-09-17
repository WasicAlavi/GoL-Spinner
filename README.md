# Game of Life Spinner

A fun **loading spinner** built with **React** and inspired by Conway’s Game of Life.  
It animates oscillating patterns (like the **Pulsar**) inside a canvas and displays optional text underneath.  
You can customize the **spinner color**, **background color**, and the **loading text**.

---

## ✨ Features

- Animated Conway’s Game of Life pattern as a spinner  
- Customizable **spinner color**  
- Customizable **background color**  
- Optional loading **text message**  
- Lightweight and reusable React component  

---

## 📦 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/game-of-life-spinner.git
cd game-of-life-spinner
npm install

```
🚀 Usage

```bash
import React from "react";
import Spinner from "./Spinner";

function App() {
  return (
    <div style={{ height: "100vh" }}>
      <Spinner
        text="Loading your data..."
        color="hsl(200, 80%, 60%)"
        backgroundColor="#000"
      />
    </div>
  );
}

export default App;

```


