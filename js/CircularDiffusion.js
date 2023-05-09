// 方式一：图片  构建圆环扩散
function createMeshring() {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('./../img/clice.png');
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

    function render() {
        uniform.u_r.value += speed || 0.1;
        if (uniform.u_r.value >= r) {
            uniform.u_r.value = init;
        }
        requestAnimationFrame(render);
    }
    render();

    return circle;
}
