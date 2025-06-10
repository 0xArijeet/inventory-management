import { Injectable } from '@nestjs/common';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory, InventoryCheck } from './entities/inventory.entity';

@Injectable()
export class InventoryService {
  private inventory: Inventory[] = [];

  async checkInventory(items: { productId: string; quantity: number }[]): Promise<InventoryCheck> {
    for (const item of items) {
      const inventory = this.inventory.find(inv => inv.productId === item.productId);
      if (!inventory || inventory.quantity < item.quantity) {
        return {
          available: false,
          message: `Insufficient inventory for product ${item.productId}`,
        };
      }
    }
    return { available: true };
  }

  async updateInventory(updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
    const existingInventory = this.inventory.find(
      inv => inv.productId === updateInventoryDto.productId,
    );

    if (existingInventory) {
      existingInventory.quantity = updateInventoryDto.quantity;
      existingInventory.price = updateInventoryDto.price;
      existingInventory.updatedAt = new Date();
      return existingInventory;
    }

    const newInventory: Inventory = {
      id: Math.random().toString(36).substr(2, 9),
      ...updateInventoryDto,
      updatedAt: new Date(),
    };

    this.inventory.push(newInventory);
    return newInventory;
  }

  findAll(): Inventory[] {
    return this.inventory;
  }

  findOne(productId: string): Inventory {
    return this.inventory.find(inv => inv.productId === productId);
  }
} 