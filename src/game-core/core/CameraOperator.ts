import * as THREE from "three";
// import * as Utils from "./FunctionLibrary";
import { World } from "../world/World";
import type { IUpdatable } from "../interfaces/IUpdatable";
export class CameraOperator implements IUpdatable {
  public updateOrder: number = 4;
  // public cameraControls: OrbitControls;
  public world: World;
  public camera: THREE.Camera;
  public target: THREE.Vector3;

  constructor(world: World, camera: THREE.Camera) {
    this.world = world;
    this.camera = camera;
    this.target = new THREE.Vector3();

    this.camera.position.set(-0.5, 0.1, -7);
    this.camera.lookAt(0, 0, 0);

    // this.cameraControls = new OrbitControls(
    //   this.camera,
    //   this.world.renderer.domElement
    // );
    // this.cameraControls.enableDamping = true;
    // this.cameraControls.dampingFactor = 0.25;
    // this.cameraControls.screenSpacePanning = false;

    this.world.graphicsWorld.add(this.camera);

    world.registerUpdatable(this);
  }
  update(_timestep: number, _unscaledTimeStep: number): void {
    // this.cameraControls.update();
  }
}
