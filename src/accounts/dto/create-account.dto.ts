export class CreateAccountDto {
  accountName: string;
  accountNumber: string;
  balance?: number;
  currency?: string;
  status?: string;
}