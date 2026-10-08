<template>
  <div class="app-shell" :class="{ party: gameState === 'victory' }">
    <div class="scanlines"></div>

    <!-- 1. SELECCIÓN -->
    <div v-if="gameState === 'select'" class="select-screen">
      <span class="badge">EDICIÓN ESPECIAL</span>
      <h1>SUPER DERECK</h1>
      <p class="subtitle">Recoge las 20 estrellas, vence al jefe y llega a la fiesta.</p>

      <div class="cards-grid">
        <div v-for="char in characters" :key="char.id" class="char-card"
             :class="{ selected: selectedCharacter?.id === char.id }" @click="selectedCharacter = char">
          <div class="char-avatar-frame"><span class="emoji-icon">{{ char.emoji }}</span></div>
          <h3>{{ char.name }}</h3>
          <p class="char-ability">{{ char.ability }}</p>
        </div>
      </div>

      <p class="section-label">DIFICULTAD</p>
      <div class="diff-row">
        <button v-for="d in difficulties" :key="d.id" class="diff-btn"
                :class="[d.id, { on: selectedDiff.id === d.id }]" @click="selectedDiff = d">
          <strong>{{ d.label }}</strong><small>{{ d.desc }}</small>
        </button>
      </div>

      <div v-if="bestScore > 0" class="best-score-badge">🏆 RÉCORD: {{ bestScore }}</div>
      <button class="btn-nintendo" :disabled="!selectedCharacter" @click="startGame">¡INICIAR AVENTURA!</button>
    </div>

    <!-- 2. JUEGO -->
    <div v-else-if="gameState === 'playing'" class="game-screen">
      <div class="hud-bar">
        <div class="hud-pill">{{ selectedCharacter?.emoji }} {{ selectedDiff.label }}</div>
        <div class="hud-pill"><span>{{ '❤️'.repeat(Math.max(lives, 0)) }}</span></div>
        <div class="hud-pill">⭐ <span>{{ starsCollected }}/20</span></div>
        <div class="hud-pill">⏱ <span>{{ elapsed }}s</span></div>
        <div class="hud-pill">PTS <span>{{ score }}</span></div>
      </div>
      <div v-if="bossActive" class="boss-bar">
        <span>JEFE PAC-REX</span>
        <div class="boss-track"><div class="boss-fill" :style="{ width: (bossHp / bossMax * 100) + '%' }"></div></div>
      </div>

      <div class="canvas-wrapper">
        <div id="phaser-mount" class="phaser-mount"></div>
        <div class="crt"></div>
      </div>

      <div class="controls-guide">
        <span v-if="selectedCharacter?.id === 'dereck'">
          <b class="key">↑ ↓ ← →</b> volar · <b class="key">ESPACIO</b> disparar láser · cae sobre los malos para aplastarlos
        </span>
        <span v-else>
          <b class="key">← →</b> mover · <b class="key">ESPACIO / ↑</b> saltar · salta sobre los malos para aplastarlos
        </span>
      </div>
    </div>

    <!-- 3. GAME OVER -->
    <div v-else-if="gameState === 'gameover'" class="end-card over">
      <h1>GAME OVER</h1>
      <p class="reason">{{ overReason }}</p>
      <div class="stats-box">
        <p>Estrellas: <strong>{{ starsCollected }}/20</strong></p>
        <p>Puntos: <strong>{{ score }}</strong></p>
      </div>
      <div class="btn-row">
        <button class="btn-nintendo" @click="startGame">REINTENTAR</button>
        <button class="btn-nintendo gray" @click="resetToSelect">MENÚ</button>
      </div>
    </div>

    <!-- 4. VICTORIA Y GRAN FIESTA DE CUMPLEAÑOS -->
    <div v-else-if="gameState === 'victory'" class="end-card win celebration-screen">
      <!-- Reflectores -->
      <div class="beam b1"></div>
      <div class="beam b2"></div>

      <!-- Banderines Animados -->
      <div class="garland-container">
        <div v-for="n in 12" :key="'flag-'+n" class="flag-item" :style="{ borderTopColor: getFlagColor(n) }"></div>
      </div>

      <!-- Luces parpadeantes de colores -->
      <div class="festive-lights">
        <span v-for="l in 10" :key="'light-'+l" class="light-bulb"
              :style="{ animationDelay: (l * 0.2) + 's', '--lc': getFlagColor(l) }"></span>
      </div>

      <!-- Notas musicales flotando (suena la canción) -->
      <div class="notes">
        <span v-for="n in notes" :key="n.id" class="note" :style="n.style">{{ n.ch }}</span>
      </div>

      <span class="crown-tag pulse-anim">👑 ¡GRAN CELEBRACIÓN DE CUMPLEAÑOS! 👑</span>

      <!-- Cartel Neón -->
      <div class="hero-banner neon-border">
        <h2>🎉 ¡FELIZ CUMPLEAÑOS A MI SÚPER HÉROE FAVORITO! 🎉</h2>
      </div>

      <div class="dedication-card reveal" style="--d: .5s">
        <p class="dedication-text">
          Que Dios te bendiga y te regale muchos años de vida llenos de salud y alegría.<br>
          <strong class="author-tag">Con todo mi cariño: Jossie Castillo</strong>
        </p>
      </div>

      <!-- Escenario Principal -->
      <div class="stage-container reveal" style="--d: .7s">
        <span v-for="sp in sparkles" :key="'sp-'+sp.id" class="sparkle" :style="sp.style">✨</span>

        <div class="party-side">
          <span class="cake-emoji floating-anim">🎂</span>
          <span class="party-label">¡PASTEL!</span>
        </div>

        <div class="podium-winner">
          <div class="halo"></div>
          <div class="funko-large-wrapper glow-gold">
            <img src="/assets/dereck-funko.jpg" alt="Funko Dereck" class="funko-img" />
          </div>
          <div class="trophy-badge">🏆</div>
          <div class="podium-stand">
            <span class="podium-rank">1° LUGAR</span>
            <span class="podium-title">¡SUPER DERECK!</span>
          </div>
        </div>

        <div class="party-side">
          <span class="gift-emoji floating-anim-alt">🎁</span>
          <span class="party-label">¡REGALOS!</span>
        </div>
      </div>

      <div class="stats-box clear-text reveal" style="--d: .9s">
        <p>Estrellas recolectadas: <strong>{{ starsCollected }}/20 ⭐</strong></p>
        <p>Tiempo de recorrido: <strong>{{ elapsed }}s</strong> · Bono: <strong>+{{ timeBonus }}</strong></p>
        <p>Puntuación total: <strong>{{ score }}</strong></p>
        <p v-if="isNewRecord" class="new-record rainbow-text">🌟 ¡NUEVO RÉCORD DE CUMPLEAÑOS! 🌟</p>
      </div>

      <div class="btn-row reveal" style="--d: 1.1s">
        <button class="btn-nintendo fireworks-btn" @click="triggerCelebrationFireworks">🎆 ¡MÁS FUEGOS ARTIFICIALES!</button>
        <button class="btn-nintendo" @click="playBirthdayMelody">🎵 REPETIR CANCIÓN</button>
        <button class="btn-nintendo gray" @click="resetToSelect">VOLVER AL MENÚ</button>
      </div>
    </div>

    <!-- Capas de la fiesta (fondo, globos y efectos a pantalla completa) -->
    <template v-if="gameState === 'victory'">
      <div class="party-bg"><div class="moon"></div><div class="skyline"></div></div>
      <div class="balloons-layer">
        <div v-for="b in balloons" :key="b.id + '-' + b.key" class="b-wrap" :class="{ popped: b.popped }" :style="balloonStyle(b)">
          <div class="b-body" @click="popBalloon(b, $event)"></div>
        </div>
      </div>
      <canvas ref="confCanvas" class="fx-canvas conf"></canvas>
      <canvas ref="fxCanvas" class="fx-canvas"></canvas>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import Phaser from 'phaser';

const WIDTH = 960, HEIGHT = 540, GROUND_Y = 440, LEVEL_WIDTH = 6400, GOAL_X = 6280;
const FONT = '"Press Start 2P", monospace';

const gameState = ref('select');
const score = ref(0), starsCollected = ref(0), lives = ref(3), elapsed = ref(0), timeBonus = ref(0);
const bestScore = ref(0), isNewRecord = ref(false), overReason = ref('');
const bossActive = ref(false), bossHp = ref(1), bossMax = ref(1);

const characters = ref([
  { id: 'dereck', name: 'Super Dereck', ability: 'Vuela y dispara láser', emoji: '🦸‍♂️' },
  { id: 'geometry', name: 'Geometry Cube', ability: 'Salto rápido y ágil', emoji: '🟦' },
  { id: 'roblox', name: 'Robloxian', ability: 'Salto estándar', emoji: '🧱' }
]);
const difficulties = [
  { id: 'easy', label: 'FÁCIL', desc: '5 vidas · enemigos lentos', lives: 5, speed: 0.75, pacs: 5, ghosts: 2, boss: 6 },
  { id: 'normal', label: 'NORMAL', desc: '3 vidas · reto justo', lives: 3, speed: 1, pacs: 8, ghosts: 4, boss: 9 },
  { id: 'hard', label: 'DIFÍCIL', desc: '2 vidas · todo más rápido', lives: 2, speed: 1.35, pacs: 8, ghosts: 6, boss: 14 }
];
const selectedCharacter = ref(characters.value[0]);
const selectedDiff = ref(difficulties[1]);
let gameInstance = null;

/* ---------- Backend ---------- */
const fetchBestScore = async () => {
  try {
    const res = await fetch('/api/score');
    if (res.ok) bestScore.value = (await res.json()).bestScore || 0;
  } catch { /* sin backend */ }
};
const saveScoreToBackend = async (finalScore) => {
  try {
    const res = await fetch('/api/score', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: finalScore })
    });
    if (res.ok) {
      const data = await res.json();
      if (finalScore >= data.bestScore && finalScore > 0) isNewRecord.value = true;
      bestScore.value = data.bestScore;
    }
  } catch { /* sin backend */ }
};
onMounted(fetchBestScore);

/* ---------- Sonido (sintetizado, sin archivos) ---------- */
let audioCtx = null;
const sfx = (freq, dur = 0.12, type = 'square', slide = 0) => {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime, o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(t); o.stop(t + dur);
  } catch { /* audio bloqueado */ }
};

/* ---------- Escena ---------- */
class MainScene extends Phaser.Scene {
  constructor() { super('MainScene'); }

  preload() {
    // Si el archivo está en /public/assets/, la URL correcta en Vite es /assets/... (sin "public")
    this.load.image('dereck-funko', '/assets/dereck-funko.jpg');
  }

  init() {
    this.diff = selectedDiff.value;
    this.hero = selectedCharacter.value.id;
    this.stars = 0; this.scoreVal = 0; this.currentLives = this.diff.lives;
    this.finished = false; this.invuln = false; this.bossDead = false;
    this.facing = 1; this.noCtl = 0; this.lastGround = 0; this.msgT = 0;
    this.checkpoint = { x: 150, y: GROUND_Y - 80 };
  }

  create() {
    this.cameras.main.setBackgroundColor('#0b1033');
    this.makeTextures();
    this.makeBackground();

    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, HEIGHT + 300);
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, HEIGHT);

    this.platforms = this.physics.add.staticGroup();
    this.starsGroup = this.physics.add.staticGroup();
    this.hearts = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group({ allowGravity: false });
    this.lasers = this.physics.add.group({ allowGravity: false });
    this.cps = [];

    this.buildLevel();
    this.buildPlayer();

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.starsGroup, (p, s) => this.collectStar(s));
    this.physics.add.overlap(this.player, this.hearts, (p, h) => this.collectHeart(h));
    this.physics.add.overlap(this.player, this.spikes, () => this.hurt(this.player.x));
    this.physics.add.overlap(this.player, this.enemies, (p, e) => this.touchEnemy(e));
    this.physics.add.overlap(this.lasers, this.enemies, (l, e) => { l.destroy(); this.damageEnemy(e, false); });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.startTime = this.time.now;
    this.floatText(WIDTH / 2, 90, '¡VENCE AL JEFE Y LLEGA A LA FIESTA!', '#facc15', true);
  }

  /* ----- Texturas dibujadas por código ----- */
  makeTextures() {
    if (this.textures.exists('star')) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const tex = (k, w, h) => { g.generateTexture(k, w, h); g.clear(); };

    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 8 : 19, a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push({ x: 20 + Math.cos(a) * r, y: 20 + Math.sin(a) * r });
    }
    g.fillStyle(0xfacc15); g.fillPoints(pts, true); tex('star', 40, 40);

    g.fillStyle(0xffcc00); g.slice(20, 20, 20, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(330), false); g.fillPath();
    g.fillStyle(0x000000); g.fillCircle(21, 9, 3); tex('pacman', 40, 40);

    g.fillStyle(0xf0abfc); g.fillCircle(20, 18, 16); g.fillRect(4, 18, 32, 18);
    g.fillTriangle(4, 36, 12, 28, 12, 36); g.fillTriangle(14, 36, 20, 28, 26, 36); g.fillTriangle(28, 36, 28, 28, 36, 36);
    g.fillStyle(0xffffff); g.fillCircle(14, 16, 5); g.fillCircle(27, 16, 5);
    g.fillStyle(0x1e1b4b); g.fillCircle(15, 17, 2.5); g.fillCircle(28, 17, 2.5); tex('ghost', 40, 40);

    g.fillStyle(0xe2e8f0); g.fillTriangle(0, 24, 10, 0, 20, 24); g.fillTriangle(20, 24, 30, 0, 40, 24);
    g.fillStyle(0xef4444); g.fillRect(0, 22, 40, 2); tex('spike', 40, 24);

    g.fillStyle(0xf43f5e); g.fillCircle(10, 10, 8); g.fillCircle(22, 10, 8); g.fillTriangle(2, 14, 30, 14, 16, 30); tex('heart', 32, 32);

    g.fillStyle(0x67e8f9); g.fillRect(0, 0, 28, 8); g.fillStyle(0xffffff); g.fillRect(4, 2, 20, 4); tex('laser', 28, 8);

    g.fillStyle(0x1e293b); g.fillRect(0, 0, 64, 64);
    g.fillStyle(0x38bdf8); g.fillRect(0, 0, 64, 6);
    g.fillStyle(0x334155); g.fillRect(0, 6, 64, 3);
    g.fillStyle(0x0f172a); g.fillRect(8, 24, 14, 10); g.fillRect(40, 40, 14, 10); tex('tile', 64, 64);

    g.fillStyle(0xdc2626); g.fillRect(2, 20, 14, 40);
    g.fillStyle(0x2563eb); g.fillRect(12, 22, 26, 28);
    g.fillStyle(0x1e1b4b); g.fillRect(14, 48, 10, 14); g.fillRect(26, 48, 10, 14);
    g.fillStyle(0xfcd5b0); g.fillCircle(25, 12, 11);
    g.fillStyle(0x1e1b4b); g.fillRect(14, 4, 22, 7);
    g.fillStyle(0xfacc15); g.fillRect(21, 30, 8, 9); tex('dereck_hero', 50, 64);

    g.fillStyle(0x00fff0); g.fillRect(0, 0, 60, 60);
    g.lineStyle(4, 0xffffff); g.strokeRect(4, 4, 52, 52);
    g.fillStyle(0x0f172a); g.fillRect(16, 18, 8, 12); g.fillRect(36, 18, 8, 12); g.fillRect(16, 40, 28, 5); tex('cube_hero', 60, 60);

    g.fillStyle(0xe11d48); g.fillRect(0, 22, 50, 48);
    g.fillStyle(0xfde047); g.fillRect(10, 2, 30, 22);
    g.fillStyle(0x0f172a); g.fillRect(16, 9, 5, 5); g.fillRect(29, 9, 5, 5); tex('roblox_hero', 50, 70);
    g.destroy();
  }

  /* ----- Fondo con parallax ----- */
  makeBackground() {
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-10);
    for (let i = 0; i < 12; i++) {
      sky.fillStyle(Phaser.Display.Color.GetColor(11 + i * 8, 16 + i * 4, 51 + i * 9), 1);
      sky.fillRect(0, i * (HEIGHT / 12), WIDTH, HEIGHT / 12 + 1);
    }
    const dots = this.add.graphics().setScrollFactor(0.05).setDepth(-9);
    dots.fillStyle(0xffffff, 0.8);
    for (let i = 0; i < 90; i++) dots.fillRect(Phaser.Math.Between(0, WIDTH * 1.4), Phaser.Math.Between(0, 300), 2, 2);
    this.add.circle(780, 90, 42, 0xfef9c3).setScrollFactor(0).setDepth(-9);
    this.add.circle(795, 80, 42, 0x131a4d).setScrollFactor(0).setDepth(-9);

    [{ f: 0.25, c: 0x1e2a6b, h: 220 }, { f: 0.5, c: 0x16205a, h: 170 }].forEach((L, li) => {
      const gb = this.add.graphics().setScrollFactor(L.f).setDepth(-8 + li);
      const span = LEVEL_WIDTH * L.f + WIDTH;
      for (let x = 0; x < span; x += 90) {
        const h = L.h * 0.5 + Phaser.Math.Between(0, L.h * 0.5);
        gb.fillStyle(L.c, 1); gb.fillRect(x, HEIGHT - h, 80, h);
        gb.fillStyle(0xfde68a, 0.55);
        for (let wy = HEIGHT - h + 12; wy < HEIGHT - 30; wy += 22)
          for (let wx = x + 10; wx < x + 70; wx += 18)
            if (Math.random() > 0.55) gb.fillRect(wx, wy, 6, 9);
      }
    });
  }

  /* ----- Nivel ----- */
  buildLevel() {
    const sections = [[0, 1300], [1500, 1000], [2700, 1000], [3900, 2500]];
    sections.forEach(([x, w]) => {
      const t = this.add.tileSprite(x + w / 2, GROUND_Y + 60, w, 120, 'tile').setDepth(1);
      this.physics.add.existing(t, true); this.platforms.add(t);
    });
    // Plataformas flotantes
    [[700, 130, 160], [1250, 150, 120], [1900, 120, 150], [2600, 150, 120], [3150, 140, 160], [3800, 150, 120], [4400, 130, 160], [4900, 140, 140]]
      .forEach(([x, up, w]) => {
        const t = this.add.tileSprite(x, GROUND_Y - up, w, 24, 'tile').setDepth(1);
        this.physics.add.existing(t, true); this.platforms.add(t);
      });

    // 20 estrellas
    for (let i = 0; i < 20; i++) {
      const s = this.starsGroup.create(350 + i * 255, GROUND_Y - 60 - (i % 3) * 40, 'star').setDepth(2);
      this.tweens.add({ targets: s, scale: { from: 0.9, to: 1.15 }, duration: 500, yoyo: true, repeat: -1 });
    }
    // Corazones
    [1900, 3150, 4400].forEach(x => this.hearts.create(x, GROUND_Y - 170, 'heart').setDepth(2));
    // Pinchos
    [900, 1020, 2000, 2900, 3400, 4200, 4950].forEach(x => this.spikes.create(x, GROUND_Y - 12, 'spike').setDepth(2));

    // Malos: Pac-Man patrulleros
    [700, 1100, 1800, 2300, 3100, 3500, 4300, 4700].slice(0, this.diff.pacs).forEach(x => {
      const e = this.enemies.create(x, GROUND_Y - 20, 'pacman').setDepth(3);
      Object.assign(e, { kind: 'pac', minX: x - 160, maxX: x + 160, sp: 110 * this.diff.speed });
      e.setVelocityX(-e.sp);
      this.tweens.add({ targets: e, scaleY: { from: 1, to: 0.8 }, duration: 180, yoyo: true, repeat: -1 });
    });
    // Fantasmas voladores
    [1250, 2600, 3800, 4500, 900, 5000].slice(0, this.diff.ghosts).forEach((x, i) => {
      const e = this.enemies.create(x, GROUND_Y - 130, 'ghost').setDepth(3);
      Object.assign(e, { kind: 'ghost', baseX: x, baseY: GROUND_Y - 130, phase: i * 1.7 });
    });
    // Jefe final
    const b = this.enemies.create(5750, GROUND_Y - 80, 'pacman').setScale(3).setTint(0xff4d4d).setDepth(3);
    Object.assign(b, { kind: 'boss', isBoss: true, hp: this.diff.boss, maxHp: this.diff.boss, minX: 5350, maxX: 6150, sp: 90 * this.diff.speed });
    b.body.setAllowGravity(true); b.body.setGravityY(1200);
    b.setVelocityX(-b.sp);
    this.boss = b;
    bossHp.value = b.hp; bossMax.value = b.maxHp; bossActive.value = false;
    this.time.addEvent({ delay: 2200, loop: true, callback: () => { if (b.active && b.body.blocked.down) b.setVelocityY(-520); } });

    // Checkpoints
    [2000, 3800].forEach(x => {
      const pole = this.add.rectangle(x, GROUND_Y - 40, 6, 80, 0x94a3b8).setDepth(2);
      const flag = this.add.triangle(x + 16, GROUND_Y - 68, 0, 0, 0, 24, 28, 12, 0x64748b).setDepth(2);
      this.cps.push({ x, flag, on: false, pole });
    });

    // Meta
    this.add.rectangle(GOAL_X, GROUND_Y - 110, 8, 220, 0xf8fafc).setDepth(2);
    this.goalFlag = this.add.triangle(GOAL_X + 28, GROUND_Y - 200, 0, 0, 0, 40, 56, 20, 0xef4444).setDepth(2);
    this.add.text(GOAL_X, GROUND_Y - 240, '🏁', { fontSize: '28px' }).setOrigin(0.5).setDepth(2);
  }

  buildPlayer() {
    const useImg = this.hero === 'dereck' && this.textures.exists('dereck-funko');
    const key = useImg ? 'dereck-funko' : { dereck: 'dereck_hero', geometry: 'cube_hero', roblox: 'roblox_hero' }[this.hero];
    const p = this.physics.add.sprite(150, GROUND_Y - 80, key).setDepth(5);
    if (useImg) p.setDisplaySize(60, 76);
    else if (this.hero !== 'dereck') p.setScale(0.8);
    const w = p.width, h = p.height;
    p.body.setSize(w * 0.7, h * 0.85).setOffset(w * 0.15, h * 0.15);
    if (this.hero === 'dereck') p.body.setAllowGravity(false);
    else p.body.setGravityY(1200);
    this.player = p;
  }

  /* ----- Utilidades visuales ----- */
  floatText(x, y, str, color = '#fff', fixed = false) {
    const t = this.add.text(x, y, str, { fontFamily: FONT, fontSize: '12px', color, stroke: '#000', strokeThickness: 4 })
      .setOrigin(0.5).setDepth(20);
    if (fixed) t.setScrollFactor(0);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 1600, onComplete: () => t.destroy() });
  }
  burst(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const r = this.add.rectangle(x, y, 6, 6, color).setDepth(10);
      this.tweens.add({
        targets: r, x: x + Phaser.Math.Between(-60, 60), y: y + Phaser.Math.Between(-60, 30),
        alpha: 0, duration: 450, onComplete: () => r.destroy()
      });
    }
  }
  addScore(n) { this.scoreVal += n; score.value = this.scoreVal; }

  /* ----- Eventos de juego ----- */
  collectStar(s) {
    s.disableBody(true, true);
    this.stars++; starsCollected.value = this.stars;
    this.addScore(150); sfx(880, 0.15, 'square', 700);
    this.burst(s.x, s.y, 0xfacc15); this.floatText(s.x, s.y - 10, '+150', '#facc15');
  }
  collectHeart(h) {
    h.disableBody(true, true);
    if (this.currentLives < 5) { this.currentLives++; lives.value = this.currentLives; }
    this.addScore(100); sfx(520, 0.25, 'triangle', 500);
    this.floatText(h.x, h.y - 10, '+1 VIDA', '#f43f5e');
  }

  fire() {
    const l = this.lasers.create(this.player.x + this.facing * 34, this.player.y, 'laser').setDepth(4);
    l.setVelocityX(this.facing * 650);
    sfx(900, 0.1, 'sawtooth', -600);
    this.time.delayedCall(900, () => l.active && l.destroy());
  }

  touchEnemy(e) {
    if (this.finished || !e.active) return;
    const p = this.player;
    const stomp = p.body.velocity.y > 60 && p.body.bottom < e.body.center.y + 12;
    if (stomp) {
      p.setVelocityY(-430); this.noCtl = this.time.now + 150;
      this.damageEnemy(e, true);
    } else this.hurt(e.x);
  }

  damageEnemy(e, stomped) {
    if (!e.active) return;
    if (e.isBoss) {
      if (this.time.now < (e.hitUntil || 0)) return;
      e.hitUntil = this.time.now + 500;
      e.hp--; bossHp.value = e.hp;
      e.sp *= 1.12;
      this.cameras.main.shake(150, 0.01); sfx(160, 0.2, 'sawtooth', -80);
      e.setTint(0xffffff); this.time.delayedCall(120, () => e.active && e.setTint(0xff4d4d));
      this.addScore(200); this.burst(e.x, e.y - 30, 0xff4d4d);
      if (e.hp <= 0) {
        this.bossDead = true; this.addScore(2000);
        this.burst(e.x, e.y, 0xfacc15, 24); this.cameras.main.shake(400, 0.02);
        this.floatText(e.x, e.y - 80, '¡JEFE DERROTADO! +2000', '#facc15');
        this.hearts.create(e.x, GROUND_Y - 40, 'heart').setDepth(2);
        this.goalFlag.setFillStyle(0x22c55e);
        e.destroy();
      }
      return;
    }
    this.addScore(300); sfx(300, 0.15, 'square', 400);
    this.burst(e.x, e.y, e.kind === 'ghost' ? 0xf0abfc : 0xffcc00);
    this.floatText(e.x, e.y - 20, '+300', '#fff');
    e.destroy();
  }

  hurt(srcX) {
    if (this.invuln || this.finished) return;
    this.currentLives--; lives.value = this.currentLives;
    this.cameras.main.shake(180, 0.012); sfx(120, 0.3, 'sawtooth', -60);
    if (this.currentLives <= 0) return this.gameOver('Te atraparon los malos.');
    const dir = this.player.x < srcX ? -1 : 1;
    this.player.setVelocity(dir * 300, -320); this.noCtl = this.time.now + 220;
    this.blink();
  }
  blink() {
    this.invuln = true;
    this.tweens.add({
      targets: this.player, alpha: 0.3, duration: 120, yoyo: true, repeat: 7,
      onComplete: () => { this.player.alpha = 1; this.invuln = false; }
    });
  }
  fall() {
    this.currentLives--; lives.value = this.currentLives; sfx(200, 0.4, 'sawtooth', -150);
    if (this.currentLives <= 0) return this.gameOver('Caíste al vacío.');
    this.player.setPosition(this.checkpoint.x, this.checkpoint.y).setVelocity(0, 0);
    this.cameras.main.shake(200, 0.01); this.blink();
  }
  gameOver(msg) {
    if (this.finished) return;
    this.finished = true; this.physics.pause();
    this.player.setTint(0xff0000);
    this.time.delayedCall(900, () => { overReason.value = msg; gameState.value = 'gameover'; destroyGame(); });
  }
  win() {
    this.finished = true; this.physics.pause();
    const secs = Math.floor((this.time.now - this.startTime) / 1000);
    elapsed.value = secs; timeBonus.value = Math.max(0, 3000 - secs * 10);
    this.addScore(timeBonus.value);
    saveScoreToBackend(this.scoreVal);
    this.time.delayedCall(700, () => { gameState.value = 'victory'; destroyGame(); });
  }

  /* ----- Bucle ----- */
  update(time) {
    if (this.finished) return;
    const p = this.player, c = this.cursors, b = p.body;
    elapsed.value = Math.floor((time - this.startTime) / 1000);
    if (p.x > 4900) bossActive.value = true;

    if (c.left.isDown) this.facing = -1; else if (c.right.isDown) this.facing = 1;
    p.setFlipX(this.facing < 0);

    if (time >= this.noCtl) {
      if (this.hero === 'dereck') {
        p.setVelocityX(c.right.isDown ? 300 : c.left.isDown ? -300 : 0);
        let vy = c.up.isDown ? -280 : c.down.isDown ? 280 : 40;
        if (p.y < 30 && vy < 0) vy = 0;
        p.setVelocityY(vy);
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.fire();
      } else {
        p.setVelocityX(c.right.isDown ? 270 : c.left.isDown ? -270 : 0);
        const onGround = b.blocked.down || b.touching.down;
        if (onGround) this.lastGround = time;
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(c.up);
        if (jumpPressed && time - this.lastGround < 110) {
          p.setVelocityY(-640); this.lastGround = 0; sfx(420, 0.15, 'square', 300);
        }
        if (!(c.up.isDown || this.spaceKey.isDown) && b.velocity.y < -250) p.setVelocityY(b.velocity.y * 0.85);
        if (this.hero === 'geometry') p.angle = onGround ? Math.round(p.angle / 90) * 90 : p.angle + 7 * this.facing;
      }
    }
    if (p.x < 20) p.x = 20;

    // IA enemigos
    this.enemies.getChildren().forEach(e => {
      if (!e.active) return;
      if (e.kind === 'ghost') {
        const t = time * 0.002 * this.diff.speed + e.phase;
        e.x = e.baseX + Math.sin(t) * 130;
        e.y = e.baseY + Math.sin(t * 2) * 40;
        e.setFlipX(Math.cos(t) < 0);
      } else {
        if (e.x < e.minX) e.setVelocityX(e.sp); else if (e.x > e.maxX) e.setVelocityX(-e.sp);
        else e.setVelocityX(Math.sign(e.body.velocity.x || -1) * e.sp);
        e.setFlipX(e.body.velocity.x < 0);
      }
    });

    // Checkpoints
    this.cps.forEach(cp => {
      if (!cp.on && p.x > cp.x) {
        cp.on = true; cp.flag.setFillStyle(0x22c55e);
        this.checkpoint = { x: cp.x, y: GROUND_Y - 90 };
        this.floatText(cp.x, GROUND_Y - 110, 'CHECKPOINT', '#22c55e'); sfx(660, 0.2, 'triangle', 400);
      }
    });

    if (p.y > HEIGHT + 60) { this.fall(); return; }

    if (p.x >= GOAL_X) {
      if (this.bossDead) this.win();
      else if (time > this.msgT) {
        this.msgT = time + 1800;
        this.floatText(p.x - 80, p.y - 60, '¡PRIMERO VENCE AL JEFE!', '#ef4444');
      }
    }
  }
}

/* ---------- Celebración de victoria ---------- */
const fxCanvas = ref(null);
const confCanvas = ref(null);
const PALETTE = ['#facc15', '#ef4444', '#38bdf8', '#22c55e', '#ec4899', '#a855f7', '#fb923c', '#ffffff'];
const rnd = (a, b) => a + Math.random() * (b - a);

const getFlagColor = (i) => {
  const colors = ['#ef4444', '#facc15', '#38bdf8', '#22c55e', '#a855f7', '#ec4899'];
  return colors[i % colors.length];
};

const sparkles = Array.from({ length: 10 }, (_, i) => ({
  id: i, style: { left: rnd(0, 96) + '%', top: rnd(0, 80) + '%', animationDelay: rnd(0, 2.5) + 's' }
}));
const notes = Array.from({ length: 8 }, (_, i) => ({
  id: i, ch: ['♪', '♫', '♬'][i % 3],
  style: { left: 6 + i * 12 + '%', animationDelay: i * 0.9 + 's', animationDuration: rnd(5, 8) + 's' }
}));

/* Globos realistas */
const balloonColors = [['#ef4444', '#991b1b'], ['#facc15', '#a16207'], ['#38bdf8', '#0369a1'], ['#22c55e', '#166534'],
  ['#a855f7', '#6b21a8'], ['#ec4899', '#9d174d'], ['#fb923c', '#c2410c']];
const balloons = ref(Array.from({ length: 18 }, (_, i) => {
  const [c, c2] = balloonColors[i % balloonColors.length];
  return { id: i, key: 0, popped: false, left: rnd(0, 94), size: rnd(56, 100), c, c2,
    sx: Math.round(rnd(-70, 70)), dur: rnd(10, 17), delay: -rnd(0, 16), sd: rnd(2, 4) };
}));
const balloonStyle = (b) => ({
  left: b.left + '%', '--s': b.size + 'px', '--c': b.c, '--c2': b.c2, '--sx': b.sx + 'px', '--sd': b.sd + 's',
  animationDuration: b.dur + 's', animationDelay: b.delay + 's'
});
const popBalloon = (b, e) => {
  if (b.popped) return;
  b.popped = true;
  noiseHit(0.09, 3000, 0.25, (e.clientX / window.innerWidth - 0.5) * 1.6);
  fx?.confettiAt(e.clientX, e.clientY, 50);
  setTimeout(() => { b.popped = false; b.key++; b.delay = 0; }, 200);
};

/* ---------- Sonido de fuegos artificiales ---------- */
const noiseHit = (dur, cutoff, vol, pan = 0) => {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime, len = Math.floor(audioCtx.sampleRate * dur);
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    const src = audioCtx.createBufferSource(); src.buffer = buf;
    const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cutoff;
    const g = audioCtx.createGain(); g.gain.value = vol;
    src.connect(lp); lp.connect(g);
    if (audioCtx.createStereoPanner) {
      const pn = audioCtx.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(pn); pn.connect(audioCtx.destination);
    } else g.connect(audioCtx.destination);
    src.start(t);
  } catch { /* audio bloqueado */ }
};
const boomSound = (xRatio) => {
  noiseHit(0.55, 500 + Math.random() * 500, 0.14, (xRatio - 0.5) * 1.6);
  try {
    const t = audioCtx.currentTime, o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t + 0.3);
  } catch { /* audio bloqueado */ }
};

/* ---------- Motor de fuegos artificiales + confeti (canvas) ---------- */
let fx = null;
const stopFx = () => { if (fx) { fx.stop(); fx = null; } };
const startFx = () => {
  stopFx();
  const fc = fxCanvas.value, cc = confCanvas.value;
  if (!fc || !cc) return;
  const fctx = fc.getContext('2d'), cctx = cc.getContext('2d');
  let W = 0, H = 0;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    [fc, cc].forEach(c => { c.width = W * dpr; c.height = H * dpr; });
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0); cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const rockets = [], sparks = [], papers = [], flashes = [];
  const queue = [];
  let nextLaunch = 0, nextCannon = 0, raf = null;
  const pick = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

  const launch = () => {
    const ty = rnd(H * 0.1, H * 0.45), g = 0.17;
    rockets.push({
      x: rnd(W * 0.1, W * 0.9), y: H, px: 0, py: H, vx: rnd(-0.6, 0.6), vy: -Math.sqrt(2 * g * (H - ty)), g,
      col: pick(), type: ['peony', 'peony', 'ring', 'willow', 'heart', 'crackle'][Math.floor(Math.random() * 6)]
    });
  };

  const explode = (r) => {
    const { x, y, type } = r;
    const col2 = pick();
    flashes.push({ x, y, life: 1 });
    boomSound(x / W);
    const add = (vx, vy, o = {}) => sparks.push({
      x, y, px: x, py: y, vx, vy, life: 1, decay: o.decay ?? rnd(0.008, 0.016),
      col: o.col ?? r.col, size: o.size ?? 2.2, g: o.g ?? 0.05, drag: o.drag ?? 0.982, crackle: !!o.crackle
    });
    if (type === 'ring') {
      for (let i = 0; i < 90; i++) { const a = (i / 90) * Math.PI * 2; add(Math.cos(a) * 5, Math.sin(a) * 5, { col: i % 2 ? r.col : col2 }); }
    } else if (type === 'heart') {
      for (let i = 0; i < 110; i++) {
        const t = (i / 110) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3), hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        add(hx * 0.33, hy * 0.33, { col: i % 3 ? '#ff4d8d' : '#ffd1e0', decay: 0.011, drag: 0.985 });
      }
    } else if (type === 'willow') {
      for (let i = 0; i < 120; i++) { const a = rnd(0, 6.283), sp = rnd(1, 4.8); add(Math.cos(a) * sp, Math.sin(a) * sp, { col: '#ffcf66', decay: rnd(0.004, 0.007), g: 0.035, drag: 0.987, size: 1.7 }); }
    } else {
      for (let i = 0; i < 140; i++) {
        const a = rnd(0, 6.283), sp = 6.4 * Math.sqrt(Math.random()) + 0.6;
        add(Math.cos(a) * sp, Math.sin(a) * sp, { col: i % 2 ? r.col : col2, crackle: type === 'crackle' && Math.random() < 0.3 });
      }
    }
  };

  const spawnPaper = (x, y, vx, vy) => papers.push({
    x, y, vx, vy, w: rnd(7, 13), h: rnd(4, 8), rot: rnd(0, 6.28), vr: rnd(-0.2, 0.2),
    flip: rnd(0, 6.28), vf: rnd(0.08, 0.25), sway: rnd(0, 6.28), col: pick()
  });
  const cannon = (left) => {
    for (let i = 0; i < 80; i++) {
      const ang = (left ? -rnd(50, 80) : -rnd(100, 130)) * Math.PI / 180, sp = rnd(12, 26);
      spawnPaper(left ? W * 0.02 : W * 0.98, H, Math.cos(ang) * sp, Math.sin(ang) * sp);
    }
  };
  const confettiAt = (x, y, n = 40) => {
    for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), sp = rnd(3, 10); spawnPaper(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 4); }
  };
  const volley = () => {
    const now = performance.now();
    for (let i = 0; i < 14; i++) queue.push(now + i * 170);
    cannon(true); cannon(false);
  };

  cannon(true); cannon(false);
  for (let i = 0; i < 3; i++) queue.push(performance.now() + i * 350);

  const frame = (now) => {
    // --- programación del espectáculo ---
    if (now > nextLaunch) { const n = 1 + Math.floor(Math.random() * 2); for (let i = 0; i < n; i++) launch(); nextLaunch = now + rnd(700, 1500); }
    if (now > nextCannon) { if (nextCannon) { cannon(true); cannon(false); } nextCannon = now + 9000; }
    while (queue.length && now >= queue[0]) { queue.shift(); launch(); }

    // --- fuegos artificiales ---
    fctx.globalCompositeOperation = 'destination-out';
    fctx.fillStyle = 'rgba(0,0,0,0.2)';
    fctx.fillRect(0, 0, W, H);
    fctx.globalCompositeOperation = 'lighter';
    fctx.lineCap = 'round';

    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      const gr = fctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 280);
      gr.addColorStop(0, `rgba(255,240,200,${f.life * 0.3})`);
      gr.addColorStop(1, 'rgba(255,240,200,0)');
      fctx.fillStyle = gr; fctx.fillRect(f.x - 280, f.y - 280, 560, 560);
      f.life -= 0.08;
      if (f.life <= 0) flashes.splice(i, 1);
    }
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.px = r.x; r.py = r.y; r.vy += r.g; r.x += r.vx; r.y += r.vy;
      fctx.globalAlpha = 1; fctx.strokeStyle = '#ffe9b0'; fctx.lineWidth = 2.5;
      fctx.beginPath(); fctx.moveTo(r.px, r.py); fctx.lineTo(r.x, r.y); fctx.stroke();
      if (sparks.length < 2400) sparks.push({ x: r.x, y: r.y, px: r.x, py: r.y, vx: rnd(-0.3, 0.3), vy: rnd(0.3, 1.2), life: 1, decay: 0.07, col: '#ffd27a', size: 1.3, g: 0.02, drag: 0.98 });
      if (r.vy >= -0.5) { explode(r); rockets.splice(i, 1); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.px = s.x; s.py = s.y;
      s.vx *= s.drag; s.vy = s.vy * s.drag + s.g; s.x += s.vx; s.y += s.vy; s.life -= s.decay;
      if (s.life <= 0) {
        if (s.crackle) for (let k = 0; k < 4; k++) sparks.push({ x: s.x, y: s.y, px: s.x, py: s.y, vx: rnd(-1.6, 1.6), vy: rnd(-1.6, 1.6), life: 0.55, decay: 0.05, col: '#ffffff', size: 1.4, g: 0.03, drag: 0.95 });
        sparks.splice(i, 1);
        continue;
      }
      fctx.globalAlpha = Math.min(1, s.life * 1.4) * (0.7 + Math.random() * 0.3);
      fctx.strokeStyle = s.col; fctx.lineWidth = s.size * (0.5 + s.life * 0.5);
      fctx.beginPath(); fctx.moveTo(s.px, s.py); fctx.lineTo(s.x, s.y); fctx.stroke();
    }
    fctx.globalAlpha = 1;

    // --- confeti ---
    if (papers.length < 240 && Math.random() < 0.55) spawnPaper(rnd(0, W), -12, rnd(-1, 1), rnd(1, 2.2));
    cctx.clearRect(0, 0, W, H);
    for (let i = papers.length - 1; i >= 0; i--) {
      const p = papers[i];
      p.vx *= 0.975; p.vy = p.vy * 0.975 + 0.06; p.sway += 0.05;
      p.x += p.vx + Math.sin(p.sway) * 0.9; p.y += p.vy; p.rot += p.vr; p.flip += p.vf;
      if (p.y > H + 20) { papers.splice(i, 1); continue; }
      const c = Math.cos(p.flip);
      cctx.save();
      cctx.translate(p.x, p.y); cctx.rotate(p.rot); cctx.scale(1, c);
      cctx.globalAlpha = 0.75 + 0.25 * Math.abs(c);
      cctx.fillStyle = p.col;
      cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cctx.restore();
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  fx = {
    volley, confettiAt,
    stop: () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      fctx.clearRect(0, 0, W, H); cctx.clearRect(0, 0, W, H);
    }
  };
};

const triggerCelebrationFireworks = () => fx?.volley();

/* ---------- Sintetizador Completo de Feliz Cumpleaños ---------- */
let activeMelodyTimeout = null;

const stopMelody = () => {
  if (activeMelodyTimeout) {
    clearTimeout(activeMelodyTimeout);
    activeMelodyTimeout = null;
  }
};

const playBirthdayMelody = () => {
  stopMelody();
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Melodía completa de Feliz Cumpleaños
    const notes = [
      { f: 261.63, d: 0.35 }, { f: 261.63, d: 0.25 }, { f: 293.66, d: 0.6 }, { f: 261.63, d: 0.6 }, { f: 349.23, d: 0.6 }, { f: 329.63, d: 1.1 },
      { f: 261.63, d: 0.35 }, { f: 261.63, d: 0.25 }, { f: 293.66, d: 0.6 }, { f: 261.63, d: 0.6 }, { f: 392.00, d: 0.6 }, { f: 349.23, d: 1.1 },
      { f: 261.63, d: 0.35 }, { f: 261.63, d: 0.25 }, { f: 523.25, d: 0.6 }, { f: 440.00, d: 0.6 }, { f: 349.23, d: 0.6 }, { f: 329.63, d: 0.6 }, { f: 293.66, d: 0.8 },
      { f: 466.16, d: 0.35 }, { f: 466.16, d: 0.25 }, { f: 440.00, d: 0.6 }, { f: 349.23, d: 0.6 }, { f: 392.00, d: 0.6 }, { f: 349.23, d: 1.4 }
    ];

    let noteIndex = 0;

    const playNextNote = () => {
      if (noteIndex >= notes.length || gameState.value !== 'victory') return;

      const note = notes[noteIndex];
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d - 0.05);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(t);
      osc.stop(t + note.d);

      noteIndex++;
      activeMelodyTimeout = setTimeout(playNextNote, note.d * 1000);
    };

    playNextNote();
  } catch { /* Audio no soporta o bloqueado */ }
};

watch(gameState, async (newState) => {
  if (newState === 'victory') {
    await nextTick();
    startFx();
    playBirthdayMelody();
  } else {
    stopMelody();
    stopFx();
  }
});

/* ---------- Control del juego ---------- */
const startGame = async () => {
  destroyGame();
  gameState.value = 'playing';
  score.value = 0; starsCollected.value = 0; elapsed.value = 0; timeBonus.value = 0;
  lives.value = selectedDiff.value.lives; isNewRecord.value = false; bossActive.value = false;
  await nextTick();

  gameInstance = new Phaser.Game({
    type: Phaser.AUTO, width: WIDTH, height: HEIGHT, parent: 'phaser-mount',
    backgroundColor: '#0b1033',
    physics: { default: 'arcade', arcade: { debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: WIDTH, height: HEIGHT },
    scene: MainScene
  });
};
const destroyGame = () => {
  if (gameInstance) { gameInstance.destroy(true); gameInstance = null; }
};
const resetToSelect = () => { destroyGame(); gameState.value = 'select'; };
onBeforeUnmount(() => { destroyGame(); stopFx(); stopMelody(); });
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
</style>

<style scoped>
.app-shell {
  min-height: 100vh; display: flex; justify-content: center; align-items: center; position: relative;
  background: radial-gradient(ellipse at top, #1e1b4b, #0b1033 70%);
  color: #fff; font-family: 'Press Start 2P', 'Arial Black', monospace; padding: 16px;
  box-sizing: border-box;
}
.scanlines { position: fixed; inset: 0; pointer-events: none; z-index: 50;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,.14) 0 1px, transparent 1px 3px); }

.select-screen { text-align: center; max-width: 880px; width: 100%; }
.select-screen h1 { font-size: clamp(1.4rem, 4vw, 2.8rem); color: #facc15; text-shadow: 4px 4px 0 #dc2626; margin: 14px 0 10px; }
.badge { background: #dc2626; padding: 6px 12px; font-size: clamp(.5rem, 1.5vw, .6rem); }
.subtitle { color: #cbd5e1; font-size: clamp(.5rem, 1.5vw, .65rem); line-height: 1.8; margin-bottom: 22px; }
.section-label { font-size: .65rem; color: #94a3b8; margin: 4px 0 10px; }

.cards-grid { display: flex; gap: 16px; justify-content: center; margin-bottom: 20px; flex-wrap: wrap; }
.char-card { background: #1e293b; border: 4px solid #334155; padding: 16px; width: 210px; cursor: pointer; transition: transform .12s; }
.char-card:hover { transform: translateY(-3px); }
.char-card.selected { border-color: #facc15; transform: scale(1.05); box-shadow: 0 0 0 4px #000, 0 0 28px rgba(250,204,21,.45); }
.char-card h3 { font-size: .7rem; margin: 8px 0 6px; }
.char-ability { font-size: .55rem; color: #94a3b8; line-height: 1.6; }
.char-avatar-frame { width: 76px; height: 76px; margin: 0 auto 6px; border: 4px solid #38bdf8; display: flex; align-items: center; justify-content: center; background: #0f172a; }
.emoji-icon { font-size: 2.4rem; }

.diff-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 22px; }
.diff-btn { font-family: inherit; background: #1e293b; color: #fff; border: 4px solid #334155; padding: 12px 14px; cursor: pointer; display: flex; flex-direction: column; gap: 8px; width: 200px; }
.diff-btn strong { font-size: .75rem; }
.diff-btn small { font-size: .5rem; color: #94a3b8; line-height: 1.5; }
.diff-btn.on.easy { border-color: #22c55e; box-shadow: 0 0 0 3px #000; }
.diff-btn.on.normal { border-color: #facc15; box-shadow: 0 0 0 3px #000; }
.diff-btn.on.hard { border-color: #ef4444; box-shadow: 0 0 0 3px #000; }
.best-score-badge { font-size: .7rem; color: #facc15; margin-bottom: 16px; }

.btn-nintendo { font-family: inherit; background: #22c55e; color: #fff; font-size: clamp(.65rem, 2vw, .85rem); border: 4px solid #000; padding: 14px 24px; cursor: pointer; box-shadow: 0 6px 0 #000; text-shadow: 2px 2px 0 #000; }
.btn-nintendo:hover:not(:disabled) { transform: translateY(2px); box-shadow: 0 4px 0 #000; }
.btn-nintendo:disabled { background: #64748b; box-shadow: none; cursor: not-allowed; }
.btn-nintendo.gray { background: #475569; }
.fireworks-btn { background: #a855f7; }
.btn-row { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

.game-screen { display: flex; flex-direction: column; align-items: center; width: 100%; }
.hud-bar { width: 960px; max-width: 100%; display: flex; gap: 8px; justify-content: space-between; flex-wrap: wrap; background: #0f172a; padding: 10px 14px; border-bottom: 4px solid #facc15; box-sizing: border-box; }
.hud-pill { background: #1e293b; padding: 7px 10px; font-size: clamp(.45rem, 1.2vw, .6rem); }
.hud-pill span { color: #facc15; }
.boss-bar { width: 960px; max-width: 100%; display: flex; align-items: center; gap: 12px; background: #450a0a; padding: 6px 14px; font-size: .55rem; color: #fecaca; box-sizing: border-box; }
.boss-track { flex: 1; height: 12px; background: #1c0505; border: 2px solid #000; }
.boss-fill { height: 100%; background: #ef4444; transition: width .2s; }

.canvas-wrapper { position: relative; width: 960px; height: 540px; max-width: 100%; max-height: calc(100vw * .5625); overflow: hidden; box-shadow: 0 0 0 4px #000, 0 15px 35px rgba(0,0,0,.6); }
.phaser-mount { width: 100%; height: 100%; }
.phaser-mount :deep(canvas) { width: 100% !important; height: 100% !important; image-rendering: pixelated; }
.crt { position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 90px rgba(0,0,0,.55); }
.controls-guide { margin-top: 14px; background: #0f172a; padding: 10px 16px; font-size: clamp(.45rem, 1.2vw, .5rem); line-height: 1.8; color: #94a3b8; text-align: center; max-width: 100%; }
.key { color: #ef4444; }

.end-card { text-align: center; background: #1e1b4b; border: 4px solid #facc15; padding: 24px; max-width: 680px; width: 100%; box-shadow: 0 0 0 4px #000, 0 0 40px rgba(250,204,21,.5); position: relative; overflow: hidden; box-sizing: border-box; }
.end-card.over { border-color: #ef4444; box-shadow: 0 0 0 4px #000, 0 0 40px rgba(239,68,68,.5); }
.end-card.over h1 { color: #ef4444; font-size: 2rem; text-shadow: 3px 3px 0 #000; margin: 6px 0 12px; }
.reason { font-size: .65rem; color: #fecaca; margin-bottom: 16px; }
/* ---------- FIESTA DE CUMPLEAÑOS ---------- */
.app-shell.party { background: transparent; }

/* Cielo nocturno con estrellas, luna y ciudad */
.party-bg { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden;
  background: linear-gradient(#050816 0%, #1e1b4b 50%, #4c1d95 82%, #9333ea 100%); }
.party-bg::before, .party-bg::after { content: ''; position: absolute; inset: 0; }
.party-bg::before {
  background-image:
    radial-gradient(1.5px 1.5px at 20px 30px, #fff 50%, transparent 51%),
    radial-gradient(1px 1px at 90px 120px, #fff 50%, transparent 51%),
    radial-gradient(2px 2px at 160px 60px, #fde68a 50%, transparent 51%),
    radial-gradient(1px 1px at 230px 180px, #fff 50%, transparent 51%);
  background-size: 260px 220px; animation: twinkle 3s ease-in-out infinite alternate;
}
.party-bg::after {
  background-image:
    radial-gradient(1px 1px at 60px 80px, #fff 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 180px 20px, #bae6fd 50%, transparent 51%),
    radial-gradient(1px 1px at 270px 220px, #fff 50%, transparent 51%);
  background-size: 310px 270px; animation: twinkle 4.2s ease-in-out infinite alternate-reverse;
}
.moon { position: absolute; top: 8%; right: 9%; width: clamp(50px, 8vw, 90px); aspect-ratio: 1; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fffbe6, #fde68a 60%, #e5c76b); box-shadow: 0 0 60px 20px rgba(253,230,138,.35); }
.skyline { position: absolute; left: 0; right: 0; bottom: 0; height: 26vh;
  background: radial-gradient(2px 3px at 10px 12px, rgba(253,230,138,.75) 50%, transparent 51%) 0 0 / 22px 26px, linear-gradient(#0a0e2e, #05071a);
  clip-path: polygon(0 100%, 0 62%, 5% 62%, 5% 38%, 10% 38%, 10% 55%, 14% 55%, 14% 28%, 19% 28%, 19% 48%, 24% 48%, 24% 66%, 29% 66%, 29% 40%, 34% 40%, 34% 22%, 38% 22%, 38% 52%, 43% 52%, 43% 70%, 48% 70%, 48% 44%, 54% 44%, 54% 30%, 58% 30%, 58% 58%, 63% 58%, 63% 36%, 68% 36%, 68% 60%, 73% 60%, 73% 42%, 78% 42%, 78% 26%, 83% 26%, 83% 54%, 88% 54%, 88% 68%, 93% 68%, 93% 46%, 97% 46%, 97% 60%, 100% 60%, 100% 100%); }
@keyframes twinkle { from { opacity: .35; } to { opacity: 1; } }

/* Globos realistas */
.balloons-layer { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 5; }
.b-wrap { position: absolute; bottom: -220px; width: var(--s); animation: balloonRise linear infinite; }
.b-body { position: relative; width: var(--s); height: calc(var(--s) * 1.25); cursor: pointer; pointer-events: auto;
  border-radius: 50% 50% 48% 48% / 56% 56% 44% 44%;
  background: radial-gradient(circle at 32% 26%, rgba(255,255,255,.85) 0 5%, rgba(255,255,255,0) 22%), radial-gradient(circle at 50% 42%, var(--c) 30%, var(--c2) 100%);
  box-shadow: inset -6px -10px 18px rgba(0,0,0,.28), inset 5px 6px 12px rgba(255,255,255,.18), 0 8px 18px rgba(0,0,0,.3);
  transform-origin: 50% 160%; animation: balloonSway var(--sd) ease-in-out infinite alternate; }
.b-body::before { content: ''; position: absolute; left: 50%; top: calc(100% - 3px); transform: translateX(-50%);
  border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 9px solid var(--c2); }
.b-body::after { content: ''; position: absolute; left: 50%; top: calc(100% + 6px); width: 2px; height: calc(var(--s) * 1.3);
  background: linear-gradient(rgba(255,255,255,.85), rgba(255,255,255,.15)); transform-origin: top; animation: stringWave 1.6s ease-in-out infinite alternate; }
.b-wrap.popped .b-body { animation: popOut .2s ease-out forwards; }
@keyframes balloonRise { from { transform: translate(0, 0); } to { transform: translate(var(--sx), calc(-100vh - 480px)); } }
@keyframes balloonSway { from { transform: rotate(-7deg); } to { transform: rotate(7deg); } }
@keyframes stringWave { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
@keyframes popOut { to { transform: scale(1.5); opacity: 0; } }

/* Canvas de fuegos artificiales y confeti */
.fx-canvas { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 40; }
.fx-canvas.conf { z-index: 41; }

/* Tarjeta de celebración */
.celebration-screen {
  background: radial-gradient(circle, rgba(49,46,129,.94) 0%, rgba(30,27,75,.95) 60%, rgba(15,23,42,.96) 100%);
  position: relative; z-index: 10; border-color: #38bdf8;
  animation: cardIn .8s cubic-bezier(.2,1.4,.4,1) both;
}
@keyframes cardIn { from { opacity: 0; transform: scale(.6) translateY(40px); } to { opacity: 1; transform: none; } }
.reveal { animation: popIn .7s cubic-bezier(.2,1.5,.4,1) var(--d, 0s) both; }
@keyframes popIn { from { opacity: 0; transform: translateY(30px) scale(.6); } to { opacity: 1; transform: none; } }

/* Reflectores */
.beam { position: absolute; top: -10%; width: 140px; height: 120%; pointer-events: none; z-index: 1; mix-blend-mode: screen;
  background: linear-gradient(rgba(255,255,255,.26), rgba(255,255,255,0)); clip-path: polygon(46% 0, 54% 0, 100% 100%, 0 100%);
  transform-origin: top center; animation: beamSweep 5s ease-in-out infinite alternate; }
.beam.b1 { left: 14%; }
.beam.b2 { left: 70%; animation-delay: -2.5s; animation-direction: alternate-reverse; background: linear-gradient(rgba(250,204,21,.28), rgba(250,204,21,0)); }
@keyframes beamSweep { from { transform: rotate(-20deg); } to { transform: rotate(20deg); } }

.garland-container { display: flex; justify-content: space-around; position: absolute; top: 0; left: 0; right: 0; height: 20px; z-index: 2; }
.flag-item { width: 0; height: 0; border-left: clamp(8px, 2vw, 14px) solid transparent; border-right: clamp(8px, 2vw, 14px) solid transparent;
  border-top: clamp(14px, 3vw, 22px) solid; transform-origin: top center; animation: flagSway 1.8s ease-in-out infinite alternate; }
.flag-item:nth-child(even) { animation-delay: -.9s; }
@keyframes flagSway { from { transform: rotate(-9deg); } to { transform: rotate(9deg); } }

.festive-lights { display: flex; justify-content: center; gap: clamp(8px, 2vw, 16px); margin-top: 14px; margin-bottom: 8px; z-index: 2; position: relative; }
.light-bulb { width: 10px; height: 10px; border-radius: 50%; background: var(--lc, #facc15); box-shadow: 0 0 10px var(--lc, #facc15), 0 0 20px var(--lc, #facc15); animation: flash .8s infinite alternate; }
@keyframes flash { 0% { opacity: .3; transform: scale(.8); } 100% { opacity: 1; transform: scale(1.3); } }

/* Notas musicales */
.notes { position: absolute; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
.note { position: absolute; bottom: -30px; font-size: clamp(1.1rem, 3vw, 1.8rem); color: #fde68a; text-shadow: 0 0 10px #facc15; opacity: 0; animation: noteRise 6s ease-in infinite; }
@keyframes noteRise { 0% { transform: translateY(0) rotate(-10deg); opacity: 0; } 15% { opacity: .9; } 100% { transform: translateY(-520px) rotate(14deg) translateX(20px); opacity: 0; } }

.crown-tag { background: #facc15; color: #000; padding: 6px 14px; font-size: clamp(.5rem, 1.5vw, .65rem); display: inline-block; margin-bottom: 12px; border: 2px solid #000; z-index: 2; position: relative;
  animation: popIn .6s cubic-bezier(.2,1.5,.4,1) both, pulse 1.5s .7s infinite; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }

.hero-banner { position: relative; overflow: hidden; background: linear-gradient(90deg, #dc2626, #facc15, #a855f7, #dc2626); background-size: 300% 300%;
  border: 4px solid #000; padding: 12px 8px; margin: 10px 0 14px; box-shadow: 0 4px 0 #000; z-index: 2;
  animation: popIn .7s cubic-bezier(.2,1.5,.4,1) .2s both, rainbowGradient 4s ease infinite; }
.hero-banner::after { content: ''; position: absolute; top: 0; bottom: 0; left: -90px; width: 60px;
  background: linear-gradient(100deg, transparent, rgba(255,255,255,.6), transparent); transform: skewX(-20deg); animation: shine 2.6s ease-in-out infinite; }
@keyframes shine { 0% { left: -90px; } 60%, 100% { left: 120%; } }
.hero-banner h2 { color: #fff; font-size: clamp(.6rem, 2.2vw, .85rem); line-height: 1.6; text-shadow: 2px 2px 0 #000; margin: 0; animation: wiggle 1.6s ease-in-out infinite; }
@keyframes wiggle { 0%, 100% { transform: rotate(-1.2deg) scale(1); } 50% { transform: rotate(1.2deg) scale(1.03); } }
@keyframes rainbowGradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

.dedication-card { background: rgba(15,23,42,.85); border: 2px solid #38bdf8; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; backdrop-filter: blur(4px); z-index: 2; position: relative; }
.dedication-text { color: #f8fafc; font-size: clamp(.55rem, 1.8vw, .7rem); line-height: 1.8; margin: 0; text-shadow: 1px 1px 2px #000; }
.author-tag { color: #facc15; display: block; margin-top: 6px; }

.stage-container { display: flex; justify-content: space-around; align-items: flex-end; background: rgba(15,23,42,.88); padding: 22px 8px 16px; border: 4px solid #38bdf8;
  margin-bottom: 18px; position: relative; box-shadow: inset 0 0 20px rgba(56,189,248,.3); z-index: 2; flex-wrap: wrap; gap: 12px; overflow: hidden; }
.sparkle { position: absolute; font-size: 1.1rem; pointer-events: none; animation: sparkleTw 2s ease-in-out infinite; }
@keyframes sparkleTw { 0%, 100% { transform: scale(0) rotate(0); opacity: 0; } 50% { transform: scale(1.3) rotate(180deg); opacity: 1; } }

.party-side { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 1; }
.cake-emoji, .gift-emoji { font-size: clamp(2.2rem, 6vw, 3.5rem); filter: drop-shadow(0 0 10px rgba(250,204,21,.6)); }
.floating-anim { animation: bounce 1.2s infinite ease-in-out; }
.floating-anim-alt { animation: bounce 1.2s infinite ease-in-out -.6s; }
@keyframes bounce { 0%, 100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-16px) rotate(6deg); } }
.party-label { font-size: clamp(.4rem, 1.2vw, .5rem); color: #facc15; margin-top: 4px; }

.podium-winner { display: flex; flex-direction: column; align-items: center; position: relative; }
.halo { position: absolute; top: -50px; left: 50%; translate: -50% 0; width: clamp(230px, 52vw, 320px); aspect-ratio: 1; border-radius: 50%; z-index: 0;
  background: repeating-conic-gradient(rgba(250,204,21,.6) 0 8deg, transparent 8deg 18deg);
  -webkit-mask: radial-gradient(circle, #000 18%, transparent 70%); mask: radial-gradient(circle, #000 18%, transparent 70%); animation: spin 14s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.funko-large-wrapper { position: relative; z-index: 1; width: clamp(110px, 25vw, 150px); height: clamp(130px, 30vw, 180px); border: 4px solid #facc15; border-radius: 8px; overflow: hidden; background: #1e293b;
  animation: funkoDance 1.2s ease-in-out infinite alternate; }
@keyframes funkoDance { from { transform: translateY(0) rotate(-3deg); } to { transform: translateY(-16px) rotate(3deg); } }
.glow-gold { box-shadow: 0 0 20px rgba(250,204,21,.8), 0 0 50px rgba(250,204,21,.5); }
.funko-img { width: 100%; height: 100%; object-fit: cover; }
.trophy-badge { position: absolute; z-index: 2; top: -14px; right: -22px; font-size: clamp(1.8rem, 5vw, 2.8rem); filter: drop-shadow(2px 2px 0 #000) drop-shadow(0 0 12px #facc15);
  animation: trophyBounce 1.4s ease-in-out infinite; }
@keyframes trophyBounce { 0%, 100% { transform: translateY(0) rotate(-12deg) scale(1); } 50% { transform: translateY(-12px) rotate(12deg) scale(1.15); } }
.podium-stand { position: relative; z-index: 1; background: linear-gradient(180deg, #facc15, #ca8a04); color: #000; width: clamp(130px, 30vw, 180px); padding: 8px 4px;
  border: 3px solid #000; box-shadow: 0 4px 0 #000; margin-top: 6px; display: flex; flex-direction: column; gap: 4px; }
.podium-rank { font-size: clamp(.65rem, 2vw, .85rem); font-weight: bold; }
.podium-title { font-size: clamp(.45rem, 1.2vw, .55rem); }

.stats-box { background: rgba(15,23,42,.9); padding: 12px; margin-bottom: 18px; font-size: clamp(.5rem, 1.5vw, .6rem); line-height: 2; border: 2px solid #334155; z-index: 2; position: relative; }
.clear-text { color: #f1f5f9; text-shadow: 1px 1px 2px #000; }
.stats-box strong { color: #facc15; }
.rainbow-text { color: #facc15; animation: textGlow 1s infinite alternate; }
@keyframes textGlow { 0% { text-shadow: 0 0 5px #facc15; } 100% { text-shadow: 0 0 12px #ef4444, 0 0 18px #facc15; } }
.btn-row.reveal { position: relative; z-index: 2; }

/* Ajustes Responsive para Pantallas Pequeñas */
@media (max-width: 480px) {
  .stage-container { flex-direction: column; align-items: center; }
  .party-side { display: none; }
  .end-card { padding: 16px 10px; }
  .balloons-layer { z-index: 15; }
  .b-body { pointer-events: none; }
}
</style>