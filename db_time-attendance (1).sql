-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 03, 2025 at 11:00 AM
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
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `insert_daily_attendance` ()   BEGIN
    DECLARE today_date DATE;
    SET today_date = CURDATE();

    -- Hanya insert jika belum ada data untuk tanggal hari ini
    INSERT INTO attendance 
(attendance_id,user_id_machine,check_in,check_out,check_in2,check_out2,type,ijin_info,description)
    SELECT 
uuid(), e.user_id_machine, CONCAT(today_date, ' 00:00:00'),CONCAT(today_date, ' 00:00:00'),
null,null,'','',''
    FROM 
        employee e
    WHERE NOT EXISTS (
        SELECT 1 FROM attendance a
        WHERE DATE(a.check_in) = today_date
        AND a.user_id_machine = e.user_id_machine
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `procedure_skpd_insert_attendance` (IN `payroll` VARCHAR(8), IN `start_date` DATE, IN `end_date` DATE, IN `description` VARCHAR(255))   BEGIN
	DECLARE date_now DATE;
    
    SET date_now = start_date;
    
    WHILE date_now <= end_date DO
    	INSERT INTO attendance(attendance_id,user_id_machine,check_in,check_out,type,description) 
        SELECT UUID(), user_id_machine, date_now, date_now, "Dinas", description from employee where payroll = payroll;
            
        SET date_now = DATE_ADD(date_now, INTERVAL 1 DAY);
    END WHILE;
END$$

--
-- Functions
--
CREATE DEFINER=`root`@`localhost` FUNCTION `getHakCuti` (`start_date` DATE, `end_date` DATE) RETURNS INT(3) DETERMINISTIC NO SQL BEGIN
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

CREATE DEFINER=`root`@`localhost` FUNCTION `GetStartOvertime` (`check_in` DATETIME, `check_out` DATETIME, `workhour` TINYINT) RETURNS DATETIME  BEGIN
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

CREATE DEFINER=`root`@`localhost` FUNCTION `RoundCheckOut` (`check_in` DATETIME, `check_out` DATETIME) RETURNS DATETIME  BEGIN
	
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
  `attachment` text NOT NULL,
  `createdBy` varchar(8) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`attendance_id`, `user_id_machine`, `check_in`, `check_out`, `check_in2`, `check_out2`, `type`, `ijin_info`, `description`, `attachment`, `createdBy`, `createdAt`) VALUES
('00603df3-27e4-11f0-acd8-80c5f2f97990', '801', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 14:01:00'),
('01cff88c-b9f0-454f-be45-3bc8725fea9e', '707', '2025-04-07 00:00:00', '2025-04-07 00:00:00', NULL, NULL, 'Sakit', '', '', '', '202207', '2025-04-17 15:43:29'),
('02c43f88-226d-11f0-acd8-80c5f2f97990', '803', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-26 15:06:42'),
('02c44290-226d-11f0-acd8-80c5f2f97990', '803', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-04-26 15:06:42'),
('1b58214e-b7a0-4035-82ec-7cf066833f1a', '707', '2025-04-09 08:00:00', '2025-04-09 17:00:00', NULL, NULL, 'HKM', '', 'HKM', '', '202207', '2025-04-17 15:43:29'),
('266bfd60-205c-11f0-acd8-80c5f2f97990', '121', '2025-04-24 00:00:00', '2025-04-24 00:00:00', NULL, NULL, 'HKM', '', '', '', NULL, '2025-04-24 00:01:00'),
('266bfea0-205c-11f0-acd8-80c5f2f97990', '112', '2025-04-24 00:00:00', '2025-04-24 00:00:00', NULL, NULL, 'HKM', '', '', '', NULL, '2025-04-24 00:01:00'),
('266bff63-205c-11f0-acd8-80c5f2f97990', '229', '2025-04-24 08:03:00', '2025-04-24 18:40:00', NULL, NULL, 'HKC', '', '', '', NULL, '2025-04-24 00:01:00'),
('2707dea5-2513-11f0-acd8-80c5f2f97990', '024', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-30 00:01:00'),
('2707dfed-2513-11f0-acd8-80c5f2f97990', '111', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-30 00:01:00'),
('2707e140-2513-11f0-acd8-80c5f2f97990', '112', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-30 00:01:00'),
('2707e259-2513-11f0-acd8-80c5f2f97990', '121', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-30 00:01:00'),
('2707e34b-2513-11f0-acd8-80c5f2f97990', '124', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-30 00:01:00'),
('2707e464-2513-11f0-acd8-80c5f2f97990', '229', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-30 00:01:00'),
('2707e67c-2513-11f0-acd8-80c5f2f97990', '803', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-30 00:01:00'),
('2707e76a-2513-11f0-acd8-80c5f2f97990', '826', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-30 00:01:00'),
('335d9214-226d-11f0-acd8-80c5f2f97990', '124', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-26 15:08:04'),
('335e0ce2-226d-11f0-acd8-80c5f2f97990', '124', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-04-26 15:08:04'),
('3399313d-bfb1-407f-ab5e-171ba950345c', '707', '2025-04-08 00:00:00', '2025-04-08 00:00:00', NULL, NULL, 'Sakit', '', '', '', '202207', '2025-04-17 15:43:29'),
('3d432474-35c6-4ce6-a7ca-686083c31064', '707', '2025-04-14 08:00:00', '2025-04-14 19:00:00', NULL, NULL, 'HKM', '', '', '', '202207', '2025-04-21 17:01:47'),
('471f916f-dda8-457e-b1a9-180b21bab207', '707', '2025-04-04 08:00:00', '2025-04-04 17:00:00', NULL, NULL, 'HKM', '', '', '', '214505', '2025-04-18 08:53:41'),
('512ce5d9-2125-11f0-acd8-80c5f2f97990', '121', '2025-04-25 00:00:00', '2025-04-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-25 00:01:00'),
('512ce6b3-2125-11f0-acd8-80c5f2f97990', '112', '2025-04-25 00:00:00', '2025-04-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-25 00:01:00'),
('512ce72e-2125-11f0-acd8-80c5f2f97990', '229', '2025-04-25 00:00:00', '2025-04-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-25 00:01:00'),
('51d6ea90-25dc-11f0-acd8-80c5f2f97990', '024', '2025-05-01 00:00:00', '2025-05-01 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-01 00:01:00'),
('51d6ecb8-25dc-11f0-acd8-80c5f2f97990', '111', '2025-05-01 00:00:00', '2025-05-01 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-01 00:01:00'),
('51d6ef36-25dc-11f0-acd8-80c5f2f97990', '112', '2025-05-01 00:00:00', '2025-05-01 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-01 00:01:00'),
('51d6f189-25dc-11f0-acd8-80c5f2f97990', '121', '2025-05-01 00:00:00', '2025-05-01 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-01 00:01:00'),
('51d6f280-25dc-11f0-acd8-80c5f2f97990', '124', '2025-05-01 00:00:00', '2025-05-01 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-01 00:01:00'),
('51d6f351-25dc-11f0-acd8-80c5f2f97990', '229', '2025-05-01 00:00:00', '2025-05-01 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-01 00:01:00'),
('51d6f481-25dc-11f0-acd8-80c5f2f97990', '707', '2025-05-01 08:00:00', '2025-05-01 17:08:00', NULL, NULL, 'HKM', '', '', '51d6f481-25dc-11f0-acd8-80c5f2f97990.jpg', '181124', '2025-05-01 00:01:00'),
('51d6f53a-25dc-11f0-acd8-80c5f2f97990', '803', '2025-05-01 00:00:00', '2025-05-01 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-01 00:01:00'),
('51d6f5e0-25dc-11f0-acd8-80c5f2f97990', '826', '2025-05-01 00:00:00', '2025-05-01 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-01 00:01:00'),
('718d836f-227e-11f0-acd8-80c5f2f97990', '111', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-26 17:11:29'),
('718d8b5b-227e-11f0-acd8-80c5f2f97990', '111', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-04-26 17:11:29'),
('7befb511-21ee-11f0-acd8-80c5f2f97990', '121', '2025-04-26 00:00:00', '2025-04-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-26 00:01:00'),
('7befb789-21ee-11f0-acd8-80c5f2f97990', '112', '2025-04-26 00:00:00', '2025-04-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-26 00:01:00'),
('7befb8bc-21ee-11f0-acd8-80c5f2f97990', '229', '2025-04-26 00:00:00', '2025-04-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-26 00:01:00'),
('7befb9d1-21ee-11f0-acd8-80c5f2f97990', '707', '2025-04-26 08:00:00', '2025-04-26 17:00:00', NULL, NULL, 'HKM', 'Permit', 'tes, mantap', '7befb9d1-21ee-11f0-acd8-80c5f2f97990.jpg', '214505', '2025-04-26 00:01:00'),
('7c9c2f8f-26a5-11f0-acd8-80c5f2f97990', '024', '2025-05-02 00:00:00', '2025-05-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-02 00:01:00'),
('7c9c31a6-26a5-11f0-acd8-80c5f2f97990', '111', '2025-05-02 00:00:00', '2025-05-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-02 00:01:00'),
('7c9c33e4-26a5-11f0-acd8-80c5f2f97990', '112', '2025-05-02 08:00:00', '2025-05-02 19:00:00', NULL, NULL, 'HKM', '', '', '', '291024', '2025-05-02 00:01:00'),
('7c9c3627-26a5-11f0-acd8-80c5f2f97990', '121', '2025-05-02 00:00:00', '2025-05-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-02 00:01:00'),
('7c9c37ab-26a5-11f0-acd8-80c5f2f97990', '124', '2025-05-02 00:00:00', '2025-05-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-02 00:01:00'),
('7c9c3944-26a5-11f0-acd8-80c5f2f97990', '229', '2025-05-02 00:00:00', '2025-05-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-02 00:01:00'),
('7c9c3cf3-26a5-11f0-acd8-80c5f2f97990', '707', '2025-05-02 08:00:00', '2025-05-02 18:25:00', NULL, NULL, 'HKM', '', '', '', '291024', '2025-05-02 00:01:00'),
('7c9c3f15-26a5-11f0-acd8-80c5f2f97990', '803', '2025-05-02 00:00:00', '2025-05-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-02 00:01:00'),
('7c9c40b2-26a5-11f0-acd8-80c5f2f97990', '826', '2025-05-02 00:00:00', '2025-05-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-02 00:01:00'),
('88388b8c-951a-49df-9da5-6d9cbbded135', '707', '2025-04-03 00:00:00', '2025-04-03 00:00:00', NULL, NULL, 'Sakit', '', '', '', '202207', '2025-04-17 15:43:29'),
('8e4bff37-226c-11f0-acd8-80c5f2f97990', '024', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-26 15:03:27'),
('8e4c525e-226c-11f0-acd8-80c5f2f97990', '024', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-04-26 15:03:27'),
('94d1364a-226e-11f0-acd8-80c5f2f97990', '024', '2025-04-26 00:00:00', '2025-04-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-26 15:17:57'),
('94d137a3-226e-11f0-acd8-80c5f2f97990', '124', '2025-04-26 00:00:00', '2025-04-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-26 15:17:57'),
('94d13919-226e-11f0-acd8-80c5f2f97990', '803', '2025-04-26 08:00:00', '2025-04-26 12:00:00', NULL, NULL, 'HKM', '', 'mantap, tes', '94d13919-226e-11f0-acd8-80c5f2f97990.jpg', '214505', '2025-04-26 15:17:57'),
('94d1397f-226e-11f0-acd8-80c5f2f97990', '826', '2025-04-26 00:00:00', '2025-04-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-26 15:17:57'),
('a448d1ed-1b36-11f0-b115-0492263d7fc5', '121', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-17 10:49:54'),
('a448d449-1b36-11f0-b115-0492263d7fc5', '112', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-17 10:49:54'),
('a448d4e4-1b36-11f0-b115-0492263d7fc5', '229', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-17 10:49:54'),
('a6ae9995-22b7-11f0-acd8-80c5f2f97990', '024', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-27 00:01:00'),
('a6ae9a8f-22b7-11f0-acd8-80c5f2f97990', '111', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-27 00:01:00'),
('a6ae9b7a-22b7-11f0-acd8-80c5f2f97990', '112', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-27 00:01:00'),
('a6ae9c63-22b7-11f0-acd8-80c5f2f97990', '121', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-27 00:01:00'),
('a6ae9d03-22b7-11f0-acd8-80c5f2f97990', '124', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-27 00:01:00'),
('a6ae9df1-22b7-11f0-acd8-80c5f2f97990', '229', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-27 00:01:00'),
('a6ae9f98-22b7-11f0-acd8-80c5f2f97990', '707', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-27 00:01:00'),
('a6aea043-22b7-11f0-acd8-80c5f2f97990', '803', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-27 00:01:00'),
('a6aea0e5-22b7-11f0-acd8-80c5f2f97990', '826', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-27 00:01:00'),
('a7679000-276e-11f0-acd8-80c5f2f97990', '121', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 00:01:00'),
('a76790cb-276e-11f0-acd8-80c5f2f97990', '124', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 00:01:00'),
('a76791e7-276e-11f0-acd8-80c5f2f97990', '229', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 00:01:00'),
('a7679362-276e-11f0-acd8-80c5f2f97990', '707', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 00:01:00'),
('a7679445-276e-11f0-acd8-80c5f2f97990', '803', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 00:01:00'),
('a7679511-276e-11f0-acd8-80c5f2f97990', '826', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 00:01:00'),
('b964d0dc-1f49-11f0-b2eb-0492263d7fc5', NULL, '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-22 15:16:36'),
('b964eec7-1f49-11f0-b2eb-0492263d7fc5', NULL, '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-04-22 15:16:36'),
('bdf4736c-20da-11f0-acd8-80c5f2f97990', '707', '2025-04-21 00:00:00', '2025-04-21 00:00:00', NULL, NULL, 'Bencana Alam', '', 'banjir', '', NULL, '2025-04-24 15:07:10'),
('c1d63416-c7c8-42ea-bda1-ba0970e57a48', '803', '2025-04-25 08:15:00', '2025-04-25 17:20:00', NULL, NULL, 'HKM', '', '', '', '214505', '2025-04-27 14:49:12'),
('c57e57ee-227f-11f0-acd8-80c5f2f97990', '111', '2025-04-26 00:00:00', '2025-04-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-26 17:21:00'),
('cbe81ed3-27e3-11f0-acd8-80c5f2f97990', NULL, '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-05-03 13:59:31'),
('cbe85f8c-27e3-11f0-acd8-80c5f2f97990', NULL, '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-05-03 13:59:31'),
('d17b82d5-2380-11f0-acd8-80c5f2f97990', '024', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d17b8885-2380-11f0-acd8-80c5f2f97990', '111', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d17b8bf6-2380-11f0-acd8-80c5f2f97990', '112', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d17b8f13-2380-11f0-acd8-80c5f2f97990', '121', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d17b9178-2380-11f0-acd8-80c5f2f97990', '124', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d17b9596-2380-11f0-acd8-80c5f2f97990', '229', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d17b9d12-2380-11f0-acd8-80c5f2f97990', '803', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d17ba01c-2380-11f0-acd8-80c5f2f97990', '826', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d839a4ac-226c-11f0-acd8-80c5f2f97990', '826', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-26 15:05:31'),
('d839d2e0-226c-11f0-acd8-80c5f2f97990', '826', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-04-26 15:05:31'),
('e087e372-9986-4f7b-ae0f-641ff6a0760f', '707', '2025-05-21 08:00:00', '2025-05-20 17:00:00', NULL, NULL, 'HKM', '', '', 'id.jpg', '181124', '2025-05-03 16:56:36'),
('e2b31e1a-27bc-11f0-acd8-80c5f2f97990', '024', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 09:21:00'),
('e2b3201b-27bc-11f0-acd8-80c5f2f97990', '111', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 09:21:00'),
('e2b3222b-27bc-11f0-acd8-80c5f2f97990', '112', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 09:21:00'),
('e826e001-1c03-11f0-b115-0492263d7fc5', '112', '2025-04-17 00:00:00', '2025-04-17 00:00:00', NULL, NULL, 'Cuti Tahunan', '', 'Ibadah Haji (asdasdasd)', '', NULL, '2025-04-18 11:19:14'),
('f0cc4b3f-200c-11f0-acd8-80c5f2f97990', '121', '2025-04-23 00:00:00', '2025-04-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-23 14:34:00'),
('f0cc4d47-200c-11f0-acd8-80c5f2f97990', '112', '2025-04-23 00:00:00', '2025-04-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-23 14:34:00'),
('f0cc4e23-200c-11f0-acd8-80c5f2f97990', '229', '2025-04-23 00:00:00', '2025-04-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-23 14:34:00'),
('f52353ba-27e3-11f0-acd8-80c5f2f97990', '801', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-05-03 14:00:41'),
('f523572b-27e3-11f0-acd8-80c5f2f97990', '801', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-05-03 14:00:41'),
('fc460b9c-2449-11f0-acd8-80c5f2f97990', '024', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00'),
('fc460d52-2449-11f0-acd8-80c5f2f97990', '111', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00'),
('fc460edd-2449-11f0-acd8-80c5f2f97990', '112', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00'),
('fc4610c1-2449-11f0-acd8-80c5f2f97990', '121', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00'),
('fc461247-2449-11f0-acd8-80c5f2f97990', '124', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00'),
('fc461421-2449-11f0-acd8-80c5f2f97990', '229', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00'),
('fc461736-2449-11f0-acd8-80c5f2f97990', '707', '2025-04-29 08:03:00', '2025-04-29 17:07:00', NULL, NULL, 'HKM', 'Permit', 'Telat aja 1 jam', 'fc461736-2449-11f0-acd8-80c5f2f97990.jpg', '181124', '2025-04-29 00:01:00'),
('fc4618b1-2449-11f0-acd8-80c5f2f97990', '803', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00'),
('fc4619f4-2449-11f0-acd8-80c5f2f97990', '826', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00');

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
-- Triggers `cuti`
--
DELIMITER $$
CREATE TRIGGER `cuti_onapproved_insert_attendace` AFTER UPDATE ON `cuti` FOR EACH ROW BEGIN
	IF NEW.status = 'Approved' THEN
		INSERT INTO attendance(attendance_id,user_id_machine,check_in,check_out,type,description) SELECT UUID(),user_id_machine,NEW.date,NEW.date, "Cuti Resmi", Concat(NEW.type, " - " ,NEW.description) from employee where payroll=NEW.payroll;
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
('11165938-324f-4adb-9301-ce525a0f33ce', '5001', 'FA', 'Finance And Accounting', 'Aktif'),
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
  `signature` varchar(250) NOT NULL,
  `status` enum('Aktif','Nonaktif') NOT NULL DEFAULT 'Aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employee`
--

INSERT INTO `employee` (`payroll`, `user_id_machine`, `profile_id`, `email`, `name`, `password`, `position`, `department`, `location`, `phone`, `workhour`, `approver`, `substitute`, `join_date`, `signature`, `status`) VALUES
('111111', '111', 'Profile1', 'itofficer5@sagatrade.co.id', 'Liner Hanger', 'U2FsdGVkX1/O7apo7/xtbz9S4XAhD0y2FunIsxguNEQ=', 'Head of the Music Division', '1004', 'Jakarta', '081245637890', 8, '202207', '214505', '2025-04-26', '111111.jpg', 'Nonaktif'),
('140826', '826', NULL, 'harry@sagatrade.co.id', 'Harry Gumbira Ramadhan', 'U2FsdGVkX1+4Rm+/D7R6GOd0Z2CyJlti85WRbSZDRW8=', 'Staff IT', '5003', 'Jakarta', '0818-0737-354', 8, '202201', '202201', '2025-04-26', '140826.jpg', 'Nonaktif'),
('181124', '124', 'd80b49f2-a2ef-418f-aafb-9176e2a7345a', 'luvi@sagatrade.co.id', 'Luviana Riska', 'U2FsdGVkX19FlOOeNhhn9thgv8pJgolRSQgt2iFcLAs=', 'Staff HRD', '1004', 'Jakarta', '0813-8473-847', 8, '202201', '202201', '2020-04-26', '181124.jpg', 'Aktif'),
('202201', '121', 'Profile1', 'ryan@gmail.com', 'Ryan', 'U2FsdGVkX1+3TI3S25xViylQlkOJSAlttKWbP8gUX44=', 'Staff', '1004', 'Samarinda', '081234561234', 8, '202201', '213514', '2025-02-11', '202201.jpg', 'Aktif'),
('202207', '707', '5febe7d0-3b2b-4fc1-93eb-acf6724dbcc5', 'ricky@sagatade.co.id', 'Tjoa Ricky Febrianto', 'U2FsdGVkX1+3TI3S25xViylQlkOJSAlttKWbP8gUX44=\r\n', 'Staff IT Mantap', '5003', 'Samarinda', '085245368842', 8, '214505', '213514', '2024-03-25', '202207.png', 'Aktif'),
('213514', '112', 'Profile1', 'dedy@sagatrade.co.id', 'Dedy Setiawan', 'U2FsdGVkX1+3TI3S25xViylQlkOJSAlttKWbP8gUX44=', 'Staff', '5003', 'Samarinda', '081234561234', 8, '214505', '202201', '2025-04-16', '213514.jpg', 'Aktif'),
('214505', '229', 'Profile1', 'syamsuddin@sagatrade.co.id', 'Udhin', 'U2FsdGVkX188LpB9pGAmAAk1XBoNev3syuN5vNX4pMs=', 'Kasi IT', '5003', 'Samarinda', '081244608676', 8, '291024', '213514', '2023-02-10', '214505.png', 'Aktif'),
('220801', '801', '5febe7d0-3b2b-4fc1-93eb-acf6724dbcc5', 'ananta@sagatrade.co.id', 'Muhammad Ananta', 'U2FsdGVkX1+pHklcSA9qvhcMhae0Pqkdsdl5lgwWoO0=', 'Staff IT', '5003', 'Jakarta', '085247594847', 8, '291024', '140826', '2025-05-03', '220801.jpg', 'Aktif'),
('220803', '803', '5febe7d0-3b2b-4fc1-93eb-acf6724dbcc5', 'aziz@sagatrade.co.id', 'Abdul Aziz Arrofiq', 'U2FsdGVkX19jac9Vb9wYSlewT4forOItAiPkYZ8WMWI=', 'Staff IT', '5003', 'Jakarta', '0899-8921-062', 8, '202201', '202201', '2025-04-26', 'tes', 'Aktif'),
('291024', '024', '30349278-b074-430c-af99-c51cdd45703f', 'paulus@sagatrade.co.id', 'Paulus Hendro Nugroho', 'U2FsdGVkX18N+AhWVrCccBhyztPBJHQwCIEvvEmsqsc=', 'Head of the IT', '5003', 'Jakarta', '0818-0627-127', 8, '202201', '202201', '2025-04-26', '291024.jpg', 'Aktif');

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
		INSERT INTO attendance(attendance_id,user_id_machine,check_in,check_out,type,description) SELECT UUID(),user_id_machine,NEW.date,NEW.date, "Ijin Resmi", Concat(NEW.type, " - " ,NEW.description) from employee where payroll=NEW.payroll;
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
  `access_profile` varchar(4) NOT NULL,
  `access_dept` varchar(4) NOT NULL,
  `access_setting` varchar(4) NOT NULL,
  `status` enum('Aktif','Nonaktif') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `profile`
--

INSERT INTO `profile` (`profile_id`, `name`, `description`, `level`, `user_hrd`, `access_sppd`, `access_skpd`, `access_attendance`, `access_spl`, `access_srl`, `access_cuti`, `access_ijin`, `access_calendar`, `access_user`, `access_profile`, `access_dept`, `access_setting`, `status`) VALUES
('30349278-b074-430c-af99-c51cdd45703f', 'Manager IT', 'Manager IT', 5, 0, 'CURD', 'CRUD', 'CRDU', 'CRDU', 'CURD', 'CRUD', 'CURD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'Aktif'),
('5febe7d0-3b2b-4fc1-93eb-acf6724dbcc5', 'Staff IT', 'tes', 1, 0, 'CRUD', 'CUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CUDR', 'CUDR', 'RCUD', 'RUDC', 'CRUD', 'CRUD', 'Nonaktif'),
('d80b49f2-a2ef-418f-aafb-9176e2a7345a', 'Staff HRD', 'Staff HRD', 1, 1, 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'Nonaktif'),
('Profile1', 'Kasubsi IT', 'Kasubsi IT', 2, 0, 'CRUD', 'CRUD', 'CRUD', 'RUDC', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'Aktif');

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
('id', 23, 22);

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

-- --------------------------------------------------------

--
-- Table structure for table `spl`
--

CREATE TABLE `spl` (
  `spl_id` varchar(40) NOT NULL,
  `purpose` varchar(255) NOT NULL,
  `dept` varchar(6) DEFAULT NULL,
  `est_start` datetime NOT NULL,
  `est_end` datetime NOT NULL,
  `status1` enum('Waiting','Reject','Approved','Cancelled') NOT NULL DEFAULT 'Waiting',
  `approval1` varchar(8) DEFAULT NULL,
  `status2` enum('Waiting','Reject','Approved','Cancelled') NOT NULL DEFAULT 'Waiting',
  `approval2` varchar(8) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `spl`
--

INSERT INTO `spl` (`spl_id`, `purpose`, `dept`, `est_start`, `est_end`, `status1`, `approval1`, `status2`, `approval2`, `createdAt`) VALUES
('1-SPL_MIS_STM_04-2025', 'Tes lembur', '5003', '2025-04-14 17:00:00', '2025-04-14 21:00:00', 'Approved', '214505', 'Approved', '291024', '2025-04-22 13:46:02'),
('1-SPL_MIS_STM_05-2025', 'lembur IT', '5003', '2025-05-02 17:00:00', '2025-05-02 19:30:00', 'Approved', '140826', 'Approved', '291024', '2025-05-03 16:00:11');

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
('07e0356d-50e5-42ae-89f3-c18add7cfa51', 1, '1-SPL_MIS_STM_05-2025', '202207', 'time attendance'),
('351938b1-29bc-4b4a-ba1b-e1ccc0a41b2d', 0, '1-SPL_MIS_STM_05-2025', '213514', 'jaringan, mikrotik'),
('beeb4407-7e4b-44eb-933a-258b3d8f320a', 0, '1-SPL_MIS_STM_04-2025', '202207', 'tes, react');

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
  `status1` enum('Waiting','Reject','Approved','Cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Waiting',
  `approval1` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status2` enum('Waiting','Reject','Approved','Cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Waiting',
  `approval2` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `srl`
--

INSERT INTO `srl` (`srl_id`, `spl_id`, `payroll`, `real_start`, `real_end`, `status1`, `approval1`, `status2`, `approval2`, `createdAt`) VALUES
('1-SRL_MIS_STM_04-2025', '1-SPL_MIS_STM_04-2025', '202207', '2025-04-14 17:00:00', '2025-04-14 19:00:00', 'Approved', '214505', 'Approved', '213514', '2025-04-22 13:50:28');

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

--
-- Dumping data for table `srl_detail`
--

INSERT INTO `srl_detail` (`srl_detail_id`, `srl_id`, `description`, `status`) VALUES
('38678004-2ee4-45cd-864e-93e7f5b7dfe7', '1-SRL_MIS_STM_04-2025', 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus facere quis cum dolorum quam aspernatur impedit molestiae fuga ad, dolorem ratione unde, omnis voluptas. Veritatis quo iusto consequatur asperiores quae?', 'Completed'),
('a094df59-48f2-4e46-bac5-b94f85e77136', '1-SRL_MIS_STM_04-2025', 'Iclik kawanan domba', 'Completed');

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
  ADD KEY `user_id_mesin` (`user_id_machine`),
  ADD KEY `check_in` (`check_in`),
  ADD KEY `check_out` (`check_out`),
  ADD KEY `check_in2` (`check_in2`),
  ADD KEY `check_out2` (`check_out2`),
  ADD KEY `type` (`type`);

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
  ADD KEY `approval` (`approval`),
  ADD KEY `date` (`date`);

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
  ADD KEY `approval` (`approval`),
  ADD KEY `date` (`date`);

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
  ADD KEY `approval1` (`approval1`),
  ADD KEY `approval2` (`approval2`),
  ADD KEY `est_start` (`est_start`),
  ADD KEY `est_end` (`est_end`),
  ADD KEY `dept` (`dept`);

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
  ADD KEY `approval2` (`approval2`),
  ADD KEY `real_start` (`real_start`),
  ADD KEY `real_end` (`real_end`);

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
  ADD CONSTRAINT `spl_approval1_fkey` FOREIGN KEY (`approval1`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `spl_approval2_fkey` FOREIGN KEY (`approval2`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `spl_dept_fkey` FOREIGN KEY (`dept`) REFERENCES `dept` (`dept_code`) ON DELETE SET NULL ON UPDATE CASCADE;

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

DELIMITER $$
--
-- Events
--
CREATE DEFINER=`root`@`localhost` EVENT `event_insert_attendance` ON SCHEDULE EVERY 10 MINUTE STARTS '2025-04-23 00:01:00' ON COMPLETION NOT PRESERVE ENABLE DO CALL insert_daily_attendance()$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
