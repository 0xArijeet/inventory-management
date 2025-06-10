import { IsString, IsNumber, Min } from 'class-validator';

export class UpdateInventoryDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
} 