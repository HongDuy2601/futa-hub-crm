/* ============================================================
 * FUTA LAND - VIRTUAL VIEWER
 * 4 chế độ ảo hoá:
 *   1. Mặt bằng 2D (SVG)
 *   2. Tour 360° (Pannellum)
 *   3. Walk-through 3D (Three.js, first-person)
 *   4. Mặt bằng 3D extruded (Three.js, top-down)
 *   5. AI sinh ảnh nội thất (HuggingFace - online only)
 * ============================================================ */

let currentVirtualMode = 'plan2d';
let pannellumViewer = null;
let three3D = null;  // { renderer, scene, camera, animationId, cleanup }

// ============================================================
// HTML cho tabs
// ============================================================
function renderVirtualTabs(unit, project) {
  const isApartment = project.type === 'apartment';

  return `
    <div class="virtual-tabs">
      <button class="vtab active" data-mode="plan2d" onclick="switchVirtualMode('plan2d', this)">
        📐 Mặt bằng
      </button>
      <button class="vtab" data-mode="plan3d" onclick="switchVirtualMode('plan3d', this)">
        🏗️ Mặt bằng 3D
      </button>
      <button class="vtab" data-mode="tour360" onclick="switchVirtualMode('tour360', this)">
        🌐 Tour 360°
      </button>
      <button class="vtab" data-mode="walk3d" onclick="switchVirtualMode('walk3d', this)">
        🚶 Đi bộ 3D
      </button>
      <button class="vtab" data-mode="ai" onclick="switchVirtualMode('ai', this)">
        🎨 AI Nội thất
      </button>
    </div>
    <div class="virtual-viewport" id="virtualViewport">
      <!-- Initial: mặt bằng 2D -->
      ${unit._isVilla ? villaIllustrationSVG(unit) : floorplanSVG(unit)}
    </div>
  `;
}

// ============================================================
// SWITCH MODE
// ============================================================
function switchVirtualMode(mode, btn) {
  // Cleanup previous mode
  cleanupVirtualMode();

  // Update active tab
  document.querySelectorAll('.vtab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');

  currentVirtualMode = mode;
  const viewport = document.getElementById('virtualViewport');
  const unit = window._activeUnit;
  const project = window._activeProject;
  if (!viewport || !unit) return;

  switch (mode) {
    case 'plan2d':
      viewport.innerHTML = unit._isVilla ? villaIllustrationSVG(unit) : floorplanSVG(unit);
      break;
    case 'plan3d':
      viewport.innerHTML = '<canvas id="threeCanvas" style="width:100%;height:100%;display:block;"></canvas>';
      init3DFloorPlan(unit);
      break;
    case 'tour360':
      render360Tour(unit);
      break;
    case 'walk3d':
      viewport.innerHTML = `
        <canvas id="threeCanvas" style="width:100%;height:100%;display:block;cursor:grab;"></canvas>
        <div class="walk3d-hud">
          <div class="walk3d-hint">
            💡 <strong>Desktop:</strong> WASD/mũi tên để đi · Kéo chuột để nhìn<br>
            💡 <strong>Mobile:</strong> Chạm joystick bên trái để đi · Vuốt màn hình để nhìn
          </div>
          <div class="walk3d-joystick" id="walkJoystick">
            <div class="walk3d-stick"></div>
          </div>
        </div>
      `;
      init3DWalkthrough(unit);
      break;
    case 'ai':
      renderAIInteriorUI(unit);
      break;
  }
}

function cleanupVirtualMode() {
  if (pannellumViewer) {
    try { pannellumViewer.destroy(); } catch(e) {}
    pannellumViewer = null;
  }
  if (three3D && three3D.cleanup) {
    three3D.cleanup();
    three3D = null;
  }
}

// ============================================================
// MODE 1: TOUR 360° (Pannellum)
// ============================================================
function render360Tour(unit) {
  const viewport = document.getElementById('virtualViewport');

  // Chọn ảnh demo theo unit (xoay vòng)
  const demoImages = [
    'assets/img/demo-360-1.jpg',
    'assets/img/demo-360-2.jpg'
  ];
  const hashCode = (unit.id || '').split('').reduce((a,c) => a + c.charCodeAt(0), 0);
  const imageUrl = unit.image360 || demoImages[hashCode % demoImages.length];

  viewport.innerHTML = `
    <div id="panorama360" style="width:100%;height:100%;"></div>
    <div style="position:absolute;bottom:.75rem;left:.75rem;background:rgba(0,0,0,.6);color:white;padding:.4rem .75rem;border-radius:6px;font-size:.8rem;">
      🌐 Tour 360° · Kéo để xoay · Lăn chuột để zoom
    </div>
    ${!unit.image360 ? '<div style="position:absolute;top:.75rem;right:.75rem;background:rgba(245,130,32,.95);color:white;padding:.4rem .75rem;border-radius:6px;font-size:.75rem;font-weight:600;">⚠️ Đây là ảnh demo - thay ảnh thật trong data.js</div>' : ''}
  `;

  // Khởi tạo Pannellum
  if (typeof pannellum === 'undefined') {
    viewport.innerHTML = '<div class="vp-error">❌ Pannellum chưa load. Kiểm tra assets/lib/pannellum.js</div>';
    return;
  }

  pannellumViewer = pannellum.viewer('panorama360', {
    type: 'equirectangular',
    panorama: imageUrl,
    autoLoad: true,
    autoRotate: -2,
    compass: false,
    showZoomCtrl: true,
    showFullscreenCtrl: true,
    mouseZoom: true,
    hotSpots: [
      {
        pitch: -10, yaw: 117,
        type: "info",
        text: "Khu vực phòng khách"
      },
      {
        pitch: 5, yaw: 50,
        type: "info",
        text: "Cửa sổ - hướng " + (unit.direction || 'view đẹp')
      }
    ]
  });
}

// ============================================================
// MODE 2: MẶT BẰNG 3D (Three.js extruded, top-down)
// ============================================================
function init3DFloorPlan(unit) {
  if (typeof THREE === 'undefined') {
    document.getElementById('virtualViewport').innerHTML = '<div class="vp-error">❌ Three.js chưa load</div>';
    return;
  }

  const canvas = document.getElementById('threeCanvas');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe0e7ff);

  const w = canvas.clientWidth, h = canvas.clientHeight;
  const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 1000);
  camera.position.set(8, 12, 8);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // Tính kích thước theo diện tích căn
  const area = unit.area || 75;
  const isVilla = unit._isVilla;
  const ratio = isVilla ? 1.0 : 1.4;
  const width = Math.sqrt(area * ratio);  // chiều rộng (m)
  const depth = area / width;              // chiều sâu (m)
  const wallH = isVilla ? 3.5 : 2.8;

  // Sàn
  const floorGeo = new THREE.BoxGeometry(width, 0.1, depth);
  const floorMat = new THREE.MeshLambertMaterial({ color: 0xfde4cc });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  scene.add(floor);

  // Tường (4 mặt) - viền
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xf5f5dc });
  const wallT = 0.1;
  const walls = [
    [width, wallH, wallT,  0, wallH/2, -depth/2],
    [width, wallH, wallT,  0, wallH/2,  depth/2],
    [wallT, wallH, depth, -width/2, wallH/2, 0],
    [wallT, wallH, depth,  width/2, wallH/2, 0]
  ];
  walls.forEach(([sx,sy,sz,px,py,pz]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), wallMat);
    m.position.set(px,py,pz);
    scene.add(m);
  });

  // Vách ngăn phòng (đơn giản: 1 vách chia phòng khách/phòng ngủ)
  if (!isVilla && unit.bedrooms) {
    const partition = new THREE.Mesh(
      new THREE.BoxGeometry(wallT, wallH, depth * 0.6),
      wallMat
    );
    partition.position.set(width * 0.15, wallH/2, depth * 0.2);
    scene.add(partition);

    // Vách nữa cho phòng ngủ 2
    if (unit.bedrooms >= 2) {
      const p2 = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.7, wallH, wallT),
        wallMat
      );
      p2.position.set(width * 0.15, wallH/2, depth * 0.05);
      scene.add(p2);
    }
  }

  // Đồ nội thất minh hoạ
  const fMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
  // Giường
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 1.6), fMat);
  bed.position.set(width * 0.3, 0.3, depth * 0.3);
  scene.add(bed);
  // Sofa
  const sofa = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 0.9),
    new THREE.MeshLambertMaterial({ color: 0x6b7280 }));
  sofa.position.set(-width * 0.2, 0.4, -depth * 0.3);
  scene.add(sofa);
  // Bàn ăn
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.8),
    new THREE.MeshLambertMaterial({ color: 0x92400e }));
  table.position.set(-width * 0.25, 0.4, depth * 0.2);
  scene.add(table);

  // Hướng (mũi tên la bàn)
  const arrowGeo = new THREE.ConeGeometry(0.4, 1, 4);
  const arrow = new THREE.Mesh(arrowGeo, new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
  arrow.position.set(width/2 + 1, 0.5, -depth/2 - 1);
  arrow.rotation.x = Math.PI / 2;
  scene.add(arrow);

  // Tự xoay camera
  let angle = 0;
  let userInteracted = false;
  const radius = Math.max(width, depth) * 1.3;

  // Drag để xoay
  let isDragging = false, lastX = 0, dragAngle = 0;
  canvas.addEventListener('mousedown', e => { isDragging = true; lastX = e.clientX; userInteracted = true; });
  canvas.addEventListener('mousemove', e => {
    if (isDragging) {
      dragAngle += (e.clientX - lastX) * 0.01;
      lastX = e.clientX;
    }
  });
  canvas.addEventListener('mouseup', () => isDragging = false);
  canvas.addEventListener('mouseleave', () => isDragging = false);
  canvas.addEventListener('touchstart', e => { isDragging = true; lastX = e.touches[0].clientX; userInteracted = true; }, {passive:true});
  canvas.addEventListener('touchmove', e => {
    if (isDragging) {
      dragAngle += (e.touches[0].clientX - lastX) * 0.01;
      lastX = e.touches[0].clientX;
    }
  }, {passive:true});
  canvas.addEventListener('touchend', () => isDragging = false);

  let animationId;
  function animate() {
    if (!userInteracted) angle += 0.005;
    const totalAngle = angle + dragAngle;
    camera.position.x = Math.cos(totalAngle) * radius;
    camera.position.z = Math.sin(totalAngle) * radius;
    camera.position.y = radius * 0.7;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }
  animate();

  // Resize
  const onResize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  three3D = {
    cleanup() {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    }
  };
}

// ============================================================
// MODE 3: WALK-THROUGH 3D (first-person)
// ============================================================
function init3DWalkthrough(unit) {
  if (typeof THREE === 'undefined') {
    document.getElementById('virtualViewport').innerHTML = '<div class="vp-error">❌ Three.js chưa load</div>';
    return;
  }

  const canvas = document.getElementById('threeCanvas');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb0d4e8);
  scene.fog = new THREE.Fog(0xb0d4e8, 10, 40);

  const w = canvas.clientWidth, h = canvas.clientHeight;
  const camera = new THREE.PerspectiveCamera(75, w/h, 0.1, 100);
  camera.position.set(0, 1.6, 4);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Ambient + sun
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(10, 20, 10);
  scene.add(sun);

  // Kích thước căn
  const area = unit.area || 75;
  const isVilla = unit._isVilla;
  const ratio = isVilla ? 1.0 : 1.4;
  const W = Math.sqrt(area * ratio);
  const D = area / W;
  const H = isVilla ? 3.5 : 2.8;

  // Sàn (gỗ)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshLambertMaterial({ color: 0xc89671 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Trần
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshLambertMaterial({ color: 0xfafafa })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = H;
  scene.add(ceiling);

  // Tường ngoài (có lỗ cửa sổ ở mặt trước)
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xfff4ea });
  const t = 0.15;

  // Sau
  scene.add(makeWall(W, H, t, 0, H/2, -D/2, wallMat));
  // Trái + Phải
  scene.add(makeWall(t, H, D, -W/2, H/2, 0, wallMat));
  scene.add(makeWall(t, H, D,  W/2, H/2, 0, wallMat));

  // Tường trước (có cửa sổ ở giữa - dùng 4 mảnh)
  // Mảnh trên cửa sổ
  scene.add(makeWall(W, H*0.3, t, 0, H - H*0.15, D/2, wallMat));
  // Mảnh dưới cửa sổ
  scene.add(makeWall(W, H*0.3, t, 0, H*0.15, D/2, wallMat));
  // Cửa sổ kính
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(W*0.7, H*0.4),
    new THREE.MeshLambertMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.4 })
  );
  glass.position.set(0, H*0.5, D/2 - 0.01);
  glass.rotation.y = Math.PI;
  scene.add(glass);

  // Bên ngoài cửa sổ - cảnh
  const outsideBox = new THREE.Mesh(
    new THREE.BoxGeometry(W*0.7, H*0.4, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x86efac })
  );
  outsideBox.position.set(0, H*0.5, D/2 + 2);
  scene.add(outsideBox);

  // Nội thất
  // Sofa
  const sofa = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.85, 0.95),
    new THREE.MeshLambertMaterial({ color: 0x4b5563 })
  );
  sofa.position.set(0, 0.425, -D/2 + 1);
  scene.add(sofa);
  // Tựa sofa
  const sofaBack = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.6, 0.2),
    new THREE.MeshLambertMaterial({ color: 0x374151 })
  );
  sofaBack.position.set(0, 1.15, -D/2 + 0.55);
  scene.add(sofaBack);

  // Bàn cafe
  const coffeeT = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.45, 0.6),
    new THREE.MeshLambertMaterial({ color: 0x92400e })
  );
  coffeeT.position.set(0, 0.225, -D/2 + 2.2);
  scene.add(coffeeT);

  // TV cabinet
  const tvCab = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.5, 0.4),
    new THREE.MeshLambertMaterial({ color: 0x1f2937 })
  );
  tvCab.position.set(0, 0.25, D/2 - 0.5);
  scene.add(tvCab);

  // TV
  const tv = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x111827, emissive: 0x1e3a8a, emissiveIntensity: 0.3 })
  );
  tv.position.set(0, 1.3, D/2 - 0.4);
  scene.add(tv);

  // Đèn trần
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff8dc })
  );
  lamp.position.set(0, H - 0.3, 0);
  scene.add(lamp);
  const pointLight = new THREE.PointLight(0xfff4ea, 0.5, 8);
  pointLight.position.set(0, H - 0.3, 0);
  scene.add(pointLight);

  // Điều khiển first-person
  const move = { forward: false, back: false, left: false, right: false };
  let yaw = 0, pitch = 0;
  let velocity = new THREE.Vector3();
  const speed = 2.5;

  // Keyboard
  function onKey(e, down) {
    if (e.key === 'w' || e.key === 'ArrowUp')    { move.forward = down; e.preventDefault(); }
    if (e.key === 's' || e.key === 'ArrowDown')  { move.back = down; e.preventDefault(); }
    if (e.key === 'a' || e.key === 'ArrowLeft')  { move.left = down; e.preventDefault(); }
    if (e.key === 'd' || e.key === 'ArrowRight') { move.right = down; e.preventDefault(); }
  }
  const kDown = e => onKey(e, true);
  const kUp = e => onKey(e, false);
  window.addEventListener('keydown', kDown);
  window.addEventListener('keyup', kUp);

  // Mouse look (drag)
  let mouseDown = false, lastMX = 0, lastMY = 0;
  canvas.addEventListener('mousedown', e => { mouseDown = true; lastMX = e.clientX; lastMY = e.clientY; canvas.style.cursor='grabbing'; });
  canvas.addEventListener('mouseup', () => { mouseDown = false; canvas.style.cursor='grab'; });
  canvas.addEventListener('mouseleave', () => { mouseDown = false; canvas.style.cursor='grab'; });
  canvas.addEventListener('mousemove', e => {
    if (!mouseDown) return;
    yaw -= (e.clientX - lastMX) * 0.003;
    pitch -= (e.clientY - lastMY) * 0.003;
    pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, pitch));
    lastMX = e.clientX; lastMY = e.clientY;
  });
  // Touch look
  let touchLook = false, lastTX = 0, lastTY = 0;
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1 && !isInJoystick(e.touches[0])) {
      touchLook = true; lastTX = e.touches[0].clientX; lastTY = e.touches[0].clientY;
    }
  }, {passive:true});
  canvas.addEventListener('touchmove', e => {
    if (touchLook && e.touches.length === 1 && !isInJoystick(e.touches[0])) {
      yaw -= (e.touches[0].clientX - lastTX) * 0.005;
      pitch -= (e.touches[0].clientY - lastTY) * 0.005;
      pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, pitch));
      lastTX = e.touches[0].clientX; lastTY = e.touches[0].clientY;
    }
  }, {passive:true});
  canvas.addEventListener('touchend', () => touchLook = false);

  // Joystick mobile
  const joystick = document.getElementById('walkJoystick');
  const stick = joystick?.querySelector('.walk3d-stick');
  let joyActive = false, joyX = 0, joyY = 0;

  function isInJoystick(t) {
    if (!joystick) return false;
    const r = joystick.getBoundingClientRect();
    return t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom;
  }

  if (joystick) {
    joystick.addEventListener('touchstart', e => {
      joyActive = true;
      handleJoystick(e.touches[0]);
      e.preventDefault();
    });
    joystick.addEventListener('touchmove', e => {
      if (joyActive) handleJoystick(e.touches[0]);
      e.preventDefault();
    });
    joystick.addEventListener('touchend', () => {
      joyActive = false;
      joyX = 0; joyY = 0;
      if (stick) stick.style.transform = 'translate(0,0)';
    });
  }

  function handleJoystick(t) {
    const r = joystick.getBoundingClientRect();
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    let dx = t.clientX - cx, dy = t.clientY - cy;
    const dist = Math.min(Math.sqrt(dx*dx + dy*dy), r.width/2 - 10);
    const ang = Math.atan2(dy, dx);
    dx = Math.cos(ang) * dist;
    dy = Math.sin(ang) * dist;
    if (stick) stick.style.transform = `translate(${dx}px, ${dy}px)`;
    joyX = dx / (r.width/2 - 10);
    joyY = dy / (r.width/2 - 10);
  }

  let lastTime = performance.now();
  let animId;
  function animate(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    velocity.set(0, 0, 0);
    if (move.forward) velocity.z -= 1;
    if (move.back)    velocity.z += 1;
    if (move.left)    velocity.x -= 1;
    if (move.right)   velocity.x += 1;

    if (joyActive) {
      velocity.x += joyX;
      velocity.z += joyY;
    }

    if (velocity.length() > 0) velocity.normalize().multiplyScalar(speed * dt);

    // Rotate velocity by yaw
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const dx = velocity.x * cos - velocity.z * sin;
    const dz = velocity.x * sin + velocity.z * cos;

    // Move + collision (giữ trong phòng)
    const nx = camera.position.x + dx;
    const nz = camera.position.z + dz;
    const margin = 0.4;
    if (Math.abs(nx) < W/2 - margin) camera.position.x = nx;
    if (Math.abs(nz) < D/2 - margin) camera.position.z = nz;
    camera.position.y = 1.6;

    // Apply look
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }
  animId = requestAnimationFrame(animate);

  const onResize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  three3D = {
    cleanup() {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', kDown);
      window.removeEventListener('keyup', kUp);
      renderer.dispose();
    }
  };
}

function makeWall(sx, sy, sz, px, py, pz, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  m.position.set(px, py, pz);
  return m;
}

// ============================================================
// MODE 4: AI INTERIOR (HuggingFace Inference)
// ============================================================
const INTERIOR_STYLES = [
  { id: 'modern',      label: 'Hiện đại',     emoji: '✨' },
  { id: 'scandinavian',label: 'Bắc Âu',       emoji: '🌲' },
  { id: 'indochine',   label: 'Indochine',    emoji: '🪷' },
  { id: 'luxury',      label: 'Luxury',       emoji: '👑' },
  { id: 'minimalist',  label: 'Tối giản',     emoji: '⚪' },
  { id: 'japandi',     label: 'Japandi',      emoji: '🎋' }
];

function renderAIInteriorUI(unit) {
  const viewport = document.getElementById('virtualViewport');
  viewport.innerHTML = `
    <div class="ai-panel">
      <div class="ai-header">
        <h3>🎨 AI Render Nội Thất</h3>
        <p style="color: var(--gray-500); font-size: .9rem;">
          Chọn phong cách → AI sẽ render căn ${unit.code || unit.id} (${unit.area} m²) theo phong cách đó.
          <strong>Yêu cầu kết nối Internet.</strong>
        </p>
      </div>

      <div class="ai-styles">
        ${INTERIOR_STYLES.map(s => `
          <button class="ai-style-btn" onclick="generateAIInterior('${s.id}', '${unit.bedrooms||2}')">
            <span class="ai-style-emoji">${s.emoji}</span>
            <span>${s.label}</span>
          </button>
        `).join('')}
      </div>

      <div id="aiResult" class="ai-result">
        <div class="ai-placeholder">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🖼️</div>
          <p>Chọn phong cách phía trên để bắt đầu</p>
          <p style="font-size: .8rem; color: var(--gray-500); margin-top: .5rem;">
            Sử dụng HuggingFace Inference API miễn phí - kết quả có thể mất 10-30 giây
          </p>
        </div>
      </div>
    </div>
  `;
}

async function generateAIInterior(styleId, bedrooms) {
  const result = document.getElementById('aiResult');
  const style = INTERIOR_STYLES.find(s => s.id === styleId);

  // Kiểm tra online
  if (!navigator.onLine) {
    result.innerHTML = `
      <div class="ai-placeholder" style="color: var(--red);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📡</div>
        <p><strong>Không có kết nối Internet</strong></p>
        <p style="font-size: .85rem;">Tính năng AI cần online. Vui lòng kết nối mạng và thử lại.</p>
      </div>
    `;
    return;
  }

  // Loading
  result.innerHTML = `
    <div class="ai-placeholder">
      <div class="spinner"></div>
      <p><strong>Đang render phong cách ${style.label}...</strong></p>
      <p style="font-size: .85rem; color: var(--gray-500);">
        AI đang vẽ căn hộ ${bedrooms} phòng ngủ theo phong cách ${style.label.toLowerCase()}.<br>
        Vui lòng chờ 10-30 giây.
      </p>
    </div>
  `;

  const styleDescriptions = {
    modern:       'modern minimalist interior, large windows, neutral colors, sleek furniture, polished concrete floor',
    scandinavian: 'scandinavian interior, white walls, light wood floor, cozy textiles, plants, natural light',
    indochine:    'indochine style interior, vintage wooden furniture, tropical plants, ceiling fan, mosaic tiles, warm tones',
    luxury:       'luxury penthouse interior, marble floor, gold accents, chandelier, leather sofa, expensive furniture',
    minimalist:   'minimalist interior, all white, very few furniture, clean lines, japanese influence',
    japandi:      'japandi interior, japanese scandinavian fusion, low furniture, natural materials, muted earth tones'
  };

  const prompt = `${styleDescriptions[styleId]}, ${bedrooms} bedroom apartment living room, photorealistic, architectural photography, 8k, beautiful lighting, no people`;

  try {
    // Gọi HuggingFace Inference API (free, không cần token cho nhiều model)
    // Stable Diffusion XL
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    if (response.status === 503) {
      // Model đang load
      const data = await response.json();
      result.innerHTML = `
        <div class="ai-placeholder">
          <div class="spinner"></div>
          <p><strong>Model đang khởi động trên HuggingFace...</strong></p>
          <p style="font-size: .85rem; color: var(--gray-500);">
            Lần đầu sử dụng cần ~${Math.ceil(data.estimated_time || 20)}s để model load.<br>
            Thử lại sau ${Math.ceil(data.estimated_time || 20)}s.
          </p>
          <button class="btn btn-primary" style="margin-top:1rem;" onclick="generateAIInterior('${styleId}','${bedrooms}')">Thử lại</button>
        </div>
      `;
      return;
    }

    if (!response.ok) throw new Error('API error: ' + response.status);

    const blob = await response.blob();
    const imgUrl = URL.createObjectURL(blob);

    result.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <img src="${imgUrl}" alt="${style.label}" style="width:100%; border-radius: 8px; box-shadow: var(--shadow);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${style.emoji} ${style.label}</strong>
            <div style="color: var(--gray-500); font-size: .85rem;">Render bởi Stable Diffusion XL (HuggingFace)</div>
          </div>
          <div style="display:flex; gap:.5rem;">
            <a href="${imgUrl}" download="futa-${styleId}.png" class="btn btn-outline">📥 Tải về</a>
            <button class="btn btn-primary" onclick="generateAIInterior('${styleId}','${bedrooms}')">🔄 Render lại</button>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    result.innerHTML = `
      <div class="ai-placeholder" style="color: var(--red);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <p><strong>Lỗi khi gọi AI</strong></p>
        <p style="font-size: .85rem;">${err.message}</p>
        <p style="font-size: .8rem; color: var(--gray-500); margin-top: 1rem;">
          HuggingFace free API có giới hạn rate limit. Thử lại sau vài phút hoặc thêm token miễn phí (hf.co).
        </p>
        <button class="btn btn-primary" style="margin-top:1rem;" onclick="generateAIInterior('${styleId}','${bedrooms}')">Thử lại</button>
      </div>
    `;
  }
}
