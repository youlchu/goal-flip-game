import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { World } from "../world/World";
import _ from "lodash";

import * as Utils from "../core/FunctionLibrary";
import { EntityType } from "../enums/EntityType";
import type { IWorldEntity } from "../interfaces/IWorldEntity";

export enum ItemState {
  IDLE = "IDLE",
  ACTIVE = "ACTIVE",
  RELOADING = "RELOADING",
  SWITCHING = "SWITCHING",
}

export class Ball extends THREE.Object3D implements IWorldEntity {
  previousAnimation: string = "";
  public updateOrder: number = 4;
  public entityType: EntityType = EntityType.Ball;

  public world: World;
  public collision!: RAPIER.Collider;
  public body: RAPIER.RigidBody;
  modelContainer: THREE.Group;

  protected physicsEnabled: boolean = true;

  private bounciness: number = 0.8;
  private friction: number = 0.6;
  private ballMass: number = 0.5;

  constructor(object: THREE.Object3D, word: World) {
    super();
    this.world = word;

    // Collision body
    this.body = this.world.physicsWorld!.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
    );

    // Read GLTF
    this.readItemData(object);

    this.modelContainer = new THREE.Group();
    object.position.set(0, 0, 0);
    this.modelContainer.add(object);
    this.add(this.modelContainer);
    this.body.userData = this;
  }

  public allowSleep(value: boolean): void {
    if (value === true) {
      this.body.sleep();
    } else {
      this.body.wakeUp();
    }
  }

  public setPosition(x: number, y: number, z: number): void {
    this.body.setTranslation(new RAPIER.Vector3(x, y, z), true);
    this.position.set(x, y, z);
  }

  public setRotation(x: number, y: number, z: number, w: number): void {
    this.body.setRotation(new RAPIER.Quaternion(x, y, z, w), true);
    this.quaternion.set(x, y, z, w);
  }

  public update(timeStep: number): void {
    if (this.physicsEnabled) {
      this.position.copy(Utils.rapierToThreeVector(this.body.translation()));
      this.quaternion.copy(Utils.rapierToThreeQuat(this.body.rotation()));
    } else {
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      this.getWorldQuaternion(quaternion);
      this.getWorldPosition(position);
      this.body.setTranslation(
        new RAPIER.Vector3(position.x, position.y, position.z),
        true
      );
      this.body.setRotation(
        new RAPIER.Quaternion(
          quaternion.x,
          quaternion.y,
          quaternion.z,
          quaternion.w
        ),
        true
      );
    }
    if (this.physicsEnabled) {
      this.physicsPreStep();
      this.normalStep(timeStep);
      this.physicsPostStep();
    }
  }

  public normalStep(_timeStep: number): void {}

  public physicsPreStep(): void {}
  public physicsPostStep(): void {}

  public onInputChange(): void {}

  public addToWorld(world: World): void {
    if (!world.physicsWorld) {
      console.error(
        "Cannot add item to world: Physics world is not initialized"
      );
      return;
    }

    if (_.includes(world.updatables, this)) {
      console.warn("Adding item to a world in which it already exists.");
      return;
    }

    this.world = world;
    world.updatables.push(this);
    world.balls.push(this);
    world.graphicsWorld.add(this);
  }

  public removeFromWorld(world: World): void {
    if (!_.includes(world.updatables, this)) {
      console.warn("Removing item from a world in which it isn't present.");
      return;
    }

    if (!world.physicsWorld) {
      console.error(
        "Cannot remove item from world: Physics world is not initialized"
      );
      return;
    }
    this.physicsEnabled = false;
    _.pull(world.updatables, this);
    _.pull(world.balls, this);
    world.graphicsWorld.remove(this);

    // world.physicsWorld.removeCollider(this.collision, false);
    // world.physicsWorld.removeRigidBody(this.body);
  }

  public readItemData(object: THREE.Object3D): void {
    object.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        Utils.setupMeshProperties(mesh);
      }

      const sizes = new THREE.Box3()
        .setFromObject(child)
        .getSize(new THREE.Vector3());
      const colliderDesc = RAPIER.ColliderDesc.ball(
        Math.max(sizes.x, sizes.y, sizes.z) / 2
      );

      colliderDesc.setTranslation(0, 0, 0);

      colliderDesc.setRestitution(this.bounciness); // Zıplama
      colliderDesc.setFriction(this.friction); // Sürtünme
      colliderDesc.setDensity(this.ballMass); // Yoğunluk
      colliderDesc.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Max);

      const collision = this.world.physicsWorld!.createCollider(
        colliderDesc,
        this.body
      );

      this.collision = collision;
    });
  }

  public setBounce(value: number): void {
    this.bounciness = Math.max(0, Math.min(1, value));
    this.collision.setRestitution(this.bounciness);
  }

  public setFriction(value: number): void {
    this.friction = Math.max(0, value);
    this.collision.setFriction(this.friction);
  }

  public setMass(value: number): void {
    this.ballMass = Math.max(0.1, value);
    this.collision.setDensity(this.ballMass);
  }

  public applyForce(force: THREE.Vector3): void {
    this.body.applyImpulse(new RAPIER.Vector3(force.x, force.y, force.z), true);
  }

  public addSpin(torque: THREE.Vector3): void {
    this.body.applyTorqueImpulse(
      new RAPIER.Vector3(torque.x, torque.y, torque.z),
      true
    );
  }
}
