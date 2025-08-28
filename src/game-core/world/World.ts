import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { Sky } from "./Sky";

import mitt, { type Emitter } from "mitt";
import { InputManager } from "../core/InputManager";
import { LoadingManager } from "../core/LoadingManager";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { CameraOperator } from "../core/CameraOperator";
import type { IUpdatable } from "../interfaces/IUpdatable";

import _ from "lodash";
import type { IWorldEntity } from "../interfaces/IWorldEntity";
import { Scenario } from "./Scenario";

import { getRapier } from "../core/rapier";
import * as Utils from "../core/FunctionLibrary";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TrimeshCollider } from "../physics/colliders/TrimeshCollider";
import { CylinderCollider } from "../physics/colliders/CylinderCollider";
import { PlaneCollider } from "../physics/colliders/PlaneCollider";
import { RapierDebugRenderer } from "../core/RapierDebugRenderer";
import { PenaltyScenario } from "./scenarios/PenaltyScenario";

interface IWorldParams {
  timeScale: number;
  pointerLock: boolean;
}

export class World {
  public physicsWorld: RAPIER.World | null = null;
  public element: HTMLElement;

  public rapierDebugRenderer: RapierDebugRenderer | undefined;

  public renderer: THREE.WebGLRenderer;
  public camera: THREE.PerspectiveCamera;
  public cameraOperator: CameraOperator;
  public graphicsWorld: THREE.Scene;
  public composer: any;

  public sky: Sky;

  public emitter: Emitter<any>;
  public physicsFrameRate: number;
  public physicsFrameTime: number;
  public accumulator: number = 0;
  public physicsMaxPrediction: number;
  public clock: THREE.Clock;
  public renderDelta: number;
  public logicDelta: number;
  public requestDelta: number = 0;
  public sinceLastFrame: number;
  public justRendered: boolean;
  public inputManager?: InputManager;
  public loadingManager: LoadingManager;

  public characterModel!: THREE.Object3D;
  public ballModel!: THREE.Object3D;

  public scenarios: Scenario[] = [];
  private lastScenarioID!: string;

  public updatables: IUpdatable[] = [];

  public timeScaleTarget: number = 1;

  public isGameRunning: boolean = true;
  public animationFrameId: number | null = null;

  public params: IWorldParams = {
    pointerLock: false,
    timeScale: 1,
  };

  constructor(element: HTMLElement, worldScenePath: string) {
    console.log("World constructor başladı");
    this.element = element;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.graphicsWorld = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      30,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );

    // Composer
    this.composer = new EffectComposer(this.renderer);

    this.physicsFrameRate = 60;
    this.physicsFrameTime = 1 / this.physicsFrameRate;
    this.physicsMaxPrediction = this.physicsFrameRate;

    // RenderLoop
    this.clock = new THREE.Clock();
    this.renderDelta = 0;
    this.logicDelta = 0;
    this.sinceLastFrame = 0;
    this.justRendered = false;

    this.inputManager = new InputManager(this, this.renderer.domElement);
    this.cameraOperator = new CameraOperator(this, this.camera);
    this.sky = new Sky(this);

    function onWindowResize(world: World): void {
      world.camera.aspect = window.innerWidth / window.innerHeight;
      world.camera.updateProjectionMatrix();
      world.renderer!.setSize(window.innerWidth, window.innerHeight);

      const pixelRatio = window.devicePixelRatio;

      world.composer.setSize(
        window.innerWidth * pixelRatio,
        window.innerHeight * pixelRatio
      );
    }
    window.addEventListener("resize", () => onWindowResize(this), false);

    this.loadingManager = new LoadingManager(this);
    this.emitter = mitt();
    this.generateHTML();

    this.initPhysics(worldScenePath);

    this.render(this);
  }

  public async initPhysics(worldScenePath: string) {
    const rapierModule = await getRapier();
    this.physicsWorld = new rapierModule.World({ x: 0, y: -9.81, z: 0 });

    this.loadingManager.loadGLTF(worldScenePath, "World", (gltf) => {
      this.loadScene(this.loadingManager, gltf);
    });

    // this.rapierDebugRenderer = new RapierDebugRenderer(
    //   this.graphicsWorld,
    //   this.physicsWorld!
    // );
  }

  public loadScene(_loadingManager: LoadingManager, gltf: GLTF): void {
    const characterModel = gltf.scene.getObjectByName("character");
    characterModel?.removeFromParent();
    if (characterModel) {
      characterModel!.animations = gltf.animations;

      this.characterModel = characterModel;
    }
    const ballModel = gltf.scene.getObjectByName("ball");
    console.log("ballModel:", ballModel);
    ballModel?.removeFromParent();
    if (ballModel) this.ballModel = ballModel;

    gltf.scene.traverse((child: THREE.Object3D<THREE.Object3DEventMap>) => {
      if (child.userData) {
        if (child.type === "Mesh") {
          Utils.setupMeshProperties(child);
        }

        if (child.userData.light) {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.MeshStandardMaterial).emissiveIntensity =
              Number(child.userData.light);
            (child.material as THREE.MeshStandardMaterial).emissive.setHex(
              0xffffff
            );
          }
        }

        if (child.userData.data) {
          if (child.userData.data === "physics") {
            if (child.userData.visible == "true") {
              child.visible = true;
            } else {
              child.visible = false;
            }

            if (child.userData.type) {
              if (child.userData.type === "box") {
                const boxDesc = RAPIER.ColliderDesc.cuboid(
                  Math.abs(child.scale.x),
                  Math.abs(child.scale.y),
                  Math.abs(child.scale.z)
                );
                const boxBody = this.physicsWorld!.createRigidBody(
                  RAPIER.RigidBodyDesc.fixed().setTranslation(
                    child.position.x,
                    child.position.y,
                    child.position.z
                  )
                );

                boxBody.setRotation(Utils.rapierQuat(child.quaternion), false);
                this.physicsWorld!.createCollider(boxDesc, boxBody);
              } else if (child.userData.type === "trimesh") {
                const phys = new TrimeshCollider(child);

                const body = this.physicsWorld!.createRigidBody(
                  phys.rigidBodyDesc
                );

                this.physicsWorld!.createCollider(phys.colliderDesc, body);
              } else if (child.userData.type === "cylinder") {
                const phys = new CylinderCollider(child);

                const body = this.physicsWorld!.createRigidBody(
                  phys.rigidBodyDesc
                );
                this.physicsWorld!.createCollider(phys.colliderDesc, body);
              } else if (child.userData.type === "plane") {
                const phys = new PlaneCollider(child);

                const body = this.physicsWorld!.createRigidBody(
                  phys.rigidBodyDesc
                );
                this.physicsWorld!.createCollider(phys.colliderDesc, body);
              }
            }
          }

          if (child.userData.data === "scenario") {
            child.userData.visible = false;
            this.scenarios.push(new PenaltyScenario(child, this));
          }
        }
      }
    });

    this.graphicsWorld.add(gltf.scene);
    // Launch default scenario
    let defaultScenarioID: string | undefined;
    for (const scenario of this.scenarios) {
      if (scenario.default) {
        defaultScenarioID = scenario.id;
        break;
      }
    }
    if (defaultScenarioID !== undefined) this.launchScenario(defaultScenarioID);
  }

  private generateHTML(): void {
    this.element.appendChild(this.renderer!.domElement);

    this.renderer!.domElement.style.position = "absolute";
    this.renderer!.domElement.style.top = "0px";
    this.renderer!.domElement.style.left = "0px";
    this.renderer!.domElement.style.display = "block";
    this.renderer!.domElement.id = "game-canvas";
    this.renderer!.domElement.style.width = "100vw";
    this.renderer!.domElement.style.height = "100vh";
    this.renderer!.domElement.style.backgroundColor = "#FFF";

    console.log("Canvas stilleri uygulandı");
  }

  public update(timeStep: number, unscaledTimeStep: number): void {
    this.updatePhysics();

    // Update registred objects
    this.updatables.forEach((entity) => {
      entity.update(timeStep, unscaledTimeStep);
    });

    // Lerp time scale
    this.params.timeScale = THREE.MathUtils.lerp(
      this.params.timeScale,
      this.timeScaleTarget,
      0.2
    );

    this.rapierDebugRenderer?.update();
  }

  public updatePhysics(): void {
    // Step the physics world
    this.physicsWorld?.step();
  }

  /**
   * Rendering loop.
   * Implements fps limiter and frame-skipping
   * Calls world's "update" function before rendering.
   * @param {World} world
   */
  public render(world: World): void {
    if (!this.isGameRunning) return;

    this.requestDelta = this.clock.getDelta();

    this.animationFrameId = requestAnimationFrame(() => {
      this.render(world);
    });

    // Getting timeStep
    const unscaledTimeStep =
      this.requestDelta + this.renderDelta + this.logicDelta;
    let timeStep = unscaledTimeStep * (this.params.timeScale as number);
    timeStep = Math.min(timeStep, 1 / 30); // min 30 fps

    // Logic
    world.update(timeStep, unscaledTimeStep);

    // Measuring logic time
    this.logicDelta = this.clock.getDelta();

    // Frame limiting
    const interval = 1 / 60;
    this.sinceLastFrame +=
      this.requestDelta + this.renderDelta + this.logicDelta;
    this.sinceLastFrame %= interval;
    if (false) this.composer.render();
    else this.renderer.render(this.graphicsWorld, this.camera);

    this.renderDelta = this.clock.getDelta();
  }

  public setTimeScale(value: number): void {
    this.params.timeScale = value;
    this.timeScaleTarget = value;
  }

  public add(worldEntity: IWorldEntity): void {
    worldEntity.addToWorld(this);
    this.registerUpdatable(worldEntity);
  }

  public registerUpdatable(registree: IUpdatable): void {
    this.updatables.push(registree);
    this.updatables.sort((a, b) => (a.updateOrder > b.updateOrder ? 1 : -1));
  }

  public remove(worldEntity: IWorldEntity): void {
    worldEntity.removeFromWorld(this);
    this.unregisterUpdatable(worldEntity);
  }

  public unregisterUpdatable(registree: IUpdatable): void {
    _.pull(this.updatables, registree);
  }

  public launchScenario(scenarioID: string): void {
    this.lastScenarioID = scenarioID;

    this.clearEntities();

    // Launch default scenario
    // if (!loadingManager) loadingManager = new LoadingManager(this);
    for (const scenario of this.scenarios) {
      if (scenario.id === scenarioID || scenario.spawnAlways) {
        scenario.launch(this);
      }
    }
  }

  public restartScenario(): void {
    if (this.lastScenarioID !== undefined) {
      document.exitPointerLock();
      this.launchScenario(this.lastScenarioID);
    } else {
      console.warn("Can't restart scenario. Last scenarioID is undefined.");
    }
  }

  public clearEntities(): void {
    // for (let i = 0; i < this.updatables.length; i++) {
    //   this.remove(this.updatables[i]);
    //   i--;
    // }
  }

  public scrollTheTimeScale(scrollAmount: number): void {
    // Changing time scale with scroll wheel
    const timeScaleBottomLimit = 0.003;
    const timeScaleChangeSpeed = 1.3;

    if (scrollAmount > 0) {
      this.timeScaleTarget /= timeScaleChangeSpeed;
      if (this.timeScaleTarget < timeScaleBottomLimit) this.timeScaleTarget = 0;
    } else {
      this.timeScaleTarget *= timeScaleChangeSpeed;
      if (this.timeScaleTarget < timeScaleBottomLimit)
        this.timeScaleTarget = timeScaleBottomLimit;
      this.timeScaleTarget = Math.min(this.timeScaleTarget, 1);
    }
  }

  public shootToGoal(): void {
    // if (this.balls.length > 0) {
    //   const ball = this.balls[0];
    //   const force = new THREE.Vector3(0, 0.05, 0.1);
    //   ball.applyForce(force);
    //   const spin = new THREE.Vector3(0, 0.01, 0);
    //   ball.addSpin(spin);
    // }
  }
}
