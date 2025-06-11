# Order & Inventory Management System with NATS

A microservices-based order and inventory management system using NestJS and NATS for inter-service communication.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────┐     ┌──────────────────┐
│   Order Service │◄────┤    NATS     │────►│ Inventory Service│
└─────────────────┘     └─────────────┘     └──────────────────┘
```

## Features

### NATS Communication Patterns
1. **Request-Reply Pattern**
   - Order service requests inventory availability
   - Inventory service responds with status
   - Timeout handling (5 seconds)
   - Retry mechanism (3 attempts)

2. **Queue Groups**
   - `inventory-check` queue for inventory checks
   - `inventory-reserve` queue for inventory reservations
   - Load balancing support

3. **Publish-Subscribe Pattern**
   - Order events publishing
   - Inventory events subscription
   - Event-driven architecture

### Order Service
- REST API endpoints for order management
- Order creation with inventory validation
- Order status management
- Event publishing for order lifecycle

### Inventory Service
- REST API endpoints for inventory management
- Real-time inventory checks
- Inventory reservation system
- Event handling for order updates

## API Documentation

### Order Service Endpoints

```typescript
POST /orders
{
  "customerId": "string",
  "items": [
    {
      "productId": "string",
      "quantity": number
    }
  ]
}

GET /orders
GET /orders/:id
PUT /orders/:id/status
{
  "status": "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
}
```

### Inventory Service Endpoints

```typescript
POST /inventory
{
  "productId": "string",
  "quantity": number,
  "price": number
}

GET /inventory
GET /inventory/:productId
```

## NATS Message Patterns

### Request-Reply
```typescript
// Order Service -> Inventory Service
this.inventoryClient.send('check_inventory', items)

// Inventory Service Response
@MessagePattern({ cmd: 'check_inventory', queue: 'inventory-check' })
```

### Publish-Subscribe
```typescript
// Order Service Publishing
this.inventoryClient.emit('order_created', { orderId, items })
this.inventoryClient.emit('order_status_updated', { orderId, status, items })

// Inventory Service Subscribing
@MessagePattern('order_created')
@MessagePattern('order_status_updated')
```

## Setup and Installation

1. **Prerequisites**
   - Node.js (v14 or higher)
   - Docker and Docker Compose
   - NATS server

2. **Installation**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd inventory-management

   # Install dependencies
   cd order-service && npm install
   cd ../inventory-service && npm install
   ```

3. **Start Services**
   ```bash
   # Start NATS server
   docker-compose up -d

   # Start Order Service
   cd order-service
   npm run start:dev

   # Start Inventory Service
   cd ../inventory-service
   npm run start:dev
   ```

## Project Structure

```
inventory-management/
├── order-service/
│   ├── src/
│   │   ├── orders/
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   └── orders.module.ts
│   │   └── nats/
│   │       └── nats.module.ts
│   └── package.json
├── inventory-service/
│   ├── src/
│   │   ├── inventory/
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── inventory.controller.ts
│   │   │   ├── inventory.service.ts
│   │   │   └── inventory.module.ts
│   │   └── nats/
│   │       └── nats.module.ts
│   └── package.json
└── docker-compose.yml
```

## Error Handling

The system implements comprehensive error handling:

1. **Timeout Handling**
   - 5-second timeout for inventory checks
   - Automatic retry mechanism

2. **Error Propagation**
   - Structured error responses
   - Error logging with context

3. **Transaction Management**
   - Inventory reservation rollback
   - Order status consistency

## Testing

```bash
# Run Order Service Tests
cd order-service
npm run test

# Run Inventory Service Tests
cd ../inventory-service
npm run test
```

## Monitoring and Logging

- Structured logging with NestJS Logger
- Request/Response tracking
- Error logging with context
- Performance monitoring

## Future Enhancements

1. **NATS JetStream Integration**
   - Message persistence
   - Stream management
   - Consumer groups

2. **Security Features**
   - TLS encryption
   - Authentication
   - Authorization

3. **Monitoring**
   - Health checks
   - Metrics collection
   - Performance monitoring

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License. 