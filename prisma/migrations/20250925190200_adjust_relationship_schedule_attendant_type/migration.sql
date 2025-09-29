/*
  Warnings:

  - You are about to drop the column `schedules_id` on the `attendant_types` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "attendant_types" DROP CONSTRAINT "attendant_types_schedules_id_fkey";

-- AlterTable
ALTER TABLE "attendant_types" DROP COLUMN "schedules_id",
ADD COLUMN     "schedule_id" UUID;
