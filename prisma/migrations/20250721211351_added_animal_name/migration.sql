/*
  Warnings:

  - Added the required column `name` to the `Animal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "name" TEXT NOT NULL;
