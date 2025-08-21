# Cours 06 : Erreur de Conflits de Ports

## Le Problème : Port 3000 Occupé

### Messages d'Erreur Typiques
```bash
⚠ Port 3000 is in use by process 24836, using available port 3001 instead.
```

```bash
Error: listen EADDRINUSE: address already in use :::3000
```

```bash
EADDRINUSE: Address already in use
```

## Pourquoi C'est Problématique ?

### 1. Incohérence de Configuration
- L'application démarre sur un port inattendu
- Les URLs codées en dur ne fonctionnent plus
- Configuration de développement perturbée

### 2. Problèmes de Développement
- Tests automatisés qui échouent
- Intégrations avec d'autres services cassées
- Documentation obsolète

### 3. Confusion d'Équipe
- Développeurs qui ne savent pas sur quel port se connecter
- Difficultés de debugging
- Perte de temps

## Solutions Détaillées

### Solution 1 : Identifier et Tuer le Processus

#### Sur Windows
```powershell
# Trouver le processus utilisant le port 3000
netstat -ano | findstr :3000

# Résultat exemple :
# TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       24836

# Tuer le processus par PID
taskkill /PID 24836 /F

# Ou tuer tous les processus Node.js
taskkill /IM node.exe /F
```

#### Sur macOS/Linux
```bash
# Trouver le processus utilisant le port 3000
lsof -ti:3000

# Ou plus détaillé
lsof -i:3000

# Tuer le processus
kill -9 $(lsof -ti:3000)

# Ou tuer tous les processus Node.js
killall node
```

#### Script Automatisé
```bash
#!/bin/bash
# kill-port.sh

PORT=${1:-3000}

echo "Recherche du processus utilisant le port $PORT..."

if command -v lsof > /dev/null; then
    # macOS/Linux
    PID=$(lsof -ti:$PORT)
    if [ ! -z "$PID" ]; then
        echo "Processus trouvé (PID: $PID), arrêt en cours..."
        kill -9 $PID
        echo "✅ Processus arrêté"
    else
        echo "Aucun processus trouvé sur le port $PORT"
    fi
elif command -v netstat > /dev/null; then
    # Windows
    PID=$(netstat -ano | findstr :$PORT | awk '{print $5}' | head -1)
    if [ ! -z "$PID" ]; then
        echo "Processus trouvé (PID: $PID), arrêt en cours..."
        taskkill /PID $PID /F
        echo "✅ Processus arrêté"
    else
        echo "Aucun processus trouvé sur le port $PORT"
    fi
else
    echo "Impossible de déterminer l'outil de diagnostic réseau"
fi
```

### Solution 2 : Configuration de Port Dynamique

#### Variables d'Environnement
```env
# .env.local
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### Script de Démarrage Intelligent
```json
{
  "scripts": {
    "dev": "node scripts/start-dev.js",
    "dev:force": "node scripts/kill-port.js 3000 && next dev",
    "dev:auto": "next dev --port 0"
  }
}
```

```javascript
// scripts/start-dev.js
const { spawn } = require('child_process');
const net = require('net');

async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(false));
      server.close();
    });
    
    server.on('error', () => resolve(true));
  });
}

async function findAvailablePort(startPort = 3000) {
  let port = startPort;
  
  while (await isPortInUse(port)) {
    port++;
    if (port > 3010) {
      throw new Error('Aucun port disponible trouvé');
    }
  }
  
  return port;
}

async function startDev() {
  try {
    const port = await findAvailablePort(3000);
    
    if (port !== 3000) {
      console.log(`⚠️  Port 3000 occupé, utilisation du port ${port}`);
    }
    
    process.env.PORT = port;
    
    const child = spawn('next', ['dev', '--port', port], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('error', (error) => {
      console.error('Erreur lors du démarrage:', error);
    });
    
  } catch (error) {
    console.error('Impossible de démarrer le serveur:', error.message);
    process.exit(1);
  }
}

startDev();
```

### Solution 3 : Configuration Docker

#### Dockerfile avec Port Configurable
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Port configurable via variable d'environnement
EXPOSE ${PORT:-3000}

CMD ["npm", "start"]
```

#### Docker Compose avec Gestion de Ports
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - PORT=${PORT:-3000}
      - NODE_ENV=production
    restart: unless-stopped
  
  app-dev:
    build:
      context: .
      target: development
    ports:
      - "3000-3010:3000"  # Plage de ports
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
```

### Solution 4 : Gestion Multi-Environnements

#### Configuration par Environnement
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration du serveur
  server: {
    port: process.env.PORT || 3000,
    hostname: process.env.HOSTNAME || 'localhost',
  },
  
  // Variables publiques
  env: {
    CUSTOM_PORT: process.env.PORT || '3000',
  },
  
  // Redirection automatique
  async redirects() {
    return [
      {
        source: '/api/:path*',
        has: [
          {
            type: 'host',
            value: 'localhost:3001',
          },
        ],
        destination: 'http://localhost:3000/api/:path*',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
```

#### Utilitaire de Configuration
```typescript
// lib/config.ts
export const config = {
  port: parseInt(process.env.PORT || '3000'),
  hostname: process.env.HOSTNAME || 'localhost',
  
  get baseUrl() {
    return `http://${this.hostname}:${this.port}`;
  },
  
  get apiUrl() {
    return `${this.baseUrl}/api`;
  },
  
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Fonction pour vérifier la disponibilité du port
export async function checkPort(port: number): Promise<boolean> {
  const net = await import('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    
    server.on('error', () => resolve(false));
  });
}

// Fonction pour trouver un port disponible
export async function findAvailablePort(preferredPort: number = 3000): Promise<number> {
  let port = preferredPort;
  
  while (!(await checkPort(port))) {
    port++;
    if (port > preferredPort + 10) {
      throw new Error(`Aucun port disponible après ${preferredPort}`);
    }
  }
  
  return port;
}
```

## Scripts Utilitaires

### Script de Nettoyage des Ports
```javascript
// scripts/cleanup-ports.js
const { exec } = require('child_process');
const os = require('os');

function cleanupPorts() {
  const platform = os.platform();
  let command;
  
  switch (platform) {
    case 'win32':
      command = 'taskkill /IM node.exe /F';
      break;
    case 'darwin':
    case 'linux':
      command = 'killall node';
      break;
    default:
      console.error('Plateforme non supportée');
      return;
  }
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log('Aucun processus Node.js à arrêter');
    } else {
      console.log('✅ Tous les processus Node.js ont été arrêtés');
    }
  });
}

cleanupPorts();
```

### Script de Vérification de Santé
```javascript
// scripts/health-check.js
const http = require('http');

function healthCheck(port = 3000, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${port}/api/health`, {
      timeout
    }, (res) => {
      if (res.statusCode === 200) {
        resolve(`✅ Serveur accessible sur le port ${port}`);
      } else {
        reject(`❌ Serveur répond avec le code ${res.statusCode}`);
      }
    });
    
    req.on('error', (error) => {
      reject(`❌ Impossible de se connecter au port ${port}: ${error.message}`);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(`❌ Timeout lors de la connexion au port ${port}`);
    });
  });
}

// Vérification sur plusieurs ports
async function checkMultiplePorts() {
  const ports = [3000, 3001, 3002];
  
  for (const port of ports) {
    try {
      const result = await healthCheck(port);
      console.log(result);
      break;
    } catch (error) {
      console.log(error);
    }
  }
}

checkMultiplePorts();
```

## Monitoring des Ports

### Dashboard de Ports
```typescript
// lib/port-monitor.ts
export interface PortStatus {
  port: number;
  status: 'available' | 'occupied' | 'error';
  process?: string;
  pid?: number;
}

export class PortMonitor {
  static async getPortStatus(port: number): Promise<PortStatus> {
    try {
      const net = await import('net');
      
      return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(port, () => {
          server.close(() => {
            resolve({
              port,
              status: 'available'
            });
          });
        });
        
        server.on('error', async () => {
          const processInfo = await this.getProcessInfo(port);
          resolve({
            port,
            status: 'occupied',
            ...processInfo
          });
        });
      });
    } catch (error) {
      return {
        port,
        status: 'error'
      };
    }
  }
  
  private static async getProcessInfo(port: number) {
    const { exec } = await import('child_process');
    const os = await import('os');
    
    return new Promise((resolve) => {
      const platform = os.platform();
      let command;
      
      switch (platform) {
        case 'win32':
          command = `netstat -ano | findstr :${port}`;
          break;
        case 'darwin':
        case 'linux':
          command = `lsof -i:${port}`;
          break;
        default:
          resolve({});
          return;
      }
      
      exec(command, (error, stdout) => {
        if (error) {
          resolve({});
          return;
        }
        
        // Parser la sortie pour extraire PID et nom du processus
        // Implémentation simplifiée
        resolve({
          process: 'node',
          pid: 'unknown'
        });
      });
    });
  }
  
  static async checkPortRange(start: number, end: number): Promise<PortStatus[]> {
    const promises = [];
    
    for (let port = start; port <= end; port++) {
      promises.push(this.getPortStatus(port));
    }
    
    return Promise.all(promises);
  }
}
```

## Bonnes Pratiques

### 1. Configuration Flexible
```javascript
// Toujours permettre la configuration du port
const port = process.env.PORT || 3000;

// Gérer gracieusement les ports occupés
if (portInUse) {
  console.warn(`Port ${port} occupé, recherche d'un port disponible...`);
}
```

### 2. Documentation Claire
```markdown
# README.md
## Démarrage du Projet

Le serveur démarre par défaut sur le port 3000.

### Si le port est occupé :
```bash
# Option 1 : Libérer le port
npm run kill-port

# Option 2 : Utiliser un autre port
PORT=3001 npm run dev

# Option 3 : Port automatique
npm run dev:auto
```
```

### 3. Scripts de Développement
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:clean": "npm run kill-port && npm run dev",
    "dev:auto": "next dev --port 0",
    "kill-port": "node scripts/kill-port.js 3000",
    "health": "node scripts/health-check.js"
  }
}
```

## Conclusion

La gestion des conflits de ports est **cruciale** pour :
- Un développement fluide et prévisible
- L'automatisation des tests et déploiements
- La collaboration en équipe
- La documentation et maintenance

Une stratégie proactive évite les interruptions et améliore l'expérience développeur.
