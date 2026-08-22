// ================= Nilusha Madhuwanthi — Portfolio =================

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
  camera.position.set(camBaseX, 2.2, isMobile ? 15 : 11.5);

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
  SKILL_RINGS.forEach((ring) => {
    makeOrbitRing(ring.radius, ring.tilt, ring.color, isMobile ? 0.08 : 0.14);

    const group = new THREE.Group();
    group.rotation.x = ring.tilt;
    scene.add(group);

    const nodes = ring.skills.map((name, i) => {
      const angle = (i / ring.skills.length) * Math.PI * 2;
      const nodeGroup = new THREE.Group();

      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 14, 14),
        new THREE.MeshBasicMaterial({ color: ring.nodeColor })
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

    orbitGroups.push({ group, nodes, radius: ring.radius, speed: ring.speed, key: ring.key });
  });

  // ---- hover raycast: pause + highlight a skill node, surface an info card ----
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2(2, 2); // start off-screen
  let hoveredGroup = null;
  const infoCard = document.getElementById('orbit-info');
  const infoName = document.getElementById('orbit-info-name');
  const infoDesc = document.getElementById('orbit-info-desc');
  const infoProjects = document.getElementById('orbit-info-projects');

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
    const markerHit = raycaster.intersectObjects(markerMeshes, false);
    if (markerHit.length) {
      const d = markerHit[0].object.userData;
      if (infoName) infoName.textContent = d.markerName;
      if (infoDesc) infoDesc.textContent = d.markerDesc;
      if (infoProjects) infoProjects.textContent = '';
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
  let scrollProgress = 0;
  function updateScrollProgress() {
    const heroHeight = heroEl ? heroEl.offsetHeight : window.innerHeight;
    scrollProgress = Math.min(1, Math.max(0, window.scrollY / (heroHeight * 0.9)));
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionScale = reducedMotion ? 0 : 1;

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
        infoCard.hidden = false;
        infoCard.classList.remove('pinned');
        infoCard.classList.add('show');
      } else if (infoCard && !infoCard.classList.contains('pinned')) {
        infoCard.classList.remove('show');
      }
    }

    orbitGroups.forEach(({ group, nodes, speed }) => {
      const groupHovered = hoveredGroup && nodes.includes(hoveredGroup);
      group.rotation.y += groupHovered ? 0 : speed * 0.01 * motionScale;
      nodes.forEach((n) => {
        const isHovered = n === hoveredGroup;
        const targetScale = isHovered ? 1.6 : 1;
        n.scale.x += (targetScale - n.scale.x) * 0.2;
        n.scale.y += (targetScale - n.scale.y) * 0.2;
        n.scale.z += (targetScale - n.scale.z) * 0.2;
        const targetOpacity = isHovered ? 1 : n.userData.baseOpacity;
        n.children[0].material.opacity = THREE.MathUtils
          ? THREE.MathUtils.lerp(n.children[0].material.opacity ?? 1, targetOpacity, 0.15)
          : targetOpacity;
        n.children[0].material.transparent = true;
        n.children[1].material.opacity = 0.18 * targetOpacity;
        n.children[2].material.opacity = targetOpacity;
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
    canvas.style.opacity = String(1 - scrollProgress * 0.35);
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
    'Frontend Developer Intern @ CodeAlpha Technologies',
    'Web Developer Intern @ Codveda Technologies',
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
    { threshold: 0.15 }
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
  document.querySelectorAll('.btn, .nav-cta').forEach((btn) => {
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
      li.addEventListener('mouseenter', () => { activeIndex = i; render(input.value); });
      li.addEventListener('click', () => { c.action(); close(); });
      list.appendChild(li);
    });
    if (!filtered.length) {
      const li = document.createElement('li');
      li.className = 'cmdk-empty';
      li.textContent = 'No matches';
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
  input.addEventListener('input', () => { activeIndex = 0; render(input.value); });
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
  function open() { overlay.hidden = false; requestAnimationFrame(() => overlay.classList.add('show')); }
  function close() { overlay.classList.remove('show'); setTimeout(() => { overlay.hidden = true; }, 200); }
  toggle.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) close(); });
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
    if (window.innerWidth > 860) closeMenu();
  });
})();

/* ---------- footer year ---------- */
(function year() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();
