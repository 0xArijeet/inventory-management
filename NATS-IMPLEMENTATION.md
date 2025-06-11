# NATS Implementation Walkthrough

## Overview

This document provides a detailed technical walkthrough of the NATS implementation in our Order & Inventory Management System.

## NATS Configuration

### 1. NATS Server Setup
```yaml
# docker-compose.yml
services:
  nats:
    image: nats:latest
    ports:
      - "4222:4222"  # Client connections
      - "8222:8222"  # HTTP monitoring
    command: -js  # Enable JetStream
```

### 2. NATS Client Configuration
```typescript
// nats.module.ts
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: ['nats://localhost:4222'],
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
```

## Communication Patterns

### 1. Request-Reply Pattern

#### Order Service (Client)
```typescript
// orders.service.ts
async create(createOrderDto: CreateOrderDto): Promise<Order> {
  // Check inventory availability with timeout and retry
  const inventoryCheck = await firstValueFrom(
    this.inventoryClient
      .send('check_inventory', createOrderDto.items)
      .pipe(
        timeout(5000), // 5 second timeout
        retry(3), // Retry 3 times
      ),
  );
}
```

#### Inventory Service (Server)
```typescript
// inventory.controller.ts
@MessagePattern({ cmd: 'check_inventory', queue: 'inventory-check' })
async checkInventory(
  @Payload() items: { productId: string; quantity: number }[],
  @Ctx() context: NatsContext,
): Promise<InventoryCheck> {
  return this.inventoryService.checkInventory(items);
}
```

### 2. Queue Groups

#### Inventory Service
```typescript
// inventory.controller.ts
@MessagePattern({ cmd: 'check_inventory', queue: 'inventory-check' })
@MessagePattern({ cmd: 'reserve_inventory', queue: 'inventory-reserve' })
```

### 3. Publish-Subscribe Pattern

#### Order Service (Publisher)
```typescript
// orders.service.ts
// Publish order created event
this.inventoryClient.emit('order_created', {
  orderId: order.id,
  items: createOrderDto.items,
});

// Publish order status update event
this.inventoryClient.emit('order_status_updated', {
  orderId: id,
  status,
  items: order.items,
});
```

#### Inventory Service (Subscriber)
```typescript
// inventory.controller.ts
@MessagePattern('order_created')
async handleOrderCreated(
  @Payload() data: { orderId: string; items: { productId: string; quantity: number }[] },
  @Ctx() context: NatsContext,
): Promise<void> {
  this.logger.debug(`Order created: ${data.orderId}`);
}

@MessagePattern('order_status_updated')
async handleOrderStatusUpdated(
  @Payload() data: { orderId: string; status: string; items: { productId: string; quantity: number }[] },
  @Ctx() context: NatsContext,
): Promise<void> {
  this.logger.debug(`Order status updated: ${data.orderId} - ${data.status}`);
}
```

## Error Handling

### 1. Timeout Handling
```typescript
.pipe(
  timeout(5000), // 5 second timeout
  retry(3), // Retry 3 times
)
```

### 2. Error Logging
```typescript
try {
  // ... NATS operations
} catch (error) {
  this.logger.error(`Failed to create order: ${error.message}`);
  throw error;
}
```

## Message Flow

1. **Order Creation Flow**
   ```
   Order Service                    NATS                    Inventory Service
        |                            |                            |
        |-- Create Order Request -->|                            |
        |                            |-- Check Stock Request ---->|
        |                            |<-- Stock Response --------|
        |<-- Order Status Update ---|                            |
        |                            |                            |
   ```

2. **Inventory Check Flow**
   ```
   Order Service                    NATS                    Inventory Service
        |                            |                            |
        |-- Check Inventory ------->|                            |
        |                            |-- Process Check ---------->|
        |                            |<-- Check Result ----------|
        |<-- Inventory Status ------|                            |
        |                            |                            |
   ```

3. **Event Publishing Flow**
   ```
   Order Service                    NATS                    Inventory Service
        |                            |                            |
        |-- Order Created Event --->|                            |
        |                            |-- Event Received --------->|
        |                            |<-- Event Processed --------|
        |                            |                            |
   ```

## Best Practices Implemented

1. **Queue Groups**
   - Load balancing
   - High availability
   - Message distribution

2. **Error Handling**
   - Timeout management
   - Retry mechanism
   - Error propagation

3. **Logging**
   - Structured logging
   - Context preservation
   - Debug information

4. **Message Patterns**
   - Request-Reply for synchronous operations
   - Publish-Subscribe for events
   - Queue groups for load balancing

## Monitoring and Debugging

1. **NATS Monitoring**
   - HTTP monitoring port (8222)
   - Connection status
   - Message throughput

2. **Application Logging**
   - Request/Response logging
   - Error tracking
   - Performance monitoring

## Future Enhancements

1. **JetStream Features**
   - Message persistence
   - Stream management
   - Consumer groups

2. **Security**
   - TLS encryption
   - Authentication
   - Authorization

3. **Monitoring**
   - Metrics collection
   - Health checks
   - Performance tracking 