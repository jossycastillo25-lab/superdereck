const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let bestScore = 0;

app.get("/api/health", (req, res) => {
  res.json({ ok: true, game: "Dereck Superhéroe Arcade" });
});

app.get("/api/score", (req, res) => {
  res.json({ bestScore });
});

app.post("/api/score", (req, res) => {
  const score = Number(req.body.score || 0);
  if (Number.isFinite(score) && score > bestScore) {
    bestScore = Math.floor(score);
  }
  res.json({ ok: true, bestScore });
});

// Servir archivos estáticos del frontend en producción
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendDist));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});