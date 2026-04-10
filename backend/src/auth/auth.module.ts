import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { HashModule } from '../hash/hash.module';
import configuration from '../config/configuration';

const { jwt } = configuration();

@Module({
  imports: [
    UsersModule,
    HashModule,
    PassportModule,
    JwtModule.register({
      secret: jwt.secret,
      signOptions: {
        expiresIn: jwt.expiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
