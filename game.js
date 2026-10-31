
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const ballsEl = document.getElementById("balls");
const bestEl = document.getElementById("best");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const hitBtn = document.getElementById("hitBtn");

let W = 400, H = 500;
let running = false;
let score = 0;
let balls = 0;
let best = 0;
let ballX = 0;
let ballY = 0;
let ballSpeed = 4;
let ballActive = false;
let lastTime = 0;
let feedback = "";
let feedbackTimer = 0;
let particles = [];
let swing = 0;

try {
  best = Number(localStorage.getItem("cricketBest")) || 0;
} catch(e) {}
bestEl.textContent = best;

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = 400;
  H = 500;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

function drawStadium() {
  ctx.fillStyle = "#173c4a";
  ctx.fillRect(0, 0, W, H);

  // Stadium crowd
  for (let y = 0; y < 130; y += 12) {
    for (let x = 0; x < W; x += 12) {
      const colors = ["#d4ad54", "#e8e3c5", "#5f9b8d", "#b65b48"];
      ctx.fillStyle = colors[(x * 3 + y * 7) % colors.length];
      ctx.fillRect(x, y, 6, 5);
    }
  }

  // Grass
  ctx.fillStyle = "#267c46";
  ctx.fillRect(0, 130, W, 370);

  // Ground rings
  ctx.strokeStyle = "rgba(255,255,255,.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(200, 330, 185, 150, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Pitch
  ctx.fillStyle = "#bd9a6c";
  ctx.beginPath();
  ctx.moveTo(145, 180);
  ctx.lineTo(255, 180);
  ctx.lineTo(285, 470);
  ctx.lineTo(115, 470);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d6b88d";
  ctx.fillRect(158, 190, 84, 270);

  // Pitch lines
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, 220);
  ctx.lineTo(250, 220);
  ctx.moveTo(125, 440);
  ctx.lineTo(275, 440);
  ctx.stroke();

  // Stumps
  ctx.fillStyle = "#f4e4bc";
  for (let x = 211; x <= 229; x += 9) {
    ctx.fillRect(x, 414, 4, 28);
  }
  ctx.fillRect(210, 412, 24, 3);
}

function drawBatsman() {
  ctx.save();
  ctx.translate(300, 405);

  // Legs
  ctx.strokeStyle = "#e5e8ec";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(-12, 27);
  ctx.moveTo(8, 0);
  ctx.lineTo(18, 27);
  ctx.stroke();

  // Pads
  ctx.fillStyle = "#f0f0e9";
  ctx.fillRect(-20, -2, 12, 23);
  ctx.fillRect(8, -2, 12, 23);

  // Body
  ctx.fillStyle = "#1764a2";
  ctx.beginPath();
  ctx.roundRect(-18, -48, 38, 50, 9);
  ctx.fill();

  // Arms
  ctx.strokeStyle = "#d69d78";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-12, -35);
  ctx.lineTo(-26, -12);
  ctx.moveTo(12, -35);
  ctx.lineTo(23, -12);
  ctx.stroke();

  // Head and helmet
  ctx.fillStyle = "#c98d68";
  ctx.beginPath();
  ctx.arc(1, -61, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e2b72f";
  ctx.beginPath();
  ctx.arc(1, -67, 15, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(1, -68, 16, 5);

  // Bat
  ctx.save();
  ctx.translate(17, -20);
  ctx.rotate(swing);
  ctx.fillStyle = "#d7a35d";
  ctx.fillRect(-3, -52, 7, 52);
  ctx.fillStyle = "#76502b";
  ctx.fillRect(-3, -55, 7, 12);
  ctx.restore();

  ctx.restore();
}

function drawBowler() {
  ctx.fillStyle = "#e6c8a5";
  ctx.beginPath();
  ctx.arc(195, 180, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#bd443d";
  ctx.fillRect(187, 190, 16, 28);

  ctx.strokeStyle = "#eee";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(190, 215);
  ctx.lineTo(183, 233);
  ctx.moveTo(200, 215);
  ctx.lineTo(207, 233);
  ctx.stroke();
}

function drawBall() {
  if (!ballActive) return;
  ctx.fillStyle = "#d92d30";
  ctx.beginPath();
  ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "white";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ballX, ballY, 5, -1, 1);
  ctx.stroke();
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function draw() {
  drawStadium();
  drawBowler();
  drawBatsman();
  drawBall();
  drawParticles();

  if (feedbackTimer > 0) {
    ctx.fillStyle = "#c2f451";
    ctx.font = "bold 34px Arial";
    ctx.textAlign = "center";
    ctx.fillText(feedback, 200, 90);
  }
}

function updateScore() {
  scoreEl.textContent = score;
  ballsEl.textContent = balls + " / 12";
}

function newBall() {
  ballX = 55;
  ballY = 255 + Math.random() * 60;
  ballSpeed = 190 + Math.random() * 50;
  ballActive = true;
}

function finishBall(result) {
  if (!running || !ballActive) return;

  ballActive = false;
  balls++;

  if (result === "SIX") {
    score += 6;
    feedback = "SIX! 🚀";
    burst(200, 250, "#c2f451");
  } else if (result === "FOUR") {
    score += 4;
    feedback = "FOUR!";
    burst(200, 250, "#ffd45b");
  } else if (result === "TWO") {
    score += 2;
    feedback = "2 RUNS!";
  } else if (result === "ONE") {
    score += 1;
    feedback = "1 RUN!";
  } else {
    feedback = "OUT! ❌";
  }

  feedbackTimer = 1;
  updateScore();

  if (score > best) {
    best = score;
    bestEl.textContent = best;
    try {
      localStorage.setItem("cricketBest", best);
    } catch(e) {}
  }

  if (balls >= 12) {
    running = false;
    hitBtn.disabled = true;
    message.classList.remove("hidden");
    message.querySelector("h2").textContent = "MATCH OVER!";
    message.querySelector("p").textContent =
      "You scored " + score + " runs in 12 balls!";
    startBtn.textContent = "PLAY AGAIN";
  } else {
    setTimeout(() => {
      if (running) newBall();
    }, 650);
  }
}

function burst(x, y, color) {
  for (let i = 0; i < 18; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - .5) * 260,
      vy: (Math.random() - .5) * 260,
      life: 1,
      color
    });
  }
}

function hit() {
  if (!running || !ballActive) return;

  const distance = Math.abs(ballX - 280);

  if (distance < 42) {
    swing = -1.1;

    if (distance < 12) {
      finishBall("SIX");
    } else if (distance < 25) {
      finishBall("FOUR");
    } else {
      finishBall(Math.random() > .5 ? "TWO" : "ONE");
    }
  } else {
    finishBall("OUT");
  }
}

function update(dt) {
  if (running && ballActive) {
    ballX += ballSpeed * dt;

    if (ballX > 330) {
      finishBall("OUT");
    }
  }

  swing *= .85;
  feedbackTimer = Math.max(0, feedbackTimer - dt);

  particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt * 1.5;
  });

  particles = particles.filter(p => p.life > 0);
}

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000 || 0, .04);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function startGame() {
  score = 0;
  balls = 0;
  particles = [];
  running = true;
  message.classList.add("hidden");
  hitBtn.disabled = false;
  startBtn.textContent = "PLAY AGAIN";
  updateScore();
  newBall();
}

startBtn.addEventListener("click", startGame);
hitBtn.addEventListener("pointerdown", hit);

draw();
requestAnimationFrame(loop);
