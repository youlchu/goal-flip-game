import * as RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import * as Utils from "../../core/FunctionLibrary";
import { Object3D } from "three";

export interface ICollider {
  rigidBodyDesc: RAPIER.RigidBodyDesc;
  colliderDesc: RAPIER.ColliderDesc;
}

interface CylinderColliderOptions {
  mass: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  friction: number;
  radius: number;
}

export class CylinderCollider implements ICollider {
  public mesh: THREE.Object3D;
  public options: CylinderColliderOptions;
  public rigidBodyDesc: RAPIER.RigidBodyDesc;
  public colliderDesc: RAPIER.ColliderDesc;
  // public debugModel: THREE.Mesh;

  constructor(mesh: Object3D, options?: CylinderColliderOptions) {
    this.mesh = mesh.clone();

    const defaults: CylinderColliderOptions = {
      mass: 0,
      position: mesh.position,
      rotation: mesh.quaternion,
      friction: 0.3,
      radius: 0,
    };
    this.options = Utils.setDefaults(
      options,
      defaults
    ) as CylinderColliderOptions;

    const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
      .setRotation({
        x: mesh.quaternion.x,
        y: mesh.quaternion.y,
        z: mesh.quaternion.z,
        w: mesh.quaternion.w,
      });
    rigidBodyDesc.mass = this.options.mass;

    this.rigidBodyDesc = rigidBodyDesc;

    const radius = 0;
    const height = Math.abs(mesh.scale.y) / 2;

    const colliderDesc = RAPIER.ColliderDesc.cylinder(
      height,
      radius
    ).setFriction(this.options.friction);

    // .setRestitution(0.6);

    this.colliderDesc = colliderDesc;
  }

  createDebug(scene: THREE.Scene): void {
    const radius =
      Math.max(Math.abs(this.mesh.scale.x), Math.abs(this.mesh.scale.z)) / 2;
    const height = Math.abs(this.mesh.scale.y);

    const geometry = new THREE.CylinderGeometry(radius, radius, height, 16);

    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });

    const debugModel = new THREE.Mesh(geometry, material);
    debugModel.position.copy(this.mesh.position);
    debugModel.quaternion.copy(this.mesh.quaternion);

    scene.add(debugModel);
  }
}
