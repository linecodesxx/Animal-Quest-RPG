/*
  Warnings:

  - You are about to drop the column `sword` on the `Character` table. All the data in the column will be lost.
  - The `armor` column on the `Character` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "WeaponType" AS ENUM ('SWORD', 'AXE', 'BOW', 'MAGIC_WAND', 'DAGGER');

-- CreateEnum
CREATE TYPE "ArmorType" AS ENUM ('LIGHT', 'MEDIUM', 'HEAVY', 'MAGICAL');

-- CreateEnum
CREATE TYPE "BuffType" AS ENUM ('ATTACK_UP', 'DEFENSE_UP', 'HEALTH_REGEN', 'SPEED_UP', 'HUNGER_REDUCE', 'CRIT_CHANCE', 'CUTENESS_BOOST', 'FIRE_RESISTANCE', 'MAGIC_POWER');

-- AlterTable
ALTER TABLE "Character" DROP COLUMN "sword",
ADD COLUMN     "weapon" "WeaponType",
DROP COLUMN "armor",
ADD COLUMN     "armor" "ArmorType";

-- DropEnum
DROP TYPE "Armor";

-- DropEnum
DROP TYPE "Sword";

-- CreateTable
CREATE TABLE "CharacterClass" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "attackMod" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "defenseMod" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "skills" TEXT,

    CONSTRAINT "CharacterClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Weapon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "attack" INTEGER NOT NULL,
    "classReqId" INTEGER,
    "type" "WeaponType",
    "rarity" TEXT,
    "cuteFactor" INTEGER,

    CONSTRAINT "Weapon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Armor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "defense" INTEGER NOT NULL,
    "classReqId" INTEGER,
    "type" "ArmorType",
    "rarity" TEXT,
    "cuteFactor" INTEGER,

    CONSTRAINT "Armor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buff" (
    "id" SERIAL NOT NULL,
    "type" "BuffType" NOT NULL,
    "value" INTEGER NOT NULL,
    "duration" INTEGER,
    "description" TEXT,

    CONSTRAINT "Buff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CharacterToCharacterClass" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CharacterToCharacterClass_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ArmorBuffs" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ArmorBuffs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_WeaponBuffs" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_WeaponBuffs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "CharacterClass_name_key" ON "CharacterClass"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Weapon_name_key" ON "Weapon"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Armor_name_key" ON "Armor"("name");

-- CreateIndex
CREATE INDEX "_CharacterToCharacterClass_B_index" ON "_CharacterToCharacterClass"("B");

-- CreateIndex
CREATE INDEX "_ArmorBuffs_B_index" ON "_ArmorBuffs"("B");

-- CreateIndex
CREATE INDEX "_WeaponBuffs_B_index" ON "_WeaponBuffs"("B");

-- AddForeignKey
ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_classReqId_fkey" FOREIGN KEY ("classReqId") REFERENCES "CharacterClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Armor" ADD CONSTRAINT "Armor_classReqId_fkey" FOREIGN KEY ("classReqId") REFERENCES "CharacterClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacterToCharacterClass" ADD CONSTRAINT "_CharacterToCharacterClass_A_fkey" FOREIGN KEY ("A") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacterToCharacterClass" ADD CONSTRAINT "_CharacterToCharacterClass_B_fkey" FOREIGN KEY ("B") REFERENCES "CharacterClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArmorBuffs" ADD CONSTRAINT "_ArmorBuffs_A_fkey" FOREIGN KEY ("A") REFERENCES "Armor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArmorBuffs" ADD CONSTRAINT "_ArmorBuffs_B_fkey" FOREIGN KEY ("B") REFERENCES "Buff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WeaponBuffs" ADD CONSTRAINT "_WeaponBuffs_A_fkey" FOREIGN KEY ("A") REFERENCES "Buff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WeaponBuffs" ADD CONSTRAINT "_WeaponBuffs_B_fkey" FOREIGN KEY ("B") REFERENCES "Weapon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
