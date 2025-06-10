import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService {
  private orders: Order[] = [];

  constructor(
    @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientProxy,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Check inventory availability
    const inventoryCheck = await firstValueFrom(
      this.inventoryClient.send('check_inventory', createOrderDto.items),
    );

    if (!inventoryCheck.available) {
      throw new Error('Insufficient inventory');
    }

    const order: Order = {
      id: Math.random().toString(36).substr(2, 9),
      ...createOrderDto,
      status: OrderStatus.PENDING,
      totalAmount: 0, // Calculate based on items
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.orders.push(order);
    return order;
  }

  findAll(): Order[] {
    return this.orders;
  }

  findOne(id: string): Order {
    return this.orders.find(order => order.id === id);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = this.findOne(id);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    order.updatedAt = new Date();
    return order;
  }
} 