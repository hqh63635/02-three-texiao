import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// 配置项和常量
const container = document.getElementById("container");
const DEFAULT_CAMERA_POSITION = [12.53, 95.56, 448.90];

let renderer, scene, camera, orbit;
let engine;
const clock = new THREE.Clock();

// 初始化函数
function init() {
  const { offsetWidth, offsetHeight } = container;
  camera = createCamera(offsetWidth, offsetHeight);
  scene = createScene();
  renderer = createRenderer();

  // ... 其他初始化代码 ...

  // 添加到容器
  container.appendChild(renderer.domElement);

  // 创建模型
  const mesh = createMesh();
  scene.add(mesh);

  // 事件监听
  window.addEventListener("resize", onWindowResize);

  // 全局变量
  window.scene = scene;
  window.orbit = orbit;
}

// 创建相机
function createCamera(width, height) {
  const camera = new THREE.PerspectiveCamera(50, width / height, 1, 2e6);
  camera.name = "Camera";
  camera.lookAt(0, 0, 0);
  camera.position.set(...DEFAULT_CAMERA_POSITION);
  return camera;
}

// 创建场景
function createScene() {
  const scene = new THREE.Scene();
  // ... 添加其他场景元素 ...
  return scene;
}

// 创建渲染器
function createRenderer() {
  const renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  return renderer;
}

// 创建模型
function createMesh() {
  const geometry = new THREE.BoxGeometry(30, 30, 30);
  const material = new THREE.MeshStandardMaterial({
    roughness: 0,
    color: 0x000000,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 30;
  return mesh;
}

// 窗口大小改变事件处理函数
function onWindowResize() {
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

// 主循环
function animate() {
  requestAnimationFrame(animate);
  render();
  const delta = clock.getDelta();
  if (engine) {
    engine.update(delta);
  }
}

// 渲染函数
function render() {
  const time = Date.now() * 0.01;
  renderer.render(scene, camera);
}

init();
animate();
