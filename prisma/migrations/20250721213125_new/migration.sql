-- AlterTable
ALTER TABLE "AnimalSpawn" ADD COLUMN     "userId" INTEGER;

-- AddForeignKey
ALTER TABLE "AnimalSpawn" ADD CONSTRAINT "AnimalSpawn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
