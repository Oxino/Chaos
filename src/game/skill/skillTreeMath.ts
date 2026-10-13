import {
  createEmptyBonuses,
  type SkillBonuses,
  type SkillNode,
} from "../../data/content/skills/skillTypes";

export type SkillRanks = Readonly<Record<string, number>>;

export type UnlockBlocker = "maxRank" | "prerequisite" | "points" | null;

export function rankOf(ranks: SkillRanks, nodeId: string): number {
  return ranks[nodeId] ?? 0;
}

export function spentPoints(nodes: readonly SkillNode[], ranks: SkillRanks): number {
  return nodes.reduce((total, node) => total + rankOf(ranks, node.id) * node.cost, 0);
}

/** Un prerequis compte comme satisfait des le premier rang. */
export function prerequisitesMet(node: SkillNode, ranks: SkillRanks): boolean {
  return node.prerequisiteIds.every((id) => rankOf(ranks, id) > 0);
}

/** Renvoie null si le n\u0153ud peut etre ameliore, sinon la raison du blocage. */
export function unlockBlocker(
  node: SkillNode,
  ranks: SkillRanks,
  availablePoints: number,
): UnlockBlocker {
  if (rankOf(ranks, node.id) >= node.maxRank) {
    return "maxRank";
  }
  if (!prerequisitesMet(node, ranks)) {
    return "prerequisite";
  }
  if (availablePoints < node.cost) {
    return "points";
  }
  return null;
}

/** Renvoie les rangs inchanges si l'amelioration n'est pas possible. */
export function withRank(
  node: SkillNode,
  ranks: SkillRanks,
  availablePoints: number,
): SkillRanks {
  if (unlockBlocker(node, ranks, availablePoints) !== null) {
    return ranks;
  }
  return { ...ranks, [node.id]: rankOf(ranks, node.id) + 1 };
}

export function resolveBonuses(nodes: readonly SkillNode[], ranks: SkillRanks): SkillBonuses {
  const bonuses: Record<string, number> = { ...createEmptyBonuses() };

  for (const node of nodes) {
    const rank = rankOf(ranks, node.id);
    if (rank <= 0) {
      continue;
    }
    bonuses[node.effect.kind] =
      (bonuses[node.effect.kind] ?? 0) + node.effect.bonusPerRank * rank;
  }

  return bonuses as unknown as SkillBonuses;
}

/** Nettoie des rangs issus d'une sauvegarde : identifiants inconnus et valeurs aberrantes. */
export function sanitizeRanks(nodes: readonly SkillNode[], raw: unknown): SkillRanks {
  if (typeof raw !== "object" || raw === null) {
    return {};
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const cleaned: Record<string, number> = {};

  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const node = byId.get(id);
    if (!node || typeof value !== "number" || !Number.isFinite(value) || value < 1) {
      continue;
    }
    cleaned[id] = Math.min(Math.floor(value), node.maxRank);
  }

  return cleaned;
}
