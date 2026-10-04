import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async login(email: string, pass: string) {
    // 1. ค้นหา User จากอีเมลในฐานข้อมูล
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // 2. ถ้าไม่เจออีเมล หรือรหัสผ่านไม่ตรงกัน ให้เตะออก
    if (!user) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    // 3. ถ้ารหัสถูก ให้สร้าง JWT Token ส่งกลับไป
    const payload = { sub: user.id, email: user.email, name: user.name };
    return {
      message: 'เข้าสู่ระบบสำเร็จ',
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}