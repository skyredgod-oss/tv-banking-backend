import { Injectable, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // 1. เช็กก่อนว่ามีอีเมลนี้ในระบบหรือยัง
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');
    }

    // 2. เข้ารหัสผ่าน (เพื่อความปลอดภัย จะไม่บันทึกรหัสผ่านตรงๆ ลงฐานข้อมูล)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // 3. บันทึกข้อมูลผู้ใช้ใหม่ลงฐานข้อมูล
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
      },
    });

    // 4. ตัดฟิลด์รหัสผ่านทิ้งไปก่อนส่งข้อมูลกลับไปแสดงผล (เพื่อความปลอดภัย)
    const { password, ...result } = user;
    return result;
  }

  findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true }
    });
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        createdAt: true 
      }
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    // เช็กว่ามีผู้ใช้นี้อยู่จริงไหม
    await this.findOne(id);

    // ถ้ามีการส่งรหัสผ่านใหม่มาเพื่อแก้ไข ต้องเข้ารหัสก่อนบันทึก
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    // อัปเดตข้อมูลลง Database
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    // ตัดรหัสผ่านออกก่อนส่งข้อมูลกลับ
    const { password, ...result } = updatedUser;
    return result;
  }

  async remove(id: number) {
    // เช็กก่อนว่ามีบัญชีไหม
    await this.findOne(id);

    // ทำการเปลี่ยน Status เป็น 'closed' แทนการใช้คำสั่ง delete
    const closedAccount = await this.prisma.account.update({
      where: { id },
      data: { status: 'closed' },
    });

    return {
      message: 'ปิดบัญชีสำเร็จ',
      account: closedAccount
    };
  }
}