import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Tween, update } from "three/addons/libs/tween.module.js";
// 导入水面
import { Water } from "three/addons/objects/Water.js";
import THREEx from "./keyboardState.js";

// import Stats from "three/addons/libs/stats.module.js";

let renderer, scene, camera, orbit;
let water;
const modelMap = {};

init();
createWater();
// animate();

function init() {
  const container = document.getElementById("container");
  const { offsetWidth, offsetHeight } = container;
  camera = new THREE.PerspectiveCamera(50, offsetWidth / offsetHeight, 1, 2e6);
  camera.name = "Camera";
  camera.position.set(1300, 1300, 18);
  camera.position.z = 18;
  // camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();
  const loader = new THREE.TextureLoader();
  loader.load("../assets/img/sceneBg.png", function (texture) {
    scene.background = texture;
  });

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
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
  orbit.addEventListener("change", render);

  // 创建地板
  // const planeGeo = new THREE.PlaneGeometry(900, 900);
  // const planeMaterial = new THREE.MeshLambertMaterial({
  //   color: new THREE.Color("#ffffff"),
  //   side: THREE.DoubleSide,
  // });
  // const planeMesh = new THREE.Mesh(planeGeo, planeMaterial);
  // planeMesh.rotation.x = -Math.PI / 2;
  // scene.add(planeMesh);

  const grid = new THREE.GridHelper(3000, 100, 0x444d66, 0x2c3242);
  scene.add(grid);

  loadModel().then(() => {
    tick();
  });

}

function loadModel() {
  return new Promise((resolve, reject) => {
    const mtlArr = ['scene'];
    for (let i = 0; i < mtlArr.length; i += 1) {
      //  加载模型
      const loader = new GLTFLoader().setPath(`../model/`);
      loader.load(`${mtlArr[i]}.gltf`, function (object) {
        console.log("模型：", object.scene);
        modelMap[mtlArr[i]] = object.scene;
        object.scene.traverse((child) => {
          if (child.isMesh) {
            child.material.depthWrite = true;
          }
        });
        scene.add(object.scene);
        resolve();
      });
    }
  });
}

function createWater() {
  // 添加水效果
  const waterGeometry = new THREE.PlaneGeometry(20000, 20000);

  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "../assets/img/waternormals.jpg",
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 10,
    fog: scene.fog !== undefined,
  });
  water.position.y = -10;
  water.rotation.x = -Math.PI / 2;
  scene.add(water);
}
water.material.uniforms.size.value = 0.1;

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize);

function animate() {
  requestAnimationFrame(animate);

  render();
  update();
  water.material.uniforms["time"].value += 1.0 / 60.0;
}

function render() {
  const time = Date.now() * 0.01;

  renderer.render(scene, camera);
}

// 控制代码
const keyboard = new THREEx.KeyboardState();
const clock = new THREE.Clock();

const tick = () => {

  const delta = clock.getDelta();

  const moveDistance = 5 * delta;
  const rotateAngle = Math.PI / 2 * delta;

  if (keyboard.pressed("down"))
    modelMap['scene'].translateZ(moveDistance);
  if (keyboard.pressed("up"))
    modelMap['scene'].translateZ(-moveDistance);
  if (keyboard.pressed("left"))
    modelMap['scene'].translateX(-moveDistance);
  if (keyboard.pressed("right"))
    modelMap['scene'].translateX(moveDistance);

  if (keyboard.pressed("w"))
    modelMap['scene'].rotateOnAxis(new THREE.Vector3(1, 0, 0), rotateAngle);
  if (keyboard.pressed("s"))
    modelMap['scene'].rotateOnAxis(new THREE.Vector3(1, 0, 0), -rotateAngle);
  if (keyboard.pressed("a"))
    modelMap['scene'].rotateOnAxis(new THREE.Vector3(0, 1, 0), rotateAngle);
  if (keyboard.pressed("d"))
    modelMap['scene'].rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotateAngle);

  const relativeCameraOffset = new THREE.Vector3(0, 5, 10);

  // console.log(modelMap['scene']);
  
  const cameraOffset = relativeCameraOffset.applyMatrix4(modelMap['scene'].matrixWorld);

  // camera.position.x = cameraOffset.x;
  // camera.position.y = cameraOffset.y;
  // camera.position.z = cameraOffset.z;

  orbit.target = modelMap['scene'].position;
  camera.lookAt(modelMap['scene'].position);

  orbit.update();

  renderer.render(scene, camera)

  window.requestAnimationFrame(tick)
}

