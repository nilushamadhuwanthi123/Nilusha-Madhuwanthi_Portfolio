// ================= Nilusha Madhuwanthi — Portfolio =================

/* ---------- Responsive Design Lab safety guard ----------
   The lab below embeds this SAME page in an <iframe> (?embed=1) so visitors
   see the real, live site resized rather than a screenshot. Without this
   guard that embedded copy would embed itself again, and again — infinite
   iframes. When loaded with ?embed=1 we simply remove the lab section
   before its own script runs, so recursion stops at exactly one level. */
(function stopEmbedRecursion() {
  try {
    if (new URLSearchParams(location.search).get('embed') === '1') {
      const lab = document.getElementById('responsive-lab');
      if (lab) lab.remove();
    }
  } catch (e) {}
})();

/* ---------- 3D skills universe (Three.js) ---------- */
(function initUniverse() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const isMobile = window.innerWidth < 760;
  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 200);
  // desktop: pan the camera so the Earth/orbit scene renders shifted into the
  // right half of the viewport, out from under the hero text column. This has
  // to be done via BOTH the position (camBaseX) and the lookAt target
  // (lookTargetX) below in animate() — lookAt alone re-centers the object
  // regardless of position, and position alone gets erased every frame by the
  // mouse-parallax ease. Mobile keeps it centered (text stacks above it there).
  const camBaseX = isMobile ? 0 : -3.6;
  const lookTargetX = isMobile ? 0 : -3.4;
  /* ---- cinematic entrance: start this SAME camera further out in deep
     space and let the existing per-frame easing further down in animate()
     glide it into its normal resting position. No second camera, no second
     Earth — just a different starting point, on EVERY visit under full
     motion (mirrors niluverseIntro()'s own reduced-motion check so the two
     stay in sync without sharing state). Plays every time by design — the
     "seen once, never again" gate was removed on request so anyone opening
     the link sees the full entrance, not just first-time visitors. ---- */
  let introFlight = false;
  try {
    const motionPrefEarly = localStorage.getItem('motionPreference') || 'full';
    const reducedEarly = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    introFlight = !reducedEarly && motionPrefEarly === 'full';
  } catch (e) {}
  if (introFlight) {
    camera.position.set(camBaseX * 0.3, 5.5, (isMobile ? 15 : 11.5) + (isMobile ? 24 : 32));
  } else {
    camera.position.set(camBaseX, 2.2, isMobile ? 15 : 11.5);
  }

  const gold = 0xc9a85c;
  const goldBright = 0xe0c477;
  const olive = 0x899466;
  const silver = 0xc4c7c2;

  // ---- starfield: a deep volume of drifting points ----
  const STAR_COUNT = isMobile ? 1400 : 2800;
  const starPos = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    const r = 30 + Math.random() * 60;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.09, transparent: true, opacity: 0.7,
    sizeAttenuation: true,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // second, closer, warmer star layer for parallax depth
  const NEAR_COUNT = isMobile ? 300 : 600;
  const nearPos = new Float32Array(NEAR_COUNT * 3);
  for (let i = 0; i < NEAR_COUNT; i++) {
    const r = 12 + Math.random() * 15;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    nearPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    nearPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    nearPos[i * 3 + 2] = r * Math.cos(phi);
  }
  const nearGeo = new THREE.BufferGeometry();
  nearGeo.setAttribute('position', new THREE.BufferAttribute(nearPos, 3));
  const nearMat = new THREE.PointsMaterial({
    color: goldBright, size: 0.05, transparent: true, opacity: 0.45,
  });
  const nearStars = new THREE.Points(nearGeo, nearMat);
  scene.add(nearStars);

  // ================= EARTH: the portfolio's signature visual =================
  // A stylized, on-brand globe (olive continents, gold city-lights, no external
  // image fetches) rather than a generic blue-marble template.
  const EARTH_RADIUS = 1.5;

  function buildEarthTextures() {
    const w = isMobile ? 512 : 1024;
    const h = w / 2;
    // rough continent footprints (normalized 0..1) — enough to read as a globe
    const CONTINENTS = [
      { cx: 0.48, cy: 0.42, r: 0.09 }, { cx: 0.52, cy: 0.5, r: 0.07 }, { cx: 0.47, cy: 0.58, r: 0.06 },
      { cx: 0.58, cy: 0.26, r: 0.12 }, { cx: 0.7, cy: 0.28, r: 0.14 }, { cx: 0.82, cy: 0.3, r: 0.09 },
      { cx: 0.18, cy: 0.26, r: 0.1 }, { cx: 0.15, cy: 0.4, r: 0.07 },
      { cx: 0.22, cy: 0.58, r: 0.06 }, { cx: 0.2, cy: 0.68, r: 0.05 },
      { cx: 0.83, cy: 0.66, r: 0.055 },
      { cx: 0.63, cy: 0.16, r: 0.045 }, // Sri Lanka region, faint
    ];

    // --- day map: ocean + continents ---
    const dayCvs = document.createElement('canvas'); dayCvs.width = w; dayCvs.height = h;
    const dctx = dayCvs.getContext('2d');
    const ocean = dctx.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, '#12140f'); ocean.addColorStop(0.5, '#191c16'); ocean.addColorStop(1, '#12140f');
    dctx.fillStyle = ocean; dctx.fillRect(0, 0, w, h);
    CONTINENTS.forEach((c) => {
      [-1, 0, 1].forEach((dx) => {
        const grad = dctx.createRadialGradient((c.cx + dx) * w, c.cy * h, 0, (c.cx + dx) * w, c.cy * h, c.r * w);
        grad.addColorStop(0, '#6f7f47'); grad.addColorStop(0.55, '#4f5835'); grad.addColorStop(1, 'rgba(79,88,53,0)');
        dctx.fillStyle = grad;
        dctx.beginPath(); dctx.arc((c.cx + dx) * w, c.cy * h, c.r * w, 0, Math.PI * 2); dctx.fill();
      });
    });

    // --- night map: emissive gold city-lights, black everywhere else ---
    const nightCvs = document.createElement('canvas'); nightCvs.width = w; nightCvs.height = h;
    const nctx = nightCvs.getContext('2d');
    nctx.fillStyle = '#000'; nctx.fillRect(0, 0, w, h);
    CONTINENTS.forEach((c) => {
      const dots = isMobile ? 10 : 22;
      for (let i = 0; i < dots; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.random() * c.r * w * 0.75;
        const x = c.cx * w + Math.cos(ang) * rad;
        const y = c.cy * h + Math.sin(ang) * rad * 0.6;
        nctx.fillStyle = `rgba(224,196,119,${0.35 + Math.random() * 0.55})`;
        nctx.beginPath(); nctx.arc(x, y, 0.9, 0, Math.PI * 2); nctx.fill();
      }
    });

    // --- bump map: soft terrain noise ---
    const bumpCvs = document.createElement('canvas'); bumpCvs.width = w; bumpCvs.height = h;
    const bctx = bumpCvs.getContext('2d');
    bctx.fillStyle = '#808080'; bctx.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h * 0.02; i++) {
      const x = Math.random() * w, y = Math.random() * h, v = 90 + Math.random() * 76;
      bctx.fillStyle = `rgb(${v},${v},${v})`;
      bctx.fillRect(x, y, 2, 2);
    }

    // --- cloud map: soft alpha blobs ---
    const cloudCvs = document.createElement('canvas'); cloudCvs.width = w; cloudCvs.height = h;
    const cctx = cloudCvs.getContext('2d');
    cctx.clearRect(0, 0, w, h);
    for (let i = 0; i < (isMobile ? 22 : 42); i++) {
      const x = Math.random() * w, y = Math.random() * h * 0.85 + h * 0.075;
      const r = 18 + Math.random() * 46;
      const grad = cctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(244,241,232,0.55)');
      grad.addColorStop(1, 'rgba(244,241,232,0)');
      cctx.fillStyle = grad;
      cctx.beginPath(); cctx.arc(x, y, r, 0, Math.PI * 2); cctx.fill();
    }

    const dayTex = new THREE.CanvasTexture(dayCvs);
    const nightTex = new THREE.CanvasTexture(nightCvs);
    const bumpTex = new THREE.CanvasTexture(bumpCvs);
    const cloudTex = new THREE.CanvasTexture(cloudCvs);
    [dayTex, nightTex, bumpTex, cloudTex].forEach((t) => { t.needsUpdate = true; });
    return { dayTex, nightTex, bumpTex, cloudTex };
  }

  const { dayTex, nightTex, bumpTex, cloudTex } = buildEarthTextures();
  const earthSegments = isMobile ? 36 : 64;

  const earthGroup = new THREE.Group();
  earthGroup.rotation.x = 0.41; // axial tilt, like the real thing
  scene.add(earthGroup);

  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS, earthSegments, earthSegments),
    new THREE.MeshPhongMaterial({
      map: dayTex,
      bumpMap: bumpTex,
      bumpScale: 0.02,
      emissiveMap: nightTex,
      emissive: new THREE.Color(goldBright),
      emissiveIntensity: 0.55,
      shininess: 5,
      specular: new THREE.Color(0x30352a),
    })
  );
  earthGroup.add(earthMesh);

  const cloudMesh = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.012, earthSegments, earthSegments),
    new THREE.MeshPhongMaterial({
      map: cloudTex, alphaMap: cloudTex, color: 0xf4f1e8,
      transparent: true, opacity: 0.4, depthWrite: false,
    })
  );
  earthGroup.add(cloudMesh);

  // fresnel-rim atmosphere glow — olive/gold, not electric blue
  const atmosphereMat = new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color(0x899466) } },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      uniform vec3 glowColor;
      void main() {
        float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(glowColor, clamp(intensity, 0.0, 1.0) * 0.55);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const atmosphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.14, earthSegments, earthSegments),
    atmosphereMat
  );
  earthGroup.add(atmosphereMesh);

  // ---- lighting: a slow-moving "sun" creates the day/night terminator ----
  const ambientLight = new THREE.AmbientLight(0x30352a, 0.9);
  scene.add(ambientLight);
  const sunLight = new THREE.DirectionalLight(0xf4f1e8, 1.15);
  sunLight.position.set(6, 2, 4);
  scene.add(sunLight);

  // ---- personal markers: real cities, honestly labeled ----
  function latLonToVec3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }
  const MARKERS = [
    { name: 'Tangalle, Sri Lanka', desc: 'Where I call home.', lat: 6.0235, lon: 80.7929 },
    { name: 'SLIIT — Malabe', desc: 'BSc (Hons) Information Technology, 2025 – Present.', lat: 6.9147, lon: 79.9733 },
  ];
  const markerMeshes = [];
  MARKERS.forEach((m) => {
    const pos = latLonToVec3(m.lat, m.lon, EARTH_RADIUS * 1.01);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 10, 10),
      new THREE.MeshBasicMaterial({ color: goldBright })
    );
    dot.position.copy(pos);
    dot.userData.markerName = m.name;
    dot.userData.markerDesc = m.desc;
    earthGroup.add(dot);
    markerMeshes.push(dot);
  });

  // ---- orbit guide rings (faint circles) ----
  function makeOrbitRing(radius, tilt, color, opacity) {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
    const pts = curve.getPoints(96).map((p) => new THREE.Vector3(p.x, 0, p.y));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const ring = new THREE.LineLoop(geo, mat);
    ring.rotation.x = tilt;
    scene.add(ring);
    return ring;
  }

  // ---- billboard text sprite for a skill label ----
  function makeLabelSprite(text, color) {
    const cvs = document.createElement('canvas');
    const scale = 4;
    cvs.width = 256 * scale;
    cvs.height = 64 * scale;
    const ctx = cvs.getContext('2d');
    ctx.scale(scale, scale);
    ctx.font = '600 26px "Space Grotesk", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(cvs);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.1, 0.55, 1);
    return sprite;
  }

  // ---- skill rings: 4 orbits, each a category of real skills ----
  const SKILL_RINGS = [
    {
      key: 'frontend', label: 'Frontend',
      radius: 3.0, tilt: 0.35, speed: 0.09, color: goldBright, nodeColor: goldBright,
      skills: ['React', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3'],
    },
    {
      key: 'backend', label: 'Backend',
      radius: 4.2, tilt: -0.25, speed: -0.06, color: silver, nodeColor: silver,
      skills: ['Node.js', 'Express', 'PHP', 'REST API'],
    },
    {
      key: 'database', label: 'Database',
      radius: 5.4, tilt: 0.5, speed: 0.045, color: olive, nodeColor: olive,
      skills: ['MongoDB', 'MySQL', 'Firebase'],
    },
    {
      key: 'tools', label: 'Tools',
      radius: 6.6, tilt: -0.4, speed: 0.03, color: gold, nodeColor: gold,
      skills: ['Git', 'GitHub', 'Docker', 'Figma'],
    },
  ];

  // Real, honest info per skill — used by the hover info card. Kept short and factual.
  const SKILL_INFO = {
    'React': { category: 'frontend', desc: 'Component-based UIs with hooks and context.', projects: 'MediCare, Orvexa, Portfolio' },
    'JavaScript': { category: 'frontend', desc: 'Vanilla-first — no framework until I understand what it replaces.', projects: 'NexaBank, User-Management-system' },
    'TypeScript': { category: 'frontend', desc: 'Typed React/Node code for anything past a prototype.', projects: 'Orvexa' },
    'HTML5': { category: 'frontend', desc: 'Semantic, accessible markup as the foundation, not an afterthought.', projects: 'All web projects' },
    'CSS3': { category: 'frontend', desc: 'Hand-written layout — Grid/Flexbox, custom properties, no utility-only styling.', projects: 'Portfolio, NexaBank' },
    'Node.js': { category: 'backend', desc: 'Express APIs, auth, and background jobs.', projects: 'MediCare, Orvexa' },
    'Express': { category: 'backend', desc: 'REST APIs with middleware-based auth and validation.', projects: 'MediCare, Orvexa, WorkPulse' },
    'PHP': { category: 'backend', desc: 'Server-rendered apps with prepared statements throughout.', projects: 'NexaBank, User-Management-system' },
    'REST API': { category: 'backend', desc: 'Resource-based endpoints, proper status codes, JWT-guarded routes.', projects: 'MediCare, Orvexa' },
    'MongoDB': { category: 'database', desc: 'Document modeling for naturally nested, flexible data.', projects: 'MediCare, Orvexa' },
    'MySQL': { category: 'database', desc: 'Relational schemas with real foreign keys and row-locked transactions.', projects: 'NexaBank, User-Management-system' },
    'Firebase': { category: 'database', desc: 'Auth and realtime data for smaller apps.', projects: 'Coursework projects' },
    'Git': { category: 'tools', desc: 'Feature branches, PRs, and a clean commit history — not force-pushes to main.', projects: 'Every repo' },
    'GitHub': { category: 'tools', desc: 'Issues, PRs, Actions — the full workflow, not just a code dump.', projects: 'nilushamadhuwanthi123' },
    'Docker': { category: 'tools', desc: 'Multi-stage builds for reproducible, single-origin deployments.', projects: 'NexaBank, Orvexa, User-Management-system' },
    'Figma': { category: 'tools', desc: 'Interface design before code — spacing, hierarchy, and states.', projects: 'UI passes on every project' },
  };

  const orbitGroups = [];
  const allNodeMeshes = [];
  const orbitRings = [];
  SKILL_RINGS.forEach((ring, ringIndex) => {
    const ringMesh = makeOrbitRing(ring.radius, ring.tilt, ring.color, isMobile ? 0.08 : 0.14);
    orbitRings.push({ mesh: ringMesh, baseOpacity: isMobile ? 0.08 : 0.14 });

    const group = new THREE.Group();
    group.rotation.x = ring.tilt;
    scene.add(group);

    const nodes = ring.skills.map((name, i) => {
      const angle = (i / ring.skills.length) * Math.PI * 2;
      const nodeGroup = new THREE.Group();

      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 14, 14),
        new THREE.MeshBasicMaterial({ color: ring.nodeColor, transparent: true })
      );
      const nodeGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 10, 10),
        new THREE.MeshBasicMaterial({ color: ring.nodeColor, transparent: true, opacity: 0.18 })
      );
      const label = makeLabelSprite(name, `#${new THREE.Color(ring.nodeColor).getHexString()}`);
      label.position.y = 0.42;

      nodeGroup.add(node, nodeGlow, label);
      nodeGroup.position.set(Math.cos(angle) * ring.radius, 0, Math.sin(angle) * ring.radius);
      nodeGroup.userData.angle = angle;
      nodeGroup.userData.name = name;
      nodeGroup.userData.category = ring.key;
      nodeGroup.userData.baseOpacity = 1;
      group.add(nodeGroup);
      node.userData.parentGroup = nodeGroup;
      allNodeMeshes.push(node);
      return nodeGroup;
    });

    orbitGroups.push({ group, nodes, radius: ring.radius, speed: ring.speed, key: ring.key, revealDelay: ringIndex * 280 });
  });

  /* ---- staged reveal: on the same first-visit flight (see introFlight
     above), orbital rings and tech nodes start invisible and fade in one
     ring at a time as the camera arrives, instead of all being present at
     once. Returning visits / reduced motion are untouched — materials keep
     their normal default opacity and this block never runs for them. ---- */
  const introFlightStart = introFlight ? performance.now() : 0;
  if (introFlight) {
    orbitRings.forEach((r) => { r.mesh.material.opacity = 0; });
    orbitGroups.forEach((og) => {
      og.nodes.forEach((n) => {
        n.children[0].material.opacity = 0;
        n.children[1].material.opacity = 0;
        n.children[2].material.opacity = 0;
      });
    });
  }

  // ---- hover raycast: pause + highlight a skill node, surface an info card ----
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2(2, 2); // start off-screen
  let hoveredGroup = null;
  const infoCard = document.getElementById('orbit-info');
  const infoName = document.getElementById('orbit-info-name');
  const infoDesc = document.getElementById('orbit-info-desc');
  const infoProjects = document.getElementById('orbit-info-projects');
  const infoExplore = document.getElementById('orbit-info-explore');
  if (infoExplore) {
    infoExplore.addEventListener('click', () => {
      if (infoCard) infoCard.classList.remove('show', 'pinned');
    });
  }

  canvas.addEventListener('mousemove', (e) => {
    ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    if (infoCard) {
      infoCard.style.left = `${e.clientX + 18}px`;
      infoCard.style.top = `${e.clientY + 18}px`;
    }
  });
  canvas.addEventListener('mouseleave', () => { ndc.set(2, 2); });

  // ---- drag to rotate the Earth (mouse + touch) ----
  let dragging = false, dragStartX = 0, dragStartY = 0, dragMoved = 0, lastDragX = 0;
  let manualSpin = 0; // extra rotation applied by the user, decays back into auto-rotation
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; dragMoved = 0;
    dragStartX = lastDragX = e.clientX; dragStartY = e.clientY;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastDragX;
    dragMoved += Math.abs(e.clientX - dragStartX) + Math.abs(e.clientY - dragStartY);
    earthGroup.rotation.y += dx * 0.006;
    manualSpin = dx * 0.006;
    lastDragX = e.clientX;
  });
  window.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    // treat a near-stationary press as a click (marker / easter-egg), not a drag
    if (dragMoved < 6) handleEarthClick(e);
  });

  // ---- click: markers show info, clicking Earth 3x is a small easter egg ----
  let earthClickCount = 0, earthClickTimer = null;
  const toast = document.createElement('div');
  toast.className = 'earth-toast';
  document.body.appendChild(toast);
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2600);
  }
  function handleEarthClick(e) {
    const clickNdc = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(clickNdc, camera);

    const nodeHit = raycaster.intersectObjects(allNodeMeshes, false);
    if (nodeHit.length) {
      const group = nodeHit[0].object.userData.parentGroup;
      const data = SKILL_INFO[group.userData.name];
      if (infoName) infoName.textContent = group.userData.name;
      if (infoDesc) infoDesc.textContent = data ? data.desc : '';
      if (infoProjects) infoProjects.textContent = data ? `Used in: ${data.projects}` : '';
      if (infoExplore) infoExplore.hidden = !data;
      if (infoCard) {
        infoCard.style.left = `${e.clientX + 18}px`;
        infoCard.style.top = `${e.clientY + 18}px`;
        infoCard.hidden = false;
        infoCard.classList.add('show', 'pinned');
      }
      return;
    }

    const markerHit = raycaster.intersectObjects(markerMeshes, false);
    if (markerHit.length) {
      const d = markerHit[0].object.userData;
      if (infoName) infoName.textContent = d.markerName;
      if (infoDesc) infoDesc.textContent = d.markerDesc;
      if (infoProjects) infoProjects.textContent = '';
      if (infoExplore) infoExplore.hidden = true;
      if (infoCard) {
        infoCard.style.left = `${e.clientX + 18}px`;
        infoCard.style.top = `${e.clientY + 18}px`;
        infoCard.hidden = false;
        infoCard.classList.add('show', 'pinned');
      }
      return;
    }
    if (infoCard && infoCard.classList.contains('pinned')) {
      infoCard.classList.remove('show', 'pinned');
    }
    const earthHit = raycaster.intersectObject(earthMesh, false);
    if (earthHit.length) {
      earthClickCount += 1;
      clearTimeout(earthClickTimer);
      earthClickTimer = setTimeout(() => { earthClickCount = 0; }, 4000);
      if (earthClickCount >= 3) {
        earthClickCount = 0;
        showToast(Math.random() > 0.5 ? 'Built with curiosity.' : 'Keep exploring.');
      }
    }
  }

  // ---- skill mode switcher: dim nodes outside the active mode ----
  const MODE_CATEGORIES = {
    frontend: ['frontend'],
    fullstack: ['frontend', 'backend', 'database'],
    uiux: ['frontend', 'tools'],
  };
  let activeMode = null;
  window.__setSkillMode = function (mode) {
    activeMode = mode === activeMode ? null : mode;
    const allowed = activeMode ? MODE_CATEGORIES[activeMode] : null;
    orbitGroups.forEach(({ nodes, key }) => {
      const dim = allowed && !allowed.includes(key);
      nodes.forEach((n) => { n.userData.baseOpacity = dim ? 0.22 : 1; });
    });
    return activeMode;
  };

  // ---- occasional shooting star ----
  const shootingStars = [];
  function spawnShootingStar() {
    if (shootingStars.length > 2) return;
    const start = new THREE.Vector3(
      (Math.random() - 0.5) * 40,
      10 + Math.random() * 8,
      -10 - Math.random() * 15
    );
    const dir = new THREE.Vector3(-1, -0.4, 0.2).normalize();
    const geo = new THREE.BufferGeometry().setFromPoints([start, start.clone()]);
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    shootingStars.push({ line, pos: start, dir, life: 0 });
  }
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(spawnShootingStar, 3800);
  }

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ---- scroll: the Earth eases back slightly as the visitor leaves the hero ----
  const heroEl = document.querySelector('.hero');
  const skillsEl = document.getElementById('skills');
  const workEl = document.getElementById('work');
  let scrollProgress = 0;
  // The skills-orbit is a real feature (labelled skill "planets"), not just hero
  // decoration - it should stay visible through About + Skills, then fade out
  // before the Work section starts so it never bleeds into the project cards.
  let canvasOpacity = 1;
  function updateScrollProgress() {
    const heroHeight = heroEl ? heroEl.offsetHeight : window.innerHeight;
    scrollProgress = Math.min(1, Math.max(0, window.scrollY / (heroHeight * 0.9)));

    const y = window.scrollY;
    const heroFade = heroHeight * 0.9;
    const skillsEnd = skillsEl ? skillsEl.offsetTop + skillsEl.offsetHeight : heroFade * 3;
    const workStart = workEl ? workEl.offsetTop : skillsEnd + 800;
    if (y <= heroFade) {
      canvasOpacity = 1 - scrollProgress * 0.3;
    } else if (y <= skillsEnd) {
      canvasOpacity = 0.7;
    } else if (y < workStart) {
      const fade = (y - skillsEnd) / Math.max(1, workStart - skillsEnd);
      canvasOpacity = Math.max(0, 0.7 * (1 - fade));
    } else {
      canvasOpacity = 0;
    }
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let motionScale = reducedMotion ? 0 : 1;
  const storedMotionPref = (() => { try { return localStorage.getItem('motionPreference'); } catch (e) { return null; } })();
  if (storedMotionPref === 'reduced' || storedMotionPref === 'off') motionScale = 0;
  else if (storedMotionPref === 'full') motionScale = 1;
  window.__setMotionScale = (v) => { motionScale = v; };

  let t = 0;
  function animate() {
    t += 0.008 * motionScale;

    // Earth: slow auto-rotation (paused while the user is actively dragging)
    if (!dragging) {
      earthGroup.rotation.y += 0.0011 * motionScale;
    }
    manualSpin *= 0.9; // let a drag flick decay smoothly
    cloudMesh.rotation.y += 0.00045 * motionScale;

    // sun sweeps slowly around the Earth — the moving day/night terminator
    const sunAngle = t * 0.06;
    sunLight.position.set(Math.cos(sunAngle) * 6, 2, Math.sin(sunAngle) * 6);

    // raycast for hover (skipped while reduced motion is on — still fine, purely visual)
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(allNodeMeshes, false);
    const newHovered = hits.length ? hits[0].object.userData.parentGroup : null;
    if (newHovered !== hoveredGroup) {
      hoveredGroup = newHovered;
      canvas.style.cursor = hoveredGroup ? 'pointer' : '';
      if (hoveredGroup && infoCard) {
        const data = SKILL_INFO[hoveredGroup.userData.name];
        if (infoName) infoName.textContent = hoveredGroup.userData.name;
        if (infoDesc) infoDesc.textContent = data ? data.desc : '';
        if (infoProjects) infoProjects.textContent = data ? `Used in: ${data.projects}` : '';
        if (infoExplore) infoExplore.hidden = true;
        infoCard.hidden = false;
        infoCard.classList.remove('pinned');
        infoCard.classList.add('show');
      } else if (infoCard && !infoCard.classList.contains('pinned')) {
        infoCard.classList.remove('show');
      }
    }

    orbitGroups.forEach(({ group, nodes, speed, revealDelay }, ringIdx) => {
      const groupHovered = hoveredGroup && nodes.includes(hoveredGroup);
      group.rotation.y += groupHovered ? 0 : speed * 0.01 * motionScale;
      const canReveal = !introFlight || (performance.now() - introFlightStart) > (700 + revealDelay);
      if (introFlight) {
        const ringInfo = orbitRings[ringIdx];
        const ringTarget = canReveal ? ringInfo.baseOpacity : 0;
        ringInfo.mesh.material.opacity += (ringTarget - ringInfo.mesh.material.opacity) * 0.06;
      }
      nodes.forEach((n) => {
        const isHovered = n === hoveredGroup;
        const targetScale = isHovered ? 1.6 : 1;
        n.scale.x += (targetScale - n.scale.x) * 0.2;
        n.scale.y += (targetScale - n.scale.y) * 0.2;
        n.scale.z += (targetScale - n.scale.z) * 0.2;
        if (introFlight && !canReveal) return; // still hidden, waiting for this ring's turn
        const targetOpacity = isHovered ? 1 : n.userData.baseOpacity;
        n.children[0].material.opacity = THREE.MathUtils
          ? THREE.MathUtils.lerp(n.children[0].material.opacity ?? 1, targetOpacity, 0.15)
          : targetOpacity;
        n.children[0].material.transparent = true;
        n.children[1].material.opacity = 0.18 * targetOpacity;
        n.children[2].material.opacity = THREE.MathUtils
          ? THREE.MathUtils.lerp(n.children[2].material.opacity ?? 1, targetOpacity, 0.15)
          : targetOpacity;
      });
    });
    orbitGroups.forEach(({ nodes }) => {
      nodes.forEach((n) => {
        n.children[2].position.y = 0.42 + Math.sin(t * 2 + n.userData.angle) * 0.04 * motionScale;
      });
    });

    stars.rotation.y += 0.00012 * motionScale;
    nearStars.rotation.y -= 0.00022 * motionScale;

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      s.life += 1;
      s.pos.addScaledVector(s.dir, 0.35);
      const tail = s.pos.clone().addScaledVector(s.dir, -2.2);
      const posAttr = s.line.geometry.attributes.position;
      posAttr.setXYZ(0, s.pos.x, s.pos.y, s.pos.z);
      posAttr.setXYZ(1, tail.x, tail.y, tail.z);
      posAttr.needsUpdate = true;
      s.line.material.opacity = Math.max(0, 0.9 - s.life / 40);
      if (s.life > 40) {
        scene.remove(s.line);
        shootingStars.splice(i, 1);
      }
    }

    const parallax = reducedMotion ? 0 : 1.6;
    const parallaxY = reducedMotion ? 0 : 1.1;
    camera.position.x += (camBaseX + mouseX * parallax - camera.position.x) * 0.02;
    camera.position.y += (2.2 - mouseY * parallaxY - camera.position.y) * 0.02;
    const targetZ = (isMobile ? 15 : 11.5) + scrollProgress * (isMobile ? 4 : 5);
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    canvas.style.opacity = String(canvasOpacity);
    camera.lookAt(lookTargetX, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

/* ---------- typing role rotator ---------- */
(function typing() {
  const el = document.getElementById('role-text');
  if (!el) return;
  const roles = [
    'Full-Stack Engineer',
    'Full Stack Engineer Intern @ EgoTechWorld',
    'Web Developer Intern @ Codveda Technologies',
    'Formerly Frontend Developer Intern @ CodeAlpha',
    'Building things without eval()',
  ];
  let r = 0, c = 0, deleting = false;

  function tick() {
    const word = roles[r];
    el.textContent = deleting ? word.slice(0, c--) : word.slice(0, c++);

    let delay = deleting ? 35 : 55;
    if (!deleting && c === word.length + 1) { delay = 1500; deleting = true; }
    if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; delay = 400; }

    setTimeout(tick, delay);
  }
  tick();
})();

/* ---------- reveal on scroll (staggered, multi-direction) ---------- */
(function reveal() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const i = Array.from(e.target.parentElement.children).indexOf(e.target);
          e.target.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0, rootMargin: '0px 0px -10% 0px' }
  );
  els.forEach((el) => io.observe(el));
})();

/* ---------- custom cursor ---------- */
(function cursor() {
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
  const dot = document.createElement('div');
  dot.className = 'cx-dot';
  const ring = document.createElement('div');
  ring.className = 'cx-ring';
  document.body.append(dot, ring);

  let rx = 0, ry = 0, tx = 0, ty = 0;
  window.addEventListener('mousemove', (e) => {
    dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
    tx = e.clientX; ty = e.clientY;
  });
  (function loop() {
    rx += (tx - rx) * 0.18;
    ry += (ty - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll('a, button, .btn, .skill-card, .project-card, .approach-card').forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('grow'));
    el.addEventListener('mouseleave', () => ring.classList.remove('grow'));
  });
})();

/* ---------- magnetic buttons ---------- */
(function magnetic() {
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
  document.querySelectorAll('.btn, .nav-cta, .talk-fab').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const mx = e.clientX - r.left - r.width / 2;
      const my = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${mx * 0.18}px, ${my * 0.35}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
})();

/* ---------- counting stats ---------- */
(function countStats() {
  const stats = document.querySelectorAll('.hero-stats .stat b');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.textContent, 10);
        let n = 0;
        const step = Math.max(1, Math.round(target / 30));
        const tick = () => {
          n = Math.min(target, n + step);
          el.textContent = n;
          if (n < target) requestAnimationFrame(tick);
        };
        tick();
        io.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  stats.forEach((el) => io.observe(el));
})();

/* ---------- project card cursor glow + 3D tilt ---------- */
(function projectCardFx() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  document.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      card.style.setProperty('--mx', `${mx}px`);
      card.style.setProperty('--my', `${my}px`);
      if (reduced || coarse) return;
      const rx = ((my / rect.height) - 0.5) * -8;
      const ry = ((mx / rect.width) - 0.5) * 10;
      card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

/* ---------- developer mode switcher ---------- */
(function modeSwitcher() {
  const buttons = document.querySelectorAll('.mode-btn');
  if (!buttons.length) return;
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      const active = typeof window.__setSkillMode === 'function' ? window.__setSkillMode(mode) : null;
      buttons.forEach((b) => b.classList.toggle('active', b === btn && active));
    });
  });
})();

/* ---------- command palette (Ctrl/Cmd+K) ---------- */
(function commandPalette() {
  const overlay = document.getElementById('cmdk-overlay');
  const input = document.getElementById('cmdk-input');
  const list = document.getElementById('cmdk-list');
  if (!overlay || !input || !list) return;

  function buildCommands() {
    const cmds = [];
    document.querySelectorAll('main section[id]').forEach((sec) => {
      const heading = sec.querySelector('h2');
      cmds.push({
        label: heading ? heading.textContent.trim() : sec.id,
        hint: 'Section',
        action: () => sec.scrollIntoView({ behavior: 'smooth' }),
      });
    });
    document.querySelectorAll('.project-card').forEach((card) => {
      const h3 = card.querySelector('h3');
      const link = card.querySelector('.project-links a');
      if (!h3) return;
      const name = h3.textContent.trim();
      cmds.push({
        label: name,
        hint: 'Project — scroll to card',
        action: () => {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('cmdk-flash');
          setTimeout(() => card.classList.remove('cmdk-flash'), 900);
        },
      });
      if (link) {
        cmds.push({
          label: `Open ${name} live demo`,
          hint: 'External link',
          action: () => window.open(link.href, '_blank', 'noopener'),
        });
      }
    });
    cmds.push(
      { label: 'GitHub profile', hint: 'External link', action: () => window.open('https://github.com/nilushamadhuwanthi123', '_blank', 'noopener') },
      { label: 'LinkedIn profile', hint: 'External link', action: () => window.open('https://www.linkedin.com/in/nilushamadhuwanthi', '_blank', 'noopener') },
      { label: '60-second recruiter view', hint: 'Overlay', action: () => { const btn = document.getElementById('recruiter-toggle'); if (btn) btn.click(); } }
    );
    ['frontend', 'fullstack', 'uiux'].forEach((m) => {
      cmds.push({
        label: `Skill orbit — ${m === 'uiux' ? 'UI / UX' : m === 'fullstack' ? 'Full Stack' : 'Frontend'} mode`,
        hint: 'Developer mode',
        action: () => { const btn = document.querySelector(`.mode-btn[data-mode="${m}"]`); if (btn) btn.click(); },
      });
    });
    return cmds;
  }

  let commands = [];
  let activeIndex = 0;
  let filtered = [];

  function render(query) {
    const q = query.trim().toLowerCase();
    filtered = q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;
    list.innerHTML = '';
    filtered.slice(0, 8).forEach((c, i) => {
      const li = document.createElement('li');
      li.className = 'cmdk-item' + (i === activeIndex ? ' active' : '');
      li.innerHTML = `<span>${c.label}</span><small>${c.hint}</small>`;
      li.addEventListener('mouseenter', () => {
        activeIndex = i;
        list.querySelectorAll('.cmdk-item').forEach((el, idx) => el.classList.toggle('active', idx === i));
      });
      li.addEventListener('click', () => { c.action(); close(); });
      list.appendChild(li);
    });
    const astro = document.getElementById('cmdk-astronaut');
    if (astro) astro.classList.toggle('dm-empty', !!q && !filtered.length);
    if (!filtered.length) {
      const li = document.createElement('li');
      li.className = 'cmdk-empty';
      li.textContent = q ? 'Nothing found in this corner of the universe.' : 'No matches';
      list.appendChild(li);
    }
  }

  function open() {
    commands = buildCommands();
    activeIndex = 0;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('show'));
    input.value = '';
    render('');
    setTimeout(() => input.focus(), 30);
  }
  function close() {
    overlay.classList.remove('show');
    setTimeout(() => { overlay.hidden = true; }, 150);
  }

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      overlay.hidden ? open() : close();
    }
    if (e.key === 'Escape' && !overlay.hidden) close();
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  let typingTimer = null;
  input.addEventListener('input', () => {
    activeIndex = 0;
    render(input.value);
    const astro = document.getElementById('cmdk-astronaut');
    if (astro && input.value) {
      astro.classList.add('dm-typing');
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => astro.classList.remove('dm-typing'), 500);
    }
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, Math.min(filtered.length, 8) - 1); render(input.value); }
    if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); render(input.value); }
    if (e.key === 'Enter') { e.preventDefault(); const c = filtered[activeIndex]; if (c) { c.action(); close(); } }
  });
  document.querySelectorAll('[data-cmdk-open]').forEach((btn) => btn.addEventListener('click', open));
})();

/* ---------- recruiter 60-second mode ---------- */
(function recruiterMode() {
  const toggle = document.getElementById('recruiter-toggle');
  const overlay = document.getElementById('recruiter-overlay');
  const closeBtn = document.getElementById('recruiter-close');
  if (!toggle || !overlay) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // count-up the stat numbers each time the card opens, same easing pattern
  // as the hero stats (countStats()) — makes the "60-second view" feel alive
  // instead of a static screenshot of numbers.
  function animateStats() {
    const stats = overlay.querySelectorAll('.recruiter-stats b');
    stats.forEach((el) => {
      const raw = el.textContent.trim();
      const target = parseInt(raw, 10);
      if (Number.isNaN(target)) return;
      const suffix = raw.replace(/^[0-9]+/, '');
      if (reducedMotion) { el.textContent = target + suffix; return; }
      let n = 0;
      const step = Math.max(1, Math.round(target / 20));
      (function tick() {
        n = Math.min(target, n + step);
        el.textContent = n + suffix;
        if (n < target) requestAnimationFrame(tick);
      })();
    });
  }

  function open() {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('show'));
    animateStats();
    // move focus into the card so keyboard/screen-reader users land on the
    // close control instead of staying on the trigger button behind an
    // overlay they can no longer see past
    setTimeout(() => { if (closeBtn) closeBtn.focus(); }, 220);
  }
  function close() {
    overlay.classList.remove('show');
    setTimeout(() => { overlay.hidden = true; }, 200);
    toggle.focus();
  }
  toggle.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) close(); });

  // one-time nudge, after the entrance intro finishes, pointing first-time
  // visitors at this 60-second view so they actually discover it — same
  // "show once, dismiss forever" localStorage pattern as the AI bot greeting
  // and the auth-flow alien.
  let nudgeSeen = false;
  try { nudgeSeen = localStorage.getItem('recruiterNudgeSeen') === '1'; } catch (e) {}
  if (!nudgeSeen && !reducedMotion) {
    const dismissNudge = () => {
      toggle.classList.remove('nav-recruiter-pulse');
      try { localStorage.setItem('recruiterNudgeSeen', '1'); } catch (e) {}
    };
    const armNudge = () => {
      setTimeout(() => { if (!overlay.classList.contains('show')) toggle.classList.add('nav-recruiter-pulse'); }, 900);
      setTimeout(dismissNudge, 9000);
    };
    let introDone = false;
    try { introDone = localStorage.getItem('introCompleted') === '1'; } catch (e) {}
    if (introDone) {
      armNudge();
    } else {
      const introOverlay = document.getElementById('intro-overlay');
      if (introOverlay) {
        const mo = new MutationObserver(() => { if (introOverlay.hidden) { mo.disconnect(); armNudge(); } });
        mo.observe(introOverlay, { attributes: true, attributeFilter: ['hidden'] });
      } else {
        armNudge();
      }
    }
    toggle.addEventListener('click', dismissNudge, { once: true });
  }
})();

/* ---------- mouse-reactive nebula ---------- */
(function nebulaParallax() {
  const nebula = document.querySelector('.nebula');
  if (!nebula || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.addEventListener('mousemove', (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    nebula.style.setProperty('--nx', `${nx * 14}px`);
    nebula.style.setProperty('--ny', `${ny * 14}px`);
  });
})();

/* ---------- mobile nav toggle ---------- */
(function mobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  const closeMenu = () => {
    links.classList.remove('open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
  };
  const openMenu = () => {
    links.classList.add('open');
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    links.classList.contains('open') ? closeMenu() : openMenu();
  });

  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

  document.addEventListener('click', (e) => {
    if (links.classList.contains('open') && !links.contains(e.target) && e.target !== toggle) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 920) closeMenu();
  });
})();

/* ---------- desktop "More" nav dropdown (Education, Certificates, Code
   Sample, Frontend Lab, Design System, Auth Flow, Responsive Lab, Builds in
   Motion, Currently Building, Debugging Stories, Why Work With Me, Resume,
   Contact) — on mobile this same markup just renders inline as part of the
   normal hamburger menu (see mobileNav() above + the max-width:920px CSS),
   so no extra JS branch is needed there. ---------- */
(function navMoreMenu() {
  const trigger = document.getElementById('nav-more-trigger');
  const menu = document.getElementById('nav-more-menu');
  if (!trigger || !menu) return;

  const close = () => {
    menu.classList.remove('show');
    trigger.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    menu.classList.add('show');
    trigger.setAttribute('aria-expanded', 'true');
  };

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.contains('show') ? close() : open();
  });
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('show') && !menu.contains(e.target) && e.target !== trigger) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if (window.innerWidth <= 920) close(); });
})();

/* ---------- footer year ---------- */
(function year() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ---------- navbar: scroll state + scroll-spy active pill ---------- */
(function navScrollState() {
  const header = document.querySelector('header');
  if (!header) return;
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 24);
    if (y > 160 && y > lastY + 4) {
      header.classList.add('nav-dim');
    } else if (y < lastY - 4 || y <= 160) {
      header.classList.remove('nav-dim');
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

(function navScrollSpy() {
  const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  const map = new Map();
  links.forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    const sec = document.getElementById(id);
    if (sec) map.set(sec, a);
  });
  if (!map.size) return;

  let current = null;
  function setActive(link) {
    if (current === link) return;
    links.forEach((a) => a.classList.remove('active'));
    if (link) link.classList.add('active');
    current = link;
  }

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visible.length) setActive(map.get(visible[0].target));
  }, { rootMargin: '-35% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });

  map.forEach((_, sec) => observer.observe(sec));
})();

/* ---------- Ask Nilusha: local AI-style portfolio assistant ---------- */
/* No external API — answers are matched by keyword against real portfolio
   data only, so nothing here is ever invented. */
(function askNilusha() {
  const orb = document.getElementById('ai-orb');
  const panel = document.getElementById('ai-panel');
  const closeBtn = document.getElementById('ai-close');
  const messages = document.getElementById('ai-messages');
  const chipsWrap = document.getElementById('ai-chips');
  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');
  if (!orb || !panel || !messages || !form || !input) return;

  const LINKS = {
    github: 'https://github.com/nilushamadhuwanthi123',
    linkedin: 'https://www.linkedin.com/in/nilushamadhuwanthi',
    resume: 'assets/resume.pdf',
    email: 'mailto:nilushamadhuwanthi02@gmail.com',
  };

  // Real facts pulled from this same portfolio's own content — kept in one
  // place so answers can never drift from what's actually on the page.
  const FAQ = [
    {
      test: /react.*project|project.*react/i,
      answer: 'React is used in MediCare (Hospital Management), Orvexa (Operations & Productivity) and FinTrack (Personal Finance Tracker).',
      links: [{ label: 'View Projects', href: '#work' }],
    },
    {
      test: /mongo.*project|project.*mongo/i,
      answer: 'MongoDB is used in MediCare and Orvexa — both React + Node.js + Express apps with real CRUD and auth.',
      links: [{ label: 'View Projects', href: '#work' }],
    },
    {
      test: /frontend|\breact\b|javascript|typescript|\bhtml\b|\bcss\b|figma|tailwind|bootstrap/i,
      answer: 'Frontend: React, JavaScript, TypeScript, HTML5, CSS3, Tailwind, Bootstrap and Figma for UI design.',
      links: [{ label: 'See Skills', href: '#skills' }],
    },
    {
      test: /full.?stack|backend|node|express|mongodb|mysql|database/i,
      answer: 'Full-stack: Node.js, Express and Spring on the backend, with MySQL and MongoDB for data, plus Firebase for smaller apps.',
      links: [{ label: 'See Skills', href: '#skills' }],
    },
    {
      test: /project|built|portfolio.*work|nexora|waveora|mireva|nexabank|fintrack|medicare|orvexa|flowboard|fixfinder/i,
      answer: 'Nine live, deployed projects — NEXORA (math workspace), WAVEORA (music player), MIREVA (image gallery), NexaBank (banking platform), FinTrack, MediCare, Orvexa, FlowBoard and FixFinder. Every card links to a real working demo.',
      links: [{ label: 'Explore Projects', href: '#work' }],
    },
    {
      test: /intern|experience|egotechworld|codveda|codealpha|work(ed)?\s*at/i,
      answer: 'Two internships running at once right now: Full Stack Engineer Intern at EgoTechWorld, and Web Developer Intern at Codveda Technologies — progressing through leveled projects from static UI builds up to a full-stack, JWT-authenticated system. Also completed an earlier Frontend Developer Intern stint at CodeAlpha Technologies, shipping NEXORA, WAVEORA and MIREVA.',
      links: [{ label: 'See Experience', href: '#experience' }],
    },
    {
      test: /study|university|education|sliit|degree|british/i,
      answer: 'Currently a BSc (Hons) Information Technology student at SLIIT (Nov 2024 – Present, Malabe). Also completed a Diploma of Art Direction at British Way English Academy and a Certificate Course in English at British Council.',
      links: [{ label: 'See Education', href: '#education' }],
    },
    {
      test: /certificat|badge|credential|course/i,
      answer: 'Real, verifiable credentials: 11 Simplilearn courses, 25+ MongoDB skill badges, and a Government of Sri Lanka IT exam certificate. Every card links to its live credential page.',
      links: [{ label: 'See Certificates', href: '#certificates' }],
    },
    {
      test: /contact|reach|email|hire|talk|opportunit/i,
      answer: "Best reached by email, or through LinkedIn/GitHub below — currently open to internships and junior full-stack roles.",
      links: [
        { label: 'Email', href: LINKS.email },
        { label: 'LinkedIn', href: LINKS.linkedin, external: true },
      ],
    },
    {
      test: /github/i,
      answer: 'All source code is public on GitHub — 17+ repositories, feature-branch workflow, real commit history.',
      links: [{ label: 'Open GitHub', href: LINKS.github, external: true }],
    },
    {
      test: /linkedin/i,
      answer: "Here's the LinkedIn profile — courses, certifications and professional updates live there.",
      links: [{ label: 'Open LinkedIn', href: LINKS.linkedin, external: true }],
    },
    {
      test: /resume|cv|download/i,
      answer: 'The resume is available to view or download directly.',
      links: [{ label: 'View Resume', href: LINKS.resume, external: true }],
    },
  ];

  function findAnswer(query) {
    const hit = FAQ.find((f) => f.test.test(query));
    if (hit) return hit;
    return {
      answer: "I don't have that information in my portfolio yet — feel free to email Nilusha directly.",
      links: [{ label: 'Email', href: LINKS.email }],
    };
  }

  const QUICK_ACTIONS = [
    'What frontend technologies does Nilusha use?',
    'Which projects use React?',
    'What did Nilusha build at EgoTechWorld?',
    'What are her strongest full-stack projects?',
    'Where does she study?',
    'How can I contact her?',
  ];

  function addMessage(role, text, links) {
    const el = document.createElement('div');
    el.className = `ai-msg ${role}`;
    el.textContent = text;
    if (links && links.length) {
      links.forEach((l) => {
        const a = document.createElement('a');
        a.href = l.href;
        a.className = 'ai-link';
        a.textContent = l.label;
        if (l.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        el.appendChild(a);
      });
    }
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function respond(query) {
    addMessage('user', query);
    const thinking = document.createElement('div');
    thinking.className = 'ai-msg bot ai-thinking';
    thinking.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(thinking);
    messages.scrollTop = messages.scrollHeight;
    const delay = reducedMotion ? 0 : 420;
    setTimeout(() => {
      thinking.remove();
      const result = findAnswer(query);
      addMessage('bot', result.answer, result.links);
    }, delay);
  }

  function renderChips() {
    chipsWrap.innerHTML = '';
    QUICK_ACTIONS.forEach((label) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ai-chip';
      chip.textContent = label;
      chip.addEventListener('click', () => respond(label));
      chipsWrap.appendChild(chip);
    });
  }

  let opened = false;
  function openPanel() {
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('show'));
    orb.setAttribute('aria-expanded', 'true');
    if (!opened) {
      opened = true;
      addMessage('bot', "Hi! I'm Nilu AI. Ask me about Nilusha's skills, projects, experience or journey.");
      renderChips();
    }
    hideNudge();
    setTimeout(() => input.focus(), 200);
  }
  function closePanel() {
    panel.classList.remove('show');
    orb.setAttribute('aria-expanded', 'false');
    setTimeout(() => { panel.hidden = true; }, 200);
  }

  // ---- one-time AI assistant greeting bubble, shown once per browser (localStorage: aiGreetingSeen), never re-shown after interaction ----
  const nudge = document.getElementById('ai-nudge');
  function hideNudge() {
    if (nudge) nudge.classList.remove('show');
    try { localStorage.setItem('aiGreetingSeen', '1'); } catch (e) {}
  }
  if (nudge && !reducedMotion) {
    let seen = false;
    try { seen = localStorage.getItem('aiGreetingSeen') === '1'; } catch (e) {}
    if (!seen) {
      setTimeout(() => { if (!opened) nudge.classList.add('show'); }, 2600);
      setTimeout(() => { if (!opened) hideNudge(); }, 8000);
    }
  }
  const nudgeClose = document.getElementById('ai-nudge-close');
  if (nudgeClose) nudgeClose.addEventListener('click', (e) => { e.stopPropagation(); hideNudge(); });

  orb.addEventListener('click', () => {
    panel.classList.contains('show') ? closePanel() : openPanel();
  });
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('show') && !panel.contains(e.target) && e.target !== orb && !orb.contains(e.target)) {
      closePanel();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('show')) closePanel();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    respond(q);
  });

  /* ---- optional contextual tooltip near the AI bot on project hover.
     Kept strictly separate from the Work-section astronaut's own hover
     reaction (a different IIFE, different element, different behaviour) —
     both can fire independently and never merge or interfere. ---- */
  const spineForTip = document.getElementById('project-spine');
  if (spineForTip && !reducedMotion) {
    let tip = document.getElementById('ai-project-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'ai-project-tip';
      tip.className = 'ai-project-tip';
      tip.textContent = 'Want to know more about this project?';
      document.body.appendChild(tip);
    }
    let tipTimer = null;
    spineForTip.addEventListener('mouseover', (e) => {
      const card = e.target.closest('.project-card');
      if (!card || panel.classList.contains('show')) return;
      clearTimeout(tipTimer);
      tipTimer = setTimeout(() => tip.classList.add('show'), 550);
    });
    spineForTip.addEventListener('mouseout', (e) => {
      if (!e.target.closest('.project-card')) return;
      clearTimeout(tipTimer);
      tip.classList.remove('show');
    });
  }
})();

/* ---------- cinematic intro (temporary layer only — the default Hero
   underneath is never touched, this just covers it briefly on first visit) ---------- */
(function niluverseIntro() {
  const overlay = document.getElementById('intro-overlay');
  const skipBtn = document.getElementById('intro-skip');
  const replayBtn = document.getElementById('replay-intro-btn');
  if (!overlay) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let motionPref = 'full';
  try { motionPref = localStorage.getItem('motionPreference') || 'full'; } catch (e) {}
  const skipAnimation = reducedMotion || motionPref !== 'full';

  // Plays on EVERY visit by request — no "seen once" localStorage gate.
  // Whoever opens the link gets the full Niluverse entrance every time,
  // not just on their first-ever visit.
  let hideTimer = null;
  let removeTimer = null;
  let warpTimer = null;
  function finishIntro() {
    clearTimeout(hideTimer);
    clearTimeout(removeTimer);
    clearTimeout(warpTimer);
    overlay.classList.add('intro-out');
    setTimeout(() => { overlay.hidden = true; }, skipAnimation ? 750 : 1650);
  }
  function playIntro() {
    overlay.hidden = false;
    overlay.classList.remove('intro-out', 'intro-warp', 'intro-cinematic');
    if (skipAnimation) {
      // still a brief, respectful pause so it doesn't feel like a glitch —
      // no motion, just a short honest beat before revealing the Hero
      hideTimer = setTimeout(finishIntro, 500);
    } else {
      // cross-fades (see style.css, 1.6s) while the Hero's own camera is
      // still gliding in from deep space (see initUniverse()'s introFlight),
      // so the flight is actually visible through the dissolve instead of
      // finishing behind a solid layer.
      overlay.classList.add('intro-cinematic');
      // ~550ms before the exit fires: stars streak outward, the mark
      // flashes, and the word/tagline dim out of the way — a "warp jump"
      // beat right before the iris-collapse exit, so leaving the intro
      // actually feels like jumping into the universe, not just fading out.
      warpTimer = setTimeout(() => overlay.classList.add('intro-warp'), 950);
      hideTimer = setTimeout(finishIntro, 1500);
    }
  }

  if (skipBtn) skipBtn.addEventListener('click', finishIntro);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) finishIntro();
  });
  if (replayBtn) {
    replayBtn.addEventListener('click', () => { playIntro(); });
  }

  playIntro();
})();

/* ---------- appearance settings (theme / motion / text size / contrast) ---------- */
(function appearanceSettings() {
  const toggle = document.getElementById('appearance-toggle');
  const panel = document.getElementById('appearance-panel');
  if (!toggle || !panel) return;

  const html = document.documentElement;
  const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const load = (k, fallback) => { try { return localStorage.getItem(k) || fallback; } catch (e) { return fallback; } };

  let theme = load('themePreference', 'current');
  let motion = load('motionPreference', 'full');
  let text = load('textSizePreference', 'default');
  let contrast = load('highContrastPreference', 'off');

  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme() {
    let resolved = theme;
    if (theme === 'system') resolved = media.matches ? 'dark' : 'light';
    if (resolved === 'current') html.removeAttribute('data-theme');
    else html.setAttribute('data-theme', resolved);
  }
  function applyMotion() {
    if (motion === 'full') html.removeAttribute('data-motion');
    else html.setAttribute('data-motion', motion);
    if (window.__setMotionScale) window.__setMotionScale(motion === 'full' ? 1 : 0);
  }
  function applyText() {
    html.classList.remove('text-small', 'text-large');
    if (text === 'small') html.classList.add('text-small');
    if (text === 'large') html.classList.add('text-large');
  }
  function applyContrast() {
    html.classList.toggle('high-contrast', contrast === 'on');
  }
  function syncRadios() {
    document.querySelectorAll('[data-theme-opt]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.themeOpt === theme)));
    document.querySelectorAll('[data-motion-opt]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.motionOpt === motion)));
    document.querySelectorAll('[data-text-opt]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.textOpt === text)));
    document.querySelectorAll('[data-contrast-opt]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.contrastOpt === contrast)));
  }
  function applyAll() { applyTheme(); applyMotion(); applyText(); applyContrast(); syncRadios(); }
  applyAll();
  media.addEventListener('change', () => { if (theme === 'system') applyTheme(); });

  document.querySelectorAll('[data-theme-opt]').forEach((b) => b.addEventListener('click', () => { theme = b.dataset.themeOpt; store('themePreference', theme); applyAll(); }));
  document.querySelectorAll('[data-motion-opt]').forEach((b) => b.addEventListener('click', () => { motion = b.dataset.motionOpt; store('motionPreference', motion); applyAll(); }));
  document.querySelectorAll('[data-text-opt]').forEach((b) => b.addEventListener('click', () => { text = b.dataset.textOpt; store('textSizePreference', text); applyAll(); }));
  document.querySelectorAll('[data-contrast-opt]').forEach((b) => b.addEventListener('click', () => { contrast = b.dataset.contrastOpt; store('highContrastPreference', contrast); applyAll(); }));

  function openPanel() {
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('show'));
    toggle.setAttribute('aria-expanded', 'true');
  }
  function closePanel() {
    panel.classList.remove('show');
    toggle.setAttribute('aria-expanded', 'false');
    setTimeout(() => { panel.hidden = true; }, 180);
  }
  const navThemeToggle = document.getElementById('nav-theme-toggle');
  const triggers = [toggle, navThemeToggle].filter(Boolean);
  triggers.forEach((t) => t.addEventListener('click', () => { panel.classList.contains('show') ? closePanel() : openPanel(); }));
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('show') && !panel.contains(e.target) && !triggers.some((t) => t.contains(e.target))) closePanel();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('show')) closePanel(); });
})();

/* ---------- design mode: live design-token demo (Radius / Glow / Motion / Blur) ---------- */
(function designMode() {
  const toggle = document.getElementById('design-mode-toggle');
  const panel = document.getElementById('design-mode-panel');
  if (!toggle || !panel) return;

  const html = document.documentElement;
  const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const load = (k, fallback) => { try { const v = localStorage.getItem(k); return v === null ? fallback : v; } catch (e) { return fallback; } };

  const DEFAULTS = { radius: '1', glow: '1', motion: '1', blur: '1' };
  const sliders = Array.from(panel.querySelectorAll('.dm-slider'));

  function applyToken(token, value) {
    html.style.setProperty(`--dm-${token}`, value);
  }
  function loadAll() {
    sliders.forEach((s) => {
      const token = s.dataset.token;
      const v = load(`dm-${token}`, DEFAULTS[token]);
      s.value = v;
      applyToken(token, v);
    });
  }
  loadAll();

  sliders.forEach((s) => {
    s.addEventListener('input', () => {
      const token = s.dataset.token;
      applyToken(token, s.value);
      store(`dm-${token}`, s.value);
    });
  });

  const resetBtn = document.getElementById('dm-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      sliders.forEach((s) => {
        const token = s.dataset.token;
        s.value = DEFAULTS[token];
        applyToken(token, DEFAULTS[token]);
        store(`dm-${token}`, DEFAULTS[token]);
      });
    });
  }

  function openPanel() {
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('show'));
    toggle.setAttribute('aria-expanded', 'true');
  }
  function closePanel() {
    panel.classList.remove('show');
    toggle.setAttribute('aria-expanded', 'false');
    setTimeout(() => { panel.hidden = true; }, 180);
  }
  toggle.addEventListener('click', () => { panel.classList.contains('show') ? closePanel() : openPanel(); });
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('show') && !panel.contains(e.target) && !toggle.contains(e.target)) closePanel();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('show')) closePanel(); });
})();

/* ---------- project → skill connection: "See these skills" in a project
   modal scrolls to Skills and briefly highlights the matching cards.
   Complements the existing skill → project graph (click a skill card to see
   its projects) so the connection works in both directions without a giant
   graph diagram. ---------- */
(function projectSkillLink() {
  const ALIAS = { CSS3: 'CSS3', HTML5: 'HTML5', 'Spring Boot': 'Spring', 'REST API': null, 'Socket.IO': null, PWA: null, Canvas: null, 'A11y': null, 'Vanilla JS': 'JavaScript', 'Web Audio API': null, IndexedDB: null, Docker: 'Docker', 'Chart.js': null, Vite: null, 'OAuth 2.0': null, TypeScript: 'TypeScript', 'Kotlin/Ktor': 'Kotlin', PostgreSQL: null, JWT: null, 'Google Maps API': null };
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.fb-modal-skills-link');
    if (!btn) return;
    const techList = btn.dataset.tech.split('|');
    const skillNames = techList.map((t) => (t in ALIAS ? ALIAS[t] : t)).filter(Boolean);
    const cards = Array.from(document.querySelectorAll('.skill-card'));
    const matched = cards.filter((c) => skillNames.some((s) => c.textContent.trim() === s));
    if (!matched.length) return;

    const modal = document.getElementById('fb-modal');
    if (modal && !modal.hidden) {
      modal.classList.remove('show');
      setTimeout(() => { modal.hidden = true; }, 250);
    }
    setTimeout(() => {
      document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        matched.forEach((c) => c.classList.add('skill-card-highlight'));
        setTimeout(() => matched.forEach((c) => c.classList.remove('skill-card-highlight')), 2200);
      }, 500);
    }, 200);
  });
})();

/* ---------- responsive design lab: resize the real, live site ---------- */
(function responsiveLab() {
  const frame = document.getElementById('rlab-frame');
  const slider = document.getElementById('rlab-slider');
  const widthLabel = document.getElementById('rlab-width');
  const presetBtns = document.querySelectorAll('[data-rlab-size]');
  if (!frame || !slider) return;

  function setWidth(px) {
    frame.style.width = `${px}px`;
    slider.value = String(px);
    if (widthLabel) widthLabel.textContent = `${px}px`;
    presetBtns.forEach((b) => b.classList.toggle('active', Number(b.dataset.rlabSize) === Number(px)));
  }

  slider.addEventListener('input', () => setWidth(slider.value));
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => setWidth(btn.dataset.rlabSize));
  });
})();

/* ---------- design system: click a color swatch to copy its hex ---------- */
(function designSystemShowcase() {
  const swatches = document.querySelectorAll('.ds-swatch');
  if (!swatches.length) return;
  swatches.forEach((sw) => {
    sw.addEventListener('click', async () => {
      const hex = sw.dataset.hex;
      try {
        await navigator.clipboard.writeText(hex);
      } catch (e) {
        // clipboard API unavailable/blocked — fall back to a temporary selectable input
        const tmp = document.createElement('input');
        tmp.value = hex;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); } catch (e2) {}
        document.body.removeChild(tmp);
      }
      sw.classList.remove('ds-copied');
      void sw.offsetWidth; // restart the pop animation on repeat clicks
      sw.classList.add('ds-copied');
      setTimeout(() => sw.classList.remove('ds-copied'), 1400);
    });
  });
})();

/* ---------- certificates: knowledge tree ---------- */
/* Every credential below is real and already lived in the flat certificate
   grid — this just re-groups the same titles/links/dates into branches. */
(function knowledgeTree() {
  const branchesEl = document.getElementById('tree-branches');
  const searchEl = document.getElementById('tree-search');
  const countEl = document.getElementById('tree-count');
  const detailEl = document.getElementById('cert-detail');
  const detailBody = document.getElementById('cert-detail-body');
  const detailClose = document.getElementById('cert-detail-close');
  if (!branchesEl) return;

  const BRANCHES = [
    {
      key: 'databases', label: '🗄️ Databases',
      certs: [
        { title: '25+ MongoDB Skill Badges', meta: 'Aggregation, indexes, schema design, replication, Atlas, drivers for Java/Python/C# — MongoDB, issued 2026', href: 'https://www.linkedin.com/in/nilushamadhuwanthi/details/certifications/', linkLabel: 'View all on LinkedIn ↗' },
        { title: 'Get Started with SQL Analytics and BI on Databricks', meta: 'Simplilearn · Issued Aug 2026 · ID 10582122', href: 'https://simpli-web.app.link/e/E3yPsnaeu5b', linkLabel: 'Show credential ↗' },
      ],
    },
    {
      key: 'data-ai', label: '📊 Data & AI',
      certs: [
        { title: 'Getting Started with Machine Learning Algorithms', meta: 'Simplilearn · Issued Aug 2026 · ID 10588114', href: 'https://simpli-web.app.link/e/WMrMjS7jw5b', linkLabel: 'Show credential ↗' },
        { title: 'Statistics for Data Science', meta: 'Simplilearn · Issued Aug 2026 · ID 10582085', href: 'https://simpli-web.app.link/e/TofmzIpdu5b', linkLabel: 'Show credential ↗' },
        { title: 'Machine Learning Using Python', meta: 'Simplilearn · Issued Aug 2026 · ID 10579949', href: 'https://simpli-web.app.link/e/sZBjl4cdt5b', linkLabel: 'Show credential ↗' },
        { title: 'Get Started with Databricks for Data Engineering', meta: 'Simplilearn · Issued Aug 2026 · ID 10571869', href: 'https://simpli-web.app.link/e/xYLLwCAAq5b', linkLabel: 'Show credential ↗' },
      ],
    },
    {
      key: 'programming', label: '💻 Programming',
      certs: [
        { title: 'Programming with Python 3.X', meta: 'Simplilearn · Issued Aug 2026 · ID 10578349', href: 'https://simpli-web.app.link/e/gEqsavoOs5b', linkLabel: 'Show credential ↗' },
      ],
    },
    {
      key: 'web', label: '🌐 Web',
      certs: [
        { title: 'Python Django 101', meta: 'Simplilearn · Issued Aug 2026 · ID 10580059', href: 'https://simpli-web.app.link/e/F12uCjQgt5b', linkLabel: 'Show credential ↗' },
      ],
    },
    {
      key: 'mobile', label: '📱 Mobile',
      certs: [
        { title: 'Introduction to Flutter', meta: 'Simplilearn · Issued Aug 2026 · ID 10581422', href: 'https://simpli-web.app.link/e/SpKQWt73t5b', linkLabel: 'Show credential ↗' },
      ],
    },
    {
      key: 'security', label: '🔒 Security',
      certs: [
        { title: "Ethical Hacking 101: Beginner's Guide", meta: 'Simplilearn · Issued Aug 2026 · ID 10571497', href: 'https://simpli-web.app.link/e/dLLz3yhtq5b', linkLabel: 'Show credential ↗' },
      ],
    },
    {
      key: 'tools', label: '🛠️ Tools & Other',
      certs: [
        { title: 'Digital Marketing Strategy', meta: 'Simplilearn · Issued Aug 2026', href: 'https://simpli-web.app.link/e/ZERVr4xdu5b', linkLabel: 'Show credential ↗' },
        { title: 'Blockchain Developer Training', meta: 'Simplilearn · Issued Aug 2026 · ID 10571450', href: 'https://simpli-web.app.link/e/BZ3guU08p5b', linkLabel: 'Show credential ↗' },
        { title: 'General Information Technology Examination', meta: 'Government of Sri Lanka · Issued Jan 2023 · Distinction Pass · ID 6385842', href: 'https://www.linkedin.com/in/nilushamadhuwanthi/overlay/Certifications/1800409841/treasury/?profileId=ACoAAGDb7JQBlTKAwtKGPxY16z3kQa6SI22MmLA', linkLabel: 'Show credential ↗' },
      ],
    },
  ];

  const totalCount = BRANCHES.reduce((n, b) => n + b.certs.length, 0);
  if (countEl) countEl.textContent = `${totalCount} certificates across ${BRANCHES.length} branches`;

  BRANCHES.forEach((branch) => {
    const branchEl = document.createElement('div');
    branchEl.className = 'tree-branch';
    branchEl.dataset.branch = branch.key;

    const head = document.createElement('div');
    head.className = 'tree-branch-head';
    head.innerHTML = `${branch.label} <span class="count">(${branch.certs.length})</span>`;
    branchEl.appendChild(head);

    const leaves = document.createElement('div');
    leaves.className = 'tree-leaves';
    branch.certs.forEach((cert) => {
      const leaf = document.createElement('button');
      leaf.type = 'button';
      leaf.className = 'tree-leaf';
      leaf.dataset.search = (cert.title + ' ' + cert.meta).toLowerCase();
      leaf.innerHTML = `<b>${cert.title}</b><span>${cert.meta}</span>`;
      leaf.addEventListener('click', () => {
        if (!detailEl || !detailBody) return;
        detailBody.innerHTML = `<h4>${cert.title}</h4><p>${cert.meta}</p><a href="${cert.href}" target="_blank" rel="noopener">${cert.linkLabel}</a>`;
        detailEl.hidden = false;
      });
      leaves.appendChild(leaf);
    });
    branchEl.appendChild(leaves);
    branchesEl.appendChild(branchEl);
  });

  if (detailClose) detailClose.addEventListener('click', () => { detailEl.hidden = true; });

  if (searchEl) {
    searchEl.addEventListener('input', () => {
      const q = searchEl.value.trim().toLowerCase();
      let visible = 0;
      document.querySelectorAll('.tree-branch').forEach((branchEl) => {
        let branchVisible = 0;
        branchEl.querySelectorAll('.tree-leaf').forEach((leaf) => {
          const match = !q || leaf.dataset.search.includes(q);
          leaf.classList.toggle('tree-leaf-hidden', !match);
          if (match) { branchVisible++; visible++; }
        });
        branchEl.classList.toggle('tree-branch-empty', branchVisible === 0);
      });
      if (countEl) countEl.textContent = q ? `${visible} of ${totalCount} match "${searchEl.value.trim()}"` : `${totalCount} certificates across ${BRANCHES.length} branches`;
    });
  }
})();

/* ---------- experience: career constellation ---------- */
(function careerConstellation() {
  const wrap = document.getElementById('constellation');
  const detail = document.getElementById('const-detail');
  const body = document.getElementById('const-detail-body');
  if (!wrap || !detail || !body) return;

  const DATA = {
    egotechworld: {
      role: 'Full Stack Engineer Intern',
      company: 'EgoTechWorld',
      when: 'Ongoing — through Jan / Feb 2027',
      desc: 'Full-stack development work alongside a full-time degree — six months in and still running.',
      projects: ['Bakery Management System (in progress)'],
    },
    codveda: {
      role: 'Web Developer Intern',
      company: 'Codveda Technologies',
      when: 'August 2026 – Present',
      desc: 'Progressing through leveled development tasks — from static UI builds to a full-stack, JWT-authenticated system.',
      projects: ['FlowBoard', 'FixFinder', 'FinTrack', 'WorkPuise'],
    },
    codealpha: {
      role: 'Frontend Developer Intern',
      company: 'CodeAlpha Technologies',
      when: 'Completed',
      desc: 'A frontend-focused internship — three vanilla JS builds shipped end to end, from a scientific calculator to a full offline-capable music player and image gallery.',
      projects: ['NEXORA', 'WAVEORA', 'MIREVA'],
    },
  };

  function render(key) {
    const d = DATA[key];
    if (!d) return;
    body.innerHTML = '';
    const h3 = document.createElement('h3');
    h3.textContent = `${d.role} — ${d.company}`;
    const when = document.createElement('span');
    when.className = 'const-when';
    when.textContent = d.when;
    const p = document.createElement('p');
    p.textContent = d.desc;
    const chips = document.createElement('div');
    chips.className = 'const-projects';
    d.projects.forEach((proj) => {
      const s = document.createElement('span');
      s.textContent = proj;
      chips.appendChild(s);
    });
    body.append(h3, when, p, chips);
    detail.hidden = false;
  }

  wrap.querySelectorAll('.const-node').forEach((btn) => {
    btn.addEventListener('click', () => {
      const already = btn.getAttribute('aria-expanded') === 'true';
      wrap.querySelectorAll('.const-node').forEach((b) => b.setAttribute('aria-expanded', 'false'));
      if (already) {
        detail.hidden = true;
        return;
      }
      btn.setAttribute('aria-expanded', 'true');
      render(btn.dataset.node);
    });
  });
})();

/* ---------- work: project fishbone ---------- */
(function projectFishbone() {
  const spine = document.getElementById('project-spine');
  const filtersWrap = document.getElementById('fb-filters');
  const searchEl = document.getElementById('fb-search');
  const countEl = document.getElementById('fb-count');
  if (!spine) return;

  const PROJECTS = [
    { key:'nexora', emoji:'🧮', title:'NEXORA — Mathematics Workspace', tag:'Internship · CodeAlpha', categories:['Frontend','Internship'], status:'live',
      desc:'Graphing, step-by-step equation solving, matrices, statistics and unit conversion in one installable PWA. Every expression routed through math.js — eval() appears nowhere.',
      tech:['Vanilla JS','Canvas','math.js','PWA'], demoUrl:'https://nexora-fix.vercel.app', repoUrl:'https://github.com/nilushamadhuwanthi123/CodeAlpha_Calculator', videoUrl:'https://lnkd.in/p/gJBJ4Ntc',
      howItWorks:'Every expression you type is parsed and evaluated by math.js, then rendered step by step on an HTML5 Canvas — nothing ever runs through JavaScript’s eval().',
      problem:'Gives a way to graph, solve equations, and convert units in one offline-capable tool instead of switching between separate calculator apps.',
      whyThisWay:'math.js handles evaluation so the app never touches eval() — that let the real effort go into the Canvas step-by-step rendering, which was the harder problem to get right.' },
    { key:'waveora', emoji:'🎵', title:'WAVEORA — Offline Music Player', tag:'Internship · CodeAlpha', categories:['Frontend','Internship'], status:'live',
      desc:'A Web Audio API engine with a live visualiser, IndexedDB-backed library, queue, playlists and listening stats. Fully usable with no connection once loaded.',
      tech:['Vanilla JS','Web Audio API','IndexedDB','PWA'], demoUrl:'https://waveora-fix.vercel.app', repoUrl:'https://github.com/nilushamadhuwanthi123/CodeAlpha_MusicPlayer', videoUrl:'https://lnkd.in/p/g887PRgM',
      howItWorks:'Playback and the live visualiser run on the Web Audio API, while the track library, queue and playlists persist in the browser via IndexedDB — no server involved.',
      problem:'Lets you keep a personal music library and keep listening once a track has loaded, even with no internet connection.',
      whyThisWay:'Playback and storage are kept as separate concerns on purpose — audio never touches IndexedDB and IndexedDB never touches playback, so the library stays browsable even while nothing is playing.' },
    { key:'mireva', emoji:'🖼️', title:'MIREVA — Visual Gallery Workspace', tag:'Internship · CodeAlpha', categories:['Frontend','Internship'], status:'live',
      desc:'Masonry & grid layouts, a cinematic lightbox, colour explorer, collections and a lightweight editor — built to be fully keyboard- and screen-reader-operable.',
      tech:['Vanilla JS','Canvas','A11y','PWA'], demoUrl:'https://mireva-fix.vercel.app', repoUrl:'https://github.com/nilushamadhuwanthi123/CodeAlpha_ImageGallery', videoUrl:'https://lnkd.in/p/gX7GrHVU',
      howItWorks:'Images render in masonry or grid layout on Canvas, with the lightbox and colour explorer built to be fully operable by keyboard and screen reader, not just mouse.',
      problem:'Gives a fast, accessible way to browse and organise a photo collection without relying on a heavier, less accessible gallery app.',
      whyThisWay:'Accessibility was designed in from the layout layer instead of patched on with ARIA afterward — that\'s only possible if keyboard and screen-reader paths are considered at the same time as the masonry/grid logic itself, not after.' },
    { key:'nexabank', emoji:'🏦', title:'NexaBank — Online Banking Platform', tag:'Personal · Full Stack', categories:['Full Stack'], status:'live', featured:true,
      desc:'Real account balances, instant transfers and ACID-safe money movement — every transaction runs inside a row-locked DB transaction. Bcrypt auth, CSRF everywhere, full admin console.',
      tech:['PHP','MySQL','Docker','Chart.js'], demoUrl:'https://nexabank-web-production.up.railway.app', repoUrl:'https://github.com/nilushamadhuwanthi123/NexaBank---Online-Banking-System',
      howItWorks:'Every transfer runs inside a row-locked MySQL transaction so two simultaneous requests can\'t corrupt a balance, with bcrypt-hashed passwords and CSRF protection on every form.',
      problem:'Handles secure fund transfers and real-time balance tracking with dynamic, auto-generated financial reports.',
      whyThisWay:'Row-locked transactions weren\'t optional here — updating two account balances with separate, unlocked queries is exactly how a banking app corrupts state when two transfers land at once.' },
    { key:'fintrack', emoji:'💰', title:'FinTrack — Personal Finance Tracker', tag:'Internship · Codveda', categories:['Full Stack','Internship'], status:'live',
      desc:'Budgets, categorized transactions and spending trends in a React + Vite dashboard, built to make a full month of cash flow legible at a glance.',
      tech:['React','Vite','Chart.js'], demoUrl:'https://fintrack-fix.vercel.app', repoUrl:'https://github.com/nilushamadhuwanthi123/FinTrack-Finace-Tarcker-app_Codveda_Level-02_task3', videoUrl:'https://lnkd.in/p/gndeZres',
      howItWorks:'Transactions are categorized and charted with Chart.js inside a React + Vite dashboard, pulling from a lightweight budgeting data model.',
      problem:'Makes a full month of spending legible at a glance instead of scrolling through raw transaction lists.',
      whyThisWay:'Chart.js was picked specifically because its category-axis charts map directly onto month-by-month spending — no extra data transformation needed between the budgeting model and the chart itself.' },
    { key:'medicare', emoji:'🏥', title:'MediCare — Hospital Management', tag:'Personal · Full Stack', categories:['Full Stack'], status:'live', featured:true,
      desc:'Patients, appointments, staff and records in a full CRUD system with role-based access control, seeded with realistic demo data.',
      tech:['React','Node.js','Express','MongoDB'], demoUrl:'https://frontend-ecru-five-78.vercel.app', repoUrl:'https://github.com/nilushamadhuwanthi123/MediCare-Hospital_Management_System',
      howItWorks:'A Node.js/Express API backed by MongoDB enforces role-based access, so Admin, Doctor, Patient and Receptionist each only see what they\'re meant to.',
      problem:'Solves fragmented hospital recordkeeping by unifying appointments, billing, and inventory into one role-secured system.',
      whyThisWay:'Access control is enforced in the Express API, not just hidden in the React UI — a receptionist\'s client could still be tricked into requesting an admin route, but the server refuses it regardless of what the frontend shows.' },
    { key:'orvexa', emoji:'🧭', title:'Orvexa — Operations & Productivity Platform', tag:'Personal · Full Stack', categories:['Full Stack'], status:'live', featured:true,
      desc:'Projects, a drag-and-drop task board, real-time collaboration over Socket.IO and analytics computed from real data.',
      tech:['React','Node.js','Express','MongoDB','Socket.IO'], demoUrl:'https://orvexa-production-1b61.up.railway.app', repoUrl:'https://github.com/nilushamadhuwanthi123/orvexa-productivity-platform', videoUrl:'https://lnkd.in/p/grBdF8Ai',
      howItWorks:'Task-board state syncs across users in real time over Socket.IO, with a Node/Express + MongoDB backend computing the analytics from actual project data, not mock numbers.',
      problem:'Replaces scattered task lists and spreadsheets with one collaborative board a team can update live together.',
      whyThisWay:'Socket.IO over polling, because polling for updates means everyone sees slightly stale state — sockets let two people see the same board change the moment it happens, which is the whole point of "real-time" collaboration.' },
    { key:'flowboard', emoji:'✅', title:'FlowBoard — To-Do List App', tag:'Internship · Codveda', categories:['Frontend','Internship'], status:'live',
      desc:'A clean task manager with boards, priorities and due dates — built to make daily task triage fast rather than fussy.',
      tech:['HTML5','CSS3','JavaScript'], demoUrl:'https://flowboard-fix.vercel.app', repoUrl:'https://github.com/nilushamadhuwanthi123/FlowBoard-TO-DO-List-App_Codveda_Level-02_task2', videoUrl:'https://lnkd.in/p/gwfhK2JK',
      howItWorks:'A vanilla HTML/CSS/JS build (no framework) that stores boards, priorities and due dates client-side for fast, no-load-time task triage.',
      problem:'Gives a simple, distraction-free way to sort daily tasks by priority instead of a heavier project-management tool.',
      whyThisWay:'No framework here on purpose — a to-do list this size doesn\'t need React\'s overhead, and skipping it keeps triage feeling instant instead of waiting on a render cycle.' },
    { key:'fixfinder', emoji:'🔧', title:'FixFinder — Local Services Directory', tag:'Internship · Codveda', categories:['Frontend','Internship'], status:'live',
      desc:'A responsive multi-page site for finding trusted local service professionals, with searchable/filterable listings, professional profiles, a quote-request modal, FAQ accordion, and dark mode.',
      tech:['HTML5','CSS3','JavaScript'], demoUrl:'https://fixfinder-fix.vercel.app', repoUrl:'https://github.com/nilushamadhuwanthi123/FixFinder_Codveda_Level1', videoUrl:'https://lnkd.in/p/gcPkBbCa',
      howItWorks:'A multi-page vanilla JS site with searchable/filterable listings, a quote-request modal and an FAQ accordion, styled with a working dark mode toggle.',
      problem:'Helps someone find a trustworthy local service professional through searchable profiles instead of relying on word of mouth.',
      whyThisWay:'Multi-page over single-page-app, so each service category is a real, linkable, crawlable URL — better for a directory people actually want to bookmark or share than client-side-only state would be.' },
    { key:'smartcampus', emoji:'🏫', title:'Smart Campus Operations System', tag:'Academic · SLIIT IT3030 Group Project', categories:['Full Stack','University'], status:'source',
      desc:'A university facility-booking and incident-ticketing platform built with a 4-person SLIIT team, with Google OAuth sign-in and a REST API secured by Spring Security.',
      tech:['Spring Boot','Java','React','MySQL','OAuth 2.0'], repoUrl:'https://github.com/nilushamadhuwanthi123/Smart_Campus_Operations_PAF',
      howItWorks:'Spring Boot + Spring Security expose a REST API behind Google OAuth sign-in, with React consuming it on the frontend and MySQL storing bookings and tickets.',
      problem:'Replaces manual facility booking with a self-service system and a trackable incident ticketing workflow.',
      whyThisWay:'The team put Spring Security in front of the API itself, not just the React frontend, so booking and ticket endpoints can\'t be reached by anyone who isn\'t authenticated via Google OAuth, no matter which client calls them.' },
    { key:'linguaflow', emoji:'🌐', title:'LinguaFlow AI — Translator', tag:'Personal · Full Stack', categories:['Full Stack'], status:'source',
      desc:"A multilingual translation platform — real auth, real text and voice translation, AI-assisted rewriting and a usage dashboard, backed by PostgreSQL. Image, document and video translation are scoped but intentionally not yet built — see the repo's own roadmap.",
      tech:['Kotlin/Ktor','React','TypeScript','PostgreSQL'], repoUrl:'https://github.com/nilushamadhuwanthi123/LinguaFlow-AI-Translator_App',
      howItWorks:'A Kotlin/Ktor backend serves a React + TypeScript frontend, storing user accounts and translation history in PostgreSQL, with real auth guarding every request.',
      problem:'Aims to unify text, voice, image and video translation into one interface instead of switching between separate tools — text and voice are live today, with image/document/video scoped on the repo\'s own roadmap.' ,
      whyThisWay:'Kotlin/Ktor was a deliberate choice over defaulting to Node again — a typed, coroutine-based backend — and the roadmap deliberately ships text/voice first rather than promising image/video before they\'re actually built.' },
    { key:'workpulse', emoji:'🗂️', title:'WorkPuise — Leave & Attendance System', tag:'Internship · Codveda', categories:['Full Stack','Internship'], status:'source',
      desc:'Enterprise-style leave & attendance system with JWT auth, role-based access, and manager approval workflows.',
      tech:['React','Node.js','Express','MongoDB'], repoUrl:'https://github.com/nilushamadhuwanthi123/WorkPuise_Codveda_Level-03',
      howItWorks:'A React frontend talks to a Node.js/Express API guarded by JWT auth, with MongoDB storing leave requests and their manager-approval status.',
      problem:'Automates manual leave tracking with a structured request-approval flow between employees and managers.',
      whyThisWay:'JWT over session cookies keeps the API stateless — no server-side session store to manage, and the same token model extends cleanly to a future mobile client without a rework.' },
    { key:'uniroute', emoji:'🚌', title:'UniRoute — Shuttle Service Management', tag:'Personal · Full Stack', categories:['Full Stack'], status:'soon',
      desc:'Transportation management system for campus shuttles.', contribution:'Owned the route management module and improved UX via a responsive interface.',
      tech:['React','Node.js','MongoDB'],
      howItWorks:'A React frontend paired with a Node.js/MongoDB backend for routes; my part was the route-management module and the responsive UI around it.',
      problem:'Solves seat and route conflicts for campus shuttles through a dedicated route management module I owned.',
      whyThisWay:'I focused my ownership specifically on route management because that\'s where the real scheduling conflicts live — the UI work follows from making that module usable, not the other way around.' },
    { key:'mindfulday', emoji:'🧘', title:'MindfulDay — Wellness Tracking App', tag:'Personal · Mobile', categories:['Mobile'], status:'soon',
      desc:'Mobile app tracking daily habits, mood, water intake, exercise, and personal wellness goals.',
      tech:['Kotlin','Android Studio','Firebase'],
      howItWorks:'A native Kotlin/Android Studio app with Firebase handling the data layer for daily habit, mood and hydration logs.',
      problem:'Helps users build consistent wellness habits with daily mood, hydration, and goal-progress tracking.',
      whyThisWay:'Native Kotlin over a cross-platform framework, so wellness reminders and background logging can rely on real Android APIs instead of routing through a compatibility layer.' },
    { key:'blooddonation', emoji:'🩸', title:'Blood Donation Management System', tag:'Personal · Full Stack', categories:['Full Stack'], status:'source',
      desc:'Role-based platform with JWT auth, Google Maps donor location, real-time notifications, and donor recommendation logic.',
      tech:['Java','JWT','Google Maps API'], repoUrl:'https://github.com/nilushamadhuwanthi123/Blood-donation-Management-System',
      howItWorks:'JWT-guarded role-based access, with the Google Maps API used to locate nearby donors and rule-based logic to recommend matches by blood type and distance.',
      problem:'Speeds up emergency donor matching using location-based search and rule-based donor recommendations.',
      whyThisWay:'Google Maps plus rule-based matching, not just a static directory — because in an emergency, distance and blood-type compatibility are exactly the two variables that decide how fast a match happens.' },
  ];

  function statusBadge(p) {
    if (p.status === 'live') return '<span class="live-dot"><i></i>Live</span>';
    if (p.status === 'source') return '<span class="repo-badge">Source available</span>';
    return '<span class="repo-badge">Demo coming soon</span>';
  }

  const TECH_GROUP = {
    'Vanilla JS':'Frontend', Canvas:'Frontend', HTML5:'Frontend', CSS3:'Frontend', JavaScript:'Frontend',
    React:'Frontend', Vite:'Frontend', TypeScript:'Frontend', A11y:'Frontend',
    'Node.js':'Backend', Express:'Backend', PHP:'Backend', 'Spring Boot':'Backend', Java:'Backend', 'Kotlin/Ktor':'Backend',
    Kotlin:'Mobile', 'Android Studio':'Mobile',
    MySQL:'Database', MongoDB:'Database', PostgreSQL:'Database', Firebase:'Database', IndexedDB:'Database',
    'OAuth 2.0':'Auth', JWT:'Auth',
    'Socket.IO':'APIs & Realtime', 'Google Maps API':'APIs & Realtime', 'Web Audio API':'APIs & Realtime', 'math.js':'APIs & Realtime',
    Docker:'Tools', 'Chart.js':'Tools', PWA:'Tools',
  };
  function techDNA(tech) {
    const groups = {};
    tech.forEach((t) => {
      const g = TECH_GROUP[t] || 'Tools';
      (groups[g] = groups[g] || []).push(t);
    });
    const order = ['Frontend','Backend','Mobile','Database','Auth','APIs & Realtime','Tools'];
    return order.filter((g) => groups[g]).map((g) => `<div class="fb-dna-group"><b>${g}</b><span>${groups[g].join(' · ')}</span></div>`).join('');
  }

  function savedKeys() {
    try { return JSON.parse(localStorage.getItem('savedProjects') || '[]'); } catch (e) { return []; }
  }
  function isSaved(key) { return savedKeys().includes(key); }
  function toggleSaved(key) {
    let s = savedKeys();
    if (s.includes(key)) s = s.filter((k) => k !== key);
    else s.push(key);
    try { localStorage.setItem('savedProjects', JSON.stringify(s)); } catch (e) {}
    return s.includes(key);
  }

  function cardHTML(p, i) {
    const links = [];
    if (p.demoUrl) links.push(`<a href="${p.demoUrl}" target="_blank" rel="noopener">Live demo ↗</a>`);
    if (p.repoUrl) links.push(`<a href="${p.repoUrl}" target="_blank" rel="noopener">Repo ↗</a>`);
    if (p.videoUrl) links.push(`<a href="${p.videoUrl}" target="_blank" rel="noopener" class="video-link">▶ Watch demo</a>`);
    const side = i % 2 === 0 ? 'spine-left' : 'spine-right';
    const featured = p.featured ? ' spine-featured' : '';
    const contribution = p.contribution ? `<p class="fb-contribution"><b>My contribution:</b> ${p.contribution}</p>` : '';
    const saveIcon = isSaved(p.key) ? '★' : '☆';
    return `
      <div class="spine-item ${side}${featured} fb-rib" data-key="${p.key}" data-search="${(p.title + ' ' + p.tag + ' ' + p.tech.join(' ') + ' ' + p.categories.join(' ')).toLowerCase()}">
        <span class="spine-tag">${p.tag}</span>
        <div class="spine-node fb-node"></div>
        <div class="project-card" data-open-key="${p.key}">
          <div class="project-top"><span class="project-emoji">${p.emoji}</span><button type="button" class="fb-save" data-save-key="${p.key}" aria-pressed="${isSaved(p.key)}" aria-label="Save project" title="Save project">${saveIcon}</button><button type="button" class="fb-compare-toggle" data-compare-key="${p.key}" aria-pressed="false" aria-label="Add to comparison" title="Compare">⇄</button>${statusBadge(p)}</div>
          <h3>${p.title}</h3>
          <p>${p.desc}</p>
          ${contribution}
          <div class="stack-pills">${p.tech.map((t) => `<span data-tech="${t}">${t}</span>`).join('')}</div>
          <div class="project-links">${links.length ? links.join('') : '<span class="fb-soon-note">Demo coming soon</span>'}</div>
          <button type="button" class="fb-expand-hint">View details →</button>
        </div>
      </div>`;
  }

  function render() {
    spine.innerHTML = `
      <div class="spine-line" aria-hidden="true">
        <span class="spine-cap spine-cap-start">START</span>
        <span class="spine-cap spine-cap-end">CONTINUE BUILDING →</span>
      </div>
      ${PROJECTS.map(cardHTML).join('')}`;
  }
  render();

  // filters
  const ALL_CATS = ['All', ...Array.from(new Set(PROJECTS.flatMap((p) => p.categories))), '★ Saved'];
  if (filtersWrap) {
    filtersWrap.innerHTML = ALL_CATS.map((c, i) => `<button type="button" class="fb-filter${i === 0 ? ' active' : ''}" data-cat="${c}">${c}</button>`).join('');
  }

  let activeCat = 'All';
  function applyFilters() {
    const q = (searchEl && searchEl.value.trim().toLowerCase()) || '';
    let visible = 0;
    spine.querySelectorAll('.fb-rib').forEach((rib) => {
      const key = rib.dataset.key;
      const p = PROJECTS.find((x) => x.key === key);
      const matchesCat = activeCat === 'All' || (activeCat === '★ Saved' ? isSaved(key) : p.categories.includes(activeCat));
      const matchesSearch = !q || rib.dataset.search.includes(q);
      const show = matchesCat && matchesSearch;
      rib.classList.toggle('fb-rib-hidden', !show);
      if (show) visible++;
    });
    if (countEl) countEl.textContent = `${visible} of ${PROJECTS.length} projects`;
  }
  applyFilters();

  if (filtersWrap) {
    filtersWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.fb-filter');
      if (!btn) return;
      filtersWrap.querySelectorAll('.fb-filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeCat = btn.dataset.cat;
      applyFilters();
    });
  }
  if (searchEl) searchEl.addEventListener('input', applyFilters);

  // ---- constellation view: same real PROJECTS data, orbit layout grouped by primary category ----
  const constWrap = document.getElementById('fb-constellation');
  const viewToggle = document.querySelector('.fb-view-toggle');
  let constellationBuilt = false;

  function buildConstellation() {
    if (!constWrap || constellationBuilt) return;
    constellationBuilt = true;

    const groups = {};
    PROJECTS.forEach((p) => {
      const cat = p.categories[0] || 'Other';
      (groups[cat] = groups[cat] || []).push(p);
    });
    const catNames = Object.keys(groups);
    const isMobile = window.innerWidth <= 760;
    const ringGap = isMobile ? 15 : 13;

    let html = `<div class="cv-center">MY<br/>PROJECTS</div>`;

    // build ring radii: distribute categories across concentric rings
    const ringRadii = catNames.map((_, i) => (isMobile ? 18 : 16) + i * ringGap);
    html += ringRadii.map((r) => `<div class="cv-orbit-ring" style="width:${r * 2}%; height:${r * 2}%;"></div>`).join('');

    catNames.forEach((cat, ringIdx) => {
      const items = groups[cat];
      const radius = ringRadii[ringIdx];
      items.forEach((p, i) => {
        const angle = (i / items.length) * 2 * Math.PI + ringIdx * 0.4; // slight offset per ring so labels don't stack
        const top = 50 + radius * Math.sin(angle);
        const left = 50 + radius * Math.cos(angle);
        html += `
          <button type="button" class="cv-node${p.featured ? ' cv-featured' : ''}" data-open-key="${p.key}" style="--cv-top:${top}%; --cv-left:${left}%;" aria-label="${p.title}">
            <span class="cv-node-dot">${p.emoji}</span>
            <span class="cv-node-label">${p.title.split('—')[0].split('-')[0].trim()}<br/><span class="cv-node-cat">${cat}</span></span>
          </button>`;
      });
    });

    constWrap.innerHTML = html;
    constWrap.addEventListener('click', (e) => {
      const node = e.target.closest('.cv-node');
      if (!node) return;
      openModal(node.dataset.openKey);
    });
  }

  if (viewToggle) {
    viewToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.fb-view-btn');
      if (!btn) return;
      const view = btn.dataset.view;
      viewToggle.querySelectorAll('.fb-view-btn').forEach((b) => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      if (view === 'constellation') {
        buildConstellation();
        spine.hidden = true;
        constWrap.hidden = false;
      } else {
        constWrap.hidden = true;
        spine.hidden = false;
      }
    });
  }

  // save/bookmark toggle
  spine.addEventListener('click', (e) => {
    const saveBtn = e.target.closest('.fb-save');
    if (!saveBtn) return;
    e.stopPropagation();
    const nowSaved = toggleSaved(saveBtn.dataset.saveKey);
    saveBtn.textContent = nowSaved ? '★' : '☆';
    saveBtn.setAttribute('aria-pressed', String(nowSaved));
    if (activeCat === '★ Saved') applyFilters();
  });

  // tech pill hover -> highlight other projects sharing that tech
  spine.addEventListener('mouseover', (e) => {
    const pill = e.target.closest('.stack-pills span');
    if (!pill) return;
    const tech = pill.dataset.tech;
    spine.querySelectorAll('.fb-rib').forEach((rib) => {
      const p = PROJECTS.find((x) => x.key === rib.dataset.key);
      rib.classList.toggle('fb-tech-highlight', p.tech.includes(tech));
    });
  });
  spine.addEventListener('mouseout', (e) => {
    const pill = e.target.closest('.stack-pills span');
    if (!pill) return;
    spine.querySelectorAll('.fb-rib').forEach((rib) => rib.classList.remove('fb-tech-highlight'));
  });

  // ---- case study modal ----
  const modal = document.getElementById('fb-modal');
  const modalBody = document.getElementById('fb-modal-body');
  const modalClose = document.getElementById('fb-modal-close');
  const modalBackdrop = document.getElementById('fb-modal-backdrop');
  const prevBtn = document.getElementById('fb-prev');
  const nextBtn = document.getElementById('fb-next');
  let openKey = null;

  function visibleKeys() {
    return Array.from(spine.querySelectorAll('.fb-rib:not(.fb-rib-hidden)')).map((r) => r.dataset.key);
  }

  function openModal(key) {
    const p = PROJECTS.find((x) => x.key === key);
    if (!p || !modal || !modalBody) return;
    openKey = key;
    const links = [];
    if (p.demoUrl) links.push(`<a href="${p.demoUrl}" target="_blank" rel="noopener" class="btn btn-primary">Live Demo ↗</a>`);
    if (p.repoUrl) links.push(`<a href="${p.repoUrl}" target="_blank" rel="noopener" class="btn btn-ghost">View Code ↗</a>`);
    if (!links.length) links.push('<span class="fb-soon-note">Demo coming soon</span>');
    const contribution = p.contribution ? `<div class="fb-modal-section"><b>My Contribution</b><p>${p.contribution}</p></div>` : '';
    const howItWorks = p.howItWorks ? `<div class="fb-modal-section"><b>How It Works</b><p>${p.howItWorks}</p></div>` : '';
    const problem = p.problem ? `<div class="fb-modal-section"><b>The Real-World Problem It Solves</b><p>${p.problem}</p></div>` : '';
    const whyThisWay = p.whyThisWay ? `<div class="fb-modal-section fb-modal-why"><b>Why I Designed It This Way</b><p>${p.whyThisWay}</p></div>` : '';
    modalBody.innerHTML = `
      <div class="fb-modal-top"><span class="project-emoji">${p.emoji}</span>${statusBadge(p)}</div>
      <h3>${p.title}</h3>
      <span class="spine-tag">${p.tag}</span>
      <div class="fb-modal-section"><b>Overview</b><p>${p.desc}</p></div>
      ${contribution}
      ${howItWorks}
      ${problem}
      ${whyThisWay}
      <div class="fb-modal-section"><b>Tech Stack</b><div class="fb-dna">${techDNA(p.tech)}</div></div>
      <button type="button" class="fb-modal-skills-link" data-tech="${p.tech.join('|')}">See these skills in the Skills section ↑</button>
      <div class="fb-modal-links">${links.join('')}</div>`;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('show'));
    updateNav();
  }
  function closeModal() {
    modal.classList.remove('show');
    setTimeout(() => { modal.hidden = true; }, 250);
    openKey = null;
  }
  function updateNav() {
    const keys = visibleKeys();
    const idx = keys.indexOf(openKey);
    if (prevBtn) prevBtn.disabled = idx <= 0;
    if (nextBtn) nextBtn.disabled = idx === -1 || idx >= keys.length - 1;
  }

  spine.addEventListener('click', (e) => {
    const card = e.target.closest('.project-card');
    if (!card || e.target.closest('.fb-save') || e.target.closest('.fb-compare-toggle') || e.target.closest('.project-links a')) return;
    openModal(card.dataset.openKey);
  });
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
  });
  if (prevBtn) prevBtn.addEventListener('click', () => {
    const keys = visibleKeys();
    const idx = keys.indexOf(openKey);
    if (idx > 0) openModal(keys[idx - 1]);
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    const keys = visibleKeys();
    const idx = keys.indexOf(openKey);
    if (idx !== -1 && idx < keys.length - 1) openModal(keys[idx + 1]);
  });

  // ---- project comparison (pick 2, see them side by side) ----
  const compareBar = document.getElementById('fb-compare-bar');
  const compareStatus = document.getElementById('fb-compare-status');
  const compareGoBtn = document.getElementById('fb-compare-go');
  const compareClearBtn = document.getElementById('fb-compare-clear');
  const compareModal = document.getElementById('fb-compare-modal');
  const compareBody = document.getElementById('fb-compare-body');
  const compareClose = document.getElementById('fb-compare-close');
  const compareBackdrop = document.getElementById('fb-compare-backdrop');
  let compareKeys = [];

  function setCompareBtnState(key, on) {
    const b = spine.querySelector(`.fb-compare-toggle[data-compare-key="${key}"]`);
    if (b) { b.setAttribute('aria-pressed', String(on)); b.classList.toggle('active', on); }
  }
  function updateCompareBar() {
    if (!compareBar) return;
    compareBar.hidden = compareKeys.length === 0;
    if (compareStatus) {
      compareStatus.textContent = compareKeys.length === 1
        ? `${PROJECTS.find((p) => p.key === compareKeys[0]).title} selected — pick a 2nd project`
        : compareKeys.length === 2
        ? 'Comparing 2 projects'
        : 'Pick a 2nd project to compare';
    }
    if (compareGoBtn) compareGoBtn.disabled = compareKeys.length < 2;
  }

  spine.addEventListener('click', (e) => {
    const btn = e.target.closest('.fb-compare-toggle');
    if (!btn) return;
    e.stopPropagation();
    const key = btn.dataset.compareKey;
    const idx = compareKeys.indexOf(key);
    if (idx !== -1) {
      compareKeys.splice(idx, 1);
      setCompareBtnState(key, false);
    } else {
      if (compareKeys.length >= 2) setCompareBtnState(compareKeys.shift(), false);
      compareKeys.push(key);
      setCompareBtnState(key, true);
    }
    updateCompareBar();
  });

  if (compareClearBtn) compareClearBtn.addEventListener('click', () => {
    compareKeys.forEach((key) => setCompareBtnState(key, false));
    compareKeys = [];
    updateCompareBar();
  });

  function compareRow(label, a, b) {
    return `<div class="fb-compare-row"><span class="fb-compare-label">${label}</span><span>${a}</span><span>${b}</span></div>`;
  }
  function compareLinks(p) {
    const links = [];
    if (p.demoUrl) links.push(`<a href="${p.demoUrl}" target="_blank" rel="noopener">Live Demo ↗</a>`);
    if (p.repoUrl) links.push(`<a href="${p.repoUrl}" target="_blank" rel="noopener">Code ↗</a>`);
    return links.length ? links.join(' &middot; ') : 'Demo coming soon';
  }
  function compareStatusLabel(p) {
    if (p.status === 'live') return 'Live';
    if (p.status === 'source') return 'Source available';
    return 'Demo coming soon';
  }

  if (compareGoBtn) compareGoBtn.addEventListener('click', () => {
    if (compareKeys.length < 2 || !compareModal || !compareBody) return;
    const [a, b] = compareKeys.map((k) => PROJECTS.find((p) => p.key === k));
    compareBody.innerHTML = `
      <h3>Compare projects</h3>
      <div class="fb-compare-table">
        <div class="fb-compare-row fb-compare-head"><span></span><span>${a.emoji} ${a.title}</span><span>${b.emoji} ${b.title}</span></div>
        ${compareRow('Category', a.tag, b.tag)}
        ${compareRow('Status', compareStatusLabel(a), compareStatusLabel(b))}
        ${compareRow('Tech stack', a.tech.join(', '), b.tech.join(', '))}
        ${compareRow('Links', compareLinks(a), compareLinks(b))}
      </div>`;
    compareModal.hidden = false;
    requestAnimationFrame(() => compareModal.classList.add('show'));
  });

  function closeCompareModal() {
    if (!compareModal) return;
    compareModal.classList.remove('show');
    setTimeout(() => { compareModal.hidden = true; }, 250);
  }
  if (compareClose) compareClose.addEventListener('click', closeCompareModal);
  if (compareBackdrop) compareBackdrop.addEventListener('click', closeCompareModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && compareModal && !compareModal.hidden) closeCompareModal();
  });

  /* ---------- developer DNA: aggregated real tech usage across PROJECTS ---------- */
  const dnaBars = document.getElementById('dna-bars');
  if (dnaBars) {
    const counts = {};
    let total = 0;
    PROJECTS.forEach((p) => {
      p.tech.forEach((t) => {
        const g = TECH_GROUP[t] || 'Tools';
        counts[g] = (counts[g] || 0) + 1;
        total += 1;
      });
    });
    const order = ['Frontend', 'Backend', 'Mobile', 'Database', 'Auth', 'APIs & Realtime', 'Tools'];
    const rows = order
      .filter((g) => counts[g])
      .map((g) => ({ g, n: counts[g], pct: Math.round((counts[g] / total) * 100) }))
      .sort((a, b) => b.n - a.n);
    dnaBars.innerHTML = rows.map((r) => `
      <div class="dna-row">
        <span class="dna-label">${r.g}</span>
        <span class="dna-track"><span class="dna-fill" style="width:${r.pct}%"></span></span>
        <span class="dna-pct">${r.pct}%</span>
      </div>
    `).join('');
  }

  /* ---------- skill → project graph: click a skill card, see real projects using it ---------- */
  (function skillProjectGraph() {
    const cards = document.querySelectorAll('.skill-card');
    const modal = document.getElementById('skill-graph-modal');
    const body = document.getElementById('skill-graph-body');
    const closeBtn = document.getElementById('skill-graph-close');
    const backdrop = document.getElementById('skill-graph-backdrop');
    if (!cards.length || !modal || !body) return;

    const ALIAS = { CSS: 'CSS3', HTML: 'HTML5', Spring: 'Spring Boot' };

    function projectsForSkill(skillName) {
      const target = (ALIAS[skillName] || skillName).toLowerCase();
      return PROJECTS.filter((p) => p.tech.some((t) => {
        const tl = t.toLowerCase();
        return tl === target || tl.includes(target) || target.includes(tl.replace('/ktor', ''));
      }));
    }

    function openFor(skillName) {
      const matches = projectsForSkill(skillName);
      let html = `<h3 class="skill-graph-title">${skillName}</h3>`;
      if (!matches.length) {
        html += `<p class="skill-graph-sub">Where this shows up</p><p class="skill-graph-empty">Part of my general workflow rather than tied to one shipped project's tech stack — no project below lists it directly.</p>`;
      } else {
        html += `<p class="skill-graph-sub">Used in ${matches.length} real shipped project${matches.length > 1 ? 's' : ''}</p>`;
        html += '<div class="skill-graph-list">' + matches.map((p) => `
          <div class="skill-graph-item">
            <span><span class="skill-graph-item-title">${p.title}</span><br/><span class="skill-graph-item-tag">${p.tag}</span></span>
            ${p.repoUrl ? `<a href="${p.repoUrl}" target="_blank" rel="noopener">Repo ↗</a>` : '<span class="skill-graph-item-tag">Source not public</span>'}
          </div>
        `).join('') + '</div>';
      }
      body.innerHTML = html;
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add('show'));
    }

    function close() {
      modal.classList.remove('show');
      setTimeout(() => { modal.hidden = true; }, 200);
    }

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const label = card.querySelector('span')?.textContent.trim();
        if (label) openFor(label);
      });
    });
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
  })();

  /* ---------- auth flow: interactive step-through, "used in" grounded in real tech tags ---------- */
  (function authFlow() {
    const stepsEl = document.getElementById('auth-flow-steps');
    const playBtn = document.getElementById('auth-flow-play');
    const resetBtn = document.getElementById('auth-flow-reset');
    const usedEl = document.getElementById('auth-flow-used');
    if (!stepsEl) return;

    const usedIn = PROJECTS.filter((p) => p.tech.some((t) => t === 'JWT' || t === 'OAuth 2.0'));
    if (usedEl) {
      usedEl.textContent = usedIn.length
        ? `Tagged directly in: ${usedIn.map((p) => p.title.split('—')[0].trim()).join(', ')}.`
        : '';
    }

    const STEPS = [
      { actor: 'Client', title: 'Submits credentials', desc: 'Email + password sent to the server over HTTPS — never over a plain HTTP request.' },
      { actor: 'Server', title: 'Verifies the password', desc: 'The stored password is a bcrypt hash, never plaintext. The server hashes the incoming password and compares hashes — it never "reads" the real password back.' },
      { actor: 'Database', title: 'Looked up safely', desc: 'The user row is fetched with a parameterized / prepared-statement query, so a malicious email or password field can\'t inject SQL.' },
      { actor: 'Server', title: 'Issues a JWT', desc: 'On a match, the server signs a JSON Web Token containing the user id and role, with a short expiry — not the password, ever.' },
      { actor: 'Client', title: 'Stores the token', desc: 'The token is kept client-side (memory or a secure cookie depending on the project) and attached to future requests.' },
      { actor: 'Client', title: 'Sends token on every request', desc: 'Protected routes require the token in the Authorization header — no token, no access.' },
      { actor: 'Server', title: 'Verifies & responds', desc: 'The server checks the JWT signature and expiry before running the route handler, then returns the protected resource.' },
    ];

    stepsEl.innerHTML = STEPS.map((s) => `
      <div class="auth-flow-step">
        <span class="auth-flow-actor">${s.actor}</span>
        <span class="auth-flow-dotcol"><span class="auth-flow-dot"></span><span class="auth-flow-line"></span></span>
        <span class="auth-flow-body"><h4>${s.title}</h4><p>${s.desc}</p></span>
      </div>
    `).join('');

    const stepEls = stepsEl.querySelectorAll('.auth-flow-step');
    let timer = null;
    let idx = -1;

    function showUpTo(n) {
      stepEls.forEach((el, i) => el.classList.toggle('active', i <= n));
    }

    function play() {
      clearInterval(timer);
      idx = -1;
      showUpTo(-1);
      playBtn.textContent = '⏸ Playing…';
      timer = setInterval(() => {
        idx += 1;
        showUpTo(idx);
        if (idx >= stepEls.length - 1) {
          clearInterval(timer);
          playBtn.textContent = '▶ Play flow';
        }
      }, 850);
    }

    function reset() {
      clearInterval(timer);
      idx = -1;
      showUpTo(-1);
      playBtn.textContent = '▶ Play flow';
    }

    if (playBtn) playBtn.addEventListener('click', play);
    if (resetBtn) resetBtn.addEventListener('click', reset);
    showUpTo(stepEls.length); // all visible by default (readable without interaction)

    /* ---- playful "alien" prompt pointing at Play flow, shown once as the
       section scrolls into view — a tiny, one-off, purely decorative nudge
       scoped only to this section (not the astronaut, not the AI bot). ---- */
    const alien = document.getElementById('auth-flow-alien');
    const authFlowSection = document.getElementById('auth-flow');
    if (alien && authFlowSection && playBtn) {
      let alienSeen = false;
      try { alienSeen = localStorage.getItem('authFlowAlienSeen') === '1'; } catch (e) {}
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!alienSeen) {
        const dismiss = () => {
          alien.classList.remove('show');
          try { localStorage.setItem('authFlowAlienSeen', '1'); } catch (e) {}
        };
        const alienIO = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => alien.classList.add('show'), reduced ? 0 : 500);
              setTimeout(dismiss, 6000);
              alienIO.disconnect();
            }
          });
        }, { threshold: 0.4 });
        alienIO.observe(authFlowSection);
        playBtn.addEventListener('click', dismiss, { once: true });
      }
    }
  })();

  /* ---------- builds in motion: data-driven from PROJECTS[].videoUrl ---------- */
  const motionGrid = document.getElementById('motion-grid');
  if (motionGrid) {
    const withVideo = PROJECTS.filter((p) => p.videoUrl);
    if (!withVideo.length) {
      motionGrid.innerHTML = '<p class="motion-empty">No walkthroughs posted yet — check back soon.</p>';
    } else {
      motionGrid.innerHTML = withVideo.map((p) => `
        <a class="motion-card" href="${p.videoUrl}" target="_blank" rel="noopener">
          <span class="motion-card-icon" aria-hidden="true">▶</span>
          <span class="motion-card-body">
            <span class="motion-card-title">${p.title}</span>
            <span class="motion-card-tag">${p.tag}</span>
          </span>
          <span class="motion-card-cta">Watch ↗</span>
        </a>
      `).join('');
    }
  }
})();

/* ---------- contact: connect to niluverse ---------- */
(function contactConnect() {
  const chipsWrap = document.getElementById('purpose-chips');
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  let purpose = '';
  if (chipsWrap) {
    chipsWrap.querySelectorAll('.purpose-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const already = chip.getAttribute('aria-checked') === 'true';
        chipsWrap.querySelectorAll('.purpose-chip').forEach((c) => c.setAttribute('aria-checked', 'false'));
        if (!already) {
          chip.setAttribute('aria-checked', 'true');
          purpose = chip.dataset.purpose;
        } else {
          purpose = '';
        }
      });
    });
  }

  document.querySelectorAll('.channel-copy').forEach((btn) => {
    const original = btn.textContent;
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        // clipboard API unavailable — fall back to a temporary selectable input
        const tmp = document.createElement('input');
        tmp.value = text;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); } catch (e2) {}
        document.body.removeChild(tmp);
      }
      btn.textContent = 'Copied ✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1800);
    });
  });

  if (form && status) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const message = document.getElementById('contact-message').value.trim();

      if (!message) {
        status.textContent = "Add a short message so I know what you're reaching out about.";
        status.className = 'form-status error';
        return;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.textContent = 'That email address looks incomplete — double-check it.';
        status.className = 'form-status error';
        return;
      }

      const subject = purpose || 'Portfolio contact';
      const bodyLines = [];
      if (name) bodyLines.push(`From: ${name}`);
      if (email) bodyLines.push(`Reply to: ${email}`);
      bodyLines.push('', message);
      const mailto = `mailto:nilushamadhuwanthi02@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
      window.location.href = mailto;

      status.textContent = 'Your email app should now be open with this pre-filled — hit send there to reach me.';
      status.className = 'form-status success';
    });
  }
})();

/* ---------- education journey expand/collapse ---------- */
(function eduJourney() {
  const toggles = document.querySelectorAll('.edu-toggle');
  if (!toggles.length) return;

  toggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const detailId = btn.getAttribute('aria-controls');
      const detail = document.getElementById(detailId);
      if (!detail) return;
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      detail.classList.toggle('open', !isOpen);
    });
  });
})();

/* ---------- frontend lab: live HTML/CSS/JS sandbox ---------- */
(function frontendLab() {
  const htmlEl = document.getElementById('lab-html');
  const cssEl = document.getElementById('lab-css');
  const jsEl = document.getElementById('lab-js');
  const preview = document.getElementById('lab-preview');
  const presetsWrap = document.getElementById('lab-presets');
  const resetBtn = document.getElementById('lab-reset');
  const tabs = document.querySelectorAll('.lab-tab');
  const panes = document.querySelectorAll('.lab-code');
  if (!htmlEl || !cssEl || !jsEl || !preview) return;

  const PRESETS = [
    {
      key: 'counter', label: 'Vanilla JS Counter',
      html: '<button id="btn">Clicked 0 times</button>',
      css: 'body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#10120f;}\n#btn{padding:14px 24px;border-radius:999px;border:1px solid #C9A85C;background:transparent;color:#F4F1E8;font-size:1rem;cursor:pointer;}\n#btn:hover{background:#C9A85C;color:#10120f;}',
      js: 'let n = 0;\nconst btn = document.getElementById("btn");\nbtn.addEventListener("click", () => {\n  n++;\n  btn.textContent = `Clicked ${n} times`;\n});',
    },
    {
      key: 'flipcard', label: 'CSS-only Flip Card',
      html: '<div class="card"><div class="card-inner"><div class="face front">Hover me</div><div class="face back">Flipped!</div></div></div>',
      css: 'body{display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#10120f;perspective:800px;}\n.card{width:160px;height:100px;}\n.card-inner{position:relative;width:100%;height:100%;transition:transform .5s;transform-style:preserve-3d;}\n.card:hover .card-inner{transform:rotateY(180deg);}\n.face{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:12px;backface-visibility:hidden;font-family:sans-serif;color:#10120f;}\n.front{background:#C9A85C;}\n.back{background:#899466;transform:rotateY(180deg);}',
      js: '',
    },
    {
      key: 'filter', label: 'Debounced Search Filter',
      html: '<input id="q" placeholder="Search fruit..." />\n<ul id="list">\n  <li>Apple</li><li>Banana</li><li>Mango</li><li>Papaya</li><li>Cherry</li>\n</ul>',
      css: 'body{font-family:sans-serif;background:#10120f;color:#F4F1E8;padding:24px;}\ninput{padding:8px 12px;border-radius:8px;border:1px solid #30352A;background:#191C16;color:#F4F1E8;width:100%;box-sizing:border-box;}\nul{list-style:none;padding:0;margin-top:12px;}\nli{padding:6px 0;border-bottom:1px solid #30352A;}',
      js: 'const q = document.getElementById("q");\nconst items = [...document.querySelectorAll("#list li")];\nlet t;\nq.addEventListener("input", () => {\n  clearTimeout(t);\n  t = setTimeout(() => {\n    const v = q.value.toLowerCase();\n    items.forEach((li) => {\n      li.style.display = li.textContent.toLowerCase().includes(v) ? "" : "none";\n    });\n  }, 150);\n});',
    },
  ];

  function renderPresetButtons() {
    presetsWrap.innerHTML = PRESETS.map((p, i) => `<button type="button" class="lab-preset-btn${i === 0 ? ' active' : ''}" data-preset="${p.key}">${p.label}</button>`).join('');
  }

  function runPreview() {
    const doc = '<!doctype html><html><head><style>' + cssEl.value + '</style></head><body>' + htmlEl.value
      + '<script>try{' + jsEl.value + '}catch(e){document.body.insertAdjacentHTML("beforeend","<pre style=\\"color:#e08\\">"+e.message+"</pre>");}<\/script></body></html>';
    preview.srcdoc = doc;
  }

  function loadPreset(key) {
    const p = PRESETS.find((x) => x.key === key) || PRESETS[0];
    htmlEl.value = p.html;
    cssEl.value = p.css;
    jsEl.value = p.js;
    presetsWrap.querySelectorAll('.lab-preset-btn').forEach((b) => b.classList.toggle('active', b.dataset.preset === p.key));
    runPreview();
  }

  let debounceT;
  [htmlEl, cssEl, jsEl].forEach((el) => {
    el.addEventListener('input', () => {
      clearTimeout(debounceT);
      debounceT = setTimeout(runPreview, 350);
    });
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      panes.forEach((p) => p.classList.toggle('active', p.dataset.labPane === tab.dataset.labTab));
    });
  });

  presetsWrap.addEventListener('click', (e) => {
    const btn = e.target.closest('.lab-preset-btn');
    if (btn) loadPreset(btn.dataset.preset);
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const activeBtn = presetsWrap.querySelector('.lab-preset-btn.active');
      loadPreset(activeBtn ? activeBtn.dataset.preset : PRESETS[0].key);
    });
  }

  renderPresetButtons();
  loadPreset(PRESETS[0].key);
})();

/* ---------- connectivity indicator ---------- */
(function connectivityIndicator() {
  const toast = document.getElementById('connectivity-toast');
  if (!toast) return;
  let hideTimer;
  function show(message, cls) {
    clearTimeout(hideTimer);
    toast.textContent = message;
    toast.classList.remove('online', 'offline');
    toast.classList.add(cls);
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add('show'));
    hideTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => { toast.hidden = true; }, 320);
    }, 3200);
  }
  window.addEventListener('offline', () => show('⚠ You are offline — some things may not load', 'offline'));
  window.addEventListener('online', () => show('✓ Back online', 'online'));
})();


/* ---------- work section: 3D astronaut explorer ----------
   A SEPARATE, LOCAL visual system for the Work/Projects section only.
   Does not touch, reuse, or modify the Hero's Earth/Universe scene
   (that scene lives entirely in the very first IIFE of this file, using
   its own #bg-canvas, its own THREE.Scene/camera/renderer, and its own
   `motionScale` variable — none of that is referenced here). This astronaut
   has its own canvas, its own scene, its own renderer, its own motion
   tracking, and is only ever mounted inside the #work section's stacking
   context (every <section> is z-index:2 — see the global `section{}` rule —
   while this canvas is a fixed z-index:1 layer, so project cards always
   paint on top of it and it can never cover project content). */
(function workAstronautExplorer() {
  const canvas = document.getElementById('work-astronaut-canvas');
  const workSection = document.getElementById('work');
  const spine = document.getElementById('project-spine');
  const modal = document.getElementById('fb-modal');
  const viewToggle = document.querySelector('.fb-view-toggle');
  if (!canvas || !workSection || !spine || typeof THREE === 'undefined') return;

  const isMobile = () => window.innerWidth <= 760;
  const isTablet = () => window.innerWidth > 760 && window.innerWidth <= 1024;
  /* responsive scale tiers — the astronaut is meant to read as the main
     explorer character, not a tiny decorative icon, while staying
     secondary to project content (never resized/moved cards to make room) */
  function baseScale() {
    if (isMobile()) return 1.25;   // smaller but clearly visible, no continuous flight
    if (isTablet()) return 1.55;   // tablet: simplified but present
    return 1.9;                    // desktop: full exploration, main character
  }
  function motionAllowed() {
    let pref = 'full';
    try { pref = localStorage.getItem('motionPreference') || 'full'; } catch (e) {}
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return pref !== 'reduced' && pref !== 'off';
  }

  /* ---- renderer / scene / orthographic camera mapped 1:1 to viewport pixels ---- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 2));
  const scene = new THREE.Scene();
  let W = window.innerWidth, H = window.innerHeight;
  const camera = new THREE.OrthographicCamera(0, W, 0, -H, -1000, 1000);
  camera.position.z = 100;
  renderer.setSize(W, H);

  scene.add(new THREE.AmbientLight(0x899466, 0.9));
  const keyLight = new THREE.PointLight(0xe0c477, 1.1, 900);
  keyLight.position.set(200, -150, 220);
  scene.add(keyLight);
  /* olive-green rim light for depth/contrast at the larger scale — no neon, just a soft edge glow */
  const rimLight = new THREE.PointLight(0x8fae5a, 1.4, 700);
  rimLight.position.set(-160, 60, -80);
  scene.add(rimLight);

  /* ---- build a small low-poly astronaut from primitives (no external assets) ---- */
  const astro = new THREE.Group();
  const bodyMat = new THREE.MeshPhongMaterial({ color: 0xf4f1e8, shininess: 30, specular: 0x30352a });
  const trimMat = new THREE.MeshPhongMaterial({ color: 0x687344, shininess: 20 });
  const visorMat = new THREE.MeshPhongMaterial({ color: 0x10120f, shininess: 90, specular: 0xe0c477, emissive: 0x1a1f14 });
  const goldMat = new THREE.MeshPhongMaterial({ color: 0xc9a85c, emissive: 0x4a3d1e, shininess: 60 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(11, 14, 12), bodyMat);
  body.scale.set(1, 1.25, 0.9);
  astro.add(body);

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(9, 13, 5), trimMat);
  backpack.position.set(0, 0, -9);
  astro.add(backpack);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 14), bodyMat);
  helmet.position.set(0, 15, 1);
  astro.add(helmet);

  const visor = new THREE.Mesh(new THREE.SphereGeometry(5.4, 14, 12, 0, Math.PI * 1.15), visorMat);
  visor.rotation.y = Math.PI * 0.5;
  visor.position.set(0, 15, 5.4);
  astro.add(visor);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(8, 2, 8, 16), trimMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 8.5, 0);
  astro.add(collar);

  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.4, 15, 8), bodyMat);
    arm.position.set(side * 11, -1, 0);
    arm.rotation.z = side * 0.32;
    astro.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), trimMat);
    hand.position.set(side * 15.5, -8, 0);
    astro.add(hand);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(3, 2.8, 13, 8), bodyMat);
    leg.position.set(side * 4.5, -17, 0);
    astro.add(leg);
    const badge = new THREE.Mesh(new THREE.CircleGeometry(1.4, 10), goldMat);
    badge.position.set(side * 4, 3, 9.6);
    astro.add(badge);
  });

  const chestLight = new THREE.Mesh(new THREE.CircleGeometry(1.8, 10), goldMat);
  chestLight.position.set(0, 2, 10);
  astro.add(chestLight);

  /* soft ambient shadow + atmospheric glow behind/below the astronaut — pure
     visual polish for the larger scale, GPU-cheap (two flat circles, additive/alpha blend) */
  const shadowBlob = new THREE.Mesh(
    new THREE.CircleGeometry(16, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false })
  );
  shadowBlob.position.set(0, -24, -6);
  astro.add(shadowBlob);
  const auraGlow = new THREE.Mesh(
    new THREE.CircleGeometry(30, 24),
    new THREE.MeshBasicMaterial({ color: 0x8fae5a, transparent: true, opacity: 0.1, depthWrite: false })
  );
  auraGlow.position.set(0, 2, -14);
  astro.add(auraGlow);

  astro.scale.setScalar(baseScale());
  scene.add(astro);

  /* ---- tiny local particle haze around the astronaut (LOCAL only, not a second galaxy) ---- */
  const dustCount = isMobile() ? 10 : 22;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 90;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 90;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xe0c477, size: 1.6, transparent: true, opacity: 0.35, depthWrite: false }));
  astro.add(dust);

  /* ---- thin, elegant flight trail: a fixed-length ring buffer of past world
     positions, rendered as fading olive-green points behind the astronaut.
     GPU-cheap (one small Points object, positions written in place each frame,
     no allocations in the render loop). Skipped entirely on mobile/reduced-motion. */
  const TRAIL_LEN = isMobile() ? 0 : 16;
  let trail = null, trailPositions = null, trailOpacities = null, trailHistory = [];
  if (TRAIL_LEN > 0) {
    trailPositions = new Float32Array(TRAIL_LEN * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trail = new THREE.Points(trailGeo, new THREE.PointsMaterial({ color: 0xa8c47e, size: 2.2, transparent: true, opacity: 0.28, depthWrite: false }));
    scene.add(trail);
  }

  /* ---- deterministic patrol path: real project-card centers, in fishbone (document) order ---- */
  let waypoints = [];
  let wpIndex = 0;
  const current = { x: W * 0.5, y: -H * 0.4, z: 0 };
  const target = { x: W * 0.5, y: -H * 0.4, z: 0 };
  let arrivalHold = false;
  let arrivalPulseT = 0;
  let hoverTarget = null;

  function cardCenterScreen(card) {
    const r = card.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function toWorld(pt) { return { x: pt.x, y: -pt.y, z: 8 }; }

  function recomputeWaypoints() {
    const cards = Array.from(spine.querySelectorAll('.project-card'))
      .filter((c) => !c.closest('.fb-rib-hidden'))
      .filter((c) => {
        const r = c.getBoundingClientRect();
        return r.bottom > -200 && r.top < window.innerHeight + 200;
      });
    waypoints = cards.map((c) => toWorld(cardCenterScreen(c)));
    if (wpIndex >= waypoints.length) wpIndex = 0;
  }

  /* ---- hover: astronaut turns toward + drifts near the hovered card ---- */
  spine.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.project-card');
    if (!card) return;
    hoverTarget = toWorld(cardCenterScreen(card));
  });
  spine.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.project-card');
    if (!card) return;
    hoverTarget = null;
  });

  /* ---- click: astronaut flies to the selected project and arrives ----
     Arrival sequence: approach (existing lerp) → slow (eased lerpSpeed in
     animate()) → hover/bob (existing sin bob) → glow pulse (arrivalPulseT)
     → card highlight (below) → the existing modal opens normally. */
  let highlightedCard = null;
  spine.addEventListener('click', (e) => {
    const card = e.target.closest('.project-card');
    if (!card || e.target.closest('.fb-save') || e.target.closest('.fb-compare-toggle') || e.target.closest('.project-links a')) return;
    const pos = toWorld(cardCenterScreen(card));
    target.x = pos.x; target.y = pos.y - 26; target.z = pos.z + 4;
    arrivalHold = true;
    arrivalPulseT = 0;
    if (highlightedCard) highlightedCard.classList.remove('fb-astro-arrived');
    highlightedCard = card;
    card.classList.add('fb-astro-arrived');
  });
  /* ---- modal close (observed, not modified): astronaut resumes its patrol ---- */
  if (modal) {
    new MutationObserver(() => {
      if (modal.hidden) {
        arrivalHold = false;
        if (highlightedCard) { highlightedCard.classList.remove('fb-astro-arrived'); highlightedCard = null; }
      }
    }).observe(modal, { attributes: true, attributeFilter: ['hidden'] });
  }

  /* ---- only visible during the Fishbone view — this is a fishbone-local system,
     kept separate from the Constellation view's own orbit visuals ---- */
  let fishboneView = true;
  if (viewToggle) {
    viewToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.fb-view-btn');
      if (!btn) return;
      fishboneView = btn.dataset.view === 'fishbone';
      canvas.classList.toggle('show', sectionVisible && fishboneView);
    });
  }

  /* ---- pause entirely when the Work section is off-screen or the tab is hidden ---- */
  let sectionVisible = false;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      sectionVisible = entry.isIntersecting;
      canvas.classList.toggle('show', sectionVisible && fishboneView);
      if (sectionVisible) recomputeWaypoints();
    });
  }, { threshold: 0.05 });
  io.observe(workSection);

  let scrollTimer = null;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(recomputeWaypoints, 220);
  }, { passive: true });
  window.addEventListener('resize', () => {
    W = window.innerWidth; H = window.innerHeight;
    camera.right = W; camera.bottom = -H; camera.updateProjectionMatrix();
    renderer.setSize(W, H);
    astro.scale.setScalar(baseScale());
    recomputeWaypoints();
  });
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  let running = true;
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (!running || !sectionVisible || !fishboneView) return;
    t += 0.016;
    const reduced = !motionAllowed();
    const mobile = isMobile();

    if (arrivalHold) {
      // held beside the selected project card — gentle bob only
    } else if (reduced) {
      // reduced/no-motion: static near the first known project, no continuous travel
      if (waypoints.length) { target.x = waypoints[0].x; target.y = waypoints[0].y - 26; target.z = waypoints[0].z; }
    } else if (mobile) {
      // mobile: no continuous patrol flight — stay near a calm anchor point in view
      target.x = W * 0.82; target.y = -window.scrollY - 140; target.z = 6;
    } else if (hoverTarget) {
      target.x = hoverTarget.x; target.y = hoverTarget.y - 30; target.z = hoverTarget.z + 4;
    } else if (waypoints.length) {
      const wp = waypoints[wpIndex];
      target.x = wp.x + 34; target.y = wp.y - 20; target.z = wp.z;
      const dx = target.x - current.x, dy = target.y - current.y;
      if (Math.sqrt(dx * dx + dy * dy) < 12) {
        if (!animate._holdT || t - animate._holdT > 2.1) {
          wpIndex = (wpIndex + 1) % waypoints.length;
          animate._holdT = t;
        }
      }
    }

    /* natural easing with a slow-approach: speed tapers off as the astronaut
       nears its target instead of a constant robotic lerp rate */
    const dxTotal = target.x - current.x, dyTotal = target.y - current.y;
    const distToTarget = Math.sqrt(dxTotal * dxTotal + dyTotal * dyTotal);
    const approachEase = Math.min(1, distToTarget / 140);
    const baseLerp = reduced ? 0.5 : (arrivalHold ? 0.1 : 0.03 + 0.045 * approachEase);
    const prevX = current.x, prevY = current.y;
    current.x += (target.x - current.x) * baseLerp;
    current.y += (target.y - current.y) * baseLerp;
    current.z += (target.z - current.z) * baseLerp;

    astro.position.set(current.x, current.y + Math.sin(t * 1.4) * 4, current.z);
    /* tilt in the direction of travel: bank on velocity instead of a fixed wobble */
    const vx = current.x - prevX, vy = current.y - prevY;
    const speed = Math.sqrt(vx * vx + vy * vy);
    const travelTilt = Math.max(-0.35, Math.min(0.35, -vx * 0.05));
    const travelPitch = Math.max(-0.22, Math.min(0.22, vy * 0.04));
    astro.rotation.z = Math.sin(t * 0.6) * 0.06 + travelTilt;
    astro.rotation.x = Math.cos(t * 0.5) * 0.04 + travelPitch;
    astro.rotation.y = Math.max(-0.4, Math.min(0.4, -vx * 0.06));
    dust.rotation.y += 0.003;

    /* thin flight trail: push the current world position into a ring buffer,
       skip while basically stationary so it doesn't clutter the arrival hover */
    if (trail && speed > 0.6) {
      trailHistory.unshift({ x: current.x, y: current.y + Math.sin(t * 1.4) * 4, z: current.z - 2 });
      if (trailHistory.length > TRAIL_LEN) trailHistory.length = TRAIL_LEN;
      for (let i = 0; i < TRAIL_LEN; i++) {
        const p = trailHistory[i];
        if (p) { trailPositions[i * 3] = p.x; trailPositions[i * 3 + 1] = p.y; trailPositions[i * 3 + 2] = p.z; }
        else { trailPositions[i * 3] = current.x; trailPositions[i * 3 + 1] = -99999; trailPositions[i * 3 + 2] = current.z; }
      }
      trail.geometry.attributes.position.needsUpdate = true;
      trail.material.opacity = 0.28 * Math.min(1, trailHistory.length / TRAIL_LEN);
    } else if (trail) {
      trail.material.opacity *= 0.9;
    }

    /* subtle depth/parallax: slightly larger when its target z reads "nearer" */
    const depthScale = 1 + Math.max(-0.08, Math.min(0.08, current.z * 0.006));

    if (arrivalHold) {
      arrivalPulseT += 0.016;
      const pulse = arrivalPulseT < 0.6 ? 1 + Math.sin(arrivalPulseT * 10) * 0.12 * Math.max(0, 1 - arrivalPulseT / 0.6) : 1;
      astro.scale.setScalar(baseScale() * depthScale * pulse);
      chestLight.material.opacity = 1;
      auraGlow.material.opacity = 0.18;
    } else {
      astro.scale.setScalar(baseScale() * depthScale);
      auraGlow.material.opacity = 0.1;
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
})();
