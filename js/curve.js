/**
 * 管道流动线路构建
 * @param {*} num ：弧度，默认 90
 * @param {*} pointsArray ：点集合 [new THREE.Vector3(-500, 10, -500), new THREE.Vector3(500, 10, -500), new THREE.Vector3(500, 10, 500)]
 */
function createLine(num, pointsArray) {
    //作为拐弯的弧度
    let R = num;
    //添加一些点作为开头和拐点
    let arr = pointsArray;

    let curve = new THREE.CurvePath();

    for (let i = 0; i < arr.length - 1; i++) {
        if (i === 0) {
            let dir = arr[0].clone().sub(arr[1]);
            dir.normalize();
            let p2 = arr[1].clone();
            p2.add(dir.clone().multiplyScalar(R));
            let line = new THREE.LineCurve3(arr[0], p2);
            curve.curves.push(line);
        } else {
            // 计算三个点构成的两条线的方向
            let dir1 = arr[i - 1].clone().sub(arr[i]);
            dir1.normalize();
            let dir2 = arr[i + 1].clone().sub(arr[i]);
            dir2.normalize();
            let p12_ = arr[i].clone();
            p12_.add(dir1.clone().multiplyScalar(R));
            let p1 = arr[i].clone().add(dir1.clone().multiplyScalar(R));
            let p2 = arr[i].clone();
            let p3 = arr[i].clone().add(dir2.clone().multiplyScalar(R));
            let beziercurve = new THREE.QuadraticBezierCurve3(p1, p2, p3);
            let line1 = arr[i].clone();
            line1.add(dir2.clone().multiplyScalar(R));
            let line2 = arr[i + 1].clone();
            if (i < arr.length - 2) {
                //最后一段不用减掉半径尺寸
                line2.add(dir2.clone().multiplyScalar(-R));
            }
            let line = new THREE.LineCurve3(line1, line2);
            // 把转换曲线和直线插入曲线中
            curve.curves.push(beziercurve, line);
        }
    }
    // points = curve.getSpacedPoints(3000);

    let points = curve.getPoints(20);
    // let geometry = new THREE.BufferGeometry(); //声明一个几何体对象Geometry
    // geometry.setFromPoints(points);
    // // 材质对象
    // let material = new THREE.LineBasicMaterial({
    //     color: 0xffff00,
    //     opacity: 0.5,
    // });
    // //线条模型对象
    // scene.remove(scene.children[scene.children.length - 1]);
    // line = new THREE.Line(geometry, material);
    // scene.add(line);

    let closedSpline = new THREE.CatmullRomCurve3(points);
    let geometry = new THREE.TubeGeometry(closedSpline, 1000, 20, 8, false); // 声明一个几何体对象Geometry
    // geometry.setFromPoints(points);
    // 材质对象
    let material = new THREE.LineBasicMaterial({
        color: 0xffff00,
        opacity: 0.5,
    });
    //线条模型对象
    scene.remove(scene.children[scene.children.length - 1]);
    // assignUVs(geometry);
    line = new THREE.Mesh(geometry, material);
    scene.add(line);
    loadTexture(line, './../img/light1.png', true, 15);
    let timer;
    clearTimeout(timer);
    timer = setTimeout(() => {
        updateUvTransform(line, true);
        clearTimeout(timer);
    }, 1000);
}
createLine(API.R);
