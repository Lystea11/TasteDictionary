/* =========================================================================
   THE FIVE TASTES — 五味辞典  ·  TONGUE ATLAS
   A real 3D tongue (geometry derived from tongue.glb) rendered per entry,
   with the five classic taste zones marked on the dorsal surface. The map is
   fully interactive: hover or click any zone label (or its dot) to spotlight
   that taste — the tongue eases round to face it, the zone lights up in its
   own accent, leader lines tie each label to its point, and a "view entry"
   link opens the full word. A warm environment map, clearcoat sheen, soft
   contact shadow and a gentle living drift make it feel like an object, not a
   diagram.

   Progressive enhancement: this is optional. If Three.js or WebGL is
   unavailable, app.js keeps the flavour-profile panel and a static poster, so
   nothing breaks. Classic script (not an ES module) using the global THREE
   from the r136 UMD build, so the whole thing loads from file:// with no
   server — and the geometry is inlined as base64 typed arrays in
   tongue-geometry.js, so there is no fetch either.
   ========================================================================= */
(() => {
  "use strict";
  const THREE = window.THREE;
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SVGNS = "http://www.w3.org/2000/svg";

  /* ---- the five classic taste zones, in CENTRED model space -------------
     Model (centred): X[-2.7,2.7] width · Y[-5.5,5.5] length (tip=-5.5,
     root=+5.5) · Z dorsal(top)=+ . Positions are seed points on the dorsal
     plane; the true surface point + normal is found by ray-casting down. */
  const ZONES = [
    { id: "sweet",  char: "甘", en: "Sweet", seed: [ 0.0, -4.4] },
    { id: "salty",  char: "塩", en: "Salty", seed: [ 1.75, -1.6] },
    { id: "umami",  char: "旨", en: "Umami", seed: [ 0.0,  0.3] },
    { id: "sour",   char: "酸", en: "Sour",  seed: [-1.75,  2.0] },
    { id: "bitter", char: "苦", en: "Bitter",seed: [ 0.0,  4.1] },
  ];

  /* each zone glows in its own taste accent, so the whole map reads in colour
     (mirrors the per-taste accents scoped in styles.css). */
  const ZONE_ACCENTS = {
    sweet: "#c25c77", sour: "#8c9a2b", bitter: "#7c4a2a",
    salty: "#3f6e7d", umami: "#ae5536",
  };

  /* ----------------------------------------------------------- base64 → TA */
  function b64ToBytes(b64) {
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  /* --------------------------------------------- shared geometry (built once) */
  let SHARED = null;
  function buildGeometry() {
    if (SHARED) return SHARED;
    const G = window.TONGUE_GEOM;
    if (!G) throw new Error("TONGUE_GEOM missing");
    const positions = new Float32Array(b64ToBytes(G.positionsB64).buffer);
    const indices = new Uint32Array(b64ToBytes(G.indicesB64).buffer);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeBoundingBox();
    const c = new THREE.Vector3();
    geo.boundingBox.getCenter(c);
    geo.translate(-c.x, -c.y, -c.z);     // centre on origin
    geo.computeVertexNormals();          // GLB had no normals
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    // planar (dorsal) UVs so the subtle papillae bump map has somewhere to land
    const bb = geo.boundingBox;
    const pos = geo.getAttribute("position");
    const uv = new Float32Array(pos.count * 2);
    const sx = 1 / Math.max(1e-4, bb.max.x - bb.min.x);
    const sy = 1 / Math.max(1e-4, bb.max.y - bb.min.y);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) - bb.min.x) * sx;
      uv[i * 2 + 1] = (pos.getY(i) - bb.min.y) * sy;
    }
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    SHARED = geo;
    return geo;
  }

  /* resolve each zone's surface point + normal by ray-casting straight down
     the +Z axis onto the dorsal surface (done once on the shared mesh). */
  let ZONE_HITS = null;
  function resolveZones(mesh) {
    if (ZONE_HITS) return ZONE_HITS;
    const ray = new THREE.Raycaster();
    const down = new THREE.Vector3(0, 0, -1);
    ZONE_HITS = ZONES.map((z) => {
      const origin = new THREE.Vector3(z.seed[0], z.seed[1], 6);
      ray.set(origin, down);
      const hits = ray.intersectObject(mesh, false);
      let point, normal;
      if (hits.length) {
        point = hits[0].point.clone();
        normal = hits[0].face
          ? hits[0].face.normal.clone().transformDirection(mesh.matrixWorld).normalize()
          : new THREE.Vector3(0, 0, 1);
      } else {
        point = new THREE.Vector3(z.seed[0], z.seed[1], 1.2);
        normal = new THREE.Vector3(0, 0, 1);
      }
      return { ...z, point, normal };
    });
    return ZONE_HITS;
  }

  /* --------------------------------------------------- shared canvas textures */
  function radialTexture(stops) {
    const s = 128;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const ctx = cv.getContext("2d");
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(cv);
  }

  let GLOW_TEX = null;
  function glowTexture() {
    if (GLOW_TEX) return GLOW_TEX;
    GLOW_TEX = radialTexture([
      [0, "rgba(255,255,255,1)"],
      [0.35, "rgba(255,255,255,0.5)"],
      [1, "rgba(255,255,255,0)"],
    ]);
    GLOW_TEX.encoding = THREE.sRGBEncoding;
    return GLOW_TEX;
  }

  let SHADOW_TEX = null;
  function shadowTexture() {
    if (SHADOW_TEX) return SHADOW_TEX;
    SHADOW_TEX = radialTexture([
      [0, "rgba(0,0,0,0.6)"],
      [0.5, "rgba(0,0,0,0.22)"],
      [1, "rgba(0,0,0,0)"],
    ]);
    return SHADOW_TEX;
  }

  /* fine procedural bump → micro-papillae, so the surface never reads as flat
     plastic, without tipping over into anatomical detail. */
  let BUMP_TEX = null;
  function bumpTexture() {
    if (BUMP_TEX) return BUMP_TEX;
    const s = 256;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * s, y = Math.random() * s;
      const r = 0.6 + Math.random() * 1.7;
      const up = Math.random() > 0.5;
      ctx.beginPath();
      ctx.fillStyle = up
        ? `rgba(255,255,255,${0.12 + Math.random() * 0.24})`
        : `rgba(0,0,0,${0.10 + Math.random() * 0.20})`;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    BUMP_TEX = new THREE.CanvasTexture(cv);
    BUMP_TEX.wrapS = BUMP_TEX.wrapT = THREE.RepeatWrapping;
    BUMP_TEX.repeat.set(5, 7);
    return BUMP_TEX;
  }

  /* warm gradient image-based lighting — the single biggest lift from "cheap"
     to "object": real soft reflections in the clearcoat. Built per renderer. */
  function buildEnv(renderer) {
    const s = 256;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const ctx = cv.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0.0, "#fff7ea");   // warm sky
    g.addColorStop(0.42, "#f1e3c9");
    g.addColorStop(0.7, "#c9a88c");
    g.addColorStop(1.0, "#6d5440");   // warm floor
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const grad = new THREE.CanvasTexture(cv);
    grad.mapping = THREE.EquirectangularReflectionMapping;
    grad.encoding = THREE.sRGBEncoding;
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const env = pmrem.fromEquirectangular(grad).texture;
    grad.dispose();
    pmrem.dispose();
    return env;
  }

  /* --------------------------------------------------------- CSS var helper */
  function cssHex(el, name, fallback) {
    const v = getComputedStyle(el).getPropertyValue(name).trim();
    return v || fallback;
  }

  /* yaw/pitch (rotation order YXZ) that bring a unit direction round to ~ +Z,
     i.e. toward the camera. Used to spotlight a clicked zone. */
  function poseToFront(dir, pitchBias) {
    const n = dir.clone().normalize();
    const pitch = Math.atan2(n.y, n.z) + (pitchBias || 0);
    const yaw = Math.atan2(-n.x, Math.hypot(n.y, n.z));
    return { yaw, pitch };
  }

  /* ============================================================ ONE PALATE */
  function createPalate(host, taste) {
    const stage = host.querySelector(".tongue-stage");
    const overlay = host.querySelector(".tongue-labels");
    if (!stage) return null;

    // r136 has no automatic colour management, so convert sRGB hex -> linear
    // ourselves (what newer three does internally) to keep colours rich.
    const accentHex = cssHex(host, "--accent", "#ae5536");
    const accent = new THREE.Color(accentHex).convertSRGBToLinear();

    /* renderer ----------------------------------------------------------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.className = "tongue-canvas";
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const envTex = buildEnv(renderer);
    scene.environment = envTex;

    /* lights — warm key, cool fill, accent rim, over soft IBL ------------- */
    const hemi = new THREE.HemisphereLight(0xfff4e2, 0x6b5a48, 0.42);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff1dc, 1.4);
    key.position.set(-4, 8, 9);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd9e6ff, 0.22);
    fill.position.set(6, 2, 4);
    scene.add(fill);
    const accentRim = new THREE.DirectionalLight(new THREE.Color(accentHex), 0.42);
    accentRim.position.set(0, -3, -7);
    scene.add(accentRim);

    /* tongue mesh — wet blush clay: clearcoat sheen + IBL reflections ----- */
    const geo = buildGeometry();
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xbe5f54).convertSRGBToLinear(),
      roughness: 0.5,
      metalness: 0.0,
      clearcoat: 0.72,
      clearcoatRoughness: 0.34,
      sheen: 0.55,
      sheenColor: new THREE.Color(0xff8f7c).convertSRGBToLinear(),
      sheenRoughness: 0.65,
      bumpMap: bumpTexture(),
      bumpScale: 0.024,
      envMapIntensity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.updateMatrixWorld(true);

    const pivot = new THREE.Group();
    pivot.rotation.order = "YXZ";
    pivot.add(mesh);
    scene.add(pivot);

    /* soft grounding contact shadow (static billboard, eases in) --------- */
    const shadow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: shadowTexture(), color: 0x2a221b, transparent: true,
      opacity: 0, depthWrite: false, depthTest: false,
    }));
    shadow.scale.set(7.4, 2.6, 1);
    shadow.position.set(0, geo.boundingBox.min.y - 0.4, -0.5);
    scene.add(shadow);

    /* zone markers + interactive labels ---------------------------------- */
    const zones = resolveZones(mesh);
    const markerGroup = new THREE.Group();
    pivot.add(markerGroup);

    // leader-line layer sits behind the labels in the same overlay
    const leaderSVG = document.createElementNS(SVGNS, "svg");
    leaderSVG.setAttribute("class", "tongue-leaders");
    leaderSVG.setAttribute("aria-hidden", "true");
    overlay.appendChild(leaderSVG);

    const markers = zones.map((z) => {
      const zAccent = new THREE.Color(ZONE_ACCENTS[z.id] || accentHex).convertSRGBToLinear();
      const isHome = z.id === taste.id;
      const g = new THREE.Group();
      const base = z.point.clone().add(z.normal.clone().multiplyScalar(0.05));

      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture(), color: zAccent, transparent: true,
        opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      }));
      glow.position.copy(base);
      g.add(glow);

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 24, 24),
        new THREE.MeshStandardMaterial({
          color: zAccent, emissive: zAccent, emissiveIntensity: 0.15,
          roughness: 0.35, metalness: 0.0, transparent: true, opacity: 0.92,
        })
      );
      dot.position.copy(base);
      dot.userData.zoneId = z.id;
      g.add(dot);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.42, 0.5, 44),
        new THREE.MeshBasicMaterial({ color: zAccent, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
      );
      ring.position.copy(base);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), z.normal);
      g.add(ring);

      markerGroup.add(g);

      // HTML label: clickable main pill + a "view entry" link that appears
      // when the zone is spotlit (the link uses app.js's data-jump handler).
      const label = document.createElement("div");
      label.className = "tongue-label" + (isHome ? " is-home" : "");
      label.dataset.zone = z.id;
      label.innerHTML =
        `<button type="button" class="tongue-label__main" aria-label="Spotlight the ${z.en} taste zone">` +
          `<b lang="ja">${z.char}</b><span>${z.en}</span>` +
        `</button>` +
        `<a class="tongue-label__go" data-jump="${z.id}" href="#${z.id}">${z.en} entry &rsaquo;</a>`;
      overlay.appendChild(label);

      const line = document.createElementNS(SVGNS, "line");
      line.setAttribute("class", "tongue-leader");
      const tipDot = document.createElementNS(SVGNS, "circle");
      tipDot.setAttribute("class", "tongue-leader-tip");
      tipDot.setAttribute("r", "2.6");
      leaderSVG.appendChild(line);
      leaderSVG.appendChild(tipDot);

      // pose that rotates this zone round to face the camera
      const target = poseToFront(base, -0.12);
      target.pitch = Math.max(-1.2, Math.min(0.9, target.pitch));

      return {
        z, zAccent, isHome, group: g, glow, dot, ring, label, line, tipDot,
        mainBtn: label.querySelector(".tongue-label__main"),
        anchor: base, target, level: isHome ? 0.5 : 0.14, hover: false,
      };
    });

    /* camera ------------------------------------------------------------- */
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const REST = { yaw: -0.18, pitch: -0.34 };
    let yaw = REST.yaw, pitch = REST.pitch;

    function frameCamera() {
      const r = geo.boundingSphere.radius;          // ~6.1
      const w = stage.clientWidth, h = stage.clientHeight || 1;
      const aspect = w / h;
      const fov = (camera.fov * Math.PI) / 180;
      let dist = (r * 1.34) / Math.sin(fov / 2);
      if (aspect < 1) dist /= Math.max(0.62, aspect);
      camera.position.set(0, 1.9, dist);
      camera.lookAt(0, 0.55, 0);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }

    /* resize ------------------------------------------------------------- */
    function resize() {
      const w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      leaderSVG.setAttribute("width", w);
      leaderSVG.setAttribute("height", h);
      frameCamera();
      requestFrame();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    /* label + leader projection ------------------------------------------ */
    const v = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    const nWorld = new THREE.Vector3();
    const cProj = new THREE.Vector3();
    function updateLabels() {
      const w = stage.clientWidth, h = stage.clientHeight;
      camera.getWorldDirection(camDir);
      cProj.set(0, 0.4, 0).project(camera);
      const cx = (cProj.x * 0.5 + 0.5) * w, cy = (-cProj.y * 0.5 + 0.5) * h;
      for (const m of markers) {
        v.copy(m.anchor).applyMatrix4(pivot.matrixWorld);
        nWorld.copy(m.z.normal).transformDirection(pivot.matrixWorld);
        const facing = nWorld.dot(camDir); // <0 means facing camera
        v.project(camera);
        const x = (v.x * 0.5 + 0.5) * w;
        const y = (-v.y * 0.5 + 0.5) * h;
        // push the label radially outward from the model centre so the leader
        // line reads as an annotation; the centre zone gets a fixed lift.
        let dx = x - cx, dy = y - cy;
        let len = Math.hypot(dx, dy);
        if (len < 8) { dx = 0.55; dy = -0.84; len = 1; }   // centre zone: angle leader up-right, not a vertical seam
        dx /= len; dy /= len;
        const off = 34;
        const lx = x + dx * off, ly = y + dy * off;
        const visible = facing < 0.12 && v.z < 1;

        m.label.style.transform = `translate(-50%,-50%) translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px)`;
        m.label.style.opacity = visible ? "" : "0";
        m.label.style.pointerEvents = visible ? "" : "none";
        m.label.classList.toggle("is-back", facing > -0.02);

        m.line.setAttribute("x1", x.toFixed(1));
        m.line.setAttribute("y1", y.toFixed(1));
        m.line.setAttribute("x2", lx.toFixed(1));
        m.line.setAttribute("y2", ly.toFixed(1));
        m.tipDot.setAttribute("cx", x.toFixed(1));
        m.tipDot.setAttribute("cy", y.toFixed(1));
        const lo = visible ? "" : "0";
        m.line.style.opacity = lo;
        m.tipDot.style.opacity = lo;
      }
    }

    /* render loop — runs continuously while on-screen for a gentle living
       drift; eases to a spotlight target when a zone is focused; otherwise
       sways around rest. Stops entirely once scrolled away. ---------------- */
    let rafId = 0, running = false, needsFrame = true, t0 = 0;
    let dragging = false, inView = false, pulseUntil = 0, shadowOn = 0;
    let focus = null;
    const REST_EPS = 0.0025;

    function requestFrame() { needsFrame = true; ensureLoop(); }
    function armPulse(ms) { pulseUntil = Math.max(pulseUntil, performance.now() + ms); ensureLoop(); }
    function ensureLoop() { if (!running) { running = true; rafId = requestAnimationFrame(tick); } }
    function stopLoop() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0; }

    function goalPose(now) {
      if (focus) return focus.target;
      if (!RM && inView && !dragging) {
        const t = (now - t0) / 1000;
        return { yaw: REST.yaw + Math.sin(t * 0.35) * 0.22, pitch: REST.pitch + Math.sin(t * 0.27) * 0.05 };
      }
      return REST;
    }

    function tick(now) {
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      let animating = needsFrame; needsFrame = false;

      if (dragging) {
        animating = true;                       // yaw/pitch set in onMove
      } else {
        const goal = goalPose(now);
        const k = focus ? 0.12 : 0.06;
        yaw += (goal.yaw - yaw) * k;
        pitch += (goal.pitch - pitch) * k;
        if (!RM && inView && !focus) animating = true;            // living sway
        else if (Math.abs(goal.yaw - yaw) > REST_EPS || Math.abs(goal.pitch - pitch) > REST_EPS) animating = true;
      }

      // contact shadow eases in once
      const shTarget = inView ? 0.24 : 0;
      shadow.material.opacity += (shTarget - shadow.material.opacity) * 0.08;
      if (Math.abs(shTarget - shadow.material.opacity) > 0.004) animating = true;

      // per-zone levels → glow / dot / ring, the lit zone pulsing softly
      const pulsing = !RM && now < pulseUntil;
      const pb = pulsing ? 0.55 + 0.45 * Math.sin(t * 2.4) : 1;
      for (const m of markers) {
        const lit = (m === focus) || (!focus && m.isHome);
        const target = (m === focus) ? 1.0 : m.hover ? 0.66 : m.isHome ? 0.5 : 0.14;
        m.level += (target - m.level) * 0.15;
        const lvl = m.level;
        const beat = lit ? pb : 1;
        m.glow.material.opacity = lvl * 0.82 * beat;
        m.glow.scale.setScalar(2.0 + lvl * 2.6 + (lit ? (pb - 1) * 0.4 : 0));
        m.dot.material.emissiveIntensity = (0.15 + lvl * 1.0) * beat;
        m.dot.scale.setScalar(0.85 + lvl * 0.7);
        m.ring.material.opacity = Math.min(0.9, Math.max(0, (lvl - 0.45) * 2.2)) * beat;
        if (Math.abs(target - lvl) > 0.002) animating = true;
      }
      if (pulsing) animating = true;

      pivot.rotation.y = yaw;
      pivot.rotation.x = pitch;
      pivot.updateMatrixWorld(true);
      renderer.render(scene, camera);
      updateLabels();

      if (running && animating) rafId = requestAnimationFrame(tick);
      else running = false;
    }

    /* focus / spotlight --------------------------------------------------- */
    function syncLabelStates() {
      markers.forEach((m) => {
        const isF = (m === focus);
        m.label.classList.toggle("is-focused", isF);
        m.label.classList.toggle("is-active", isF || (!focus && m.isHome));
      });
    }
    function setFocus(zoneId) {
      const m = markers.find((mm) => mm.z.id === zoneId) || null;
      focus = m;
      syncLabelStates();
      armPulse(2400);
      if (RM && m) { yaw = m.target.yaw; pitch = m.target.pitch; }
      requestFrame();
    }
    function clearFocus() { focus = null; syncLabelStates(); requestFrame(); }
    function toggleFocus(zoneId) {
      if (focus && focus.z.id === zoneId) clearFocus();
      else setFocus(zoneId);
    }
    syncLabelStates();

    // label interactions (hover preview + click to spotlight)
    markers.forEach((m) => {
      m.mainBtn.addEventListener("click", (e) => { e.preventDefault(); toggleFocus(m.z.id); });
      m.mainBtn.addEventListener("pointerenter", () => { m.hover = true; requestFrame(); });
      m.mainBtn.addEventListener("pointerleave", () => { m.hover = false; requestFrame(); });
      m.mainBtn.addEventListener("focus", () => { m.hover = true; requestFrame(); });
      m.mainBtn.addEventListener("blur", () => { m.hover = false; requestFrame(); });
    });

    /* pointer drag (and click-on-dot to spotlight) ----------------------- */
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    function pickZone(clientX, clientY) {
      const rect = stage.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects(markers.map((m) => m.dot), false);
      return hits.length ? hits[0].object.userData.zoneId : null;
    }

    let px = 0, py = 0, pid = null, downX = 0, downY = 0, downT = 0, moved = 0;
    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      moved += Math.abs(dx) + Math.abs(dy);
      if (focus && moved > 6) clearFocus();      // free-dragging drops the spotlight
      yaw += dx * 0.008;
      pitch += dy * 0.006;
      pitch = Math.max(-0.9, Math.min(0.55, pitch));
      px = e.clientX; py = e.clientY;
      requestFrame();
    }
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("is-grabbing");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      if (pid != null) { try { stage.releasePointerCapture(pid); } catch (_) {} pid = null; }
      // a quick, still press is a click → spotlight the dot under the cursor
      if (e && moved < 6 && performance.now() - downT < 400) {
        const hit = pickZone(e.clientX, e.clientY);
        if (hit) toggleFocus(hit);
      }
      requestFrame();
    }
    function onDown(e) {
      dragging = true; pid = e.pointerId;
      px = downX = e.clientX; py = downY = e.clientY;
      downT = performance.now(); moved = 0;
      stage.setPointerCapture?.(pid);
      stage.classList.add("is-grabbing");
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
      ensureLoop();
    }
    stage.addEventListener("pointerdown", onDown);

    /* keyboard rotation (arrows) + reset (Home) -------------------------- */
    function onKey(e) {
      const step = 0.16; let used = true;
      switch (e.key) {
        case "ArrowLeft":  clearFocus(); yaw -= step; break;
        case "ArrowRight": clearFocus(); yaw += step; break;
        case "ArrowUp":    clearFocus(); pitch = Math.max(-0.9, pitch - step); break;
        case "ArrowDown":  clearFocus(); pitch = Math.min(0.55, pitch + step); break;
        case "Home":       clearFocus(); yaw = REST.yaw; pitch = REST.pitch; break;
        default: used = false;
      }
      if (used) { e.preventDefault(); requestFrame(); }
    }
    stage.addEventListener("keydown", onKey);

    /* in-view gate — run while on screen, fully stop when off ------------- */
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (en.isIntersecting) { inView = true; resize(); ensureLoop(); }
        else { inView = false; if (!dragging) stopLoop(); }
      });
    }, { threshold: 0.02 });
    io.observe(stage);

    resize();   // one static frame immediately; io starts the living drift

    return {
      pulse() { armPulse(2200); },
      focus(id) { setFocus(id); },
      destroy() {
        stopLoop(); ro.disconnect(); io.disconnect();
        stage.removeEventListener("pointerdown", onDown);
        stage.removeEventListener("keydown", onKey);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", endDrag);
        window.removeEventListener("pointercancel", endDrag);
        markers.forEach((m) => { m.label.remove(); m.line.remove(); m.tipDot.remove(); });
        leaderSVG.remove();
        // dispose GPU resources unique to this instance (shared geo + shared
        // canvas textures are module-cached and kept for other instances).
        scene.environment = null;
        envTex.dispose();
        scene.traverse((o) => {
          if (o.isMesh || o.isSprite) {
            if (o.geometry && o.geometry !== geo) o.geometry.dispose();
            const mm = o.material; if (mm) (Array.isArray(mm) ? mm : [mm]).forEach((x) => x.dispose());
          }
        });
        renderer.dispose();
        renderer.domElement.remove();
      },
    };
  }

  /* =============================================================== ATLAS API */
  const palettes = new Map();     // host -> live palate instance
  const registered = new Set();   // host -> awaiting lazy creation

  function doMount(host, taste) {
    if (palettes.has(host)) return;
    try {
      const p = createPalate(host, taste);
      if (p) { palettes.set(host, p); host.classList.add("is-3d"); }
    } catch (err) {
      console.warn("[TongueAtlas] mount failed", err);
      host.classList.add("is-fallback");
    }
  }

  // Create the renderer only when the entry nears the viewport, and DESTROY it
  // again when it scrolls well away — so live WebGL contexts stay bounded to a
  // couple (current + neighbours) instead of all five at once.
  function lazyMount(host, taste) {
    if (registered.has(host)) return;
    registered.add(host);
    const target = host.querySelector(".tongue-stage") || host;
    const io = new IntersectionObserver((ents) => {
      const near = ents.some((e) => e.isIntersecting);
      if (near) {
        if (!palettes.has(host)) doMount(host, taste);
      } else if (palettes.has(host)) {
        palettes.get(host).destroy();
        palettes.delete(host);
        host.classList.remove("is-3d");
      }
    }, { rootMargin: "100% 0px 100% 0px", threshold: 0 });
    io.observe(target);
  }

  // WebGL capability check (release the probe context so it doesn't count)
  function webglOK() {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2") || c.getContext("webgl");
      if (!gl) return false;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return true;
    } catch (_) { return false; }
  }

  const API = {
    ready: false,
    supported: !!THREE && webglOK(),
    mount(host, taste) {
      if (!this.supported) { host.classList.add("is-fallback"); return; }
      lazyMount(host, taste);
    },
    pulse(host) { palettes.get(host)?.pulse(); },
    focus(host, id) { palettes.get(host)?.focus(id); },
  };
  window.TongueAtlas = API;

  // drain anything app.js queued before we loaded
  function drain() {
    const q = window.__tongueQueue;
    if (q && q.length) { q.forEach(([h, t]) => API.mount(h, t)); q.length = 0; }
    API.ready = true;
    window.dispatchEvent(new CustomEvent("tongueatlas:ready"));
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", drain, { once: true });
  } else {
    drain();
  }
})();
