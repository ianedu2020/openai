import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const canvas = document.getElementById("game");
const scoreEl = document.getElementById("score");
const hpEl = document.getElementById("hp");
const timeEl = document.getElementById("time");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x02050c, 10, 130);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(0, 1.8, 8);

const hemi = new THREE.HemisphereLight(0x7ad8ff, 0x0a101f, 0.8);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.7);
dir.position.set(8, 18, 4);
scene.add(dir);

const floorGeo = new THREE.PlaneGeometry(220, 220, 12, 12);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x0c1524,
  metalness: 0.35,
  roughness: 0.75,
  wireframe: false,
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const grid = new THREE.GridHelper(220, 72, 0x0ef5ff, 0x0b3d59);
grid.position.y = 0.02;
scene.add(grid);

const keys = new Set();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

let score = 0;
let hp = 100;
let running = false;
let timer = 90;
let canShoot = true;
let lastTick = performance.now();
let enemySpawnClock = 0;
let yaw = 0;
let pitch = 0;

const enemies = [];

const enemyMat = new THREE.MeshStandardMaterial({
  color: 0xff3864,
  emissive: 0x551122,
  roughness: 0.45,
  metalness: 0.55,
});

function spawnEnemy() {
  const geo = new THREE.IcosahedronGeometry(0.9, 1);
  const mesh = new THREE.Mesh(geo, enemyMat.clone());
  const angle = Math.random() * Math.PI * 2;
  const radius = 25 + Math.random() * 40;
  mesh.position.set(Math.cos(angle) * radius, 1.1 + Math.random() * 2, Math.sin(angle) * radius);
  mesh.userData.hp = 2;
  mesh.userData.speed = 3 + Math.random() * 2;
  scene.add(mesh);
  enemies.push(mesh);
}

function removeEnemy(enemy, addScore = 0) {
  scene.remove(enemy);
  const idx = enemies.indexOf(enemy);
  if (idx >= 0) enemies.splice(idx, 1);
  if (addScore) {
    score += addScore;
    scoreEl.textContent = String(score);
  }
}

function restartGame() {
  for (const enemy of [...enemies]) removeEnemy(enemy);
  score = 0;
  hp = 100;
  timer = 90;
  scoreEl.textContent = "0";
  hpEl.textContent = "100";
  timeEl.textContent = "90";
  camera.position.set(0, 1.8, 8);
  yaw = 0;
  pitch = 0;
  camera.rotation.set(0, 0, 0);
  enemySpawnClock = 0;
  running = true;
  lastTick = performance.now();
}

function endGame() {
  running = false;
  document.exitPointerLock?.();
  overlay.classList.remove("hidden");
  overlay.querySelector("h1").textContent = `게임 종료 · 점수 ${score}`;
  overlay.querySelector("p").textContent = "다시 시작해서 최고 점수를 경신해보세요!";
  startBtn.textContent = "다시 시작";
}

function shoot() {
  if (!running || !canShoot) return;
  canShoot = false;
  setTimeout(() => {
    canShoot = true;
  }, 140);

  raycaster.setFromCamera(center, camera);
  const hits = raycaster.intersectObjects(enemies, false);
  if (hits.length > 0) {
    const target = hits[0].object;
    target.userData.hp -= 1;
    target.material.emissive.setHex(0xff7777);
    setTimeout(() => target.material.emissive.setHex(0x551122), 90);
    if (target.userData.hp <= 0) {
      removeEnemy(target, 10);
    }
  }
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("keydown", (e) => keys.add(e.code));
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("mousedown", () => shoot());

document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== canvas || !running) return;
  const sensitivity = 0.0022;
  yaw -= e.movementX * sensitivity;
  pitch -= e.movementY * sensitivity;
  pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, pitch));
  camera.rotation.set(pitch, yaw, 0, "YXZ");
});

startBtn.addEventListener("click", () => {
  overlay.classList.add("hidden");
  canvas.requestPointerLock();
  restartGame();
});

function tick(now) {
  const dt = Math.min((now - lastTick) / 1000, 0.05);
  lastTick = now;

  if (running) {
    timer -= dt;
    if (timer <= 0 || hp <= 0) {
      timer = Math.max(0, timer);
      timeEl.textContent = timer.toFixed(0);
      hpEl.textContent = Math.max(0, hp).toFixed(0);
      endGame();
    } else {
      timeEl.textContent = timer.toFixed(0);
      hpEl.textContent = hp.toFixed(0);

      direction.set(0, 0, 0);
      if (keys.has("KeyW")) direction.z -= 1;
      if (keys.has("KeyS")) direction.z += 1;
      if (keys.has("KeyA")) direction.x -= 1;
      if (keys.has("KeyD")) direction.x += 1;

      const speed = keys.has("ShiftLeft") ? 13 : 8;
      direction.normalize();

      const forward = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation).setY(0).normalize();
      const right = new THREE.Vector3(1, 0, 0).applyEuler(camera.rotation).setY(0).normalize();

      velocity
        .copy(forward.multiplyScalar(direction.z * speed))
        .add(right.multiplyScalar(direction.x * speed));

      camera.position.addScaledVector(velocity, dt);
      camera.position.y = 1.8;

      camera.position.x = Math.max(-100, Math.min(100, camera.position.x));
      camera.position.z = Math.max(-100, Math.min(100, camera.position.z));

      enemySpawnClock += dt;
      if (enemySpawnClock > 1.2 && enemies.length < 24) {
        enemySpawnClock = 0;
        spawnEnemy();
      }

      for (const enemy of enemies) {
        const toPlayer = new THREE.Vector3().subVectors(camera.position, enemy.position);
        const dist = toPlayer.length();
        enemy.position.addScaledVector(toPlayer.normalize(), enemy.userData.speed * dt);
        enemy.rotation.x += dt * 1.1;
        enemy.rotation.y += dt * 1.7;

        if (dist < 1.8) {
          hp -= 14 * dt;
        }
      }
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame((t) => {
  lastTick = t;
  tick(t);
});
