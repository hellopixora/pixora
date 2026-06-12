/* ============================================================
   Prime Plumbing LA — Three.js scroll-driven scene
   Procedural plumbing world: copper pipe network, pipe wrench,
   valve wheel, pressure gauge and falling water droplets.
   The camera glides through the scene as the page scrolls.
   ============================================================ */

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("scene");

if (!reduceMotion && canvas && window.WebGLRenderingContext) {
  init();
}

function init() {
  /* ---------- Renderer / scene / camera ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050d1a, 0.045);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.4, 10);
  const lookTarget = new THREE.Vector3(0, 0, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  /* ---------- Lights ---------- */
  scene.add(new THREE.AmbientLight(0x223a5e, 0.6));

  const keyLight = new THREE.DirectionalLight(0xbfdfff, 1.4);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  const cyanLight = new THREE.PointLight(0x38e1ff, 30, 30);
  cyanLight.position.set(-5, 3, 4);
  scene.add(cyanLight);

  const copperLight = new THREE.PointLight(0xff7a2f, 22, 28);
  copperLight.position.set(6, -3, 3);
  scene.add(copperLight);

  /* ---------- Materials ---------- */
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb46b3a, metalness: 0.95, roughness: 0.28,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x9fb4cc, metalness: 1.0, roughness: 0.22,
  });
  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x3c4a60, metalness: 0.9, roughness: 0.35,
  });
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xc23c2a, metalness: 0.55, roughness: 0.4,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc9a24a, metalness: 0.95, roughness: 0.3,
  });

  const world = new THREE.Group();
  scene.add(world);

  /* ---------- Pipe network ---------- */
  function makePipe(points, radius, material) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const geo = new THREE.TubeGeometry(curve, 120, radius, 20, false);
    return new THREE.Mesh(geo, material);
  }

  function addFlange(group, pos, radius, axis = "z") {
    const flange = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.35, radius * 0.32, 14, 30), brassMat);
    flange.position.set(...pos);
    if (axis === "x") flange.rotation.y = Math.PI / 2;
    if (axis === "y") flange.rotation.x = Math.PI / 2;
    group.add(flange);
  }

  const pipes = new THREE.Group();

  // Main copper run sweeping behind the whole page
  pipes.add(makePipe(
    [[-16, -3, -6], [-8, -2.4, -4.5], [-3, 1.5, -4], [3, -1.2, -3.5], [9, 2, -5], [16, 1, -7]],
    0.42, copperMat
  ));
  // Steel branch line
  pipes.add(makePipe(
    [[-12, 5, -8], [-5, 4, -6.5], [0, 5.2, -7], [6, 3.6, -6], [13, 5, -8.5]],
    0.3, steelMat
  ));
  // Vertical riser with elbow
  pipes.add(makePipe(
    [[5.5, -7, -4], [5.5, -2, -4], [5.8, -0.5, -4.2], [7.5, 0.6, -4.6], [11, 0.8, -5]],
    0.34, copperMat
  ));
  addFlange(pipes, [-3, 1.5, -4], 0.42);
  addFlange(pipes, [3, -1.2, -3.5], 0.42);
  addFlange(pipes, [0, 5.2, -7], 0.3);
  addFlange(pipes, [5.5, -2, -4], 0.34, "y");
  world.add(pipes);

  /* ---------- Pipe wrench (hero object) ---------- */
  function buildWrench() {
    const g = new THREE.Group();

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 3.0, 16), redMat);
    handle.position.y = -1.3;
    g.add(handle);

    const handleEnd = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), redMat);
    handleEnd.position.y = -2.8;
    g.add(handleEnd);

    const shank = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.5, 0.22), steelMat);
    shank.position.y = 0.55;
    g.add(shank);

    // Fixed lower jaw
    const lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.3, 0.26), steelMat);
    lowerJaw.position.set(0.3, 1.05, 0);
    g.add(lowerJaw);

    // Adjustable upper jaw (hook)
    const hookStem = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 0.2), steelMat);
    hookStem.position.set(0.72, 1.45, 0);
    g.add(hookStem);

    const hookTop = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.28, 0.24), steelMat);
    hookTop.position.set(0.34, 1.95, 0);
    g.add(hookTop);

    // Adjustment nut
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.36, 8), brassMat);
    nut.rotation.z = Math.PI / 2;
    nut.position.set(0.18, 0.45, 0);
    g.add(nut);

    return g;
  }

  const wrench = buildWrench();
  wrench.scale.setScalar(1.15);
  wrench.position.set(3.6, -0.2, 2.2);
  wrench.rotation.set(0.4, -0.5, -0.5);
  world.add(wrench);

  /* ---------- Valve wheel ---------- */
  function buildValve() {
    const g = new THREE.Group();
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.13, 16, 40), redMat);
    g.add(wheel);
    for (let i = 0; i < 4; i++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.95, 10), redMat);
      spoke.rotation.z = (i * Math.PI) / 4 + Math.PI / 8;
      g.add(spoke);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.34, 16), brassMat);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.2, 12), steelMat);
    stem.rotation.x = Math.PI / 2;
    stem.position.z = -0.65;
    g.add(stem);
    return g;
  }

  const valve = buildValve();
  valve.position.set(-4.6, 2.1, -1.5);
  valve.rotation.y = 0.45;
  world.add(valve);

  /* ---------- Pressure gauge ---------- */
  function buildGauge() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.3, 32), darkSteelMat);
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.09, 12, 36), brassMat);
    g.add(rim);
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.72, 32),
      new THREE.MeshStandardMaterial({ color: 0xe8f1ff, metalness: 0.1, roughness: 0.6 })
    );
    face.position.z = 0.16;
    g.add(face);
    const needle = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.6, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xd23b2a, metalness: 0.3, roughness: 0.4 })
    );
    needle.position.set(0, 0.18, 0.19);
    const needlePivot = new THREE.Group();
    needlePivot.add(needle);
    needlePivot.position.z = 0;
    needlePivot.rotation.z = -0.8;
    g.add(needlePivot);
    g.userData.needle = needlePivot;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12), brassMat);
    stem.position.y = -1.1;
    g.add(stem);
    return g;
  }

  const gauge = buildGauge();
  gauge.position.set(4.8, 3.4, -2.5);
  gauge.rotation.y = -0.4;
  world.add(gauge);

  /* ---------- Floating hex nuts ---------- */
  const nuts = new THREE.Group();
  const nutGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 6);
  for (let i = 0; i < 9; i++) {
    const nut = new THREE.Mesh(nutGeo, i % 2 ? brassMat : steelMat);
    nut.position.set(
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 12,
      -2 - Math.random() * 6
    );
    nut.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    nut.userData.spin = 0.2 + Math.random() * 0.5;
    nut.userData.bob = Math.random() * Math.PI * 2;
    nuts.add(nut);
  }
  world.add(nuts);

  /* ---------- Water droplets (points) ---------- */
  const DROP_COUNT = 350;
  const dropPos = new Float32Array(DROP_COUNT * 3);
  const dropSpeed = new Float32Array(DROP_COUNT);
  for (let i = 0; i < DROP_COUNT; i++) {
    dropPos[i * 3] = (Math.random() - 0.5) * 26;
    dropPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
    dropPos[i * 3 + 2] = -1 - Math.random() * 10;
    dropSpeed[i] = 0.012 + Math.random() * 0.03;
  }
  const dropGeo = new THREE.BufferGeometry();
  dropGeo.setAttribute("position", new THREE.BufferAttribute(dropPos, 3));
  const drops = new THREE.Points(
    dropGeo,
    new THREE.PointsMaterial({
      color: 0x38e1ff,
      size: 0.06,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  scene.add(drops);

  /* ---------- Scroll choreography ---------- */
  // One scrubbed timeline drives the camera and hero objects across sections.
  const cam = { x: 0, y: 0.4, z: 10, tx: 0, ty: 0, tz: 0 };

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const tl = gsap.timeline({
      defaults: { duration: 1, ease: "none" },
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
      },
    });

    // Hero -> Services: drift left and down toward the pipe junction
    tl.to(cam, { x: -2.5, y: -0.6, z: 8, tx: 1, ty: -0.8, tz: -3 }, 0)
      .to(wrench.position, { x: 6.5, y: 2.5, z: -1 }, 0)
      .to(wrench.rotation, { y: 2.4, z: 0.6 }, 0)

      // Services -> Process: dive along the main copper run
      .to(cam, { x: 2.2, y: 1.4, z: 5.5, tx: -2, ty: 1.5, tz: -6 }, 1)
      .to(valve.rotation, { z: Math.PI * 2.5 }, 1)

      // Process -> Why/Reviews: swing toward the valve side
      .to(cam, { x: -3.4, y: 2.2, z: 6.5, tx: -4.6, ty: 2.1, tz: -1.5 }, 2)
      .to(gauge.userData.needle.rotation, { z: 0.9 }, 2)

      // Reviews -> Contact: pull back wide for the finale
      .to(cam, { x: 0, y: 3.2, z: 13, tx: 0, ty: 0, tz: -4 }, 3)
      .to(world.rotation, { y: 0.35 }, 3);
  }

  /* ---------- Mouse parallax ---------- */
  const mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ---------- Render loop ---------- */
  const clock = new THREE.Clock();

  function animate() {
    const t = clock.getElapsedTime();

    // Idle motion
    wrench.rotation.x = 0.4 + Math.sin(t * 0.6) * 0.12;
    wrench.position.y += Math.sin(t * 0.9) * 0.0016;
    valve.rotation.x = Math.sin(t * 0.4) * 0.08;
    gauge.rotation.x = Math.sin(t * 0.5) * 0.06;

    nuts.children.forEach((nut) => {
      nut.rotation.y += nut.userData.spin * 0.005;
      nut.position.y += Math.sin(t * 0.8 + nut.userData.bob) * 0.0015;
    });

    // Droplets fall and recycle
    const pos = dropGeo.attributes.position.array;
    for (let i = 0; i < DROP_COUNT; i++) {
      pos[i * 3 + 1] -= dropSpeed[i];
      if (pos[i * 3 + 1] < -10) pos[i * 3 + 1] = 10;
    }
    dropGeo.attributes.position.needsUpdate = true;

    // Camera follows the scrubbed values + gentle mouse parallax
    camera.position.x += (cam.x + mouse.x * 0.5 - camera.position.x) * 0.06;
    camera.position.y += (cam.y - mouse.y * 0.35 - camera.position.y) * 0.06;
    camera.position.z += (cam.z - camera.position.z) * 0.06;
    lookTarget.set(cam.tx, cam.ty, cam.tz);
    camera.lookAt(lookTarget);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  /* ---------- Resize ---------- */
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
