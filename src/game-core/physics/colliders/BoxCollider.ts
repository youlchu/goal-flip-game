import * as RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import * as Utils from "../../core/FunctionLibrary";
import { Object3D } from "three";

export interface ICollider {
  rigidBodyDesc: RAPIER.RigidBodyDesc;
  colliderDesc: RAPIER.ColliderDesc;
}

interface BoxColliderOptions {
  mass: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  friction: number;
}

export class BoxCollider implements ICollider {
  public mesh: THREE.Object3D;
  public options: BoxColliderOptions;
  public rigidBodyDesc: RAPIER.RigidBodyDesc;
  public colliderDesc: RAPIER.ColliderDesc;
  // public debugModel: THREE.Mesh;

  constructor(mesh: Object3D, options?: BoxColliderOptions) {
    this.mesh = mesh.clone();

    // World matrix'ini güncelle
    mesh.updateMatrixWorld(true);

    // World pozisyon ve rotasyonu al
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

    const defaults: BoxColliderOptions = {
      mass: 0,
      position: worldPosition,
      rotation: worldQuaternion,
      friction: 0.3,
    };
    this.options = Utils.setDefaults(options, defaults) as BoxColliderOptions;

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

    // Bounding box ile gerçek boyutları hesapla
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const size = boundingBox.getSize(new THREE.Vector3());

    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      Math.abs(size.x / 2),
      Math.abs(size.y / 2),
      Math.abs(size.z / 2)
    ).setFriction(this.options.friction);

    // .setRestitution(0.6);

    this.colliderDesc = colliderDesc;
  }

  createDebug(scene: THREE.Scene): void {
    // Bounding box ile gerçek boyutları al
    const boundingBox = new THREE.Box3().setFromObject(this.mesh);
    const size = boundingBox.getSize(new THREE.Vector3());

    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);

    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });

    const debugModel = new THREE.Mesh(geometry, material);

    // World pozisyonu kullan
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    this.mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

    debugModel.position.copy(worldPosition);
    debugModel.quaternion.copy(worldQuaternion);

    scene.add(debugModel);
  }
}
