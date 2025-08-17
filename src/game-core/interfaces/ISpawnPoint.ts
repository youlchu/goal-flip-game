import { World } from "../world/World";
import { LoadingManager } from "../core/LoadingManager";

export interface ISpawnPoint {
  spawn(
    loadingManager: LoadingManager,
    world: World,
    model?: string,
    userId?: string
  ): void;
}
