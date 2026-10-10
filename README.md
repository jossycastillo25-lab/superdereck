# Super Dereck — Superhéroe Arcade

Juego web de cumpleaños hecho con **Vue 3 + Phaser 3 + Vite** (frontend) y **Node.js + Express** (backend, guarda el récord).

Eliges personaje y dificultad, recoges las 20 estrellas, vences al jefe PAC-REX y llegas a la fiesta. Al ganar hay una celebración con fuegos artificiales, globos que se pueden explotar, confeti y "Feliz Cumpleaños" sintetizado.

## Requisitos

- Node.js 18 o superior
- npm

## Instalación

~~~bash
npm run install:all
~~~

## Desarrollo

Abre **dos terminales** en la raíz del proyecto:

~~~bash
# Terminal 1 - backend (http://localhost:3000)
npm run dev:backend

# Terminal 2 - frontend (http://localhost:5173)
npm run dev:frontend
~~~

Vite redirige las peticiones /api al backend automáticamente. Si el backend no está encendido, el juego funciona igual pero sin récord.

## Producción

~~~bash
npm run build
npm start
~~~

Luego abre http://localhost:3000

## Controles

| | Super Dereck (vuela) | Geometry Cube / Robloxian |
|---|---|---|
| Mover | Flechas | Flechas izquierda / derecha |
| Acción | ESPACIO dispara láser | ESPACIO o flecha arriba para saltar |
| Enemigos | Láser o caer sobre ellos | Saltar sobre ellos |

**En celulares y tablets** aparecen botones táctiles en pantalla.

## Personalización

- Foto del Funko: frontend/public/assets/dereck-funko.jpg
- Dedicatoria y textos de la fiesta: plantilla de frontend/src/App.vue
- Nivel, estrellas, pinchos, enemigos y checkpoints: método buildLevel() en frontend/src/App.vue
- Vidas y velocidad por dificultad: arreglo difficulties en frontend/src/App.vue
- Colores y estética: bloque de estilos de frontend/src/App.vue

## Estructura

~~~
backend/server.js        API del récord + sirve el frontend compilado
frontend/src/App.vue     Menú, juego (Phaser) y pantalla de victoria
frontend/public/assets/  Imágenes
~~~

## Récord

El mejor puntaje se guarda en backend/score.json (ignorado por git). Es un récord global para todos los jugadores.
