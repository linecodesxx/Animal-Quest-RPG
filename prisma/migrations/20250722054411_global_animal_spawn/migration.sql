/*
  Warnings:

  - You are about to drop the column `userId` on the `AnimalSpawn` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AnimalSpawn" DROP CONSTRAINT "AnimalSpawn_userId_fkey";

-- AlterTable
ALTER TABLE "AnimalSpawn" DROP COLUMN "userId";
