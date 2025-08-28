import * as THREE from "three";
import type { World } from "../World";
import type { ISpawnPoint } from "../../interfaces/ISpawnPoint";
import { Ball } from "../../objects/Ball";

export class BallSpawnPoint implements ISpawnPoint<Ball> {
  private object: THREE.Object3D;

  constructor(object: THREE.Object3D) {
    this.object = object;
  }

  public spawn(world: World, callback?: (entity: Ball) => void): Ball {
    const ball = new Ball(world.ballModel, world);
    const worldPos = new THREE.Vector3();
    this.object.getWorldPosition(worldPos);
    const worldQuat = new THREE.Quaternion();
    this.object.getWorldQuaternion(worldQuat);
    ball.setPosition(worldPos.x, worldPos.y, worldPos.z);
    ball.setRotation(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w);
    world.add(ball);

    if (callback) {
      callback(ball);
    }

    return ball;
  }
}
