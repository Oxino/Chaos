import type { RagdollDefinition } from "./characterTypes";

const SKIN = "#ffd24a";
const CLOTH = "#e8613c";

/**
 * Pantin de prototypage : 7 corps rigides, masse totale 70 kg.
 * Volontairement sobre pour tenir le budget de corps actifs (spec 6.6, 18).
 */
export const prototypeRagdoll: RagdollDefinition = {
  id: "character_proto_dummy",
  displayName: "Pantin",
  rootPartId: "pelvis",
  parts: [
    {
      id: "pelvis",
      shape: "box",
      size: { x: 0.45, y: 0.3, z: 0.25 },
      offset: { x: 0, y: 0, z: 0 },
      mass: 16,
      color: CLOTH,
    },
    {
      id: "chest",
      shape: "box",
      size: { x: 0.5, y: 0.55, z: 0.28 },
      offset: { x: 0, y: 0.42, z: 0 },
      mass: 20,
      color: CLOTH,
    },
    {
      id: "head",
      shape: "sphere",
      size: { x: 0.33, y: 0.33, z: 0.33 },
      offset: { x: 0, y: 0.88, z: 0 },
      mass: 6,
      color: SKIN,
    },
    {
      id: "armLeft",
      shape: "capsule",
      size: { x: 0.16, y: 0.6, z: 0.16 },
      offset: { x: -0.36, y: 0.45, z: 0 },
      mass: 4,
      color: SKIN,
    },
    {
      id: "armRight",
      shape: "capsule",
      size: { x: 0.16, y: 0.6, z: 0.16 },
      offset: { x: 0.36, y: 0.45, z: 0 },
      mass: 4,
      color: SKIN,
    },
    {
      id: "legLeft",
      shape: "capsule",
      size: { x: 0.2, y: 0.8, z: 0.2 },
      offset: { x: -0.13, y: -0.58, z: 0 },
      mass: 10,
      color: CLOTH,
    },
    {
      id: "legRight",
      shape: "capsule",
      size: { x: 0.2, y: 0.8, z: 0.2 },
      offset: { x: 0.13, y: -0.58, z: 0 },
      mass: 10,
      color: CLOTH,
    },
  ],
  joints: [
    {
      parentId: "pelvis",
      childId: "chest",
      pivotOnParent: { x: 0, y: 0.15, z: 0 },
      pivotOnChild: { x: 0, y: -0.27, z: 0 },
      swingDeg: 35,
      twistDeg: 25,
    },
    {
      parentId: "chest",
      childId: "head",
      pivotOnParent: { x: 0, y: 0.3, z: 0 },
      pivotOnChild: { x: 0, y: -0.17, z: 0 },
      swingDeg: 40,
      twistDeg: 30,
    },
    {
      parentId: "chest",
      childId: "armLeft",
      pivotOnParent: { x: -0.26, y: 0.2, z: 0 },
      pivotOnChild: { x: 0, y: 0.3, z: 0 },
      swingDeg: 75,
      twistDeg: 40,
    },
    {
      parentId: "chest",
      childId: "armRight",
      pivotOnParent: { x: 0.26, y: 0.2, z: 0 },
      pivotOnChild: { x: 0, y: 0.3, z: 0 },
      swingDeg: 75,
      twistDeg: 40,
    },
    {
      parentId: "pelvis",
      childId: "legLeft",
      pivotOnParent: { x: -0.13, y: -0.15, z: 0 },
      pivotOnChild: { x: 0, y: 0.4, z: 0 },
      swingDeg: 60,
      twistDeg: 20,
    },
    {
      parentId: "pelvis",
      childId: "legRight",
      pivotOnParent: { x: 0.13, y: -0.15, z: 0 },
      pivotOnChild: { x: 0, y: 0.4, z: 0 },
      swingDeg: 60,
      twistDeg: 20,
    },
  ],
};
