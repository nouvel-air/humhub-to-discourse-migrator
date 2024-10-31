const categoriesMapping = {
  // PUBLIC
  18: 6, // Salle commune
  1: 9, // Outils numériques
  12: 24, // La Fabrique des Communs
  19: 25, // Modèle socio-économique
  34: 26, // Créer et animer un jardin
  36: 27, // Education et gouvernance partagée
  45: 30, // Aide
  121: 22, // Campus 2023

  // Thématiques
  59: 5, // Jardin des Limaces
  48: 31, // Jardin Clown et GP
  53: 11, // Jardin Accompagnement d'organisation
  102: 33, // Jardin Recherche & Coopérations
  55: 12, // Jardin Senso
  65: 13, // Jardin du Vivre Ensemble
  76: 14, // Jardin des Dominos
  120: 40, // Jardin ICO-4

  // Territoriaux
  37: 28, // Grenoble
  108: 29, // Chambéry
  47: 38, // Léman
  64: 39, // Nantes

  // Organisation
  9: 10, // Cercle général
  21: 36, // Cercle d'ancrage
  60: 37 // Cercle Campus
};

const groupsMapping = {
  // Organisation
  9: 42, // Cercle général
  21: 43, // Cercle d'ancrage
  60: 44, // Cercle Campus

  // JARDINS LOCAUX
  47: 46, // Jardin du Léman
  37: 45, // Grenoble
  108: 47, // Chambéry
  64: 55, // Nantes

  // JARDIN THEMATIQUES
  59: 41, // Jardin des Limaces
  48: 51, // Jardin Clown et GP
  53: 50, // Jardin Accompagnement d'organisation
  102: 53, // Jardin Recherche & Coopérations
  55: 54, // Jardin Senso
  65: 52, // Jardin du Vivre Ensemble
  76: 48, // Jardin des Dominos
  120: 56 // Jardin ICO-4
};

const groupsNameMapping = {
  // ORGA
  9: 'cercle-general', // Cercle général
  21: 'cercle-ancrage', // Cercle d'ancrage
  60: 'cercle-campus', // Cercle Campus

  // JARDINS LOCAUX
  120: 'jardin-du-leman', // Jardin du Léman
  37: 'jardin-grenoble', // Grenoble
  108: 'jardin-chambery', // Chambéry
  64: 'jardin-de-nantes', // Nantes

  // JARDIN THEMATIQUES
  59: 'jardin-des-limaces', // Jardin des Limaces
  48: 'jardin-clown-et-gp', // Jardin Clown et GP
  53: 'jardin-accompagnement-orga', // Jardin Accompagnement d'organisation
  102: 'jardin-recherche-cooperations', // Jardin Recherche & Coopérations
  55: 'jardin-senso', // Jardin Senso
  65: 'jardin-du-vivre-ensemble', // Jardin du Vivre Ensemble
  76: 'jardin-des-dominos', // Jardin des Dominos
  120: 'jardin-ico-4' // Jardin ICO-4
};

const contentContainerMapping = {
  1: 2, // Outils numériques
  9: 24, // Cercle général
  12: 42, // La Fabrique des Communs
  18: 61, // Salle commune
  19: 62, // Modèle socio-économique
  34: 138, // Créer et animer un jardin
  36: 207, // Education et gouvernance partagée
  37: 210, // Grenoble
  45: 318, // Aide
  48: 402, // Jardin Clown et GP
  53: 482, // Jardin Accompagnement d'organisation
  55: 501, // Jardin Senso
  59: 580, // Jardin des Limaces
  65: 773, // Jardin du Vivre Ensemble
  76: 944, // Jardin des Dominos
  99: 2095, // Jardin Animons la transition
  102: 2222, // Jardin Recherche & Coopérations
  108: 2710, // Chambéry
  121: 3176 // Campus 2023
};

module.exports = {
  categoriesMapping,
  groupsMapping,
  groupsNameMapping,
  contentContainerMapping
};
