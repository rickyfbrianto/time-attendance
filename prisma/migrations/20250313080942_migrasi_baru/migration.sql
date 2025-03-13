-- CreateTable
CREATE TABLE `employee` (
    `payroll` VARCHAR(8) NOT NULL,
    `user_id_machine` VARCHAR(6) NOT NULL,
    `profile_id` VARCHAR(50) NULL,
    `email` VARCHAR(100) NOT NULL,
    `name` VARCHAR(250) NOT NULL,
    `password` VARCHAR(250) NOT NULL,
    `position` VARCHAR(100) NOT NULL,
    `department` VARCHAR(4) NOT NULL,
    `location` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(13) NOT NULL,
    `signature` VARCHAR(250) NOT NULL,

    UNIQUE INDEX `user_id_mesin`(`user_id_machine`),
    UNIQUE INDEX `Employee_Email_key`(`email`),
    INDEX `Employee_profile_id_fkey`(`profile_id`),
    PRIMARY KEY (`payroll`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile` (
    `profile_id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `level` ENUM('L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9') NOT NULL,
    `user_hrd` BOOLEAN NOT NULL,
    `delegation` BOOLEAN NOT NULL,
    `access_sppd` VARCHAR(4) NOT NULL,
    `access_skpd` VARCHAR(4) NOT NULL,
    `access_attendance` VARCHAR(4) NOT NULL,
    `access_spl` VARCHAR(4) NOT NULL,
    `access_srl` VARCHAR(4) NOT NULL,
    `access_cuti` VARCHAR(4) NOT NULL,
    `access_calendar` VARCHAR(4) NOT NULL,
    `access_user` VARCHAR(4) NOT NULL,
    `access_profile` VARCHAR(4) NOT NULL,

    PRIMARY KEY (`profile_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `check_io` (
    `check_io_id` VARCHAR(40) NOT NULL,
    `user_id_machine` VARCHAR(6) NULL,
    `datetime` DATETIME(0) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `Check_io_user_id_mesin_fkey`(`user_id_machine`),
    PRIMARY KEY (`check_io_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance` (
    `attendance_id` VARCHAR(40) NOT NULL,
    `user_id_machine` VARCHAR(6) NULL,
    `datetime` DATETIME(0) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `attachment` TEXT NULL,
    `createdBy` VARCHAR(8) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `createdBy`(`createdBy`),
    INDEX `user_id_mesin`(`user_id_machine`),
    PRIMARY KEY (`attendance_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `temp_check_io` (
    `check_io_id` VARCHAR(40) NOT NULL,
    `user_id_machine` VARCHAR(6) NOT NULL,
    `datetime` DATETIME(0) NOT NULL,
    `type` VARCHAR(50) NOT NULL,

    INDEX `user_id_mesin`(`user_id_machine`),
    PRIMARY KEY (`check_io_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendar` (
    `calendar_id` VARCHAR(40) NOT NULL,
    `description` VARCHAR(255) NULL,
    `type` ENUM('Hari Libur', 'Cuti Bersama', 'Event Kantor') NULL,
    `date` DATE NULL,

    PRIMARY KEY (`calendar_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employee` ADD CONSTRAINT `Employee_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profile`(`profile_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `check_io` ADD CONSTRAINT `Check_io_user_id_machine_fkey` FOREIGN KEY (`user_id_machine`) REFERENCES `employee`(`user_id_machine`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `Attendance_created_by_fkey` FOREIGN KEY (`createdBy`) REFERENCES `employee`(`payroll`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `Attendance_user_id_machine_fkey` FOREIGN KEY (`user_id_machine`) REFERENCES `employee`(`user_id_machine`) ON DELETE SET NULL ON UPDATE CASCADE;
