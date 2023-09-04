import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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

