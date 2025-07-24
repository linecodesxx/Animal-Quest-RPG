import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CharacterService {
  constructor(private readonly prisma: PrismaService) {}

  async changeCharacterName(characterId: number, newName: string) {
    return await this.prisma.character.update({
      where: { id: characterId },
      data: { name: newName },
    });
  }
}
