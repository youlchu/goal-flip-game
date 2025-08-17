import * as THREE from "three";
import { World } from "./World";
import type { IUpdatable } from "../interfaces/IUpdatable";
import { CSM } from "three/examples/jsm/csm/CSM.js";
import { Sky as ThreeSky } from "three/examples/jsm/objects/Sky.js";
// import { Water } from "../objects/Water";

export class Sky extends THREE.Object3D implements IUpdatable {
  public updateOrder: number = 5;
  public sunPosition: THREE.Vector3 = new THREE.Vector3();
  public csm: CSM;
  // public water: Water;
  public sky: ThreeSky;

  set theta(value: number) {
    this._theta = value;
    this.refreshSunPosition();
    this.refreshHemiIntensity();
  }

  set phi(value: number) {
    this._phi = value;
    this.refreshSunPosition();
    this.refreshHemiIntensity();
  }

  private _phi: number = 45;
  private _theta: number = 90;
  private hemiLight: THREE.HemisphereLight;
  private maxLightIntensity: number = 0.7; // lowered to soften
  private minLightIntensity: number = 0.2; // raised base

  private world: World;
  private sunNeedsUpdate: boolean = true;

  constructor(world: World) {
    super();
    this.world = world;

    // Ambient light softened
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.world.graphicsWorld.add(ambientLight);

    // Hemisphere light softened
    this.hemiLight = new THREE.HemisphereLight(0xe91e63, 0x8d5769, 0.3);
    this.hemiLight.position.set(0, 30, 0);
    this.world.graphicsWorld.add(this.hemiLight);

    this.initHdr();

    const cubeTextureLoader = new THREE.CubeTextureLoader();
    cubeTextureLoader.setPath("water/");

    // this.water = new Water();
    // this.water.position.y = 17;
    // this.water.rotation.x = -Math.PI / 2;
    // this.water.scale.setScalar(100);
    // this.world.graphicsWorld.add(this.water);

    this.sky = new ThreeSky();
    this.sky.scale.setScalar(4500);
    this.add(this.sky);
    this.initSkyMaterial();
    this.attach(this.sky);

    // Reduce CSM light intensity for softer shadows
    this.csm = new CSM({
      maxFar: 64,
      lightFar: 2096,
      cascades: 3,
      shadowMapSize: 1024,
      camera: this.world.camera,
      parent: this.world.graphicsWorld,
      lightIntensity: 1.5,
      shadowBias: -0.0001,
    });
    this.csm.lights.forEach((light) => {
      light.shadow.radius = 0.8; // softened shadow edges
    });

    world.graphicsWorld.add(this);
    world.registerUpdatable(this);
  }
  private initSkyMaterial() {
    const { turbidity, rayleigh, mieCoefficient, mieDirectionalG } =
      this.sky.material.uniforms;
    // Blue sky, low brightness
    turbidity.value = 10;
    rayleigh.value = 0.1;
    mieCoefficient.value = 0.00001;
    mieDirectionalG.value = 0.01;
  }

  public update(_timeScale: number): void {
    this.position.copy(this.sunPosition);
    if (this.sunNeedsUpdate) {
      this.refreshSunPosition();
      this.sunNeedsUpdate = false;
    }
    this.csm.update();
    this.csm.lightDirection.copy(this.sunPosition.clone().negate().normalize());
    // this.water.update(clock.getElapsedTime());
  }

  public refreshSunPosition(): void {
    const sunDistance = 50;
    const thetaRad = THREE.MathUtils.degToRad(this._theta);
    const phiRad = THREE.MathUtils.degToRad(this._phi);
    this.sunPosition.set(
      sunDistance * Math.sin(thetaRad) * Math.cos(phiRad),
      sunDistance * Math.sin(phiRad),
      sunDistance * Math.cos(thetaRad) * Math.cos(phiRad)
    );
    this.sky.material.uniforms.sunPosition.value
      .copy(this.sunPosition)
      .normalize();
    this.sunNeedsUpdate = true;
  }

  public refreshHemiIntensity(): void {
    const skyColor = new THREE.Color().setHSL(0.55, 0.4, 0.7);
    const groundColor = new THREE.Color().setHSL(0.1, 0.5, 0.8);
    this.hemiLight.color.set(skyColor);
    this.hemiLight.groundColor.set(groundColor);

    const phiOffset = Math.abs(this._phi - 90);
    this.hemiLight.intensity =
      this.minLightIntensity +
      Math.pow(1 - phiOffset / 90, 0.3) *
        (this.maxLightIntensity - this.minLightIntensity);
  }

  async initHdr() {
    // HDR environment settings (unchanged)
    // const hdrLoader = new EXRLoader()
    // const envMap = await hdrLoader.loadAsync('/test.exr')
    // envMap.mapping = THREE.EquirectangularReflectionMapping
    // this.world.graphicsWorld.background = envMap
    // this.world.graphicsWorld.backgroundBlurriness = 0.05
    // this.world.graphicsWorld.backgroundRotation = new THREE.Euler(0, 0, 0)
    // this.world.graphicsWorld.environment = envMap
    // this.world.graphicsWorld.environmentIntensity = 3
    // this.world.graphicsWorld.fog = new THREE.Fog(0x000000, 30, 100)
  }
}
