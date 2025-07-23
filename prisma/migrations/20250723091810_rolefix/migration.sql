/*
  Warnings:

  - You are about to drop the column `rule` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "rule",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
