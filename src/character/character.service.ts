import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CharacterService {
  private levels = [
    { level: 2, maxExp: 10 },
    { level: 3, maxExp: 20 },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async changeCharacterName(characterId: number, newName: string) {
    return await this.prisma.character.update({
      where: { id: characterId },
      data: { name: newName },
    });
  }
  async hungryUp(characterId: number, hungryWants: number) {
    const oldhungry = await this.prisma.character.findFirst({
      where: { id: characterId },
    });
    if (!oldhungry) {
      throw new Error('Character not found');
    }
    return await this.prisma.character.update({
      where: { id: characterId },
      data: { hungry: oldhungry.hungry + hungryWants },
    });
  }
  async heal(id: number, healValue: number) {
    const character = await this.prisma.character.findFirst({ where: { id } });
    if (!character) {
      throw new Error('Character not found');
}
    const newHp = Math.min(character.health + healValue, character.maxHealth);

    return await this.prisma.character.update({
      where: { id },
      data: { health: newHp },
    });
  }

  async set1health(id: number) {
    return await this.prisma.character.update({
      where: { id },
      data: { health: 1 },
    });
  }
}
