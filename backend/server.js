const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SCORE_FILE = path.join(__dirname, "score.json");
const MAX_SCORE = 100000; // el puntaje máximo real del juego ronda los 15 000

app.use(cors());
app.use(express.json({ limit: "1kb" }));

// El récord se guarda en backend/score.json para que sobreviva a reinicios
let bestScore = 0;
try {
  const saved = JSON.parse(fs.readFileSync(SCORE_FILE, "utf8"));
  if (Number.isFinite(saved.bestScore)) bestScore = Math.floor(saved.bestScore);
} catch (_) {
  /* primera ejecución o archivo ilegible: se empieza en 0 */
}

const saveBestScore = () => {
  fs.writeFile(SCORE_FILE, JSON.stringify({ bestScore }), (err) => {
    if (err) console.warn("No se pudo guardar el récord:", err.message);
  });
};

app.get("/api/health", (req, res) => {
  res.json({ ok: true, game: "Dereck Superhéroe Arcade" });
});

app.get("/api/score", (req, res) => {
  res.json({ bestScore });
});

app.post("/api/score", (req, res) => {
  const score = Math.floor(Number(req.body && req.body.score));
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    return res.status(400).json({ ok: false, error: "Puntaje inválido", bestScore });
  }
  const newRecord = score > bestScore;
  if (newRecord) {
    bestScore = score;
    saveBestScore();
  }
  res.json({ ok: true, bestScore, newRecord });
});

// Rutas /api desconocidas: 404 en JSON (no devolver el HTML del juego)
app.use("/api", (req, res) => {
  res.status(404).json({ ok: false, error: "No encontrado" });
});

// Frontend compilado (producción)
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendDist));

// Respaldo a index.html. Se usa app.use en vez de app.get("*"),
// porque "*" ya no es una ruta válida en Express 5 y rompe el arranque.
app.use((req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.listen(PORT, () => {
  console.log("Servidor iniciado en http://localhost:" + PORT);
});
