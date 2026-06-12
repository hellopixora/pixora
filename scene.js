/* ============================================================
   Pixora Plumbing LA — Three.js scroll-driven scene
   Classic (non-module) build so it runs even from file://.
   Procedural plumbing world: a hero pipe-wrench centerpiece,
   copper pipe network, valve wheel, pressure gauge, plunger,
   floating hex nuts and falling water droplets. The camera
   glides between compositions as the page scrolls.
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.getElementById("scene");
  if (reduceMotion || !canvas || !window.THREE || !window.WebGLRenderingContext) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) {
    return; // no WebGL — static page still works
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // Color space + lighting-units shims so the scene looks the same on
  // r149 (classic build) and newer releases
  if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if (THREE.sRGBEncoding !== undefined) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }
  if ("useLegacyLights" in renderer) renderer.useLegacyLights = false;
  else renderer.physicallyCorrectLights = true;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050d1a, 0.038);

  var camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.4, 10);
  var lookTarget = new THREE.Vector3(2.5, 0, 0);

  /* ---------- Environment map (hand-built so no addons are needed) ---------- */
  function makeEnvironment() {
    var env = new THREE.Scene();
    function emitBox(color, scale, x, y, z) {
      var m = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: color })
      );
      m.scale.setScalar(scale);
      m.position.set(x, y, z);
      env.add(m);
    }
    emitBox(0xffffff, 6, 0, 14, 0);      // bright ceiling
    emitBox(0x38e1ff, 8, -14, 4, -6);    // cyan wall
    emitBox(0x2f7bff, 8, 12, 2, -8);     // blue wall
    emitBox(0xff8a3c, 5, 8, -8, 6);      // warm copper bounce
    emitBox(0x0a1830, 20, 0, -16, 0);    // dim floor
    var pmrem = new THREE.PMREMGenerator(renderer);
    var tex = pmrem.fromScene(env, 0.04).texture;
    pmrem.dispose();
    return tex;
  }
  scene.environment = makeEnvironment();

  /* ---------- Lights ---------- */
  scene.add(new THREE.AmbientLight(0x2a4368, 0.7));

  var keyLight = new THREE.DirectionalLight(0xcfe6ff, 1.6);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  var cyanLight = new THREE.PointLight(0x38e1ff, 40, 34);
  cyanLight.position.set(-5, 3, 5);
  scene.add(cyanLight);

  var copperLight = new THREE.PointLight(0xff7a2f, 30, 30);
  copperLight.position.set(7, -3, 4);
  scene.add(copperLight);

  var rimLight = new THREE.SpotLight(0x9fd8ff, 60, 40, Math.PI / 5, 0.5);
  rimLight.position.set(3, 9, -4);
  scene.add(rimLight);

  /* ---------- Materials ---------- */
  var copperMat = new THREE.MeshStandardMaterial({ color: 0xc06a32, metalness: 0.95, roughness: 0.25 });
  var steelMat = new THREE.MeshStandardMaterial({ color: 0xaebfd6, metalness: 1.0, roughness: 0.2 });
  var darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x3c4a60, metalness: 0.9, roughness: 0.32 });
  var redMat = new THREE.MeshStandardMaterial({ color: 0xd03a26, metalness: 0.6, roughness: 0.35 });
  var brassMat = new THREE.MeshStandardMaterial({ color: 0xd8b052, metalness: 0.95, roughness: 0.26 });
  var rubberMat = new THREE.MeshStandardMaterial({ color: 0xb33a2c, metalness: 0.1, roughness: 0.85 });
  var woodMat = new THREE.MeshStandardMaterial({ color: 0xc89a62, metalness: 0.05, roughness: 0.7 });

  var world = new THREE.Group();
  scene.add(world);

  /* ---------- Pipe network (background spine of the whole page) ---------- */
  function makePipe(points, radius, material) {
    var vecs = points.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); });
    var curve = new THREE.CatmullRomCurve3(vecs);
    return new THREE.Mesh(new THREE.TubeGeometry(curve, 140, radius, 20, false), material);
  }

  function addFlange(group, pos, radius, axis) {
    var flange = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.4, radius * 0.34, 14, 30), brassMat);
    flange.position.set(pos[0], pos[1], pos[2]);
    if (axis === "x") flange.rotation.y = Math.PI / 2;
    if (axis === "y") flange.rotation.x = Math.PI / 2;
    group.add(flange);
  }

  var pipes = new THREE.Group();
  pipes.add(makePipe(
    [[-18, -3.4, -6], [-9, -2.6, -4.5], [-3, 1.6, -4], [3, -1.4, -3.5], [10, 2.2, -5], [18, 1, -7]],
    0.5, copperMat
  ));
  pipes.add(makePipe(
    [[-14, 5.4, -8], [-6, 4.2, -6.5], [0, 5.6, -7], [7, 3.8, -6], [15, 5.4, -8.5]],
    0.34, steelMat
  ));
  pipes.add(makePipe(
    [[6, -8, -4], [6, -2.2, -4], [6.4, -0.6, -4.2], [8.4, 0.7, -4.6], [12, 0.9, -5]],
    0.4, copperMat
  ));
  addFlange(pipes, [-3, 1.6, -4], 0.5);
  addFlange(pipes, [3, -1.4, -3.5], 0.5);
  addFlange(pipes, [0, 5.6, -7], 0.34);
  addFlange(pipes, [6, -2.2, -4], 0.4, "y");
  world.add(pipes);

  /* ---------- Hero centerpiece: pipe wrench gripping a copper pipe ---------- */
  function buildWrench() {
    var g = new THREE.Group();

    var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.23, 3.4, 18), redMat);
    handle.position.y = -1.5;
    g.add(handle);

    var handleEnd = new THREE.Mesh(new THREE.SphereGeometry(0.23, 18, 18), redMat);
    handleEnd.position.y = -3.2;
    g.add(handleEnd);

    var shank = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.7, 0.26), steelMat);
    shank.position.y = 0.6;
    g.add(shank);

    var lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.34, 0.3), steelMat);
    lowerJaw.position.set(0.36, 1.2, 0);
    g.add(lowerJaw);

    var hookStem = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.3, 0.24), steelMat);
    hookStem.position.set(0.86, 1.66, 0);
    g.add(hookStem);

    var hookTop = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.32, 0.28), steelMat);
    hookTop.position.set(0.4, 2.26, 0);
    g.add(hookTop);

    var nut = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.42, 8), brassMat);
    nut.rotation.z = Math.PI / 2;
    nut.position.set(0.2, 0.5, 0);
    g.add(nut);

    // Copper pipe held in the jaws
    var grippedPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 3.4, 22), copperMat);
    grippedPipe.rotation.x = Math.PI / 2;
    grippedPipe.position.set(0.42, 1.73, 0);
    g.add(grippedPipe);

    var pipeRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.09, 12, 26), brassMat);
    pipeRing1.position.set(0.42, 1.73, 1.35);
    g.add(pipeRing1);
    var pipeRing2 = pipeRing1.clone();
    pipeRing2.position.z = -1.35;
    g.add(pipeRing2);

    return g;
  }

  var heroCluster = new THREE.Group();
  var wrench = buildWrench();
  heroCluster.add(wrench);

  // Orbiting hex nuts around the wrench so the hero reads instantly as 3D
  var orbit = new THREE.Group();
  var nutGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 6);
  for (var i = 0; i < 5; i++) {
    var oNut = new THREE.Mesh(nutGeo, i % 2 ? brassMat : steelMat);
    var ang = (i / 5) * Math.PI * 2;
    oNut.position.set(Math.cos(ang) * 3.1, Math.sin(ang) * 1.1 - 0.4, Math.sin(ang) * 1.6);
    oNut.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    orbit.add(oNut);
  }
  heroCluster.add(orbit);
  heroCluster.userData.orbit = orbit;

  heroCluster.position.set(3.6, -0.4, 1.2);
  heroCluster.rotation.set(0.35, -0.55, -0.35);
  world.add(heroCluster);

  /* ---------- Valve wheel ---------- */
  function buildValve() {
    var g = new THREE.Group();
    var wheel = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.15, 16, 44), redMat);
    g.add(wheel);
    for (var i = 0; i < 4; i++) {
      var spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.25, 10), redMat);
      spoke.rotation.z = (i * Math.PI) / 4 + Math.PI / 8;
      g.add(spoke);
    }
    var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16), brassMat);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.5, 12), steelMat);
    stem.rotation.x = Math.PI / 2;
    stem.position.z = -0.8;
    g.add(stem);
    var body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 18), brassMat);
    body.position.z = -1.55;
    g.add(body);
    return g;
  }

  var valve = buildValve();
  valve.position.set(-5.2, 2.2, -1.5);
  valve.rotation.y = 0.5;
  world.add(valve);

  /* ---------- Pressure gauge ---------- */
  function buildGauge() {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.34, 32), darkSteelMat);
    body.rotation.x = Math.PI / 2;
    g.add(body);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.1, 12, 36), brassMat);
    g.add(rim);
    var face = new THREE.Mesh(
      new THREE.CircleGeometry(0.8, 32),
      new THREE.MeshStandardMaterial({ color: 0xe8f1ff, metalness: 0.1, roughness: 0.6 })
    );
    face.position.z = 0.18;
    g.add(face);
    var needle = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.66, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xd23b2a, metalness: 0.3, roughness: 0.4 })
    );
    needle.position.set(0, 0.2, 0.21);
    var pivot = new THREE.Group();
    pivot.add(needle);
    pivot.rotation.z = -0.9;
    g.add(pivot);
    g.userData.needle = pivot;
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.1, 12), brassMat);
    stem.position.y = -1.3;
    g.add(stem);
    return g;
  }

  var gauge = buildGauge();
  gauge.position.set(5.4, 3.8, -2.5);
  gauge.rotation.y = -0.45;
  world.add(gauge);

  /* ---------- Plunger ---------- */
  function buildPlunger() {
    var g = new THREE.Group();
    var stick = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 12), woodMat);
    stick.position.y = 1.5;
    g.add(stick);
    var cup = new THREE.Mesh(
      new THREE.SphereGeometry(0.78, 24, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      rubberMat
    );
    cup.scale.y = 1.15;
    cup.position.y = 0.55;
    g.add(cup);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.08, 12, 30), rubberMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.02;
    g.add(rim);
    return g;
  }

  var plunger = buildPlunger();
  plunger.position.set(-6.5, -3.2, -2);
  plunger.rotation.z = 0.45;
  world.add(plunger);

  /* ---------- Floating hex nuts (depth filler) ---------- */
  var nuts = new THREE.Group();
  for (var n = 0; n < 10; n++) {
    var nut = new THREE.Mesh(nutGeo, n % 2 ? brassMat : steelMat);
    nut.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 14, -3 - Math.random() * 7);
    nut.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    nut.userData.spin = 0.2 + Math.random() * 0.5;
    nut.userData.bob = Math.random() * Math.PI * 2;
    nuts.add(nut);
  }
  world.add(nuts);

  /* ---------- Water droplets ---------- */
  var DROP_COUNT = 400;
  var dropPos = new Float32Array(DROP_COUNT * 3);
  var dropSpeed = new Float32Array(DROP_COUNT);
  for (var d = 0; d < DROP_COUNT; d++) {
    dropPos[d * 3] = (Math.random() - 0.5) * 28;
    dropPos[d * 3 + 1] = (Math.random() - 0.5) * 20;
    dropPos[d * 3 + 2] = -1 - Math.random() * 10;
    dropSpeed[d] = 0.014 + Math.random() * 0.034;
  }
  var dropGeo = new THREE.BufferGeometry();
  dropGeo.setAttribute("position", new THREE.BufferAttribute(dropPos, 3));
  var drops = new THREE.Points(
    dropGeo,
    new THREE.PointsMaterial({
      color: 0x38e1ff,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  scene.add(drops);

  /* ---------- Scroll choreography ---------- */
  var cam = { x: 0, y: 0.4, z: 10, tx: 2.5, ty: 0, tz: 0 };

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    var tl = gsap.timeline({
      defaults: { duration: 1, ease: "none" },
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
      },
    });

    // Hero -> Services: wrench sweeps across the screen, camera banks left
    tl.to(cam, { x: -2.8, y: -0.6, z: 8, tx: 0.5, ty: -0.8, tz: -3 }, 0)
      .to(heroCluster.position, { x: -4.5, y: 2.6, z: -1 }, 0)
      .to(heroCluster.rotation, { y: 2.6, z: 0.7, x: 0.9 }, 0)

      // Services -> Process: dive along the copper run, valve rolls to center
      .to(cam, { x: 2.4, y: 1.5, z: 5.5, tx: -2, ty: 1.6, tz: -6 }, 1)
      .to(valve.position, { x: -1.5, y: 1.4, z: 0.5 }, 1)
      .to(valve.rotation, { z: Math.PI * 2 }, 1)

      // Process -> Why: keep cranking the valve, plunger rises into frame
      .to(cam, { x: -3.6, y: 2.2, z: 7, tx: -2.5, ty: 1.6, tz: -1 }, 2)
      .to(valve.rotation, { z: Math.PI * 4.5 }, 2)
      .to(plunger.position, { x: -7.5, y: -1.2 }, 2)

      // Why -> Reviews: gauge swings forward, needle climbs to full pressure
      .to(cam, { x: 2.6, y: 2.8, z: 7.5, tx: 4.2, ty: 3.2, tz: -2.5 }, 3)
      .to(gauge.userData.needle.rotation, { z: 1.0 }, 3)
      .to(gauge.rotation, { y: 0.1 }, 3)

      // Reviews -> Contact: pull back wide over the whole pipe world
      .to(cam, { x: 0, y: 3.6, z: 14.5, tx: 0, ty: 0.4, tz: -4 }, 4)
      .to(world.rotation, { y: 0.4 }, 4)
      .to(heroCluster.position, { x: 4.5, y: -0.5, z: -2 }, 4)
      .to(heroCluster.rotation, { y: 5.2, z: -0.2 }, 4);
  }

  /* ---------- Mouse parallax ---------- */
  var mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", function (e) {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ---------- Render loop ---------- */
  var clock = new THREE.Clock();

  function animate() {
    var t = clock.getElapsedTime();

    // Idle life so the scene never looks static
    wrench.rotation.y = Math.sin(t * 0.5) * 0.18;
    heroCluster.position.y += Math.sin(t * 0.9) * 0.002;
    heroCluster.userData.orbit.rotation.y = t * 0.45;
    valve.rotation.x = Math.sin(t * 0.4) * 0.08;
    gauge.rotation.x = Math.sin(t * 0.5) * 0.06;
    plunger.rotation.y = t * 0.3;

    nuts.children.forEach(function (nut) {
      nut.rotation.y += nut.userData.spin * 0.006;
      nut.position.y += Math.sin(t * 0.8 + nut.userData.bob) * 0.0018;
    });

    var pos = dropGeo.attributes.position.array;
    for (var i = 0; i < DROP_COUNT; i++) {
      pos[i * 3 + 1] -= dropSpeed[i];
      if (pos[i * 3 + 1] < -10) pos[i * 3 + 1] = 10;
    }
    dropGeo.attributes.position.needsUpdate = true;

    camera.position.x += (cam.x + mouse.x * 0.6 - camera.position.x) * 0.06;
    camera.position.y += (cam.y - mouse.y * 0.4 - camera.position.y) * 0.06;
    camera.position.z += (cam.z - camera.position.z) * 0.06;
    lookTarget.set(cam.tx, cam.ty, cam.tz);
    camera.lookAt(lookTarget);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  /* ---------- Resize ---------- */
  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
