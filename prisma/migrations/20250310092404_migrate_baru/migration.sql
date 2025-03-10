/*
  Warnings:

  - You are about to drop the column `card_no` on the `employee` table. All the data in the column will be lost.
  - The values [0,1,2,3,4,5,6,7,8,9,10] on the enum `profile_level` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `employee` DROP COLUMN `card_no`,
    ADD COLUMN `user_id_mesin` VARCHAR(6) NULL;

-- AlterTable
ALTER TABLE `profile` MODIFY `level` ENUM('L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9') NOT NULL;

-- CreateTable
CREATE TABLE `attendance` (
    `attendance_id` VARCHAR(40) NOT NULL,
    `check_io_id` VARCHAR(40) NOT NULL,
    `payroll` VARCHAR(8) NOT NULL,
    `waktu` DATETIME(0) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `attachment` TEXT NULL,

    INDEX `check_io_id`(`check_io_id`),
    INDEX `payroll`(`payroll`),
    PRIMARY KEY (`attendance_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `check_io` (
    `check_io_id` VARCHAR(40) NOT NULL,
    `user_id_mesin` VARCHAR(6) NOT NULL,
    `waktu` DATETIME(0) NOT NULL,
    `type` VARCHAR(50) NOT NULL,

    INDEX `user_id_mesin`(`user_id_mesin`),
    PRIMARY KEY (`check_io_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `user_id_mesin` ON `employee`(`user_id_mesin`);
