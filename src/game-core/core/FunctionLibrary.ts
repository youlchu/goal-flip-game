import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import * as _ from "lodash";
import { SimulationFrame } from "../physics/spring_simulation/SimulationFrame";
import { Side } from "../enums/Side";
import { Object3D } from "three";
import { Space } from "../enums/Space";

// export function createCapsuleGeometry(
//   radius: number = 1,
//   height: number = 2,
//   N: number = 32
// ): THREE.BufferGeometry {
//   const geometry = new THREE.BufferGeometry()
//   const TWOPI = Math.PI * 2
//   const PID2 = Math.PI / 2

//   const normals = []

//   const points = []
//   const vertices = []

//   // top cap
//   for (let i = 0; i <= N / 4; i++) {
//     for (let j = 0; j <= N; j++) {
//       const theta = (j * TWOPI) / N
//       const phi = -PID2 + (Math.PI * i) / (N / 2)
//       const vertex = new THREE.Vector3()
//       const normal = new THREE.Vector3()
//       vertex.x = radius * Math.cos(phi) * Math.cos(theta)
//       vertex.y = radius * Math.cos(phi) * Math.sin(theta)
//       vertex.z = radius * Math.sin(phi)
//       vertex.z -= height / 2
//       normal.x = vertex.x
//       normal.y = vertex.y
//       normal.z = vertex.z
//       points.push(vertex)
//       normals.push(normal)
//     }
//   }

//   // bottom cap
//   for (let i = N / 4; i <= N / 2; i++) {
//     for (let j = 0; j <= N; j++) {
//       const theta = (j * TWOPI) / N
//       const phi = -PID2 + (Math.PI * i) / (N / 2)
//       const vertex = new THREE.Vector3()
//       const normal = new THREE.Vector3()
//       vertex.x = radius * Math.cos(phi) * Math.cos(theta)
//       vertex.y = radius * Math.cos(phi) * Math.sin(theta)
//       vertex.z = radius * Math.sin(phi)
//       vertex.z += height / 2
//       normal.x = vertex.x
//       normal.y = vertex.y
//       normal.z = vertex.z
//       points.push(vertex)
//       normals.push(normal)
//     }
//   }

//   for (let i = 0; i <= N / 2; i++) {
//     for (let j = 0; j < N; j++) {
//       const vec = new THREE.Vector4(
//         i * (N + 1) + j,
//         i * (N + 1) + (j + 1),
//         (i + 1) * (N + 1) + (j + 1),
//         (i + 1) * (N + 1) + j
//       )
//       // console.log(vec);
//       const face1 = [points[vec.x], points[vec.y], points[vec.z]]
//       const face2 = [points[vec.x], points[vec.z], points[vec.w]]
//       if (i === N / 4) {
//         vertices.push(...face1, ...face2)
//       } else {
//         vertices.push(...face2, ...face1)
//       }
//     }
//     // if(i==(N/4)) break; // N/4 is when the center segments are solved
//   }

//   geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
//   geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))

//   geometry.rotateX(Math.PI / 2)
//   geometry.computeVertexNormals()

//   return geometry
// }

//#endregion

//#region Math

/**
 * Constructs a 2D matrix from first vector, replacing the Y axes with the global Y axis,
 * and applies this matrix to the second vector. Saves performance when compared to full 3D matrix application.
 * Useful for character rotation, as it only happens on the Y axis.
 * @param {Vector3} a Vector to construct 2D matrix from
 * @param {Vector3} b Vector to apply basis to
 */
export function applyVectorMatrixXZ(
  a: THREE.Vector3,
  b: THREE.Vector3
): THREE.Vector3 {
  return new THREE.Vector3(a.x * b.z + a.z * b.x, b.y, a.z * b.z + -a.x * b.x);
}

export function round(value: number, decimals: number = 0): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function roundVector(
  vector: THREE.Vector3,
  decimals: number = 0
): THREE.Vector3 {
  return new THREE.Vector3(
    round(vector.x, decimals),
    round(vector.y, decimals),
    round(vector.z, decimals)
  );
}

/**
 * Finds an angle between two vectors
 * @param {THREE.Vector3} v1
 * @param {THREE.Vector3} v2
 */
export function getAngleBetweenVectors(
  v1: THREE.Vector3,
  v2: THREE.Vector3,
  dotTreshold: number = 0.0005
): number {
  let angle: number;
  let dot = v1.dot(v2);

  // If dot is close to 1, we'll round angle to zero
  if (dot > 1 - dotTreshold) {
    angle = 0;
  } else {
    // Dot too close to -1
    if (dot < -1 + dotTreshold) {
      angle = Math.PI;
    } else {
      // Get angle difference in radians
      angle = Math.acos(dot);
    }
  }

  return angle;
}

/**
 * Finds an angle between two vectors with a sign relative to normal vector
 */
export function getSignedAngleBetweenVectors(
  v1: THREE.Vector3,
  v2: THREE.Vector3,
  normal: THREE.Vector3 = new THREE.Vector3(0, 1, 0),
  dotTreshold: number = 0.0005
): number {
  let angle = getAngleBetweenVectors(v1, v2, dotTreshold);

  // Get vector pointing up or down
  let cross = new THREE.Vector3().crossVectors(v1, v2);

  // Compare cross with normal to find out direction
  if (normal.dot(cross) < 0) {
    angle = -angle;
  }

  return angle;
}

export function haveSameSigns(n1: number, n2: number): boolean {
  return n1 < 0 === n2 < 0;
}

export function haveDifferentSigns(n1: number, n2: number): boolean {
  return n1 < 0 !== n2 < 0;
}

//#endregion

//#region Miscellaneous

export function setDefaults(options: unknown, defaults: unknown): unknown {
  return _.defaults({}, _.clone(options), defaults);
}

export function getGlobalProperties(prefix: string = ""): string[] {
  const keyValues = [];
  const global = window; // window for browser environments
  for (const prop in global) {
    // check the prefix
    if (prop.indexOf(prefix) === 0) {
      keyValues.push(prop /*+ "=" + global[prop]*/);
    }
  }
  return keyValues; // build the string
}

export const lerp = (s: number, e: number, a: number) => s + (e - s) * a;

export function spring(
  source: number,
  dest: number,
  velocity: number,
  mass: number,
  damping: number
): SimulationFrame {
  let acceleration = dest - source;
  acceleration /= mass;
  velocity += acceleration;
  velocity *= damping;

  const position = source + velocity;

  return new SimulationFrame(position, velocity);
}

export function springV(
  source: THREE.Vector3,
  dest: THREE.Vector3,
  velocity: THREE.Vector3,
  mass: number,
  damping: number
): void {
  const acceleration = new THREE.Vector3().subVectors(dest, source);
  acceleration.divideScalar(mass);
  velocity.add(acceleration);
  velocity.multiplyScalar(damping);
  source.add(velocity);
}

// export function threeVector(vec: CANNON.Vec3): THREE.Vector3 {
//   return new THREE.Vector3(vec.x, vec.y, vec.z)
// }

// export function cannonVector(vec: THREE.Vector3): CANNON.Vec3 {
//   return new CANNON.Vec3(vec.x, vec.y, vec.z)
// }

// export function threeQuat(quat: CANNON.Quaternion): THREE.Quaternion {
//   return new THREE.Quaternion(quat.x, quat.y, quat.z, quat.w)
// }

// export function cannonQuat(quat: THREE.Quaternion): CANNON.Quaternion {
//   return new CANNON.Quaternion(quat.x, quat.y, quat.z, quat.w)
// }

export function rapierVector(vec: THREE.Vector3): RAPIER.Vector {
  return new RAPIER.Vector3(vec.x, vec.y, vec.z);
}

export function rapierToThreeVector(vec: RAPIER.Vector): THREE.Vector3 {
  return new THREE.Vector3(vec.x, vec.y, vec.z);
}

export function rapierToThreeQuat(quat: RAPIER.Quaternion): THREE.Quaternion {
  return new THREE.Quaternion(quat.x, quat.y, quat.z, quat.w);
}

export function rapierQuat(quat: THREE.Quaternion): RAPIER.Quaternion {
  return new RAPIER.Quaternion(quat.x, quat.y, quat.z, quat.w);
}

export function setupMeshProperties(child: any): void {
  child.castShadow = true;
  child.receiveShadow = true;

  if (child.material) {
    child.material.side = THREE.DoubleSide;
  }

  // if (child.material.map !== null) {
  //   const material = new THREE.MeshStandardMaterial()
  //   material.map = child.material.map
  //   material.color = child.material.color
  //   material.roughness = child.material.roughness
  //   material.metalness = child.material.metalness
  //   material.aoMap = child.material.aoMap
  //   material.alphaMap = child.material.alphaMap
  //   material.transparent = child.material.transparent
  //   material.side = child.material.side
  //   material.flatShading = child.material.flatShading

  //   material.vertexColors = child.material.vertexColors
  //   material.normalMap = child.material.normalMap
  //   material.normalScale = child.material.normalScale
  //   material.displacementMap = child.material.displacementMap
  //   material.displacementScale = child.material.displacementScale
  //   material.displacementBias = child.material.displacementBias
  //   material.emissive = child.material.emissive
  //   material.emissiveMap = child.material.emissiveMap
  //   material.emissiveIntensity = child.material.emissiveIntensity
  //   material.roughnessMap = child.material.roughnessMap
  //   material.metalnessMap = child.material.metalnessMap
  //   material.envMap = child.material.envMap
  //   material.envMapIntensity = child.material.envMapIntensity
  //   material.lightMap = child.material.lightMap
  //   material.lightMapIntensity = child.material.lightMapIntensity
  //   material.aoMapIntensity = child.material.aoMapIntensity
  //   material.bumpMap = child.material.bumpMap
  //   material.bumpScale = child.material.bumpScale
  //   material.alphaMap = child.material.alphaMap
  //   material.alphaTest = child.material.alphaTest
  //   material.depthTest = child.material.depthTest
  //   material.depthWrite = child.material.depthWrite
  //   material.colorWrite = child.material.colorWrite
  //   material.premultipliedAlpha = child.material.premultipliedAlpha
  //   material.wireframe = child.material.wireframe
  //   material.wireframeLinewidth = child.material.wireframeLinewidth
  //   material.wireframeLinecap = child.material.wireframeLinecap
  //   material.wireframeLinejoin = child.material.wireframeLinejoin

  //   child.material = material
  // }
}

export function detectRelativeSide(from: Object3D, to: Object3D): Side {
  const right = getRight(from, Space.Local);
  const viewVector = to.position.clone().sub(from.position).normalize();

  return right.dot(viewVector) > 0 ? Side.Left : Side.Right;
}

export function easeInOutSine(x: number): number {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

export function easeOutQuad(x: number): number {
  return 1 - (1 - x) * (1 - x);
}

export function getRight(
  obj: THREE.Object3D,
  space: Space = Space.Global
): THREE.Vector3 {
  const matrix = getMatrix(obj, space);
  return new THREE.Vector3(
    matrix.elements[0],
    matrix.elements[1],
    matrix.elements[2]
  );
}

export function getUp(
  obj: THREE.Object3D,
  space: Space = Space.Global
): THREE.Vector3 {
  const matrix = getMatrix(obj, space);
  return new THREE.Vector3(
    matrix.elements[4],
    matrix.elements[5],
    matrix.elements[6]
  );
}

export function getForward(
  obj: THREE.Object3D,
  space: Space = Space.Global
): THREE.Vector3 {
  const matrix = getMatrix(obj, space);
  return new THREE.Vector3(
    matrix.elements[8],
    matrix.elements[9],
    matrix.elements[10]
  );
}

export function getBack(
  obj: THREE.Object3D,
  space: Space = Space.Global
): THREE.Vector3 {
  const matrix = getMatrix(obj, space);
  return new THREE.Vector3(
    -matrix.elements[8],
    -matrix.elements[9],
    -matrix.elements[10]
  );
}

export function getMatrix(obj: THREE.Object3D, space: Space): THREE.Matrix4 {
  switch (space) {
    case Space.Local:
      return obj.matrix;
    case Space.Global:
      return obj.matrixWorld;
  }
}

// export function countSleepyBodies(): any {
//   // let awake = 0;
//   // let sleepy = 0;
//   // let asleep = 0;
//   // this.physicsWorld.bodies.forEach((body) =>
//   // {
//   //     if (body.sleepState === 0) awake++;
//   //     if (body.sleepState === 1) sleepy++;
//   //     if (body.sleepState === 2) asleep++;
//   // });
// }

// //#endregion

export const rapierDotProduct = (
  a: RAPIER.Vector,
  b: RAPIER.Vector
): number => {
  return a.x * b.x + a.y * b.y + a.z * b.z;
};

export const rapierAdd = (
  a: RAPIER.Vector,
  b: RAPIER.Vector
): RAPIER.Vector => {
  return new RAPIER.Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
};

export const rapierSub = (
  a: RAPIER.Vector,
  b: RAPIER.Vector
): RAPIER.Vector => {
  return new RAPIER.Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
};

export const rapierQuaternionMul = (
  q: RAPIER.Quaternion,
  v: RAPIER.Vector3
): RAPIER.Vector3 => {
  // Extract the vector part of the quaternion
  const u = new RAPIER.Vector3(q.x, q.y, q.z);

  // Extract the scalar part of the quaternion
  const s = q.w;

  // Perform the quaternion multiplication
  const uv = rapierCrossProduct(u, v);
  const uuv = rapierCrossProduct(u, uv);
  const uvScaled = rapierVectorScale(uv, 2.0 * s);
  const uuvScaled = rapierVectorScale(uuv, 2.0);

  return rapierAdd(v, rapierAdd(uvScaled, uuvScaled));
};

// Helper function for cross product
export const rapierCrossProduct = (
  a: RAPIER.Vector3,
  b: RAPIER.Vector3
): RAPIER.Vector3 => {
  return new RAPIER.Vector3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  );
};

export const rapierVectorMul = (
  a: RAPIER.Vector,
  b: RAPIER.Vector
): RAPIER.Vector => {
  return new RAPIER.Vector3(a.x * b.x, a.y * b.y, a.z * b.z);
};

export const rapierVectorScale = (
  a: RAPIER.Vector,
  b: number
): RAPIER.Vector => {
  return new RAPIER.Vector3(a.x * b, a.y * b, a.z * b);
};

export const rapierNormalize = (a: RAPIER.Vector): RAPIER.Vector => {
  const length = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  if (length === 0) {
    return a;
  }
  return new RAPIER.Vector3(a.x / length, a.y / length, a.z / length);
};

export const rapierVectorLength = (vector3: RAPIER.Vector3): number => {
  return Math.sqrt(
    vector3.x * vector3.x + vector3.y * vector3.y + vector3.z * vector3.z
  );
};
