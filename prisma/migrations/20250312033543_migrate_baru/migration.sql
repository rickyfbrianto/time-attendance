/*
  Warnings:

  - A unique constraint covering the columns `[user_id_mesin]` on the table `employee` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `user_id_mesin` ON `check_io`;

-- DropIndex
DROP INDEX `user_id_mesin` ON `employee`;

-- AlterTable
ALTER TABLE `check_io` ADD COLUMN `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `user_id_mesin` VARCHAR(6) NULL;

-- CreateTable
CREATE TABLE `temp_check_io` (
    `check_io_id` VARCHAR(40) NOT NULL,
    `user_id_mesin` VARCHAR(6) NOT NULL,
    `waktu` DATETIME(0) NOT NULL,
    `type` VARCHAR(50) NOT NULL,

    INDEX `user_id_mesin`(`user_id_mesin`),
    PRIMARY KEY (`check_io_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `user_id_mesin` ON `employee`(`user_id_mesin`);
