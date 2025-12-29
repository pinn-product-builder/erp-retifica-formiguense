# 🛠️ Guia Prático de Implementação - Microserviços

## 📋 Índice
- [Pré-requisitos](#pré-requisitos)
- [Fase 1: Setup Inicial](#fase-1-setup-inicial)
- [Fase 2: Primeiro Microserviço](#fase-2-primeiro-microserviço)
- [Fase 3: Segundo Microserviço](#fase-3-segundo-microserviço)
- [Fase 4: Comunicação entre Serviços](#fase-4-comunicação-entre-serviços)
- [Fase 5: Deploy em Produção](#fase-5-deploy-em-produção)
- [Troubleshooting](#troubleshooting)

---

## ✅ Pré-requisitos

### Ferramentas Necessárias

```bash
# Node.js 20+
node --version  # v20.x.x

# Docker
docker --version  # 24.x.x

# Docker Compose
docker-compose --version  # 2.x.x

# AWS CLI
aws --version  # 2.x.x

# Terraform
terraform --version  # 1.6.x

# Git
git --version  # 2.x.x
```

### Contas Necessárias

- [ ] Conta AWS (com billing configurado)
- [ ] Conta GitHub (para repositórios)
- [ ] Conta Cloudflare (plano Pro - $20/mês)
- [ ] Conta Docker Hub (opcional)

### Conhecimentos Recomendados

- ✅ Node.js / TypeScript
- ✅ Docker básico
- ✅ PostgreSQL
- ✅ REST APIs
- ⚠️ AWS básico (pode aprender durante)
- ⚠️ Terraform básico (pode aprender durante)

---

## 🚀 Fase 1: Setup Inicial

### Passo 1.1: Configurar AWS CLI

```bash
# Instalar AWS CLI (macOS)
brew install awscli

# Configurar credenciais
aws configure
# AWS Access Key ID: [sua-key]
# AWS Secret Access Key: [seu-secret]
# Default region name: us-east-1
# Default output format: json

# Testar
aws sts get-caller-identity
```

### Passo 1.2: Criar Estrutura de Diretórios

```bash
# Criar diretório raiz
mkdir erp-retifica-microservices
cd erp-retifica-microservices

# Criar estrutura
mkdir -p services/{auth-service,orders-service,diagnostics-service,budgets-service}
mkdir -p shared/{types,utils,middlewares,events,database}
mkdir -p infrastructure/{terraform,scripts}
mkdir -p frontend

# Inicializar Git
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "dist/" >> .gitignore
echo "*.log" >> .gitignore
```

### Passo 1.3: Criar Docker Compose para Desenvolvimento

```bash
# Criar docker-compose.yml na raiz
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: erp-postgres
    environment:
      POSTGRES_DB: erp_retifica
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: erp-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
EOF

# Iniciar serviços
docker-compose up -d

# Verificar
docker-compose ps
```

### Passo 1.4: Criar Schemas no PostgreSQL

```bash
# Conectar ao PostgreSQL
docker exec -it erp-postgres psql -U postgres -d erp_retifica

# Criar schemas
CREATE SCHEMA auth;
CREATE SCHEMA orders;
CREATE SCHEMA diagnostics;
CREATE SCHEMA budgets;
CREATE SCHEMA inventory;
CREATE SCHEMA purchasing;
CREATE SCHEMA financial;
CREATE SCHEMA fiscal;
CREATE SCHEMA notifications;
CREATE SCHEMA reports;

# Criar usuários por serviço
CREATE USER auth_service WITH PASSWORD 'auth_pass_123';
GRANT ALL ON SCHEMA auth TO auth_service;

CREATE USER orders_service WITH PASSWORD 'orders_pass_123';
GRANT ALL ON SCHEMA orders TO orders_service;
GRANT SELECT ON auth.organizations TO orders_service;
GRANT SELECT ON auth.users TO orders_service;

# Sair
\q
```

---

## 🔐 Fase 2: Primeiro Microserviço (Auth Service)

### Passo 2.1: Criar Projeto Auth Service

```bash
cd services/auth-service

# Inicializar projeto Node.js
npm init -y

# Instalar dependências
npm install express bcryptjs jsonwebtoken pg redis joi helmet cors compression express-rate-limit winston dotenv

# Instalar dev dependencies
npm install -D typescript @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/cors ts-node nodemon @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint

# Criar tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Atualizar package.json scripts
npm pkg set scripts.dev="nodemon --exec ts-node src/index.ts"
npm pkg set scripts.build="tsc"
npm pkg set scripts.start="node dist/index.js"
```

### Passo 2.2: Criar Estrutura de Pastas

```bash
mkdir -p src/{config,controllers,services,repositories,middlewares,models,routes,utils,validators}

# Criar .env
cat > .env << 'EOF'
NODE_ENV=development
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_retifica
DB_USER=auth_service
DB_PASSWORD=auth_pass_123

REDIS_URL=redis://localhost:6379

JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
EOF
```

### Passo 2.3: Criar Configurações

```typescript
// src/config/database.ts
cat > src/config/database.ts << 'EOF'
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'erp_retifica',
  user: process.env.DB_USER || 'auth_service',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: result.rowCount });
  return result;
}
EOF
```

```typescript
// src/config/redis.ts
cat > src/config/redis.ts << 'EOF'
import { createClient } from 'redis';

let redisClient: any;

export async function connectRedis() {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err: any) => console.error('Redis error:', err));
  await redisClient.connect();
  console.log('✅ Redis connected');
}

export function getRedisClient() {
  return redisClient;
}

export async function cacheSet(key: string, value: any, ttl: number = 3600) {
  await redisClient.setEx(key, ttl, JSON.stringify(value));
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await redisClient.get(key);
  return value ? JSON.parse(value) : null;
}
EOF
```

### Passo 2.4: Criar Tabelas do Auth Service

```bash
# Criar script SQL
cat > scripts/auth-schema.sql << 'EOF'
-- Organizations
CREATE TABLE auth.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES auth.organizations(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Profiles
CREATE TABLE auth.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role VARCHAR(50) NOT NULL,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Login History
CREATE TABLE auth.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_org ON auth.users(organization_id);
CREATE INDEX idx_profiles_user ON auth.user_profiles(user_id);
EOF

# Executar script
docker exec -i erp-postgres psql -U postgres -d erp_retifica < scripts/auth-schema.sql
```

### Passo 2.5: Criar Service de Autenticação

```typescript
// src/services/authService.ts
cat > src/services/authService.ts << 'EOF'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { cacheSet } from '../config/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export class AuthService {
  async login(email: string, password: string) {
    const result = await query(
      `SELECT u.id, u.email, u.name, u.password_hash, u.organization_id, 
              up.role, up.permissions
       FROM auth.users u
       JOIN auth.user_profiles up ON u.id = up.user_id
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organization_id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await cacheSet(`user:${user.id}`, {
      id: user.id,
      email: user.email,
      organizationId: user.organization_id,
      role: user.role,
    }, 86400);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organization_id,
        role: user.role,
      },
    };
  }

  async validateToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default new AuthService();
EOF
```

### Passo 2.6: Criar Controller

```typescript
// src/controllers/authController.ts
cat > src/controllers/authController.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
        });
      }

      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  }

  async validateToken(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(400).json({ error: 'Token required' });
      }

      const payload = await authService.validateToken(token);

      res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new AuthController();
EOF
```

### Passo 2.7: Criar Routes

```typescript
// src/routes/authRoutes.ts
cat > src/routes/authRoutes.ts << 'EOF'
import { Router } from 'express';
import authController from '../controllers/authController';

const router = Router();

router.post('/login', authController.login);
router.post('/validate', authController.validateToken);

export default router;
EOF

// src/routes/index.ts
cat > src/routes/index.ts << 'EOF'
import { Router } from 'express';
import authRoutes from './authRoutes';

const router = Router();

router.use('/auth', authRoutes);

export default router;
EOF
```

### Passo 2.8: Criar App Principal

```typescript
// src/app.ts
cat > src/app.ts << 'EOF'
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service' });
});

app.use('/api/v1', routes);

export default app;
EOF

// src/index.ts
cat > src/index.ts << 'EOF'
import 'dotenv/config';
import app from './app';
import { pool } from './config/database';
import { connectRedis } from './config/redis';

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    await connectRedis();

    app.listen(PORT, () => {
      console.log(`🚀 Auth Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

start();
EOF
```

### Passo 2.9: Testar Localmente

```bash
# Iniciar serviço
npm run dev

# Em outro terminal, testar
# 1. Health check
curl http://localhost:3001/health

# 2. Criar usuário de teste (via psql)
docker exec -it erp-postgres psql -U postgres -d erp_retifica << 'EOF'
INSERT INTO auth.organizations (name) VALUES ('Retífica Teste');

INSERT INTO auth.users (organization_id, email, name, password_hash)
VALUES (
  (SELECT id FROM auth.organizations WHERE name = 'Retífica Teste'),
  'admin@teste.com',
  'Admin Teste',
  '$2a$10$XQQQQQQQQQQQQQQQQQQQQOe' -- senha: "password123"
);

INSERT INTO auth.user_profiles (user_id, role, permissions)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@teste.com'),
  'admin',
  '["all"]'
);
EOF

# 3. Testar login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@teste.com","password":"password123"}'

# Deve retornar token JWT
```

### Passo 2.10: Criar Dockerfile

```dockerfile
# Criar Dockerfile
cat > Dockerfile << 'EOF'
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
EOF

# Testar build
docker build -t auth-service:latest .

# Testar container
docker run -d \
  --name auth-service-test \
  --network erp-retifica-microservices_default \
  -p 3001:3001 \
  -e DB_HOST=postgres \
  -e REDIS_URL=redis://redis:6379 \
  auth-service:latest

# Verificar logs
docker logs auth-service-test

# Limpar
docker stop auth-service-test
docker rm auth-service-test
```

---

## 📦 Fase 3: Segundo Microserviço (Orders Service)

### Passo 3.1: Criar Projeto Orders Service

```bash
cd ../orders-service

# Copiar estrutura do auth-service
cp -r ../auth-service/package.json .
cp -r ../auth-service/tsconfig.json .
cp -r ../auth-service/src .

# Atualizar package.json
npm pkg set name="orders-service"
npm pkg set description="Orders Management Service"

# Atualizar .env
cat > .env << 'EOF'
NODE_ENV=development
PORT=3002

DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_retifica
DB_USER=orders_service
DB_PASSWORD=orders_pass_123

REDIS_URL=redis://localhost:6379
AUTH_SERVICE_URL=http://localhost:3001
EOF

# Instalar dependências
npm install
```

### Passo 3.2: Criar Schema Orders

```sql
-- scripts/orders-schema.sql
CREATE TABLE orders.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES orders.customers(id),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  reception_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders.engines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders.orders(id),
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_org ON orders.orders(organization_id);
CREATE INDEX idx_orders_customer ON orders.orders(customer_id);
```

### Passo 3.3: Criar Middleware de Autenticação

```typescript
// src/middlewares/authMiddleware.ts
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

export async function authMiddleware(req: any, res: any, next: any) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/v1/auth/validate`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    req.user = response.data.data;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Passo 3.4: Criar Orders Service

```typescript
// src/services/ordersService.ts
import { query } from '../config/database';

export class OrdersService {
  async createOrder(data: any) {
    const { organizationId, customerId, engineData } = data;

    const orderNumber = await this.generateOrderNumber(organizationId);

    const result = await query(
      `INSERT INTO orders.orders (organization_id, customer_id, order_number, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [organizationId, customerId, orderNumber]
    );

    const order = result.rows[0];

    await query(
      `INSERT INTO orders.engines (order_id, brand, model, serial_number)
       VALUES ($1, $2, $3, $4)`,
      [order.id, engineData.brand, engineData.model, engineData.serialNumber]
    );

    return order;
  }

  async listOrders(organizationId: string) {
    const result = await query(
      `SELECT o.*, c.name as customer_name
       FROM orders.orders o
       JOIN orders.customers c ON o.customer_id = c.id
       WHERE o.organization_id = $1
       ORDER BY o.created_at DESC
       LIMIT 100`,
      [organizationId]
    );

    return result.rows;
  }

  private async generateOrderNumber(organizationId: string): Promise<string> {
    const result = await query(
      `SELECT COUNT(*) as count FROM orders.orders WHERE organization_id = $1`,
      [organizationId]
    );

    const count = parseInt(result.rows[0].count) + 1;
    return `OS-${new Date().getFullYear()}-${String(count).padStart(6, '0')}`;
  }
}

export default new OrdersService();
```

---

## 🔗 Fase 4: Comunicação entre Serviços

### Passo 4.1: Criar Biblioteca Compartilhada

```bash
cd ../../shared

# Criar package.json
cat > package.json << 'EOF'
{
  "name": "@erp/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  }
}
EOF

# Criar types
mkdir -p types
cat > types/index.ts << 'EOF'
export interface User {
  id: string;
  email: string;
  organizationId: string;
  role: string;
}

export interface Order {
  id: string;
  organizationId: string;
  customerId: string;
  orderNumber: string;
  status: string;
}
EOF
```

### Passo 4.2: Implementar Event Bus (SQS)

```typescript
// shared/events/eventBus.ts
import AWS from 'aws-sdk';

const sqs = new AWS.SQS({ region: 'us-east-1' });

export async function publishEvent(eventType: string, data: any) {
  const params = {
    QueueUrl: process.env.SQS_QUEUE_URL!,
    MessageBody: JSON.stringify({
      eventType,
      timestamp: new Date().toISOString(),
      data,
    }),
  };

  await sqs.sendMessage(params).promise();
  console.log('Event published:', eventType);
}

export async function consumeEvents(handler: (event: any) => Promise<void>) {
  while (true) {
    const params = {
      QueueUrl: process.env.SQS_QUEUE_URL!,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    };

    const response = await sqs.receiveMessage(params).promise();

    if (response.Messages) {
      for (const message of response.Messages) {
        try {
          const event = JSON.parse(message.Body!);
          await handler(event);

          await sqs.deleteMessage({
            QueueUrl: process.env.SQS_QUEUE_URL!,
            ReceiptHandle: message.ReceiptHandle!,
          }).promise();
        } catch (error) {
          console.error('Error processing event:', error);
        }
      }
    }
  }
}
```

---

## 🚀 Fase 5: Deploy em Produção

### Passo 5.1: Criar ECR Repositories

```bash
# Criar repositórios no ECR
aws ecr create-repository --repository-name auth-service
aws ecr create-repository --repository-name orders-service

# Login no ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.us-east-1.amazonaws.com
```

### Passo 5.2: Build e Push de Imagens

```bash
# Auth Service
cd services/auth-service
docker build -t auth-service:latest .
docker tag auth-service:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/auth-service:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/auth-service:latest

# Orders Service
cd ../orders-service
docker build -t orders-service:latest .
docker tag orders-service:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/orders-service:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/orders-service:latest
```

### Passo 5.3: Criar ECS Cluster com Terraform

```hcl
# infrastructure/terraform/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_ecs_cluster" "main" {
  name = "erp-cluster"
}

resource "aws_ecs_task_definition" "auth_service" {
  family                   = "auth-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"

  container_definitions = jsonencode([
    {
      name  = "auth-service"
      image = "123456789.dkr.ecr.us-east-1.amazonaws.com/auth-service:latest"
      portMappings = [
        {
          containerPort = 3001
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3001" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/auth-service"
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "auth_service" {
  name            = "auth-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.auth_service.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }
}
```

### Passo 5.4: Deploy com Terraform

```bash
cd infrastructure/terraform

# Inicializar
terraform init

# Planejar
terraform plan

# Aplicar
terraform apply -auto-approve

# Verificar
aws ecs list-services --cluster erp-cluster
```

---

## 🔧 Troubleshooting

### Problema: Serviço não conecta ao banco

```bash
# Verificar conectividade
docker exec -it auth-service-container sh
nc -zv postgres 5432

# Verificar logs
docker logs auth-service-container

# Verificar variáveis de ambiente
docker exec auth-service-container env | grep DB_
```

### Problema: Redis connection failed

```bash
# Testar Redis
docker exec -it erp-redis redis-cli ping

# Verificar URL
echo $REDIS_URL
```

### Problema: JWT inválido

```bash
# Verificar secret
echo $JWT_SECRET

# Decodificar token
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | base64 -d
```

---

## ✅ Checklist de Implementação

- [ ] Pré-requisitos instalados
- [ ] Docker Compose rodando (Postgres + Redis)
- [ ] Auth Service funcionando localmente
- [ ] Orders Service funcionando localmente
- [ ] Comunicação entre serviços testada
- [ ] Dockerfiles criados
- [ ] Imagens no ECR
- [ ] ECS Cluster criado
- [ ] Serviços deployados
- [ ] Health checks passando
- [ ] Logs no CloudWatch
- [ ] Métricas no CloudWatch

---

**Documento criado em:** 24/12/2025  
**Versão:** 1.0  
**Autor:** DevOps Team

