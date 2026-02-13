# Corps Mobile - Programme Calisthenics

Application web mobile-first pour suivre un programme de calisthenics debutant:
Push, Pull, Jambes/Core, Mobilite/Skills et Flexibilite.

Le projet est en HTML/CSS/JS natif, sans framework, et fonctionne offline une
fois charge dans le navigateur.

## Objectif du projet

- Proposer une routine simple et claire pour progresser sans salle
- Fournir des consignes de technique par exercice
- Suivre les seances et la progression directement sur mobile
- Rester leger et facilement modifiable

## Fonctionnalites

- Onglets de seance: `Push`, `Pull`, `Jambes/Core`, `Mobilite`, `Flexibilite`
- Exercices avec schema SVG + details techniques
- Timer de repos rapide (boutons presets + controle manuel)
- Checklist "Aujourd'hui" par type de seance
- Suivi local: seances validees, streak, objectifs, progression hebdo
- Sauvegarde automatique via `localStorage`

## Stack technique

- `HTML5` pour la structure
- `CSS3` pour le style responsive mobile-first
- `JavaScript` vanilla pour l'interactivite et la persistance

## Structure des fichiers

```text
corpsmobile/
├── index.html
├── assets/
│   ├── css/
│   │   └── main.css
│   └── js/
│       ├── config.js
│       └── app.js
├── README.md
└── LICENSE
```

## Role de chaque fichier

- `index.html`: structure de la page et contenu des sections
- `assets/css/main.css`: design global, layout, composants UI
- `assets/js/config.js`: donnees metier modifiables:
  checklists, objectifs, cle de stockage, objectif hebdo
- `assets/js/app.js`: logique applicative:
  tabs, timer, rendu dynamique, stats, sauvegarde locale

## Lancer le projet en local

Option la plus simple: ouvrir `index.html` dans le navigateur.

Option serveur local (recommande):

```bash
cd /home/desty/Documents/DestyPrime/corpsmobile
python -m http.server 8080
```

Puis ouvrir: `http://localhost:8080`

## Personnalisation rapide

- Changer les checklists par onglet:
  modifier `checklistByTab` dans `assets/js/config.js`
- Changer les mini-objectifs:
  modifier `goals` dans `assets/js/config.js`
- Changer l'objectif hebdomadaire:
  modifier `weeklyGoal` dans `assets/js/config.js`
- Changer le style visuel:
  modifier `assets/css/main.css`

## Deploiement sur GitHub Pages

1. Pousser ce dossier dans un repository GitHub (branche `main`)
2. Aller dans `Settings > Pages`
3. Configurer:
   `Build and deployment > Source: Deploy from a branch`
4. Choisir:
   `Branch: main` et `Folder: / (root)`
5. URL finale:
   `https://<votre-user>.github.io/<votre-repo>/`

## Donnees et confidentialite

- Aucune base de donnees distante
- Les donnees restent sur le navigateur de l'utilisateur (`localStorage`)
- Un reset complet est disponible dans l'interface

## Licence

Projet distribue sous licence MIT.
Voir `LICENSE`.
