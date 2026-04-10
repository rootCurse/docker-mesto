import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { WishesService } from '../wishes/wishes.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistsRepository: Repository<Wishlist>,
    private readonly wishesService: WishesService,
  ) {}

  async create(
    createWishlistDto: CreateWishlistDto,
    owner: User,
  ): Promise<Wishlist> {
    const items = createWishlistDto.itemsId
      ? await Promise.all(
          createWishlistDto.itemsId.map((id) =>
            this.wishesService.findOne({ where: { id } }),
          ),
        )
      : [];

    const wishlist = this.wishlistsRepository.create({
      name: createWishlistDto.name,
      description: createWishlistDto.description,
      image: createWishlistDto.image,
      items,
      owner,
    });

    return this.wishlistsRepository.save(wishlist);
  }

  async findOne(query: FindOneOptions<Wishlist>): Promise<Wishlist> {
    const wishlist = await this.wishlistsRepository.findOne(query);
    if (!wishlist) {
      throw new NotFoundException('Вишлист не найден');
    }
    return wishlist;
  }

  async findMany(query: FindManyOptions<Wishlist>): Promise<Wishlist[]> {
    return this.wishlistsRepository.find(query);
  }

  async updateOne(
    id: number,
    updateWishlistDto: UpdateWishlistDto,
    userId: number,
  ): Promise<Wishlist> {
    const wishlist = await this.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (wishlist.owner.id !== userId) {
      throw new ForbiddenException('Нельзя редактировать чужие подборки');
    }

    if (updateWishlistDto.itemsId) {
      const items = await Promise.all(
        updateWishlistDto.itemsId.map((wishId) =>
          this.wishesService.findOne({ where: { id: wishId } }),
        ),
      );
      wishlist.items = items;
    }

    Object.assign(wishlist, {
      name: updateWishlistDto.name ?? wishlist.name,
      description: updateWishlistDto.description ?? wishlist.description,
      image: updateWishlistDto.image ?? wishlist.image,
    });

    return this.wishlistsRepository.save(wishlist);
  }

  async removeOne(id: number, userId: number): Promise<Wishlist> {
    const wishlist = await this.findOne({
      where: { id },
      relations: ['owner', 'items'],
    });

    if (wishlist.owner.id !== userId) {
      throw new ForbiddenException('Нельзя удалять чужие подборки');
    }

    await this.wishlistsRepository.delete(id);
    return wishlist;
  }
}
