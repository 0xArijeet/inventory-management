import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { firstValueFrom, timeout, retry } from 'rxjs';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private orders: Order[] = [];

  constructor(
    @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientProxy,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      // Check inventory availability with timeout and retry
      const inventoryCheck = await firstValueFrom(
        this.inventoryClient
          .send('check_inventory', createOrderDto.items)
          .pipe(
            timeout(5000), // 5 second timeout
            retry(3), // Retry 3 times
          ),
      );

      if (!inventoryCheck.available) {
        throw new Error(inventoryCheck.message || 'Insufficient inventory');
      }

      // Reserve inventory
      await firstValueFrom(
        this.inventoryClient
          .send('reserve_inventory', createOrderDto.items)
          .pipe(timeout(5000)),
      );

      const order: Order = {
        id: Math.random().toString(36).substr(2, 9),
        customerId: createOrderDto.customerId,
        items: createOrderDto.items.map(item => ({
          ...item,
          price: inventoryCheck.prices[item.productId] || 0
        })),
        status: OrderStatus.PENDING,
        totalAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.orders.push(order);

      this.inventoryClient.emit('order_created', {
        orderId: order.id,
        items: createOrderDto.items,
      });

      return order;
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      throw error;
    }
  }

  findAll(): Order[] {
    return this.orders;
  }

  findOne(id: string): Order {
    const order = this.orders.find(order => order.id === id);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = this.findOne(id);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    order.updatedAt = new Date();

    // Publish order status update event
    this.inventoryClient.emit('order_status_updated', {
      orderId: id,
      status,
      items: order.items,
    });

    return order;
  }
} 