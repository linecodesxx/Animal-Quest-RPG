/*
  Warnings:

  - You are about to drop the column `name` on the `Animal` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Animal_type_key";

-- AlterTable
ALTER TABLE "Animal" DROP COLUMN "name";
