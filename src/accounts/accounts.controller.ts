import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from './accounts.service.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { UpdateAccountDto } from './dto/update-account.dto.js';

@UseGuards(AuthGuard('jwt'))
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Body() createAccountDto: CreateAccountDto, @Req() req: any) {
    const userId = req.user.userId; 
    return this.accountsService.create(createAccountDto, userId);
  }

  // แก้ไขตรงนี้: รับ Req เพื่อดึง userId ไปใช้กรองข้อมูลบัญชี
  @Get()
  findAll(@Req() req: any) {
    const userId = req.user.userId;
    return this.accountsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    return this.accountsService.update(+id, updateAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountsService.remove(+id);
  }
  
  @Post(':id/deposit')
  deposit(
    @Param('id', ParseIntPipe) id: number,
    @Body('amount') amount: number,
    @Body('description') description?: string,
  ) {
    return this.accountsService.deposit(id, amount, description);
  }
  
  @Post(':id/withdraw')
  withdraw(
    @Param('id', ParseIntPipe) id: number,
    @Body('amount') amount: number,
    @Body('description') description?: string,
  ) {
    return this.accountsService.withdraw(id, amount, description);
  }
  
  @Post(':id/transfer')
  transfer(
    @Param('id', ParseIntPipe) fromId: number,
    @Body('toAccountId', ParseIntPipe) toId: number,
    @Body('amount') amount: number,
    @Body('description') description?: string,
  ) {
    return this.accountsService.transfer(fromId, toId, amount, description);
  }
  
  @Get(':id/transactions')
  getStatement(@Param('id', ParseIntPipe) id: number) {
    return this.accountsService.getStatement(id);
  }
}