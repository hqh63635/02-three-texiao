import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Tween, update } from "three/addons/libs/tween.module.js";
// 导入水面
// import Stats from "three/addons/libs/stats.module.js";

let renderer, scene, camera, orbit;
let modelMap = {};

init();

animate();

scatterCircle(200, 100, 50, new THREE.Color("#000000"), 0.1).then((res) => {
  console.log(res);
  modelMap.circle = res.model;
  scene.add(res.model);
});

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
  // scene.add(planeMesh);

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
}

function render() {
  const time = Date.now() * 0.01;
  renderer.render(scene, camera);

  if (modelMap.circle && modelMap.circle.material && modelMap.circle.material) {
    // console.log(modelMap.circle.material.uniforms);
    modelMap.circle.material.uniforms.u_r.value += 1;
    if (modelMap.circle.material.uniforms.u_r.value >= 100) {
      modelMap.circle.material.uniforms.u_r.value = 1;
    }
  }
}

// 方式二：shaderMaterial
/**
 * 圆环扩散光波
 * @param {*} r ：圆半径
 * @param {*} init ：初始圆半径
 * @param {*} ring ：圆环大小
 * @param {*} color ：颜色 THREE.Vector3
 * @param {*} speed ：速度
 * @returns
 */
function scatterCircle(r, init, ring, color, speed) {
  return new Promise((resolve) => {
    const uniform = {
      u_color: { value: color },
      u_r: { value: init },
      u_ring: {
        value: ring,
      },
    };

    const vs = `
            varying vec3 vPosition;
            void main(){
                vPosition=position;
                gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    const fs = `
            varying vec3 vPosition;
            uniform vec3 u_color;
            uniform float u_r;
            uniform float u_ring;
    
            void main(){
                float pct=distance(vec2(vPosition.x,vPosition.y),vec2(0.0));
                if(pct>u_r || pct<(u_r-u_ring)){
                    gl_FragColor = vec4(1.0,0.0,0.0,0);
                }else{
                    float dis=(pct-(u_r-u_ring))/(u_r-u_ring);
                    gl_FragColor = vec4(u_color,dis);
                }
            }
        `;
    const geometry = new THREE.CircleGeometry(r, 120);
    const material = new THREE.ShaderMaterial({
      vertexShader: vs,
      fragmentShader: fs,
      side: THREE.DoubleSide,
      uniforms: uniform,
      transparent: true,
      depthWrite: false,
    });

    const circle = new THREE.Mesh(geometry, material);
    circle.name = "circle";
    circle.position.set(100, 100, 100);
    circle.rotateX(Math.PI / 2);
    resolve({ model: circle });
  });
}

window.scene = scene;
