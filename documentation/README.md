# Documentation GroupeLab - Guide des Erreurs Communes

## Vue d'Ensemble

Cette documentation couvre les principales erreurs rencontrées lors de la configuration et du développement du projet GroupeLab, une API Next.js avec Prisma pour la gestion des éléments de menu.

## Structure de la Documentation

### 📋 [00 - Rapport de Setup](./00-SETUP_REPORT.md)
Résumé exécutif de tous les problèmes identifiés et corrigés lors de la mise en place du projet.

### 🏷️ [01 - Erreurs de Nommage Prisma](./01-COURS_PRISMA_NAMING.md)
**Problème** : `prisma.menuitems` vs `prisma.menuItem`
- Convention de nommage Prisma
- Transformation PascalCase → camelCase
- Erreurs communes et solutions
- Exercices pratiques

### 🔧 [02 - Erreur d'Instance PrismaClient](./02-ERREUR_INSTANCE_PRISMA.md)
**Problème** : `new PrismaClient()` dans chaque route
- Pattern Singleton obligatoire
- Épuisement du pool de connexions
- Impact sur les performances
- Configuration de monitoring

### 🛣️ [03 - Routes API Incomplètes](./03-ERREUR_ROUTES_INCOMPLETES.md)
**Problème** : Fichiers de routes contenant uniquement des commentaires
- Implémentation CRUD complète
- Validation des données
- Gestion d'erreurs par route
- Tests d'API

### 💾 [04 - Configuration de Base de Données](./04-ERREUR_CONFIGURATION_DATABASE.md)
**Problème** : Absence de `.env` et configuration PostgreSQL manquante
- Configuration SQLite vs PostgreSQL
- Variables d'environnement
- Docker pour développement
- Scripts de migration et seed

### ⚠️ [05 - Gestion d'Erreurs Manquante](./05-ERREUR_GESTION_ERREURS.md)
**Problème** : Absence de try-catch et validation
- Gestion d'erreurs robuste
- Validation avec Zod
- Logging structuré
- Monitoring et alertes

### 🔌 [06 - Conflits de Ports](./06-ERREUR_CONFLITS_PORTS.md)
**Problème** : Port 3000 occupé par d'autres processus
- Identification et résolution des conflits
- Configuration de ports dynamiques
- Scripts utilitaires
- Bonnes pratiques de développement

## Ordre de Lecture Recommandé

### Pour les Débutants
1. **[01 - Nommage Prisma]** - Comprendre les bases
2. **[04 - Configuration Database]** - Mise en place de l'environnement
3. **[02 - Instance Prisma]** - Pattern fondamental
4. **[03 - Routes API]** - Implémentation pratique

### Pour les Développeurs Expérimentés
1. **[00 - Rapport de Setup]** - Vue d'ensemble rapide
2. **[05 - Gestion d'Erreurs]** - Techniques avancées
3. **[06 - Conflits de Ports]** - Outils de productivité

### Pour la Production
1. **[05 - Gestion d'Erreurs]** - Monitoring et logging
2. **[04 - Configuration Database]** - Déploiement et sauvegardes
3. **[02 - Instance Prisma]** - Optimisation des performances

## Erreurs par Fréquence

### ⚡ Très Fréquentes (Débutants)
- `prisma.menuitems` au lieu de `prisma.menuItem`
- `new PrismaClient()` dans les routes
- Absence de fichier `.env`

### 🔥 Fréquentes (Développement)
- Routes API incomplètes
- Conflits de ports
- Validation manquante

### 💥 Critiques (Production)
- Gestion d'erreurs insuffisante
- Configuration de base de données incorrecte
- Monitoring manquant

## Checklist de Vérification

### ✅ Avant de Commencer
- [ ] Fichier `.env` configuré
- [ ] Base de données accessible
- [ ] Client Prisma généré
- [ ] Port 3000 libre

### ✅ Pendant le Développement
- [ ] Utilisation du singleton Prisma
- [ ] Convention de nommage respectée
- [ ] Routes API complètes avec validation
- [ ] Gestion d'erreurs en place

### ✅ Avant la Production
- [ ] Logging structuré configuré
- [ ] Monitoring en place
- [ ] Variables d'environnement sécurisées
- [ ] Tests d'API complets

## Scripts Utiles

```bash
# Vérification rapide du projet
npm run health-check

# Nettoyage des ports occupés
npm run kill-port

# Tests de l'API
npm run test:api

# Génération Prisma
npm run db:generate

# Reset de la base de données
npm run db:reset
```

## Ressources Additionnelles

### Documentation Officielle
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Node.js Error Handling](https://nodejs.org/en/docs/guides/error-handling/)

### Outils Recommandés
- **Prisma Studio** : Interface graphique pour la base de données
- **Postman/Insomnia** : Tests d'API
- **Docker** : Environnement de développement cohérent

### Extensions VSCode
- Prisma (officielle)
- Thunder Client (tests API)
- Error Lens (affichage d'erreurs)

## Contribution

Cette documentation est maintenue et mise à jour régulièrement. Pour signaler des erreurs ou proposer des améliorations :

1. Identifier le problème dans le cours correspondant
2. Proposer une solution avec exemple de code
3. Tester la solution sur un projet réel
4. Documenter la correction

## Historique des Versions

- **v1.0** : Documentation initiale avec 6 cours principaux
- Configuration SQLite et PostgreSQL
- Scripts utilitaires et bonnes pratiques
- Exemples de code complets et testés
