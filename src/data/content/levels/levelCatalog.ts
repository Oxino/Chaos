import { docksDistrict } from "./docksDistrict";
import { industrialDistrict } from "./industrialDistrict";
import type { LevelBlockout } from "./levelTypes";
import { prototypeDistrict } from "./prototypeDistrict";
import { ruralDistrict } from "./ruralDistrict";

/**
 * Campagne ordonnee (spec 8.5). Chaque niveau se debloque en atteignant le score minimum
 * du precedent. Le premier est toujours accessible.
 */
export const levelCatalog: readonly LevelBlockout[] = [
	prototypeDistrict,
	docksDistrict,
	industrialDistrict,
	ruralDistrict,
];
