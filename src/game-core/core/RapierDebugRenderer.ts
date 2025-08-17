import { World } from "@dimforge/rapier3d";
import { BufferAttribute, LineSegments, Scene, LineBasicMaterial } from "three";

export class RapierDebugRenderer {
  private world: World;
  private ref: LineSegments;

  constructor(scene: Scene, rapierWorld: World) {
    this.world = rapierWorld;

    const material = new LineBasicMaterial();
    material.vertexColors = true;
    material.color.set(0xffffff);

    this.ref = new LineSegments(undefined, material);
    this.ref.frustumCulled = false;
    scene.add(this.ref);
  }

  public update() {
    const buffers = this.world.debugRender();

    this.ref.geometry.setAttribute(
      "position",
      new BufferAttribute(buffers.vertices, 3)
    );

    this.ref.geometry.setAttribute(
      "color",
      new BufferAttribute(buffers.colors, 4)
    );
  }

  //     update() {
  //       const mesh = this.ref;
  //       if (!mesh) return;

  //       const buffers = this.world.debugRender();

  //       mesh.geometry.setAttribute(
  //         "position",
  //         new BufferAttribute(buffers.vertices, 3)
  //       );
  //       mesh.geometry.setAttribute("color", new BufferAttribute(buffers.colors, 4));
  //     }
}
