# Commandes de debug locales

Ce document décrit l'API de debug disponible pendant le développement de Chaos.

## Conditions

L'API est installée uniquement avec Vite en mode développement.

```powershell
npm run dev
```

Ouvrir ensuite `http://localhost:5173/`, puis la console du navigateur avec `F12` > **Console**.

L'objet global suivant doit être disponible :

```js
window.chaosDebug
```

L'API n'est pas incluse dans le build de production.

## Stockage local

La progression est enregistrée dans **IndexedDB** :

- Base : `chaos`
- Object store : `profile`
- Cle : `save`
- Schema courant : `v5`

Pour consulter les donnees dans Chrome ou Edge :

1. Ouvrir les outils de developpement avec `F12`.
2. Ouvrir l'onglet **Application**.
3. Ouvrir **IndexedDB** > `chaos` > `profile`.
4. Consulter l'enregistrement `save`.

Les commandes de debug passent par le schema de migration. Les valeurs invalides sont donc nettoyees comme lors d'un chargement normal.

## Lire la sauvegarde

Afficher la sauvegarde courante :

```js
window.chaosDebug.save()
```

Afficher le build actuellement selectionne et les statistiques effectivement utilisees par le jeu :

```js
window.chaosDebug.build()
```

Le resultat contient notamment :

- les identifiants du lanceur, du personnage et de l'objet actifs ;
- les niveaux d'amelioration appliques ;
- `resolved` : masse, rebond, friction, puissance de lancement et multiplicateur de score ;
- `characterMass` : masse utilisee par la physique ;
- `launchSpeedAtFullPower` et `launchImpulseAtFullPower` : valeurs utilisees par l'aperçu et le tir ;
- `ability` : rayon, impulsion et impact réels de la bombe, ou poussée réelle du réacteur.

Exemple de structure retournee :

```js
{
  schemaVersion: 5,
  bestScores: {},
  totalXp: 0,
  completedQuestIds: [],
  discoveredSecretIds: [],
  skillRanks: {},
  currency: 0,
  inventory: {
    launchers: {},
    characters: {},
    items: {}
  },
  upgrades: {
    launchers: {},
    characters: {},
    items: {}
  }
}
```

## Monnaie

Fixer le solde :

```js
await window.chaosDebug.setCurrency(1000)
```

Ajouter de la monnaie au solde courant :

```js
await window.chaosDebug.addCurrency(500)
```

Pour tester un achat de gacha :

```js
await window.chaosDebug.setCurrency(100)
```

Puis ouvrir **Collection** et utiliser un des boutons de tirage. Le cout actuel est affiche directement sur chaque bouton.

## XP et niveau

Fixer l'XP totale :

```js
await window.chaosDebug.setXp(5000)
```

Le niveau est recalcule a partir de l'XP et de la courbe de progression. L'interface Collection affiche le niveau, l'XP totale et la progression vers le niveau suivant.

Valeurs pratiques pour les tests :

```js
await window.chaosDebug.setXp(0)       // Niveau 1
await window.chaosDebug.setXp(800)     // Passage au niveau suivant
await window.chaosDebug.setXp(5000)    // Plusieurs niveaux
```

## Inventaire

Ajouter un ou plusieurs exemplaires :

```js
await window.chaosDebug.addItem("items", "item_bomb", 1)
await window.chaosDebug.addItem("items", "item_bomb", 4)
await window.chaosDebug.addItem("characters", "character_cat", 2)
await window.chaosDebug.addItem("launchers", "launcher_giant_slingshot", 1)
```

Les categories autorisees sont :

- `launchers`
- `characters`
- `items`

Un premier exemplaire debloque le contenu. Les exemplaires suivants sont des doublons et augmentent le niveau d'amelioration jusqu'au plafond configure.

`addItem` simule aussi cette regle : si le contenu est deja possede, chaque nouvel exemplaire ajoute augmente le niveau d'amelioration. Pour tester depuis une sauvegarde propre :

```js
await window.chaosDebug.reset()
await window.chaosDebug.addItem("launchers", "launcher_giant_slingshot", 3)
window.chaosDebug.save().upgrades.launchers
```

Le lanceur de depart est deja possede apres `reset()`, donc cette sequence doit afficher un niveau `3`.

Les ameliorations sont appliquees au gameplay, pas seulement affichees :

- lanceur : bonus d'impulsion et de vitesse effective, toujours soumis au plafond de vitesse ;
- personnage : bonus de rebond et de multiplicateur de score ;
- objet : bonus de puissance de lancement et de capacite active ;
- le bonus provisoire est de `+5 %` par niveau d'amelioration.

### Identifiants disponibles

Lanceurs :

```text
launcher_giant_slingshot
```

Personnages :

```text
character_dummy
character_cat
character_safe
```

Objets :

```text
item_stone
item_balloon
item_anvil
item_thruster
item_bomb
```

## Competences

Fixer directement le rang d'une competence :

```js
await window.chaosDebug.setSkillRank("skill_power_1", 3)
await window.chaosDebug.setSkillRank("skill_impact_1", 3)
```

Identifiants disponibles :

| Identifiant | Effet | Rang maximum |
|---|---|---:|
| `skill_power_1` | Puissance de lancement | 3 |
| `skill_power_2` | Puissance de lancement | 2 |
| `skill_impact_1` | Intensite d'impact | 3 |
| `skill_impact_2` | Intensite d'impact | 2 |
| `skill_bounce_1` | Rebond | 3 |
| `skill_explosive_1` | Rayon d'explosion | 2 |
| `skill_chaos_1` | Score de destruction | 3 |
| `skill_chaos_2` | Bonus de combo | 2 |

Les rangs sont valides contre le catalogue au rechargement. Pour verifier les bonus :

1. Executer `setXp` avec une valeur suffisante.
2. Executer `setSkillRank`.
3. Observer le panneau **Competences**.
4. Comparer la trajectoire, le rebond, l'impact ou le score selon la competence.

Les prerequis et les points depenses de l'arbre normal restent geres par `SkillTreeService`. La commande debug force le rang sauvegarde pour faciliter les tests.

## Reinitialiser

Reinitialiser toute la sauvegarde :

```js
await window.chaosDebug.reset()
```

Cette commande remet a zero :

- monnaie ;
- XP ;
- scores ;
- quetes et secrets ;
- competences ;
- inventaire ;
- ameliorations.

Les contenus du prototype sont ensuite remis comme possedes au demarrage : fronde, personnages et objets existants.

## Scenarios de test rapides

### Tester un achat de gacha

```js
await window.chaosDebug.setCurrency(1000)
window.chaosDebug.save().currency
```

Ouvrir **Collection**, noter le solde, effectuer un tirage, puis verifier :

```js
window.chaosDebug.save().currency
window.chaosDebug.save().inventory
window.chaosDebug.save().upgrades
```

### Tester les doublons

```js
await window.chaosDebug.setCurrency(1000)
await window.chaosDebug.addItem("items", "item_bomb", 1)
```

Effectuer plusieurs tirages d'objets et verifier que `upgrades.items.item_bomb` augmente sans depasser le plafond.

### Tester les bonus de puissance et d'impact

```js
await window.chaosDebug.setXp(10000)
await window.chaosDebug.setSkillRank("skill_power_1", 3)
await window.chaosDebug.setSkillRank("skill_impact_1", 3)
```

Revenir a la visee, comparer la portee affichee et les resultats d'impact avec une sauvegarde reinitialisee.

### Tester la persistance

```js
await window.chaosDebug.setCurrency(777)
```

Recharger la page, puis verifier :

```js
window.chaosDebug.save().currency
```

La valeur doit rester `777`.

## Depannage

Si `window.chaosDebug` vaut `undefined` :

- verifier que le serveur est lance avec `npm run dev` ;
- verifier l'URL `http://localhost:5173/` ;
- recharger la page apres un changement de code ;
- verifier l'onglet Console pour une erreur de demarrage.

Pour supprimer totalement les donnees sans passer par l'API :

1. Ouvrir `F12` > **Application**.
2. Selectionner **IndexedDB** > `chaos`.
3. Supprimer la base `chaos`.
4. Recharger la page.

La commande `reset()` est preferee car elle conserve la structure de schema et initialise correctement les contenus de depart.
