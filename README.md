# Corps Mobile - Structure

Le site est maintenant séparé en couches pour être plus maintenable :

- `index.html` : structure HTML et contenu de page.
- `assets/css/main.css` : styles globaux.
- `assets/js/config.js` : configuration métier (clé de stockage, checklist par onglet, objectifs).
- `assets/js/app.js` : logique interactive (tabs, timer, checklist, stats, localStorage).

## Faire évoluer le site

- Modifier le style : `assets/css/main.css`
- Changer les checklists : `assets/js/config.js` -> `checklistByTab`
- Changer les objectifs : `assets/js/config.js` -> `goals`
- Changer le comportement (timer, stockage, UI) : `assets/js/app.js`
