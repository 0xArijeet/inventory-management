import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory, InventoryCheck } from './entities/inventory.entity';

@Controller('inventory')
export class InventoryController {
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

  @MessagePattern('check_inventory')
  checkInventory(items: { productId: string; quantity: number }[]): Promise<InventoryCheck> {
    return this.inventoryService.checkInventory(items);
  }
} 