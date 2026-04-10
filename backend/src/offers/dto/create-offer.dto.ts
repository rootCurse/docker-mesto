import { IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateOfferDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;

  @IsNumber()
  itemId: number;
}
