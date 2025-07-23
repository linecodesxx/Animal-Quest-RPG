import { CanActivate, Injectable, ExecutionContext } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Context } from 'telegraf';
import { TelegrafExecutionContext } from 'nestjs-telegraf';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = TelegrafExecutionContext.create(context).getContext<Context>();
    const telegramId = String(ctx.from?.id);

    if (!telegramId) return false;
    const user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    return user?.role === 'ADMIN';
  }
}
