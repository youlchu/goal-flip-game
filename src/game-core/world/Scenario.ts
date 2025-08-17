import * as THREE from "three";
import type { ISpawnPoint } from "../interfaces/ISpawnPoint";
import { World } from "./World";
import { LoadingManager } from "../core/LoadingManager";

export class Scenario {
  public id: string;
  public name!: string;
  public spawnAlways: boolean = false;
  public default: boolean = false;
  public world: World;
  public descriptionTitle!: string;
  public descriptionContent!: string;

  //@ts-ignore
  private rootNode: THREE.Object3D;
  private spawnPoints: ISpawnPoint[] = [];
  private invisible: boolean = false;
  // private initialCameraAngle!: number

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

    // if (root.userData['camera_angle'] !== undefined) {
    //   this.initialCameraAngle = root.userData.camera_angle
    // }

    if (!this.invisible) this.createLaunchLink();

    // Find all scenario spawns and enitites
    root.traverse((child) => {
      if (child.userData && child.userData.data) {
        if (child.userData.data === "creature") {
          //   this.spawnPoints.push();
        }
      }
      if (child.userData.data === "spawn") {
        if (
          child.userData.type === "car" ||
          child.userData.type === "airplane" ||
          child.userData.type === "heli"
        ) {
          //   this.spawnPoints.push();
        } else if (child.userData.type === "player") {
          //   this.spawnPoints.push();
        }
      }
    });
  }

  public createLaunchLink(): void {
    // this.world.params[this.name] = () => {
    //   this.world.launchScenario(this.id);
    // };
  }

  public launch(loadingManager: LoadingManager, world: World): void {
    this.spawnPoints.forEach((sp) => {
      sp.spawn(loadingManager, world);
    });
    // loadingManager.createWelcomeScreenCallback(this)
  }
}
