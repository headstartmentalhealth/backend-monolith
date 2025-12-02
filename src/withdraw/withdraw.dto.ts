import { QueryDto } from '@/generic/generic.dto';
import { IsNumber, IsString, IsUUID } from 'class-validator';
import { IsEnum, IsOptional } from 'class-validator';

export class CreateWithdrawalDto {
  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  password: string;
}

export class InitiateWithdrawalDto {
  @IsUUID()
  withdrawalId: string;
}

export class FinalizeWithdrawalDto {
  @IsString()
  otp: string;

  @IsUUID()
  withdrawalId: string;
}

export class VerifyWithdrawalDto {
  @IsString()
  reference: string;
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class UpdateWithdrawalDto {
  @IsEnum(WithdrawalStatus)
  status: WithdrawalStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  processed_by?: string;
}

export class QueryWithdrawRequestsDto extends QueryDto {
  @IsString()
  @IsOptional()
  q?: string;
}

export class WithdrawNoteDto {
  transfer_code: string;
  reference: string;
}
