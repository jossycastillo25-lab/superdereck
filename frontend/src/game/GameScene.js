import Phaser from "phaser";

const WIDTH = 960;
const HEIGHT = 540;
const GROUND_Y = 438;
const LEVEL_W = 6000;
const GOAL_X = 5860;
const MAX_LIVES = 3;
const FONT = '"Arial Black", Arial';

/* ---------- Sonido sintetizado ---------- */
let audio = null;
function sfx(freq, dur = 0.12, type = "square", slide = 0) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    audio = audio || new AC();
    const t = audio.currentTime;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + dur);
  } catch (_) {}
}

class MainScene extends Phaser.Scene {
  constructor(callbacks) {
    super("MainScene");
    this.callbacks = callbacks || {};
  }

  emit(name, ...args) {
    const fn = this.callbacks[name];
    if (typeof fn === "function") fn(...args);
  }

  // init() se ejecuta en cada reinicio: aquí se resetea TODO el estado
  init() {
    this.coins = 0;
    this.totalCoins = 0;
    this.scoreF = 0;
    this.lastScore = -1;
    this.lives = MAX_LIVES;
    this.finished = false;
    this.invuln = false;
    this.jumps = 0;
    this.jumpBuf = 0;
    this.lastGround = 0;
    this.lastSafeX = 150;
    this.dustT = 0;
    this.speed = 270;
    this.pits = [];
  }

  create() {
    this.cameras.main.setBackgroundColor("#7bd8ff");
    this.makeTextures();
    this.createBackground();

    this.platforms = this.physics.add.staticGroup();
    this.airPlatforms = this.physics.add.staticGroup();
    this.obstacles = this.physics.add.staticGroup();
    this.coinsGroup = this.physics.add.staticGroup();
    this.birds = this.physics.add.group({ allowGravity: false });

    this.buildLevel();

    this.player = this.physics.add.sprite(150, GROUND_Y - 65, "hero").setDepth(5);
    this.player.setSize(48, 70).setOffset(16, 8);
    this.player.body.setGravityY(1250);

    this.physics.add.collider(this.player, this.platforms);
    // Plataformas flotantes: solo se pisan desde arriba
    this.physics.add.collider(this.player, this.airPlatforms, null,
      (p, plat) => p.body.velocity.y >= 0 && p.body.bottom <= plat.body.top + 18, this);
    this.physics.add.overlap(this.player, this.coinsGroup, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.obstacles, () => this.hurt(), null, this);
    this.physics.add.overlap(this.player, this.birds, (p, b) => this.touchBird(b), null, this);

    this.cameras.main.setBounds(0, 0, LEVEL_W, HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, -250, 0);

    this.createHud();

    this.onJump = () => this.jump();
    this.onRelease = () => {
      if (this.player && this.player.body.velocity.y < -260) this.player.setVelocityY(this.player.body.velocity.y * 0.55);
    };
    this.input.keyboard.on("keydown-SPACE", this.onJump);
    this.input.keyboard.on("keydown-UP", this.onJump);
    this.input.keyboard.on("keyup-SPACE", this.onRelease);
    this.input.keyboard.on("keyup-UP", this.onRelease);
    this.input.on("pointerdown", this.onJump);
    this.input.on("pointerup", this.onRelease);

    this.events.once("shutdown", () => {
      this.input.keyboard.off("keydown-SPACE", this.onJump);
      this.input.keyboard.off("keydown-UP", this.onJump);
      this.input.keyboard.off("keyup-SPACE", this.onRelease);
      this.input.keyboard.off("keyup-UP", this.onRelease);
      this.input.off("pointerdown", this.onJump);
      this.input.off("pointerup", this.onRelease);
    });

    this.emit("onCoins", 0, this.totalCoins);
    this.emit("onScore", 0);
    this.emit("onLives", this.lives);
    this.hint("¡SALTA! (ESPACIO o TOCA) · DOBLE SALTO · APLASTA A LOS PÁJAROS");
  }

  /* ---------- Texturas ---------- */
  makeTextures() {
    if (this.textures.exists("hero")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const tex = (k, w, h) => { g.generateTexture(k, w, h); g.clear(); };

    g.fillStyle(0x13204f); g.fillRoundedRect(8, 4, 64, 82, 18);
    g.fillStyle(0xe84562); g.fillCircle(40, 25, 22);
    g.fillStyle(0x101a46); g.fillCircle(32, 24, 5); g.fillCircle(48, 24, 5);
    g.fillStyle(0x2a6df5); g.fillRoundedRect(20, 42, 40, 34, 10);
    g.lineStyle(3, 0xffffff, 0.9); g.lineBetween(40, 43, 40, 74); g.lineBetween(23, 56, 57, 56);
    g.fillStyle(0xffd64d); g.fillCircle(40, 57, 5);
    tex("hero", 80, 90);

    g.fillStyle(0x16265c); g.fillRect(0, 0, 96, 102);
    g.fillStyle(0x2a6df5); g.fillRect(0, 0, 96, 9);
    for (let r = 0; r < 2; r++)
      for (let x = 0; x < 96; x += 48) {
        g.fillStyle((x / 48 + r) % 2 ? 0x7c4dff : 0x43d7c6);
        g.fillRect(x + 5, 16 + r * 40, 38, 23);
      }
    tex("ground", 96, 102);

    g.fillStyle(0xf0446f); g.fillRoundedRect(4, 12, 42, 55, 8);
    g.fillStyle(0xffd64d); g.fillTriangle(4, 12, 25, -7, 46, 12);
    g.lineStyle(4, 0x101a46); g.strokeRoundedRect(4, 12, 42, 55, 8);
    tex("obstacle", 50, 75);

    g.fillStyle(0xffc928); g.fillCircle(22, 22, 19);
    g.lineStyle(4, 0xffffff, 0.85); g.strokeCircle(22, 22, 16);
    g.fillStyle(0xfff3a1); g.fillCircle(16, 15, 5);
    tex("coin", 44, 44);

    g.fillStyle(0x7c4dff); g.fillRoundedRect(0, 0, 72, 34, 7);
    g.lineStyle(3, 0xffffff, 0.45); g.strokeRoundedRect(2, 2, 68, 30, 6);
    tex("block", 72, 34);

    g.fillStyle(0xffd64d); g.fillTriangle(0, 20, 14, 14, 14, 28);
    g.fillStyle(0x8b6dff); g.fillTriangle(16, 4, 36, 18, 22, 22);
    g.fillStyle(0xf0446f); g.fillCircle(28, 24, 15);
    g.fillStyle(0xffffff); g.fillCircle(22, 20, 5);
    g.fillStyle(0x101a46); g.fillCircle(21, 20, 2.5);
    tex("bird", 46, 42);
  }

  /* ---------- Fondo con parallax ---------- */
  createBackground() {
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-10);
    const a = Phaser.Display.Color.ValueToColor(0x4cb8ff);
    const b = Phaser.Display.Color.ValueToColor(0xc9f3ff);
    for (let i = 0; i < 12; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 11, i);
      sky.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      sky.fillRect(0, i * 46, WIDTH, 47);
    }
    this.add.circle(800, 95, 46, 0xfff3a1).setScrollFactor(0).setDepth(-9);

    // Confeti flotante
    const conf = this.add.graphics().setScrollFactor(0.3).setDepth(-8);
    for (let i = 0; i < 45; i++) {
      conf.fillStyle([0xffffff, 0xffe04b, 0x64e8d6, 0xff6e9b, 0x8b6dff][i % 5], 0.75);
      const s = 12 + (i % 4) * 7;
      conf.fillRoundedRect((i * 127) % (LEVEL_W * 0.3 + WIDTH), 50 + ((i * 71) % 250), s, s, 4);
    }
    // Colinas lejanas y ciudad
    [{ f: 0.2, c: 0x8b6dff, a: 0.35, hill: true }, { f: 0.5, c: 0x13204f, a: 0.3, hill: false }].forEach((L, li) => {
      const gr = this.add.graphics().setScrollFactor(L.f).setDepth(-7 + li);
      const span = LEVEL_W * L.f + WIDTH;
      gr.fillStyle(L.c, L.a);
      for (let x = 0; x < span; x += L.hill ? 220 : 80) {
        if (L.hill) gr.fillCircle(x, HEIGHT - 20, 150 + ((x * 7) % 90));
        else {
          const h = 90 + ((x * 13) % 130);
          gr.fillRect(x, HEIGHT - h, 66, h);
        }
      }
    });
  }

  /* ---------- HUD fijo en pantalla ---------- */
  createHud() {
    const st = { fontFamily: FONT, fontSize: "20px", color: "#102052", stroke: "#ffffff", strokeThickness: 5 };
    this.add.text(20, 14, "DERECK • SUPERHÉROE", st).setScrollFactor(0).setDepth(30);
    this.add.text(21, 42, "MISIÓN: LLEGAR A LA FIESTA", { fontFamily: "Arial", fontSize: "13px", color: "#102052", fontStyle: "bold" })
      .setScrollFactor(0).setDepth(30);
    this.hudLives = this.add.text(WIDTH - 20, 14, "", { ...st, color: "#e84562" }).setOrigin(1, 0).setScrollFactor(0).setDepth(30);
    this.hudCoins = this.add.text(WIDTH - 20, 44, "", { ...st, fontSize: "16px", color: "#a86b00" }).setOrigin(1, 0).setScrollFactor(0).setDepth(30);
    this.add.rectangle(WIDTH / 2, 20, 300, 12, 0x13204f, 0.85).setScrollFactor(0).setDepth(30).setStrokeStyle(2, 0xffffff);
    this.bar = this.add.rectangle(WIDTH / 2 - 148, 20, 1, 8, 0xffd64d).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);
    this.add.text(WIDTH / 2 + 160, 20, "🎂", { fontSize: "18px" }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);
    this.refreshHud();
  }
  refreshHud() {
    this.hudLives.setText("♥".repeat(Math.max(this.lives, 0)) + "♡".repeat(Math.max(MAX_LIVES - this.lives, 0)));
    this.hudCoins.setText(`MONEDAS ${this.coins}/${this.totalCoins}`);
  }
  hint(msg) {
    const t = this.add.text(WIDTH / 2, 100, msg, {
      fontFamily: FONT, fontSize: "14px", color: "#ffffff", stroke: "#102052", strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(30);
    this.tweens.add({ targets: t, alpha: 0, delay: 3000, duration: 800, onComplete: () => t.destroy() });
  }

  /* ---------- Nivel ---------- */
  buildLevel() {
    const coin = (x, y) => { this.coinsGroup.create(x, y, "coin").setDepth(3); this.totalCoins++; };
    const arc = (x, base, n = 5) => { for (let k = 0; k < n; k++) coin(x + k * 34, base - Math.sin((k / (n - 1)) * Math.PI) * 70); };
    const spike = (x, i = 0) => {
      const h = i % 2 ? 64 : 76;
      const o = this.obstacles.create(x, GROUND_Y - h / 2 + 5, "obstacle").setDepth(3);
      o.setDisplaySize(44, h).refreshBody();
    };
    const plat = (x, w, y = GROUND_Y - 115) => {
      const t = this.add.tileSprite(x, y, w, 34, "block").setDepth(2);
      this.physics.add.existing(t, true);
      this.airPlatforms.add(t);
      for (let cx = x - w / 2 + 30; cx <= x + w / 2 - 30; cx += 50) coin(cx, y - 44);
    };
    const bird = (x, y) => {
      const b = this.birds.create(x, y, "bird").setDepth(4);
      Object.assign(b, { baseY: y, phase: Math.random() * 6, on: false });
      this.tweens.add({ targets: b, scaleY: { from: 1, to: 0.7 }, duration: 160, yoyo: true, repeat: -1 });
    };
    const pit = (x, w) => {
      x = Math.round(x / 48) * 48;
      this.pits.push([x, w]);
      this.add.rectangle(x + w / 2, HEIGHT - 16, w, 32, 0xe84562, 0.8).setDepth(0);
    };

    // Patrón de obstáculos a lo largo del nivel
    let x = 720, i = 0;
    while (x < 5500) {
      switch (i % 8) {
        case 0: spike(x, i); arc(x - 60, GROUND_Y - 90, 5); x += 400; break;
        case 1: spike(x, i); spike(x + 56, i + 1); arc(x - 40, GROUND_Y - 100, 5); x += 430; break;
        case 2: pit(x, 192); arc(x - 4, GROUND_Y - 80, 6); x += 460; break;
        case 3: plat(x, 220); x += 420; break;
        case 4: bird(x + 100, GROUND_Y - 38); coin(x - 40, GROUND_Y - 90); coin(x, GROUND_Y - 130); x += 430; break;
        case 5: spike(x, i); bird(x + 250, GROUND_Y - 128); x += 440; break;
        case 6: pit(x, 240); plat(x + 120, 300); x += 520; break;
        default: spike(x, i); spike(x + 56, i + 1); spike(x + 112, i); arc(x - 20, GROUND_Y - 120, 7); x += 480;
      }
      i++;
    }

    // Suelo en tramos (los pozos quedan vacíos)
    this.pits.sort((a, b) => a[0] - b[0]);
    let cursor = 0;
    const section = (from, to) => {
      const t = this.add.tileSprite((from + to) / 2, GROUND_Y + 51, to - from, 102, "ground").setDepth(1);
      this.physics.add.existing(t, true);
      this.platforms.add(t);
    };
    this.pits.forEach(([px, pw]) => { section(cursor, px); cursor = px + pw; });
    section(cursor, LEVEL_W);

    // Meta
    this.add.rectangle(GOAL_X + 60, GROUND_Y - 100, 10, 200, 0xffffff).setDepth(2);
    this.add.triangle(GOAL_X + 94, GROUND_Y - 188, 0, 0, 0, 40, 60, 20, 0xe84562).setDepth(2);
    this.add.text(GOAL_X + 60, GROUND_Y - 230, "¡META!", {
      fontFamily: FONT, fontSize: "28px", color: "#ffffff", stroke: "#7c4dff", strokeThickness: 8
    }).setOrigin(0.5).setDepth(2);
  }

  /* ---------- Acciones ---------- */
  jump() {
    if (this.finished || !this.player) return;
    this.jumpBuf = this.time.now;
    this.tryJump();
  }
  tryJump() {
    const p = this.player, now = this.time.now;
    const grounded = p.body.blocked.down || p.body.touching.down || now - this.lastGround < 90;
    if (grounded && this.jumps === 0) {
      p.setVelocityY(-600); this.jumps = 1; this.jumpBuf = 0; sfx(420, 0.15, "square", 300);
      this.tweens.add({ targets: p, angle: { from: -8, to: 8 }, duration: 100, yoyo: true });
    } else if (!grounded && this.jumps < 2) {
      p.setVelocityY(-540); this.jumps = 2; this.jumpBuf = 0; sfx(640, 0.18, "square", 400);
      this.burst(p.x, p.y + 35, 0xffffff, 6);
      this.tweens.add({ targets: p, angle: 360, duration: 380, onComplete: () => (p.angle = 0) });
    }
  }

  burst(x, y, color, n = 8) {
    for (let k = 0; k < n; k++) {
      const r = this.add.rectangle(x, y, 6, 6, color).setDepth(10);
      this.tweens.add({
        targets: r, x: x + Phaser.Math.Between(-50, 50), y: y + Phaser.Math.Between(-45, 25),
        alpha: 0, duration: 450, onComplete: () => r.destroy()
      });
    }
  }
  floatText(x, y, msg, color = "#ffffff", stroke = "#e9a400") {
    const t = this.add.text(x, y, msg, { fontFamily: FONT, fontSize: "20px", color, stroke, strokeThickness: 5 })
      .setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: y - 55, alpha: 0, duration: 600, onComplete: () => t.destroy() });
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    this.coins++;
    this.scoreF += 100;
    sfx(880, 0.12, "square", 700);
    this.burst(coin.x, coin.y, 0xffc928, 6);
    this.floatText(coin.x, coin.y, "+100");
    this.emit("onCoins", this.coins, this.totalCoins);
    this.refreshHud();
  }

  touchBird(b) {
    if (this.finished || !b.active) return;
    const p = this.player;
    if (p.body.velocity.y > 80 && p.body.bottom < b.y + 12) {
      p.setVelocityY(-450); this.jumps = 1;
      this.scoreF += 200; sfx(300, 0.15, "square", 400);
      this.burst(b.x, b.y, 0xf0446f, 10); this.floatText(b.x, b.y - 10, "+200", "#fff", "#e84562");
      b.destroy();
    } else this.hurt();
  }

  hurt() {
    if (this.invuln || this.finished) return;
    this.lives--; this.refreshHud(); this.emit("onLives", this.lives);
    this.cameras.main.shake(180, 0.012); sfx(120, 0.3, "sawtooth", -60);
    if (this.lives <= 0) return this.gameOver();
    this.blink();
  }
  blink() {
    this.invuln = true;
    this.tweens.add({
      targets: this.player, alpha: 0.3, duration: 110, yoyo: true, repeat: 9,
      onComplete: () => { this.player.alpha = 1; this.invuln = false; }
    });
  }
  fall() {
    this.lives--; this.refreshHud(); this.emit("onLives", this.lives);
    sfx(200, 0.4, "sawtooth", -150);
    if (this.lives <= 0) return this.gameOver();
    this.player.setPosition(this.lastSafeX, GROUND_Y - 120).setVelocity(0, 0);
    this.cameras.main.shake(200, 0.01);
    this.blink();
  }

  gameOver() {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    this.player.setTint(0xff0000);
    this.emit("onGameOver", Math.floor(this.scoreF), this.coins);
    this.add.text(WIDTH / 2, HEIGHT / 2, "💥 ¡UPS! TOCA PARA REINTENTAR", {
      fontFamily: FONT, fontSize: "28px", color: "#ffffff", backgroundColor: "#e84562",
      padding: { left: 20, right: 20, top: 15, bottom: 15 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(40);
    this.time.delayedCall(400, () => {
      this.input.once("pointerdown", () => this.scene.restart());
      this.input.keyboard.once("keydown-SPACE", () => this.scene.restart());
    });
  }

  win() {
    this.finished = true;
    this.physics.pause();
    const bonus = this.lives * 500;
    this.scoreF += bonus;
    this.playVictorySound();
    for (let k = 0; k < 40; k++) this.burst(this.player.x + Phaser.Math.Between(-80, 80), GROUND_Y - Phaser.Math.Between(40, 220), [0xffd64d, 0xe84562, 0x43d7c6, 0x7c4dff][k % 4], 2);
    this.add.text(WIDTH / 2, HEIGHT / 2, `🎉 ¡LLEGASTE A LA FIESTA! +${bonus}`, {
      fontFamily: FONT, fontSize: "26px", color: "#ffffff", backgroundColor: "#7c4dff",
      padding: { left: 20, right: 20, top: 15, bottom: 15 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(40);
    this.emit("onScore", Math.floor(this.scoreF));
    this.time.delayedCall(900, () => this.emit("onWin", Math.floor(this.scoreF), this.coins));
  }

  playVictorySound() {
    [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) =>
      this.time.delayedCall(i * 120, () => sfx(f, 0.22, i % 2 ? "square" : "triangle")));
  }

  /* ---------- Bucle ---------- */
  update(time, delta) {
    if (this.finished) return;
    const p = this.player, b = p.body;

    // La velocidad sube poco a poco: más reto hacia el final
    this.speed = 270 + 90 * (p.x / LEVEL_W);
    p.setVelocityX(this.speed);

    const onGround = b.blocked.down || b.touching.down;
    if (onGround) {
      this.lastGround = time;
      this.lastSafeX = Math.max(150, p.x - 80);
      if (b.velocity.y >= 0) this.jumps = 0;
      if (this.jumpBuf && time - this.jumpBuf < 110) this.tryJump(); // salto "buffereado"
      if (time - this.dustT > 110) {
        this.dustT = time;
        const d = this.add.rectangle(p.x - 20, GROUND_Y - 3, 8, 8, 0xffffff, 0.7).setDepth(4);
        this.tweens.add({ targets: d, y: d.y - 14, alpha: 0, scale: 0.3, duration: 350, onComplete: () => d.destroy() });
      }
    }

    // Pájaros: se activan al acercarse y vuelan ondulando
    this.birds.getChildren().forEach(bd => {
      if (!bd.active) return;
      if (!bd.on && bd.x - p.x < 800) { bd.on = true; bd.setVelocityX(-90); }
      bd.y = bd.baseY + Math.sin(time * 0.004 + bd.phase) * 14;
    });

    if (p.y > HEIGHT + 80) { this.fall(); return; }

    this.scoreF += delta * 0.02;
    const s = Math.floor(this.scoreF);
    if (s !== this.lastScore) { this.lastScore = s; this.emit("onScore", s); }

    const prog = Phaser.Math.Clamp(p.x / GOAL_X, 0, 1);
    this.bar.width = Math.max(1, 296 * prog);
    this.emit("onProgress", prog);

    if (p.x >= GOAL_X) this.win();
  }
}

export function createGame(parent, callbacks) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent,
    backgroundColor: "#7bd8ff",
    physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: WIDTH, height: HEIGHT },
    // Los callbacks se pasan directo a la escena (antes se asignaban tarde, en el evento "ready")
    scene: new MainScene(callbacks)
  });
}