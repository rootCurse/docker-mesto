import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { GetUser } from '../common/decorators/get-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@GetUser() user: User) {
    const { password: _, ...result } = user;
    return result;
  }

  @Patch('me')
  async updateMe(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    const updated = await this.usersService.updateOne(user.id, updateUserDto);
    const { password: _, ...result } = updated;
    return result;
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMe(@GetUser() user: User) {
    return this.usersService.removeOne(user.id);
  }

  @Get('me/wishes')
  getMyWishes(@GetUser() user: User) {
    return this.usersService
      .findOne({
        where: { id: user.id },
        relations: ['wishes', 'wishes.offers'],
      })
      .then((u) => u.wishes);
  }

  @Post('find')
  findUsers(@Body('query') query: string) {
    return this.usersService.findByUsernameOrEmail(query);
  }

  @Get(':username')
  async getUser(@Param('username') username: string) {
    const user = await this.usersService.findOne({ where: { username } });
    const { password: _, ...result } = user;
    return result;
  }

  @Get(':username/wishes')
  async getUserWishes(@Param('username') username: string) {
    const user = await this.usersService.findOne({
      where: { username },
      relations: ['wishes', 'wishes.offers'],
    });
    return user.wishes;
  }
}
