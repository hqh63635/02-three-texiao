import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { Tween, update } from "three/addons/libs/tween.module.js";
import { ParticleEngine, Tween } from '../js/ParticleEngine.js';
// 导入水面
// import Stats from "three/addons/libs/stats.module.js";

let renderer, scene, camera, orbit;
let engine;
const clock = new THREE.Clock();

init();
animate();
function init() {
  const container = document.getElementById("container");
  const { offsetWidth, offsetHeight } = container;
  camera = new THREE.PerspectiveCamera(50, offsetWidth / offsetHeight, 1, 2e6);
  camera.name = "Camera";
  // camera.position.set(1300, 1300, 1300);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();
  const loader = new THREE.TextureLoader();
  loader.load("./assets/img/sceneBg.png", function (texture) {
    scene.background = texture;
  });

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // 灯光
  const AmbientLight = new THREE.AmbientLight(0xffffff, 1.1);
  scene.add(AmbientLight);
  const HemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.8);
  scene.add(HemisphereLight);

  container.appendChild(renderer.domElement);

  orbit = new OrbitControls(camera, renderer.domElement);
  //orbit.minPolarAngle = Math.PI / 2;
  // orbit.maxPolarAngle = Math.PI / 2;
  orbit.object.position.set(12.52708454276797, 95.56496946609951, 448.89958369709285);
  // orbit.target.set(0, 0, 0);
  orbit.addEventListener("change", render);

  // 创建地板
  const planeGeo = new THREE.PlaneGeometry(900, 900);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color("#ffffff"),
    side: THREE.DoubleSide,
  });
  const planeMesh = new THREE.Mesh(planeGeo, planeMaterial);
  planeMesh.rotation.x = -Math.PI / 2;
  // scene.add(planeMesh);

  const grid = new THREE.GridHelper(3000, 100, 0x444d66, 0x2c3242);
  scene.add(grid);





  engine = new ParticleEngine();
  engine.setValues({
    positionStyle: 1,
    positionBase: new THREE.Vector3(0, 200, 0),
    positionSpread: new THREE.Vector3(600, 0, 600),

    velocityStyle: 1,
    velocityBase: new THREE.Vector3(0, -400, 0),
    velocitySpread: new THREE.Vector3(1, 1, 1),
    accelerationBase: new THREE.Vector3(0, -10, 0),

    particleTexture: new THREE.TextureLoader().load('./assets/img/raindrop2flip.png'),

    sizeBase: 8.0,
    sizeSpread: 4.0,
    colorBase: new THREE.Vector3(0.66, 1.0, 0.7), // H,S,L
    colorSpread: new THREE.Vector3(0.00, 0.0, 0.2),
    opacityBase: 0.6,

    particlesPerSecond: 1000,
    particleDeathAge: 1.0,
    emitterDeathAge: 20
  });
  const model = engine.initialize();

  scene.add(model);


}

const geometry = new THREE.BoxGeometry(30, 30, 30);
const material = new THREE.MeshStandardMaterial({
  roughness: 0,
  color: 0x000000,
});

const mesh = new THREE.Mesh(geometry, material);
mesh.position.y = 30;
scene.add(mesh);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize);


function animate() {
  requestAnimationFrame(animate);

  render();

  const delta = clock.getDelta();

  if (engine) {
    engine.update(delta);
  }
}

function render() {
  const time = Date.now() * 0.01;
  renderer.render(scene, camera);
}

window.scene = scene;
window.orbit = orbit;

