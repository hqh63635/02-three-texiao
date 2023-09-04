import * as THREE from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { Water } from "three/addons/objects/Water.js";

let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;
let renderer, scene, camera, orbit;
let clock = new THREE.Clock();
const modelMap = {};
let water;
let box;
let selectionBox;
const mouse = new THREE.Vector2(); // 鼠标
const intersectsObjs = []; // 存放可选中模型
const raycaster = new THREE.Raycaster();
const wheels = [];

init();
animate();
window.addEventListener('resize', onWindowResize, false);

function init() {
  initRenderer();
  initScene();
  initCamera();
  initControls();
  initLights();
  createWater();
  loadModel().then(() => {
    // camera.lookAt(modelMap['scene'].position);
  });
}

function initRenderer() {
  var container = document.getElementById('container');
  const { offsetWidth, offsetHeight } = container;
  renderer = new THREE.WebGLRenderer({ antialias: true }); //alpha: true, logarithmicDepthBuffer: true
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.setSize(WIDTH, HEIGHT);
  container.appendChild(renderer.domElement);

  container.addEventListener('mousedown', onMouseDown, false);
}

function initScene() {
  scene = new THREE.Scene();
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  cubeTextureLoader.setPath('./imgs/');
  let cubeTexture = cubeTextureLoader.load([
    'Epic_BlueSunset_Cam_2_Left+X.png', 'Epic_BlueSunset_Cam_3_Right-X.png',
    'Epic_BlueSunset_Cam_4_Up+Y.png', 'Epic_BlueSunset_Cam_5_Down-Y.png',
    'Epic_BlueSunset_Cam_0_Front+Z.png', 'Epic_BlueSunset_Cam_1_Back-Z.png'
  ]);
  scene.background = cubeTexture;

  // const loader = new THREE.TextureLoader();
  // loader.load("../assets/img/sceneBg.png", function (texture) {
  //   scene.background = texture;
  // });

  //加载hdr
  new RGBELoader()
    .setPath('./imgs/')
    .load('kloppenheim_12.hdr', function (texture) {

      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;

    });
  window.scene = scene;
}

function initCamera() {
  camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 2e6);
  // 确定相机位置 并将相机指向场景中心
  camera.position.x = 0;
  camera.position.y = 1;
  camera.position.z = -6;
  // camera.position.set(1300, 1300, 1300);
  // camera.lookAt(new THREE.Vector3(0,1,0));
}

function initControls() {
  orbit = new OrbitControls(camera, renderer.domElement);
  // 使动画循环使用时阻尼或自转 意思是否有惯性
  orbit.enableDamping = true;
  //动态阻尼系数 就是鼠标拖拽旋转灵敏度
  //controls.dampingFactor = 0.25;
  //是否可以缩放
  orbit.enableZoom = true;
  //是否自动旋转
  // orbitcontrols.autoRotate = true;
  // orbitcontrols.autoRotateSpeed = 0.5;
  //设置相机距离原点的最远距离
  orbit.minDistance = 1000;
  //设置相机距离原点的最远距离
  orbit.maxDistance = 4485;
  //是否开启右键拖拽
  orbit.enablePan = false;
  orbit.maxPolarAngle = Math.PI / 2 - 0.05
  orbit.target = new THREE.Vector3(0, 1, 0);
  orbit.object.position.set(-119.90658901905418, 622.2478652765882, -2213.934701702712);
  window.orbit = orbit;
  // orbit.addEventListener("change", animate);
  // orbitcontrols.addEventListener('change', printPosition);
}

function initLights() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.5))

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.7)
  dirLight.position.set(- 60, 100, 100);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 50;
  dirLight.shadow.camera.bottom = - 50;
  dirLight.shadow.camera.left = - 50;
  dirLight.shadow.camera.right = 50;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  scene.add(dirLight);
}

function onWindowResize() {
  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  // stats.update();
  if (orbit) orbit.update()

  let mixerUpdateDelta = clock.getDelta();
  requestAnimationFrame(animate);
  water.material.uniforms["time"].value += 1.0 / 60.0;
  renderer.render(scene, camera);
  run();
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
        intersectsObjs.push(object.scene)
        findWheels(object.scene);
        resolve();
      });
    }
    // 辅助包围盒
    box = new THREE.Box3();
    selectionBox = new THREE.BoxHelper();
    selectionBox.material.depthTest = false;
    selectionBox.material.transparent = true;
    selectionBox.visible = false;
    scene.add(selectionBox);
  });
}

function createWater() {
  // 添加水效果
  const waterGeometry = new THREE.PlaneGeometry(20000, 20000);

  water = new Water(waterGeometry, {
    textureWidth: 5120,
    textureHeight: 5120,
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

function onMouseDown(event) {
  event.stopPropagation();
  mouse.x = (event.clientX / container.offsetWidth) * 2 - 1;
  mouse.y = -(event.clientY / container.offsetHeight) * 2 + 1;

  handleClick(event)
}

// 模型鼠标点击选中方法
function handleClick(event) {
  selectionBox.visible = false;
  const mouseVector = new THREE.Vector3();
  const x = (event.offsetX / container.offsetWidth) * 2 - 1;
  const y = -(event.offsetY / container.offsetHeight) * 2 + 1;
  // const x = (event.layerX / container.offsetWidth) * 2 - 1;
  // const y = -(event.layerY / container.offsetHeight) * 2 + 1;
  mouseVector.set(x, y, 0.5);
  raycaster.setFromCamera(mouseVector, camera);
  const intersects = raycaster.intersectObjects(intersectsObjs, true);
  if (intersects.length > 0) {
    const model = intersects[0].object;
    box.setFromObject(model);
    console.log('model', model);
    if (box.isEmpty() === false) {
      selectionBox.setFromObject(model);
      selectionBox.visible = true;
    }
  }
}


function run() {
  if (modelMap['scene']) {
    // console.log(wheels);
    const time2 = - performance.now() / 1000;
    for (let i = 0; i < wheels.length; i++) {

      if (wheels[i].name === 'Base_690' || wheels[i].name === 'Base_693') {
        wheels[i].rotation.z = time2 * Math.PI * 2;
      } else if (wheels[i].name === 'Base_685') {
        wheels[i].rotation.z = -time2 * Math.PI * 2;
      } else {
        wheels[i].rotation.z = -time2 * Math.PI * 2;
      }


    }
    // modelMap['scene'].position.x += 1;
  }
}

function findMesh(model, name) {
  let result;
  model.traverse((child) => {
    if (child.name === name) {
      result = child;
    }
  });
  return result;
}

function findWheels(model) {
  wheels.splice(0);
  const wheelNameArr = ['Base_684', 'Base_685', 'Base_687', 'Base_690', 'Base_693'];
  wheelNameArr.forEach((m) => {

    if (m === 'Base_685') {
      const obj = findMesh(model, m);

      const wrapper = new THREE.Object3D(); // 存放目标模型
      const prevModel = obj.parent;

      const box = new THREE.Box3().setFromObject(obj); // 获取模型的包围盒
      const mdlen = box.max.x - box.min.x; // 模型长度
      const mdwid = box.max.z - box.min.z; // 模型宽度
      const mdhei = box.max.y - box.min.y; // 模型高度
      const x1 = box.min.x + mdlen / 2; // 模型中心点坐标X
      const y1 = box.min.y + mdhei / 2; // 模型中心点坐标Y
      const z1 = box.min.z + mdwid / 2; // 模型中心点坐标Z
      const center = {
        x: x1,
        y: y1,
        z: z1,
      };
      // 指定旋转中心位置:
      const rotatePosX = center.x;
      const rotatePosY = center.y;
      const rotatePosZ = center.z;

      console.log(model, center)
      wrapper.position.set(
        center.x - rotatePosX + obj.position.x,
        center.y - rotatePosY + obj.position.y,
        center.z - rotatePosZ + obj.position.z
      );
      obj.position.set(-center.x + rotatePosX, -center.y + rotatePosY, -center.z + rotatePosZ);
      obj.parentBoundingBoxState = true;

      wrapper.name = obj.name;
      obj.name = `${obj.name}_Origin`;

      wrapper.add(obj);
      prevModel.add(wrapper);
      // wheels.push(prevModel);
    } else {
      wheels.push(findMesh(model, m));
    }
  })
}
// water.material.uniforms.size.value = 0.1;