import * as RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import * as Utils from "../../core/FunctionLibrary";
import { Object3D } from "three";

export interface ICollider {
  rigidBodyDesc: RAPIER.RigidBodyDesc;
  colliderDesc: RAPIER.ColliderDesc;
}

interface PlaneColliderOptions {
  mass: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  friction: number;
}

export class PlaneCollider implements ICollider {
  public mesh: THREE.Object3D;
  public options: PlaneColliderOptions;
  public rigidBodyDesc: RAPIER.RigidBodyDesc;
  public colliderDesc: RAPIER.ColliderDesc;
  // public debugModel: THREE.Mesh;

  constructor(mesh: Object3D, options?: PlaneColliderOptions) {
    this.mesh = mesh.clone();

    // World matrix'ini güncelle
    mesh.updateMatrixWorld(true);

    // World pozisyon al, rotasyon için mesh'in kendi quaternion'unu kullan
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

    // Mesh'in kendi rotasyonunu kullan (local rotation)
    const meshRotation = mesh.quaternion.clone();

    const defaults: PlaneColliderOptions = {
      mass: 0,
      position: worldPosition,
      rotation: meshRotation,
      friction: 0.3,
    };
    this.options = Utils.setDefaults(options, defaults) as PlaneColliderOptions;

    const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(worldPosition.x, worldPosition.y, worldPosition.z)
      .setRotation({
        x: meshRotation.x,
        y: meshRotation.y,
        z: meshRotation.z,
        w: meshRotation.w,
      });
    rigidBodyDesc.mass = this.options.mass;

    this.rigidBodyDesc = rigidBodyDesc;

    // Bounding box ile gerçek boyutları hesapla
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const size = boundingBox.getSize(new THREE.Vector3());

    const thickness = 0.01;
    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      Math.abs(size.x / 2),
      thickness,
      Math.abs(size.z / 2)
    ).setFriction(this.options.friction);

    // .setRestitution(0.6);

    this.colliderDesc = colliderDesc;
  }

  createDebug(scene: THREE.Scene): void {
    const boundingBox = new THREE.Box3().setFromObject(this.mesh);
    const size = boundingBox.getSize(new THREE.Vector3());

    const geometry = new THREE.PlaneGeometry(size.x, size.z);

    const material = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const debugModel = new THREE.Mesh(geometry, material);

    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    this.mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

    debugModel.position.copy(this.mesh.position);
    debugModel.quaternion.copy(this.mesh.quaternion);

    scene.add(debugModel);
  }
}
