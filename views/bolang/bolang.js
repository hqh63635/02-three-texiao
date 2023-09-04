import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Tween, update } from "three/addons/libs/tween.module.js";
// 导入水面
// import Stats from "three/addons/libs/stats.module.js";

let renderer, scene, camera, orbit;
let meshring = "";
let meshrings = [];

// 定义闪烁的颜色列表
const blinkingColors = [0xff0000, 0x00ff00];
let currentColorIndex = 0;

// 定义闪烁的间隔时间（毫秒）
const blinkInterval = 500; // 每隔0.5秒闪烁一次
let lastColorChangeTime = 0;
let mesh;

init();
animate();

function init() {
  const container = document.getElementById("container");
  const { offsetWidth, offsetHeight } = container;
  camera = new THREE.PerspectiveCamera(50, offsetWidth / offsetHeight, 1, 2e6);
  camera.name = "Camera";
  camera.position.set(1300, 1300, 1300);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();
  const loader = new THREE.TextureLoader();
  loader.load("../../assets/img/sceneBg.png", function (texture) {
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
  // orbit.object.position.set(0, 0, 1);
  // orbit.target.set(0, 0, 0);
  // orbit.addEventListener("change", render);

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
}

const geometry = new THREE.BoxGeometry(30, 30, 30);
const material = new THREE.MeshStandardMaterial({
  roughness: 0,
  color: 0x000000,
});

mesh = new THREE.Mesh(geometry, material);
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

  const currentTime = new Date().getTime();
  if (mesh) {
    if (currentTime - lastColorChangeTime >= blinkInterval) {
      // 获取当前时间
      console.log('tag', '')

      const currentColor = blinkingColors[currentColorIndex];
      mesh.material.color.setHex(currentColor);

      // 切换到下一个颜色
      currentColorIndex = (currentColorIndex + 1) % blinkingColors.length;

      // 记录颜色切换的时间
      lastColorChangeTime = currentTime;
    }
  }



  render();
  update();
  // if (meshrings.length) {
  //   // 修改圆环的scale属性
  //   for (let i = 0; i < meshrings.length; i += 1) {
  //     if (meshrings[i].scale.x < 1) {
  //       meshrings[i].scale.x += 0.03;
  //       meshrings[i].scale.y += 0.03;
  //       meshrings[i].scale.z += 0.03;
  //       meshrings[i].material.opacity = 1 - (meshrings[i].scale.x - 0.03 / 1.5);
  //     } else {
  //       meshrings[i].scale.x = 0.1;
  //       meshrings[i].scale.y = 0.1;
  //       meshrings[i].scale.z = 0.1;
  //       meshrings[i].material.opacity = 1;
  //     }
  //   }
  // }
}

const position = [
  [0, 30, 0],
  [500, 100, 0],
];

createMeshring();
function createMeshring() {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("../assets/img/clice.png");
  //创建圆圈结构
  const geometry = new THREE.RingGeometry(100, 200, 500);
  //创建材质 把读取到的图片赋给材质
  const material2 = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    map: texture,
  });
  // 传入的多点的话生成多个模型
  for (let i = 0; i < position.length; i += 1) {
    meshring = new THREE.Mesh(geometry, material2);
    meshring.rotateX(Math.PI / 2);
    meshring.scale.set(0.1, 0.1, 0.1);
    meshring.position.set(position[i][0], position[i][1], position[i][2]);
    meshrings.push(meshring);
    scene.add(meshrings[i]);
  }
}

function render() {
  const time = Date.now() * 0.01;
  renderer.render(scene, camera);
}

window.scene = scene;
