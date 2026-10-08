# Dereck Alexander — Superhéroe Arcade

Mini juego web de cumpleaños construido con **Node.js + Express** en el backend y
**Vue 3 + Phaser 3 + Vite** en el frontend.

La experiencia combina una estética original de plataformas arcade, bloques
geométricos, monedas, obstáculos y una celebración final con la foto real de
Dereck.

## Requisitos

- Node.js 18 o superior
- npm

## Instalación

Abre una terminal en esta carpeta:

```bash
npm install
npm run dev
```

Esto levanta:
- Frontend Vite: http://localhost:5173
- Backend Express: http://localhost:3000

El frontend usa el backend para registrar el resultado de la partida.

## Producción

```bash
npm run build
npm start
```

Luego abre:

http://localhost:3000

## Controles

- PC: `ESPACIO`, `FLECHA ARRIBA` o clic/tap para saltar.
- Móvil: toca la pantalla.
- El personaje corre automáticamente.
- Recoge monedas y evita los obstáculos.

## Personalización

- Foto final: `frontend/public/assets/dereck.jpg`
- Mensaje: `frontend/src/game/GameScene.js`
- Velocidad, obstáculos y monedas: `frontend/src/game/GameScene.js`
- Colores y estética: `frontend/src/styles/game.css`
- Backend: `backend/server.js`

## Nota

El traje del protagonista es un superhéroe arácnido ORIGINAL, sin logos ni
recursos oficiales de franquicias. La experiencia conserva la sensación de
plataformas rítmicas y bloques/monedas de videojuegos.
