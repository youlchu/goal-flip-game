export class KeyBinding {
  // Holds the key codes associated with this binding
  public eventCodes: string[];

  // Indicates if the key is currently pressed
  public isPressed: boolean = false;

  // Flags to indicate if the key was just pressed or released
  public justPressed: boolean = false;
  public justReleased: boolean = false;

  /**
   * Constructs a new KeyBinding instance.
   * @param {string[]} code - An array of key codes that will trigger this binding.
   */
  constructor(...code: string[]) {
    this.eventCodes = code;
  }

  clearBindings(): void {
    this.isPressed = false;
    this.justPressed = false;
    this.justReleased = false;
  }
}
