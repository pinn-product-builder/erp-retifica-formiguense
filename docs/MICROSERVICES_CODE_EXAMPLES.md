# 💻 Exemplos de Código - Microserviços

## 📋 Índice
- [Estrutura de Projeto](#estrutura-de-projeto)
- [Auth Service](#auth-service)
- [Orders Service](#orders-service)
- [API Gateway](#api-gateway)
- [Biblioteca Compartilhada](#biblioteca-compartilhada)
- [Docker & Docker Compose](#docker--docker-compose)
- [Testes](#testes)

---

## 📁 Estrutura de Projeto

```
erp-retifica-microservices/
├── .github/
│   └── workflows/
│       ├── deploy-auth-service.yml
│       ├── deploy-orders-service.yml
│       └── deploy-all.yml
├── services/
│   ├── auth-service/
│   ├── orders-service/
│   ├── diagnostics-service/
│   ├── budgets-service/
│   ├── inventory-service/
│   ├── purchasing-service/
│   ├── financial-service/
│   ├── fiscal-service/
│   ├── notifications-service/
│   └── reports-service/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── shared/
│   ├── types/
│   ├── utils/
│   ├── middlewares/
│   ├── events/
│   └── database/
├── infrastructure/
│   ├── terraform/
│   ├── cloudformation/
│   └── scripts/
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

---

## 🔐 Auth Service

### Estrutura Completa

```
auth-service/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── jwt.ts
│   │   └── index.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── organizationController.ts
│   │   └── userController.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── tokenService.ts
│   │   └── permissionService.ts
│   ├── repositories/
│   │   ├── userRepository.ts
│   │   ├── organizationRepository.ts
│   │   └── sessionRepository.ts
│   ├── middlewares/
│   │   ├── authMiddleware.ts
│   │   ├── rateLimitMiddleware.ts
│   │   └── errorHandler.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Organization.ts
│   │   └── Session.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── organizationRoutes.ts
│   │   └── index.ts
│   ├── validators/
│   │   ├── authValidators.ts
│   │   └── organizationValidators.ts
│   └── utils/
│       ├── logger.ts
│       ├── crypto.ts
│       └── validator.ts
└── tests/
    ├── unit/
    │   ├── services/
    │   └── utils/
    └── integration/
        └── api/
```

### package.json

```json
{
  "name": "auth-service",
  "version": "1.0.0",
  "description": "Authentication and Authorization Service",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  },
  "dependencies": {
    "express": "^4.18.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3",
    "redis": "^4.6.10",
    "joi": "^17.11.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5",
    "winston": "^3.11.0",
    "winston-cloudwatch": "^6.2.0",
    "aws-xray-sdk": "^3.5.3",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^6.0.2",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0"
  }
}
```

### src/index.ts

```typescript
import app from './app';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('✅ Database connected');

    // Connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Auth Service running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

startServer();
```

### src/app.ts

```typescript
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';
import { rateLimitMiddleware } from './middlewares/rateLimitMiddleware';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimitMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
```

### src/config/database.ts

```typescript
import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'erp_retifica',
  user: process.env.DB_USER || 'auth_service',
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_SIZE || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : undefined,
};

export const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
  logger.debug('Database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', err);
});

export async function connectDatabase(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection successful');
  } catch (error) {
    logger.error('Failed to connect to database', error);
    throw error;
  }
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Query error', { text, error });
    throw error;
  }
}
```

### src/config/redis.ts

```typescript
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max retries reached');
            return new Error('Max retries reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting');
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis', error);
    throw error;
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

// Cache helpers
export async function cacheSet(
  key: string,
  value: any,
  ttl: number = 3600
): Promise<void> {
  try {
    const client = getRedisClient();
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error('Cache set error', { key, error });
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Cache get error', { key, error });
    return null;
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    logger.error('Cache delete error', { key, error });
  }
}
```

### src/config/jwt.ts

```typescript
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
  permissions: string[];
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'auth-service',
    audience: 'erp-retifica',
  });
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(
    { userId: payload.userId, organizationId: payload.organizationId },
    JWT_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'auth-service',
      audience: 'erp-retifica',
    }
  );
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'auth-service',
      audience: 'erp-retifica',
    }) as JWTPayload;
  } catch (error) {
    logger.error('JWT verification failed', error);
    throw new Error('Invalid token');
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    logger.error('JWT decode failed', error);
    return null;
  }
}
```

### src/services/authService.ts

```typescript
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { generateAccessToken, generateRefreshToken, JWTPayload } from '../config/jwt';
import { cacheSet, cacheDel } from '../config/redis';
import { logger } from '../utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    organizationId: string;
    role: string;
  };
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { email, password } = credentials;

    // Find user
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      organizationId: user.organization_id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store session in Redis
    const sessionId = uuidv4();
    await cacheSet(
      `session:${sessionId}`,
      {
        userId: user.id,
        organizationId: user.organization_id,
        refreshToken,
      },
      7 * 24 * 60 * 60 // 7 days
    );

    // Log login
    await query(
      `INSERT INTO auth.login_history (user_id, ip_address, user_agent, success)
       VALUES ($1, $2, $3, true)`,
      [user.id, null, null] // IP and user agent should come from request
    );

    logger.info('User logged in', { userId: user.id, email: user.email });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organization_id,
        role: user.role,
      },
    };
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    // Remove session from Redis
    await cacheDel(`session:${sessionId}`);

    logger.info('User logged out', { userId });
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = verifyToken(refreshToken);

      // Verify session exists
      const sessions = await cacheGet<any>(`session:*`);
      // Implementation details...

      const payload: JWTPayload = {
        userId: decoded.userId,
        organizationId: decoded.organizationId,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions,
      };

      const accessToken = generateAccessToken(payload);

      return { accessToken };
    } catch (error) {
      logger.error('Refresh token failed', error);
      throw new Error('Invalid refresh token');
    }
  }

  async validateToken(token: string): Promise<JWTPayload> {
    try {
      return verifyToken(token);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default new AuthService();
```

### src/controllers/authController.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { logger } from '../utils/logger';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Email and password are required',
        });
      }

      const result = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Login error', error);
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const sessionId = req.headers['x-session-id'] as string;

      if (!userId || !sessionId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'User ID and session ID are required',
        });
      }

      await authService.logout(userId, sessionId);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error('Logout error', error);
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Refresh token is required',
        });
      }

      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Refresh token error', error);
      next(error);
    }
  }

  async validateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Token is required',
        });
      }

      const payload = await authService.validateToken(token);

      res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      logger.error('Validate token error', error);
      next(error);
    }
  }
}

export default new AuthController();
```

### src/routes/index.ts

```typescript
import { Router } from 'express';
import authRoutes from './authRoutes';
import organizationRoutes from './organizationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);

export default router;
```

### src/routes/authRoutes.ts

```typescript
import { Router } from 'express';
import authController from '../controllers/authController';
import { validateLogin } from '../validators/authValidators';

const router = Router();

router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/validate', authController.validateToken);

export default router;
```

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy dependencies and build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
```

---

## 📦 Orders Service (Exemplo Simplificado)

### src/services/ordersService.ts

```typescript
import { query } from '../config/database';
import { publishEvent } from '../events/eventBus';
import { logger } from '../utils/logger';

export interface CreateOrderDTO {
  organizationId: string;
  customerId: string;
  engineData: {
    brand: string;
    model: string;
    serialNumber: string;
  };
  receptionData: any;
}

export class OrdersService {
  async createOrder(data: CreateOrderDTO) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Generate order number
      const orderNumber = await this.generateOrderNumber(data.organizationId);

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders.orders (
          organization_id, customer_id, order_number, status, reception_data
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [data.organizationId, data.customerId, orderNumber, 'pending', data.receptionData]
      );

      const order = orderResult.rows[0];

      // Create engine
      await client.query(
        `INSERT INTO orders.engines (
          order_id, brand, model, serial_number
        ) VALUES ($1, $2, $3, $4)`,
        [order.id, data.engineData.brand, data.engineData.model, data.engineData.serialNumber]
      );

      // Initialize workflow
      await this.initializeWorkflow(order.id, client);

      await client.query('COMMIT');

      // Publish event
      await publishEvent('OrderCreated', {
        orderId: order.id,
        organizationId: order.organization_id,
        customerId: order.customer_id,
        orderNumber: order.order_number,
      });

      logger.info('Order created', { orderId: order.id });

      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create order', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async generateOrderNumber(organizationId: string): Promise<string> {
    const result = await query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_number
       FROM orders.orders
       WHERE organization_id = $1`,
      [organizationId]
    );

    const nextNumber = result.rows[0].next_number;
    return `OS-${new Date().getFullYear()}-${String(nextNumber).padStart(6, '0')}`;
  }

  private async initializeWorkflow(orderId: string, client: any): Promise<void> {
    const components = ['block', 'crankshaft', 'connecting_rod', 'camshaft', 'cylinder_head'];
    
    for (const component of components) {
      await client.query(
        `INSERT INTO orders.order_workflow (
          order_id, component, status, started_at
        ) VALUES ($1, $2, $3, NOW())`,
        [orderId, component, 'reception']
      );
    }
  }

  async getOrder(orderId: string, organizationId: string) {
    const result = await query(
      `SELECT o.*, c.name as customer_name, e.*
       FROM orders.orders o
       JOIN orders.customers c ON o.customer_id = c.id
       LEFT JOIN orders.engines e ON o.id = e.order_id
       WHERE o.id = $1 AND o.organization_id = $2`,
      [orderId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Order not found');
    }

    return result.rows[0];
  }

  async listOrders(organizationId: string, filters: any = {}) {
    let whereClause = 'WHERE o.organization_id = $1';
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.customerId) {
      whereClause += ` AND o.customer_id = $${paramIndex}`;
      params.push(filters.customerId);
      paramIndex++;
    }

    const result = await query(
      `SELECT o.*, c.name as customer_name
       FROM orders.orders o
       JOIN orders.customers c ON o.customer_id = c.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT 100`,
      params
    );

    return result.rows;
  }
}

export default new OrdersService();
```

---

## 🌐 API Gateway (Kong Configuration)

### kong.yml

```yaml
_format_version: "3.0"

services:
  - name: auth-service
    url: http://auth-service:3001
    routes:
      - name: auth-routes
        paths:
          - /api/v1/auth
        strip_path: false
    plugins:
      - name: rate-limiting
        config:
          minute: 100
          policy: local
      - name: cors
        config:
          origins:
            - "*"
          methods:
            - GET
            - POST
            - PUT
            - DELETE
          headers:
            - Authorization
            - Content-Type

  - name: orders-service
    url: http://orders-service:3002
    routes:
      - name: orders-routes
        paths:
          - /api/v1/orders
        strip_path: false
    plugins:
      - name: jwt
        config:
          key_claim_name: kid
          secret_is_base64: false
      - name: rate-limiting
        config:
          minute: 1000
          policy: local

  - name: budgets-service
    url: http://budgets-service:3004
    routes:
      - name: budgets-routes
        paths:
          - /api/v1/budgets
        strip_path: false
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 500

# Global plugins
plugins:
  - name: prometheus
  - name: request-transformer
    config:
      add:
        headers:
          - X-Gateway-Version:1.0
  - name: correlation-id
    config:
      header_name: X-Request-ID
```

---

## 📚 Biblioteca Compartilhada

### shared/types/index.ts

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: string;
  permissions: string[];
}

export interface Organization {
  id: string;
  name: string;
  settings: Record<string, any>;
  isActive: boolean;
}

export interface Order {
  id: string;
  organizationId: string;
  customerId: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum OrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

### shared/events/eventBus.ts

```typescript
import { EventBridge } from 'aws-sdk';
import { logger } from '../utils/logger';

const eventBridge = new EventBridge({
  region: process.env.AWS_REGION || 'us-east-1',
});

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'erp-event-bus';

export interface DomainEvent {
  eventType: string;
  eventVersion: string;
  timestamp: string;
  source: string;
  data: any;
}

export async function publishEvent(
  eventType: string,
  data: any,
  source: string = 'erp.retifica'
): Promise<void> {
  try {
    const event: DomainEvent = {
      eventType,
      eventVersion: '1.0',
      timestamp: new Date().toISOString(),
      source,
      data,
    };

    await eventBridge.putEvents({
      Entries: [
        {
          Source: source,
          DetailType: eventType,
          Detail: JSON.stringify(event),
          EventBusName: EVENT_BUS_NAME,
        },
      ],
    }).promise();

    logger.info('Event published', { eventType, source });
  } catch (error) {
    logger.error('Failed to publish event', { eventType, error });
    throw error;
  }
}

export async function subscribeToEvent(
  eventType: string,
  handler: (event: DomainEvent) => Promise<void>
): Promise<void> {
  // Implementation for event subscription
  // This would typically be handled by AWS Lambda or ECS tasks
  // listening to EventBridge rules
}
```

---

## 🐳 Docker & Docker Compose

### docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    container_name: erp-postgres
    environment:
      POSTGRES_DB: erp_retifica
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
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

  # Auth Service
  auth-service:
    build:
      context: ./services/auth-service
      dockerfile: Dockerfile
    container_name: auth-service
    environment:
      NODE_ENV: development
      PORT: 3001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: erp_retifica
      DB_USER: auth_service
      DB_PASSWORD: auth_password
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret-key
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./services/auth-service/src:/app/src
    command: npm run dev

  # Orders Service
  orders-service:
    build:
      context: ./services/orders-service
      dockerfile: Dockerfile
    container_name: orders-service
    environment:
      NODE_ENV: development
      PORT: 3002
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: erp_retifica
      DB_USER: orders_service
      DB_PASSWORD: orders_password
      REDIS_URL: redis://redis:6379
      AUTH_SERVICE_URL: http://auth-service:3001
    ports:
      - "3002:3002"
    depends_on:
      - postgres
      - redis
      - auth-service
    volumes:
      - ./services/orders-service/src:/app/src
    command: npm run dev

  # API Gateway (Kong)
  kong:
    image: kong:3.5-alpine
    container_name: erp-kong
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /kong/kong.yml
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    ports:
      - "8000:8000"  # Proxy
      - "8001:8001"  # Admin API
    volumes:
      - ./infrastructure/kong/kong.yml:/kong/kong.yml
    depends_on:
      - auth-service
      - orders-service

volumes:
  postgres_data:
  redis_data:
```

---

## 🧪 Testes

### tests/integration/auth.test.ts

```typescript
import request from 'supertest';
import app from '../../src/app';

describe('Auth API', () => {
  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@retifica.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('email', 'admin@retifica.com');
    });

    it('should return 400 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@retifica.com',
          password: 'wrongpassword',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@retifica.com',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});
```

---

**Documento criado em**: 24/12/2025  
**Versão**: 1.0  
**Autor**: DevOps Team

