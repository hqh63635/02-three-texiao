// 构建飞线：方式一 =》 几何属性
function createFLyLines(pointsList, colors) {
    const geometry = new THREE.BufferGeometry(); //创建一个缓冲类型几何体
    // 三维样条曲线
    // const pointsList = [];
    const range = 5000;
    // for (let index = 0; index < 10; index++) {
    //     pointsList.push(new THREE.Vector3(Math.random() * range - range / 2, Math.random() * range - range / 2, Math.random() * range - range / 2));
    // }
    const curve = new THREE.CatmullRomCurve3(pointsList);
    //曲线上等间距返回多个顶点坐标
    const clip = 10000;
    const speed = 50;
    const points = curve.getSpacedPoints(clip); //分段数100，返回101个顶点
    // setFromPoints方法从points中提取数据赋值给attributes.position
    geometry.setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: colors, //轨迹颜色
        transparent: true, //是否透明
        opacity: 0.0, //透明度
    });
    //线条模型对象
    const line = new THREE.Line(geometry, material);
    line.visible = false;
    scene.add(line);

    let index = 200; //取点索引位置
    const num = 2000; //从曲线上获取点数量
    const points2 = points.slice(index, index + num); //从曲线上获取一段
    const geometry2 = new THREE.BufferGeometry();
    geometry2.setFromPoints(points2);

    // 批量计算所有顶点颜色数据
    const posNum = points2.length - 2; //分界点黄色，两端和轨迹线一个颜色青色
    const colorArr = [];
    for (let i = 0; i < points2.length; i++) {
        const color1 = new THREE.Color(colors); //轨迹线颜色 青色
        const color2 = new THREE.Color(colors); //黄色
        let color = null;
        // 飞线段里面颜色设置为黄色，两侧设置为青色，也就是说中间某个位置向两侧颜色渐变
        if (i < posNum) {
            color = color1.lerp(color2, i / posNum);
        } else {
            color = color2.lerp(color1, (i - posNum) / (points2.length - posNum));
        }
        colorArr.push(color.r, color.g, color.b);
    }
    // 设置几何体顶点颜色数据
    geometry2.attributes.color = new THREE.BufferAttribute(new Float32Array(colorArr), 3);

    const material2 = new THREE.LineBasicMaterial({
        color: colors, //轨迹颜色
        vertexColors: THREE.VertexColors, // 使用顶点颜色，不用设置color
        linewidth: 3.0, // 设置线宽
    });
    //线条模型对象
    const line2 = new THREE.Line(geometry2, material2);
    scene.add(line2);

    function move() {
        requestAnimationFrame(move);
        let movedLineGeom = line2.geometry;
        if (index > clip) {
            index = 0;
        }
        let id = Math.ceil((index += speed));
        let pointsList = points.slice(id, id + num); //从曲线上获取一段
        movedLineGeom && movedLineGeom.setFromPoints(pointsList);
        movedLineGeom.attributes.position.needsUpdate = true;
    }
    move();
}

// 构建飞线：方式二 =》 材质纹理偏移
function createFlyLinesForMaterial(pointsList, color) {
    // 三维样条曲线
    // const pointsList = [];
    const range = 5000;
    // for (let index = 0; index < 10; index++) {
    //     pointsList.push(new THREE.Vector3(Math.random() * range - range / 2, Math.random() * range - range / 2, Math.random() * range - range / 2));
    // }
    let closedSpline = new THREE.CatmullRomCurve3(pointsList);
    closedSpline.type = 'catmullrom';
    closedSpline.closed = false;
    closedSpline.tension = 0.5;
    const geometry = new THREE.TubeGeometry(closedSpline, 1000, 2, 8, false);
    const texture = new THREE.TextureLoader().load('./../img/b2.png');
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // anisotropy： 沿通过具有最高纹理像素密度的像素的坐标轴取样的数量。默认情况下，此值为1.较高的值会产生比基本mipmap更少的模糊结果，但需要使用更多纹理样本。使用renderer.getMaxAnisotropy()来查找GPU的最大有效各向异性值; 这个值通常是2的幂
    texture.repeat.set(2, 1);
    const material = new THREE.MeshBasicMaterial({
        color: color,
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let value = 0;
    function move() {
        requestAnimationFrame(move);
        value -= 0.005; // 偏移的方向和速度
        mesh.material.map.offset.set(value, 0);
    }
    move();
}

// 构建飞线：方式三 =》 shaderMaterial
function createFlyLinesForShader(pointsList, color) {
    // const pointsList = [];
    const range = 5000;
    // for (let index = 0; index < 10; index++) {
    //     pointsList.push(new THREE.Vector3(Math.random() * range - range / 2, Math.random() * range - range / 2, Math.random() * range - range / 2));
    // }
    let closedSpline = new THREE.CatmullRomCurve3(pointsList);
    const points = closedSpline.getPoints(1000);

    const indexList = [];
    const positionList = [];
    points.forEach((item, index) => {
        indexList.push(index);
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setAttribute('aIndex', new THREE.Float32BufferAttribute(indexList, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uColor: {
                value: new THREE.Color(color),
            },
            uTime: {
                value: 0,
            },
            uLength: {
                value: points.length,
            },
        },
        vertexShader: `
            attribute float aIndex;
            uniform float uTime;
            uniform vec3 uColor;
            varying float vSize;
            void main(){
                vec4 viewPosition = viewMatrix * modelMatrix *vec4(position,1);
                gl_Position = projectionMatrix * viewPosition;
                if(aIndex < uTime + 100.0 && aIndex > uTime - 100.0){
                vSize = (aIndex + 100.0 - uTime) / 60.0;
                } 
                gl_PointSize =vSize;
            }
        `,
        fragmentShader: `
            varying float vSize;
            uniform vec3 uColor;
            void main(){
                if(vSize<=0.0){
                    gl_FragColor = vec4(1,0,0,0);
                }else{
                    gl_FragColor = vec4(uColor,1);
                }
            }
        `,
        transparent: true,
    });

    const object = new THREE.Points(geometry, material);
    scene.add(object);
    let value = 0;
    function move() {
        requestAnimationFrame(move);
        if (value > 1000) {
            value = 0;
        }
        value += 5; // 偏移的方向和速度
        material.uniforms.uTime.value = value;
    }
    move();
}
