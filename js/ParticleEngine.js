/**
 * @author Lee Stemkoski   http://www.adelphi.edu/~stemkoski/
 */
import * as THREE from 'three';
///////////////////////////////////////////////////////////////////////////////

/////////////
// SHADERS //
/////////////

// attribute: data that may be different for each particle (such as size and color);
//      can only be used in vertex shader
// varying: used to communicate data from vertex shader to fragment shader
// uniform: data that is the same for each particle (such as texture)

const particleVertexShader = [
  'attribute vec3  customColor;',
  'attribute float customOpacity;',
  'attribute float customSize;',
  'attribute float customAngle;',
  'attribute float customVisible;', // float used as boolean (0 = false, 1 = true)
  'varying vec4  vColor;',
  'varying float vAngle;',
  'void main()',
  '{',
  'if ( customVisible > 0.5 )', // true
  'vColor = vec4( customColor, customOpacity );', //     set color associated to vertex; use later in fragment shader.
  'else', // false
  'vColor = vec4(0.0, 0.0, 0.0, 0.0);', //     make particle invisible.

  'vAngle = customAngle;',

  'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
  'gl_PointSize = customSize * ( 300.0 / length( mvPosition.xyz ) );', // scale particles as objects in 3D space
  'gl_Position = projectionMatrix * mvPosition;',
  '}',
].join('\n');

const particleFragmentShader = [
  'uniform sampler2D pointTexture;',
  'varying vec4 vColor;',
  'varying float vAngle;',
  'void main()',
  '{',
  'gl_FragColor = vColor;',

  'float c = cos(vAngle);',
  'float s = sin(vAngle);',
  'vec2 rotatedUV = vec2(c * (gl_PointCoord.x - 0.5) + s * (gl_PointCoord.y - 0.5) + 0.5,',
  'c * (gl_PointCoord.y - 0.5) - s * (gl_PointCoord.x - 0.5) + 0.5);', // rotate UV coordinates to rotate texture
  'vec4 rotatedTexture = texture2D( pointTexture,  rotatedUV );',
  'gl_FragColor = gl_FragColor * rotatedTexture;', // sets an otherwise white particle texture to desired color
  '}',
].join('\n');

///////////////////////////////////////////////////////////////////////////////

/////////////////
// TWEEN CLASS //
/////////////////

export function Tween(timeArray, valueArray) {
  this.times = timeArray || [];
  this.values = valueArray || [];
}

Tween.prototype.lerp = function (t) {
  let i = 0;
  let n = this.times.length;
  while (i < n && t > this.times[i]) i++;
  if (i == 0) return this.values[0];
  if (i == n) return this.values[n - 1];
  let p = (t - this.times[i - 1]) / (this.times[i] - this.times[i - 1]);
  if (this.values[0] instanceof THREE.Vector3)
    return this.values[i - 1].clone().lerp(this.values[i], p);
  // its a float
  else return this.values[i - 1] + p * (this.values[i] - this.values[i - 1]);
};

///////////////////////////////////////////////////////////////////////////////

////////////////////
// PARTICLE CLASS //
////////////////////

function Particle() {
  // console.log('当前this 指向',this)
  this.position = new THREE.Vector3();
  this.velocity = new THREE.Vector3(); // units per second
  this.acceleration = new THREE.Vector3();

  this.angle = 0;
  this.angleVelocity = 0; // degrees per second
  this.angleAcceleration = 0; // degrees per second, per second

  this.size = 16.0;

  this.color = new THREE.Color();
  this.opacity = 1.0;

  this.age = 0;
  this.alive = 0; // use float instead of boolean for shader purposes
}

Particle.prototype.update = function (dt) {
  this.position.add(this.velocity.clone().multiplyScalar(dt));
  this.velocity.add(this.acceleration.clone().multiplyScalar(dt));

  // convert from degrees to radians: 0.01745329251 = Math.PI/180
  this.angle += this.angleVelocity * 0.01745329251 * dt;
  this.angleVelocity += this.angleAcceleration * 0.01745329251 * dt;

  // console.log(dt);
  this.age += 0.02;

  // if the tween for a given attribute is nonempty,
  //  then use it to update the attribute's value

  if (this.sizeTween.times.length > 0) {
    this.size = this.sizeTween.lerp(this.age);
  }

  if (this.colorTween.times.length > 0) {
    let colorHSL = this.colorTween.lerp(this.age);
    this.color = new THREE.Color().setHSL(colorHSL.x, colorHSL.y, colorHSL.z);
  }

  if (this.opacityTween.times.length > 0) {
    this.opacity = this.opacityTween.lerp(this.age);
  }
};

///////////////////////////////////////////////////////////////////////////////

///////////////////////////
// PARTICLE ENGINE CLASS //
///////////////////////////

export const Type = Object.freeze({
  CUBE: 1,
  SPHERE: 2,
});

export function ParticleEngine() {
  /////////////////////////
  // PARTICLE PROPERTIES //
  /////////////////////////

  this.positionStyle = Type.CUBE;
  this.positionBase = new THREE.Vector3();
  // cube shape data
  this.positionSpread = new THREE.Vector3();
  // sphere shape data
  this.positionRadius = 0; // distance from base at which particles start

  this.velocityStyle = Type.CUBE;
  // cube movement data
  this.velocityBase = new THREE.Vector3();
  this.velocitySpread = new THREE.Vector3();
  // sphere movement data
  //   direction vector calculated using initial position
  this.speedBase = 0;
  this.speedSpread = 0;

  this.accelerationBase = new THREE.Vector3();
  this.accelerationSpread = new THREE.Vector3();

  this.angleBase = 0;
  this.angleSpread = 0;
  this.angleVelocityBase = 0;
  this.angleVelocitySpread = 0;
  this.angleAccelerationBase = 0;
  this.angleAccelerationSpread = 0;

  this.sizeBase = 0.0;
  this.sizeSpread = 0.0;
  this.sizeTween = new Tween();

  // store colors in HSL format in a THREE.Vector3 object
  // http://en.wikipedia.org/wiki/HSL_and_HSV
  this.colorBase = new THREE.Vector3(0.0, 1.0, 0.5);
  this.colorSpread = new THREE.Vector3(0.0, 0.0, 0.0);
  this.colorTween = new Tween();

  this.opacityBase = 1.0;
  this.opacitySpread = 0.0;
  this.opacityTween = new Tween();

  this.blendStyle = THREE.NormalBlending; // false;

  this.particleArray = [];
  this.particlesPerSecond = 100;
  this.particleDeathAge = 1.0;

  ////////////////////////
  // EMITTER PROPERTIES //
  ////////////////////////

  this.emitterAge = 0.0;
  this.emitterAlive = true;
  this.emitterDeathAge = 60; // time (seconds) at which to stop creating particles.

  // How many particles could be active at any time?
  this.particleCount =
    this.particlesPerSecond * Math.min(this.particleDeathAge, this.emitterDeathAge);

  //////////////
  // THREE.JS //
  //////////////

  // this.particleGeometry = new THREE.Geometry();
  this.particleGeometry = new THREE.BufferGeometry();
  this.particleTexture = null;
  this.particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      texture: {
        type: 't',
        value: this.particleTexture,
      },
    },
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true, // alphaTest: 0.5,  // if having transparency issues, try including: alphaTest: 0.5,
    blending: THREE.NormalBlending,
    depthTest: true,
  });
  this.particleMesh = new THREE.Mesh();
}

ParticleEngine.prototype.setValues = function (parameters) {
  if (parameters === undefined) return;

  // clear any previous tweens that might exist
  this.sizeTween = new Tween();
  this.colorTween = new Tween();
  this.opacityTween = new Tween();

  for (let key in parameters) this[key] = parameters[key];

  // attach tweens to particles
  Particle.prototype.sizeTween = this.sizeTween;
  Particle.prototype.colorTween = this.colorTween;
  Particle.prototype.opacityTween = this.opacityTween;

  // calculate/set derived particle engine values
  this.particleArray = [];
  this.emitterAge = 0.0;
  this.emitterAlive = true;
  
  this.particleCount = 30000;

  this.particleGeometry = new THREE.BufferGeometry();
  this.positions = []; //位置数组
  this.customVisible = []; //显隐数组
  this.customColor = []; //颜色数组
  this.customOpacity = []; //透明度数组
  this.customSize = []; //大小数组
  this.customAngle = []; //角度数组

  this.particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      pointTexture: {
        type: 't',
        value: this.particleTexture,
      },
    },
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true,
    alphaTest: 0.5, // if having transparency issues, try including: alphaTest: 0.5,
    blending: THREE.NormalBlending,
    depthTest: false,
  });
  this.particleMesh = new THREE.Points();
};

// helper functions for randomization
ParticleEngine.prototype.randomValue = function (base, spread) {
  return base + spread * (Math.random() - 0.5);
};
ParticleEngine.prototype.randomVector3 = function (base, spread) {
  let rand3 = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
  return new THREE.Vector3().addVectors(base, new THREE.Vector3().multiplyVectors(spread, rand3));
};

ParticleEngine.prototype.createParticle = function () {
  let particle = new Particle();

  if (this.positionStyle == Type.CUBE) {
    particle.position = this.randomVector3(this.positionBase, this.positionSpread);
  }

  if (this.positionStyle == Type.SPHERE) {
    const z = 2 * Math.random() - 1;
    const t = 6.2832 * Math.random();
    const r = Math.sqrt(1 - z * z);
    const vec3 = new THREE.Vector3(r * Math.cos(t), r * Math.sin(t), z);
    particle.position = new THREE.Vector3().addVectors(
      this.positionBase,
      vec3.multiplyScalar(this.positionRadius)
    );
  }

  if (this.velocityStyle == Type.CUBE) {
    particle.velocity = this.randomVector3(this.velocityBase, this.velocitySpread);
  }
  if (this.velocityStyle == Type.SPHERE) {
    let direction = new THREE.Vector3().subVectors(particle.position, this.positionBase);
    let speed = this.randomValue(this.speedBase, this.speedSpread);
    particle.velocity = direction.normalize().multiplyScalar(speed);
  }

  particle.acceleration = this.randomVector3(this.accelerationBase, this.accelerationSpread);

  particle.angle = this.randomValue(this.angleBase, this.angleSpread);
  particle.angleVelocity = this.randomValue(this.angleVelocityBase, this.angleVelocitySpread);
  particle.angleAcceleration = this.randomValue(
    this.angleAccelerationBase,
    this.angleAccelerationSpread
  );

  particle.size = this.randomValue(this.sizeBase, this.sizeSpread);

  let color = this.randomVector3(this.colorBase, this.colorSpread);
  particle.color = new THREE.Color().setHSL(color.x, color.y, color.z);

  particle.opacity = this.randomValue(this.opacityBase, this.opacitySpread);

  particle.age = 0;
  particle.alive = 0; // particles initialize as inactive

  return particle;
};

ParticleEngine.prototype.initialize = function () {
  // link particle data with geometry/material data
  const positions = [];
  const customVisible = [];
  const customColor = [];
  const customOpacity = [];
  const customSize = [];
  const customAngle = [];

  let interval = 1 / 50; // 生成粒子的时间间隔

  for (let i = 0; i < this.particleCount; i++) {
    // remove duplicate code somehow, here and in update function below.
    this.particleArray[i] = this.createParticle();
    const { x, y, z } = this.particleArray[i].position;
    const { r, g, b } = this.particleArray[i].color;
    positions.push(x, y, z);
    customVisible.push(this.particleArray[i].alive);
    customColor.push(r, g, b);
    customOpacity.push(this.particleArray[i].opacity);
    customSize.push(this.particleArray[i].size);
    customAngle.push(this.particleArray[i].angle);
    // setTimeout(() => {
    //   this.particleArray[i] = this.createParticle();
    //   this.particleArray[i].alive = 1; // 逐个设置粒子为活动状态

    //   const { x, y, z } = this.particleArray[i].position;
    //   const { r, g, b } = this.particleArray[i].color;
    //   positions.push(x, y, z);
    //   customVisible.push(this.particleArray[i].alive);
    //   customColor.push(r, g, b);
    //   customOpacity.push(this.particleArray[i].opacity);
    //   customSize.push(this.particleArray[i].size);
    //   customAngle.push(this.particleArray[i].angle);
    // }, i * interval * 1000); // 使用setTimeout控制粒子生成的时间间隔
  }
  this.positions = positions; //位置数组
  this.customVisible = customVisible; //显隐数组
  this.customColor = customColor; //颜色数组
  this.customOpacity = customOpacity; //透明度数组
  this.customSize = customSize; //大小数组
  this.customAngle = customAngle; //角度数组
  //设置BufferGeometry的attribute属性
  this.particleGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(this.positions, 3)
  );
  this.particleGeometry.setAttribute(
    'customVisible',
    new THREE.Float32BufferAttribute(this.customVisible, 1)
  );
  this.particleGeometry.setAttribute(
    'customColor',
    new THREE.Float32BufferAttribute(this.customColor, 3)
  );
  this.particleGeometry.setAttribute(
    'customOpacity',
    new THREE.Float32BufferAttribute(this.customOpacity, 1)
  );
  this.particleGeometry.setAttribute(
    'customSize',
    new THREE.Float32BufferAttribute(this.customSize, 1)
  );
  this.particleGeometry.setAttribute(
    'customAngle',
    new THREE.Float32BufferAttribute(this.customAngle, 1)
  );

  this.particleMaterial.blending = this.blendStyle;
  if (this.blendStyle != THREE.NormalBlending) this.particleMaterial.depthTest = false;

  this.particleMesh = new THREE.Points(this.particleGeometry, this.particleMaterial);
  this.particleMesh.dynamic = true;
  this.particleMesh.sortParticles = true;
  this.particleMesh.fileData = {
    name: 'Fireflies',
    layoutType: 'FirefliesEffects',
    type: 'FirefliesEffects',
  };
  // this.particleMesh.scale.
  // this.scene.add(this.particleMesh);
  return this.particleMesh;
};

ParticleEngine.prototype.update = function (dt) {
  const recycleIndices = [];
  //   console.log('当前模型', this.particleGeometry);
  // update particle data
  for (let i = 0; i < this.particleCount; i++) {
    if (this.particleArray[i] && this.particleArray[i].alive) {
      this.particleArray[i].update(dt);

      // check if particle should expire
      // could also use: death by size<0 or alpha<0.
      if (this.particleArray[i].age > this.particleDeathAge) {
        this.particleArray[i].alive = 0.0;
        recycleIndices.push(i);
      }
      const current = i * 3;
      //更新着色器特定属性数组
      this.customVisible[i] = this.particleArray[i].alive;
      this.customColor[current] = this.particleArray[i].color.r;
      this.customColor[current + 1] = this.particleArray[i].color.g;
      this.customColor[current + 2] = this.particleArray[i].color.b;
      // this.customOpacity[i] = this.particleArray[i].opacity;
      this.customSize[i] = this.particleArray[i].size;
      this.customAngle[i] = this.particleArray[i].angle;
    }
  }

  //设置BufferGeometry的attribute属性，着色器相关，颜色、大小、位置、显隐效果
  this.particleGeometry.setAttribute(
    'customVisible',
    new THREE.Float32BufferAttribute(this.customVisible, 1)
  );
  this.particleGeometry.setAttribute(
    'customColor',
    new THREE.Float32BufferAttribute(this.customColor, 3)
  );
  this.particleGeometry.setAttribute(
    'customOpacity',
    new THREE.Float32BufferAttribute(this.customOpacity, 1)
  );
  this.particleGeometry.setAttribute(
    'customSize',
    new THREE.Float32BufferAttribute(this.customSize, 1)
  );
  this.particleGeometry.setAttribute(
    'customAngle',
    new THREE.Float32BufferAttribute(this.customAngle, 1)
  );

  this.particleGeometry.attributes.customVisible.needsUpdate = true;
  this.particleGeometry.attributes.customColor.needsUpdate = true;
  this.particleGeometry.attributes.customOpacity.needsUpdate = true;
  this.particleGeometry.attributes.customSize.needsUpdate = true;
  this.particleGeometry.attributes.customAngle.needsUpdate = true;

  // check if particle emitter is still running
  if (!this.emitterAlive) return;

  // if no particles have died yet, then there are still particles to activate
 
  if (this.emitterAge < this.particleDeathAge) {
    // determine indices of particles to activate
    let startIndex = Math.round(this.particlesPerSecond * (this.emitterAge + 0));
    let endIndex = Math.round(this.particlesPerSecond * (this.emitterAge + dt));
    if (endIndex > this.particleCount) endIndex = this.particleCount;

    for (let i = startIndex; i < endIndex; i++)  {
      // console.log('111', i, endIndex, this.particleArray[i].alive)
      this.particleArray[i].alive = 1.0;
    }
  }

  // if any particles have died while the emitter is still running, we imediately recycle them
  for (let j = 0; j < recycleIndices.length; j++) {
    let i = recycleIndices[j];
    this.particleArray[i] = this.createParticle();
    this.particleArray[i].alive = 1.0; // activate right away
    // this.particleGeometry.vertices[i] = this.particleArray[i].position;
    // const current = i * 3;
    // const positions = this.particleGeometry.attributes.position.array;
    // positions[current] = this.particleArray[i].position.x;
    // positions[current + 1] = this.particleArray[i].position.y;
    // positions[current + 2] = this.particleArray[i].position.z;
    // this.particleGeometry.attributes.position.needsUpdate = true;
  }

  for (var j = 0; j < this.particleCount; j++) {
    const current = j * 3;
    this.positions[current] = this.particleArray[j].position.x;
    this.positions[current + 1] = this.particleArray[j].position.y;
    this.positions[current + 2] = this.particleArray[j].position.z;
  }

  this.particleGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(this.positions, 3)
  );

  // stop emitter?
  this.emitterAge += 0.008;
  if (this.emitterAge > this.emitterDeathAge) this.emitterAlive = false;
};

ParticleEngine.prototype.destroy = function () {
  this.scene.remove(this.particleMesh);
};
///////////////////////////////////////////////////////////////////////////////
