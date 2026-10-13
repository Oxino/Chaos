import { GameApp } from "./core/GameApp";

const canvas = document.getElementById("renderCanvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Canvas de rendu introuvable: #renderCanvas");
}

const app = new GameApp(canvas);
await app.start();
