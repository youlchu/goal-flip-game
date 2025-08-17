/* eslint-disable @typescript-eslint/no-unused-vars */
import { World } from "../world/World";
import type { IInputReceiver } from "../interfaces/IInputReceiver";
import type { IUpdatable } from "../interfaces/IUpdatable";

export class InputManager implements IUpdatable {
  public updateOrder: number = 3;

  public world: World;
  public domElement: HTMLElement;
  public pointerLock: boolean;
  public isLocked: boolean;
  public inputReceiver: IInputReceiver | undefined;

  public boundOnMouseDown: (evt: MouseEvent) => void;
  public boundOnMouseMove: (evt: MouseEvent) => void;
  public boundOnMouseUp: (evt: MouseEvent) => void;
  public boundOnMouseWheelMove: (evt: WheelEvent) => void;
  public boundOnPointerlockChange: (evt: Event) => void;
  public boundOnPointerlockError: (evt: Event) => void;
  public boundOnKeyDown: (evt: KeyboardEvent) => void;
  public boundOnKeyUp: (evt: KeyboardEvent) => void;

  constructor(world: World, domElement: HTMLElement) {
    this.world = world;
    this.pointerLock = world.params.pointerLock;
    this.domElement = domElement || document.body;
    this.isLocked = false;

    // Bindings for later event use
    // Mouse
    this.boundOnMouseDown = (evt) => this.onMouseDown(evt as MouseEvent);
    this.boundOnMouseMove = (evt) => this.onMouseMove(evt);
    this.boundOnMouseUp = (evt) => this.onMouseUp(evt);
    this.boundOnMouseWheelMove = (evt) => this.onMouseWheelMove(evt);

    // Pointer lock
    this.boundOnPointerlockChange = (evt: Event) =>
      this.onPointerlockChange(evt);
    this.boundOnPointerlockError = (evt: Event) => this.onPointerlockError(evt);

    // Keys
    this.boundOnKeyDown = (evt) => this.onKeyDown(evt);
    this.boundOnKeyUp = (evt) => this.onKeyUp(evt);

    // Init event listeners
    // Mouse
    this.domElement.addEventListener("mousedown", this.boundOnMouseDown, false);
    document.addEventListener("wheel", this.boundOnMouseWheelMove, false);
    document.addEventListener(
      "pointerlockchange",
      this.boundOnPointerlockChange,
      false
    );
    document.addEventListener(
      "pointerlockerror",
      this.boundOnPointerlockError,
      false
    );

    // Keys
    // document.addEventListener("keydown", this.boundOnKeyDown, false);
    // document.addEventListener("keyup", this.boundOnKeyUp, false);

    world.registerUpdatable(this);

    // this.world.emitter.on("request-pointer-lock", () => {
    //   this.pointerLock = true;
    //   this.domElement.requestPointerLock();
    // });
  }

  public update(_timestep: number, unscaledTimeStep: number): void {
    // if (
    //   this.inputReceiver === undefined &&
    //   this.world !== undefined &&
    //   this.world.cameraOperator !== undefined
    // ) {
    //   this.setInputReceiver(this.world.cameraOperator)
    // }

    this.inputReceiver?.inputReceiverUpdate(unscaledTimeStep);
  }

  public setInputReceiver(receiver: IInputReceiver): void {
    this.inputReceiver = receiver;
    this.inputReceiver.inputReceiverInit();
  }

  public setPointerLock(enabled: boolean): void {
    this.pointerLock = enabled;
  }

  public onPointerlockChange(_event: Event): void {
    if (document.pointerLockElement === this.domElement) {
      this.domElement.addEventListener(
        "mousemove",
        this.boundOnMouseMove,
        false
      );
      this.domElement.addEventListener("mouseup", this.boundOnMouseUp, false);
      document.addEventListener("keydown", this.boundOnKeyDown, false);
      document.addEventListener("keyup", this.boundOnKeyUp, false);
      this.isLocked = true;
    } else {
      this.domElement.removeEventListener(
        "mousemove",
        this.boundOnMouseMove,
        false
      );
      this.domElement.removeEventListener(
        "mouseup",
        this.boundOnMouseUp,
        false
      );
      document.removeEventListener("keydown", this.boundOnKeyDown, false);
      document.removeEventListener("keyup", this.boundOnKeyUp, false);
      this.isLocked = false;
    }
  }

  public onPointerlockError(_event: Event): void {
    console.error("PointerLockControls: Unable to use Pointer Lock API");
  }

  public onMouseDown(event: MouseEvent): void {
    if (this.pointerLock) {
      if (!this.isLocked) {
        this.domElement.requestPointerLock();
      }
      if (this.inputReceiver !== undefined) {
        this.inputReceiver.handleMouseButton(
          event,
          "mouse" + event.button,
          true
        );
      }
    } else {
      this.domElement.addEventListener(
        "mousemove",
        this.boundOnMouseMove,
        false
      );
      this.domElement.addEventListener("mouseup", this.boundOnMouseUp, false);
    }
  }

  public onMouseMove(event: MouseEvent): void {
    if (this.inputReceiver !== undefined) {
      this.inputReceiver.handleMouseMove(
        event,
        event.movementX,
        event.movementY
      );
    }
  }

  public onMouseUp(event: MouseEvent): void {
    if (!this.pointerLock) {
      this.domElement.removeEventListener(
        "mousemove",
        this.boundOnMouseMove,
        false
      );
      this.domElement.removeEventListener(
        "mouseup",
        this.boundOnMouseUp,
        false
      );
    }

    if (this.inputReceiver !== undefined) {
      this.inputReceiver.handleMouseButton(
        event,
        "mouse" + event.button,
        false
      );
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    // Prevent common browser shortcuts
    if (
      // Tab navigation
      event.code === "Tab" ||
      // Window/tab closing
      (event.code === "KeyW" && event.ctrlKey) ||
      // Browser refresh
      event.code === "F5" ||
      // Save page
      (event.code === "KeyS" && event.ctrlKey) ||
      // Find in page
      (event.code === "KeyF" && event.ctrlKey) ||
      // Print page
      (event.code === "KeyP" && event.ctrlKey) ||
      // New window/tab
      (event.code === "KeyN" && event.ctrlKey) ||
      // Dev tools
      event.code === "F12" ||
      // Context menu
      event.code === "ContextMenu" ||
      // Alt+F4
      (event.code === "F4" && event.altKey)
    ) {
      event.preventDefault();
    }

    if (this.inputReceiver !== undefined) {
      this.inputReceiver.handleKeyboardEvent(event, event.code, true);
    }
  }

  public onKeyUp(event: KeyboardEvent): void {
    if (this.inputReceiver !== undefined) {
      this.inputReceiver.handleKeyboardEvent(event, event.code, false);
    }
  }

  public onMouseWheelMove(event: WheelEvent): void {
    if (this.inputReceiver !== undefined) {
      this.inputReceiver.handleMouseWheel(event, event.deltaY);
    }
  }

  public pointerLockOut(): void {
    if (this.pointerLock) {
      document.exitPointerLock();
      this.pointerLock = false;
    }
  }

  dispose(): void {
    this.domElement.removeEventListener(
      "mousedown",
      this.boundOnMouseDown,
      false
    );
    document.removeEventListener("wheel", this.boundOnMouseWheelMove, false);
    document.removeEventListener(
      "pointerlockchange",
      this.boundOnPointerlockChange,
      false
    );
    document.removeEventListener(
      "pointerlockerror",
      this.boundOnPointerlockError,
      false
    );

    document.removeEventListener("keydown", this.boundOnKeyDown, false);
    document.removeEventListener("keyup", this.boundOnKeyUp, false);
  }
}
