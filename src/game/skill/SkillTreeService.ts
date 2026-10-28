import { skillCatalog } from "../../data/content/skills/skillCatalog";
import type { SkillBonuses, SkillNode } from "../../data/content/skills/skillTypes";
import {
  rankOf,
  resolveBonuses,
  type SkillRanks,
  sanitizeRanks,
  spentPoints,
  unlockBlocker,
  type UnlockBlocker,
  withRank,
} from "./skillTreeMath";

export interface SkillNodeStatus {
  readonly node: SkillNode;
  readonly rank: number;
  readonly blocker: UnlockBlocker;
}

/**
 * Arbre de competences du joueur (spec 9.2). Les points gagnes par niveau sont fournis par la
 * progression ; le service ne connait que leur total et ce qui a deja ete depense.
 */
export class SkillTreeService {
  private ranks: SkillRanks = {};
  private earnedPoints = 0;

  get availablePoints(): number {
    return Math.max(0, this.earnedPoints - spentPoints(skillCatalog, this.ranks));
  }

  get bonuses(): SkillBonuses {
    return resolveBonuses(skillCatalog, this.ranks);
  }

  get currentRanks(): SkillRanks {
    return this.ranks;
  }

  get statuses(): readonly SkillNodeStatus[] {
    const points = this.availablePoints;
    return skillCatalog.map((node) => ({
      node,
      rank: rankOf(this.ranks, node.id),
      blocker: unlockBlocker(node, this.ranks, points),
    }));
  }

  load(rawRanks: unknown, earnedPoints: number): void {
    this.ranks = sanitizeRanks(skillCatalog, rawRanks);
    this.earnedPoints = Math.max(0, earnedPoints);
  }

  setEarnedPoints(earnedPoints: number): void {
    this.earnedPoints = Math.max(0, earnedPoints);
  }

  setAvailablePoints(availablePoints: number): void {
    this.earnedPoints = spentPoints(skillCatalog, this.ranks) + Math.max(0, Math.floor(availablePoints));
  }

  /** Renvoie true si un rang a effectivement ete achete. */
  upgrade(nodeId: string): boolean {
    const node = skillCatalog.find((candidate) => candidate.id === nodeId);
    if (!node) {
      return false;
    }
    const updated = withRank(node, this.ranks, this.availablePoints);
    if (updated === this.ranks) {
      return false;
    }
    this.ranks = updated;
    return true;
  }
}
