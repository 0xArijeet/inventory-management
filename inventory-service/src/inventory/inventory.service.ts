import { Injectable, Logger } from '@nestjs/common';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory, InventoryCheck } from './entities/inventory.entity';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  private inventory: Inventory[] = [];

  async checkInventory(items: { productId: string; quantity: number }[]): Promise<InventoryCheck> {
    const prices: { [productId: string]: number } = {};
    
    for (const item of items) {
      const inventory = this.inventory.find(inv => inv.productId === item.productId);
      if (!inventory || inventory.quantity < item.quantity) {
        return {
          available: false,
          message: `Insufficient inventory for product ${item.productId}`,
          prices: {}
        };
      }
      prices[item.productId] = inventory.price;
    }
    
    return { 
      available: true,
      prices 
    };
  }

  async reserveInventory(items: { productId: string; quantity: number }[]): Promise<InventoryCheck> {
    try {
   
      const check = await this.checkInventory(items);
      if (!check.available) {
        return check;
      }

      for (const item of items) {
        const inventory = this.inventory.find(inv => inv.productId === item.productId);
        if (inventory) {
          inventory.quantity -= item.quantity;
          inventory.updatedAt = new Date();
        }
      }

      return { available: true, prices: check.prices };
    } catch (error) {
      this.logger.error(`Failed to reserve inventory: ${error.message}`);
      return {
        available: false,
        message: `Failed to reserve inventory: ${error.message}`,
        prices: {}
      };
    }
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
    const inventory = this.inventory.find(inv => inv.productId === productId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }
    return inventory;
  }
} 