import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SUPER_SECRET_KEY_1234', // รหัสลับต้องตรงกับที่ตั้งไว้ตอนสร้าง Token
    });
  }

  async validate(payload: any) {
    // ถ้า Token ถูกต้อง ระบบจะถอดรหัสออกมาเป็นข้อมูลนี้ให้เราเอาไปใช้ต่อ
    return { userId: payload.sub, email: payload.email, name: payload.name };
  }
}