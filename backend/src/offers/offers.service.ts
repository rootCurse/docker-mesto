import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Repository,
  FindOneOptions,
  FindManyOptions,
} from 'typeorm';
import { Offer } from './entities/offer.entity';
import { Wish } from '../wishes/entities/wish.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { WishesService } from '../wishes/wishes.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offersRepository: Repository<Offer>,
    private readonly wishesService: WishesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createOfferDto: CreateOfferDto, user: User): Promise<Offer> {
    const wish = await this.wishesService.findOne({
      where: { id: createOfferDto.itemId },
      relations: ['owner'],
    });

    if (wish.owner.id === user.id) {
      throw new ForbiddenException(
        'Нельзя вносить деньги на собственные подарки',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const newRaised = Number(wish.raised) + Number(createOfferDto.amount);
      if (newRaised > Number(wish.price)) {
        throw new ForbiddenException(
          'Сумма собранных средств не может превышать стоимость подарка',
        );
      }
      await manager.update(Wish, wish.id, { raised: newRaised });

      const offer = manager.create(Offer, {
        amount: createOfferDto.amount,
        hidden: createOfferDto.hidden ?? false,
        user,
        item: wish,
      });
      return manager.save(Offer, offer);
    });
  }

  async findOne(query: FindOneOptions<Offer>): Promise<Offer> {
    const offer = await this.offersRepository.findOne(query);
    if (!offer) {
      throw new NotFoundException('Заявка не найдена');
    }
    return offer;
  }

  async findMany(query: FindManyOptions<Offer>): Promise<Offer[]> {
    return this.offersRepository.find(query);
  }
}
