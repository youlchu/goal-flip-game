import * as THREE from "three";
import type { World } from "../world/World";

import { type IWorldEntity } from "../interfaces/IWorldEntity";
import { EntityType } from "../enums/EntityType";

import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

export abstract class ICharacter
  extends THREE.Object3D
  implements IWorldEntity
{
  updateOrder: number = 1;
  private model: THREE.Object3D;
  // private world: World;

  public mixer: THREE.AnimationMixer;

  public actionClips: { [name: string]: THREE.AnimationAction } = {};
  public previousAnimation?: THREE.AnimationAction;

  abstract entityType: EntityType;

  constructor(modelCharacter: THREE.Object3D, _world: World) {
    super();
    this.model = SkeletonUtils.clone(modelCharacter);

    this.model.position.set(0, 0, 0);
    // this.model.rotation.set(0, 0, 0);
    this.add(this.model);
    // this.world = world;

    this.animations.push(...this.model.animations);
    this.mixer = new THREE.AnimationMixer(this);
    this.setAnimations(this.animations);
    console.log("Character animations set:", this.actionClips);

    this.updateMatrixWorld(true);
    this.model.updateMatrixWorld(true);
  }

  public setAnimations(animations: THREE.AnimationClip[]): void {
    animations.map((e) => {
      const action = this.mixer.clipAction(e.optimize());

      this.actionClips[e.name] = action;

      action.setEffectiveWeight(e.name === "idle" ? 1 : 0);
      action.play();
    });
  }

  public setAnimation(
    clipName: string,
    fadeIn: number,
    weight: number = 1,
    loop: boolean = true,
    clampWhenFinished: boolean = false
  ): number {
    if (this.mixer === undefined) {
      console.error("Mixer is not initialized!");
      return 0;
    }
    const action = this.actionClips[clipName];

    if (!action) {
      console.error(`Animation ${clipName} not found!`);
      return 0;
    }

    action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
    action.clampWhenFinished = clampWhenFinished;
    action.reset();

    action.setEffectiveWeight(1);
    this.setWeight(action, weight);
    action.fadeIn(fadeIn);
    this.previousAnimation?.fadeOut(0.2);
    this.previousAnimation = action;

    if (loop) {
      return action.getClip().duration - fadeIn - 0.2;
    } else {
      return action.getClip().duration;
    }
  }

  public setWeight(action: THREE.AnimationAction, weight: number) {
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
  }

  public setPosition(position: THREE.Vector3) {
    this.position.copy(position);
  }
  public setOrientation(forward: THREE.Vector3, _up: boolean) {
    this.lookAt(forward);
    this.up.set(0, 1, 0);
  }

  public setRotation(rotation: THREE.Euler, up: boolean) {
    this.rotation.copy(rotation);
    if (up) {
      this.up.set(0, 1, 0);
    }
  }

  public addToWorld(world: World) {
    world.graphicsWorld.add(this);
    console.log(
      "Character added to world:",
      this.getWorldPosition(new THREE.Vector3())
    );
  }

  public removeFromWorld(world: World) {
    world.graphicsWorld.remove(this);
  }

  public update(deltaTime: number) {
    this.updateMatrixWorld();

    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }
}
