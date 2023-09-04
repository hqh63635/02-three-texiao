// 导入水面
import { Water } from "three/examples/jsm/objects/Water2";

// 构建水面
function createWater() {
  // 添加水效果
  const waterGeometry = new THREE.PlaneGeometry(20000, 20000);

  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "../resource/THREEJS/examples/textures/waternormals.jpg",
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

export default createWater;
