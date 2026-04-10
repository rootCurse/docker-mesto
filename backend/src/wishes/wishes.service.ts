import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Repository,
  FindOneOptions,
  FindManyOptions,
} from 'typeorm';
import { Wish } from './entities/wish.entity';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private readonly wishesRepository: Repository<Wish>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createWishDto: CreateWishDto, owner: User): Promise<Wish> {
    const wish = this.wishesRepository.create({ ...createWishDto, owner });
    return this.wishesRepository.save(wish);
  }

  async findOne(query: FindOneOptions<Wish>): Promise<Wish> {
    const wish = await this.wishesRepository.findOne(query);
    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }
    return wish;
  }

  async findMany(query: FindManyOptions<Wish>): Promise<Wish[]> {
    return this.wishesRepository.find(query);
  }

  async findLast(): Promise<Wish[]> {
    return this.wishesRepository.find({
      order: { createdAt: 'DESC' },
      take: 40,
      relations: ['owner'],
    });
  }

  async findTop(): Promise<Wish[]> {
    return this.wishesRepository.find({
      order: { copied: 'DESC' },
      take: 20,
      relations: ['owner'],
    });
  }

  async updateOne(
    id: number,
    updateWishDto: UpdateWishDto,
    userId: number,
  ): Promise<Wish> {
    const wish = await this.findOne({
      where: { id },
      relations: ['owner', 'offers'],
    });

    if (wish.owner.id !== userId) {
      throw new ForbiddenException('Нельзя редактировать чужие подарки');
    }

    if (
      updateWishDto.price !== undefined &&
      wish.offers &&
      wish.offers.length > 0
    ) {
      throw new ForbiddenException(
        'Нельзя изменять стоимость, если уже есть желающие скинуться',
      );
    }

    Object.assign(wish, updateWishDto);
    return this.wishesRepository.save(wish);
  }

  async removeOne(id: number, userId: number): Promise<Wish> {
    const wish = await this.findOne({
      where: { id },
      relations: ['owner', 'offers'],
    });

    if (wish.owner.id !== userId) {
      throw new ForbiddenException('Нельзя удалять чужие подарки');
    }

    await this.wishesRepository.delete(id);
    return wish;
  }

  async copyWish(id: number, user: User): Promise<Wish> {
    const wish = await this.findOne({ where: { id }, relations: ['owner'] });

    const alreadyCopied = await this.wishesRepository.findOne({
      where: { link: wish.link, owner: { id: user.id } },
    });
    if (alreadyCopied) {
      throw new BadRequestException('Вы уже копировали себе этот подарок');
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.update(Wish, id, { copied: wish.copied + 1 });
      const copiedWish = manager.create(Wish, {
        name: wish.name,
        link: wish.link,
        image: wish.image,
        price: wish.price,
        description: wish.description,
        owner: user,
      });
      return manager.save(Wish, copiedWish);
    });
  }

  async updateRaised(id: number, amount: number): Promise<void> {
    const wish = await this.findOne({ where: { id } });
    const newRaised = Number(wish.raised) + Number(amount);
    if (newRaised > Number(wish.price)) {
      throw new BadRequestException(
        'Сумма собранных средств не может превышать стоимость подарка',
      );
    }
    await this.wishesRepository.update(id, { raised: newRaised });
  }
}
