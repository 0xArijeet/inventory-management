import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, NatsContext } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory, InventoryCheck } from './entities/inventory.entity';

@Controller('inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  updateInventory(@Body() updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
    return this.inventoryService.updateInventory(updateInventoryDto);
  }

  @Get()
  findAll(): Inventory[] {
    return this.inventoryService.findAll();
  }

  @Get(':productId')
  findOne(@Param('productId') productId: string): Inventory {
    return this.inventoryService.findOne(productId);
  }

  @MessagePattern({ cmd: 'check_inventory', queue: 'inventory-check' })
  async checkInventory(
    @Payload() items: { productId: string; quantity: number }[],
    @Ctx() context: NatsContext,
  ): Promise<InventoryCheck> {
    this.logger.debug(`Received inventory check request: ${JSON.stringify(items)}`);
    return this.inventoryService.checkInventory(items);
  }

  @MessagePattern({ cmd: 'reserve_inventory', queue: 'inventory-reserve' })
  async reserveInventory(
    @Payload() items: { productId: string; quantity: number }[],
    @Ctx() context: NatsContext,
  ): Promise<InventoryCheck> {
    this.logger.debug(`Received inventory reservation request: ${JSON.stringify(items)}`);
    return this.inventoryService.reserveInventory(items);
  }

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
} 