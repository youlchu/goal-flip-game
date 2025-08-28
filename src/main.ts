import "./style.css";
import { World } from "./game-core/world/World";
import * as THREE from "three";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div id="game-container" style="width:100vw; height:100vh; position:absolute;">
    <button id="shoot-btn" class="shoot-button">⚽ ŞUT ÇEK!</button>
  </div>
`;

let world: World;

init();

function init() {
  world = new World(
    document.getElementById("game-container")!,
    "soccer-field.glb"
  );

  // Buton event listener
  const shootBtn = document.getElementById("shoot-btn");
  shootBtn?.addEventListener("click", shootBall);
}

function shootBall() {
  if (world) {
    world.shootToGoal();
  }
}
