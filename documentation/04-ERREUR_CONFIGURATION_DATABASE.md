# Cours 04 : Erreur de Configuration de Base de Données

## Le Problème : Configuration de Base de Données Manquante

### Problèmes Identifiés
1. **Absence de fichier `.env`** avec `DATABASE_URL`
2. **Configuration PostgreSQL** sans base de données disponible
3. **Client Prisma non généré** ou obsolète

## Erreurs Typiques Rencontrées

### Erreur 1 : Variable d'Environnement Manquante
```bash
Error: Environment variable not found: DATABASE_URL.
  --> schema.prisma:14
```

### Erreur 2 : Connexion Base de Données Échouée
```bash
Error: Can't reach database server at `localhost:5432`
Please make sure your database server is running at `localhost:5432`.
```

### Erreur 3 : Client Prisma Non Généré
```bash
Error: Cannot find module '.prisma/client'
```

## Solutions Détaillées

### Solution 1 : Configuration SQLite (Développement)

#### Création du fichier `.env`
```env
# .env
DATABASE_URL="file:./dev.db"

# Optionnel : Configuration Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

#### Modification du schéma Prisma
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "sqlite"  // Changé de "postgresql" à "sqlite"
  url      = env("DATABASE_URL")
}

model MenuItem {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
}
```

#### Génération et Migration
```bash
# Générer le client Prisma
npx prisma generate

# Créer et appliquer la migration
npx prisma migrate dev --name init

# Optionnel : Ouvrir Prisma Studio
npx prisma studio
```

### Solution 2 : Configuration PostgreSQL (Production)

#### Installation PostgreSQL
```bash
# Windows (avec Chocolatey)
choco install postgresql

# macOS (avec Homebrew)
brew install postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### Configuration de la base de données
```sql
-- Se connecter à PostgreSQL
psql -U postgres

-- Créer la base de données
CREATE DATABASE groupelab;

-- Créer un utilisateur (optionnel)
CREATE USER groupelab_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE groupelab TO groupelab_user;

-- Quitter
\q
```

#### Fichier `.env` pour PostgreSQL
```env
# .env
DATABASE_URL="postgresql://groupelab_user:your_password@localhost:5432/groupelab?schema=public"

# Ou avec utilisateur postgres par défaut
DATABASE_URL="postgresql://postgres:your_postgres_password@localhost:5432/groupelab?schema=public"
```

#### Schéma Prisma pour PostgreSQL
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model MenuItem {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
}
```

### Solution 3 : Configuration Docker (Recommandée)

#### Fichier `docker-compose.yml`
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: groupelab_db
    environment:
      POSTGRES_DB: groupelab
      POSTGRES_USER: groupelab_user
      POSTGRES_PASSWORD: groupelab_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Démarrage avec Docker
```bash
# Démarrer PostgreSQL
docker-compose up -d

# Vérifier que le conteneur fonctionne
docker-compose ps

# Voir les logs
docker-compose logs postgres
```

#### Configuration `.env` pour Docker
```env
# .env
DATABASE_URL="postgresql://groupelab_user:groupelab_password@localhost:5432/groupelab?schema=public"
```

## Processus Complet de Configuration

### Étape 1 : Choix de la Base de Données
```bash
# Pour développement rapide : SQLite
echo 'DATABASE_URL="file:./dev.db"' > .env

# Pour développement avec PostgreSQL : Docker
docker-compose up -d
echo 'DATABASE_URL="postgresql://groupelab_user:groupelab_password@localhost:5432/groupelab?schema=public"' > .env
```

### Étape 2 : Configuration du Schéma
```prisma
// prisma/schema.prisma - Adapter le provider
datasource db {
  provider = "sqlite"      // ou "postgresql"
  url      = env("DATABASE_URL")
}
```

### Étape 3 : Génération et Migration
```bash
# Générer le client Prisma
npx prisma generate

# Créer la première migration
npx prisma migrate dev --name init

# Vérifier la base de données
npx prisma studio
```

### Étape 4 : Test de Connexion
```typescript
// scripts/test-db.js
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    // Test de connexion
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
    
    // Test de création
    const testItem = await prisma.menuItem.create({
      data: { name: 'Test Connection' }
    });
    console.log('✅ Création de données réussie:', testItem);
    
    // Test de lecture
    const items = await prisma.menuItem.findMany();
    console.log('✅ Lecture de données réussie:', items.length, 'items');
    
    // Nettoyage
    await prisma.menuItem.delete({
      where: { id: testItem.id }
    });
    console.log('✅ Suppression réussie');
    
  } catch (error) {
    console.error('❌ Erreur de base de données:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

## Gestion des Erreurs Communes

### Erreur : "Port 5432 already in use"
```bash
# Trouver le processus utilisant le port
netstat -tulpn | grep :5432

# Tuer le processus (remplacer PID)
sudo kill -9 PID

# Ou utiliser un autre port
DATABASE_URL="postgresql://user:pass@localhost:5433/groupelab?schema=public"
```

### Erreur : "Password authentication failed"
```bash
# Réinitialiser le mot de passe PostgreSQL
sudo -u postgres psql
\password postgres

# Ou créer un nouvel utilisateur
CREATE USER newuser WITH PASSWORD 'newpassword';
ALTER USER newuser CREATEDB;
```

### Erreur : "Database does not exist"
```bash
# Créer la base de données
createdb -U postgres groupelab

# Ou via psql
psql -U postgres
CREATE DATABASE groupelab;
```

## Bonnes Pratiques

### 1. Variables d'Environnement
```env
# .env.example (à committer)
DATABASE_URL="your-database-url-here"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# .env (à ne PAS committer)
DATABASE_URL="postgresql://real_user:real_password@localhost:5432/groupelab"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="actual-secret-key-here"
```

### 2. Scripts Package.json
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

### 3. Seed Script
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Données d'exemple
  const menuItems = [
    { name: 'Pizza Margherita' },
    { name: 'Burger Classic' },
    { name: 'Salade César' },
    { name: 'Pasta Carbonara' },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }

  console.log('✅ Base de données initialisée avec des données d\'exemple');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 4. Configuration CI/CD
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - run: npm test
```

## Monitoring et Maintenance

### 1. Surveillance des Connexions
```typescript
// lib/db-monitor.ts
import { prisma } from './prisma';

export async function checkDatabaseHealth() {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
```

### 2. Sauvegarde Automatique
```bash
# Script de sauvegarde PostgreSQL
#!/bin/bash
# backup.sh

DB_NAME="groupelab"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

pg_dump $DB_NAME > "$BACKUP_DIR/backup_$DATE.sql"

# Garder seulement les 7 dernières sauvegardes
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Sauvegarde créée: backup_$DATE.sql"
```

## Conclusion

La configuration correcte de la base de données est **cruciale** pour :
- Le fonctionnement de l'application
- Les performances en production
- La stabilité et la fiabilité
- Le développement en équipe

Suivre ces étapes garantit une configuration robuste et maintenable.
