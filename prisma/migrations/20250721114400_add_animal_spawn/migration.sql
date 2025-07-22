-- CreateTable
CREATE TABLE "Animal" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalSpawn" (
    "id" SERIAL NOT NULL,
    "animalId" INTEGER NOT NULL,
    "spawnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "despawnAt" TIMESTAMP(3) NOT NULL,
    "isCaught" BOOLEAN NOT NULL DEFAULT false,
    "caughtById" INTEGER,

    CONSTRAINT "AnimalSpawn_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AnimalSpawn" ADD CONSTRAINT "AnimalSpawn_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalSpawn" ADD CONSTRAINT "AnimalSpawn_caughtById_fkey" FOREIGN KEY ("caughtById") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
