-- AlterTable
ALTER TABLE `employee` ADD COLUMN `workhour` SMALLINT NOT NULL DEFAULT 8;

-- CreateTable
CREATE TABLE `setting` (
    `setting_id` VARCHAR(40) NOT NULL,
    `start_periode` SMALLINT NOT NULL DEFAULT 17,
    `end_periode` SMALLINT NOT NULL DEFAULT 16,

    PRIMARY KEY (`setting_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spl` (
    `spl_id` VARCHAR(40) NOT NULL,
    `payroll` VARCHAR(8) NULL,
    `description` TEXT NOT NULL,
    `datetime_start` DATETIME(0) NOT NULL,
    `datetime_end` DATETIME(0) NOT NULL,
    `createdBy` VARCHAR(8) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `createdBy`(`createdBy`),
    INDEX `payroll`(`payroll`),
    PRIMARY KEY (`spl_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `spl` ADD CONSTRAINT `spl_createBy_by_fkey` FOREIGN KEY (`createdBy`) REFERENCES `employee`(`payroll`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spl` ADD CONSTRAINT `spl_payroll_by_fkey` FOREIGN KEY (`payroll`) REFERENCES `employee`(`payroll`) ON DELETE SET NULL ON UPDATE CASCADE;
