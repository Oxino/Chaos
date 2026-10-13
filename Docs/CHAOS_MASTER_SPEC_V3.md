# CHAOS — SPÉCIFICATION MAÎTRESSE V3.1
## Document de référence pour GitHub Copilot et les agents de développement

**Objectif :** ce document est la source de vérité fonctionnelle pour créer Chaos. Il rassemble la vision, les mécaniques, le contenu, l'UX, les exigences techniques, le plan de production et les tests. Il est écrit pour être lu par un agent IA de développement autant que par un développeur humain.

### Convention de statut
- **[VALIDÉ]** : décision explicitement confirmée par le porteur du projet.
- **[RECOMMANDATION]** : recommandation d'ingénierie/design à suivre sauf raison documentée.
- **[PROPOSITION]** : idée non confirmée ; ne pas la transformer en règle définitive.
- **[À DÉFINIR]** : décision manquante. Demander confirmation si elle bloque un choix majeur ; sinon centraliser une valeur provisoire configurable.
- **[MVP]** : nécessaire à la première version jouable.
- **[FUTUR]** : idée souhaitée après la base jouable.

---

# 1. VISION DU JEU

## 1.1 Concept
**Chaos** est un jeu d'arcade 3D cartoon basé sur la physique, le lancement de personnages et la destruction en chaîne. Le joueur choisit un lanceur, un personnage et un objet, vise en tirant vers l'arrière, puis relâche pour projeter le personnage dans un grand environnement interactif. Il provoque des collisions, détruit des éléments, déclenche des réactions en chaîne et cherche à maximiser son score.

Le jeu prend **PAIN sur PlayStation 3** comme référence principale d'expérience : lancer un personnage dans un environnement et exploiter la physique pour créer un spectacle et scorer. Chaos doit cependant avoir ses propres personnages, niveaux, graphismes, sons, textes, animations, règles et identité. Ne pas copier les ressources ou contenus propriétaires d'un autre jeu.

## 1.2 Promesse
« Choisis ton lanceur, ton personnage et ton objet, vise, tire, et transforme le décor en catastrophe cartoon. »

## 1.3 Sensation recherchée
- Anticipation pendant la visée.
- Satisfaction immédiate au lâcher.
- Trajectoire et collisions faciles à lire.
- Surprise quand un petit impact entraîne une cascade.
- Monde modifié de façon persistante durant la partie.
- Envie de rejouer pour faire mieux ou essayer un autre build.
- Humour **totalement déjanté**.

## 1.4 Plateformes et modèle
- **[VALIDÉ]** Mobile et PC/ordinateur.
- **[VALIDÉ]** Mobile en orientation paysage.
- **[VALIDÉ]** Solo uniquement ; pas de multijoueur pour le moment.
- **[VALIDÉ]** Jeu gratuit et sans publicité.
- **[VALIDÉ]** Moteur de jeu : **Babylon.js + Havok**, en **TypeScript** avec **Vite**, interface en **Babylon GUI**. Distribution web (navigateur), aucune installation requise pour jouer. Détails en §15.1.
- **[À DÉFINIR]** Achats intégrés, cloud, cibles matérielles et fréquences d'images. Ne pas inventer de monnaie payante ou de publicité.

# 2. PILIERS ET GARDE-FOUS

1. **Chaos avant réalisme :** physique exagérée mais lisible.
2. **Environnements ouverts :** pas de niveaux-puzzles à la Angry Birds, ni une unique structure à renverser.
3. **Réactions en chaîne au cœur du score.**
4. **Contrôle simple :** tirer vers l'arrière, relâcher.
5. **Build adaptable avant chaque tir.**
6. **Persistance des dégâts entre les tirs d'une partie.**
7. **Feedback visuel/sonore immédiat.**
8. **Style 3D cartoon, coloré, absurde, sans gore.**
9. **Aucune mort de personnage.**
10. **Aucun objet rare obligatoire pour débloquer ou terminer la campagne.**
11. **Prototype d'abord :** sensation de tir, caméra, physique et destruction avant économie/gacha/roster massif.

### Hors périmètre MVP
Multijoueur, éditeur de niveaux, replays partageables, classements mondiaux, défis hebdomadaires, boss géants, économie monétaire réelle, destruction voxel intégrale, simulation complexe de PNJ. Ce sont des idées futures, pas des exigences de la première version.

# 3. STYLE VISUEL, HUMOUR ET VIOLENCE

- **[VALIDÉ]** 3D cartoon stylisée ; ne pas viser le photoréalisme.
- Couleurs franches, silhouettes distinctes, proportions exagérées et animations expressives.
- Effets de destruction spectaculaires mais lisibles.
- Humour très absurde dans les personnages, interactions, descriptions et messages de résultats.
- Pas de sang, pas de gore, pas de décès.
- Les personnages peuvent être projetés, écrasés, brûlés visuellement, gelés, électrocutés ou explosés de façon comique, mais survivent et restent des objets physiques.
- Éviter de cacher le personnage ou la cible sous des effets trop opaques.

# 4. BOUCLE DE JEU

## 4.1 Boucle globale
1. Menu principal.
2. Choix Campagne ou Mode libre.
3. Choix d'un niveau débloqué.
4. Affichage de l'objectif de score, des tirs disponibles et des quêtes.
5. Avant chaque tir, choix d'un lanceur, d'un personnage et d'un objet.
6. Visée par glissement vers l'arrière.
7. Aperçu de trajectoire qui tient compte du build.
8. Relâchement : lancement.
9. Caméra qui suit et zoome automatiquement selon l'action.
10. Collisions, dégâts, destructions, capacités, combos et score.
11. Fin manuelle du tir ou fin automatique après immobilité.
12. Conservation de l'état du niveau et du personnage lancé.
13. Tir suivant avec nouveau build possible.
14. Après le dernier tir : résultats, score, XP, quêtes, secrets, monnaie et déblocages.
15. Réinitialisation complète du niveau pour la prochaine partie.

## 4.2 Terminologie
- **Partie** : session complète sur un niveau.
- **Tir** : lancement d'un personnage. C'est le terme à privilégier dans l'UI et le code.
- Le mot « manche » a été employé dans les discussions précédentes mais peut prêter à confusion ; ne pas créer une structure séparée de manches sans décision supplémentaire.

## 4.3 Nombre de tirs [VALIDÉ]
- Niveaux 1 à 4 : 3 tirs.
- Niveaux 5 à 9 : 4 tirs.
- Niveau 10 et au-delà : 5 tirs.
- Autres nombres pour les niveaux spéciaux : **[À DÉFINIR]**.

## 4.4 Réutilisation
- Un tir = une utilisation de lancement.
- Le joueur peut reprendre le même personnage au tir suivant.
- Le personnage déjà lancé reste dans le monde.
- **[À DÉFINIR]** Consommation des objets et munitions des lanceurs. Pour le MVP, préférer une règle simple et cohérente, centralisée dans les données.

# 5. VISÉE, CONTRÔLES ET CAMÉRA

## 5.1 Commande principale [VALIDÉ]
La direction et la puissance sont **deux contrôles séparés**.

**Direction :**
- Glissement sur l'écran (tactile) ou clic-glisser bouton gauche (PC) pour orienter la vue.
- La visée suit l'orientation de la vue : le joueur regarde l'endroit qu'il veut toucher.
- La vue elle-même est bornée à l'amplitude du lanceur (§5.3), donc elle ne peut jamais montrer une direction hors de portée.

**Puissance :**
- Jauge dédiée dans le HUD, réglable avant le tir.
- Elle détermine la vitesse initiale, donc la distance atteinte.

**Déclenchement :**
- Bouton « Lancer », ou barre d'espace sur PC.
- La molette n'a aucune fonction.
- Support manette : **[FUTUR]**, hors MVP.

Aucun pilotage directionnel libre du personnage en vol.

> Ce modèle remplace le geste « tirer vers l'arrière puis relâcher » des versions précédentes de ce document. Le pilier « contrôle simple » du §2.4 reste satisfait : viser avec la vue, régler la jauge, tirer.

## 5.2 Aperçu de trajectoire et réticule [VALIDÉ]
Afficher une prévisualisation de trajectoire et un **réticule de cible** au point d'impact prévu. Le réticule est plaqué sur la première surface rencontrée (sol, mur, véhicule) et orienté selon sa normale, afin de rester lisible.

La prévisualisation doit changer selon :
- angle et puissance ;
- propriétés du lanceur ;
- masse et propriétés du personnage ;
- objet équipé ;
- compétences actives/passives ;
- gravité et conditions physiques connues.

Elle reste une estimation : les collisions et réactions imprévues peuvent modifier le parcours, et le personnage continue de rouler ou rebondir après le point d'impact affiché. La ligne doit être lisible et ne pas surcharger l'écran.

## 5.3 Amplitude et orientation de la visée [VALIDÉ]
- **75° horizontalement** et **140° verticalement**, mesurés en **amplitude totale** (soit ±37,5° et ±70° autour de l'axe de repos du lanceur).
- Le **lanceur occupe une position fixe** dans le niveau. Il ne se déplace pas et le joueur ne le repositionne pas.
- En revanche le joueur **pivote la visée** de gauche à droite et de bas en haut, dans les bornes ci-dessus, en orientant la vue (§5.1).
- La caméra de visée est bornée aux mêmes angles que le lanceur : vue et visée ne peuvent jamais diverger.
- Les bornes sont centralisées dans les données du lanceur et restent ajustables après test sur écran tactile.

## 5.4 Capacités en vol [VALIDÉ]
Le joueur peut activer certaines capacités pendant le vol, sans piloter librement la trajectoire.

**État actuel** : la capacité appartient à l'objet équipé et constitue une **catégorie distincte du passif** (§10.5). Elle suit les états `Indisponible → Prêt → En cours → Utilisée`, avec **une seule utilisation par tir**. Commande : bouton dédié au HUD ou touche A sur PC.

Deux capacités sont implémentées :
- **Réacteur** : poussée continue dans le sens du déplacement, avec une composante verticale pour relancer la cloche. L'impulsion est répartie au prorata des masses du pantin. Retour visuel : flamme sur le personnage.
- **Bombe** : souffle de zone immédiat. Chaque destructible du rayon reçoit une impulsion radiale et un impact atténué avec la distance ; les destructions qui en découlent alimentent normalement le score et les chaînes. Le personnage est soufflé lui aussi, sans mourir (§6.2). Retour visuel : onde de choc.

Les modes `à l'impact` et `automatique` du §16.3 sont définis mais pas encore utilisés : aucun objet ne les justifie pour l'instant.

## 5.5 Caméra [VALIDÉ]
Zoom et cadrage automatiques selon l'état du tir, pilotés par un `CameraDirector` :
- `AimCamera` : pivote autour du lanceur, contrôlée par le joueur, bornée à l'amplitude de visée (§5.3) ;
- `FlightFollowCamera` : suit le personnage avec anticipation du mouvement ; la direction de suivi est **projetée au sol** pour que la caméra ne bascule pas pendant la chute. Elle reste **orientable par le joueur** : dès qu'il fait glisser l'écran, le recadrage automatique se met en retrait jusqu'au tir suivant, afin de pouvoir observer l'environnement autour du personnage ;
- `ImpactCamera` : recadrage court sur événement majeur — **[À VENIR]** avec la destruction de la Phase 2 ;
- `ResultCamera` : vue large en fin de tir, puis retour automatique à la visée.

Les entrées de la caméra de visée sont détachées pendant le vol pour que le joueur ne puisse pas dérégler son cadrage ; en contrepartie la caméra de suivi accepte les siennes. Transitions amorties ; ne pas perdre le personnage ou rendre l'environnement illisible. Prévoir une option de réduction du tremblement.

**Collisions caméra [VALIDÉ]** : un rayon part du personnage vers la caméra de suivi ; si un élément du décor s'interpose, la caméra se rapproche juste devant l'obstacle sans jamais descendre sous une distance minimale. Le personnage suivi est exclu du test.

## 5.6 Fin de tir [VALIDÉ]
Le joueur peut appuyer sur un bouton pour forcer la fin. Sinon, fin automatique lorsque le personnage ne bouge plus, avec une référence de **4 secondes d'immobilité**.

État `Settling` : vitesse linéaire et angulaire sous seuil. Le compteur d'immobilité **repart de zéro** dès que le personnage rebouge. Un délai de sécurité maximal termine le tir même si des objets oscillent indéfiniment.

Après la fin du tir, un court cadrage de résultat précède le retour automatique à la visée. Les seuils et durées sont des valeurs provisoires (§15.7) à régler par test.

# 6. PHYSIQUE, PERSONNAGES ET DESTRUCTION

## 6.1 Philosophie
La physique est arcade et exagérée. Les voitures peuvent voler très loin ; les collisions peuvent créer des cascades absurdes. Priorité à la lisibilité, au plaisir et à la réponse visuelle, pas à la simulation scientifique parfaite.

## 6.2 Personnages non mortels [VALIDÉ]
- Aucun système de mort.
- Les personnages ne disparaissent pas après leur tir.
- Ils restent dans la scène, peuvent être percutés, déplacés et devenir des obstacles pour les tirs suivants.
- Des états visuels comiques sont permis sans conséquence de mort.
- Ne pas implémenter de points de vie de personnage associés à une mort.

### Représentation physique [VALIDÉ]
Le personnage est un **pantin articulé** : plusieurs corps rigides reliés par des articulations à limites angulaires. La définition du squelette (parties, masses, formes, pivots, débattements) vit dans les données de contenu, pas dans le code, afin de pouvoir décliner les ~20 personnages du §10.3.

Règles à respecter :
- les membres reliés par une articulation ne se percutent pas entre eux, sinon le pantin vibre ;
- l'impulsion de lancement est **répartie au prorata des masses** pour que le pantin parte d'un bloc puis se désarticule à l'impact ;
- la stabilisation (§5.6) considère le pantin en mouvement dès qu'**un seul** membre dépasse les seuils ;
- garder un nombre de corps modéré par personnage pour tenir le budget du §6.6 et du §18.

Aucune de ces règles n'introduit de mort ni de points de vie.

## 6.3 Persistance intra-partie [VALIDÉ]
Conserver jusqu'à la fin de la partie :
- dégâts et fissures ;
- morceaux détachés ;
- bâtiments effondrés ;
- véhicules détruits ou déplacés ;
- objets cassés et débris ;
- personnages déjà lancés ;
- ouvertures créées et éléments déplacés.

Au début de la partie suivante, réinitialiser l'intégralité de la scène : positions, dégâts, véhicules, personnages, secrets temporaires, déclencheurs de partie et météo/heure selon les règles retenues.

## 6.4 Destruction hybride [VALIDÉ]
Ne pas imposer une destruction voxel intégrale. Combiner :
- objets simples : intact/détruit ;
- objets moyens : intact/endommagé/détruit ;
- bâtiments : plusieurs étapes, pièces préconstruites détachables, points structurels et effondrement scénarisé ;
- décor non essentiel : certains éléments peuvent être indestructibles pour préserver les performances.

Les dégâts dépendent de la force d'impact, de la masse, de la vitesse, de l'angle et de la résistance de la cible. Un impact lourd peut détruire en un coup ; un impact faible peut endommager progressivement.

### Règles spécifiques
- **Voitures :** règle arcade de départ : un impact qualifiant détruit la voiture complètement. Elle reste en place, écrasée, et continue de servir d'obstacle.
- **Lampadaires et panneaux :** statiques tant qu'ils sont intacts, ils basculent en corps dynamique à la destruction et s'effondrent sur place.
- **Bâtiments :** composés de **sections préconstruites empilées**, statiques tant qu'elles sont intactes. Chaque section encaisse plusieurs impacts (intact → endommagé → critique → détaché) ; un impact lourd peut lui faire perdre plusieurs étapes d'un coup. **Perdre une seule section fait céder la structure** : toutes les autres basculent en corps dynamique et reçoivent une poussée latérale commune, d'autant plus forte que l'étage est haut. Aucune destruction voxel.
- Le seuil d'impact qualifiant est exprimé en **impulsion de collision (N·s)** et vit dans le catalogue de destructibles.
- **Le contact avec le sol est exclu de la résolution d'impact** : sans cela, tout objet qui se pose s'auto-détruirait au chargement du niveau.
- **[VALIDÉ] Impulsion de dispersion à la destruction.** Un objet détruit reçoit une impulsion dans le sens du choc, avec une composante verticale. Sans elle un objet détruit reste sur place, ne percute rien, et **aucune réaction en chaîne n'est possible** — ce qui vide de sa substance le pilier du §2.3 et les 40 % de score attendus en combos au §8.1. Les masses doivent rester volontairement basses et arcade (§6.1) pour que les objets soient réellement projetables.

## 6.5 Résolution d'impact recommandée
Pour chaque collision :
1. Vérifier qu'elle est pertinente et dépasse le seuil minimum.
2. Calculer une intensité d'impact à partir de la vitesse relative, masse effective, angle et facteur matériau.
3. Appliquer les dégâts ou passer à l'étape de destruction suivante.
4. Déclencher l'effet spécifique de la cible si applicable.
5. Jouer animation/VFX/audio.
6. Émettre un événement de score avec un identifiant unique.
7. Laisser les vraies collisions secondaires déclencher les réactions suivantes.

Empêcher le double score sur un objet détruit, les callbacks multiples et les boucles infinies de dégâts/score.

## 6.6 Débris et performances
- Limiter le nombre de corps rigides actifs.
- Mettre en sommeil les corps immobiles.
- **Budget de débris [VALIDÉ]** : au-delà d'un nombre configurable de corps détachés encore simulés, les plus anciens **une fois posés** sont figés en corps statiques. Ils restent visibles, ce qui préserve la persistance du §6.3, mais ne coûtent plus rien au moteur. Ne jamais figer un débris encore en mouvement.
- Pooling pour particules, fragments et effets fréquents.
- Garder les débris importants pour le gameplay ; simplifier/supprimer les petits débris décoratifs selon une politique contrôlée.
- Préserver l'impression de destruction avec VFX, poussière et fragments simplifiés plutôt qu'avec des centaines de corps simulés.
- Les règles de nettoyage ne doivent pas supprimer un personnage lancé avant la fin de la partie.

# 7. NIVEAUX, THÈMES, SECRETS ET MÉTÉO

## 7.1 Environnements ouverts
Les niveaux sont de grands espaces interactifs, avec routes, bâtiments, véhicules, panneaux, publicités, feux, lampadaires, grues, chantiers, vitrines et mobilier urbain. Les cibles doivent proposer plusieurs lignes de tir et des interactions possibles. Ne pas organiser le jeu comme une série de petites structures-puzzles.

## 7.2 Thèmes de départ [VALIDÉ]
### Ville
Sous-zones envisagées : centre-ville, quartier résidentiel, zone industrielle, port, centre commercial.

### Campagne
Sous-zones envisagées : ferme, village, barrage, forêt, carrière.

### Mars cyberpunk en construction
Sous-zones envisagées : dômes résidentiels, réacteur, spatioport, zone minière, centre de recherche.

Ce sont des exemples de quartiers, pas une liste exhaustive figée.

## 7.3 Secrets [VALIDÉ]
Chaque niveau doit viser **3 à 4 secrets**. Exemples : cible cachée, zone dissimulée, objet spécial, interaction improbable, cible à atteindre d'une manière inattendue.
Les secrets encouragent l'exploration mais ne doivent pas être obligatoires pour atteindre le score de déblocage.

**État actuel** : un secret est une **zone à traverser en vol**, qui accorde un bonus de score immédiat et de l'XP en fin de partie. La découverte est unique par partie puis persistée.

**Simplification assumée du prototype** : les zones sont matérialisées par un anneau visible. Des secrets réellement dissimulés, et des secrets d'un autre type que la zone à traverser, relèvent du contenu de la Phase 7.

## 7.4 Destruction et accès
La destruction peut révéler une zone ou ouvrir un passage, mais ne doit pas constituer une clé obligatoire d'accès à un niveau. La campagne se débloque par le score minimum et la progression définie.

## 7.5 PNJ [VALIDÉ]
PNJ décoratifs uniquement au départ. Ils peuvent animer le décor de façon légère, mais aucun système complexe de comportement, combat ou interaction n'est requis pour le MVP.

## 7.6 Météo et heure [VALIDÉ, fréquence à confirmer]
Météo et période de la journée aléatoires au début de chaque « manche » selon les échanges d'origine. Comme le terme n'est pas parfaitement aligné sur la structure en tirs, la fréquence doit rester configurable jusqu'à confirmation.
- Météo possible : soleil, nuages, pluie, orage, brouillard ; tempête de sable sur Mars.
- Heure : aube, jour, crépuscule, nuit.
- Pour la première version, effets surtout visuels.
- Modificateurs de gameplay comme vent ou glissance : **[PROPOSITION]**, non validés.

# 8. SCORE, COMBOS ET QUÊTES

## 8.1 Score total [VALIDÉ]
Le score est cumulé sur tous les tirs de la partie. Quatre composantes :
1. destruction/dégâts directs ;
2. réactions en chaîne et combos ;
3. objectifs de niveau ;
4. bonus spéciaux.

Répartition de conception indicative acceptée comme guide : environ 30 % dégâts directs, 40 % combos, 20 % objectifs, 10 % bonus. Ce n'est pas un quota rigide ; équilibrer par tests.

## 8.2 Score direct
Chaque élément destructible possède une valeur de score configurable. Les exemples évoqués sont des ordres relatifs : panneau/lampadaire = faible ; voiture = moyen ; camion = plus élevé ; destruction complète d'un bâtiment = forte récompense. Les valeurs numériques ne sont pas fixées.

**[VALIDÉ] Les dégâts partiels rapportent des points.** Un objet à plusieurs étapes distribue sa valeur à chaque étape perdue, au prorata. Sans cela le score reste figé tant qu'un objet n'est pas complètement détruit et le joueur ne perçoit aucune progression. Chaque étape porte un identifiant d'attribution distinct pour rester idempotente.

## 8.3 Réactions en chaîne
Exemple : personnage touche une voiture, la voiture heurte un panneau, le panneau percute une autre cible. Le système reconnaît une chaîne causale sur une **fenêtre temporelle glissante** : chaque destruction survenue dans la fenêtre prolonge la chaîne et augmente le multiplicateur d'un cran.

**Implémentation [VALIDÉ] :**
- le multiplicateur vaut la longueur de la chaîne, bornée par un plafond de sécurité ;
- la valeur de base de l'objet alimente les **dégâts directs**, le surplus `base x (multiplicateur - 1)` alimente les **combos** : les deux composantes du §8.1 restent séparées ;
- chaque objet porte un identifiant unique et ne peut être récompensé qu'une seule fois ;
- la chaîne se ferme d'elle-même à l'expiration de la fenêtre.

Le combo en cours est affiché au HUD. Les formules exactes restent à équilibrer.

## 8.4 Bonus de spectacle
Exemples : bâtiment entièrement détruit, grande distance parcourue, précision, grand nombre d'objets détruits en peu de temps, secret découvert, interaction rare. Les seuils sont configurables par niveau.

## 8.5 Campagne par score [VALIDÉ]
Chaque niveau de campagne possède un score minimum pour débloquer le suivant. Le joueur peut rejouer un niveau. Pas de scénario final ni de boss obligatoire définis à ce stade ; la campagne peut s'étendre avec de nouveaux niveaux.

**État actuel** : campagne ordonnée de deux niveaux. Le premier est toujours accessible ; chaque suivant exige d'avoir atteint l'objectif du précédent, **sans possibilité d'en sauter un**. Le déblocage s'appuie sur le meilleur score enregistré, donc il survit à une partie ratée. L'écran de résultats propose « Niveau suivant » quand il est accessible.

**[À VENIR]** Écran de sélection de niveau (§13.1) : pour l'instant on ne peut qu'avancer, pas revenir à un niveau précédent.

## 8.6 Mode libre [VALIDÉ]
Accessible uniquement pour les niveaux déjà débloqués en campagne. Le score est calculé mais n'a pas de conséquence sur la progression officielle.

## 8.7 Quêtes [VALIDÉ]
Catégories :
- Progression : atteindre un score, détruire X véhicules, parcourir une distance, réussir un combo.
- Niveau : renverser une grue, détruire un silo, toucher un monument, traverser une structure.
- Maîtrise : utiliser un personnage/lanceur/objet plusieurs fois, déclencher des explosions.
- Secrets : découvrir une zone/objet caché ou réussir une interaction insolite.

Récompenses possibles : XP, monnaie, personnages, objets, lanceurs, cosmétiques. Les quêtes guident l'exploration et l'apprentissage, sans récit obligatoire. Nombre et récompenses exacts à définir.

**État actuel [VALIDÉ]** : cinq quêtes de portée « partie » récompensées en XP, suivies en continu et résolues en fin de partie. Aucune n'est nécessaire pour atteindre l'objectif de score du niveau (§2.10). Les quêtes accomplies sont persistées et ne peuvent plus être récompensées, sauf si elles sont marquées répétables.

# 9. XP ET ARBRE DE COMPÉTENCES

## 9.1 Sources d'XP
Score, quêtes, combos, secrets et destructions. Éviter le double comptage incontrôlé du même événement.

**État actuel [VALIDÉ]** : l'XP d'une partie vaut une fraction du score total, plus la récompense des quêtes **nouvellement** accomplies. Une quête non répétable déjà validée ne rapporte plus jamais.

## 9.2 Arbre de compétences
**[VALIDÉ] Courbe d'XP à coût croissant par palier** : chaque niveau coûte un montant de base augmenté d'un increment fixe par palier déjà franchi.

**[VALIDÉ] Attribution des points** : **un point par niveau, et un second tous les cinq niveaux**. Les valeurs chiffrées sont provisoires (§15.7).

Les coûts des nœuds de l'arbre restent à définir.

Branches proposées :
- **Propulsion :** puissance initiale, portée, vitesse de lancement.
- **Impact :** dégâts et transfert d'énergie.
- **Rebond :** rebond accru, rebonds multiples, rebond explosif.
- **Explosifs :** explosion à l'impact, explosion différée, rayon.
- **Élémentaire :** feu, électricité, cryogénie.
- **Chaos :** bonus de combo, réactions en chaîne, score de destruction.

Les compétences ne doivent pas introduire un pilotage directionnel permanent en vol, qui n'est pas prévu. Elles peuvent modifier la physique ou déclencher une capacité ponctuelle.
- Les compétences de base doivent avoir un effet perceptible.
- Aucun nœud ne doit être obligatoire pour terminer la campagne.
- Préférer des choix intéressants à des bonus minuscules et invisibles.
- Valeurs, prérequis et courbe d'XP à définir.
**État actuel [VALIDÉ]** : arbre dépensable de huit nœuds sur cinq branches, avec rangs multiples et prérequis. Les effets sont des modificateurs typés appliqués respectivement à la puissance de lancement, à l'intensité d'impact, au rebond, au rayon d'explosion, au score de destruction et au bonus de combo.

Garanties respectées :
- **aucun effet ne permet de piloter la trajectoire en vol** ;
- **aucun nœud n'est nécessaire** pour atteindre l'objectif d'un niveau ;
- les bonus de base sont **perceptibles immédiatement** : un rang de puissance fait passer la portée affichée de 37 à 43 m ;
- les rangs sont persistés dès l'achat et **validés contre le catalogue au chargement** : un identifiant inconnu ou un rang aberrant est ignoré.

La branche **Élémentaire** reste vide : aucun effet de feu, d'électricité ou de cryogénie n'existe encore.
# 10. LANCEURS, PERSONNAGES, OBJETS ET BUILDS

## 10.1 Build
Un tir = 1 lanceur + 1 personnage + 1 objet. Le joueur choisit le build avant chaque tir et peut adapter sa stratégie à l'état du terrain.

**État actuel [VALIDÉ]** : le personnage et l'objet se changent depuis le HUD pendant la visée, et sont verrouillés pendant le vol. Les statistiques du build modifient la masse, le rebond, la friction, la puissance de lancement et le multiplicateur de score. **L'aperçu de trajectoire reflète immédiatement le build** (§5.2, §20.1).

## 10.2 Lanceurs
- **[VALIDÉ] Fronde géante :** premier lanceur.
- **[VALIDÉ]** Le lanceur est placé à un point d'ancrage fixe du niveau ; seule son orientation de visée change (§5.3).
- Idées futures : pistolet, mitraillette, canon, fusée/roquette et lanceurs fantaisistes.
- Le nombre de lanceurs n'est pas défini.
- Puissance, précision, portée, cadence et autres différences sont à définir et centraliser dans les données.
- Ne pas développer tous les lanceurs avant d'avoir validé le tir à la fronde.

## 10.3 Personnages
Cible à terme : **environ 20 personnages**. Exemples : homme, femme, alien, chien, chat, robot, poulet, coffre-fort vivant, mascottes et personnages absurdes. La liste finale reste ouverte.

Statistiques potentielles : masse, taille, résistance, rebond, profil de collision et propriétés de vol passives. Ne pas utiliser une statistique de pilotage aérien actif sans nouvelle validation.

**[VALIDÉ]** Un passif maximum par personnage.
Exemples évoqués :
- coffre-fort vivant : score x2 ;
- chat : rebond augmenté ;
- robot : résistance accrue ;
- alien : comportement aérien particulier.
Ces exemples doivent être équilibrés ; ils ne sont pas tous verrouillés.

## 10.4 Objets
Cible à terme : **environ 20 objets**. Chaque objet possède un visuel, une description, des statistiques, au maximum un passif, et éventuellement une capacité active distincte si celle-ci est définie.

### Pierre/caillou : clarification
La pierre alourdit automatiquement **le personnage équipé uniquement**. Ne pas lui attribuer une mécanique qui alourdit tous les objets du décor. Les caractéristiques « très peu de rebond », « résistante » ou « incassable » ont été évoquées mais doivent être confirmées individuellement si elles deviennent des règles définitives.

Autres idées : bombe, ballon à rebond, réacteur activable en vol, bonbonne explosive, enclume lourde. Exemples non exhaustifs et à valider.

## 10.5 Limite de passifs [VALIDÉ]
- Maximum 1 passif par personnage.
- Maximum 1 passif par objet.
- Maximum 2 passifs combinés provenant de ces emplacements.
- Une capacité active est une catégorie séparée, pas un deuxième passif caché.
- Aucun plafond de passifs de lanceur n'a été confirmé ; ne pas inventer une règle de collection à ce sujet.

**Garantie d'implémentation** : la limite est **structurelle**, pas conventionnelle. Un personnage et un objet portent chacun un champ `passive` unique, donc il est impossible d'en cumuler plus de deux par construction. Les effets sont des modificateurs typés (rebond, score, masse, puissance) combinés par une fonction pure et testée.

## 10.6 Doublons [VALIDÉ]
Les personnages, objets et lanceurs peuvent être améliorés avec des doublons. Les améliorations doivent rester **petites** et statistiques. Les plafonds, niveaux et compensations au niveau maximal sont à définir. La collection ne doit pas devenir nécessaire pour franchir les niveaux.

# 11. GACHA ET ÉCONOMIE

## 11.1 Catégories [VALIDÉ]
Trois gacha séparés :
1. lanceurs ;
2. personnages ;
3. objets.

## 11.2 Animations [VALIDÉ pour la distinction]
- **Objet :** bombe, compte à rebours, explosion cartoon, fumée/débris, révélation de l'objet.
- **Personnage :** météorite, impact/cratère, personnage qui émerge.
- **Lanceur :** **[PROPOSITION]** scène d'essai ou de tir expérimental qui révèle le lanceur.
- Durée courte et possibilité de passer l'animation : **[PROPOSITION]**, à confirmer.

## 11.3 Monnaie [VALIDÉ]
Une seule monnaie de jeu pour les gacha et les autres achats/améliorations. Aucun système de monnaies multiples n'est demandé.

## 11.4 Sources de monnaie
Propositions : score, récompenses de quête, secrets, progression campagne. Les quantités, coûts et rythmes restent à définir.

## 11.5 Non décidé
Taux de rareté, probabilités, garanties, fragments, coût d'un tirage, plafonds d'amélioration, compensation des doublons maximisés, catalogue de chaque pool. Ne pas inventer une monnaie premium, une publicité ou une mécanique pay-to-win. Ne pas rendre les gacha nécessaires à la campagne.

# 12. MODE TRICHE

**[VALIDÉ]** Un réglage permet d'activer le mode triche, désactivé par défaut. Il donne accès à une bombe atomique cartoon :
- une utilisation détruit presque tout le niveau ;
- champignon atomique cartoon, onde de choc et énorme spectacle ;
- message humoristique, par exemple : « Bravo, vous êtes le plus fort. Vous avez gagné. »

Ce mode est un outil de fun/test, pas un élément d'équilibrage normal.
**[PROPOSITION]** Marquer le score comme non officiel ou désactiver les succès quand le mode est actif. Ce garde-fou n'a pas encore été confirmé.

**Note d'implémentation** : le souffle de zone de la bombe (§5.4) est générique et paramétrable. La bombe atomique pourra le réutiliser avec un rayon et une intensité bien plus grands, sans nouveau système.

# 13. UX, UI ET ÉCRANS

## 13.1 Parcours proposé
1. Écran titre.
2. Menu : Campagne, Mode libre, Collection, Gacha, Compétences, Quêtes, Paramètres.
3. Carte/liste de niveaux.
4. Détails du niveau : objectif, tirs, quêtes visibles, secrets connus.
5. Sélection du build avant chaque tir.
6. Visée.
7. Vol/destruction.
8. Stabilisation/fin du tir.
9. Résultats.
10. Collection, gacha, compétences et paramètres.

C'est une architecture UX recommandée, pas une maquette finale validée.

## 13.2 HUD de visée
Afficher avec sobriété :
- score actuel ;
- objectif de score ;
- tirs restants ;
- ligne de trajectoire et réticule de cible ;
- jauge de puissance avec valeur lisible ;
- capacité active éventuelle ;
- pause ;
- accès ou résumé du build.
La trajectoire et la zone de jeu doivent rester dominantes.

## 13.3 HUD en vol
- gains de score ;
- combo/multiplicateur ;
- **indicateur d'impact [VALIDÉ]** : nom de la cible touchée, intensité du choc face au seuil de l'objet, et résultat (ignoré, endommagé, détruit). Il s'efface automatiquement et se réinitialise à chaque nouveau tir ;
- notifications de destruction ;
- capacité disponible ;
- progression des quêtes/secrets lorsque pertinent.
Les notifications doivent s'effacer sans masquer l'action.

## 13.4 Résultats
Score total et répartition, meilleurs combos, quêtes/secrets, XP, monnaie, nouveaux déblocages et progression de campagne. Expliquer clairement l'origine des récompenses.

**État actuel [VALIDÉ]** : l'écran affiche le verdict d'objectif, le score total face à l'objectif, la répartition dégâts directs / bonus de combos, la plus longue chaîne, le nombre d'objets détruits, le meilleur score et la mention d'un nouveau record. XP, monnaie et déblocages s'y ajouteront aux Phases 5 et 6.

## 13.5 Accessibilité recommandée
Contraste suffisant, textes lisibles sur mobile, zones tactiles généreuses, feedback visuel non dépendant du son, réglages audio, réduction du tremblement et limitation des flashs excessifs.

# 14. ANIMATIONS, VFX ET AUDIO

**[VALIDÉ]** Priorité élevée aux animations rapides et très visibles pour visée→tir, collisions et déclenchement des pouvoirs.

Principes :
- effet visuel et son distincts pour les événements importants ;
- effets cartoon courts et lisibles ;
- sensation de poids par son, vibration visuelle, poussière et réaction physique ;
- récompense de score au bon moment ;
- pas d'animation longue qui bloque inutilement le rythme ;
- le joueur doit reconnaître le passif déclenché sans devoir lire un long texte.

Exemples de feedback :
- réacteur : flammes, fumée, accélération ;
- bombe : explosion, onde de choc, fragments ;
- ballon : déformation et rebond ;
- coffre-fort vivant : pièces et icône x2 ;
- pierre : impact lourd, fissures, son sourd.

La durée exacte des effets n'est pas verrouillée. Tester la lisibilité quand plusieurs effets se déclenchent ensemble.

# 15. ARCHITECTURE TECHNIQUE RECOMMANDÉE

## 15.1 Choix moteur [VALIDÉ]

Le jeu est développé en **web natif** : un seul build sert PC et mobile paysage, sans installation côté joueur.

| Couche | Choix | Statut |
|---|---|---|
| Rendu 3D | Babylon.js | [VALIDÉ] |
| Physique | Havok (plugin WASM officiel Babylon) | [VALIDÉ] |
| Langage | TypeScript (mode `strict`) | [VALIDÉ] |
| Build / dev server | Vite | [VALIDÉ] |
| UI / HUD | Babylon GUI | [VALIDÉ] |
| Assets 3D | glTF / `.glb` | [RECOMMANDATION] |
| Sauvegarde | IndexedDB, schéma versionné (§17) | [RECOMMANDATION] |
| Tests logique pure | Vitest | [RECOMMANDATION] |
| Hébergement | statique (pages GitHub ou équivalent gratuit) | [RECOMMANDATION] |

### Conséquences techniques à respecter
- **Chargement asynchrone de Havok** : le module WASM pèse plusieurs centaines de kilo-octets ; prévoir un écran de chargement et n'initialiser la scène physique qu'après résolution.
- **Non-déterminisme** : Havok n'est pas garanti déterministe. Aucune règle de score, de quête ou de secret ne doit reposer sur la reproduction exacte d'une simulation.
- **Aperçu de trajectoire** : calculé analytiquement (balistique paramétrée par le build), pas par simulation physique anticipée. Voir §5.2.
- **Budget mobile** : limiter les corps rigides actifs, activer le sommeil physique, utiliser des colliders convexes simplifiés et du pooling (§6.6, §18). Profiler sur vrai appareil, pas seulement sur navigateur de bureau.
- **Entrées unifiées** : utiliser les événements pointeur de Babylon pour couvrir souris et tactile avec un seul chemin de code (§5.1).
- **Interface** : Babylon GUI pour le HUD et les menus, afin de garder un rendu homogène et une seule boucle de rendu. Ne pas mélanger avec un overlay DOM sans raison documentée.

### Alternatives écartées
Unity et Unreal (installation lourde, support WebGL mobile faible), Godot export web (installation requise), Three.js + Rapier (davantage de câblage manuel avant le prototype), PlayCanvas (éditeur hébergé, dépendance externe).

## 15.2 Systèmes modulaires
Ne pas mettre toute la logique dans un contrôleur de scène monolithique. Services/classes conceptuels :
- `GameSessionController` : début/fin de partie, tirs, reset.
- `ShotController` : sélection, visée, lancement, vol, stabilisation, fin.
- `BuildSelectionService` : lanceur/personnage/objet.
- `AimingController` : geste → vecteur et puissance.
- `TrajectoryPreviewService` : prévision.
- `CameraDirector` : cadrage et transitions.
- `PhysicsImpactResolver` : intensité et dommages.
- `DestructibleObjectController` : états de dégâts.
- `WorldStateTracker` : état modifié durant la partie.
- `ScoreService` : attribution du score.
- `ComboChainTracker` : chaîne causale et multiplicateurs.
- `QuestService` : objectifs.
- `ProgressionService` : XP/niveaux.
- `SkillTreeService` : compétences.
- `InventoryService` : contenus possédés et améliorations.
- `GachaService` : tirages et récompenses.
- `EconomyService` : monnaie/coûts.
- `SaveService` : sauvegarde/migration.
- `AudioFeedbackService` et `VFXFeedbackService`.
- `CheatModeService` : bombe atomique.

Ces noms sont conceptuels ; adapter au moteur sans mélanger les responsabilités.

## 15.3 Architecture data-driven
Les données de contenu doivent être centralisées : lanceurs, personnages, objets, destructibles, niveaux, objectifs, quêtes, compétences, pools de gacha et réglages d'équilibrage. Éviter les valeurs de score, masses, résistances et coûts dispersées dans le code. Utiliser des identifiants stables.

## 15.4 Machines à états
Partie : `NotStarted`, `Loading`, `Ready`, `InProgress`, `Results`, `Resetting`.
Tir : `BuildSelection`, `Aiming`, `Launching`, `InFlight`, `Settling`, `ShotComplete`.
Destructible : `Intact`, `Damaged`, `Critical`, `Destroyed`, éventuellement `Collapsed`.
Gacha : `Idle`, `Rolling`, `Reveal`, `Rewarded`, `Skipped`.

Les entrées de jeu doivent être filtrées selon l'état : un double clic ne doit pas lancer deux fois, attribuer deux récompenses ou démarrer deux resets.

## 15.5 Événements
Événements typés possibles : `ShotStarted`, `CharacterLaunched`, `ImpactResolved`, `ObjectDamaged`, `ObjectDestroyed`, `ChainReactionAdvanced`, `ScoreAwarded`, `QuestProgressed`, `SecretDiscovered`, `ShotEnded`, `SessionCompleted`, `RewardGranted`.
Chaque attribution de score/récompense doit être idempotente ou posséder un identifiant unique pour empêcher le double comptage.

## 15.6 Conventions de projet [VALIDÉ]
- **Langue de l'interface :** tous les textes affichés au joueur sont en **français**.
- **Langue du code :** identifiants, noms de fichiers, types et commentaires techniques en **anglais**, par cohérence avec les API Babylon.js et TypeScript.
- **Unités :** 1 unité Babylon = 1 mètre ; angles en degrés dans les données, convertis en radians dans le code.
- **Structure des dossiers :** `src/core` (moteur, physique), `src/game` (services de gameplay §15.2), `src/data/config` (réglages) et `src/data/content` (catalogues §16), `src/rendering`, `src/ui`, `public/assets`.
- **Commandes :** `npm run dev`, `npm run build`, `npm run typecheck`, `npm test`.

## 15.7 Valeurs provisoires configurables
Valeurs temporaires au sens de l'obligation 7 du §22. Elles vivent dans `src/data/config` et doivent être ajustées par test, jamais recopiées en dur dans la logique.

| Sujet | Valeur provisoire | Référence |
|---|---|---|
| Gravité | −9,81 m/s², ajustable pour l'effet arcade | §6.1 |
| Seuil d'immobilité linéaire | 0,3 m/s | §5.6 |
| Seuil d'immobilité angulaire | 0,5 rad/s | §5.6 |
| Durée d'immobilité avant fin de tir | 4 s | §5.6 |
| Délai de sécurité maximal d'un tir | 20 s | §5.6, question ouverte n°13 |
| Durée du cadrage de résultat | 1,6 s avant retour automatique à la visée | §5.6 |
| Caméra de suivi | 22 m derrière, 9 m au-dessus, anticipation 0,35 s | §5.5 |
| Caméra de résultat | 34 m derrière, 16 m au-dessus, inclinaison 38° | §5.5 |
| Collision caméra | marge de 1,2 m devant l'obstacle, distance minimale de 8 m ; seul le décor statique bloque | §5.5 |
| Décalage de cadrage en visée | caméra décalée vers la gauche, lanceur dégagé vers la droite de l'écran ; décalage purement visuel, sans effet sur la direction de tir | §5.5 |
| Pantin de prototypage | 7 corps, 70 kg au total | §6.2 |
| Seuil d'impact voiture | 300 N·s, destruction en un coup | §6.4 |
| Seuil d'impact lampadaire | 180 N·s | §6.4 |
| Seuil d'impact panneau | 100 N·s | §6.4 |
| Aplatissement d'un objet écrasé | 42 % de sa hauteur initiale | §6.4 |
| Immeuble destructible | 6 sections de 4 m, 3 étapes par section, seuil 150 N·s, masse 2 500 kg par section | §6.4 |
| Ratio d'effondrement | 16 % des sections perdues, soit une seule section sur six | §6.4 |
| Poussée d'effondrement | 5 500 N·s par étage, direction commune tirée au hasard | §6.4 |
| Budget de débris actifs | 24 corps détachés, gel au-delà | §6.6 |
| Indicateur d'impact | affiché 1,4 s puis fondu de 0,7 s ; chocs sous 20 N·s non affichés | §13.3 |
| Fenêtre de combo | 4 s | §8.3 |
| Multiplicateur de combo maximum | x5 | §8.3 |
| Objectif du niveau de prototypage | 15 000 points en 3 tirs | §4.3, §8.5 |
| Valeurs de score | voiture 300, section d'immeuble 200, lampadaire 80, panneau 50 | §8.2 |
| Masse des voitures | 350 kg, volontairement basse pour qu'elles soient projetables | §6.1 |
| Impulsion de dispersion | voiture 4 200, lampadaire 1 600, panneau 700 N·s | §6.4 |
| Personnages | Pantin (neutre), Chat (masse x0,55, rebond +30 %), Coffre-fort (masse x1,8, score x2) | §10.3 |
| Objets | Pierre (masse x1,35, rebond -20 %), Ballon (masse x0,85, rebond +35 %), Enclume (masse x1,8, puissance x1,45), Réacteur, Bombe | §10.4 |
| Réacteur | 1 800 N·s par seconde pendant 1,2 s | §5.4 |
| Bombe | rayon 18 m, impulsion 5 200 N·s, impact 900 N·s au centre, atténuation linéaire | §5.4 |
| Conversion score vers XP | 0,1 XP par point de score | §9.1 |
| Coût d'un niveau | 800 XP, puis +400 XP par palier franchi, jusqu'au niveau 50 | §9.2 |
| Points de compétence | 1 par niveau, 2 tous les cinq niveaux | §9.2 |
| Récompenses de quête | 100 à 250 XP selon la difficulté | §8.7 |
| Plafond de vitesse de lancement | 38 m/s, sinon un build très léger quitte la carte | §5.1 |
| Secrets | rayon 5 m, 800 à 1 500 points de bonus, 120 à 200 XP | §7.3 |
| Campagne | Quartier de prototypage (15 000 pts), Quartier du port (30 000 pts) | §8.5 |
| Coûts des nœuds de compétence | 1 point pour les nœuds de base, 2 pour les nœuds avancés | §9.2 |
| Effets des compétences | +8 à +12 % puissance, +10 à +20 % impact, +0,08 rebond, +15 % rayon, +10 % score, +25 % combo | §9.2 |
| Points de l'aperçu de trajectoire | 32, tronqués au premier obstacle détecté par raycast | §5.2 |
| Puissance par défaut / minimale | 70 % / 5 % | §5.1 |
| Plage d'inclinaison de la vue exploitée | 45° à 85°, mappée sur un angle de tir de 60° à 10° | §5.1, §5.3 |
| FPS cible | 60 sur PC, 30 minimum acceptable sur mobile | question ouverte n°1 |
| Navigateurs visés | navigateurs WebGL2 récents (Chrome, Edge, Firefox, Safari) | question ouverte n°1 |
| Assets de blockout | primitives Babylon colorées jusqu'à la Phase 7 | §19 |

# 16. MODÈLES DE DONNÉES RECOMMANDÉS

Les champs suivants sont des gabarits à adapter au moteur, pas une obligation de nommage.

## 16.1 Lanceur
`id`, `displayName`, `description`, `iconAsset`, `modelAsset`, `launchPower`, `precision`, `rangeModifier`, `specialAbilityId` optionnel, `unlockSource`, `upgradeLevels`, `upgradeModifiers`, `tags`.

## 16.2 Personnage
`id`, `displayName`, `description`, `modelAsset`, `mass`, `collisionProfile`, `resistanceModifier`, `bounceModifier`, `passiveId` (0 ou 1), `activeAbilityId` optionnel, `unlockSource`, `upgradeLevels`, `upgradeModifiers`, `tags`.

## 16.3 Objet
`id`, `displayName`, `description`, `modelAsset`, `massModifier`, `launchModifier`, `impactModifier`, `passiveId` (0 ou 1), `activeAbilityId` optionnel, `activationMode`, `vfxId`, `audioId`, `unlockSource`, `upgradeLevels`, `upgradeModifiers`, `tags`.
Modes d'activation possibles : automatique, à l'impact, manuel en vol. Chaque mode doit être défini explicitement pour l'objet concerné.

## 16.4 Destructible
`id`, `displayName`, `healthOrStages`, `minimumImpactThreshold`, `damageScale`, `destructionMode`, `scoreValue`, `chainReactionTags`, `debrisProfile`, `persistentDuringSession`, `resetProfile`, `vfxId`, `audioId`.

## 16.5 Niveau
`id`, `themeId`, `displayName`, `sceneAsset`, `shotsAllowed`, `targetScore`, `questIds`, `secretIds`, `weatherOptions`, `timeOfDayOptions`, `resetStrategy`, `performanceBudget`.
Éviter les restrictions de build dans les niveaux standard, sauf raison de design validée.

## 16.6 Quête
`id`, `name`, `description`, `category`, `objectiveType`, `targetValue`, `scope` (tir/partie/niveau/progression), `rewardTable`, `hidden`, `repeatable`.

## 16.7 Compétence
`id`, `name`, `description`, `branch`, `prerequisiteIds`, `cost`, `effectType`, `effectValue`, `maxRank`, `isActiveAbility`, `vfxId`, `audioId`.

## 16.8 Sauvegarde
Version du schéma, paramètres, XP/niveau, monnaie, niveaux débloqués, meilleurs scores, quêtes persistantes, secrets découverts, inventaire, améliorations et compétences. Les données de scène temporaires ne doivent pas persister au-delà de la partie sauf décision explicite.

# 17. SAUVEGARDE ET INTÉGRITÉ

À sauvegarder : progression, XP, monnaie, inventaire, améliorations, compétences, meilleurs scores, quêtes persistantes, secrets découverts et paramètres.

À réinitialiser après la partie : dégâts, débris, personnages lancés, objets déplacés, positions des véhicules et état temporaire du niveau.

Recommandations :
- versionner le schéma de sauvegarde ;
- prévoir des migrations ;
- ne pas accorder deux fois XP/monnaie si l'application se ferme au mauvais moment ;
- vérifier identifiants inconnus, valeurs négatives et données corrompues ;
- rendre les opérations de récompense idempotentes ;
- décider ultérieurement si sauvegarde locale ou cloud.

**État actuel [VALIDÉ]** : sauvegarde **locale en IndexedDB**, **schéma en version 4** (scores, XP totale, quêtes accomplies, secrets découverts, rangs de compétences), migration tolérante qui complète les champs absents des versions antérieures et ignore les entrées corrompues plutôt que d'échouer, et repli en mémoire si le stockage est indisponible. Les résultats d'une partie sont calculés puis écrits **en une seule opération** ; les achats de compétences sont écrits immédiatement. Le choix d'une sauvegarde cloud reste ouvert.

# 18. PERFORMANCE ET ROBUSTESSE

- Cibler mobile et PC ; les budgets devront être définis sur les appareils choisis.
- Limiter les corps rigides actifs, utiliser le sommeil physique.
- Pooling des particules, fragments et effets répétés.
- LOD et collisions simplifiées pour les objets éloignés.
- Préférer étapes de destruction et pièces préfabriquées aux destructions voxel.
- Mesurer les pires cas : bombe, effondrement, multiples voitures, cascades et effets simultanés.
- Éviter les allocations fréquentes durant les combos.
- Conserver les éléments stratégiques, nettoyer uniquement les débris décoratifs selon des règles déterministes.
- Prévoir pause/reprise et fermeture d'application sans corruption de progression.
- Profiling réel sur appareil mobile ; ne pas conclure à la performance uniquement à partir de l'éditeur PC.

# 19. PLAN DE PRODUCTION

## Phase 0 — Projet
Moteur choisi (§15.1). Créer le dépôt versionné, initialiser le projet TypeScript/Vite avec Babylon.js et Havok, structurer les dossiers (données de contenu séparées de la logique), vérifier l'affichage d'une scène vide avec physique initialisée sur PC et sur mobile en paysage, documenter les commandes de développement et de build.

## Phase 1 — Prototype de sensation [priorité maximale]
- Blockout d'un petit quartier urbain.
- Une fronde à position fixe, visée pivotante (§5.3).
- Un personnage non mortel (§6.2).
- Tir par glissement arrière.
- Aperçu de trajectoire.
- Caméra de suivi et zoom.
- Fin manuelle/automatique.
- Relancer un tir.

**Succès si :** le tir est intuitif et amusant sans progression, gacha ou menus complexes.

### Phase 1b — Ragdoll articulé [TERMINÉ]
Le corps rigide unique a été remplacé par un pantin articulé non mortel (§6.2), sans modifier l'API du `ShotController` ni les critères d'acceptation du §20.1.

## Phase 2 — Destruction/persistance
Ajouter panneaux, lampadaires, voitures et un bâtiment multi-étapes. Conserver dégâts et personnages entre trois tirs ; reset total en fin de partie.

- **2a [TERMINÉ]** : système de destructibles data-driven, résolution d'impact par seuil, voitures / lampadaires / panneaux, persistance intra-partie et réinitialisation complète.
- **2b [TERMINÉ]** : bâtiments à sections détachables, effondrement au-delà d'un ratio de sections perdues, budget de débris.

Équilibrage vérifié en jeu : un tir bien placé sur une tour la fait céder et détruit ses six sections, là où un tir en pleine rue ne détruit qu'un ou deux éléments de mobilier.

## Phase 3 — Score/partie
Nombre de tirs selon niveau, score direct, combo de base, objectif de score, résultats et meilleur score sauvegardé.

- **3a [TERMINÉ]** : score direct, chaîne de combos avec fenêtre temporelle et plafond, objectif de score du niveau, limite de tirs par partie et affichage au HUD.
- **3b [TERMINÉ]** : écran de résultats de fin de partie et meilleur score sauvegardé en IndexedDB.

## Phase 4 — Builds
Plusieurs personnages, quelques objets/passifs, sélection avant chaque tir et une capacité activable en vol. Feedback spécifique.

- **4a [TERMINÉ]** : catalogues de 3 personnages et 3 objets, passifs typés, résolution de build pure et testée, sélection au HUD avant chaque tir, effets visibles sur la trajectoire, la physique et le score.
- **4b [TERMINÉ]** : capacités actives Réacteur et Bombe, machine à états de la capacité, souffle de zone réutilisable, retours visuels dédiés.

## Phase 5 — Progression
XP, premières compétences, quêtes et secrets, déblocage du niveau suivant.

- **5a [TERMINÉ]** : XP, niveaux de joueur à coût croissant, points de compétence, cinq quêtes suivies et récompensées, persistance en schéma version 2, affichage aux résultats.
- **5b-1 [TERMINÉ]** : secrets par niveau, deuxième quartier, déblocage par score, chargement et libération de niveau à chaud, sauvegarde version 3.
- **5b-2 [TERMINÉ]** : arbre de compétences dépensable à huit nœuds, bonus appliqués au tir, aux impacts, au rebond, aux explosions et au score, persistance en version 4.

## Phase 6 — Collection/économie
Inventaire, monnaie unique, gacha distinct par catégorie, doublons et petites améliorations. Sauvegarde robuste.

## Phase 7 — Contenu
Niveaux et thèmes supplémentaires, 3–4 secrets par niveau, météo/heure aléatoires, mode libre, mode triche.

## Phase 8 — Polish
Animations, VFX, audio, tutoriel, accessibilité, optimisation mobile, tests de régression et préparation de sortie.

Les idées futures (éditeur, replays, classements, défis hebdomadaires, boss géants) ne doivent commencer qu'après stabilisation de la base.

# 20. TESTS ET CRITÈRES D'ACCEPTATION

## 20.1 Tir
- Un build peut être sélectionné.
- Le geste arrière influence direction/puissance.
- La trajectoire change selon le build.
- Un relâchement lance exactement un personnage.
- Pas de double lancement par une entrée.
- La caméra suit sans perdre l'action.
- Le tir se termine par immobilité ou bouton.

## 20.2 Persistance
- Tir 1 détruit une voiture et endommage un bâtiment.
- Tir 2 retrouve la voiture détruite et le bâtiment endommagé.
- Le personnage du tir 1 reste dans le monde.
- Nouvelle partie : scène complètement réinitialisée.

## 20.3 Destruction
- Impact léger : dégâts partiels possibles sur bâtiment.
- Impact lourd : progression rapide ou effondrement.
- Impact qualifiant : voiture détruite.
- Score de destruction attribué une seule fois.
- Pas de boucle infinie de dégâts, explosions ou score.

## 20.4 Score/progression
- Score cumulé sur tous les tirs.
- Combo visible et stable.
- Objectifs/secrets correctement récompensés.
- Mode libre calcule le score sans modifier la campagne.
- Seuil de score déverrouille le niveau suivant.
- La campagne est réalisable sans contenu rare.

## 20.5 Sauvegarde
- XP, monnaie, inventaire, compétences et meilleurs scores persistent.
- Fermeture pendant les résultats ne duplique pas les récompenses.
- Migration possible lorsque le format de sauvegarde évolue.

## 20.6 UI
- Lisible en paysage sur mobile.
- Trajectoire visible sans masquer le jeu.
- Capacité active clairement identifiable.
- Résultats expliquent les récompenses.
- Passifs immédiatement reconnaissables.

# 21. QUESTIONS OUVERTES À NE PAS INVENTER

1. Navigateurs supportés, matériel minimal et FPS cible (valeurs provisoires en §15.7).
2. Fréquence météo/heure : chaque tir ou chaque partie.
3. Objets équipables consommés ou réutilisables.
4. Munitions/cadence des lanceurs futurs.
6. Équilibrage fin des coûts et effets de l'arbre de compétences (valeurs provisoires en §15.7) et contenu de la branche Élémentaire.
6. Valeurs de score, fenêtre de combo, multiplicateurs et seuils.
7. Nombre de niveaux au lancement.
8. Nombre de lanceurs à terme.
9. Raretés et probabilités de gacha.
10. Plafonds d'amélioration et doublons au maximum.
11. Coûts et récompenses de la monnaie.
12. Impact du mode triche sur scores/succès.
13. Durée et caractère sautables des animations de gacha.
14. Timeout exact de fin de tir (valeur provisoire en §15.7).
15. Maquettes UI finales.
16. Comportement en cas de fermeture pendant une partie.
17. Sauvegarde **cloud** éventuelle en complément du local (§17).

*(Tranchés depuis : moteur → §15.1 ; angles de visée et position du lanceur → §5.3 ; contrôles PC → §5.1 ; représentation physique du personnage et calendrier du ragdoll → §6.2 et §19 Phase 1b ; conventions de langue → §15.6.)*

# 22. INSTRUCTIONS POUR GITHUB COPILOT

Tu es l'ingénieur principal de Chaos. Lis cette spécification en entier avant de générer ou modifier du code. Construis le jeu par incréments jouables, testables et documentés.

## Obligations
1. Ne génère pas tout le jeu en une seule réponse.
2. Commence par confirmer moteur, structure et premier jalon.
3. Implémente d'abord le prototype de tir, avant gacha/économie/catalogue massif.
4. Sépare les données de contenu de la logique.
5. Évite les classes monolithiques et les dépendances circulaires.
6. Pour toute question majeure [À DÉFINIR], demande confirmation.
7. Pour les détails non bloquants, utilise une valeur temporaire configurable et documente-la.
8. N'ajoute ni mort, ni multijoueur, ni publicité, ni monnaie payante.
9. Respecte la destruction hybride, la persistance intra-partie et le reset complet entre parties.
10. N'introduis pas d'accès de campagne dépendant d'un objet rare.
11. Fournis tests et instructions de vérification pour chaque incrément.
12. Indique les fichiers modifiés et le résultat attendu.
13. Après chaque phase, compare le comportement aux critères d'acceptation.
14. Documente toute simplification ; ne supprime pas une caractéristique validée sans accord.

## Ordre impératif
A. Initialisation du projet (moteur tranché en §15.1).
B. Une scène blockout et un tir satisfaisant.
C. Caméra et trajectoire.
D. Fin du tir et boucle multi-tirs.
E. Destruction hybride et persistance.
F. Score et combos.
G. Sélection du build.
H. Progression, quêtes et secrets.
I. Inventaire, gacha et monnaie.
J. Contenu, polish et optimisation.

## Définition de « terminé »
Le code compile ne suffit pas. La fonctionnalité doit être utilisable en jeu, respecter la spécification, gérer les cas limites et être vérifiée par un test ou une procédure reproductible.
