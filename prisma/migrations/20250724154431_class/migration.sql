-- CreateEnum
CREATE TYPE "Class" AS ENUM ('WARRIOR', 'MAGE', 'ARCHER');

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "class" "Class",
ADD COLUMN     "hungry" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "class" "Class";
