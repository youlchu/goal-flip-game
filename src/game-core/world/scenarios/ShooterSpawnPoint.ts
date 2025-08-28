import type { ISpawnPoint } from "../../interfaces/ISpawnPoint";
import * as THREE from "three";
import { World } from "../World";
import * as Utils from "../../core/FunctionLibrary";

import { Shooter } from "../../characters/Shooter";

export class ShooterSpawnPoint implements ISpawnPoint<Shooter> {
  private object: THREE.Object3D;

  constructor(object: THREE.Object3D) {
    this.object = object;
  }

  public spawn(world: World, callback?: (character: Shooter) => void): Shooter {
    const player = new Shooter(world.characterModel, world);
    const worldPos = new THREE.Vector3();
    this.object.getWorldPosition(worldPos);
    player.setPosition(worldPos);
    const forward = Utils.getForward(this.object);
    player.setOrientation(forward, true);

    world.add(player);

    if (callback) {
      callback(player);
    }

    return player;
  }
}
