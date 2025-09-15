import React from "react";
import Spinner from "./components/Spinner.jsx";

export default function App() {
  return (
    <div style={{ display: "grid", placeItems: "center", width: "100%", minHeight: "100vh", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: 0 }}>Loading</h1>
        <p style={{ opacity: 0.8, marginTop: 6 }}>Minimal Conway spinner</p>
      </div>
      <Spinner />
    </div>
  );
}
