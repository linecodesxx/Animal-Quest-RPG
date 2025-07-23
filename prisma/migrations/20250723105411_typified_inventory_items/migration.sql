-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('EMPTY', 'FOOD', 'POTION', 'SWORDS', 'ARMOR', 'MAGIC_SCROLL', 'TREASURE', 'TOOL', 'ACCESSORY');

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "type" "ItemType" NOT NULL DEFAULT 'EMPTY';
