import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateConfigDto {
  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  telegramBotToken?: string;

  @IsOptional()
  @IsString()
  ownerChatId?: string;

  @IsOptional()
  @IsObject()
  featureFlags?: Record<string, boolean>;
}
