import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WishesService } from './wishes.service';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { User } from '../users/entities/user.entity';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('wishes')
export class WishesController {
  constructor(private readonly wishesService: WishesService) {}

  @Get('last')
  findLast() {
    return this.wishesService.findLast();
  }

  @Get('top')
  findTop() {
    return this.wishesService.findTop();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createWishDto: CreateWishDto, @GetUser() user: User) {
    return this.wishesService.create(createWishDto, user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wishesService.findOne({
      where: { id: +id },
      relations: ['owner', 'offers', 'offers.user'],
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWishDto: UpdateWishDto,
    @GetUser() user: User,
  ) {
    return this.wishesService.updateOne(+id, updateWishDto, user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.wishesService.removeOne(+id, user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/copy')
  copy(@Param('id') id: string, @GetUser() user: User) {
    return this.wishesService.copyWish(+id, user);
  }
}
