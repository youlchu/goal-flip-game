export class LoadingTrackerEntry {
  public name: string;
  public path: string;
  public progress: number = 0;
  public finished: boolean = false;

  constructor(path: string, name: string) {
    this.path = path;
    this.name = name;
  }
}
