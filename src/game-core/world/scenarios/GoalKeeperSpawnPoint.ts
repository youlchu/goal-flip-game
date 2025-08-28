import type { ISpawnPoint } from "../../interfaces/ISpawnPoint";
import * as THREE from "three";
import { World } from "../World";
import { Goalkeeper } from "../../characters/Goalkeeper";

export class GoalKeeperSpawnPoint implements ISpawnPoint<Goalkeeper> {
  private object: THREE.Object3D;

  constructor(object: THREE.Object3D) {
    this.object = object;
  }

  public spawn(
    world: World,
    callback?: (character: Goalkeeper) => void
  ): Goalkeeper {
    const player = new Goalkeeper(world.characterModel, world);
    const worldPos = new THREE.Vector3();
    this.object.getWorldPosition(worldPos);
    player.setPosition(worldPos);
    // const forward = Utils.getForward(this.object);
    // player.setOrientation(forward, true);
    player.setOrientation(new THREE.Vector3(0, 0, -3.14), false);

    world.add(player);

    if (callback) {
      callback(player);
    }

    return player;
  }
}
