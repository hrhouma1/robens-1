# Cours : Conventions de Nommage Prisma - Erreur `prisma.menuitems` vs `prisma.menuItem`

## Introduction

L'une des erreurs les plus communes lors de l'utilisation de Prisma est la confusion entre le nom du modèle dans le schéma et le nom généré pour le client Prisma. Ce cours explique cette différence cruciale.

## Le Problème : Comprendre la Convention de Nommage

### Dans le Schéma Prisma (`schema.prisma`)
```prisma
model MenuItem {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
}
```

### Code Incorrect (Erreur Commune)
```typescript
// ❌ ERREUR : Utilisation du nom pluriel en minuscules
const menuitems = await prisma.menuitems.findMany();
```

### Code Correct
```typescript
// ✅ CORRECT : Utilisation du nom exact du modèle
const menuItems = await prisma.menuItem.findMany();
```

## Règles de Convention Prisma

### 1. Nom du Modèle = Nom de l'Objet Client

Le client Prisma génère automatiquement des propriétés basées sur le **nom exact** du modèle défini dans le schéma.

| Modèle dans schema.prisma | Propriété du client | Exemple d'utilisation |
|---------------------------|--------------------|-----------------------|
| `MenuItem` | `menuItem` | `prisma.menuItem.findMany()` |
| `User` | `user` | `prisma.user.create()` |
| `BlogPost` | `blogPost` | `prisma.blogPost.update()` |
| `ProductCategory` | `productCategory` | `prisma.productCategory.delete()` |

### 2. Transformation Automatique

Prisma applique automatiquement la convention **camelCase** :
- `MenuItem` → `menuItem`
- `ProductCategory` → `productCategory`
- `UserProfile` → `userProfile`

## Exemples Pratiques

### Schéma avec Plusieurs Modèles
```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts BlogPost[]
}

model BlogPost {
  id       Int    @id @default(autoincrement())
  title    String
  content  String
  authorId Int
  author   User   @relation(fields: [authorId], references: [id])
}

model ProductCategory {
  id       Int    @id @default(autoincrement())
  name     String
  products Product[]
}
```

### Utilisation Correcte dans le Code
```typescript
// ✅ Utilisations correctes
const users = await prisma.user.findMany();
const blogPosts = await prisma.blogPost.findMany();
const categories = await prisma.productCategory.findMany();

// ❌ Erreurs communes à éviter
const users = await prisma.users.findMany();        // Pluriel incorrect
const blogposts = await prisma.blogposts.findMany(); // Tout en minuscules
const product_categories = await prisma.product_categories.findMany(); // Snake_case
```

## Pourquoi Cette Erreur est Commune ?

### 1. Confusion avec les Bases de Données
Les développeurs pensent souvent aux **tables de base de données** qui sont généralement au pluriel :
- Table : `menu_items` ou `menuitems`
- Modèle Prisma : `MenuItem`
- Client Prisma : `menuItem`

### 2. Habitudes d'Autres ORMs
D'autres ORMs utilisent parfois des conventions différentes, créant de la confusion.

### 3. Intuition du Pluriel
Il semble logique d'utiliser le pluriel quand on récupère plusieurs éléments, mais Prisma utilise le nom du modèle au singulier.

## Bonnes Pratiques

### 1. Vérification du Client Généré
Après avoir défini votre schéma, vérifiez toujours le client généré :

```bash
npx prisma generate
```

Puis examinez les types TypeScript générés dans `node_modules/.prisma/client/index.d.ts`.

### 2. Utilisation de l'Autocomplétion
Utilisez l'autocomplétion de votre IDE pour éviter les erreurs :
```typescript
// Tapez "prisma." et laissez l'IDE vous proposer les options
prisma. // L'autocomplétion vous montrera : menuItem, user, blogPost, etc.
```

### 3. Convention de Nommage des Variables
```typescript
// ✅ Bonne pratique : variable au pluriel, méthode au singulier
const menuItems = await prisma.menuItem.findMany();
const singleItem = await prisma.menuItem.findUnique({ where: { id: 1 } });

// ✅ Pour une seule entité
const user = await prisma.user.findUnique({ where: { id: 1 } });

// ✅ Pour plusieurs entités
const users = await prisma.user.findMany();
```

## Debugging : Comment Identifier l'Erreur

### Erreur Typique
```
Property 'menuitems' does not exist on type 'PrismaClient'
```

### Solution
1. Vérifiez le nom exact dans `schema.prisma`
2. Utilisez la version camelCase du nom du modèle
3. Régénérez le client si nécessaire : `npx prisma generate`

## Cas Particuliers

### Modèles avec Acronymes
```prisma
model APIKey {
  id  Int    @id @default(autoincrement())
  key String
}
```
Utilisation : `prisma.aPIKey` (Prisma préserve la casse)

### Modèles avec Underscores (Non Recommandé)
```prisma
model menu_item {  // Non recommandé
  id   Int    @id @default(autoincrement())
  name String
}
```
Utilisation : `prisma.menu_item` (préserve le nom exact)

## Exercices Pratiques

### Exercice 1
Étant donné ce schéma :
```prisma
model ShoppingCart {
  id     Int @id @default(autoincrement())
  userId Int
}
```
Quelle est la syntaxe correcte pour récupérer tous les paniers ?

<details>
<summary>Réponse</summary>

```typescript
const shoppingCarts = await prisma.shoppingCart.findMany();
```
</details>

### Exercice 2
Corrigez ces erreurs :
```typescript
// Code avec erreurs
const products = await prisma.products.findMany();
const orderitems = await prisma.orderitems.findMany();
const user_profiles = await prisma.user_profiles.findMany();
```

<details>
<summary>Réponse</summary>

```typescript
// Code corrigé (en supposant les modèles Product, OrderItem, UserProfile)
const products = await prisma.product.findMany();
const orderItems = await prisma.orderItem.findMany();
const userProfiles = await prisma.userProfile.findMany();
```
</details>

## Conclusion

La convention de nommage Prisma est simple mais stricte :
- **Modèle dans schema** : PascalCase (`MenuItem`)
- **Client Prisma** : camelCase (`menuItem`)
- **Variable de résultat** : camelCase pluriel pour les collections (`menuItems`)

Respecter cette convention évite les erreurs de compilation et améliore la lisibilité du code.
