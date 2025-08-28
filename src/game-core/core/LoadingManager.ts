import * as THREE from "three";
import {
  type GLTF,
  GLTFLoader,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import { LoadingTrackerEntry } from "./LoadingTrackerEntry";

import { Scenario } from "../world/Scenario";

import { World } from "../world/World";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
);

export class LoadingManager {
  public firstLoad: boolean = true;
  public onFinishedCallback: () => void = () => {};

  private world: World;
  private gltfLoader: GLTFLoader;
  private loadingTracker: LoadingTrackerEntry[] = [];

  constructor(world: World) {
    this.world = world;
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(dracoLoader);
    this.world.setTimeScale(0);
  }

  public loadGLTF(
    path: string,
    name: string,
    onLoadingFinished: (gltf: GLTF) => void
  ): void {
    const trackerEntry = this.addLoadingEntry(path, name);

    this.gltfLoader.load(
      path,
      (gltf) => {
        onLoadingFinished(gltf);
        this.doneLoading(trackerEntry);
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          trackerEntry.progress = xhr.loaded / xhr.total;
        }
      },
      (error) => {
        console.error("Error loading GLTF:", error);
        console.error("Path:", path);
        const dummyGLTF = this.createDummyGLTF();

        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.1, 0.1),
          new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        dummyGLTF.scene.add(mesh);
        onLoadingFinished(dummyGLTF as unknown as GLTF);
        this.doneLoading(trackerEntry);
        this.doneLoading(trackerEntry);
      }
    );
  }

  public addLoadingEntry(path: string, name: string): LoadingTrackerEntry {
    const entry = new LoadingTrackerEntry(path, name);
    this.loadingTracker.push(entry);

    return entry;
  }

  public doneLoading(trackerEntry: LoadingTrackerEntry): void {
    trackerEntry.finished = true;
    trackerEntry.progress = 1;

    if (this.isLoadingDone()) {
      this.world.setTimeScale(1);
      console.log("Loading completed, game ready!");
      if (this.onFinishedCallback !== undefined) {
        this.onFinishedCallback();
      }
    }
  }

  public createWelcomeScreenCallback(_scenario: Scenario): void {
    if (this.onFinishedCallback === undefined) {
      this.onFinishedCallback = () => {};
    }
  }

  private getLoadingPercentage() {
    let done = true;
    let total = 0;
    let finished = 0;
    let name = "";
    for (const item of this.loadingTracker) {
      total++;
      finished += item.progress;
      name = item.name;
      if (!item.finished) done = false;
    }

    if (done == true && this.firstLoad == true) {
      this.firstLoad = false;
    }

    return {
      percentage: Math.floor((finished / total) * 100),
      name,
      done,
      firstLoad: this.firstLoad,
    };
  }

  public listenForLoadingProgress(
    callback: (
      percentage: number,
      name: string,
      done: boolean,
      firstLoad: boolean
    ) => void
  ): void {
    const interval = setInterval(() => {
      const { percentage, name, done, firstLoad } = this.getLoadingPercentage();
      callback(percentage, name, done, firstLoad);

      if (this.isLoadingDone()) {
        clearInterval(interval);
      }
    }, 100);
  }

  private isLoadingDone(): boolean {
    for (const entry of this.loadingTracker) {
      if (!entry.finished) return false;
    }
    return true;
  }

  private createDummyGLTF() {
    return {
      scene: new THREE.Scene(),
      animations: [],
      cameras: [],
      asset: {},
      parser: {},
      userData: {},
    };
  }
}
