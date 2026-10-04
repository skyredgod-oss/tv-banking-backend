import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { UpdateAccountDto } from './dto/update-account.dto.js';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAccountDto: CreateAccountDto, userId: number) {
    return this.prisma.account.create({
      data: {
        accountName: createAccountDto.accountName,
        accountNumber: createAccountDto.accountNumber,
        balance: createAccountDto.balance ?? 0,
        currency: createAccountDto.currency ?? 'THB',
        status: createAccountDto.status ?? 'active',
        userId: userId, // เพิ่มบรรทัดนี้เพื่อบันทึก ID ลง Database
      },
    });
  }

  async findAll() {
    return this.prisma.account.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const account = await this.prisma.account.findUnique({
      where: {
        id,
      },
    });

    if (!account) {
      throw new NotFoundException(`Account #${id} not found`);
    }

    return account;
  }

  async update(id: number, updateAccountDto: UpdateAccountDto) {
    await this.findOne(id); // เช็กก่อนว่ามีบัญชีไหม

    return this.prisma.account.update({
      where: {
        id,
      },
      data: updateAccountDto,
    });
  }

  async remove(id: number) {
    // 1. เช็กก่อนว่ามีบัญชีนี้ไหม
    await this.findOne(id);

    // 2. ทำการเปลี่ยน Status เป็น 'closed' แทนการใช้คำสั่ง delete
    const closedAccount = await this.prisma.account.update({
      where: { id },
      data: { status: 'closed' },
    });

    return {
      message: 'ปิดบัญชีสำเร็จ',
      account: closedAccount
    };
  }
  async deposit(id: number, amount: number, description?: string) {
    // 1. ดึงข้อมูลบัญชีเดิมมาก่อนเพื่อดูยอดเงินปัจจุบัน
    const account = await this.findOne(id);

    // 2. ใช้ Prisma Transaction เพื่อให้แน่ใจว่าการอัปเดตเงินและการสร้างประวัติเกิดขึ้นพร้อมกัน
    return this.prisma.$transaction(async (prisma) => {
      // อัปเดตยอดเงินในบัญชี
      const updatedAccount = await prisma.account.update({
        where: { id },
        data: { balance: { increment: amount } },
      });

      // บันทึกประวัติธุรกรรม
      await prisma.transaction.create({
        data: {
          accountId: id,
          type: 'deposit',
          amount: amount,
          balanceBefore: account.balance,
          balanceAfter: updatedAccount.balance,
          description: description || 'ฝากเงินเข้าบัญชี',
        },
      });

      return updatedAccount;
    });
  }
  async withdraw(id: number, amount: number, description?: string) {
    // 1. ดึงข้อมูลบัญชีมาเช็กยอดเงินปัจจุบัน
    const account = await this.findOne(id);

    // 2. ตรวจสอบว่ายอดเงินพอถอนหรือไม่
    if (account.balance < amount) {
      throw new BadRequestException('ยอดเงินในบัญชีไม่เพียงพอสำหรับการถอน');
    }

    // 3. ใช้ Prisma Transaction เพื่อตัดเงินและบันทึกประวัติพร้อมกัน
    return this.prisma.$transaction(async (prisma) => {
      // หักยอดเงิน (decrement)
      const updatedAccount = await prisma.account.update({
        where: { id },
        data: { balance: { decrement: amount } }, 
      });

      // บันทึกประวัติการถอนเงิน
      await prisma.transaction.create({
        data: {
          accountId: id,
          type: 'withdraw',
          amount: amount,
          balanceBefore: account.balance,
          balanceAfter: updatedAccount.balance,
          description: description || 'ถอนเงินออกจากบัญชี',
        },
      });

      return updatedAccount;
    });
  }
  async transfer(fromId: number, toId: number, amount: number, description?: string) {
    // 1. ตรวจสอบว่าห้ามโอนเข้าบัญชีตัวเอง
    if (fromId === toId) {
      throw new BadRequestException('ไม่สามารถโอนเงินเข้าบัญชีตัวเองได้');
    }

    // 2. ดึงข้อมูลบัญชีต้นทาง และ ปลายทาง
    const fromAccount = await this.findOne(fromId);
    const toAccount = await this.findOne(toId); // จะ throw NotFound อัตโนมัติถ้าไม่เจอบัญชีปลายทาง

    // 3. เช็กว่าเงินต้นทางพอโอนไหม
    if (fromAccount.balance < amount) {
      throw new BadRequestException('ยอดเงินในบัญชีไม่เพียงพอสำหรับการโอน');
    }

    // 4. ทำ Transaction 4 ขั้นตอน: หักเงินต้นทาง -> เพิ่มเงินปลายทาง -> บันทึกประวัติฝั่งออก -> บันทึกประวัติฝั่งเข้า
    return this.prisma.$transaction(async (prisma) => {
      // 4.1 หักเงินบัญชีต้นทาง
      const updatedFromAccount = await prisma.account.update({
        where: { id: fromId },
        data: { balance: { decrement: amount } },
      });

      // 4.2 เพิ่มเงินบัญชีปลายทาง
      const updatedToAccount = await prisma.account.update({
        where: { id: toId },
        data: { balance: { increment: amount } },
      });

      // 4.3 สร้างประวัติให้บัญชีต้นทาง (เงินออก)
      await prisma.transaction.create({
        data: {
          accountId: fromId,
          type: 'transfer',
          amount: amount,
          balanceBefore: fromAccount.balance,
          balanceAfter: updatedFromAccount.balance,
          description: description || `โอนเงินไปยังบัญชี ID: ${toId}`,
        },
      });

      // 4.4 สร้างประวัติให้บัญชีปลายทาง (เงินเข้า)
      await prisma.transaction.create({
        data: {
          accountId: toId,
          type: 'transfer',
          amount: amount,
          balanceBefore: toAccount.balance,
          balanceAfter: updatedToAccount.balance,
          description: `รับโอนเงินจากบัญชี ID: ${fromId}`,
        },
      });

      return {
        message: 'โอนเงินสำเร็จ',
        fromAccount: updatedFromAccount,
        toAccount: updatedToAccount,
      };
    });
  }
  async getStatement(accountId: number) {
    // 1. เช็กก่อนว่ามีบัญชีนี้จริงๆ ไหม
    await this.findOne(accountId);

    // 2. ดึงประวัติธุรกรรมทั้งหมดของบัญชีนี้ โดยเรียงจากใหม่สุด (desc) ไปเก่าสุด
    return this.prisma.transaction.findMany({
      where: { accountId: accountId },
      orderBy: { createdAt: 'desc' },
    });
  }
}