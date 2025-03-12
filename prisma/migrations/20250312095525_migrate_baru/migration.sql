/*
  Warnings:

  - You are about to drop the column `check_io_id` on the `attendance` table. All the data in the column will be lost.
  - You are about to drop the column `payroll` on the `attendance` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id_mesin]` on the table `attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `check_io_id` ON `attendance`;

-- DropIndex
DROP INDEX `payroll` ON `attendance`;

-- AlterTable
ALTER TABLE `attendance` DROP COLUMN `check_io_id`,
    DROP COLUMN `payroll`,
    ADD COLUMN `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `createdBy` VARCHAR(8) NULL,
    ADD COLUMN `user_id_mesin` VARCHAR(6) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `user_id_mesin` ON `attendance`(`user_id_mesin`);

-- CreateIndex
CREATE INDEX `createdBy` ON `attendance`(`createdBy`);

-- CreateIndex
CREATE INDEX `Check_io_user_id_mesin_fkey` ON `check_io`(`user_id_mesin`);

-- AddForeignKey
ALTER TABLE `check_io` ADD CONSTRAINT `Check_io_user_id_mesin_fkey` FOREIGN KEY (`user_id_mesin`) REFERENCES `employee`(`user_id_mesin`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `Attendance_created_by_fkey` FOREIGN KEY (`createdBy`) REFERENCES `employee`(`payroll`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `Attendance_user_id_mesin_fkey` FOREIGN KEY (`user_id_mesin`) REFERENCES `employee`(`user_id_mesin`) ON DELETE SET NULL ON UPDATE CASCADE;
