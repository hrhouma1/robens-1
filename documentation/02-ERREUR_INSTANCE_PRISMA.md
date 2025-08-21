# Cours 02 : Erreur d'Instance PrismaClient Multiple

## Le Problème : `new PrismaClient()` dans les Routes API

### Code Problématique
```typescript
// ❌ ERREUR : Création d'une nouvelle instance à chaque requête
import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server";

const prisma = new PrismaClient(); // PROBLÈME ICI

export async function GET() {
  const menuItems = await prisma.menuItem.findMany();
  return NextResponse.json(menuItems);
}
```

## Pourquoi C'est un Problème ?

### 1. Pool de Connexions Épuisé
- Chaque `new PrismaClient()` ouvre une nouvelle connexion à la base de données
- Les bases de données ont un nombre limité de connexions simultanées
- Exemple : PostgreSQL par défaut = 100 connexions max

### 2. Problème de Performance
```typescript
// Chaque requête HTTP :
const prisma = new PrismaClient(); // 100-200ms pour établir la connexion
await prisma.menuItem.findMany();  // 10-50ms pour la requête
// Total : 150-250ms par requête
```

### 3. Fuite Mémoire
- Les instances ne sont pas correctement fermées
- Accumulation d'objets en mémoire
- Crash de l'application après plusieurs requêtes

## La Solution : Pattern Singleton

### Création du Singleton (`lib/prisma.ts`)
```typescript
import { PrismaClient } from "@prisma/client";

// Déclaration du type global pour éviter les conflits TypeScript
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Création ou réutilisation de l'instance unique
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"], // Optionnel : logs des requêtes en développement
  });

// En développement, stockage dans global pour éviter les rechargements
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### Utilisation dans les Routes API
```typescript
// ✅ CORRECT : Import du singleton
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany();
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}
```

## Comparaison des Performances

### Avant (Multiple Instances)
```
Requête 1: 200ms (nouvelle connexion + requête)
Requête 2: 180ms (nouvelle connexion + requête)
Requête 3: 220ms (nouvelle connexion + requête)
...
Requête 50: CRASH (pool de connexions épuisé)
```

### Après (Singleton)
```
Requête 1: 150ms (connexion initiale + requête)
Requête 2: 15ms (réutilisation + requête)
Requête 3: 12ms (réutilisation + requête)
...
Requête 1000+: 10-20ms (stable)
```

## Test de Charge Comparatif

### Script de Test
```javascript
// test-load.js
const axios = require('axios');

async function testLoad(requests = 100) {
  const promises = [];
  const startTime = Date.now();
  
  for (let i = 0; i < requests; i++) {
    promises.push(axios.get('http://localhost:3000/api/menu-items'));
  }
  
  try {
    await Promise.all(promises);
    const endTime = Date.now();
    console.log(`${requests} requêtes en ${endTime - startTime}ms`);
  } catch (error) {
    console.error('Erreur lors du test de charge:', error.message);
  }
}

testLoad(100);
```

### Résultats Typiques
| Méthode | 10 requêtes | 50 requêtes | 100 requêtes |
|---------|-------------|-------------|--------------|
| Multiple instances | 2000ms | CRASH | CRASH |
| Singleton | 200ms | 800ms | 1500ms |

## Erreurs Communes et Solutions

### Erreur 1 : Import Incorrect
```typescript
// ❌ Mauvais import
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ✅ Bon import
import { prisma } from "../../../lib/prisma";
```

### Erreur 2 : Chemin d'Import Incorrect
```typescript
// ❌ Chemins incorrects selon la structure
import { prisma } from "./lib/prisma";     // Depuis app/api/route.ts
import { prisma } from "../lib/prisma";    // Depuis app/api/route.ts

// ✅ Chemin correct depuis app/api/menu-items/route.ts
import { prisma } from "../../../lib/prisma";
```

### Erreur 3 : Configuration de Logs
```typescript
// ❌ Logs en production (performance dégradée)
export const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"], // Trop verbeux
});

// ✅ Logs conditionnels
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query"] : ["error"],
});
```

## Monitoring et Debugging

### Vérification du Nombre de Connexions
```typescript
// Ajout dans lib/prisma.ts pour monitoring
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

// Log des connexions en développement
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    console.log('Query: ' + e.query);
    console.log('Duration: ' + e.duration + 'ms');
  });
}
```

### Fermeture Propre de l'Application
```typescript
// Dans votre serveur principal ou script de shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

## Bonnes Pratiques

### 1. Structure de Projet
```
project/
├── lib/
│   └── prisma.ts          # Singleton ici
├── app/
│   └── api/
│       └── menu-items/
│           └── route.ts   # Import du singleton
```

### 2. Variables d'Environnement
```env
# .env
DATABASE_URL="your-database-url"
PRISMA_LOG_LEVEL="info"  # ou "query" pour debug
```

### 3. Configuration TypeScript
```json
// tsconfig.json - S'assurer que les paths sont corrects
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/lib/*": ["lib/*"]
    }
  }
}
```

## Exercices Pratiques

### Exercice 1 : Identifier le Problème
Analysez ce code et identifiez les problèmes :
```typescript
import { PrismaClient } from "@prisma/client";

export async function GET() {
  const db = new PrismaClient();
  const users = await db.user.findMany();
  return Response.json(users);
}

export async function POST() {
  const db = new PrismaClient();
  const user = await db.user.create({
    data: { name: "Test" }
  });
  return Response.json(user);
}
```

### Exercice 2 : Corriger le Code
Corrigez le code de l'exercice 1 en utilisant le pattern singleton.

### Exercice 3 : Test de Performance
Créez un script pour tester la différence de performance entre les deux approches.

## Conclusion

L'utilisation du pattern singleton pour PrismaClient est **essentielle** pour :
- Éviter l'épuisement du pool de connexions
- Améliorer les performances (10x plus rapide)
- Prévenir les fuites mémoire
- Assurer la stabilité de l'application

Cette pratique est **obligatoire** dans toute application Next.js utilisant Prisma en production.
