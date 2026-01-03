/*
  Warnings:

  - Added the required column `capacity` to the `Auditory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Auditory" ADD COLUMN     "capacity" INTEGER NOT NULL;
