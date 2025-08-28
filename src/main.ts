import "./style.css";
import { World } from "./game-core/world/World";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div id="game-container" style="width:100vw; height:100vh; position:absolute;">
  </div>
`;

let world: World;

init();

function init() {
  world = new World(
    document.getElementById("game-container")!,
    "soccer-field.glb"
  );
}
