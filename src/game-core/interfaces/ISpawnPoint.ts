import type { World } from "../world/World";

export interface ISpawnPoint<T = any> {
  spawn(world: World, callback?: (entity: T) => void): T | void;
}
