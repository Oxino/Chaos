import HavokPhysics from "@babylonjs/havok";
import havokWasmUrl from "@babylonjs/havok/lib/esm/HavokPhysics.wasm?url";
import { HavokPlugin } from "@babylonjs/core";

/**
 * Le binaire WASM est resolu par Vite pour eviter toute requete relative cassee en production.
 */
export async function createHavokPlugin(): Promise<HavokPlugin> {
  const havok = await HavokPhysics({ locateFile: () => havokWasmUrl });
  return new HavokPlugin(true, havok);
}
