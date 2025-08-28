import * as THREE from "three";
import type { ISpawnPoint } from "../interfaces/ISpawnPoint";
import { World } from "./World";

export abstract class Scenario {
  public id: string;
  public name!: string;
  public spawnAlways: boolean = false;
  public default: boolean = false;
  public world: World;
  public descriptionTitle!: string;
  public descriptionContent!: string;

  rootNode: THREE.Object3D;
  spawnPoints: ISpawnPoint[] = [];
  invisible: boolean = false;

  protected entities: Map<string, any> = new Map();
  protected entitiesByType: Map<string, any[]> = new Map();

  constructor(root: THREE.Object3D, world: World) {
    this.rootNode = root;
    this.world = world;
    this.id = root.name;

    // Scenario
    if (root.userData.name) {
      this.name = root.userData.name;
    }
    if (root.userData.default && root.userData.default === "true") {
      this.default = true;
    }
  }

  protected onEntitySpawned(entity: any): void {
    const entityType = entity.constructor.name;
    const entityId = entity.id || `${entityType}_${Date.now()}`;

    this.entities.set(entityId, entity);

    if (!this.entitiesByType.has(entityType)) {
      this.entitiesByType.set(entityType, []);
    }
    this.entitiesByType.get(entityType)!.push(entity);
  }

  protected onAllEntitiesSpawned(): void {
    // For overriding - after all entities have been spawned
  }

  public getEntity<T>(id: string): T | undefined {
    return this.entities.get(id) as T;
  }

  public getEntitiesByType<T>(type: string): T[] {
    return (this.entitiesByType.get(type) as T[]) || [];
  }

  public getAllEntities(): any[] {
    return Array.from(this.entities.values());
  }

  public createLaunchLink(): void {
    this.world.launchScenario(this.id);
  }

  public launch(world: World): void {
    this.spawnPoints.forEach((sp) => {
      const entity = sp.spawn(world, (spawnedEntity) => {
        this.onEntitySpawned(spawnedEntity);
      });

      if (entity) {
        this.onEntitySpawned(entity);
      }
    });

    this.onAllEntitiesSpawned();
  }
  // loadingManager.createWelcomeScreenCallback(this)
}
