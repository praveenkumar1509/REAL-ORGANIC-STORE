/**
 * Real Organics - Interactive 3D Product Turntable Inspector
 * Built with Three.js & OrbitControls
 * Allows customers to interactively rotate, inspect, and analyze organic products in 3D:
 * - Amber glass oil bottles with cork and liquid refraction
 * - Hex honey jars with honey dippers
 * - Terracotta clay pots with unpolished millets
 * - Heirloom sun-ripened organic fruits
 * - Brass spice mortars
 */

class Product3DViewer {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.currentModelGroup = null;
    this.clock = new THREE.Clock();
    this.autoRotate = true;
    this.currentProduct = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 500;
    const height = this.container.clientHeight || 500;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 3, 9);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
      this.controls.minDistance = 3.5;
      this.controls.maxDistance = 14;
    }

    // 5. Lighting
    this.setupLighting('dawn');

    // 6. Ground Pedestal (Rustic Teak Wood Turntable)
    this.createPedestal();

    // 7. Resize handler
    window.addEventListener('resize', () => this.onResize());

    // 8. Start loop
    this.animate();
  }

  setupLighting(preset = 'dawn') {
    // Clear old lights
    const toRemove = [];
    this.scene.children.forEach(child => {
      if (child.isLight) toRemove.push(child);
    });
    toRemove.forEach(l => this.scene.remove(l));

    if (preset === 'dawn') {
      // Warm golden morning sun
      const amb = new THREE.AmbientLight(0xfff6ea, 1.4);
      this.scene.add(amb);

      const mainLight = new THREE.DirectionalLight(0xffdf88, 2.2);
      mainLight.position.set(5, 10, 6);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 1024;
      mainLight.shadow.mapSize.height = 1024;
      this.scene.add(mainLight);

      const rimLight = new THREE.DirectionalLight(0x73b06f, 1.0);
      rimLight.position.set(-6, 4, -5);
      this.scene.add(rimLight);
    } else if (preset === 'lab') {
      // Crisp clinical lab inspection light
      const amb = new THREE.AmbientLight(0xffffff, 1.6);
      this.scene.add(amb);

      const spot = new THREE.SpotLight(0xf8fafc, 3.0);
      spot.position.set(0, 12, 4);
      spot.castShadow = true;
      this.scene.add(spot);
    } else {
      // Warm wood cellar
      const amb = new THREE.AmbientLight(0xfef08a, 1.0);
      this.scene.add(amb);

      const candle = new THREE.PointLight(0xf59e0b, 2.5, 20);
      candle.position.set(3, 4, 3);
      this.scene.add(candle);
    }
  }

  createPedestal() {
    const group = new THREE.Group();

    // Wooden circular stand
    const baseGeom = new THREE.CylinderGeometry(2.8, 3.0, 0.4, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.7,
      metalness: 0.1
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = -1.4;
    base.receiveShadow = true;
    group.add(base);

    // Brass inlay trim ring
    const ringGeom = new THREE.TorusGeometry(2.82, 0.04, 16, 64);
    ringGeom.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.25
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.y = -1.2;
    group.add(ring);

    this.scene.add(group);
  }

  loadProduct(product) {
    this.currentProduct = product;

    // Remove existing model
    if (this.currentModelGroup) {
      this.scene.remove(this.currentModelGroup);
      this.currentModelGroup = null;
    }

    const group = new THREE.Group();

    switch (product.modelType) {
      case 'bottle_oil':
        this.buildOilBottle(group, product);
        break;
      case 'honey_jar':
        this.buildHoneyJar(group, product);
        break;
      case 'clay_pot_millets':
        this.buildClayPot(group, product);
        break;
      case 'heirloom_fruit':
        this.buildHeirloomFruit(group, product);
        break;
      case 'spice_mortar':
        this.buildSpiceMortar(group, product);
        break;
      case 'botanical_tin':
        this.buildBotanicalDropper(group, product);
        break;
      default:
        this.buildOilBottle(group, product);
    }

    this.currentModelGroup = group;
    this.scene.add(group);

    // Reset controls target
    if (this.controls) {
      this.controls.target.set(0, 0.5, 0);
      this.camera.position.set(0, 2.5, 8.5);
      this.controls.update();
    }
  }

  buildOilBottle(group, product) {
    // 1. Amber glass outer bottle
    const bodyGeom = new THREE.CylinderGeometry(0.9, 0.95, 3.2, 32);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x8b5a2b,
      roughness: 0.1,
      transmission: 0.88,
      thickness: 0.6,
      ior: 1.5,
      specularIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });
    const bottle = new THREE.Mesh(bodyGeom, glassMat);
    bottle.castShadow = true;
    bottle.position.y = 0.2;
    group.add(bottle);

    // 2. Liquid inside
    const liquidGeom = new THREE.CylinderGeometry(0.82, 0.86, 2.8, 32);
    const liquidMat = new THREE.MeshStandardMaterial({
      color: product.modelColor || 0xe6a817,
      roughness: 0.2,
      metalness: 0.15,
      transparent: true,
      opacity: 0.92
    });
    const liquid = new THREE.Mesh(liquidGeom, liquidMat);
    liquid.position.y = 0.05;
    group.add(liquid);

    // 3. Bottle shoulder and neck
    const shoulderGeom = new THREE.ConeGeometry(0.9, 0.8, 32);
    const shoulder = new THREE.Mesh(shoulderGeom, glassMat);
    shoulder.position.y = 2.1;
    group.add(shoulder);

    const neckGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.9, 32);
    const neck = new THREE.Mesh(neckGeom, glassMat);
    neck.position.y = 2.8;
    group.add(neck);

    // 4. Natural Cork stopper
    const corkGeom = new THREE.CylinderGeometry(0.34, 0.28, 0.5, 24);
    const corkMat = new THREE.MeshStandardMaterial({
      color: 0xc89d7c,
      roughness: 0.9,
      metalness: 0.0
    });
    const cork = new THREE.Mesh(corkGeom, corkMat);
    cork.position.y = 3.35;
    group.add(cork);

    // 5. Jute twine tie around neck
    const twineGeom = new THREE.TorusGeometry(0.35, 0.05, 12, 32);
    const twineMat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.9
    });
    const twine = new THREE.Mesh(twineGeom, twineMat);
    twine.rotation.x = Math.PI / 2;
    twine.position.y = 2.7;
    group.add(twine);

    // 6. Parchment kraft paper label
    const labelGeom = new THREE.CylinderGeometry(0.92, 0.92, 1.8, 32, 1, true, 0, Math.PI * 1.6);
    const labelMat = new THREE.MeshStandardMaterial({
      color: 0xfef9ee,
      roughness: 0.85,
      side: THREE.DoubleSide
    });
    const label = new THREE.Mesh(labelGeom, labelMat);
    label.position.y = 0.2;
    label.rotation.y = -Math.PI * 0.8;
    group.add(label);
  }

  buildHoneyJar(group, product) {
    // Hexagonal glass jar
    const jarGeom = new THREE.CylinderGeometry(1.2, 1.15, 2.2, 6);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.1,
      transmission: 0.92,
      thickness: 0.8,
      ior: 1.52,
      clearcoat: 1.0
    });
    const jar = new THREE.Mesh(jarGeom, glassMat);
    jar.position.y = -0.1;
    jar.castShadow = true;
    group.add(jar);

    // Golden honey inside
    const honeyGeom = new THREE.CylinderGeometry(1.08, 1.05, 1.9, 6);
    const honeyMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.25,
      transparent: true,
      opacity: 0.95
    });
    const honey = new THREE.Mesh(honeyGeom, honeyMat);
    honey.position.y = -0.2;
    group.add(honey);

    // Wooden lid
    const lidGeom = new THREE.CylinderGeometry(1.28, 1.28, 0.4, 6);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.8
    });
    const lid = new THREE.Mesh(lidGeom, woodMat);
    lid.position.y = 1.15;
    group.add(lid);

    // Honey dipper resting beside jar
    const dipperGroup = new THREE.Group();
    const handleGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.6, 16);
    const dipperMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.7 });
    const handle = new THREE.Mesh(handleGeom, dipperMat);
    dipperGroup.add(handle);

    for (let r = 0; r < 4; r++) {
      const ringG = new THREE.TorusGeometry(0.24 - Math.abs(r - 1.5) * 0.04, 0.07, 12, 24);
      ringG.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringG, dipperMat);
      ring.position.y = 0.8 + r * 0.18;
      dipperGroup.add(ring);
    }
    dipperGroup.rotation.z = -0.38;
    dipperGroup.position.set(1.4, 0.2, 0.5);
    group.add(dipperGroup);
  }

  buildClayPot(group, product) {
    // Terracotta earthen pot (Matka)
    const potGeom = new THREE.SphereGeometry(1.4, 32, 24);
    potGeom.scale(1, 0.85, 1);
    const clayMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.92,
      metalness: 0.05
    });
    const pot = new THREE.Mesh(potGeom, clayMat);
    pot.position.y = -0.1;
    pot.castShadow = true;
    group.add(pot);

    // Rim of clay pot
    const rimGeom = new THREE.TorusGeometry(0.75, 0.14, 16, 32);
    rimGeom.rotateX(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeom, clayMat);
    rim.position.y = 1.05;
    group.add(rim);

    // Mounded millets/grains inside
    const grainsGeom = new THREE.SphereGeometry(0.72, 24, 16);
    grainsGeom.scale(1, 0.45, 1);
    const grainsMat = new THREE.MeshStandardMaterial({
      color: product.modelColor || 0xdeb887,
      roughness: 0.95
    });
    const grains = new THREE.Mesh(grainsGeom, grainsMat);
    grains.position.y = 1.08;
    group.add(grains);

    // Miniature wooden grain scoop
    const scoopGeom = new THREE.CylinderGeometry(0.2, 0.15, 0.8, 16);
    scoopGeom.rotateZ(0.6);
    const scoopMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
    const scoop = new THREE.Mesh(scoopGeom, scoopMat);
    scoop.position.set(0.4, 1.25, 0.2);
    group.add(scoop);
  }

  buildHeirloomFruit(group, product) {
    // Suvarnarekha / Banganapalli organic mango
    const mangoGeom = new THREE.SphereGeometry(1.2, 32, 32);
    mangoGeom.scale(0.85, 1.35, 0.95);

    // Deform geometry slightly for authentic organic asymmetric fruit curve
    const pos = mangoGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      if (y > 0) {
        pos.setX(i, x + (y / 1.35) * 0.22); // Organic curvature beak
      }
    }
    mangoGeom.computeVertexNormals();

    const mangoMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.42,
      metalness: 0.05
    });
    const mango = new THREE.Mesh(mangoGeom, mangoMat);
    mango.position.y = 0.2;
    mango.rotation.z = -0.15;
    mango.castShadow = true;
    group.add(mango);

    // Stem
    const stemGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.5, 12);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x4d3826, roughness: 0.9 });
    const stem = new THREE.Mesh(stemGeom, stemMat);
    stem.position.set(0.2, 1.75, 0);
    group.add(stem);

    // Green organic leaf attached to stem
    const leafG = new THREE.PlaneGeometry(0.7, 1.4, 4, 4);
    const leafM = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.5,
      side: THREE.DoubleSide
    });
    const leaf = new THREE.Mesh(leafG, leafM);
    leaf.rotation.set(0.4, 0.6, -0.8);
    leaf.position.set(0.45, 1.7, 0.2);
    group.add(leaf);
  }

  buildSpiceMortar(group, product) {
    // Brass / stone mortar bowl
    const bowlGeom = new THREE.CylinderGeometry(1.3, 0.8, 1.4, 32);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.75,
      roughness: 0.35
    });
    const bowl = new THREE.Mesh(bowlGeom, brassMat);
    bowl.position.y = -0.4;
    bowl.castShadow = true;
    group.add(bowl);

    // Ground spice powder heap inside
    const spiceGeom = new THREE.ConeGeometry(1.1, 0.8, 32);
    const spiceMat = new THREE.MeshStandardMaterial({
      color: product.modelColor || 0xf59e0b,
      roughness: 0.98
    });
    const spice = new THREE.Mesh(spiceGeom, spiceMat);
    spice.position.y = 0.3;
    group.add(spice);

    // Pestle leaning in mortar
    const pestleGeom = new THREE.CylinderGeometry(0.22, 0.28, 2.4, 24);
    const pestle = new THREE.Mesh(pestleGeom, brassMat);
    pestle.rotation.z = 0.42;
    pestle.position.set(-0.35, 0.7, 0.1);
    group.add(pestle);
  }

  buildBotanicalDropper(group, product) {
    // Apothecary dropper bottle
    const botGeom = new THREE.CylinderGeometry(0.65, 0.65, 1.8, 32);
    const amberGlass = new THREE.MeshPhysicalMaterial({
      color: 0x78350f,
      roughness: 0.15,
      transmission: 0.85,
      thickness: 0.5
    });
    const bot = new THREE.Mesh(botGeom, amberGlass);
    bot.position.y = -0.2;
    bot.castShadow = true;
    group.add(bot);

    // Gold dropper collar
    const collarGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 32);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.2
    });
    const collar = new THREE.Mesh(collarGeom, goldMat);
    collar.position.y = 0.9;
    group.add(collar);

    // Rubber bulb teat
    const teatGeom = new THREE.SphereGeometry(0.35, 24, 24);
    teatGeom.scale(1, 1.5, 1);
    const teatMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.8
    });
    const teat = new THREE.Mesh(teatGeom, teatMat);
    teat.position.y = 1.45;
    group.add(teat);
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    if (this.controls) {
      this.controls.update();
    }

    // Auto rotate model group slowly if user isn't actively dragging
    if (this.autoRotate && this.currentModelGroup && (!this.controls || !this.controls.state || this.controls.state === -1)) {
      this.currentModelGroup.rotation.y += delta * 0.45;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Product3DViewer = Product3DViewer;
