import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AnimalInitService {
  private animals = [
    { type: 'Лис', rarity: 'COMMON' },
    { type: 'Волк', rarity: 'UNCOMMON' },
    { type: 'Дракон', rarity: 'RARE' },
    { type: 'Котенок', rarity: 'COMMON' },
    { type: 'Собачка', rarity: 'COMMON' },
    { type: 'Капибара', rarity: 'RARE' },
    { type: 'Бибизянка', rarity: 'UNCOMMON' },
    { type: 'Пчелка(Бджiлка)',  rarity: 'RARE' },
    { type: 'Зебра', rarity: 'UNCOMMON'},
    { type: 'Единорог', rarity: 'RARE' },
    {type: 'Жабка', rarity: 'UNCOOMMON'}
  ];

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Сначала создаем всех животных, если их нет
    for (const animal of this.animals) {
      try {
        await this.prisma.animal.upsert({
          where: { type: animal.type }, // Используем type как уникальный ключ
          update: {}, // Если животное уже есть - ничего не обновляем
          create: animal // Создаем новое животное
        });
      } catch (error) {
        console.error(`Ошибка при создании животного ${animal.type}:`, error);
      }
    }
  }
}