import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Tween, update } from "three/addons/libs/tween.module.js";
// 导入水面
import { Water } from "three/addons/objects/Water2.js";

// import Stats from "three/addons/libs/stats.module.js";

let renderer, scene, camera, orbit;
let water;

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
  // orbit.object.position.set(0, 0, 1);
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
  scene.add(planeMesh);

  const grid = new THREE.GridHelper(3000, 100, 0x444d66, 0x2c3242);
  scene.add(grid);
  //   //  加载模型
  //   const loader = new GLTFLoader().setPath(`./models/`);
  //   loader.load("zhengchang.gltf", function (object) {
  //     console.log("模型：", object.scene);
  //     modelMap["zhengchang.gltf"] = object.scene;
  //     object.scene.traverse((child) => {
  //       if (child.isMesh) {
  //         child.material.depthWrite = true;
  //       }
  //     });
  //     scene.add(object.scene);

  //     // 将模型的中心点设置到canvas坐标系的中心点，保证模型显示是居中的
  //     const box = new THREE.Box3().setFromObject(modelMap["zhengchang.gltf"]); // 获取模型的包围盒
  //     const mdlen = box.max.x - box.min.x; // 模型长度
  //     const mdwid = box.max.z - box.min.z; // 模型宽度
  //     const mdhei = box.max.y - box.min.y; // 模型高度
  //     const x1 = box.min.x + mdlen / 2; // 模型中心点坐标X
  //     const y1 = box.min.y + mdhei / 2; // 模型中心点坐标Y
  //     const z1 = box.min.z + mdwid / 2; // 模型中心点坐标Z
  //     // model.position.set(-x1, -y1, -z1);
  //     // 进入视角为黄金比例视角
  //     const diagonal = Math.sqrt(
  //       Math.sqrt(mdlen ** 2 + mdwid ** 2) ** 2 + mdhei ** 2
  //     ); // 获取最长边的长度,
  //     orbit.object.position.set(
  //       box.max.x + diagonal / 2,
  //       mdhei * 2,
  //       box.max.z + diagonal / 2
  //     ); // 设置相机位置
  //     orbit.target.set(x1, y1, z1); // 设置相机的视角方向，看向模型的中心点
  //     orbit.update(); // 更新相机

  //     camera.aspect = window.innerWidth / window.innerHeight;
  //     camera.updateProjectionMatrix();
  //     render();
  //   });

  //   window.addEventListener("resize", onWindowResize);
}

createWater();

function createWater() {
  // 添加水效果
  const waterGeometry = new THREE.PlaneGeometry(20000, 20000);

  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "./assets/img/Water_1_M_Flow.jpg",
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 5,
    fog: scene.fog !== undefined,
  });
  water.position.y = -10;
  water.rotation.x = -Math.PI / 2;
  scene.add(water);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize);

function animate() {
  requestAnimationFrame(animate);

  render();
  update();
  if (water) {
    // water.material.uniforms["time"].value += 1.0 / 60.0;
  }
}

function render() {
  const time = Date.now() * 0.01;

  renderer.render(scene, camera);
}
