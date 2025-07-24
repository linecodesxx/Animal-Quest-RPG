/*
  Warnings:

  - The values [SWORDS] on the enum `ItemType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ItemType_new" AS ENUM ('EMPTY', 'FOOD', 'POTION', 'SWORD', 'ARMOR', 'MAGIC_SCROLL', 'TREASURE', 'TOOL', 'ACCESSORY');
ALTER TABLE "InventoryItem" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "InventoryItem" ALTER COLUMN "type" TYPE "ItemType_new" USING ("type"::text::"ItemType_new");
ALTER TYPE "ItemType" RENAME TO "ItemType_old";
ALTER TYPE "ItemType_new" RENAME TO "ItemType";
DROP TYPE "ItemType_old";
ALTER TABLE "InventoryItem" ALTER COLUMN "type" SET DEFAULT 'EMPTY';
COMMIT;
