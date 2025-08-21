# Quiz - Intégration Swagger/OpenAPI

## Section A - Installation et Configuration (20 points)

### Question 1 (5 points)
Quelles sont les 4 dépendances npm nécessaires pour intégrer Swagger dans un projet Next.js ?

```
Package de production 1: swagger-jsdoc
Package de production 2: swagger-ui-react
Package de développement 1: @types/swagger-jsdoc
Package de développement 2: @types/swagger-ui-react
```

### Question 2 (5 points)
Dans quel fichier doit-on définir la configuration centrale de Swagger ?

a) `app/api/swagger.ts`
b) `lib/swagger.ts` ✅
c) `components/swagger.ts`
d) `config/swagger.ts`

### Question 3 (5 points)
Complétez la structure de base de la configuration OpenAPI :

```typescript
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nom de votre API',
      version: '1.0.0'
    },
    servers: [ /* ... */ ]
  },
  apis: ['./app/api/**/*.ts']
}
```

### Question 4 (5 points)
Pourquoi utilise-t-on `process.env.NODE_ENV` dans la configuration des serveurs ?

Pour configurer l'url du server dynamiquement 
## Section B - Fichiers et Structure (25 points)

### Question 5 (10 points)
Listez les 3 fichiers principaux qui doivent être créés pour l'intégration Swagger et expliquez le rôle de chacun :

1. Fichier : lib/swagger.ts
   Rôle : ________________

2. Fichier : app/api/swagger/route.ts
   Rôle : ________________

3. Fichier : app/api-docs/page.tsx
   Rôle : ________________

### Question 6 (5 points)
Dans le fichier `app/api-docs/page.tsx`, pourquoi doit-on utiliser `'use client'` ?

a) Pour améliorer les performances
b) Pour éviter les erreurs SSR avec Swagger UI
c) Pour permettre l'import dynamique
d) Pour gérer les états React

### Question 7 (5 points)
Quelle ligne d'import est OBLIGATOIRE dans `app/api-docs/page.tsx` ?

```typescript
import ________________________
```

### Question 8 (5 points)
Complétez l'import dynamique de SwaggerUI :

```typescript
const SwaggerUI = dynamic(() => import('_________'), { ___: ____ })
```

## Section C - Documentation JSDoc (30 points)

### Question 9 (10 points)
Rédigez la structure de base des commentaires JSDoc pour documenter un endpoint GET :

```typescript
/**
 * ______
 * ________________:
 *   ____:
 *     _______: Description de l'endpoint
 *     ____:
 *       - Nom du tag
 *     _________:
 *       ___:
 *         description: Réponse de succès
 */
```

### Question 10 (10 points)
Quels sont les 4 schémas définis dans la configuration centrale et à quoi servent-ils ?

1. _____________ : _______________
2. _____________ : _______________
3. _____________ : _______________
4. _____________ : _______________

### Question 11 (5 points)
Comment référence-t-on un schéma réutilisable dans la documentation JSDoc ?

```yaml
schema:
  _____: '___________________'
```

### Question 12 (5 points)
Vrai ou Faux ? Justifiez votre réponse.

"On peut utiliser des tabulations pour l'indentation dans les commentaires JSDoc Swagger."

Réponse : _______ 
Justification : _______________

## Section D - Interface et Utilisation (15 points)

### Question 13 (5 points)
À quelle URL accède-t-on à la documentation Swagger dans l'application ?

Réponse : _______________

### Question 14 (5 points)
Citez 3 fonctionnalités interactives disponibles dans l'interface Swagger UI :

1. _______________
2. _______________
3. _______________

### Question 15 (5 points)
Dans l'interface Swagger, que permet de faire le bouton "Try it out" ?

## Section E - Dépannage (10 points)

### Question 16 (5 points)
Symptôme : L'interface Swagger s'affiche mais tout est mal formaté, sans couleurs ni styles.

Diagnostic : _______________
Solution : _______________

### Question 17 (5 points)
Que signifie l'erreur "Failed to load API definition" dans l'interface Swagger ?

a) Les packages Swagger ne sont pas installés
b) L'endpoint `/api/swagger` ne fonctionne pas
c) Les commentaires JSDoc sont mal formatés
d) Le CSS n'est pas importé

## Section F - Pratique (Bonus - 10 points)

### Question 18 (10 points)
Rédigez les commentaires JSDoc complets pour documenter cet endpoint POST :

```typescript
// Votre documentation JSDoc ici

export async function POST(request: NextRequest) {
  const { name, price } = await request.json()
  
  const product = await prisma.product.create({
    data: { name, price }
  })
  
  return NextResponse.json({
    success: true,
    data: product,
    message: 'Produit créé avec succès'
  })
}
```

## Barème de notation

- Section A : 20 points
- Section B : 25 points  
- Section C : 30 points
- Section D : 15 points
- Section E : 10 points
- **Total : 100 points**
- Section F : 10 points bonus

## Corrigé disponible

Le corrigé détaillé est disponible dans le document `21-CORRIGE_QUIZ_SWAGGER.md`