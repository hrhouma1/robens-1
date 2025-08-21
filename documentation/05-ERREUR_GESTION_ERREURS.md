# Cours 05 : Erreur de Gestion d'Erreurs Manquante

## Le Problème : Absence de Try-Catch et Validation

### Code Problématique Typique
```typescript
// ❌ DANGEREUX : Aucune gestion d'erreurs
export async function GET() {
  const menuItems = await prisma.menuItem.findMany(); // Peut lever une exception
  return NextResponse.json(menuItems);
}

export async function POST(request: Request) {
  const body = await request.json(); // Peut échouer si JSON invalide
  const menuItem = await prisma.menuItem.create({
    data: { name: body.name } // body.name peut être undefined
  });
  return NextResponse.json(menuItem);
}
```

## Pourquoi C'est Critique ?

### 1. Crash de l'Application
- Une seule requête malformée peut faire planter le serveur
- Erreurs non capturées remontent jusqu'au runtime Next.js
- Expérience utilisateur catastrophique

### 2. Sécurité Compromise
- Exposition d'informations sensibles dans les stack traces
- Attaques par injection possibles
- Logs d'erreurs non contrôlés

### 3. Debugging Impossible
- Erreurs silencieuses difficiles à tracer
- Pas de logs structurés
- Impossible de monitorer la santé de l'API

## Solutions Complètes

### Solution 1 : Gestion d'Erreurs Basique

```typescript
// ✅ Gestion d'erreurs de base
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany();
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation basique
    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" }, 
        { status: 400 }
      );
    }

    const menuItem = await prisma.menuItem.create({
      data: { name: body.name }
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

### Solution 2 : Gestion d'Erreurs Avancée

```typescript
// ✅ Gestion d'erreurs robuste avec types d'erreurs
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// Types d'erreurs personnalisés
class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Fonction utilitaire pour gérer les erreurs Prisma
function handlePrismaError(error: any) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return {
          message: 'A record with this value already exists',
          status: 409
        };
      case 'P2025':
        return {
          message: 'Record not found',
          status: 404
        };
      case 'P2003':
        return {
          message: 'Foreign key constraint violation',
          status: 400
        };
      default:
        return {
          message: 'Database operation failed',
          status: 500
        };
    }
  }
  
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return {
      message: 'Unknown database error occurred',
      status: 500
    };
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      message: 'Invalid data provided',
      status: 400
    };
  }
  
  return {
    message: 'Internal server error',
    status: 500
  };
}

// Fonction de validation
function validateMenuItemData(data: any) {
  const errors: string[] = [];
  
  if (!data.name) {
    errors.push('Name is required');
  } else if (typeof data.name !== 'string') {
    errors.push('Name must be a string');
  } else if (data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (data.name.length > 100) {
    errors.push('Name must not exceed 100 characters');
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }
  
  return {
    name: data.name.trim()
  };
}

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: menuItems,
      count: menuItems.length
    });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    
    const { message, status } = handlePrismaError(error);
    
    return NextResponse.json(
      { 
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      }, 
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Validation du content-type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Content-Type must be application/json' 
        }, 
        { status: 400 }
      );
    }

    // Parse JSON avec gestion d'erreur
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON format' 
        }, 
        { status: 400 }
      );
    }

    // Validation des données
    const validatedData = validateMenuItemData(body);

    // Création en base
    const menuItem = await prisma.menuItem.create({
      data: validatedData
    });
    
    return NextResponse.json({
      success: true,
      data: menuItem,
      message: 'Menu item created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating menu item:", error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message,
          type: 'validation_error'
        }, 
        { status: 400 }
      );
    }
    
    const { message, status } = handlePrismaError(error);
    
    return NextResponse.json(
      { 
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      }, 
      { status }
    );
  }
}
```

### Solution 3 : Middleware de Gestion d'Erreurs

```typescript
// lib/error-handler.ts
import { NextResponse } from "next/server";

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function createErrorResponse(error: any): NextResponse {
  // Log de l'erreur pour debugging
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...(error.details && { details: error.details })
  });

  // Erreur personnalisée
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      },
      { status: error.status }
    );
  }

  // Erreur de validation
  if (error.name === 'ValidationError') {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        type: 'validation_error',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }

  // Erreurs Prisma
  if (error.name?.startsWith('Prisma')) {
    const { message, status } = handlePrismaError(error);
    return NextResponse.json(
      {
        success: false,
        error: message,
        type: 'database_error',
        timestamp: new Date().toISOString()
      },
      { status }
    );
  }

  // Erreur générique
  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    },
    { status: 500 }
  );
}

// Wrapper pour les routes API
export function withErrorHandling(handler: Function) {
  return async (request: Request, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}
```

### Utilisation du Middleware

```typescript
// app/api/menu-items/route.ts
import { withErrorHandling, AppError } from "../../../lib/error-handler";
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

async function getHandler() {
  const menuItems = await prisma.menuItem.findMany();
  
  return NextResponse.json({
    success: true,
    data: menuItems
  });
}

async function postHandler(request: Request) {
  const body = await request.json();
  
  if (!body.name) {
    throw new AppError('Name is required', 400, 'MISSING_NAME');
  }
  
  const menuItem = await prisma.menuItem.create({
    data: { name: body.name.trim() }
  });
  
  return NextResponse.json({
    success: true,
    data: menuItem
  }, { status: 201 });
}

// Export des handlers avec gestion d'erreurs automatique
export const GET = withErrorHandling(getHandler);
export const POST = withErrorHandling(postHandler);
```

## Validation Avancée avec Zod

```typescript
// lib/validations.ts
import { z } from 'zod';

export const MenuItemSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
});

export const MenuItemUpdateSchema = MenuItemSchema.partial();

export const SearchSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0)
});
```

```typescript
// Utilisation dans les routes
import { MenuItemSchema } from "../../../lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation avec Zod
    const validatedData = MenuItemSchema.parse(body);
    
    const menuItem = await prisma.menuItem.create({
      data: validatedData
    });
    
    return NextResponse.json({
      success: true,
      data: menuItem
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return createErrorResponse(error);
  }
}
```

## Logging Structuré

```typescript
// lib/logger.ts
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
  error?: any;
}

export class Logger {
  static log(level: LogLevel, message: string, context?: any, error?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
      ...(error && { error: this.serializeError(error) })
    };

    // En développement : log coloré
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        [LogLevel.ERROR]: '\x1b[31m',
        [LogLevel.WARN]: '\x1b[33m',
        [LogLevel.INFO]: '\x1b[36m',
        [LogLevel.DEBUG]: '\x1b[37m'
      };
      
      console.log(
        `${colors[level]}[${level.toUpperCase()}]\x1b[0m ${message}`,
        context ? JSON.stringify(context, null, 2) : ''
      );
    } else {
      // En production : JSON structuré
      console.log(JSON.stringify(entry));
    }
  }

  static error(message: string, error?: any, context?: any) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  static warn(message: string, context?: any) {
    this.log(LogLevel.WARN, message, context);
  }

  static info(message: string, context?: any) {
    this.log(LogLevel.INFO, message, context);
  }

  static debug(message: string, context?: any) {
    this.log(LogLevel.DEBUG, message, context);
  }

  private static serializeError(error: any) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.code && { code: error.code }),
      ...(error.status && { status: error.status })
    };
  }
}
```

## Monitoring et Alertes

```typescript
// lib/monitoring.ts
export class ApiMonitor {
  static async recordMetric(endpoint: string, method: string, status: number, duration: number) {
    const metric = {
      endpoint,
      method,
      status,
      duration,
      timestamp: new Date().toISOString()
    };

    // Log de la métrique
    Logger.info('API Request', metric);

    // Alertes pour erreurs critiques
    if (status >= 500) {
      await this.sendAlert(`Critical error on ${method} ${endpoint}`, metric);
    }

    // Alertes pour performance dégradée
    if (duration > 5000) {
      await this.sendAlert(`Slow response on ${method} ${endpoint}`, metric);
    }
  }

  private static async sendAlert(message: string, context: any) {
    // Implémentation d'alertes (email, Slack, etc.)
    Logger.error('ALERT: ' + message, context);
  }
}

// Middleware de monitoring
export function withMonitoring(handler: Function) {
  return async (request: Request, context?: any) => {
    const startTime = Date.now();
    const method = request.method;
    const url = new URL(request.url);
    const endpoint = url.pathname;

    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;
      
      await ApiMonitor.recordMetric(endpoint, method, response.status, duration);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      await ApiMonitor.recordMetric(endpoint, method, 500, duration);
      throw error;
    }
  };
}
```

## Conclusion

La gestion d'erreurs robuste est **essentielle** pour :
- Prévenir les crashes d'application
- Fournir des messages d'erreur utiles
- Faciliter le debugging et le monitoring
- Assurer la sécurité de l'API
- Améliorer l'expérience utilisateur

Sans gestion d'erreurs appropriée, une API est **imprévisible** et **non fiable** en production.
