import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Tween, update } from "three/addons/libs/tween.module.js";
import { DTPointList, DTGeometry, DTTubeGeometry } from './pathForDT.js';
// 导入水面
// import Stats from "three/addons/libs/stats.module.js";

let renderer, scene, camera, orbit;
let meshring = "";
let meshrings = [];

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
  loader.load("../assets/img/sceneBg.png", function (texture) {
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
  const planeGeo = new THREE.PlaneGeometry(3000, 3000);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color("#86909c"),
    side: THREE.DoubleSide,
  });
  const planeMesh = new THREE.Mesh(planeGeo, planeMaterial);
  planeMesh.rotation.x = -Math.PI / 2;
  scene.add(planeMesh);

  const grid = new THREE.GridHelper(3000, 100, 0x444d66, 0x2c3242);
  scene.add(grid);
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
  update();
  if (meshrings.length) {
    // 修改圆环的scale属性
    for (let i = 0; i < meshrings.length; i += 1) {
      if (meshrings[i].scale.x < 1) {
        meshrings[i].scale.x += 0.03;
        meshrings[i].scale.y += 0.03;
        meshrings[i].scale.z += 0.03;
        meshrings[i].material.opacity = 1 - (meshrings[i].scale.x - 0.03 / 1.5);
      } else {
        meshrings[i].scale.x = 0.1;
        meshrings[i].scale.y = 0.1;
        meshrings[i].scale.z = 0.1;
        meshrings[i].material.opacity = 1;
      }
    }
  }
}

const points = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(50, 50, 0),
  new THREE.Vector3(100, 0, 0),
  new THREE.Vector3(200, 20, 0),
];

const pathInfo = {
  "type": "roadLight",
  "name": "光路",
  "modelToken": "GZuf_qUHWwTQHfLzuYmlz",
  "img": 0,
  "direction": "forward",
  "width": 5,
  "repeatX": 2,
  "repeatY": 1,
  "speed": 1,
  "tension": 30,
  "handles": [
    {
      "name": "point",
      "modelToken": "xYykiXafY8Cq_bekOjydY",
      "position": {
        "x": 0,
        "y": 0,
        "z": 0
      }
    },
    {
      "name": "point",
      "modelToken": "IwOEkwh5TAut8ViWs8OBG",
      "position": {
        "x": 50,
        "y": 0,
        "z": 0
      }
    },
    {
      "name": "point",
      "modelToken": "1_hmO8qHXmIqzhVuGSGDE",
      "position": {
        "x": 100,
        "y": 0,
        "z": 0
      }
    }
  ]
};

const { modelToken, img, direction, width, repeatX, repeatY, tension, handles, name, speed } =
  pathInfo;

createPipeline();
function createPipeline() {
  const lightRoad = new THREE.Object3D();
  lightRoad.fileData = {
    modelToken,
    type: 'roadLight',
    speed,
  };
  lightRoad.name = name;
  const up = new THREE.Vector3(0, 1, 0);
  const pathPointList = new DTPointList();
  pathPointList.set(points, tension, Math.ceil(tension), up, false);
  // create geometry
  // const lightGeo = new DTGeometry();
  const lightGeo = new DTTubeGeometry({
    pathPointList: pathPointList,
    options: { radius: 5 },
    usage: THREE.DynamicDrawUsage,
  });
  lightGeo.update(pathPointList, {
    radius: 5
  });

  const texture = new THREE.TextureLoader().load('../assets/img/500.jpg');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.repeat.set(repeatX / 10, repeatY);

  const lightMaterial = new THREE.MeshPhongMaterial({
    color: 0x58dede,
    depthWrite: true,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    map: texture,
  });
  const light = new THREE.Mesh(lightGeo, lightMaterial);
  light.name = 'Light';
  light.fileData = {
    // modelToken: lineModelToken || nanoid(),
    type: 'lineLight',
    layoutType: 'lineLight',
  };
  light.position.y = handles[0].position.y;
  lightRoad.add(light);
  scene.add(lightRoad);
}

function render() {
  const time = Date.now() * 0.01;
  renderer.render(scene, camera);
  scene.children.forEach((model) => {
    if (model.fileData?.type === 'roadLight') {
      model.traverse((child) => {
        if (child.isMesh && child.name === 'Light') {
          const speed = model.fileData.speed / 1000 || 0.001;
          child.material.map.offset.x -= speed;
        }
      });
    }
  });
}

addClick();
function addClick() {
  var raycaster = new THREE.Raycaster();//光线投射，用于确定鼠标点击位置
  var mouse = new THREE.Vector2();//创建二维平面
  window.addEventListener("mousedown", mousedown);//页面绑定鼠标点击事件
  //点击方法
  function mousedown(e) {
    //将html坐标系转化为webgl坐标系，并确定鼠标点击位置
    mouse.x = e.clientX / renderer.domElement.clientWidth * 2 - 1;
    mouse.y = -(e.clientY / renderer.domElement.clientHeight * 2) + 1;
    //以camera为z坐标，确定所点击物体的3D空间位置
    raycaster.setFromCamera(mouse, camera);
    //确定所点击位置上的物体数量
    var intersects = raycaster.intersectObjects(scene.children);
    //选中后进行的操作
    if (intersects.length) {
      console.log(intersects[0]);
      points.push(intersects[0].point)
      window.addEventListener('mousemove', onMouseMove);
    }
  }
}

function onMouseMove(e) {
  var raycaster = new THREE.Raycaster();//光线投射，用于确定鼠标点击位置
  // console.log(event);
  var mouse = new THREE.Vector2();//创建二维平面
  mouse.x = e.clientX / renderer.domElement.clientWidth * 2 - 1;
  mouse.y = -(e.clientY / renderer.domElement.clientHeight * 2) + 1;
  //以camera为z坐标，确定所点击物体的3D空间位置
  raycaster.setFromCamera(mouse, camera);
  //确定所点击位置上的物体数量
  var intersects = raycaster.intersectObjects(scene.children);
  //选中后进行的操作
  if (intersects.length) {
    console.log('onMouseMove', intersects[0]);
    points.push(intersects[0].point)
  }
}
window.scene = scene;
