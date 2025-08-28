import { EntityType } from "../enums/EntityType";
import type { World } from "../world/World";
import { ICharacter } from "./ICharacter";

import * as THREE from "three";

export class Goalkeeper extends ICharacter {
  uuid: string = THREE.MathUtils.generateUUID();

  entityType: EntityType = EntityType.Goalkeeper;

  constructor(model: THREE.Object3D, world: World) {
    super(model, world);

    this.setAnimation("idle", 0.1);
    // this.setAnimation("right_center_take", 0.1);
  }
}
