/*
  Warnings:

  - A unique constraint covering the columns `[type]` on the table `Animal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Animal_type_key" ON "Animal"("type");
