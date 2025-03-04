-- CreateTable
CREATE TABLE `employee` (
    `payroll` VARCHAR(8) NOT NULL,
    `profile_id` VARCHAR(50) NULL,
    `card_no` VARCHAR(100) NOT NULL,
    `name` VARCHAR(250) NOT NULL,
    `password` VARCHAR(250) NOT NULL,
    `jabatan` VARCHAR(100) NOT NULL,
    `department` VARCHAR(4) NOT NULL,
    `location` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(13) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `signature` VARCHAR(250) NOT NULL,

    UNIQUE INDEX `Employee_Email_key`(`email`),
    INDEX `Employee_profile_id_fkey`(`profile_id`),
    PRIMARY KEY (`payroll`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile` (
    `profile_id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `level` ENUM('0', '1', '2', '3', '4', '5', '6', '7', '8', '9') NOT NULL,
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

-- AddForeignKey
ALTER TABLE `employee` ADD CONSTRAINT `Employee_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profile`(`profile_id`) ON DELETE SET NULL ON UPDATE CASCADE;
