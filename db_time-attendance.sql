-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 18, 2025 at 05:36 AM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_time-attendance`
--

DELIMITER $$
--
-- Functions
--
CREATE DEFINER=`root`@`%` FUNCTION `getHakCuti` (`start_date` DATE, `end_date` DATE) RETURNS INT(3) DETERMINISTIC NO SQL BEGIN
	#Routine body goes here...
	DECLARE thn int(3);
	DECLARE thn2 int(3);
	DECLARE m1 int(2);
	DECLARE m2 int(2);
	DECLARE y1 int(4);
	DECLARE y2 int(4);
	#DECLARE cuti_bersama SMALLINT(2);
	
	set m1=DATE_FORMAT(start_date,'%m');
	set m2=DATE_FORMAT(end_date,'%m');
	set y1=DATE_FORMAT(start_date,'%Y');
	set y2=DATE_FORMAT(end_date,'%Y');
	
	#SELECT count(*) into cuti_bersama from calendar WHERE type='Cuti Bersama' and date BETWEEN DATE(CONCAT(year(end_date),'-01-01')) AND end_date;
	
	set thn=y2-y1;
	If thn < 1 Then
    set thn2=0;
	ElseIf thn >= 1 And thn < 5 Then
		If thn = 1 Then
			If Month(start_date) > Month(end_date) Then
					set thn2=0;
			Else
					set thn2=12;
			End If;
		Else
				set thn2=12;
		End If;
	ElseIf thn = 5 Then
		If Month(start_date) > Month(end_date) Then
				set thn2=12;
		Else
				set thn2=18;
		End If;
	ElseIf mod(thn,5) = 0 Then
		If Month(start_date) > Month(end_date) Then
				set thn2=18;
		Else
				set thn2=24;
		End If;
	Else
			set thn2=18;
	End If;
	#RETURN thn2-cuti_bersama;
    RETURN thn2;
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `getNomorSKPD` () RETURNS VARCHAR(40) CHARSET utf8mb4 COLLATE utf8mb4_general_ci  BEGIN
	DECLARE lastID tinyint(4);
    DECLARE newID varchar(40);
    DECLARE pembatas varchar(1) DEFAULT '_';
	SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(skpd_id, '${pembatas}', 1), '-', 1) AS unsigned)), 0) as id INTO lastID from SKPD where SUBSTRING_INDEX(SUBSTRING_INDEX(skpd_id, '${pembatas}', -1), '-', -1) = year(now());
    
    set newID = CONCAT(lastID + 1, "-SKPD_HR-GA_STM_", LPAD(MONTH(NOW()), 2, '0'),"-",year(now()));
    
    return newID;
END$$

CREATE DEFINER=`root`@`%` FUNCTION `GetStartOvertime` (`check_in` DATETIME, `check_out` DATETIME, `workhour` TINYINT) RETURNS DATETIME  BEGIN
	DECLARE is_holiday TINYINT(1);
	
	SELECT COUNT(*) into is_holiday from calendar where date = DATE(check_in) AND type IN ('Hari Libur','Event Kantor') limit 1;
		
	IF (DAYNAME(check_in) IN ('Saturday','Sunday') AND workhour=8) OR (DAYNAME(check_in)='Sunday' AND workhour=7) OR is_holiday THEN
		RETURN check_in;
	ELSEIF DAYNAME(check_in)='Saturday' AND workhour=7 THEN
		BEGIN
			IF TIMESTAMPDIFF(HOUR,check_in,check_out)<=6 THEN
				RETURN DATE_ADD(check_in,INTERVAL 5 HOUR);
			ELSE
				RETURN DATE_ADD(check_in,INTERVAL 6 HOUR); #check out >=15:00:00
			END IF;
		END;
	ELSE
		RETURN DATE_ADD(check_in,INTERVAL workhour+1 HOUR);
	END IF;
END$$

CREATE DEFINER=`root`@`%` FUNCTION `RoundCheckOut` (`check_in` DATETIME, `check_out` DATETIME) RETURNS DATETIME  BEGIN
	
	DECLARE is_holiday TINYINT(1);
	DECLARE co_minute TINYINT(2);
	#DECLARE worktime TINYINT(2);
	
	set co_minute = MINUTE(check_out);
	
	
	select if(count(*)>0,1,0) into is_holiday from calendar where type IN ('Hari Libur','Event Kantor') and date=DATE_FORMAT(check_in,'%Y-%m-%d');
	
	if(DAYNAME(check_in)='Friday' and is_holiday and DATE_FORMAT(check_out,'%H:%i')>='11:00' and DATE_FORMAT(check_out,'%H:%i')<'13:00') THEN
		return STR_TO_DATE(concat(DATE_FORMAT(check_out,'%Y-%m-%d'),' 13:00:00'),'%Y-%m-%d %H:%i:%s');
	elseif co_minute>15 then
		RETURN DATE_ADD(check_out,INTERVAL (60-co_minute) MINUTE);
	ELSE
		RETURN check_out;
	end if;
	
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `attendance_id` varchar(40) NOT NULL,
  `user_id_machine` varchar(6) DEFAULT NULL,
  `check_in` datetime NOT NULL,
  `check_out` datetime NOT NULL,
  `check_in2` datetime DEFAULT NULL,
  `check_out2` datetime DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `ijin_info` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL,
  `attachment` text DEFAULT NULL,
  `createdBy` varchar(8) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`attendance_id`, `user_id_machine`, `check_in`, `check_out`, `check_in2`, `check_out2`, `type`, `ijin_info`, `description`, `attachment`, `createdBy`, `createdAt`) VALUES
('01cff88c-b9f0-454f-be45-3bc8725fea9e', '707', '2025-04-07 00:00:00', '2025-04-07 00:00:00', NULL, NULL, 'Sakit', '', '', NULL, '202207', '2025-04-17 15:43:29'),
('1b58214e-b7a0-4035-82ec-7cf066833f1a', '707', '2025-04-09 08:00:00', '2025-04-09 17:00:00', NULL, NULL, 'HKM', '', 'HKM', NULL, '202207', '2025-04-17 15:43:29'),
('3399313d-bfb1-407f-ab5e-171ba950345c', '707', '2025-04-08 00:00:00', '2025-04-08 00:00:00', NULL, NULL, 'Sakit', '', '', NULL, '202207', '2025-04-17 15:43:29'),
('471f916f-dda8-457e-b1a9-180b21bab207', '707', '2025-04-04 08:00:00', '2025-04-04 17:00:00', NULL, NULL, 'HKM', '', '', NULL, '214505', '2025-04-18 08:53:41'),
('88388b8c-951a-49df-9da5-6d9cbbded135', '707', '2025-04-03 00:00:00', '2025-04-03 00:00:00', NULL, NULL, 'Sakit', '', '', NULL, '202207', '2025-04-17 15:43:29'),
('9438781a-1c05-11f0-b115-0492263d7fc5', '707', '2025-04-04 00:00:00', '2025-04-04 00:00:00', NULL, NULL, 'Cuti Tahunan', '', 'Mau jalan2', NULL, NULL, '2025-04-18 11:31:13'),
('a448d1ed-1b36-11f0-b115-0492263d7fc5', '111', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', NULL, NULL, '2025-04-17 10:49:54'),
('a448d449-1b36-11f0-b115-0492263d7fc5', '112', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', NULL, NULL, '2025-04-17 10:49:54'),
('a448d4e4-1b36-11f0-b115-0492263d7fc5', '229', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', NULL, NULL, '2025-04-17 10:49:54'),
('c80980a9-9db0-4f0a-b813-e6191cfde50f', '707', '2025-04-04 00:00:00', '2025-04-04 00:00:00', NULL, NULL, 'Sakit', '', '', NULL, '202207', '2025-04-17 15:43:29'),
('e826e001-1c03-11f0-b115-0492263d7fc5', '112', '2025-04-17 00:00:00', '2025-04-17 00:00:00', NULL, NULL, 'Cuti Tahunan', '', 'Ibadah Haji (asdasdasd)', NULL, NULL, '2025-04-18 11:19:14');

--
-- Triggers `attendance`
--
DELIMITER $$
CREATE TRIGGER `attendance_update_ondelete` AFTER DELETE ON `attendance` FOR EACH ROW BEGIN
	DECLARE temp_payroll varchar (8);
    SELECT payroll INTO temp_payroll FROM employee WHERE user_id_machine = OLD.user_id_machine;
    
    IF OLD.type = 'Cuti Tahunan' THEN 
    	UPDATE cuti SET status = 'Cancelled' WHERE date = DATE(OLD.check_in) AND payroll = temp_payroll COLLATE utf8mb4_unicode_ci;
   	ELSEIF OLD.type = 'Ijin Resmi' THEN 
    	UPDATE ijin SET status = 'Cancelled' WHERE date = DATE(OLD.check_in) AND payroll = temp_payroll COLLATE utf8mb4_unicode_ci;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `calendar`
--

CREATE TABLE `calendar` (
  `calendar_id` varchar(40) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `type` enum('Hari Libur','Cuti Bersama','Event Kantor') DEFAULT NULL,
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `calendar`
--

INSERT INTO `calendar` (`calendar_id`, `description`, `type`, `date`) VALUES
('123', 'Tes', 'Cuti Bersama', '2025-04-02'),
('1f03f582-57f1-492b-90f4-f51e2ff99fa7', 'Cuti Bersama Paskah', 'Cuti Bersama', '2025-04-18');

--
-- Triggers `calendar`
--
DELIMITER $$
CREATE TRIGGER `cal_delete_attendance` AFTER DELETE ON `calendar` FOR EACH ROW BEGIN
	DELETE FROM attendance WHERE date(check_in)=OLD.date and type=OLD.type; 
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `cal_insert_attendance` AFTER INSERT ON `calendar` FOR EACH ROW BEGIN
	#check & delete related cuti & ijin
	
	DELETE FROM attendance WHERE date(check_in)=NEW.date and type not in('HKM','HKC');
	
	UPDATE cuti SET `status`='Cancelled' WHERE date=NEW.date;
	
	UPDATE ijin SET `status`='Cancelled' WHERE date=NEW.date;
		
	#insert calendar record to attendance
	INSERT INTO attendance(attendance_id,user_id_machine,check_in,check_out,type,description) SELECT UUID(),user_id_machine,NEW.date,NEW.date,NEW.type,NEW.description from employee;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `cal_update_attendance` AFTER UPDATE ON `calendar` FOR EACH ROW BEGIN
	
	UPDATE attendance SET check_in=NEW.date,check_out=NEW.date,type=NEW.type,description=NEW.description WHERE DATE(check_in)=OLD.date and type=OLD.type;
	
	IF NEW.date<>OLD.date THEN
		DELETE FROM attendance WHERE date(check_in)=OLD.date and type not in('HKM','HKC');
	
		UPDATE cuti SET `status`='Cancelled' WHERE date=NEW.date;
	
		UPDATE ijin SET `status`='Cancelled' WHERE date=NEW.date;
	END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `check_io`
--

CREATE TABLE `check_io` (
  `check_io_id` varchar(40) NOT NULL,
  `user_id_machine` varchar(6) DEFAULT NULL,
  `check_in` datetime NOT NULL,
  `check_out` datetime NOT NULL,
  `type` varchar(50) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cuti`
--

CREATE TABLE `cuti` (
  `cuti_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payroll` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `year` smallint(4) NOT NULL,
  `status` enum('Waiting','Reject','Approved','Cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `approval` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cuti`
--

INSERT INTO `cuti` (`cuti_id`, `payroll`, `type`, `description`, `date`, `year`, `status`, `approval`, `createdAt`) VALUES
('285c2488-3bc0-4c81-9c2a-d32b3a6bcdbd', '213514', 'Ibadah Haji', 'asdasdasd', '2025-04-17', 2025, 'Approved', '214505', '2025-04-17 11:14:53'),
('4409a274-c25c-458e-bf25-194af6c3255a', '202207', 'Cuti Tahunan', 'Mau jalan2', '2025-04-03', 2025, 'Cancelled', '214505', '2025-04-18 11:29:50'),
('61c1e9fd-a820-4a26-82cc-4a15d4bd027f', '202207', 'Bencana Alam', 'banjir', '2025-04-17', 2025, 'Cancelled', '214505', '2025-04-16 17:06:24'),
('6f91d605-aee3-4b8d-bcfc-9e6ed89fe368', '202207', 'Bencana Alam', 'banjir', '2025-04-21', 2025, 'Waiting', '214505', '2025-04-16 17:06:24'),
('bb104483-734e-4178-b652-5229242a5e30', '202207', 'Cuti Tahunan', 'Mau jalan2', '2025-04-04', 2025, 'Approved', '214505', '2025-04-18 11:29:50');

--
-- Triggers `cuti`
--
DELIMITER $$
CREATE TRIGGER `cuti_onapproved_insert_attendace` AFTER UPDATE ON `cuti` FOR EACH ROW BEGIN
	IF NEW.status = 'Approved' THEN
		INSERT INTO attendance(attendance_id,user_id_machine,check_in,check_out,type,description) SELECT UUID(),user_id_machine,NEW.date,NEW.date, NEW.type, NEW.description from employee where payroll=NEW.payroll;
	END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `dept`
--

CREATE TABLE `dept` (
  `dept_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dept_code` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `initial` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Aktif','Nonaktif') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dept`
--

INSERT INTO `dept` (`dept_id`, `dept_code`, `initial`, `name`, `status`) VALUES
('9f251207-0bf9-41cd-82f4-08ed9f6eae95', '1004', 'CAT', 'Cementing & assembly', 'Aktif'),
('a3b885be-a168-46ba-9124-c9fbd7a188e3', '5003', 'MIS', 'Management Information System', 'Aktif');

-- --------------------------------------------------------

--
-- Table structure for table `employee`
--

CREATE TABLE `employee` (
  `payroll` varchar(8) NOT NULL,
  `user_id_machine` varchar(6) NOT NULL,
  `profile_id` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `name` varchar(250) NOT NULL,
  `password` varchar(250) NOT NULL,
  `position` varchar(100) NOT NULL,
  `department` varchar(6) DEFAULT NULL,
  `location` varchar(100) NOT NULL,
  `phone` varchar(13) NOT NULL,
  `workhour` smallint(6) NOT NULL DEFAULT 8,
  `approver` varchar(8) DEFAULT NULL,
  `substitute` varchar(8) DEFAULT NULL,
  `join_date` date NOT NULL DEFAULT current_timestamp(),
  `signature` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employee`
--

INSERT INTO `employee` (`payroll`, `user_id_machine`, `profile_id`, `email`, `name`, `password`, `position`, `department`, `location`, `phone`, `workhour`, `approver`, `substitute`, `join_date`, `signature`) VALUES
('202201', '111', 'Profile1', 'tes@gmail.com', 'Ryan', 'U2FsdGVkX1+3TI3S25xViylQlkOJSAlttKWbP8gUX44=', 'Staff', '1004', 'Samarinda', '081234561234', 8, NULL, '213514', '2025-02-11', 'tes'),
('202207', '707', '4483d746-9046-45d3-a08b-f5ff80d81e54', 'ricky@sagatade.co.id', 'Tjoa Ricky Febrianto', 'U2FsdGVkX1+3TI3S25xViylQlkOJSAlttKWbP8gUX44=\r\n', 'Staff IT', '5003', 'Samarinda', '085245368842', 8, '214505', '213514', '2024-03-25', '123'),
('213514', '112', 'Profile1', 'dedy@sagatrade.co.id', 'Dedy Setiawan', 'U2FsdGVkX1+3TI3S25xViylQlkOJSAlttKWbP8gUX44=', 'Staff', '5003', 'Samarinda', '081234561234', 8, '214505', '202201', '2025-04-16', 'Tes'),
('214505', '229', 'Profile1', 'syamsuddin@sagatrade.co.id', 'Udhin', 'U2FsdGVkX1+3TI3S25xViylQlkOJSAlttKWbP8gUX44=\r\n', 'Kasi IT', '5003', 'Samarinda', '081244608676', 8, NULL, '213514', '2023-02-10', 'x_x');

--
-- Triggers `employee`
--
DELIMITER $$
CREATE TRIGGER `emp_insert_attendance` AFTER INSERT ON `employee` FOR EACH ROW BEGIN
	INSERT INTO attendance(attendance_id,user_id_machine,check_in,check_out,type,description) SELECT UUID(),NEW.user_id_machine,date,date,type,description from calendar;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `ijin`
--

CREATE TABLE `ijin` (
  `ijin_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payroll` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `status` enum('Waiting','Reject','Approved','Cancelled') NOT NULL,
  `approval` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `ijin`
--
DELIMITER $$
CREATE TRIGGER `ijin_onapproved_insert_atttendance` AFTER UPDATE ON `ijin` FOR EACH ROW BEGIN
	IF NEW.Status<>OLD.Status and NEW.Status='Approved' THEN
		INSERT INTO attendance(attendance_id,user_id_machine,check_in,check_out,type,description) SELECT UUID(),user_id_machine,NEW.date,NEW.date,NEW.type,NEW.description from employee where payroll=NEW.payroll;
	END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `profile`
--

CREATE TABLE `profile` (
  `profile_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `level` tinyint(4) NOT NULL,
  `user_hrd` tinyint(1) NOT NULL,
  `access_sppd` varchar(4) NOT NULL,
  `access_skpd` varchar(4) NOT NULL,
  `access_attendance` varchar(4) NOT NULL,
  `access_spl` varchar(4) NOT NULL,
  `access_srl` varchar(4) NOT NULL,
  `access_cuti` varchar(4) NOT NULL,
  `access_ijin` varchar(4) NOT NULL,
  `access_calendar` varchar(4) NOT NULL,
  `access_user` varchar(4) NOT NULL,
  `access_profile` varchar(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `profile`
--

INSERT INTO `profile` (`profile_id`, `name`, `description`, `level`, `user_hrd`, `access_sppd`, `access_skpd`, `access_attendance`, `access_spl`, `access_srl`, `access_cuti`, `access_ijin`, `access_calendar`, `access_user`, `access_profile`) VALUES
('4483d746-9046-45d3-a08b-f5ff80d81e54', 'Staff IT', 'Staff IT', 2, 1, 'CRUD', 'C', 'CRUD', 'C', 'C', 'C', 'C', 'C', 'C', 'CRUD'),
('Profile1', 'Kasubsi IT', 'Kasubsi IT', 2, 1, 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CR', 'CR', 'CRUD');

-- --------------------------------------------------------

--
-- Table structure for table `setting`
--

CREATE TABLE `setting` (
  `setting_id` varchar(40) NOT NULL,
  `start_periode` tinyint(6) NOT NULL DEFAULT 17,
  `end_periode` tinyint(6) NOT NULL DEFAULT 16
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `setting`
--

INSERT INTO `setting` (`setting_id`, `start_periode`, `end_periode`) VALUES
('156d422d-60ae-4c6c-947a-adbfd6f535c0', 17, 16);

-- --------------------------------------------------------

--
-- Table structure for table `skpd`
--

CREATE TABLE `skpd` (
  `skpd_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'getNomorSKPD()',
  `sppd_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payroll` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `real_start` datetime NOT NULL,
  `real_end` datetime NOT NULL,
  `status` enum('OPEN','CLOSE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdBy` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `skpd`
--

INSERT INTO `skpd` (`skpd_id`, `sppd_id`, `payroll`, `real_start`, `real_end`, `status`, `createdBy`, `createdAt`) VALUES
('3-SKPD_HR-GA_STM_04-2025', '1-SPPD_MIS_STM_04-2025', '202207', '2025-04-24 00:00:00', '2025-04-26 00:00:00', 'OPEN', '202207', '2025-04-16 09:46:36'),
('4-SKPD_HR-GA_STM_04-2025', '2-SPPD_MIS_STM_04-2025', '202207', '2025-04-22 00:00:00', '2025-04-30 00:00:00', 'OPEN', '202207', '2025-04-16 10:00:25'),
('5-SKPD_HR-GA_STM_04-2025', '2-SPPD_MIS_STM_04-2025', '214505', '2025-04-22 00:00:00', '2025-04-30 00:00:00', 'OPEN', '202207', '2025-04-16 10:00:25');

-- --------------------------------------------------------

--
-- Table structure for table `spl`
--

CREATE TABLE `spl` (
  `spl_id` varchar(40) NOT NULL,
  `purpose` varchar(255) NOT NULL,
  `est_start` datetime NOT NULL,
  `est_end` datetime NOT NULL,
  `createdBy` varchar(8) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `spl`
--

INSERT INTO `spl` (`spl_id`, `purpose`, `est_start`, `est_end`, `createdBy`, `createdAt`) VALUES
('1-SPL_MIS_STM_04-2025', 'tes lemnbur', '2025-04-14 17:00:00', '2025-04-14 18:00:00', '202207', '2025-04-17 08:54:54');

-- --------------------------------------------------------

--
-- Table structure for table `spl_detail`
--

CREATE TABLE `spl_detail` (
  `spl_detail_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `step` tinyint(6) NOT NULL,
  `spl_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payroll` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `spl_detail`
--

INSERT INTO `spl_detail` (`spl_detail_id`, `step`, `spl_id`, `payroll`, `description`) VALUES
('3ae2e18d-9f85-4236-b064-08beaf59a871', 0, '1-SPL_MIS_STM_04-2025', '202207', 'tesaa');

-- --------------------------------------------------------

--
-- Table structure for table `sppd`
--

CREATE TABLE `sppd` (
  `sppd_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dept` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `duration` tinyint(4) NOT NULL,
  `createdBy` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sppd`
--

INSERT INTO `sppd` (`sppd_id`, `purpose`, `location`, `dept`, `start_date`, `end_date`, `duration`, `createdBy`, `createdAt`) VALUES
('1-SPPD_MIS_STM_04-2025', 'Dinas Jakarta', 'Jakarta', '5003', '2025-04-24 00:00:00', '2025-04-26 00:00:00', 2, '202207', '2025-04-12 17:52:12'),
('2-SPPD_MIS_STM_04-2025', 'Dinas ke bontang', 'Bontang', '5003', '2025-04-22 00:00:00', '2025-04-30 00:00:00', 8, '202207', '2025-04-12 18:00:08');

-- --------------------------------------------------------

--
-- Table structure for table `sppd_detail`
--

CREATE TABLE `sppd_detail` (
  `sppd_detail_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `step` tinyint(4) NOT NULL,
  `sppd_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payroll` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sppd_detail`
--

INSERT INTO `sppd_detail` (`sppd_detail_id`, `step`, `sppd_id`, `payroll`, `description`) VALUES
('bd8b0371-97e0-4af0-b4b1-3100566f3916', 1, '2-SPPD_MIS_STM_04-2025', '202207', 'Mengerjakan Time Attendance'),
('c203490e-3814-4284-8bfd-9cea5cb23e9a', 0, '1-SPPD_MIS_STM_04-2025', '202207', 'Time attendance'),
('dba7435e-ae4b-41fc-a46b-c8f4e7b86e50', 0, '2-SPPD_MIS_STM_04-2025', '214505', 'Mengerjakan laporan BC');

-- --------------------------------------------------------

--
-- Table structure for table `srl`
--

CREATE TABLE `srl` (
  `srl_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `spl_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payroll` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `real_start` datetime NOT NULL,
  `real_end` datetime NOT NULL,
  `status1` enum('Waiting','Reject','Approved','Cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `approval1` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status2` enum('Waiting','Reject','Approved','Cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `approval2` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `srl_detail`
--

CREATE TABLE `srl_detail` (
  `srl_detail_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `srl_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `status` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `temp_check_io`
--

CREATE TABLE `temp_check_io` (
  `check_io_id` varchar(40) NOT NULL,
  `user_id_machine` varchar(6) NOT NULL,
  `datetime` datetime NOT NULL,
  `type` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `temp_check_io`
--

INSERT INTO `temp_check_io` (`check_io_id`, `user_id_machine`, `datetime`, `type`) VALUES
('2d3de86f-baee-4b7a-aa55-4745398728a4', '229', '2005-05-03 18:58:59', 'Check Out'),
('530d02bd-dc90-44ad-936a-a03af51c8354', '229', '2005-05-03 18:56:34', 'Check Out'),
('f3678bfe-2c91-4d09-b7d2-9e8ba1acd79b', '229', '2005-05-03 18:56:34', 'Check Out'),
('fb87a489-77af-4d71-94e0-c9c426c88d39', '229', '2005-05-03 18:56:27', 'Check In');

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('54aa41ca-998b-49de-b2e5-79581a1122d9', 'd6a6f00e9ffb0973fcea3107d931d1e7bafd2bf5633762264836d7e1221f16e3', '2025-03-13 08:09:43.052', '20250313080942_migrasi_baru', NULL, NULL, '2025-03-13 08:09:42.915', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD KEY `createdBy` (`createdBy`),
  ADD KEY `user_id_mesin` (`user_id_machine`);

--
-- Indexes for table `calendar`
--
ALTER TABLE `calendar`
  ADD PRIMARY KEY (`calendar_id`),
  ADD UNIQUE KEY `date` (`date`);

--
-- Indexes for table `check_io`
--
ALTER TABLE `check_io`
  ADD PRIMARY KEY (`check_io_id`),
  ADD KEY `Check_io_user_id_mesin_fkey` (`user_id_machine`);

--
-- Indexes for table `cuti`
--
ALTER TABLE `cuti`
  ADD PRIMARY KEY (`cuti_id`),
  ADD KEY `payroll` (`payroll`),
  ADD KEY `approval` (`approval`);

--
-- Indexes for table `dept`
--
ALTER TABLE `dept`
  ADD PRIMARY KEY (`dept_id`),
  ADD UNIQUE KEY `dept_code` (`dept_code`);
ALTER TABLE `dept` ADD FULLTEXT KEY `dept_code_2` (`dept_code`,`name`);

--
-- Indexes for table `employee`
--
ALTER TABLE `employee`
  ADD PRIMARY KEY (`payroll`),
  ADD UNIQUE KEY `user_id_mesin` (`user_id_machine`),
  ADD UNIQUE KEY `Employee_Email_key` (`email`),
  ADD KEY `Employee_profile_id_fkey` (`profile_id`),
  ADD KEY `employee_department_fkey` (`department`),
  ADD KEY `approver` (`approver`),
  ADD KEY `substitute` (`substitute`);
ALTER TABLE `employee` ADD FULLTEXT KEY `payroll` (`payroll`,`user_id_machine`,`profile_id`,`email`,`name`,`position`,`department`,`location`,`phone`);

--
-- Indexes for table `ijin`
--
ALTER TABLE `ijin`
  ADD PRIMARY KEY (`ijin_id`),
  ADD KEY `payroll` (`payroll`),
  ADD KEY `approval` (`approval`);

--
-- Indexes for table `profile`
--
ALTER TABLE `profile`
  ADD PRIMARY KEY (`profile_id`);

--
-- Indexes for table `setting`
--
ALTER TABLE `setting`
  ADD PRIMARY KEY (`setting_id`);

--
-- Indexes for table `skpd`
--
ALTER TABLE `skpd`
  ADD PRIMARY KEY (`skpd_id`),
  ADD KEY `sppd_id` (`sppd_id`),
  ADD KEY `payroll` (`payroll`),
  ADD KEY `createdBy` (`createdBy`);

--
-- Indexes for table `spl`
--
ALTER TABLE `spl`
  ADD PRIMARY KEY (`spl_id`),
  ADD KEY `createdBy` (`createdBy`);

--
-- Indexes for table `spl_detail`
--
ALTER TABLE `spl_detail`
  ADD PRIMARY KEY (`spl_detail_id`),
  ADD KEY `spl_id` (`spl_id`),
  ADD KEY `payroll` (`payroll`);

--
-- Indexes for table `sppd`
--
ALTER TABLE `sppd`
  ADD PRIMARY KEY (`sppd_id`),
  ADD KEY `dept` (`dept`),
  ADD KEY `createdBy` (`createdBy`);

--
-- Indexes for table `sppd_detail`
--
ALTER TABLE `sppd_detail`
  ADD PRIMARY KEY (`sppd_detail_id`),
  ADD KEY `sppd_id` (`sppd_id`),
  ADD KEY `payroll` (`payroll`);

--
-- Indexes for table `srl`
--
ALTER TABLE `srl`
  ADD PRIMARY KEY (`srl_id`),
  ADD KEY `spl_id` (`spl_id`),
  ADD KEY `payroll` (`payroll`),
  ADD KEY `approval` (`approval1`),
  ADD KEY `approval2` (`approval2`);

--
-- Indexes for table `srl_detail`
--
ALTER TABLE `srl_detail`
  ADD PRIMARY KEY (`srl_detail_id`),
  ADD KEY `srl_id` (`srl_id`);

--
-- Indexes for table `temp_check_io`
--
ALTER TABLE `temp_check_io`
  ADD PRIMARY KEY (`check_io_id`),
  ADD KEY `user_id_mesin` (`user_id_machine`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `Attendance_created_by_fkey` FOREIGN KEY (`createdBy`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Attendance_user_id_machine_fkey` FOREIGN KEY (`user_id_machine`) REFERENCES `employee` (`user_id_machine`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `check_io`
--
ALTER TABLE `check_io`
  ADD CONSTRAINT `Check_io_user_id_machine_fkey` FOREIGN KEY (`user_id_machine`) REFERENCES `employee` (`user_id_machine`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `cuti`
--
ALTER TABLE `cuti`
  ADD CONSTRAINT `cuti_approval_fkey` FOREIGN KEY (`approval`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `cuti_payroll_fkey` FOREIGN KEY (`payroll`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `employee`
--
ALTER TABLE `employee`
  ADD CONSTRAINT `Employee_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profile` (`profile_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `employee_approver_fkey` FOREIGN KEY (`approver`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `employee_department_fkey` FOREIGN KEY (`department`) REFERENCES `dept` (`dept_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `employee_substitute_fkey` FOREIGN KEY (`substitute`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `ijin`
--
ALTER TABLE `ijin`
  ADD CONSTRAINT `ijin_approval_fkey` FOREIGN KEY (`approval`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ijin_payroll_fkey` FOREIGN KEY (`payroll`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `skpd`
--
ALTER TABLE `skpd`
  ADD CONSTRAINT `skpd_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `skpd_payroll_fkey` FOREIGN KEY (`payroll`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `skpd_sppd_id_fkey` FOREIGN KEY (`sppd_id`) REFERENCES `sppd` (`sppd_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `spl`
--
ALTER TABLE `spl`
  ADD CONSTRAINT `spl_createBy_by_fkey` FOREIGN KEY (`createdBy`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `spl_detail`
--
ALTER TABLE `spl_detail`
  ADD CONSTRAINT `spl_detail_payroll_fkey` FOREIGN KEY (`payroll`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `spl_detail_spl_id_fkey` FOREIGN KEY (`spl_id`) REFERENCES `spl` (`spl_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `sppd`
--
ALTER TABLE `sppd`
  ADD CONSTRAINT `sppd_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `sppd_dept_fkey` FOREIGN KEY (`dept`) REFERENCES `dept` (`dept_code`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `sppd_detail`
--
ALTER TABLE `sppd_detail`
  ADD CONSTRAINT `sppd_detail_payroll_fkey` FOREIGN KEY (`payroll`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `sppd_detail_sppd_id_fkey` FOREIGN KEY (`sppd_id`) REFERENCES `sppd` (`sppd_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `srl`
--
ALTER TABLE `srl`
  ADD CONSTRAINT `srl_approval1_fkey` FOREIGN KEY (`approval1`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `srl_approval2_fkey` FOREIGN KEY (`approval2`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `srl_payroll_fkey` FOREIGN KEY (`payroll`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `srl_spl_id_fkey` FOREIGN KEY (`spl_id`) REFERENCES `spl` (`spl_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `srl_detail`
--
ALTER TABLE `srl_detail`
  ADD CONSTRAINT `srl_detail_srl_id_fkey` FOREIGN KEY (`srl_id`) REFERENCES `srl` (`srl_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
