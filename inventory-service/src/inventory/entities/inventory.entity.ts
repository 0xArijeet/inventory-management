export class Inventory {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  updatedAt: Date;
}

export class InventoryCheck {
  available: boolean;
  message?: string;
} 