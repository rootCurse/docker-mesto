import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOneOptions,
  FindManyOptions,
  FindOptionsWhere,
  Not,
} from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashService } from '../hash/hash.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly hashService: HashService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });
    if (existingUser) {
      throw new ConflictException(
        'Пользователь с таким email или именем уже зарегистрирован',
      );
    }
    const hashedPassword = await this.hashService.hash(createUserDto.password);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async findOne(query: FindOneOptions<User>): Promise<User> {
    const user = await this.usersRepository.findOne(query);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  async findMany(query: FindManyOptions<User>): Promise<User[]> {
    return this.usersRepository.find(query);
  }

  async findByUsernameOrEmail(search: string): Promise<User[]> {
    return this.usersRepository.find({
      where: [{ username: search }, { email: search }],
    });
  }

  async updateOne(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne({ where: { id } });

    if (updateUserDto.username || updateUserDto.email) {
      const conflictConditions: FindOptionsWhere<User>[] = [];
      if (updateUserDto.username) {
        conflictConditions.push({
          username: updateUserDto.username,
          id: Not(id),
        });
      }
      if (updateUserDto.email) {
        conflictConditions.push({ email: updateUserDto.email, id: Not(id) });
      }
      const existingUser = await this.usersRepository.findOne({
        where: conflictConditions,
      });
      if (existingUser) {
        throw new ConflictException(
          'Пользователь с таким email или username уже зарегистрирован',
        );
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await this.hashService.hash(
        updateUserDto.password,
      );
    }
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async removeOne(id: number): Promise<void> {
    await this.findOne({ where: { id } });
    await this.usersRepository.delete(id);
  }
}
