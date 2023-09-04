import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import {CharacterControls} from './CharacterControls'
import Stats from 'three/examples/jsm/libs/stats.module.js';

var WIDTH = window.innerWidth;
	var HEIGHT = window.innerHeight;
	var renderer, scene, camera, orbitcontrols, stats, gui;
	var cubeTexture;
	var clock = new THREE.Clock();
	var characterControls;
	//保存按键wasd的
	const keysPressed = {}
	// const keyDisplayQueue = new KeyDisplay();



init();
animate();
window.addEventListener('resize', onWindowResize, false);

document.addEventListener('keydown', (event) => {
    // keyDisplayQueue.down(event.key)
    if (event.shiftKey && characterControls) {
        characterControls.switchRunToggle()
    } else {
        keysPressed[event.key.toLowerCase()] = true
        // console.log(keysPressed)

    }
}, false);
document.addEventListener('keyup', (event) => {
    // keyDisplayQueue.up(event.key);
    keysPressed[event.key.toLowerCase()] = false
    // console.log(keysPressed)
}, false);


function init() {
    // initStats()
    initRenderer();
    initScene();
    initLights();
    initCamera();
    initControls();
    // initHelp();
    generateFloor();
    initGlb();
}


function initStats() {
    stats = new Stats();
    document.body.appendChild(stats.dom);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
}

function initRenderer() {
    var container = document.getElementById('container');
    renderer = new THREE.WebGLRenderer({antialias: true}); //alpha: true, logarithmicDepthBuffer: true
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true
    renderer.setSize(WIDTH, HEIGHT);
    container.appendChild(renderer.domElement);
}

function initScene() {
    scene = new THREE.Scene();
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    cubeTextureLoader.setPath( './imgs/' );
    let cubeTexture = cubeTextureLoader.load( [
        'Epic_BlueSunset_Cam_2_Left+X.png', 'Epic_BlueSunset_Cam_3_Right-X.png',
        'Epic_BlueSunset_Cam_4_Up+Y.png', 'Epic_BlueSunset_Cam_5_Down-Y.png',
        'Epic_BlueSunset_Cam_0_Front+Z.png', 'Epic_BlueSunset_Cam_1_Back-Z.png'
    ] );
    scene.background = cubeTexture;

    //加载hdr
    new RGBELoader()
    .setPath( './imgs/' )
    .load( 'kloppenheim_12.hdr', function ( texture ) {

        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;

    } );            
}

function initCamera() {
    camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 1000);
    // 确定相机位置 并将相机指向场景中心
    camera.position.x = 0;
    camera.position.y = 1;
    camera.position.z = -6;
    // camera.lookAt(new THREE.Vector3(0,1,0));
}

function initControls() {
    orbitcontrols = new OrbitControls(camera, renderer.domElement);
    // 使动画循环使用时阻尼或自转 意思是否有惯性
    orbitcontrols.enableDamping = true;
    //动态阻尼系数 就是鼠标拖拽旋转灵敏度
    //controls.dampingFactor = 0.25;
    //是否可以缩放
    orbitcontrols.enableZoom = true;
    //是否自动旋转
    // orbitcontrols.autoRotate = true;
    // orbitcontrols.autoRotateSpeed = 0.5;
    //设置相机距离原点的最远距离
    orbitcontrols.minDistance = 5;
    //设置相机距离原点的最远距离
    orbitcontrols.maxDistance = 15
    //是否开启右键拖拽
    orbitcontrols.enablePan = false;
    orbitcontrols.maxPolarAngle = Math.PI / 2 - 0.05
    orbitcontrols.target =new THREE.Vector3(0,1,0)
    // orbitcontrols.addEventListener('change', printPosition);
}

function printPosition() {
    console.info("X=" + camera.position.x);
    console.info("Y=" + camera.position.y);
    console.info("Z=" + camera.position.z);
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

function initHelp() {
    //AxisHelper是一个坐标轴对象，添加到场景中我们就可以看到世界坐标系的具体位置
    var axes = new THREE.AxesHelper(10000);
    scene.add(axes);
}

function onError() {
    alert("报错了");
}

/**
 * 加载地板
 */
function generateFloor() {
    // TEXTURES
    const textureLoader = new THREE.TextureLoader();
    const sandBaseColor = textureLoader.load("./imgs/Sand 002_COLOR.jpg");
    const sandNormalMap = textureLoader.load("./imgs/Sand 002_NRM.jpg");
    const sandHeightMap = textureLoader.load("./imgs/Sand 002_DISP.jpg");
    const sandAmbientOcclusion = textureLoader.load("./imgs/Sand 002_OCC.jpg");

    const WIDTH = 320
    const LENGTH = 320

    const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 1024, 1024);
    geometry.setAttribute("uv2",new THREE.BufferAttribute(geometry.attributes.uv.array,2))
    const material = new THREE.MeshStandardMaterial(
            {
                map: sandBaseColor,
                normalMap: sandNormalMap,
                // roughnessMap: sandRoughnessMap,
                displacementMap: sandHeightMap,  //置换
                displacementScale: 0.1,
                aoMap: sandAmbientOcclusion
            })
    wrapAndRepeatTexture(material.map)
    wrapAndRepeatTexture(material.normalMap)
    wrapAndRepeatTexture(material.displacementMap)
    wrapAndRepeatTexture(material.aoMap)

    // const material = new THREE.MeshPhongMaterial({ map: placeholder})

    const floor = new THREE.Mesh(geometry, material)
    floor.receiveShadow = true
    floor.rotation.x = - Math.PI / 2
    scene.add(floor)
}

function wrapAndRepeatTexture (map) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.x = map.repeat.y = 30
}

/**
 * 加载机器人
 */
function initGlb(){
    const loader = new GLTFLoader();
    loader.load('model/Soldier.glb', function (gltf) {
        const model = gltf.scene;
        model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
        });
        model.rotation.y+=Math.PI
        scene.add(model);
        const gltfAnimations = gltf.animations;
        const mixer = new THREE.AnimationMixer(model);
        const animationsMap = new Map()
        gltfAnimations.filter(a => a.name != 'TPose').forEach((a) => {
            animationsMap.set(a.name, mixer.clipAction(a))
        })
        characterControls = new CharacterControls(model, mixer, animationsMap, orbitcontrols, camera,  'Idle'); //Idle
    })
}

function onWindowResize() {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    // stats.update();
    if(orbitcontrols) orbitcontrols.update()

    let mixerUpdateDelta = clock.getDelta();
    if (characterControls) {
        characterControls.update(mixerUpdateDelta, keysPressed);
    }
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}


