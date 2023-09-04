import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { Tween, update } from "three/addons/libs/tween.module.js";
import { ParticleEngine, Tween } from './ParticleEngine.js';
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
  // loader.load("./assets/img/sceneBg.png", function (texture) {
  //   scene.background = texture;
  // });

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // 灯光
  // const AmbientLight = new THREE.AmbientLight(0xffffff, 1.1);
  // scene.add(AmbientLight);
  // const HemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.8);
  // scene.add(HemisphereLight);

  var light = new THREE.PointLight(0xffffff);
  light.position.set(0, 250, 0);
  scene.add(light);

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

  var skyBoxGeometry = new THREE.BoxGeometry(4000, 4000, 4000);
  var skyBoxMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.BackSide,
  });
  var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
  scene.add(skyBox);





  engine = new ParticleEngine();
  engine.setValues({
    positionStyle: 1, // 默认为1
    positionBase: new THREE.Vector3(100, 0, 0), // 位置
    positionSpread: new THREE.Vector3(200, 200, 0), // 范围

    // 速度
    velocityStyle: 1,
    velocityBase: new THREE.Vector3(0, 150, 0), // 偏向
    velocitySpread: new THREE.Vector3(80, 50, 80),
    accelerationBase: new THREE.Vector3(0, -10, 0),

    particleTexture: new THREE.TextureLoader().load('../../assets/img/smokeparticle.png'),

    angleBase: 0,
    angleSpread: 720,
    angleVelocityBase: 0,
    angleVelocitySpread: 720,

    sizeTween: new Tween([0, 1], [32, 128]),
    opacityTween: new Tween([0.8, 2], [0.5, 0]),
    colorTween: new Tween([0.4, 1], [new THREE.Vector3(0, 0, 0.2), new THREE.Vector3(0, 0, 0.5)]),

    particlesPerSecond: 400,
    particleDeathAge: 2.0,
    emitterDeathAge: Infinity, // 频次
    positionStyle: 1,
    //     positionBase: new THREE.Vector3(-100, 100, 0),
    //     positionSpread: new THREE.Vector3(0, 50, 60),

    //     velocityStyle: 1,
    //     velocityBase: new THREE.Vector3(40, 0, 0),
    //     velocitySpread: new THREE.Vector3(20, 0, 0),

    //     particleTexture:  new THREE.TextureLoader().load('./assets/img/smokeparticle.png'),

    //     sizeBase: 80.0,
    //     sizeSpread: 100.0,
    //     colorBase: new THREE.Vector3(0.0, 0.0, 1.0), // H,S,L
    //     opacityTween: new Tween([0, 1, 4, 5], [0, 1, 1, 0]),

    //     particlesPerSecond: 50,
    //     particleDeathAge: 10.0,
    //     emitterDeathAge: 60
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

