/**
 * Real Organics - Interactive 3D World Canvas
 * Built with Three.js
 * Renders the living natural landscape of Visakhapatnam & the Eastern Ghats:
 * - Undulating organic terrain with rolling hills & farm terraces
 * - Swaying crops and millet stalks
 * - 1,500 floating golden sun pollen particles and windblown leaves
 * - Dynamic 3D camera choreography tied to the "Farm to Home" journey
 * - Mouse parallax tilt & interaction
 */

class FarmWorld3D {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Scene elements
    this.terrain = null;
    this.cropsInstanced = null;
    this.particleSystem = null;
    this.leafGroup = null;
    this.sunLight = null;
    this.ambientLight = null;
    this.sunMesh = null;

    // Camera target waypoints for each journey stage
    this.stageWaypoints = [
      // 0: Hero / Farm Dawn
      { pos: new THREE.Vector3(0, 14, 55), look: new THREE.Vector3(0, 4, 0), fov: 50 },
      // 1: Stage 1 - Living Soil & Farm
      { pos: new THREE.Vector3(-12, 10, 40), look: new THREE.Vector3(-4, 3, -10), fov: 52 },
      // 2: Stage 2 - Sacred Harvest
      { pos: new THREE.Vector3(14, 18, 30), look: new THREE.Vector3(2, 6, -15), fov: 54 },
      // 3: Stage 3 - Cold Press & Purity
      { pos: new THREE.Vector3(-8, 8, 20), look: new THREE.Vector3(0, 4, -20), fov: 48 },
      // 4: Stage 4 - Pendurthi Flagship Store
      { pos: new THREE.Vector3(10, 12, 15), look: new THREE.Vector3(0, 5, -25), fov: 50 },
      // 5: Stage 5 - To Your Home
      { pos: new THREE.Vector3(0, 22, 35), look: new THREE.Vector3(0, 2, -30), fov: 55 }
    ];

    this.currentWaypoint = {
      pos: new THREE.Vector3(0, 14, 55),
      look: new THREE.Vector3(0, 4, 0),
      fov: 50
    };
    this.targetWaypoint = {
      pos: new THREE.Vector3(0, 14, 55),
      look: new THREE.Vector3(0, 4, 0),
      fov: 50
    };

    // Mouse parallax tracking
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scrollProgress = 0; // 0 to 1

    this.init();
  }

  init() {
    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x132e1e, 0.012); // Deep botanical mist

    // 2. Camera setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.camera.position.copy(this.currentWaypoint.pos);
    this.camera.lookAt(this.currentWaypoint.look);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting setup
    this.setupLighting();

    // 5. Build Environment
    this.createTerrain();
    this.createCropsAndStalks();
    this.createAtmosphericParticles();
    this.createFloatingLeaves();

    // 6. Event listeners
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // 7. Start render loop
    this.animate();
  }

  setupLighting() {
    // Ambient light - soft botanical glow
    this.ambientLight = new THREE.AmbientLight(0x40634c, 1.2);
    this.scene.add(this.ambientLight);

    // Golden morning sun directional light
    this.sunLight = new THREE.DirectionalLight(0xffdf88, 2.4);
    this.sunLight.position.set(45, 60, -80);
    this.scene.add(this.sunLight);

    // Warm secondary bounce light from the soil
    const soilBounce = new THREE.DirectionalLight(0xc97a3e, 0.8);
    soilBounce.position.set(-30, -10, 20);
    this.scene.add(soilBounce);

    // Sun disc sphere in distance
    const sunGeom = new THREE.SphereGeometry(14, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfff0b8,
      transparent: true,
      opacity: 0.95
    });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.sunMesh.position.set(45, 48, -140);
    this.scene.add(this.sunMesh);

    // Sun glow halo
    const haloGeom = new THREE.SphereGeometry(32, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide
    });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    this.sunMesh.add(haloMesh);
  }

  createTerrain() {
    const width = 220;
    const height = 220;
    const segments = 90;

    const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors = [];

    // Colors for vertex blending
    const soilColor = new THREE.Color(0x23180f);     // Dark nutrient compost
    const fertileColor = new THREE.Color(0x2d482d);  // Deep organic loam
    const cropGreen = new THREE.Color(0x3e7a3a);     // Lush crop shoots
    const terraceGold = new THREE.Color(0x6e8a44);   // Sunlit terraces

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Multi-frequency Perlin-style sine elevation to simulate terraced hills of Pendurthi / Ghats
      const elevation =
        Math.sin(x * 0.04) * 4.5 +
        Math.cos(z * 0.035) * 5.2 +
        Math.sin(x * 0.08 + z * 0.06) * 2.2 +
        Math.cos(Math.hypot(x, z) * 0.05) * 2.8;

      // Slight terrace stepping effect
      const stepped = Math.floor(elevation * 1.5) / 1.5;
      pos.setY(i, stepped - 6);

      // Color based on height and slopes
      const t = (stepped + 6) / 12;
      const vertexColor = new THREE.Color();
      if (t < 0.3) {
        vertexColor.lerpColors(soilColor, fertileColor, t / 0.3);
      } else if (t < 0.7) {
        vertexColor.lerpColors(fertileColor, cropGreen, (t - 0.3) / 0.4);
      } else {
        vertexColor.lerpColors(cropGreen, terraceGold, (t - 0.7) / 0.3);
      }

      colors.push(vertexColor.r, vertexColor.g, vertexColor.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.08,
      flatShading: true
    });

    this.terrain = new THREE.Mesh(geometry, material);
    this.terrain.position.set(0, 0, -20);
    this.scene.add(this.terrain);
  }

  createCropsAndStalks() {
    // Instanced mesh for swaying crops (Millets and organic paddy shoots)
    const cropCount = 1400;
    const stalkGeom = new THREE.ConeGeometry(0.14, 2.8, 4);
    stalkGeom.translate(0, 1.4, 0);

    const stalkMat = new THREE.MeshStandardMaterial({
      color: 0x65a30d,
      roughness: 0.6,
      metalness: 0.1
    });

    this.cropsInstanced = new THREE.InstancedMesh(stalkGeom, stalkMat, cropCount);
    const dummy = new THREE.Object3D();
    this.cropBasePositions = [];

    let idx = 0;
    for (let i = 0; i < cropCount; i++) {
      const rx = (Math.random() - 0.5) * 120;
      const rz = (Math.random() - 0.5) * 90 - 15;
      const ry = Math.sin(rx * 0.04) * 4.5 + Math.cos(rz * 0.035) * 5.2 - 6;

      dummy.position.set(rx, ry, rz);
      const scaleY = 0.8 + Math.random() * 0.6;
      dummy.scale.set(1, scaleY, 1);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.rotation.z = (Math.random() - 0.5) * 0.15;
      dummy.updateMatrix();

      this.cropsInstanced.setMatrixAt(idx, dummy.matrix);
      this.cropBasePositions.push({
        x: rx, y: ry, z: rz,
        scaleY: scaleY,
        rotY: dummy.rotation.y,
        phase: Math.random() * Math.PI * 2
      });
      idx++;
    }

    this.cropsInstanced.instanceMatrix.needsUpdate = true;
    this.scene.add(this.cropsInstanced);
  }

  createAtmosphericParticles() {
    // 1,500 glowing golden pollen & organic spores drifting in sunlight
    const count = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 140;
      positions[i * 3 + 1] = Math.random() * 45;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 140;
      scales[i] = Math.random() * 1.8 + 0.6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    // Particle texture created procedurally with canvas
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 240, 180, 1)');
    grad.addColorStop(0.4, 'rgba(234, 179, 8, 0.6)');
    grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 1.6,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }

  createFloatingLeaves() {
    // Group of 3D botanical leaves tumbling slowly
    this.leafGroup = new THREE.Group();
    const leafCount = 35;

    // Curved leaf geometry
    const leafGeom = new THREE.PlaneGeometry(1.2, 2.2, 4, 4);
    const leafPos = leafGeom.attributes.position;
    for (let i = 0; i < leafPos.count; i++) {
      const y = leafPos.getY(i);
      leafPos.setZ(i, Math.sin(y * 1.5) * 0.35); // Gentle organic curve
    }
    leafGeom.computeVertexNormals();

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      roughness: 0.5,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    this.leaves = [];
    for (let i = 0; i < leafCount; i++) {
      const leafMesh = new THREE.Mesh(leafGeom, leafMat);
      const leafData = {
        mesh: leafMesh,
        origX: (Math.random() - 0.5) * 60,
        origY: Math.random() * 25 + 2,
        origZ: (Math.random() - 0.5) * 60 + 10,
        rotSpeedX: (Math.random() - 0.5) * 0.02,
        rotSpeedY: (Math.random() - 0.5) * 0.03,
        rotSpeedZ: (Math.random() - 0.5) * 0.02,
        floatSpeed: 0.008 + Math.random() * 0.015,
        driftSpeed: (Math.random() - 0.5) * 0.01
      };
      leafMesh.position.set(leafData.origX, leafData.origY, leafData.origZ);
      leafMesh.scale.setScalar(0.6 + Math.random() * 0.6);
      this.leafGroup.add(leafMesh);
      this.leaves.push(leafData);
    }

    this.scene.add(this.leafGroup);
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  onMouseMove(e) {
    this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  setStageIndex(index) {
    if (index >= 0 && index < this.stageWaypoints.length) {
      this.targetWaypoint = this.stageWaypoints[index];
    }
  }

  setScrollProgress(progress) {
    this.scrollProgress = Math.max(0, Math.min(1, progress));
    // Interpolate waypoint based on scroll progress
    const totalWaypoints = this.stageWaypoints.length - 1;
    const stageFloat = this.scrollProgress * totalWaypoints;
    const baseIdx = Math.floor(stageFloat);
    const nextIdx = Math.min(baseIdx + 1, totalWaypoints);
    const frac = stageFloat - baseIdx;

    const pA = this.stageWaypoints[baseIdx];
    const pB = this.stageWaypoints[nextIdx];

    this.targetWaypoint = {
      pos: new THREE.Vector3().lerpVectors(pA.pos, pB.pos, frac),
      look: new THREE.Vector3().lerpVectors(pA.look, pB.look, frac),
      fov: pA.fov + (pB.fov - pA.fov) * frac
    };
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Mouse smooth lerp
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // 2. Camera position smooth lerp to target
    this.currentWaypoint.pos.lerp(this.targetWaypoint.pos, 0.04);
    this.currentWaypoint.look.lerp(this.targetWaypoint.look, 0.04);
    this.currentWaypoint.fov += (this.targetWaypoint.fov - this.currentWaypoint.fov) * 0.04;

    // Apply camera position with subtle mouse parallax
    this.camera.position.x = this.currentWaypoint.pos.x + this.mouse.x * 2.5;
    this.camera.position.y = this.currentWaypoint.pos.y - this.mouse.y * 1.5;
    this.camera.position.z = this.currentWaypoint.pos.z;

    const currentLook = this.currentWaypoint.look.clone();
    currentLook.x += this.mouse.x * 1.8;
    currentLook.y += -this.mouse.y * 1.2;
    this.camera.lookAt(currentLook);
    this.camera.fov = this.currentWaypoint.fov;
    this.camera.updateProjectionMatrix();

    // 3. Animate swaying crops in the morning breeze
    if (this.cropsInstanced && this.cropBasePositions) {
      const dummy = new THREE.Object3D();
      const count = this.cropBasePositions.length;
      const windSpeed = elapsedTime * 1.8;

      for (let i = 0; i < count; i += 3) { // Animate in steps for high FPS performance
        const p = this.cropBasePositions[i];
        const sway = Math.sin(windSpeed + p.phase) * 0.16;

        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.set(1, p.scaleY, 1);
        dummy.rotation.y = p.rotY;
        dummy.rotation.z = sway;
        dummy.updateMatrix();

        this.cropsInstanced.setMatrixAt(i, dummy.matrix);
      }
      this.cropsInstanced.instanceMatrix.needsUpdate = true;
    }

    // 4. Animate floating golden pollen & spores
    if (this.particleSystem) {
      const pos = this.particleSystem.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - 0.035;
        let x = pos.getX(i) + Math.sin(elapsedTime * 0.6 + i) * 0.015;
        if (y < 0) y = 42;
        pos.setY(i, y);
        pos.setX(i, x);
      }
      pos.needsUpdate = true;
    }

    // 5. Animate tumbling leaves
    if (this.leaves) {
      this.leaves.forEach((l) => {
        l.mesh.position.y -= l.floatSpeed;
        l.mesh.position.x += Math.sin(elapsedTime + l.origX) * 0.02 + l.driftSpeed;
        l.mesh.position.z += Math.cos(elapsedTime * 0.8 + l.origZ) * 0.015;

        l.mesh.rotation.x += l.rotSpeedX;
        l.mesh.rotation.y += l.rotSpeedY;
        l.mesh.rotation.z += l.rotSpeedZ;

        if (l.mesh.position.y < -2) {
          l.mesh.position.y = 28;
          l.mesh.position.x = (Math.random() - 0.5) * 60;
        }
      });
    }

    // 6. Subtle sun breathing glow
    if (this.sunMesh) {
      const pulse = 1 + Math.sin(elapsedTime * 0.8) * 0.04;
      this.sunMesh.scale.set(pulse, pulse, pulse);
    }

    // Render 3D frame
    this.renderer.render(this.scene, this.camera);
  }
}

window.FarmWorld3D = FarmWorld3D;
