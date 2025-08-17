import * as RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import * as Utils from "../../core/FunctionLibrary";
import { Object3D } from "three";

export interface ICollider {
  rigidBodyDesc: RAPIER.RigidBodyDesc;
  colliderDesc: RAPIER.ColliderDesc;
}

interface TrimeshColliderOptions {
  mass: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  friction: number;
}

export class TrimeshCollider implements ICollider {
  public mesh: THREE.Object3D;
  public options: TrimeshColliderOptions;
  public rigidBodyDesc: RAPIER.RigidBodyDesc;
  public colliderDesc: RAPIER.ColliderDesc;
  // public debugModel: THREE.Mesh;

  constructor(mesh: Object3D, options?: TrimeshColliderOptions) {
    this.mesh = mesh;

    // World matrix'ini güncelle
    mesh.updateMatrixWorld(true);

    // World pozisyon ve rotasyonu al
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

    const defaults: TrimeshColliderOptions = {
      mass: 0,
      position: worldPosition,
      rotation: worldQuaternion,
      friction: 0.3,
    };
    this.options = Utils.setDefaults(
      options,
      defaults
    ) as TrimeshColliderOptions;

    const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(worldPosition.x, worldPosition.y, worldPosition.z)
      .setRotation({
        x: worldQuaternion.x,
        y: worldQuaternion.y,
        z: worldQuaternion.z,
        w: worldQuaternion.w,
      });
    rigidBodyDesc.mass = this.options.mass;

    this.rigidBodyDesc = rigidBodyDesc;

    const trimesh = createTrimeshShape(this.mesh);

    if (!trimesh.vertices || !trimesh.indices) {
      // Fallback olarak bounding box kullan
      const boundingBox = new THREE.Box3().setFromObject(mesh);
      const size = boundingBox.getSize(new THREE.Vector3());
      this.colliderDesc = RAPIER.ColliderDesc.cuboid(
        size.x / 2,
        size.y / 2,
        size.z / 2
      ).setFriction(this.options.friction);
      return;
    }

    const colliderDesc = RAPIER.ColliderDesc.trimesh(
      trimesh.vertices,
      trimesh.indices
    ).setFriction(this.options.friction);
    // .setRestitution(0.6);

    this.colliderDesc = colliderDesc;
  }

  createDebug(scene: THREE.Scene): void {
    if (this.mesh instanceof THREE.Mesh && this.mesh.geometry) {
      const geometry = this.mesh.geometry.clone();

      const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });

      const debugModel = new THREE.Mesh(geometry, material);

      // World transformasyonu uygula
      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();
      this.mesh.matrixWorld.decompose(
        worldPosition,
        worldQuaternion,
        worldScale
      );

      debugModel.position.copy(worldPosition);
      debugModel.quaternion.copy(worldQuaternion);
      debugModel.scale.copy(worldScale);

      scene.add(debugModel);
    }
  }
}

export function createTrimeshShape(mesh: THREE.Object3D): {
  vertices?: Float32Array;
  indices?: Uint32Array;
} {
  const geometry = (mesh as THREE.Mesh).geometry;

  if (!geometry?.attributes) {
    return {};
  }

  // World matrix'ini güncelle
  mesh.updateMatrixWorld(true);

  // World pozisyon, rotasyon ve scale'i al
  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();
  mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

  const positions = geometry.attributes.position.array;
  let scaledVertices = new Float32Array(positions.length);

  // World scale'i uygula
  for (let i = 0; i < positions.length; i += 3) {
    scaledVertices[i] = positions[i] * worldScale.x;
    scaledVertices[i + 1] = positions[i + 1] * worldScale.y;
    scaledVertices[i + 2] = positions[i + 2] * worldScale.z;
  }

  const indices = new Uint32Array(geometry.index!.array);

  return { vertices: scaledVertices, indices };
}
