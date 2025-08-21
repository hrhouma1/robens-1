# Cours 03 : Erreur des Routes API Incomplètes

## Le Problème : Fichiers de Routes Vides

### Code Problématique Typique
```typescript
// app/api/menu-items/route.ts
// GET ALL, POST

// app/api/menu-items/[id]/route.ts  
// GET ONE, PUT, DELETE

// app/search/route.ts
// GET search
```

## Pourquoi C'est un Problème ?

### 1. Fonctionnalité Non Implémentée
- Les endpoints existent dans la structure mais ne fonctionnent pas
- Erreurs 404 ou 500 lors des appels API
- Interface utilisateur cassée

### 2. Mauvaise Expérience Développeur
- Perte de temps à chercher pourquoi l'API ne répond pas
- Difficile de tester l'application
- Code non maintenable

### 3. Problèmes de Production
- Crash de l'application sur des routes non gérées
- Erreurs silencieuses difficiles à débugger

## Solutions Complètes par Route

### Route 1 : GET et POST (`/api/menu-items`)

#### Code Complet
```typescript
// app/api/menu-items/route.ts
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

// GET - Récupérer tous les éléments de menu
export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      orderBy: {
        createdAt: 'desc' // Plus récents en premier
      }
    });
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" }, 
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel élément de menu
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;
    
    // Validation des données
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: "Name is required and must be a string" }, 
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters long" }, 
        { status: 400 }
      );
    }

    // Vérification d'unicité (optionnel)
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existingItem) {
      return NextResponse.json(
        { error: "Menu item with this name already exists" }, 
        { status: 409 }
      );
    }

    const menuItem = await prisma.menuItem.create({
      data: { 
        name: name.trim() 
      }
    });
    
    return NextResponse.json(menuItem, { status: 201 });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" }, 
      { status: 500 }
    );
  }
}
```

### Route 2 : GET, PUT, DELETE par ID (`/api/menu-items/[id]`)

#### Code Complet
```typescript
// app/api/menu-items/[id]/route.ts
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

// GET - Récupérer un élément par ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid ID format" }, 
        { status: 400 }
      );
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id }
    });

    if (!menuItem) {
      return NextResponse.json(
        { error: "Menu item not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(menuItem);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu item" }, 
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un élément
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name } = body;
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid ID format" }, 
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name is required and must be at least 2 characters" }, 
        { status: 400 }
      );
    }

    // Vérifier si l'élément existe
    const existingItem = await prisma.menuItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Menu item not found" }, 
        { status: 404 }
      );
    }

    // Vérifier l'unicité du nouveau nom (sauf pour l'élément actuel)
    const duplicateItem = await prisma.menuItem.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        },
        id: {
          not: id
        }
      }
    });

    if (duplicateItem) {
      return NextResponse.json(
        { error: "Menu item with this name already exists" }, 
        { status: 409 }
      );
    }

    const updatedMenuItem = await prisma.menuItem.update({
      where: { id },
      data: { 
        name: name.trim() 
      }
    });

    return NextResponse.json(updatedMenuItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" }, 
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un élément
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid ID format" }, 
        { status: 400 }
      );
    }

    // Vérifier si l'élément existe avant de le supprimer
    const existingItem = await prisma.menuItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Menu item not found" }, 
        { status: 404 }
      );
    }

    await prisma.menuItem.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: "Menu item deleted successfully",
      deletedItem: existingItem
    });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" }, 
      { status: 500 }
    );
  }
}
```

### Route 3 : Recherche (`/api/search`)

#### Code Complet
```typescript
// app/search/route.ts
import { prisma } from "../../lib/prisma";
import { NextResponse } from "next/server";

// GET - Rechercher des éléments de menu
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required" }, 
        { status: 400 }
      );
    }

    if (query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" }, 
        { status: 400 }
      );
    }

    if (limit > 100) {
      return NextResponse.json(
        { error: "Limit cannot exceed 100" }, 
        { status: 400 }
      );
    }

    // Recherche avec pagination
    const [menuItems, totalCount] = await Promise.all([
      prisma.menuItem.findMany({
        where: {
          name: {
            contains: query.trim(),
            mode: 'insensitive'
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.menuItem.count({
        where: {
          name: {
            contains: query.trim(),
            mode: 'insensitive'
          }
        }
      })
    ]);

    return NextResponse.json({
      query: query.trim(),
      results: menuItems,
      pagination: {
        total: totalCount,
        count: menuItems.length,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error("Error searching menu items:", error);
    return NextResponse.json(
      { error: "Failed to search menu items" }, 
      { status: 500 }
    );
  }
}
```

### Route 4 : Documentation API (`/api`)

#### Code Complet
```typescript
// app/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    name: "GroupeLab API",
    version: "1.0.0",
    description: "API REST pour la gestion des éléments de menu",
    endpoints: {
      "GET /api/menu-items": {
        description: "Récupérer tous les éléments de menu",
        parameters: "Aucun",
        response: "Array<MenuItem>"
      },
      "POST /api/menu-items": {
        description: "Créer un nouvel élément de menu",
        parameters: "{ name: string }",
        response: "MenuItem"
      },
      "GET /api/menu-items/[id]": {
        description: "Récupérer un élément de menu par ID",
        parameters: "id: number",
        response: "MenuItem"
      },
      "PUT /api/menu-items/[id]": {
        description: "Mettre à jour un élément de menu",
        parameters: "id: number, { name: string }",
        response: "MenuItem"
      },
      "DELETE /api/menu-items/[id]": {
        description: "Supprimer un élément de menu",
        parameters: "id: number",
        response: "{ message: string }"
      },
      "GET /api/search": {
        description: "Rechercher des éléments de menu",
        parameters: "q: string, limit?: number, offset?: number",
        response: "SearchResult"
      }
    },
    types: {
      MenuItem: {
        id: "number",
        name: "string", 
        createdAt: "string (ISO date)"
      },
      SearchResult: {
        query: "string",
        results: "Array<MenuItem>",
        pagination: "PaginationInfo"
      }
    }
  });
}
```

## Bonnes Pratiques pour les Routes API

### 1. Structure Cohérente
```typescript
// Toujours suivre cette structure :
export async function METHOD(request: Request, context?: any) {
  try {
    // 1. Validation des paramètres
    // 2. Validation des données
    // 3. Logique métier
    // 4. Retour de réponse
  } catch (error) {
    // 5. Gestion d'erreurs
  }
}
```

### 2. Codes de Status HTTP
```typescript
// Utilisez les bons codes :
200: // OK - Succès
201: // Created - Création réussie
400: // Bad Request - Données invalides
404: // Not Found - Ressource non trouvée
409: // Conflict - Conflit (ex: doublon)
500: // Internal Server Error - Erreur serveur
```

### 3. Validation Robuste
```typescript
// Toujours valider :
- Type des données (string, number, etc.)
- Longueur des chaînes
- Format des IDs
- Existence des ressources
- Contraintes métier
```

## Tests pour Valider les Routes

### Script de Test Complet
```javascript
// test-api.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  try {
    // Test GET all
    console.log('Testing GET /api/menu-items...');
    const getAll = await axios.get(`${BASE_URL}/api/menu-items`);
    console.log('✅ GET all items:', getAll.data.length);

    // Test POST
    console.log('Testing POST /api/menu-items...');
    const created = await axios.post(`${BASE_URL}/api/menu-items`, {
      name: 'Test Item'
    });
    console.log('✅ Created item:', created.data.id);

    // Test GET by ID
    console.log('Testing GET /api/menu-items/[id]...');
    const getOne = await axios.get(`${BASE_URL}/api/menu-items/${created.data.id}`);
    console.log('✅ Get item by ID:', getOne.data.name);

    // Test PUT
    console.log('Testing PUT /api/menu-items/[id]...');
    const updated = await axios.put(`${BASE_URL}/api/menu-items/${created.data.id}`, {
      name: 'Updated Test Item'
    });
    console.log('✅ Updated item:', updated.data.name);

    // Test Search
    console.log('Testing GET /api/search...');
    const search = await axios.get(`${BASE_URL}/api/search?q=Test`);
    console.log('✅ Search results:', search.data.results.length);

    // Test DELETE
    console.log('Testing DELETE /api/menu-items/[id]...');
    await axios.delete(`${BASE_URL}/api/menu-items/${created.data.id}`);
    console.log('✅ Deleted item successfully');

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAPI();
```

## Conclusion

Les routes API incomplètes sont un problème critique qui :
- Casse la fonctionnalité de l'application
- Rend le développement difficile
- Cause des erreurs en production

La solution est d'implémenter **toutes les méthodes HTTP** avec :
- Validation complète des données
- Gestion d'erreurs robuste
- Codes de status appropriés
- Documentation claire

Cette approche garantit une API fiable et maintenable.
