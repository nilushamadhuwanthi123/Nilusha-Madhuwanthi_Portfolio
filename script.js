// ================= Nilusha Madhuwanthi — Portfolio =================

/* ---------- 3D animated background (Three.js) ---------- */
(function initScene() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 9;

  const gold = new THREE.Color(0xc9a85c);
  const olive = new THREE.Color(0x687344);
  const silver = new THREE.Color(0x8f948c);

  // Wireframe polyhedra field
  const shapes = [];
  const geometries = [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.OctahedronGeometry(0.9, 0),
    new THREE.TetrahedronGeometry(1, 0),
  ];

  for (let i = 0; i < 14; i++) {
    const geo = geometries[i % geometries.length];
    const color = i % 3 === 0 ? gold : i % 3 === 1 ? olive : silver;
    const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.35 });
    const mesh = new THREE.Mesh(geo, mat);
    const spread = 9;
    mesh.position.set(
      (Math.random() - 0.5) * spread * 2,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * 6 - 2
    );
    const scale = 0.4 + Math.random() * 1.1;
    mesh.scale.setScalar(scale);
    mesh.userData.rotSpeed = {
      x: (Math.random() - 0.5) * 0.004,
      y: (Math.random() - 0.5) * 0.004,
    };
    mesh.userData.floatSpeed = 0.2 + Math.random() * 0.4;
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;
    scene.add(mesh);
    shapes.push(mesh);
  }

  // Particle dust
  const particleCount = 220;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({ color: gold, size: 0.035, transparent: true, opacity: 0.5 });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let t = 0;
  function animate() {
    t += 0.01;
    shapes.forEach((m) => {
      m.rotation.x += m.userData.rotSpeed.x;
      m.rotation.y += m.userData.rotSpeed.y;
      m.position.y += Math.sin(t * m.userData.floatSpeed + m.userData.floatOffset) * 0.0025;
    });
    points.rotation.y += 0.0004;

    camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 0.8 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

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
    'Software Engineering Undergraduate @ SLIIT',
    'Frontend Development Intern @ CodeAlpha',
    'Software Engineering Intern @ EgoTechWorld',
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

/* ---------- reveal on scroll ---------- */
(function reveal() {
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  els.forEach((el) => io.observe(el));
})();

/* ---------- project card cursor glow ---------- */
document.querySelectorAll('.project-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  });
});

/* ---------- mobile nav toggle ---------- */
(function mobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => links.classList.toggle('open'));
})();

/* ---------- footer year ---------- */
(function year() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();
