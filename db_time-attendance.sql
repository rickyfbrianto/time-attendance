-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 21, 2025 at 11:53 AM
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
    WHERE status = 'Aktif' AND
		NOT EXISTS (
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
CREATE DEFINER=`root`@`localhost` FUNCTION `GetEndWork` (`check_in` DATETIME, `check_out` DATETIME, `workhour` TINYINT, `startwork` TIME) RETURNS DATETIME  BEGIN
	DECLARE is_holiday TINYINT(1);
	
	SELECT COUNT(*) into is_holiday from calendar where date = DATE(check_in) AND type IN ('Hari Libur','Event Kantor') limit 1;
	
	IF (DAYNAME(check_in) IN ('Saturday','Sunday') AND workhour=8) OR (DAYNAME(check_in)='Sunday' AND workhour=7) OR is_holiday THEN
			RETURN check_out;
	ELSEIF DAYNAME(check_in)='Saturday' AND workhour=7 THEN
		BEGIN
			RETURN DATE_ADD(CONCAT(date(check_in),' ',startwork),INTERVAL 5 HOUR);
		END;
	ELSE
		#workday
		RETURN DATE_ADD(CONCAT(date(check_in),' ',startwork),INTERVAL workhour+1 HOUR);
		#start OT = 7:00 (startwork) + 7H (workhour) + 1H (break) = 15:00
		
	END IF;
END$$

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

CREATE DEFINER=`root`@`localhost` FUNCTION `getSPL` (`p_payroll` VARCHAR(8), `p_tgl` DATETIME) RETURNS SMALLINT(6)  BEGIN
    DECLARE hasil SMALLINT;
    
    SELECT count(s.spl_id) INTO hasil FROM spl AS s
    LEFT JOIN spl_detail sd ON s.spl_id = sd.spl_id
    WHERE DATE(s.est_start) = DATE(p_tgl) AND sd.payroll = p_payroll COLLATE utf8mb4_unicode_ci;
    
    RETURN hasil;
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `GetStartOvertime` (`att_id` VARCHAR(40), `workhour` TINYINT, `startwork` TIME) RETURNS DATETIME  BEGIN
	DECLARE is_holiday TINYINT(1);
	DECLARE checkin DATETIME;
	DECLARE checkin2 DATETIME;
	DECLARE checkout DATETIME;
	DECLARE checkout2 DATETIME;
	DECLARE ot_allow INTEGER(3);
	
	SELECT check_in,check_out,check_in2,check_out2 into checkin,checkout,checkin2,checkout2 from attendance where attendance_id=att_id COLLATE utf8mb4_unicode_ci;
	
	SELECT overtime_allow into ot_allow from setting;

	SELECT COUNT(*) into is_holiday from calendar where date = DATE(checkin) AND type IN ('Hari Libur','Event Kantor') limit 1;
	
	IF (DAYNAME(checkin) IN ('Saturday','Sunday') AND workhour=8) OR (DAYNAME(checkin)='Sunday' AND workhour=7) OR is_holiday THEN
		IF time(checkin)>startwork THEN
			RETURN checkin;
		ELSE
			RETURN CONCAT(date(checkin),' ',startwork);
		END IF;
	ELSEIF DAYNAME(checkin)='Saturday' AND workhour=7 THEN
		BEGIN
			IF TIMESTAMPDIFF(HOUR,checkin,checkout)<=6 THEN
				RETURN DATE_ADD(checkin,INTERVAL 5 HOUR);
			ELSE
				RETURN DATE_ADD(checkin,INTERVAL 6 HOUR); #check out >=15:00:00
			END IF;
		END;
	ELSE
		#workday
		IF TIMESTAMPDIFF(MINUTE,DATE_ADD(CONCAT(date(checkin),' ',startwork),INTERVAL workhour+1 HOUR),checkout)>=ot_allow OR ISNULL(checkin2) THEN
			RETURN DATE_ADD(CONCAT(date(checkin),' ',startwork),INTERVAL workhour+1 HOUR);
		ELSE
			IF NOT ISNULL(checkout2) AND TIMESTAMPDIFF(MINUTE,checkin2,checkout2)>=ot_allow THEN
				RETURN checkin2;
			ELSEIF NOT ISNULL(checkout2) AND TIMESTAMPDIFF(MINUTE,checkin2,checkout2)<ot_allow THEN
				RETURN checkout2;
			ELSE
				RETURN DATE_ADD(CONCAT(date(checkin),' ',startwork),INTERVAL workhour+1 HOUR); 
			END IF;
		END IF;
		
		#start OT = 7:00 (startwork) + 7H (workhour) + 1H (break) = 15:00
		
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
('00603df3-27e4-11f0-acd8-80c5f2f97990', '801', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, 'Sakit', 'Sick', 'diare', '', '181124', '2025-05-03 14:01:00'),
('01cff88c-b9f0-454f-be45-3bc8725fea9e', '707', '2025-04-07 00:00:00', '2025-04-07 00:00:00', NULL, NULL, 'Sakit', '', '', '', '202207', '2025-04-17 15:43:29'),
('02c43f88-226d-11f0-acd8-80c5f2f97990', '220803', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-26 15:06:42'),
('02c44290-226d-11f0-acd8-80c5f2f97990', '220803', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-04-26 15:06:42'),
('03d3548e-2d6d-11f0-ac46-0492263d7fc5', '124', '2000-10-05 00:00:00', '2000-10-05 00:00:00', NULL, NULL, 'Cuti Tahunan', '', 'Cuti Tahunan - test cuti', '', NULL, '2025-05-10 15:04:29'),
('08ef286f-f33a-4f5a-88e0-a460c1b9fee1', '707', '2025-05-22 08:00:00', '2025-05-22 17:00:00', NULL, NULL, 'HKM', '', 'tes', '08ef286f-f33a-4f5a-88e0-a460c1b9fee1.jpg', '181124', '2025-05-05 10:56:16'),
('0a13294c-4b4d-11f0-b4c3-0492263d7fc5', '801', '2025-06-05 00:00:00', '2025-06-05 00:00:00', NULL, NULL, 'Cuti Tahunan', '', 'Cuti Tahunan - cuti tahunan', '', NULL, '2025-06-17 15:31:09'),
('0abd520c-617e-4327-b775-f8dd76fd9326', '707', '2025-05-20 08:00:00', '2025-05-20 18:03:00', NULL, NULL, 'HKM', 'Permit', 'tesdg', '', '291024', '2025-05-05 10:58:00'),
('0c9786bf-3f4d-11f0-a8b2-80c5f2f97990', '000', '2025-06-02 00:00:00', '2025-06-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-02 09:01:00'),
('0c978a4e-3f4d-11f0-a8b2-80c5f2f97990', '001', '2025-06-02 00:00:00', '2025-06-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-02 09:01:00'),
('0c97a172-3f4d-11f0-a8b2-80c5f2f97990', '124', '2025-06-02 00:00:00', '2025-06-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-02 09:01:00'),
('0c97a7f8-3f4d-11f0-a8b2-80c5f2f97990', '121', '2025-06-02 00:00:00', '2025-06-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-02 09:01:00'),
('0c97ae33-3f4d-11f0-a8b2-80c5f2f97990', '707', '2025-06-02 00:00:00', '2025-06-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-02 09:01:00'),
('0c97b44f-3f4d-11f0-a8b2-80c5f2f97990', '112', '2025-06-02 00:00:00', '2025-06-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-02 09:01:00'),
('0c97bcbd-3f4d-11f0-a8b2-80c5f2f97990', '229', '2025-06-02 00:00:00', '2025-06-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-02 09:01:00'),
('0c97c2b8-3f4d-11f0-a8b2-80c5f2f97990', '801', '2025-06-02 07:50:00', '2025-06-02 15:00:00', NULL, NULL, 'HKM', 'Permit', 'Izin Berobat', '0c97c2b8-3f4d-11f0-a8b2-80c5f2f97990.jpg', '181124', '2025-06-02 09:01:00'),
('0c97c66c-3f4d-11f0-a8b2-80c5f2f97990', '220802', '2025-06-02 07:00:00', '2025-06-02 19:00:00', NULL, NULL, 'HKM', '', '', '', '181124', '2025-06-02 09:01:00'),
('0c97d016-3f4d-11f0-a8b2-80c5f2f97990', '024', '2025-06-02 00:00:00', '2025-06-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-02 09:01:00'),
('0d2ee92a-4da9-11f0-be24-80c5f2f97990', '801', '2025-06-06 00:00:00', '2025-06-06 00:00:00', NULL, NULL, 'Dinas', '', 'Koordinasi take video HUT Sagatrade 41', '', NULL, '2025-06-20 15:34:51'),
('0d2f5ffa-4da9-11f0-be24-80c5f2f97990', '801', '2025-06-07 00:00:00', '2025-06-07 00:00:00', NULL, NULL, 'Dinas', '', 'Koordinasi take video HUT Sagatrade 41', '', NULL, '2025-06-20 15:34:51'),
('0d2f6a0d-4da9-11f0-be24-80c5f2f97990', '801', '2025-06-08 00:00:00', '2025-06-08 00:00:00', NULL, NULL, 'Dinas', '', 'Koordinasi take video HUT Sagatrade 41', '', NULL, '2025-06-20 15:34:51'),
('0d2f7487-4da9-11f0-be24-80c5f2f97990', '801', '2025-06-09 00:00:00', '2025-06-09 00:00:00', NULL, NULL, 'Dinas', '', 'Koordinasi take video HUT Sagatrade 41', '', NULL, '2025-06-20 15:34:51'),
('0ddec595-3a96-11f0-b018-80c5f2f97990', '000', '2025-05-27 00:00:00', '2025-05-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-27 09:01:00'),
('0ddecc17-3a96-11f0-b018-80c5f2f97990', '001', '2025-05-27 00:00:00', '2025-05-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-27 09:01:00'),
('0dded3f0-3a96-11f0-b018-80c5f2f97990', '124', '2025-05-27 00:00:00', '2025-05-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-27 09:01:00'),
('0ddeda7a-3a96-11f0-b018-80c5f2f97990', '121', '2025-05-27 08:00:00', '2025-05-27 20:45:00', NULL, NULL, 'HKM', '', 'test', '', '181124', '2025-05-27 09:01:00'),
('0ddee5af-3a96-11f0-b018-80c5f2f97990', '112', '2025-05-27 00:00:00', '2025-05-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-27 09:01:00'),
('0ddeebf3-3a96-11f0-b018-80c5f2f97990', '229', '2025-05-27 00:00:00', '2025-05-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-27 09:01:00'),
('0ddeeefa-3a96-11f0-b018-80c5f2f97990', '801', '2025-05-27 07:50:00', '2025-05-27 17:40:00', NULL, NULL, 'HKM', '', '', '0ddeeefa-3a96-11f0-b018-80c5f2f97990.jpg', '291024', '2025-05-27 09:01:00'),
('0ddef08b-3a96-11f0-b018-80c5f2f97990', '220802', '2025-05-27 08:00:00', '2025-05-27 17:00:00', NULL, NULL, 'HKM', '', '', '0ddef08b-3a96-11f0-b018-80c5f2f97990.jpg', '181124', '2025-05-27 09:01:00'),
('0ddef6af-3a96-11f0-b018-80c5f2f97990', '024', '2025-05-27 00:00:00', '2025-05-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-27 09:01:00'),
('101c1c8b-35df-11f0-b430-80c5f2f97990', '000', '2025-05-21 00:00:00', '2025-05-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-21 09:01:00'),
('101c1ec9-35df-11f0-b430-80c5f2f97990', '001', '2025-05-21 00:00:00', '2025-05-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-21 09:01:00'),
('101c2519-35df-11f0-b430-80c5f2f97990', '124', '2025-05-21 00:00:00', '2025-05-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-21 09:01:00'),
('101c27e5-35df-11f0-b430-80c5f2f97990', '121', '2025-05-21 00:00:00', '2025-05-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-21 09:01:00'),
('101c2b80-35df-11f0-b430-80c5f2f97990', '112', '2025-05-21 00:00:00', '2025-05-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-21 09:01:00'),
('101c2e08-35df-11f0-b430-80c5f2f97990', '229', '2025-05-21 00:00:00', '2025-05-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-21 09:01:00'),
('101c2fb7-35df-11f0-b430-80c5f2f97990', '801', '2025-05-21 00:00:00', '2025-05-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-21 09:01:00'),
('101c3073-35df-11f0-b430-80c5f2f97990', '220802', '2025-05-21 00:00:00', '2025-05-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-21 09:01:00'),
('1116f7b2-2d6d-11f0-ac46-0492263d7fc5', '124', '2000-05-15 00:00:00', '2000-05-15 00:00:00', NULL, NULL, 'Cuti Resmi', '', 'Cuti Resmi - test cuti', '', NULL, '2025-05-10 15:04:51'),
('1165fa6b-7132-4311-bc35-78762780fb1b', '220803', '2025-05-10 08:00:00', '2025-05-10 17:00:00', NULL, NULL, 'HKM', '', 'lembur', '', '181124', '2025-05-06 15:42:15'),
('17ffefce-4cea-11f0-ad99-0492263d7fc5', '124', '2025-06-30 00:00:00', '2025-06-30 00:00:00', NULL, NULL, 'Ijin Resmi', '', 'Bencana Alam - Banjir', '', NULL, '2025-06-19 16:47:56'),
('184e6b3a-d985-4da4-b0fd-a174c5559e32', '220803', '2025-05-12 08:00:00', '2025-05-12 17:00:00', NULL, NULL, 'HKM', '', 'hadirrr', '', '181124', '2025-05-09 15:07:15'),
('1a63db52-4acb-11f0-b15b-0492263d7fc5', '000', '2025-06-17 00:00:00', '2025-06-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-17 00:01:00'),
('1a63dd59-4acb-11f0-b15b-0492263d7fc5', '1231', '2025-06-17 00:00:00', '2025-06-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-17 00:01:00'),
('1a63e5ad-4acb-11f0-b15b-0492263d7fc5', '001', '2025-06-17 00:00:00', '2025-06-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-17 00:01:00'),
('1a63efce-4acb-11f0-b15b-0492263d7fc5', '826', '2025-06-17 00:00:00', '2025-06-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-17 00:01:00'),
('1a63f9ba-4acb-11f0-b15b-0492263d7fc5', '124', '2025-06-17 00:00:00', '2025-06-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-17 00:01:00'),
('1a6404cd-4acb-11f0-b15b-0492263d7fc5', '121', '2025-06-17 00:00:00', '2025-06-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-17 00:01:00'),
('1a640f25-4acb-11f0-b15b-0492263d7fc5', '707', '2025-06-17 00:00:00', '2025-06-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-17 00:01:00'),
('1a6418d5-4acb-11f0-b15b-0492263d7fc5', '112', '2025-06-17 00:00:00', '2025-06-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-17 00:01:00'),
('1a642325-4acb-11f0-b15b-0492263d7fc5', '229', '2025-06-17 00:00:00', '2025-06-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-17 00:01:00'),
('1a642b7c-4acb-11f0-b15b-0492263d7fc5', '801', '2025-06-17 00:00:00', '2025-06-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-17 00:01:00'),
('1a643159-4acb-11f0-b15b-0492263d7fc5', '220802', '2025-06-17 00:00:00', '2025-06-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-17 00:01:00'),
('1a643e4c-4acb-11f0-b15b-0492263d7fc5', '220803', '2025-06-17 00:00:00', '2025-06-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-17 00:01:00'),
('1a644834-4acb-11f0-b15b-0492263d7fc5', '024', '2025-06-17 00:00:00', '2025-06-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-17 00:01:00'),
('1a8562d9-4614-11f0-a183-80c5f2f97990', '000', '2025-06-11 00:00:00', '2025-06-11 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-11 00:01:00'),
('1a85698d-4614-11f0-a183-80c5f2f97990', '001', '2025-06-11 00:00:00', '2025-06-11 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-11 00:01:00'),
('1a85730c-4614-11f0-a183-80c5f2f97990', '826', '2025-06-11 00:00:00', '2025-06-11 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-11 00:01:00'),
('1a857c7d-4614-11f0-a183-80c5f2f97990', '124', '2025-06-11 00:00:00', '2025-06-11 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-11 00:01:00'),
('1a858565-4614-11f0-a183-80c5f2f97990', '121', '2025-06-11 00:00:00', '2025-06-11 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-11 00:01:00'),
('1a858ec6-4614-11f0-a183-80c5f2f97990', '707', '2025-06-11 00:00:00', '2025-06-11 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-11 00:01:00'),
('1a8597d1-4614-11f0-a183-80c5f2f97990', '112', '2025-06-11 00:00:00', '2025-06-11 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-11 00:01:00'),
('1a85a169-4614-11f0-a183-80c5f2f97990', '229', '2025-06-11 00:00:00', '2025-06-11 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-11 00:01:00'),
('1a85a8e2-4614-11f0-a183-80c5f2f97990', '801', '2025-06-11 00:00:00', '2025-06-11 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-11 00:01:00'),
('1a85adb5-4614-11f0-a183-80c5f2f97990', '220802', '2025-06-11 00:00:00', '2025-06-11 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-11 00:01:00'),
('1a85bb14-4614-11f0-a183-80c5f2f97990', '220803', '2025-06-11 00:00:00', '2025-06-11 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-11 00:01:00'),
('1a85c3bc-4614-11f0-a183-80c5f2f97990', '024', '2025-06-11 00:00:00', '2025-06-11 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-11 00:01:00'),
('1b58214e-b7a0-4035-82ec-7cf066833f1a', '707', '2025-04-09 08:00:00', '2025-04-09 17:00:00', NULL, NULL, 'HKM', '', 'HKM', '', '202207', '2025-04-17 15:43:29'),
('1bdc814c-415d-11f0-a686-80c5f2f97990', '000', '2025-06-05 00:00:00', '2025-06-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-05 00:01:00'),
('1bdc874a-415d-11f0-a686-80c5f2f97990', '001', '2025-06-05 00:00:00', '2025-06-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-05 00:01:00'),
('1bdc8f6b-415d-11f0-a686-80c5f2f97990', '826', '2025-06-05 00:00:00', '2025-06-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-05 00:01:00'),
('1bdc97b2-415d-11f0-a686-80c5f2f97990', '124', '2025-06-05 00:00:00', '2025-06-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-05 00:01:00'),
('1bdca316-415d-11f0-a686-80c5f2f97990', '121', '2025-06-05 00:00:00', '2025-06-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-05 00:01:00'),
('1bdcabd5-415d-11f0-a686-80c5f2f97990', '707', '2025-06-05 00:00:00', '2025-06-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-05 00:01:00'),
('1bdcb3cf-415d-11f0-a686-80c5f2f97990', '112', '2025-06-05 00:00:00', '2025-06-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-05 00:01:00'),
('1bdcbc18-415d-11f0-a686-80c5f2f97990', '229', '2025-06-05 00:00:00', '2025-06-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-05 00:01:00'),
('1bdcc3a9-415d-11f0-a686-80c5f2f97990', '801', '2025-06-05 00:00:00', '2025-06-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-05 00:01:00'),
('1bdcc7e7-415d-11f0-a686-80c5f2f97990', '220802', '2025-06-05 00:00:00', '2025-06-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-05 00:01:00'),
('1bdcd765-415d-11f0-a686-80c5f2f97990', '220803', '2025-06-05 00:00:00', '2025-06-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-05 00:01:00'),
('1bdcdc37-415d-11f0-a686-80c5f2f97990', '024', '2025-06-05 00:00:00', '2025-06-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-05 00:01:00'),
('1dcd3e3b-3ca6-11f0-aae7-80c5f2f97990', '000', '2025-05-30 00:00:00', '2025-05-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-30 00:01:00'),
('1dcd41b8-3ca6-11f0-aae7-80c5f2f97990', '001', '2025-05-30 00:00:00', '2025-05-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-30 00:01:00'),
('1dcd4a5f-3ca6-11f0-aae7-80c5f2f97990', '124', '2025-05-30 00:00:00', '2025-05-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-30 00:01:00'),
('1dcd4f9f-3ca6-11f0-aae7-80c5f2f97990', '121', '2025-05-30 00:00:00', '2025-05-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-30 00:01:00'),
('1dcd570a-3ca6-11f0-aae7-80c5f2f97990', '707', '2025-05-30 00:00:00', '2025-05-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-30 00:01:00'),
('1dcd5de7-3ca6-11f0-aae7-80c5f2f97990', '112', '2025-05-30 00:00:00', '2025-05-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-30 00:01:00'),
('1dcd62a9-3ca6-11f0-aae7-80c5f2f97990', '229', '2025-05-30 00:00:00', '2025-05-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-30 00:01:00'),
('1dcd65f8-3ca6-11f0-aae7-80c5f2f97990', '801', '2025-05-30 10:00:00', '2025-05-30 17:00:00', NULL, NULL, 'HKM', 'Permit', 'Kendaraan Bocor', '1dcd65f8-3ca6-11f0-aae7-80c5f2f97990.jpg', '291024', '2025-05-30 00:01:00'),
('1dcd6750-3ca6-11f0-aae7-80c5f2f97990', '220802', '2025-05-30 00:00:00', '2025-05-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-30 00:01:00'),
('1dcd6c5b-3ca6-11f0-aae7-80c5f2f97990', '024', '2025-05-30 00:00:00', '2025-05-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-30 00:01:00'),
('20344213-7570-48e0-a8db-79610a4156ec', '801', '2025-05-05 09:00:00', '2025-05-05 17:00:00', NULL, NULL, 'HKM', '', 'ban bocor', '', '181124', '2025-05-09 18:02:39'),
('23164d11-29ca-11f0-812e-80c5f2f97990', '024', '2025-05-06 00:00:00', '2025-05-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-06 00:01:00'),
('2316536f-29ca-11f0-812e-80c5f2f97990', '111', '2025-05-06 00:00:00', '2025-05-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-06 00:01:00'),
('23165aa3-29ca-11f0-812e-80c5f2f97990', '112', '2025-05-06 00:00:00', '2025-05-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-06 00:01:00'),
('23166013-29ca-11f0-812e-80c5f2f97990', '121', '2025-05-06 00:00:00', '2025-05-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-06 00:01:00'),
('2316652b-29ca-11f0-812e-80c5f2f97990', '124', '2025-05-06 00:00:00', '2025-05-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-06 00:01:00'),
('23166933-29ca-11f0-812e-80c5f2f97900', '229', '2025-05-05 07:28:27', '2025-05-05 18:33:36', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-06 00:01:00'),
('23166933-29ca-11f0-812e-80c5f2f97990', '229', '2025-05-06 07:47:16', '2025-05-06 18:05:13', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-06 00:01:00'),
('23166bbc-29ca-11f0-812e-80c5f2f97990', '707', '2025-05-06 17:12:30', '2025-05-06 00:00:00', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-06 00:01:00'),
('23166cad-29ca-11f0-812e-80c5f2f97990', '801', '2025-05-06 00:00:00', '2025-05-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-06 00:01:00'),
('23166e66-29ca-11f0-812e-80c5f2f97990', '220803', '2025-05-06 07:59:07', '2025-05-06 17:05:27', '2025-05-06 17:35:47', '2025-05-06 18:04:47', 'HKC', '', '', '', NULL, '2025-05-06 00:01:00'),
('23166ffe-29ca-11f0-812e-80c5f2f97990', '826', '2025-05-06 00:00:00', '2025-05-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-06 00:01:00'),
('25e09c9c-4a54-11f0-b15b-0492263d7fc5', '229', '2025-06-27 00:00:00', '2025-06-27 00:00:00', NULL, NULL, 'Cuti Tahunan', '', 'Cuti Tahunan - tesadas', '', NULL, '2025-06-16 09:49:29'),
('266bfd60-205c-11f0-acd8-80c5f2f97990', '121', '2025-04-24 00:00:00', '2025-04-24 00:00:00', NULL, NULL, 'HKM', '', '', '', NULL, '2025-04-24 00:01:00'),
('266bfea0-205c-11f0-acd8-80c5f2f97990', '112', '2025-04-24 00:00:00', '2025-04-24 00:00:00', NULL, NULL, 'HKM', '', '', '', NULL, '2025-04-24 00:01:00'),
('266bff63-205c-11f0-acd8-80c5f2f97990', '229', '2025-04-24 08:03:00', '2025-04-24 18:40:00', NULL, NULL, 'HKC', '', '', '', NULL, '2025-04-24 00:01:00'),
('2707dea5-2513-11f0-acd8-80c5f2f97990', '024', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-30 00:01:00'),
('2707dfed-2513-11f0-acd8-80c5f2f97990', '111', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-30 00:01:00'),
('2707e140-2513-11f0-acd8-80c5f2f97990', '112', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-30 00:01:00'),
('2707e259-2513-11f0-acd8-80c5f2f97990', '121', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-30 00:01:00'),
('2707e34b-2513-11f0-acd8-80c5f2f97990', '124', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-30 00:01:00'),
('2707e464-2513-11f0-acd8-80c5f2f97990', '229', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, 'HKC', '', '', '', NULL, '2025-04-30 00:01:00'),
('2707e67c-2513-11f0-acd8-80c5f2f97990', '220803', '2025-04-30 08:00:00', '2025-04-30 17:00:00', NULL, NULL, 'HKM', '', '', '', '181124', '2025-04-30 00:01:00'),
('2707e76a-2513-11f0-acd8-80c5f2f97990', '826', '2025-04-30 00:00:00', '2025-04-30 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-30 00:01:00'),
('2b328270-3466-11f0-a8ce-80c5f2f97990', '220802', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-05-19 12:03:05'),
('2b333588-3466-11f0-a8ce-80c5f2f97990', '220802', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-05-19 12:03:05'),
('2bec6669-2ca2-11f0-a3d1-0492263d7fc5', '220803', '2025-05-29 00:00:00', '2025-05-29 00:00:00', NULL, NULL, 'Cuti Resmi', '', 'Cuti Hamil & Melahirkan - Mau hamil', '', NULL, '2025-05-09 14:52:26'),
('2cda2a8f-3832-11f0-ada9-80c5f2f97990', '000', '2025-05-24 00:00:00', '2025-05-24 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-24 08:01:00'),
('2cda34ef-3832-11f0-ada9-80c5f2f97990', '001', '2025-05-24 00:00:00', '2025-05-24 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-24 08:01:00'),
('2cda5458-3832-11f0-ada9-80c5f2f97990', '124', '2025-05-24 00:00:00', '2025-05-24 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-24 08:01:00'),
('2cda61db-3832-11f0-ada9-80c5f2f97990', '121', '2025-05-24 00:00:00', '2025-05-24 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-24 08:01:00'),
('2cda7724-3832-11f0-ada9-80c5f2f97990', '707', '2025-05-24 00:00:00', '2025-05-24 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-24 08:01:00'),
('2cda809b-3832-11f0-ada9-80c5f2f97990', '112', '2025-05-24 00:00:00', '2025-05-24 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-24 08:01:00'),
('2cda8ac2-3832-11f0-ada9-80c5f2f97990', '229', '2025-05-24 00:00:00', '2025-05-24 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-24 08:01:00'),
('2cda91b6-3832-11f0-ada9-80c5f2f97990', '801', '2025-05-24 00:00:00', '2025-05-24 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-24 08:01:00'),
('2cda94bc-3832-11f0-ada9-80c5f2f97990', '220802', '2025-05-24 00:00:00', '2025-05-24 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-24 08:01:00'),
('2cdaab6c-3832-11f0-ada9-80c5f2f97990', '024', '2025-05-24 00:00:00', '2025-05-24 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-24 08:01:00'),
('2d052ae9-2ca2-11f0-a3d1-0492263d7fc5', '220803', '2025-06-26 00:00:00', '2025-06-26 00:00:00', NULL, NULL, 'Cuti Resmi', '', 'Cuti Hamil & Melahirkan - Mau hamil', '', NULL, '2025-05-09 14:52:28'),
('33122ca1-2bda-11f0-a3d1-0492263d7fc5', '229', '2025-05-08 07:36:03', '2025-05-08 16:57:22', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-08 15:01:00'),
('335d9214-226d-11f0-acd8-80c5f2f97990', '124', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-26 15:08:04'),
('335e0ce2-226d-11f0-acd8-80c5f2f97990', '124', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-04-26 15:08:04'),
('3399313d-bfb1-407f-ab5e-171ba950345c', '707', '2025-04-08 00:00:00', '2025-04-08 00:00:00', NULL, NULL, 'Sakit', '', '', '', '202207', '2025-04-17 15:43:29'),
('34be660b-36e3-11f0-a37c-80c5f2f97990', '220803', '2025-05-12 00:00:00', '2025-05-12 00:00:00', NULL, NULL, 'Dinas', '', 'testing hapus setelah keberangkatan', '', NULL, '2025-05-22 16:03:10'),
('34beb8ee-36e3-11f0-a37c-80c5f2f97990', '220803', '2025-05-13 00:00:00', '2025-05-13 00:00:00', NULL, NULL, 'Dinas', '', 'testing hapus setelah keberangkatan', '', NULL, '2025-05-22 16:03:10'),
('34bee116-36e3-11f0-a37c-80c5f2f97990', '220803', '2025-05-14 00:00:00', '2025-05-14 00:00:00', NULL, NULL, 'Dinas', '', 'testing hapus setelah keberangkatan', '', NULL, '2025-05-22 16:03:10'),
('34bef8a3-36e3-11f0-a37c-80c5f2f97990', '220803', '2025-05-15 00:00:00', '2025-05-15 00:00:00', NULL, NULL, 'Dinas', '', 'testing hapus setelah keberangkatan', '', NULL, '2025-05-22 16:03:10'),
('34bf0f92-36e3-11f0-a37c-80c5f2f97990', '220803', '2025-05-16 00:00:00', '2025-05-16 00:00:00', NULL, NULL, 'Dinas', '', 'testing hapus setelah keberangkatan', '', NULL, '2025-05-22 16:03:10'),
('34ca212c-4a64-11f0-b15b-0492263d7fc5', '1231', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-06-16 11:44:26'),
('34ca5f1a-4a64-11f0-b15b-0492263d7fc5', '1231', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-06-16 11:44:26'),
('3b4cf5a4-31f1-11f0-aa6a-0492263d7fc5', '000', '2025-05-16 00:00:00', '2025-05-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-16 09:01:00'),
('3b4cfc67-31f1-11f0-aa6a-0492263d7fc5', '001', '2025-05-16 00:00:00', '2025-05-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-16 09:01:00'),
('3b4d07e0-31f1-11f0-aa6a-0492263d7fc5', '024', '2025-05-16 00:00:00', '2025-05-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-16 09:01:00'),
('3b4d1103-31f1-11f0-aa6a-0492263d7fc5', '111', '2025-05-16 00:00:00', '2025-05-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-16 09:01:00'),
('3b4d1b4c-31f1-11f0-aa6a-0492263d7fc5', '112', '2025-05-16 00:00:00', '2025-05-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-16 09:01:00'),
('3b4d255a-31f1-11f0-aa6a-0492263d7fc5', '121', '2025-05-16 00:00:00', '2025-05-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-16 09:01:00'),
('3b4d3133-31f1-11f0-aa6a-0492263d7fc5', '124', '2025-05-16 00:00:00', '2025-05-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-16 09:01:00'),
('3b4d5fdb-31f1-11f0-aa6a-0492263d7fc5', '229', '2025-05-16 00:00:00', '2025-05-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-16 09:01:00'),
('3b4d785d-31f1-11f0-aa6a-0492263d7fc5', '707', '2025-05-16 00:00:00', '2025-05-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-16 09:01:00'),
('3b4d7e35-31f1-11f0-aa6a-0492263d7fc5', '801', '2025-05-16 00:00:00', '2025-05-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-16 09:01:00'),
('3b4d8b5b-31f1-11f0-aa6a-0492263d7fc5', '220803', '2025-05-16 00:00:00', '2025-05-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-16 09:01:00'),
('3b4d965e-31f1-11f0-aa6a-0492263d7fc5', '826', '2025-05-16 00:00:00', '2025-05-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-16 09:01:00'),
('3d432474-35c6-4ce6-a7ca-686083c31064', '707', '2025-04-14 08:00:00', '2025-04-14 19:00:00', NULL, NULL, 'HKM', '', '', '', '202207', '2025-04-21 17:01:47'),
('41ee9392-346e-11f0-a8ce-80c5f2f97990', '220802', '2025-05-19 00:00:00', '2025-05-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-19 13:01:00'),
('434d5e60-4b94-11f0-b4c3-0492263d7fc5', '1231', '2025-06-18 00:00:00', '2025-06-18 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-18 00:01:00'),
('434d61f7-4b94-11f0-b4c3-0492263d7fc5', '001', '2025-06-18 00:00:00', '2025-06-18 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-18 00:01:00'),
('434d67a4-4b94-11f0-b4c3-0492263d7fc5', '826', '2025-06-18 00:00:00', '2025-06-18 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-18 00:01:00'),
('434d6c8b-4b94-11f0-b4c3-0492263d7fc5', '124', '2025-06-18 00:00:00', '2025-06-18 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-18 00:01:00'),
('434d70a1-4b94-11f0-b4c3-0492263d7fc5', '121', '2025-06-18 00:00:00', '2025-06-18 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-18 00:01:00'),
('434d750b-4b94-11f0-b4c3-0492263d7fc5', '707', '2025-06-18 00:00:00', '2025-06-18 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-18 00:01:00'),
('434d796c-4b94-11f0-b4c3-0492263d7fc5', '112', '2025-06-18 00:00:00', '2025-06-18 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-18 00:01:00'),
('434d7df4-4b94-11f0-b4c3-0492263d7fc5', '229', '2025-06-18 00:00:00', '2025-06-18 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-18 00:01:00'),
('434d81dc-4b94-11f0-b4c3-0492263d7fc5', '801', '2025-06-18 00:00:00', '2025-06-18 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-18 00:01:00'),
('434d848b-4b94-11f0-b4c3-0492263d7fc5', '220802', '2025-06-18 00:00:00', '2025-06-18 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-18 00:01:00'),
('434d8c51-4b94-11f0-b4c3-0492263d7fc5', '024', '2025-06-18 00:00:00', '2025-06-18 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-18 00:01:00'),
('4464b8cb-46dd-11f0-a22d-0492263d7fc5', '000', '2025-06-12 00:00:00', '2025-06-12 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-12 00:01:00'),
('4464bd37-46dd-11f0-a22d-0492263d7fc5', '001', '2025-06-12 00:00:00', '2025-06-12 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-12 00:01:00'),
('4464c21b-46dd-11f0-a22d-0492263d7fc5', '826', '2025-06-12 00:00:00', '2025-06-12 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-12 00:01:00'),
('4464c652-46dd-11f0-a22d-0492263d7fc5', '124', '2025-06-12 00:00:00', '2025-06-12 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-12 00:01:00'),
('4464ca44-46dd-11f0-a22d-0492263d7fc5', '121', '2025-06-12 00:00:00', '2025-06-12 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-12 00:01:00'),
('4464ce85-46dd-11f0-a22d-0492263d7fc5', '707', '2025-06-12 00:00:00', '2025-06-12 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-12 00:01:00'),
('4464d28a-46dd-11f0-a22d-0492263d7fc5', '112', '2025-06-12 00:00:00', '2025-06-12 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-12 00:01:00'),
('4464d6c2-46dd-11f0-a22d-0492263d7fc5', '229', '2025-06-12 00:00:00', '2025-06-12 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-12 00:01:00'),
('4464d9fe-46dd-11f0-a22d-0492263d7fc5', '801', '2025-06-12 00:00:00', '2025-06-12 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-12 00:01:00'),
('4464dc2c-46dd-11f0-a22d-0492263d7fc5', '220802', '2025-06-12 00:00:00', '2025-06-12 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-12 00:01:00'),
('4464e1d4-46dd-11f0-a22d-0492263d7fc5', '220803', '2025-06-12 00:00:00', '2025-06-12 00:00:00', NULL, NULL, '', 'Sick', 'Ke RS', '4464e1d4-46dd-11f0-a22d-0492263d7fc5.jpg', '181124', '2025-06-12 00:01:00'),
('4464e588-46dd-11f0-a22d-0492263d7fc5', '024', '2025-06-12 00:00:00', '2025-06-12 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-12 00:01:00'),
('46941471-4226-11f0-a686-80c5f2f97990', '000', '2025-06-06 00:00:00', '2025-06-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-06 00:01:00'),
('46941c19-4226-11f0-a686-80c5f2f97990', '001', '2025-06-06 00:00:00', '2025-06-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-06 00:01:00'),
('46942549-4226-11f0-a686-80c5f2f97990', '826', '2025-06-06 00:00:00', '2025-06-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-06 00:01:00'),
('46942dc1-4226-11f0-a686-80c5f2f97990', '124', '2025-06-06 00:00:00', '2025-06-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-06 00:01:00'),
('46943622-4226-11f0-a686-80c5f2f97990', '121', '2025-06-06 00:00:00', '2025-06-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-06 00:01:00'),
('46943ee7-4226-11f0-a686-80c5f2f97990', '707', '2025-06-06 00:00:00', '2025-06-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-06 00:01:00'),
('4694474d-4226-11f0-a686-80c5f2f97990', '112', '2025-06-06 00:00:00', '2025-06-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-06 00:01:00'),
('46945045-4226-11f0-a686-80c5f2f97990', '229', '2025-06-06 00:00:00', '2025-06-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-06 00:01:00'),
('469456fc-4226-11f0-a686-80c5f2f97990', '801', '2025-06-06 00:00:00', '2025-06-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-06 00:01:00'),
('46945b29-4226-11f0-a686-80c5f2f97990', '220802', '2025-06-06 00:00:00', '2025-06-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-06 00:01:00'),
('469467df-4226-11f0-a686-80c5f2f97990', '220803', '2025-06-07 09:00:00', '2025-06-07 15:16:00', NULL, NULL, 'HKM', '', 'Lembur', '', '181124', '2025-06-06 00:01:00'),
('46946e19-4226-11f0-a686-80c5f2f97990', '024', '2025-06-06 00:00:00', '2025-06-06 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-06 00:01:00'),
('471f916f-dda8-457e-b1a9-180b21bab207', '707', '2025-04-04 08:00:00', '2025-04-04 17:00:00', NULL, NULL, 'HKM', '', '', '', '214505', '2025-04-18 08:53:41'),
('4895e8ae-3d6f-11f0-aae7-80c5f2f97990', '000', '2025-05-31 00:00:00', '2025-05-31 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-31 00:01:00'),
('4895ed91-3d6f-11f0-aae7-80c5f2f97990', '001', '2025-05-31 00:00:00', '2025-05-31 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-31 00:01:00'),
('4895f20e-3d6f-11f0-aae7-80c5f2f97990', '124', '2025-05-31 00:00:00', '2025-05-31 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-31 00:01:00'),
('4895f4af-3d6f-11f0-aae7-80c5f2f97990', '121', '2025-05-31 00:00:00', '2025-05-31 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-31 00:01:00'),
('4895f790-3d6f-11f0-aae7-80c5f2f97990', '707', '2025-05-31 00:00:00', '2025-05-31 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-31 00:01:00'),
('4895fa4b-3d6f-11f0-aae7-80c5f2f97990', '112', '2025-05-31 00:00:00', '2025-05-31 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-31 00:01:00'),
('4895fdb9-3d6f-11f0-aae7-80c5f2f97990', '229', '2025-05-31 00:00:00', '2025-05-31 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-31 00:01:00'),
('4895ffdf-3d6f-11f0-aae7-80c5f2f97990', '801', '2025-05-31 08:00:00', '2025-05-31 14:00:00', NULL, NULL, 'HKM', '', '', '', '181124', '2025-05-31 00:01:00'),
('4896011c-3d6f-11f0-aae7-80c5f2f97990', '220802', '2025-05-31 00:00:00', '2025-05-31 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-31 00:01:00'),
('48960607-3d6f-11f0-aae7-80c5f2f97990', '024', '2025-05-31 00:00:00', '2025-05-31 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-31 00:01:00'),
('48a92278-354b-11f0-a8ce-80c5f2f97990', '826', '2025-05-27 00:00:00', '2025-05-27 00:00:00', NULL, NULL, 'Dinas', '', 'Test hapus SKPD', '', NULL, '2025-05-20 15:23:09'),
('48a932a5-354b-11f0-a8ce-80c5f2f97990', '826', '2025-05-28 00:00:00', '2025-05-28 00:00:00', NULL, NULL, 'Dinas', '', 'Test hapus SKPD', '', NULL, '2025-05-20 15:23:09'),
('48a93e05-354b-11f0-a8ce-80c5f2f97990', '826', '2025-05-29 00:00:00', '2025-05-29 00:00:00', NULL, NULL, 'Dinas', '', 'Test hapus SKPD', '', NULL, '2025-05-20 15:23:09'),
('48a94980-354b-11f0-a8ce-80c5f2f97990', '220803', '2025-05-27 00:00:00', '2025-05-27 00:00:00', NULL, NULL, 'Dinas', '', 'Testing 123', '', NULL, '2025-05-20 15:23:09'),
('48a9552f-354b-11f0-a8ce-80c5f2f97990', '220803', '2025-05-28 00:00:00', '2025-05-28 00:00:00', NULL, NULL, 'Dinas', '', 'Testing 123', '', NULL, '2025-05-20 15:23:09'),
('48a960fd-354b-11f0-a8ce-80c5f2f97990', '220803', '2025-05-29 00:00:00', '2025-05-29 00:00:00', NULL, NULL, 'Dinas', '', 'Testing 123', '', NULL, '2025-05-20 15:23:09'),
('49a770dd-2ca1-11f0-a3d1-0492263d7fc5', '220803', '2025-05-26 00:00:00', '2025-05-26 00:00:00', NULL, NULL, 'Ijin Resmi', '', 'Pernikahan - Mau Kawin Lagi', '', NULL, '2025-05-09 14:46:07'),
('4b5870e7-2ca1-11f0-a3d1-0492263d7fc5', '220803', '2025-06-10 00:00:00', '2025-06-10 00:00:00', NULL, NULL, 'Ijin Resmi', '', 'Pernikahan - Mau Kawin Lagi', '', NULL, '2025-05-09 14:46:10'),
('4bc66248-4ce6-11f0-ad99-0492263d7fc5', '1231', '2025-06-23 00:00:00', '2025-06-23 00:00:00', NULL, NULL, 'Dinas', '', 'Kordinasi take video HUT', '', NULL, '2025-06-19 16:20:44'),
('4bc6afc3-4ce6-11f0-ad99-0492263d7fc5', '1231', '2025-06-24 00:00:00', '2025-06-24 00:00:00', NULL, NULL, 'Dinas', '', 'Kordinasi take video HUT', '', NULL, '2025-06-19 16:20:44'),
('4bc6bca3-4ce6-11f0-ad99-0492263d7fc5', '1231', '2025-06-25 00:00:00', '2025-06-25 00:00:00', NULL, NULL, 'Dinas', '', 'Kordinasi take video HUT', '', NULL, '2025-06-19 16:20:44'),
('4bc6c8d9-4ce6-11f0-ad99-0492263d7fc5', '1231', '2025-06-26 00:00:00', '2025-06-26 00:00:00', NULL, NULL, 'Dinas', '', 'Kordinasi take video HUT', '', NULL, '2025-06-19 16:20:44'),
('4d8f91e9-2a93-11f0-a3d1-0492263d7fc5', '024', '2025-05-07 00:00:00', '2025-05-07 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-07 00:01:00'),
('4d8f9fd9-2a93-11f0-a3d1-0492263d7fc5', '111', '2025-05-07 00:00:00', '2025-05-07 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-07 00:01:00'),
('4d8fa660-2a93-11f0-a3d1-0492263d7fc5', '112', '2025-05-07 00:00:00', '2025-05-07 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-07 00:01:00'),
('4d8faab8-2a93-11f0-a3d1-0492263d7fc5', '121', '2025-05-07 00:00:00', '2025-05-07 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-07 00:01:00'),
('4d8fae5f-2a93-11f0-a3d1-0492263d7fc5', '124', '2025-05-07 00:00:00', '2025-05-07 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-07 00:01:00'),
('4d8fb269-2a93-11f0-a3d1-0492263d7fc5', '229', '2025-05-07 07:35:36', '2025-05-07 19:10:01', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-07 00:01:00'),
('4d8fb71b-2a93-11f0-a3d1-0492263d7fc5', '707', '2025-05-07 00:00:00', '2025-05-07 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-07 00:01:00'),
('4d8fb80b-2a93-11f0-a3d1-0492263d7fc5', '801', '2025-05-07 00:00:00', '2025-05-07 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-07 00:01:00'),
('4d8fbca7-2a93-11f0-a3d1-0492263d7fc5', '826', '2025-05-07 00:00:00', '2025-05-07 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-07 00:01:00'),
('512ce5d9-2125-11f0-acd8-80c5f2f97990', '121', '2025-04-25 00:00:00', '2025-04-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-25 00:01:00'),
('512ce6b3-2125-11f0-acd8-80c5f2f97990', '112', '2025-04-25 00:00:00', '2025-04-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-25 00:01:00'),
('512ce72e-2125-11f0-acd8-80c5f2f97990', '229', '2025-04-25 00:00:00', '2025-04-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-25 00:01:00'),
('51d6ea90-25dc-11f0-acd8-80c5f2f97990', '024', '2025-05-01 00:00:00', '2025-05-01 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-01 00:01:00'),
('51d6ecb8-25dc-11f0-acd8-80c5f2f97990', '111', '2025-05-01 00:00:00', '2025-05-01 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-01 00:01:00'),
('51d6ef36-25dc-11f0-acd8-80c5f2f97990', '112', '2025-05-01 00:00:00', '2025-05-01 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-01 00:01:00'),
('51d6f189-25dc-11f0-acd8-80c5f2f97990', '121', '2025-05-01 00:00:00', '2025-05-01 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-01 00:01:00'),
('51d6f280-25dc-11f0-acd8-80c5f2f97990', '124', '2025-05-01 00:00:00', '2025-05-01 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-01 00:01:00'),
('51d6f351-25dc-11f0-acd8-80c5f2f97990', '229', '2025-05-01 08:24:51', '2025-05-01 17:14:59', NULL, NULL, 'HKC', '', '', '', '291024', '2025-05-01 00:01:00'),
('51d6f481-25dc-11f0-acd8-80c5f2f97990', '707', '2025-05-01 08:00:00', '2025-05-01 17:08:00', NULL, NULL, 'HKM', '', '', '51d6f481-25dc-11f0-acd8-80c5f2f97990.jpg', '181124', '2025-05-01 00:01:00'),
('51d6f53a-25dc-11f0-acd8-80c5f2f97990', '220803', '2025-05-01 07:52:46', '2025-05-01 16:53:35', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-01 00:01:00'),
('51d6f5e0-25dc-11f0-acd8-80c5f2f97990', '826', '2025-05-01 00:00:00', '2025-05-01 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-01 00:01:00'),
('530e5c29-2ca9-11f0-a3d1-0492263d7fc5', '001', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-05-09 15:43:38'),
('530eebb6-2ca9-11f0-a3d1-0492263d7fc5', '001', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-05-09 15:43:38'),
('551f9b83-4b50-11f0-b4c3-0492263d7fc5', '220803', '2025-06-17 00:00:00', '2025-06-17 00:00:00', NULL, NULL, 'Dinas', '', 'SPPD ke samarinda', '', NULL, '2025-06-17 15:54:44'),
('551fe0c3-4b50-11f0-b4c3-0492263d7fc5', '220803', '2025-06-18 00:00:00', '2025-06-18 00:00:00', NULL, NULL, 'Dinas', '', 'SPPD ke samarinda', '', NULL, '2025-06-17 15:54:44'),
('551feecc-4b50-11f0-b4c3-0492263d7fc5', '220803', '2025-06-19 00:00:00', '2025-06-19 00:00:00', NULL, NULL, 'Dinas', '', 'SPPD ke samarinda', '', NULL, '2025-06-17 15:54:44'),
('551ffe43-4b50-11f0-b4c3-0492263d7fc5', '220803', '2025-06-20 00:00:00', '2025-06-20 00:00:00', NULL, NULL, 'Dinas', '', 'SPPD ke samarinda', '', NULL, '2025-06-17 15:54:44'),
('569789d9-2fcb-11f0-b5b1-0492263d7fc5', '707', '2025-05-20 00:00:00', '2025-05-20 00:00:00', NULL, NULL, 'Dinas', '', 'Time attendance', '', NULL, '2025-05-13 15:24:41'),
('56987231-2fcb-11f0-b5b1-0492263d7fc5', '707', '2025-05-21 00:00:00', '2025-05-21 00:00:00', NULL, NULL, 'Dinas', '', 'Time attendance', '', NULL, '2025-05-13 15:24:41'),
('56987d33-2fcb-11f0-b5b1-0492263d7fc5', '707', '2025-05-22 00:00:00', '2025-05-22 00:00:00', NULL, NULL, 'Dinas', '', 'Time attendance', '', NULL, '2025-05-13 15:24:41'),
('5c08ed9f-312c-11f0-aaa2-80c5f2f97990', '707', '2025-05-27 00:00:00', '2025-05-27 00:00:00', NULL, NULL, 'Cuti Tahunan', '', 'Cuti Tahunan - testes', '', NULL, '2025-05-15 09:31:43'),
('60322275-2fd8-11f0-b5b1-0492263d7fc5', '124', '2000-10-05 00:00:00', '2000-10-05 00:00:00', NULL, NULL, 'Cuti Tahunan', '', 'Cuti Tahunan - test cuti', '', NULL, '2025-05-13 16:58:00'),
('61decb17-2fd8-11f0-b5b1-0492263d7fc5', '124', '2000-05-15 00:00:00', '2000-05-15 00:00:00', NULL, NULL, 'Cuti Resmi', '', 'Cuti Resmi - test cuti', '', NULL, '2025-05-13 16:58:03'),
('63a89fc2-2fd8-11f0-b5b1-0492263d7fc5', '220803', '2025-05-19 00:00:00', '2025-05-19 00:00:00', NULL, NULL, 'Cuti Tahunan', '', 'Cuti Tahunan - Acara Keluarga', '', NULL, '2025-05-13 16:58:06'),
('653f9d76-2fd8-11f0-b5b1-0492263d7fc5', '220803', '2025-06-26 00:00:00', '2025-06-26 00:00:00', NULL, NULL, 'Cuti Resmi', '', 'Cuti Resmi - Mau hamil', '', NULL, '2025-05-13 16:58:09'),
('66c78e23-2fd8-11f0-b5b1-0492263d7fc5', '220803', '2025-05-20 00:00:00', '2025-05-20 00:00:00', NULL, NULL, 'Cuti Tahunan', '', 'Cuti Tahunan - Acara Keluarga', '', NULL, '2025-05-13 16:58:11'),
('6aa43b79-2a40-11f0-a3d1-0492263d7fc5', '220803', '2025-05-26 00:00:00', '2025-05-26 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aabba40-2a40-11f0-a3d1-0492263d7fc5', '220803', '2025-05-27 00:00:00', '2025-05-27 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aabe20a-2a40-11f0-a3d1-0492263d7fc5', '220803', '2025-05-28 00:00:00', '2025-05-28 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aac07de-2a40-11f0-a3d1-0492263d7fc5', '220803', '2025-05-29 00:00:00', '2025-05-29 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aac2d96-2a40-11f0-a3d1-0492263d7fc5', '220803', '2025-05-30 00:00:00', '2025-05-30 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aac5309-2a40-11f0-a3d1-0492263d7fc5', '220803', '2025-05-31 00:00:00', '2025-05-31 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aac7efe-2a40-11f0-a3d1-0492263d7fc5', '220803', '2025-06-01 00:00:00', '2025-06-01 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aaca534-2a40-11f0-a3d1-0492263d7fc5', '220803', '2025-06-02 00:00:00', '2025-06-02 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aacca43-2a40-11f0-a3d1-0492263d7fc5', '826', '2025-05-26 00:00:00', '2025-05-26 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aacef08-2a40-11f0-a3d1-0492263d7fc5', '826', '2025-05-27 00:00:00', '2025-05-27 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aad13c5-2a40-11f0-a3d1-0492263d7fc5', '826', '2025-05-28 00:00:00', '2025-05-28 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aad3993-2a40-11f0-a3d1-0492263d7fc5', '826', '2025-05-29 00:00:00', '2025-05-29 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aad5fa0-2a40-11f0-a3d1-0492263d7fc5', '826', '2025-05-30 00:00:00', '2025-05-30 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aad8581-2a40-11f0-a3d1-0492263d7fc5', '826', '2025-05-31 00:00:00', '2025-05-31 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aadaafc-2a40-11f0-a3d1-0492263d7fc5', '826', '2025-06-01 00:00:00', '2025-06-01 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6aade857-2a40-11f0-a3d1-0492263d7fc5', '826', '2025-06-02 00:00:00', '2025-06-02 00:00:00', NULL, NULL, 'Dinas', '', 'Test SPPD, Project PMS', '', NULL, '2025-05-06 14:07:40'),
('6cbd8d8d-887d-43ba-a852-220fa83e55d2', '220803', '2025-06-03 08:00:00', '2025-06-03 17:00:00', NULL, NULL, 'HKM', '', '', '', '181124', '2025-06-17 12:18:32'),
('6cea3df9-2fd8-11f0-b5b1-0492263d7fc5', '220803', '2025-05-29 00:00:00', '2025-05-29 00:00:00', NULL, NULL, 'Cuti Resmi', '', 'Cuti Resmi - Mau hamil', '', NULL, '2025-05-13 16:58:22'),
('6d42bd38-3080-11f0-b40a-80c5f2f97990', '000', '2025-05-14 00:00:00', '2025-05-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-14 13:01:00'),
('6f4596d1-47a6-11f0-b15b-0492263d7fc5', '000', '2025-06-13 00:00:00', '2025-06-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-13 00:01:00'),
('6f459db0-47a6-11f0-b15b-0492263d7fc5', '001', '2025-06-13 00:00:00', '2025-06-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-13 00:01:00'),
('6f45a625-47a6-11f0-b15b-0492263d7fc5', '826', '2025-06-13 00:00:00', '2025-06-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-13 00:01:00'),
('6f45ae05-47a6-11f0-b15b-0492263d7fc5', '124', '2025-06-13 00:00:00', '2025-06-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-13 00:01:00'),
('6f45b5d8-47a6-11f0-b15b-0492263d7fc5', '121', '2025-06-13 00:00:00', '2025-06-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-13 00:01:00'),
('6f45be6b-47a6-11f0-b15b-0492263d7fc5', '707', '2025-06-13 00:00:00', '2025-06-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-13 00:01:00'),
('6f45c584-47a6-11f0-b15b-0492263d7fc5', '112', '2025-06-13 00:00:00', '2025-06-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-13 00:01:00'),
('6f45ce3d-47a6-11f0-b15b-0492263d7fc5', '229', '2025-06-13 00:00:00', '2025-06-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-13 00:01:00'),
('6f45e511-47a6-11f0-b15b-0492263d7fc5', '801', '2025-06-13 00:00:00', '2025-06-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-13 00:01:00'),
('6f45e9ce-47a6-11f0-b15b-0492263d7fc5', '220802', '2025-06-13 00:00:00', '2025-06-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-13 00:01:00'),
('6f45f38f-47a6-11f0-b15b-0492263d7fc5', '220803', '2025-06-13 00:00:00', '2025-06-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-13 00:01:00'),
('6f45fd16-47a6-11f0-b15b-0492263d7fc5', '024', '2025-06-13 00:00:00', '2025-06-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-13 00:01:00'),
('705d6dec-2a3f-11f0-a3d1-0492263d7fc5', '220803', '2025-05-19 00:00:00', '2025-05-19 00:00:00', NULL, NULL, 'Cuti Resmi', '', 'Cuti Tahunan - Acara Keluarga', '', NULL, '2025-05-06 14:00:40'),
('7100928b-4828-11f0-b15b-0492263d7fc5', '024', '2025-06-23 00:00:00', '2025-06-23 00:00:00', NULL, NULL, 'Ijin Resmi', '', 'Pernikahan - Pernikahan Adik Kandung', '', NULL, '2025-06-13 15:31:37'),
('718d836f-227e-11f0-acd8-80c5f2f97990', '111', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-26 17:11:29'),
('718d8b5b-227e-11f0-acd8-80c5f2f97990', '111', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-04-26 17:11:29'),
('754cfd00-4a55-11f0-b15b-0492263d7fc5', '024', '2025-06-23 00:00:00', '2025-06-23 00:00:00', NULL, NULL, 'Cuti Tahunan', '', 'Cuti Tahunan - Daftar Sekolah Anak', '', NULL, '2025-06-16 09:58:52'),
('75895160-34ca-11f0-a8ce-80c5f2f97990', '000', '2025-05-20 00:00:00', '2025-05-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-20 00:01:00'),
('75895303-34ca-11f0-a8ce-80c5f2f97990', '001', '2025-05-20 00:00:00', '2025-05-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-20 00:01:00'),
('7589589a-34ca-11f0-a8ce-80c5f2f97990', '124', '2025-05-20 00:00:00', '2025-05-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-20 00:01:00'),
('75895b45-34ca-11f0-a8ce-80c5f2f97990', '121', '2025-05-20 00:00:00', '2025-05-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-20 00:01:00'),
('75895e86-34ca-11f0-a8ce-80c5f2f97990', '112', '2025-05-20 00:00:00', '2025-05-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-20 00:01:00'),
('75896171-34ca-11f0-a8ce-80c5f2f97990', '229', '2025-05-20 00:00:00', '2025-05-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-20 00:01:00'),
('75896353-34ca-11f0-a8ce-80c5f2f97990', '801', '2025-05-20 00:00:00', '2025-05-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-20 00:01:00'),
('758963ec-34ca-11f0-a8ce-80c5f2f97990', '220802', '2025-05-20 00:00:00', '2025-05-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-20 00:01:00'),
('760e3eb0-4a55-11f0-b15b-0492263d7fc5', '024', '2025-06-24 00:00:00', '2025-06-24 00:00:00', NULL, NULL, 'Cuti Tahunan', '', 'Cuti Tahunan - Daftar Sekolah Anak', '', NULL, '2025-06-16 09:58:53'),
('778b0917-3981-11f0-ada9-80c5f2f97990', '000', '2025-05-26 00:00:00', '2025-05-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-26 00:01:00'),
('778b0afd-3981-11f0-ada9-80c5f2f97990', '001', '2025-05-26 00:00:00', '2025-05-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-26 00:01:00'),
('778b10f6-3981-11f0-ada9-80c5f2f97990', '124', '2025-05-26 00:00:00', '2025-05-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-26 00:01:00'),
('778b1397-3981-11f0-ada9-80c5f2f97990', '121', '2025-05-26 00:00:00', '2025-05-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-26 00:01:00'),
('778b165f-3981-11f0-ada9-80c5f2f97990', '707', '2025-05-26 00:00:00', '2025-05-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-26 00:01:00'),
('778b18da-3981-11f0-ada9-80c5f2f97990', '112', '2025-05-26 00:00:00', '2025-05-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-26 00:01:00'),
('778b1b6f-3981-11f0-ada9-80c5f2f97990', '229', '2025-05-26 00:00:00', '2025-05-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-26 00:01:00'),
('778b1d48-3981-11f0-ada9-80c5f2f97990', '801', '2025-05-26 00:00:00', '2025-05-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-26 00:01:00'),
('778b1e33-3981-11f0-ada9-80c5f2f97990', '220802', '2025-05-26 00:00:00', '2025-05-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-26 00:01:00'),
('778b2286-3981-11f0-ada9-80c5f2f97990', '024', '2025-05-26 00:00:00', '2025-05-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-26 00:01:00'),
('77cd5c00-4828-11f0-b15b-0492263d7fc5', '024', '2025-06-24 00:00:00', '2025-06-24 00:00:00', NULL, NULL, 'Ijin Resmi', '', 'Pernikahan - Pernikahan Adik Kandung', '', NULL, '2025-06-13 15:31:48'),
('7822b608-4828-11f0-b15b-0492263d7fc5', '024', '2025-06-25 00:00:00', '2025-06-25 00:00:00', NULL, NULL, 'Ijin Resmi', '', 'Pernikahan - Pernikahan Adik Kandung', '', NULL, '2025-06-13 15:31:49'),
('785178a7-2b5c-11f0-a3d1-0492263d7fc5', '024', '2025-05-08 00:00:00', '2025-05-08 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-08 00:01:00'),
('78517f21-2b5c-11f0-a3d1-0492263d7fc5', '111', '2025-05-08 00:00:00', '2025-05-08 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-08 00:01:00'),
('7851863e-2b5c-11f0-a3d1-0492263d7fc5', '112', '2025-05-08 00:00:00', '2025-05-08 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-08 00:01:00'),
('78518c9d-2b5c-11f0-a3d1-0492263d7fc5', '121', '2025-05-08 00:00:00', '2025-05-08 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-08 00:01:00'),
('78519313-2b5c-11f0-a3d1-0492263d7fc5', '124', '2025-05-08 00:00:00', '2025-05-08 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-08 00:01:00'),
('7851999c-2b5c-11f0-a3d1-0592263d7fc6', '229', '2025-05-09 07:41:02', '2025-05-09 17:10:44', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-09 00:01:00');
INSERT INTO `attendance` (`attendance_id`, `user_id_machine`, `check_in`, `check_out`, `check_in2`, `check_out2`, `type`, `ijin_info`, `description`, `attachment`, `createdBy`, `createdAt`) VALUES
('7851a268-2b5c-11f0-a3d1-0492263d7fc5', '707', '2025-05-08 00:00:00', '2025-05-08 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-08 00:01:00'),
('7851a60a-2b5c-11f0-a3d1-0492263d7fc5', '801', '2025-05-08 00:00:00', '2025-05-08 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-08 00:01:00'),
('7851b210-2b5c-11f0-a3d1-0492263d7fc5', '220803', '2025-05-08 00:00:00', '2025-05-08 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-08 00:01:00'),
('7851baeb-2b5c-11f0-a3d1-0492263d7fc5', '826', '2025-05-08 00:00:00', '2025-05-08 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-08 00:01:00'),
('7befb511-21ee-11f0-acd8-80c5f2f97990', '121', '2025-04-26 00:00:00', '2025-04-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-26 00:01:00'),
('7befb789-21ee-11f0-acd8-80c5f2f97990', '112', '2025-04-26 00:00:00', '2025-04-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-26 00:01:00'),
('7befb8bc-21ee-11f0-acd8-80c5f2f97990', '229', '2025-04-26 00:00:00', '2025-04-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-26 00:01:00'),
('7befb9d1-21ee-11f0-acd8-80c5f2f97990', '707', '2025-04-26 08:00:00', '2025-04-26 17:00:00', NULL, NULL, 'HKM', 'Permit', 'tes, mantap', '7befb9d1-21ee-11f0-acd8-80c5f2f97990.jpg', '214505', '2025-04-26 00:01:00'),
('7c9c2f8f-26a5-11f0-acd8-80c5f2f97990', '024', '2025-05-02 00:00:00', '2025-05-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-02 00:01:00'),
('7c9c31a6-26a5-11f0-acd8-80c5f2f97990', '111', '2025-05-02 00:00:00', '2025-05-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-02 00:01:00'),
('7c9c33e4-26a5-11f0-acd8-80c5f2f97990', '112', '2025-05-02 08:00:00', '2025-05-02 19:00:00', NULL, NULL, 'HKM', '', '', '', '291024', '2025-05-02 00:01:00'),
('7c9c3627-26a5-11f0-acd8-80c5f2f97990', '121', '2025-05-02 00:00:00', '2025-05-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-02 00:01:00'),
('7c9c37ab-26a5-11f0-acd8-80c5f2f97990', '124', '2025-05-02 00:00:00', '2025-05-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-02 00:01:00'),
('7c9c3944-26a5-11f0-acd8-80c5f2f97990', '229', '2025-05-02 07:54:45', '2025-05-02 17:10:07', '2025-05-02 18:11:32', '2025-05-02 18:21:26', 'HKC', '', '', '', NULL, '2025-05-02 00:01:00'),
('7c9c3cf3-26a5-11f0-acd8-80c5f2f97990', '707', '2025-05-02 09:00:00', '2025-05-02 18:25:00', NULL, NULL, 'HKM', '', 'tes absen HKM!', '7c9c3cf3-26a5-11f0-acd8-80c5f2f97990.jpg', '181124', '2025-05-02 00:01:00'),
('7c9c3f15-26a5-11f0-acd8-80c5f2f97990', '220803', '2025-05-02 07:31:02', '2025-05-02 17:45:43', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-02 00:01:00'),
('7c9c40b2-26a5-11f0-acd8-80c5f2f97990', '826', '2025-05-02 00:00:00', '2025-05-02 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-02 00:01:00'),
('84b30a8a-3056-11f0-b40a-80c5f2f97990', '001', '2025-05-14 00:00:00', '2025-05-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-14 08:01:00'),
('84b31042-3056-11f0-b40a-80c5f2f97990', '024', '2025-05-14 00:00:00', '2025-05-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-14 08:01:00'),
('84b3171e-3056-11f0-b40a-80c5f2f97990', '111', '2025-05-14 00:00:00', '2025-05-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-14 08:01:00'),
('84b321a0-3056-11f0-b40a-80c5f2f97990', '112', '2025-05-14 00:00:00', '2025-05-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-14 08:01:00'),
('84b32b7f-3056-11f0-b40a-80c5f2f97990', '121', '2025-05-14 00:00:00', '2025-05-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-14 08:01:00'),
('84b3365d-3056-11f0-b40a-80c5f2f97990', '124', '2025-05-14 00:00:00', '2025-05-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-14 08:01:00'),
('84b3443a-3056-11f0-b40a-80c5f2f97990', '229', '2025-05-14 10:54:05', '2025-05-14 17:10:57', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-14 08:01:00'),
('84b34e14-3056-11f0-b40a-80c5f2f97990', '707', '2025-05-14 00:00:00', '2025-05-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-14 08:01:00'),
('84b35009-3056-11f0-b40a-80c5f2f97990', '801', '2025-05-14 00:00:00', '2025-05-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-14 08:01:00'),
('84b35953-3056-11f0-b40a-80c5f2f97990', '220803', '2025-05-14 08:00:00', '2025-05-14 21:00:00', NULL, NULL, 'HKM', '', 'lembur ', '', '181124', '2025-05-14 08:01:00'),
('84b363f6-3056-11f0-b40a-80c5f2f97990', '826', '2025-05-14 00:00:00', '2025-05-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-14 08:01:00'),
('85069747-4a66-11f0-b15b-0492263d7fc5', '1231', '2025-06-21 09:00:00', '2025-06-21 15:00:00', NULL, NULL, 'HKM', '', '', '', '181124', '2025-06-16 12:01:00'),
('88388b8c-951a-49df-9da5-6d9cbbded135', '707', '2025-04-03 00:00:00', '2025-04-03 00:00:00', NULL, NULL, 'Sakit', '', '', '', '202207', '2025-04-17 15:43:29'),
('8a6eadff-ef26-4403-bd7d-b1a769b24321', '707', '2025-05-19 08:02:00', '2025-05-19 18:00:00', NULL, NULL, 'HKM', '', '', '', '181124', '2025-05-05 11:21:04'),
('8b2c57e7-2a3a-11f0-a3d1-0492263d7fc5', '220803', '2025-05-07 08:03:30', '2025-05-07 17:07:57', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-06 13:25:38'),
('8e4bff37-226c-11f0-acd8-80c5f2f97990', '024', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-26 15:03:27'),
('8e4c525e-226c-11f0-acd8-80c5f2f97990', '024', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-04-26 15:03:27'),
('94d1364a-226e-11f0-acd8-80c5f2f97990', '024', '2025-04-26 00:00:00', '2025-04-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-26 15:17:57'),
('94d137a3-226e-11f0-acd8-80c5f2f97990', '124', '2025-04-26 00:00:00', '2025-04-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-26 15:17:57'),
('94d13919-226e-11f0-acd8-80c5f2f97990', '220803', '2025-04-26 08:00:00', '2025-04-26 12:00:00', NULL, NULL, 'HKM', '', 'mantap, tes', '94d13919-226e-11f0-acd8-80c5f2f97990.jpg', '181124', '2025-04-26 15:17:57'),
('94d1397f-226e-11f0-acd8-80c5f2f97990', '826', '2025-04-26 00:00:00', '2025-04-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-26 15:17:57'),
('94fcb6da-2cba-11f0-a3d1-0492263d7fc5', '024', '2025-05-19 00:00:00', '2025-05-19 00:00:00', NULL, NULL, 'Dinas', '', 'pemasangan alat', '', NULL, '2025-05-09 17:47:10'),
('94fd54bd-2cba-11f0-a3d1-0492263d7fc5', '024', '2025-05-20 00:00:00', '2025-05-20 00:00:00', NULL, NULL, 'Dinas', '', 'pemasangan alat', '', NULL, '2025-05-09 17:47:10'),
('94fd6a6f-2cba-11f0-a3d1-0492263d7fc5', '024', '2025-05-21 00:00:00', '2025-05-21 00:00:00', NULL, NULL, 'Dinas', '', 'pemasangan alat', '', NULL, '2025-05-09 17:47:10'),
('94fdd4c7-2cba-11f0-a3d1-0492263d7fc5', '024', '2025-05-22 00:00:00', '2025-05-22 00:00:00', NULL, NULL, 'Dinas', '', 'pemasangan alat', '', NULL, '2025-05-09 17:47:10'),
('94fde02f-2cba-11f0-a3d1-0492263d7fc5', '024', '2025-05-23 00:00:00', '2025-05-23 00:00:00', NULL, NULL, 'Dinas', '', 'pemasangan alat', '', NULL, '2025-05-09 17:47:10'),
('97ba1d18-4d26-11f0-ad99-0492263d7fc5', '000', '2025-06-20 00:00:00', '2025-06-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-20 00:01:00'),
('97ba20d6-4d26-11f0-ad99-0492263d7fc5', '1231', '2025-06-20 00:00:00', '2025-06-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-20 00:01:00'),
('97ba2917-4d26-11f0-ad99-0492263d7fc5', '001', '2025-06-20 00:00:00', '2025-06-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-20 00:01:00'),
('97ba3518-4d26-11f0-ad99-0492263d7fc5', '826', '2025-06-20 00:00:00', '2025-06-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-20 00:01:00'),
('97ba412d-4d26-11f0-ad99-0492263d7fc5', '124', '2025-06-20 00:00:00', '2025-06-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-20 00:01:00'),
('97ba4c53-4d26-11f0-ad99-0492263d7fc5', '121', '2025-06-20 00:00:00', '2025-06-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-20 00:01:00'),
('97ba5860-4d26-11f0-ad99-0492263d7fc5', '707', '2025-06-20 00:00:00', '2025-06-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-20 00:01:00'),
('97ba6326-4d26-11f0-ad99-0492263d7fc5', '112', '2025-06-20 00:00:00', '2025-06-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-20 00:01:00'),
('97ba6e85-4d26-11f0-ad99-0492263d7fc5', '229', '2025-06-20 00:00:00', '2025-06-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-20 00:01:00'),
('97ba7815-4d26-11f0-ad99-0492263d7fc5', '801', '2025-06-20 00:00:00', '2025-06-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-20 00:01:00'),
('97ba7e5b-4d26-11f0-ad99-0492263d7fc5', '220802', '2025-06-20 00:00:00', '2025-06-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-20 00:01:00'),
('97ba8fff-4d26-11f0-ad99-0492263d7fc5', '024', '2025-06-20 00:00:00', '2025-06-20 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-20 00:01:00'),
('97e6d36c-3549-11f0-a8ce-80c5f2f97990', '220803', '2025-05-20 00:00:00', '2025-05-20 00:00:00', NULL, NULL, 'Dinas', '', 'Take video HUT Sagatrade', '', NULL, '2025-05-20 15:11:03'),
('97e708fa-3549-11f0-a8ce-80c5f2f97990', '220803', '2025-05-21 00:00:00', '2025-05-21 00:00:00', NULL, NULL, 'Dinas', '', 'Take video HUT Sagatrade', '', NULL, '2025-05-20 15:11:03'),
('97e7405a-3549-11f0-a8ce-80c5f2f97990', '220803', '2025-05-22 00:00:00', '2025-05-22 00:00:00', NULL, NULL, 'Dinas', '', 'Take video HUT Sagatrade', '', NULL, '2025-05-20 15:11:03'),
('97e75171-3549-11f0-a8ce-80c5f2f97990', '220803', '2025-05-23 00:00:00', '2025-05-23 00:00:00', NULL, NULL, 'Dinas', '', 'Take video HUT Sagatrade', '', NULL, '2025-05-20 15:11:03'),
('97e75cd1-3549-11f0-a8ce-80c5f2f97990', '220803', '2025-05-24 00:00:00', '2025-05-24 00:00:00', NULL, NULL, 'Dinas', '', 'Take video HUT Sagatrade', '', NULL, '2025-05-20 15:11:03'),
('9a096d61-486f-11f0-b15b-0492263d7fc5', '000', '2025-06-14 00:00:00', '2025-06-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-14 00:01:00'),
('9a0972c8-486f-11f0-b15b-0492263d7fc5', '001', '2025-06-14 00:00:00', '2025-06-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-14 00:01:00'),
('9a09796b-486f-11f0-b15b-0492263d7fc5', '826', '2025-06-14 00:00:00', '2025-06-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-14 00:01:00'),
('9a0980b3-486f-11f0-b15b-0492263d7fc5', '124', '2025-06-14 00:00:00', '2025-06-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-14 00:01:00'),
('9a09882d-486f-11f0-b15b-0492263d7fc5', '121', '2025-06-14 00:00:00', '2025-06-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-14 00:01:00'),
('9a098f86-486f-11f0-b15b-0492263d7fc5', '707', '2025-06-14 00:00:00', '2025-06-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-14 00:01:00'),
('9a09967b-486f-11f0-b15b-0492263d7fc5', '112', '2025-06-14 00:00:00', '2025-06-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-14 00:01:00'),
('9a099dd5-486f-11f0-b15b-0492263d7fc5', '229', '2025-06-14 00:00:00', '2025-06-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-14 00:01:00'),
('9a09a764-486f-11f0-b15b-0492263d7fc5', '220802', '2025-06-14 00:00:00', '2025-06-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-14 00:01:00'),
('9a09b200-486f-11f0-b15b-0492263d7fc5', '220803', '2025-06-14 00:00:00', '2025-06-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-14 00:01:00'),
('9a09b91c-486f-11f0-b15b-0492263d7fc5', '024', '2025-06-14 00:00:00', '2025-06-14 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-14 00:01:00'),
('9e05feec-afad-4164-a45c-22aefc1be428', '000', '2025-05-27 08:00:00', '2025-05-27 18:00:00', NULL, NULL, 'HKM', '', '', '', '181124', '2025-06-17 12:09:48'),
('a032725f-307f-11f0-b40a-80c5f2f97990', '000', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-05-14 12:55:15'),
('a032da6d-307f-11f0-b40a-80c5f2f97990', '000', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-05-14 12:55:15'),
('a0da10f9-30dc-11f0-b40a-80c5f2f97990', '000', '2025-05-15 00:00:00', '2025-05-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-15 00:01:00'),
('a0da13e8-30dc-11f0-b40a-80c5f2f97990', '001', '2025-05-15 00:00:00', '2025-05-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-15 00:01:00'),
('a0da1a43-30dc-11f0-b40a-80c5f2f97990', '024', '2025-05-15 00:00:00', '2025-05-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-15 00:01:00'),
('a0da1fc8-30dc-11f0-b40a-80c5f2f97990', '111', '2025-05-15 00:00:00', '2025-05-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-15 00:01:00'),
('a0da257f-30dc-11f0-b40a-80c5f2f97990', '112', '2025-05-15 00:00:00', '2025-05-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-15 00:01:00'),
('a0da2bfe-30dc-11f0-b40a-80c5f2f97990', '121', '2025-05-15 00:00:00', '2025-05-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-15 00:01:00'),
('a0da31ad-30dc-11f0-b40a-80c5f2f97990', '124', '2025-05-15 00:00:00', '2025-05-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-15 00:01:00'),
('a0da382b-30dc-11f0-b40a-80c5f2f97990', '229', '2025-05-15 00:00:00', '2025-05-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-15 00:01:00'),
('a0da3f50-30dc-11f0-b40a-80c5f2f97990', '707', '2025-05-15 08:00:00', '2025-05-15 18:00:00', NULL, NULL, 'HKM', '', '', '', '291024', '2025-05-15 00:01:00'),
('a0da42d2-30dc-11f0-b40a-80c5f2f97990', '801', '2025-05-15 00:00:00', '2025-05-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-15 00:01:00'),
('a0da4bba-30dc-11f0-b40a-80c5f2f97990', '220803', '2025-05-15 00:00:00', '2025-05-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-15 00:01:00'),
('a0da5357-30dc-11f0-b40a-80c5f2f97990', '826', '2025-05-15 00:00:00', '2025-05-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-15 00:01:00'),
('a31813a9-2c25-11f0-a3d1-0492263d7fc5', '024', '2025-05-09 00:00:00', '2025-05-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-09 00:01:00'),
('a318163f-2c25-11f0-a3d1-0492263d7fc5', '111', '2025-05-09 00:00:00', '2025-05-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-09 00:01:00'),
('a31817b2-2c25-11f0-a3d1-0492263d7fc5', '112', '2025-05-09 00:00:00', '2025-05-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-09 00:01:00'),
('a3181911-2c25-11f0-a3d1-0492263d7fc5', '121', '2025-05-09 00:00:00', '2025-05-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-09 00:01:00'),
('a3181a48-2c25-11f0-a3d1-0492263d7fc5', '124', '2025-05-09 00:00:00', '2025-05-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-09 00:01:00'),
('a3181cb5-2c25-11f0-a3d1-0492263d7fc5', '707', '2025-05-09 00:00:00', '2025-05-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-09 00:01:00'),
('a3181d6a-2c25-11f0-a3d1-0492263d7fc5', '801', '2025-05-09 00:00:00', '2025-05-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-09 00:01:00'),
('a3181fae-2c25-11f0-a3d1-0492263d7fc5', '220803', '2025-05-09 00:00:00', '2025-05-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-09 00:01:00'),
('a31821de-2c25-11f0-a3d1-0492263d7fc5', '826', '2025-05-09 00:00:00', '2025-05-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-09 00:01:00'),
('a400f362-b9ef-4784-8783-4cc190544f81', '707', '2025-05-17 08:00:00', '2025-05-17 17:00:00', NULL, NULL, 'HKM', '', '', 'a400f362-b9ef-4784-8783-4cc190544f81.jpg', '181124', '2025-05-05 11:22:01'),
('a448d1ed-1b36-11f0-b115-0492263d7fc5', '121', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-17 10:49:54'),
('a448d449-1b36-11f0-b115-0492263d7fc5', '112', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-17 10:49:54'),
('a448d4e4-1b36-11f0-b115-0492263d7fc5', '229', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-17 10:49:54'),
('a6ae9995-22b7-11f0-acd8-80c5f2f97990', '024', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-27 00:01:00'),
('a6ae9a8f-22b7-11f0-acd8-80c5f2f97990', '111', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-27 00:01:00'),
('a6ae9b7a-22b7-11f0-acd8-80c5f2f97990', '112', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, 'Sakit', '', '', '', '291024', '2025-04-27 00:01:00'),
('a6ae9c63-22b7-11f0-acd8-80c5f2f97990', '121', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-27 00:01:00'),
('a6ae9d03-22b7-11f0-acd8-80c5f2f97990', '124', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-27 00:01:00'),
('a6ae9df1-22b7-11f0-acd8-80c5f2f97990', '229', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-27 00:01:00'),
('a6ae9f98-22b7-11f0-acd8-80c5f2f97990', '707', '2025-04-25 00:15:00', '2025-04-27 00:00:00', NULL, NULL, 'Sakit', '', '', '', '291024', '2025-04-27 00:01:00'),
('a6aea043-22b7-11f0-acd8-80c5f2f97990', '220803', '2025-04-27 08:00:00', '2025-04-27 17:00:00', NULL, NULL, 'HKM', '', '', '', '291024', '2025-04-27 00:01:00'),
('a6aea0e5-22b7-11f0-acd8-80c5f2f97990', '826', '2025-04-27 00:00:00', '2025-04-27 00:00:00', NULL, NULL, 'HKM', '', '', '', '291024', '2025-04-27 00:01:00'),
('a6fa135a-4db2-11f0-be24-80c5f2f97990', '220803', '2025-06-23 00:00:00', '2025-06-23 00:00:00', NULL, NULL, 'Dinas', '', 'Dinas ke samarinda', '', NULL, '2025-06-20 16:43:35'),
('a6fa9261-4db2-11f0-be24-80c5f2f97990', '220803', '2025-06-24 00:00:00', '2025-06-24 00:00:00', NULL, NULL, 'Dinas', '', 'Dinas ke samarinda', '', NULL, '2025-06-20 16:43:35'),
('a6fa9e61-4db2-11f0-be24-80c5f2f97990', '220803', '2025-06-25 00:00:00', '2025-06-25 00:00:00', NULL, NULL, 'Dinas', '', 'Dinas ke samarinda', '', NULL, '2025-06-20 16:43:35'),
('a6faa8ab-4db2-11f0-be24-80c5f2f97990', '220803', '2025-06-26 00:00:00', '2025-06-26 00:00:00', NULL, NULL, 'Dinas', '', 'Dinas ke samarinda', '', NULL, '2025-06-20 16:43:35'),
('a6fab367-4db2-11f0-be24-80c5f2f97990', '220803', '2025-06-27 00:00:00', '2025-06-27 00:00:00', NULL, NULL, 'Dinas', '', 'Dinas ke samarinda', '', NULL, '2025-06-20 16:43:35'),
('a7679000-276e-11f0-acd8-80c5f2f97990', '121', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 00:01:00'),
('a76790cb-276e-11f0-acd8-80c5f2f97990', '124', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 00:01:00'),
('a76791e7-276e-11f0-acd8-80c5f2f97990', '229', '2025-05-03 07:40:07', '2025-05-03 17:51:46', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-03 00:01:00'),
('a7679362-276e-11f0-acd8-80c5f2f97990', '707', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 00:01:00'),
('a7679445-276e-11f0-acd8-80c5f2f97990', '220803', '2025-05-03 07:56:45', '2025-05-03 17:02:20', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-03 00:01:00'),
('a7679511-276e-11f0-acd8-80c5f2f97990', '826', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 00:01:00'),
('a862ff14-2b12-11f0-a3d1-0492263d7fc5', '220803', '2025-05-20 00:00:00', '2025-05-20 00:00:00', NULL, NULL, 'Cuti Resmi', '', 'Cuti Tahunan - Acara Keluarga', '', NULL, '2025-05-07 15:12:38'),
('aa63dbaf-4a7f-11f0-b15b-0492263d7fc5', '1231', '2025-06-16 00:00:00', '2025-06-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-16 15:01:00'),
('afecdd76-454b-11f0-ac39-0492263d7fc5', '000', '2025-06-10 00:00:00', '2025-06-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-10 00:06:21'),
('afece000-454b-11f0-ac39-0492263d7fc5', '001', '2025-06-10 00:00:00', '2025-06-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-10 00:06:21'),
('afece375-454b-11f0-ac39-0492263d7fc5', '826', '2025-06-10 00:00:00', '2025-06-10 00:00:00', NULL, NULL, 'Mangkir', '', 'TIdak ada keterangan', '', '181124', '2025-06-10 00:06:21'),
('afece6d8-454b-11f0-ac39-0492263d7fc5', '124', '2025-06-10 00:00:00', '2025-06-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-10 00:06:21'),
('afece9f5-454b-11f0-ac39-0492263d7fc5', '121', '2025-06-10 00:00:00', '2025-06-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-10 00:06:21'),
('afeced4f-454b-11f0-ac39-0492263d7fc5', '707', '2025-06-10 00:00:00', '2025-06-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-10 00:06:21'),
('afecf069-454b-11f0-ac39-0492263d7fc5', '112', '2025-06-10 00:00:00', '2025-06-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-10 00:06:21'),
('afecf3be-454b-11f0-ac39-0492263d7fc5', '229', '2025-06-10 00:00:00', '2025-06-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-10 00:06:21'),
('afecf642-454b-11f0-ac39-0492263d7fc5', '801', '2025-06-10 00:00:00', '2025-06-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-10 00:06:21'),
('afecf7e3-454b-11f0-ac39-0492263d7fc5', '220802', '2025-06-10 00:00:00', '2025-06-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-10 00:06:21'),
('afecfc98-454b-11f0-ac39-0492263d7fc5', '024', '2025-06-10 00:00:00', '2025-06-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-10 00:06:21'),
('b57e11cf-bbb0-49d5-9846-b1a5583f23d2', '707', '2025-05-21 08:00:00', '2025-05-21 18:00:00', NULL, NULL, 'HKM', '', '', 'b57e11cf-bbb0-49d5-9846-b1a5583f23d2.jpg', '181124', '2025-05-05 09:06:31'),
('b964d0dc-1f49-11f0-b2eb-0492263d7fc5', NULL, '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-22 15:16:36'),
('b964eec7-1f49-11f0-b2eb-0492263d7fc5', NULL, '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-04-22 15:16:36'),
('bacf2a36-344c-11f0-a8ce-80c5f2f97990', '000', '2025-05-19 00:00:00', '2025-05-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-19 09:01:00'),
('bacf2d0a-344c-11f0-a8ce-80c5f2f97990', '001', '2025-05-19 00:00:00', '2025-05-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-19 09:01:00'),
('bacf33af-344c-11f0-a8ce-80c5f2f97990', '111', '2025-05-19 00:00:00', '2025-05-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-19 09:01:00'),
('bacf384e-344c-11f0-a8ce-80c5f2f97990', '112', '2025-05-19 00:00:00', '2025-05-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-19 09:01:00'),
('bacf3ce0-344c-11f0-a8ce-80c5f2f97990', '121', '2025-05-19 00:00:00', '2025-05-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-19 09:01:00'),
('bacf4199-344c-11f0-a8ce-80c5f2f97990', '124', '2025-05-19 00:00:00', '2025-05-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-19 09:01:00'),
('bacf498b-344c-11f0-a8ce-80c5f2f97990', '229', '2025-05-19 00:00:00', '2025-05-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-19 09:01:00'),
('bacf5082-344c-11f0-a8ce-80c5f2f97990', '801', '2025-05-19 00:00:00', '2025-05-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-19 09:01:00'),
('bacf570b-344c-11f0-a8ce-80c5f2f97990', '826', '2025-05-19 00:00:00', '2025-05-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-19 09:01:00'),
('bccd70c6-2f95-11f0-b5b1-0492263d7fc5', '001', '2025-05-13 00:00:00', '2025-05-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-13 09:01:00'),
('bccd7353-2f95-11f0-b5b1-0492263d7fc5', '024', '2025-05-13 00:00:00', '2025-05-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-13 09:01:00'),
('bccd74f9-2f95-11f0-b5b1-0492263d7fc5', '111', '2025-05-13 00:00:00', '2025-05-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-13 09:01:00'),
('bccd76d8-2f95-11f0-b5b1-0492263d7fc5', '112', '2025-05-13 00:00:00', '2025-05-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-13 09:01:00'),
('bccd7896-2f95-11f0-b5b1-0492263d7fc5', '121', '2025-05-13 00:00:00', '2025-05-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-13 09:01:00'),
('bccd7a54-2f95-11f0-b5b1-0492263d7fc5', '124', '2025-05-13 00:00:00', '2025-05-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-13 09:01:00'),
('bccd7c39-2f95-11f0-b5b1-0492263d7fc5', '229', '2025-05-13 08:03:47', '2025-05-13 17:58:41', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-13 09:01:00'),
('bccd7c39-2f95-11f0-b5b1-0492263d7fc6', '229', '2025-05-11 08:24:14', '2025-05-11 17:16:55', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-13 09:01:00'),
('bccd7c39-2f95-11f0-b5b1-0492263d7fc7', '229', '2025-05-12 20:00:35', '2025-05-13 08:02:31', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-13 09:01:00'),
('bccd7e5a-2f95-11f0-b5b1-0492263d7fc5', '707', '2025-05-13 00:00:00', '2025-05-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-13 09:01:00'),
('bccd7f6c-2f95-11f0-b5b1-0492263d7fc5', '801', '2025-05-13 00:00:00', '2025-05-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-13 09:01:00'),
('bccd8656-2f95-11f0-b5b1-0492263d7fc5', '826', '2025-05-13 00:00:00', '2025-05-13 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-13 09:01:00'),
('bdf4736c-20da-11f0-acd8-80c5f2f97990', '707', '2025-04-21 00:00:00', '2025-04-21 00:00:00', NULL, NULL, 'Bencana Alam', '', 'banjir', '', NULL, '2025-04-24 15:07:10'),
('bf99831d-2cab-11f0-a3d1-0492263d7fc5', '001', '2025-05-09 00:00:00', '2025-05-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-09 16:01:00'),
('bfd317f9-2b12-11f0-a3d1-0492263d7fc5', '220803', '2025-05-13 00:00:00', '2025-05-13 00:00:00', NULL, NULL, 'Ijin Resmi', '', 'Kelahiran Anak - Test izin', '', NULL, '2025-05-07 15:13:17'),
('c1d63416-c7c8-42ea-bda1-ba0970e57a48', '220803', '2025-04-25 08:15:00', '2025-04-25 17:20:00', NULL, NULL, 'HKM', '', '', '', '214505', '2025-04-27 14:49:12'),
('c24388f1-4def-11f0-be24-80c5f2f97990', '000', '2025-06-21 00:00:00', '2025-06-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-21 00:01:00'),
('c2438ff3-4def-11f0-be24-80c5f2f97990', '001', '2025-06-21 00:00:00', '2025-06-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-21 00:01:00'),
('c2439754-4def-11f0-be24-80c5f2f97990', '826', '2025-06-21 00:00:00', '2025-06-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-21 00:01:00'),
('c243a0c6-4def-11f0-be24-80c5f2f97990', '124', '2025-06-21 00:00:00', '2025-06-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-21 00:01:00'),
('c243aca7-4def-11f0-be24-80c5f2f97990', '121', '2025-06-21 00:00:00', '2025-06-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-21 00:01:00'),
('c243b819-4def-11f0-be24-80c5f2f97990', '707', '2025-06-21 00:00:00', '2025-06-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-21 00:01:00'),
('c243c375-4def-11f0-be24-80c5f2f97990', '112', '2025-06-21 00:00:00', '2025-06-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-21 00:01:00'),
('c243cf2c-4def-11f0-be24-80c5f2f97990', '229', '2025-06-21 00:00:00', '2025-06-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-21 00:01:00'),
('c243d9d9-4def-11f0-be24-80c5f2f97990', '801', '2025-06-21 00:00:00', '2025-06-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-21 00:01:00'),
('c243e0a7-4def-11f0-be24-80c5f2f97990', '220802', '2025-06-21 00:00:00', '2025-06-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-21 00:01:00'),
('c243f0fd-4def-11f0-be24-80c5f2f97990', '220803', '2025-06-21 00:00:00', '2025-06-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-21 00:01:00'),
('c243fc97-4def-11f0-be24-80c5f2f97990', '024', '2025-06-21 00:00:00', '2025-06-21 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-21 00:01:00'),
('c4df5be7-4938-11f0-b15b-0492263d7fc5', '000', '2025-06-15 00:00:00', '2025-06-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-15 00:01:00'),
('c4df603d-4938-11f0-b15b-0492263d7fc5', '001', '2025-06-15 00:00:00', '2025-06-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-15 00:01:00'),
('c4df6460-4938-11f0-b15b-0492263d7fc5', '826', '2025-06-15 00:00:00', '2025-06-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-15 00:01:00'),
('c4df6a42-4938-11f0-b15b-0492263d7fc5', '124', '2025-06-15 00:00:00', '2025-06-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-15 00:01:00'),
('c4df6f2c-4938-11f0-b15b-0492263d7fc5', '121', '2025-06-15 00:00:00', '2025-06-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-15 00:01:00'),
('c4df758e-4938-11f0-b15b-0492263d7fc5', '707', '2025-06-15 00:00:00', '2025-06-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-15 00:01:00'),
('c4df7982-4938-11f0-b15b-0492263d7fc5', '112', '2025-06-15 00:00:00', '2025-06-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-15 00:01:00'),
('c4df7e76-4938-11f0-b15b-0492263d7fc5', '229', '2025-06-15 00:00:00', '2025-06-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-15 00:01:00'),
('c4df81b5-4938-11f0-b15b-0492263d7fc5', '801', '2025-06-15 00:00:00', '2025-06-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-15 00:01:00'),
('c4df83e1-4938-11f0-b15b-0492263d7fc5', '220802', '2025-06-15 00:00:00', '2025-06-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-15 00:01:00'),
('c4df8914-4938-11f0-b15b-0492263d7fc5', '220803', '2025-06-15 00:00:00', '2025-06-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-15 00:01:00'),
('c4df8cd5-4938-11f0-b15b-0492263d7fc5', '024', '2025-06-15 00:00:00', '2025-06-15 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-15 00:01:00'),
('c57e57ee-227f-11f0-acd8-80c5f2f97990', '111', '2025-04-26 00:00:00', '2025-04-26 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-26 17:21:00'),
('c5fc10fd-38c8-11f0-ada9-80c5f2f97990', '000', '2025-05-25 00:00:00', '2025-05-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-25 01:59:00'),
('c5fc149a-38c8-11f0-ada9-80c5f2f97990', '001', '2025-05-25 00:00:00', '2025-05-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-25 01:59:00'),
('c5fc1f98-38c8-11f0-ada9-80c5f2f97990', '124', '2025-05-25 00:00:00', '2025-05-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-25 01:59:00'),
('c5fc249d-38c8-11f0-ada9-80c5f2f97990', '121', '2025-05-25 00:00:00', '2025-05-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-25 01:59:00'),
('c5fc2ba6-38c8-11f0-ada9-80c5f2f97990', '707', '2025-05-25 00:00:00', '2025-05-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-25 01:59:00'),
('c5fc3099-38c8-11f0-ada9-80c5f2f97990', '112', '2025-05-25 00:00:00', '2025-05-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-25 01:59:00'),
('c5fc361a-38c8-11f0-ada9-80c5f2f97990', '229', '2025-05-25 00:00:00', '2025-05-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-25 01:59:00'),
('c5fc39e2-38c8-11f0-ada9-80c5f2f97990', '801', '2025-05-25 00:00:00', '2025-05-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-25 01:59:00'),
('c5fc3ba4-38c8-11f0-ada9-80c5f2f97990', '220802', '2025-05-25 00:00:00', '2025-05-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-25 01:59:00'),
('c5fc4516-38c8-11f0-ada9-80c5f2f97990', '220803', '2025-05-25 00:00:00', '2025-05-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-25 01:59:00'),
('c5fc49d0-38c8-11f0-ada9-80c5f2f97990', '024', '2025-05-25 00:00:00', '2025-05-25 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-25 01:59:00'),
('c74bc4c5-3fca-11f0-a8b2-80c5f2f97990', '000', '2025-06-03 00:00:00', '2025-06-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-03 00:01:00'),
('c74bc8fb-3fca-11f0-a8b2-80c5f2f97990', '001', '2025-06-03 00:00:00', '2025-06-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-03 00:01:00'),
('c74bce97-3fca-11f0-a8b2-80c5f2f97990', '826', '2025-06-03 08:00:00', '2025-06-03 17:00:00', NULL, NULL, 'HKM', '', '', '', '181124', '2025-06-03 00:01:00'),
('c74bd5a4-3fca-11f0-a8b2-80c5f2f97990', '124', '2025-06-03 00:00:00', '2025-06-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-03 00:01:00'),
('c74bddb1-3fca-11f0-a8b2-80c5f2f97990', '121', '2025-06-03 00:00:00', '2025-06-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-03 00:01:00'),
('c74be4de-3fca-11f0-a8b2-80c5f2f97990', '707', '2025-06-03 00:00:00', '2025-06-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-03 00:01:00'),
('c74bec5a-3fca-11f0-a8b2-80c5f2f97990', '112', '2025-06-03 00:00:00', '2025-06-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-03 00:01:00'),
('c74bf347-3fca-11f0-a8b2-80c5f2f97990', '229', '2025-06-03 00:00:00', '2025-06-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-03 00:01:00'),
('c74bf75d-3fca-11f0-a8b2-80c5f2f97990', '801', '2025-06-03 00:00:00', '2025-06-03 00:00:00', NULL, NULL, 'Sakit', 'Sick', '', '', '181124', '2025-06-03 00:01:00'),
('c74bf9a4-3fca-11f0-a8b2-80c5f2f97990', '220802', '2025-06-03 00:00:00', '2025-06-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-03 00:01:00'),
('c74c011a-3fca-11f0-a8b2-80c5f2f97990', '220803', '2025-06-03 00:00:00', '2025-06-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-03 00:01:00'),
('c74c05dd-3fca-11f0-a8b2-80c5f2f97990', '024', '2025-06-03 00:00:00', '2025-06-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-03 00:01:00'),
('c84ff7f1-3b13-11f0-b018-80c5f2f97990', '000', '2025-05-28 00:00:00', '2025-05-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-28 00:01:00'),
('c84fff03-3b13-11f0-b018-80c5f2f97990', '001', '2025-05-28 00:00:00', '2025-05-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-28 00:01:00'),
('c8500640-3b13-11f0-b018-80c5f2f97990', '124', '2025-05-28 00:00:00', '2025-05-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-28 00:01:00'),
('c8500b4c-3b13-11f0-b018-80c5f2f97990', '121', '2025-05-28 00:00:00', '2025-05-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-28 00:01:00'),
('c85010dd-3b13-11f0-b018-80c5f2f97990', '707', '2025-05-28 00:00:00', '2025-05-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-28 00:01:00'),
('c8501604-3b13-11f0-b018-80c5f2f97990', '112', '2025-05-28 00:00:00', '2025-05-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-28 00:01:00'),
('c8501bd8-3b13-11f0-b018-80c5f2f97990', '229', '2025-05-28 00:00:00', '2025-05-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-28 00:01:00'),
('c8501fbb-3b13-11f0-b018-80c5f2f97990', '801', '2025-05-28 07:55:00', '2025-05-28 16:57:00', NULL, NULL, 'HKM', '', '', '', '181124', '2025-05-28 00:01:00'),
('c85021cd-3b13-11f0-b018-80c5f2f97990', '220802', '2025-05-28 08:00:00', '2025-05-28 19:00:00', NULL, NULL, 'HKM', '', '', '', '181124', '2025-05-28 00:01:00'),
('c85029a0-3b13-11f0-b018-80c5f2f97990', '024', '2025-05-28 00:00:00', '2025-05-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-28 00:01:00'),
('ca0059a2-84c4-44a8-b461-0e0d035d28f6', '000', '2025-06-18 08:00:00', '2025-06-18 18:00:00', NULL, NULL, 'HKM', '', '', '', '181124', '2025-06-17 12:06:32'),
('cad38d79-365c-11f0-b430-80c5f2f97990', '000', '2025-05-22 00:00:00', '2025-05-22 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-22 00:01:00'),
('cad39027-365c-11f0-b430-80c5f2f97990', '001', '2025-05-22 00:00:00', '2025-05-22 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-22 00:01:00'),
('cad398e3-365c-11f0-b430-80c5f2f97990', '124', '2025-05-22 00:00:00', '2025-05-22 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-22 00:01:00'),
('cad39d0b-365c-11f0-b430-80c5f2f97990', '121', '2025-05-22 00:00:00', '2025-05-22 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-22 00:01:00'),
('cad3a1e4-365c-11f0-b430-80c5f2f97990', '112', '2025-05-22 00:00:00', '2025-05-22 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-22 00:01:00'),
('cad3a6d9-365c-11f0-b430-80c5f2f97990', '229', '2025-05-22 00:00:00', '2025-05-22 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-22 00:01:00'),
('cad3a9f3-365c-11f0-b430-80c5f2f97990', '801', '2025-05-22 00:00:00', '2025-05-22 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-22 00:01:00'),
('cad3ab5c-365c-11f0-b430-80c5f2f97990', '220802', '2025-05-22 00:00:00', '2025-05-22 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-22 00:01:00'),
('cbe81ed3-27e3-11f0-acd8-80c5f2f97990', NULL, '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-05-03 13:59:31'),
('cbe85f8c-27e3-11f0-acd8-80c5f2f97990', NULL, '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-05-03 13:59:31'),
('cc32b229-4cea-11f0-ad99-0492263d7fc5', '124', '2025-06-23 00:00:00', '2025-06-23 00:00:00', NULL, NULL, 'Ijin Resmi', '', 'Bencana Alam - Banjir', '', NULL, '2025-06-19 16:52:58'),
('d0d9f88b-2be2-11f0-a3d1-0492263d7fc5', '826', '2025-05-20 00:00:00', '2025-05-20 00:00:00', NULL, NULL, 'Dinas', '', 'Untuk Pemasangan Alat Pada Mesin Produksi', '', NULL, '2025-05-08 16:02:40'),
('d0da3782-2be2-11f0-a3d1-0492263d7fc5', '826', '2025-05-21 00:00:00', '2025-05-21 00:00:00', NULL, NULL, 'Dinas', '', 'Untuk Pemasangan Alat Pada Mesin Produksi', '', NULL, '2025-05-08 16:02:40'),
('d0da4117-2be2-11f0-a3d1-0492263d7fc5', '826', '2025-05-22 00:00:00', '2025-05-22 00:00:00', NULL, NULL, 'Dinas', '', 'Untuk Pemasangan Alat Pada Mesin Produksi', '', NULL, '2025-05-08 16:02:40'),
('d0da4a26-2be2-11f0-a3d1-0492263d7fc5', '826', '2025-05-23 00:00:00', '2025-05-23 00:00:00', NULL, NULL, 'Dinas', '', 'Untuk Pemasangan Alat Pada Mesin Produksi', '', NULL, '2025-05-08 16:02:40'),
('d0da521f-2be2-11f0-a3d1-0492263d7fc5', '826', '2025-05-24 00:00:00', '2025-05-24 00:00:00', NULL, NULL, 'Dinas', '', 'Untuk Pemasangan Alat Pada Mesin Produksi', '', NULL, '2025-05-08 16:02:40'),
('d0da5b56-2be2-11f0-a3d1-0492263d7fc5', '826', '2025-05-25 00:00:00', '2025-05-25 00:00:00', NULL, NULL, 'Dinas', '', 'Untuk Pemasangan Alat Pada Mesin Produksi', '', NULL, '2025-05-08 16:02:40'),
('d0da6411-2be2-11f0-a3d1-0492263d7fc5', '826', '2025-05-26 00:00:00', '2025-05-26 00:00:00', NULL, NULL, 'Dinas', '', 'Untuk Pemasangan Alat Pada Mesin Produksi', '', NULL, '2025-05-08 16:02:40'),
('d17b82d5-2380-11f0-acd8-80c5f2f97990', '024', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d17b8885-2380-11f0-acd8-80c5f2f97990', '111', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d17b8bf6-2380-11f0-acd8-80c5f2f97990', '112', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d17b8f13-2380-11f0-acd8-80c5f2f97990', '121', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d17b9178-2380-11f0-acd8-80c5f2f97990', '124', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d17b9596-2380-11f0-acd8-80c5f2f97990', '229', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d17b9d12-2380-11f0-acd8-80c5f2f97990', '220803', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, 'Sakit', 'Sick', 'Izin Sakit', 'd17b9d12-2380-11f0-acd8-80c5f2f97990.jpg', '291024', '2025-04-28 00:01:00'),
('d17ba01c-2380-11f0-acd8-80c5f2f97990', '826', '2025-04-28 00:00:00', '2025-04-28 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-28 00:01:00'),
('d2334d24-2837-11f0-acd8-80c5f2f97990', '024', '2025-05-04 00:00:00', '2025-05-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-04 00:01:00'),
('d2334ee1-2837-11f0-acd8-80c5f2f97990', '111', '2025-05-04 00:00:00', '2025-05-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-04 00:01:00'),
('d2335009-2837-11f0-acd8-80c5f2f97990', '112', '2025-05-04 00:00:00', '2025-05-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-04 00:01:00'),
('d2335111-2837-11f0-acd8-80c5f2f97990', '121', '2025-05-04 00:00:00', '2025-05-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-04 00:01:00'),
('d23351f3-2837-11f0-acd8-80c5f2f97990', '124', '2025-05-04 00:00:00', '2025-05-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-04 00:01:00'),
('d2335302-2837-11f0-acd8-80c5f2f97990', '229', '2025-05-04 09:31:11', '2025-05-04 18:36:30', '2025-05-04 18:38:05', '2025-05-05 07:27:26', 'HKC', '', '', '', NULL, '2025-05-04 00:01:00'),
('d2335438-2837-11f0-acd8-80c5f2f97990', '707', '2025-05-04 00:00:00', '2025-05-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-04 00:01:00'),
('d23354a1-2837-11f0-acd8-80c5f2f97990', '801', '2025-05-04 00:00:00', '2025-05-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-04 00:01:00'),
('d2335595-2837-11f0-acd8-80c5f2f97990', '220803', '2025-05-04 08:26:28', '2025-05-04 17:36:43', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-04 00:01:00'),
('d233567d-2837-11f0-acd8-80c5f2f97990', '826', '2025-05-04 00:00:00', '2025-05-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-04 00:01:00'),
('d3bca6db-44c4-11f0-b778-80c5f2f97990', '000', '2025-06-09 00:00:00', '2025-06-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-09 08:01:00'),
('d3bcb0c3-44c4-11f0-b778-80c5f2f97990', '001', '2025-06-09 00:00:00', '2025-06-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-09 08:01:00'),
('d3bcb8b6-44c4-11f0-b778-80c5f2f97990', '826', '2025-06-09 00:00:00', '2025-06-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-09 08:01:00'),
('d3bcc47b-44c4-11f0-b778-80c5f2f97990', '124', '2025-06-09 00:00:00', '2025-06-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-09 08:01:00'),
('d3bccf11-44c4-11f0-b778-80c5f2f97990', '121', '2025-06-09 00:00:00', '2025-06-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-09 08:01:00'),
('d3bcd4ff-44c4-11f0-b778-80c5f2f97990', '707', '2025-06-09 00:00:00', '2025-06-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-09 08:01:00'),
('d3bcdb96-44c4-11f0-b778-80c5f2f97990', '112', '2025-06-09 00:00:00', '2025-06-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-09 08:01:00'),
('d3bce230-44c4-11f0-b778-80c5f2f97990', '229', '2025-06-09 00:00:00', '2025-06-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-09 08:01:00'),
('d3bce756-44c4-11f0-b778-80c5f2f97990', '801', '2025-06-09 00:00:00', '2025-06-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-09 08:01:00'),
('d3bceaee-44c4-11f0-b778-80c5f2f97990', '220802', '2025-06-09 00:00:00', '2025-06-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-09 08:01:00'),
('d3bcf507-44c4-11f0-b778-80c5f2f97990', '220803', '2025-06-09 08:00:00', '2025-06-09 17:14:00', NULL, NULL, 'HKM', '', 'Kartu Ketinggalan', '', '181124', '2025-06-09 08:01:00'),
('d3bcf9cc-44c4-11f0-b778-80c5f2f97990', '024', '2025-06-09 00:00:00', '2025-06-09 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-09 08:01:00'),
('d839a4ac-226c-11f0-acd8-80c5f2f97990', '826', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-04-26 15:05:31'),
('d839d2e0-226c-11f0-acd8-80c5f2f97990', '826', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-04-26 15:05:31'),
('db121b91-2d31-11f0-ac46-0492263d7fc5', '001', '2025-05-10 00:00:00', '2025-05-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-10 08:01:00'),
('db121f67-2d31-11f0-ac46-0492263d7fc5', '024', '2025-05-10 00:00:00', '2025-05-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-10 08:01:00'),
('db122138-2d31-11f0-ac46-0492263d7fc5', '111', '2025-05-10 00:00:00', '2025-05-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-10 08:01:00'),
('db12233b-2d31-11f0-ac46-0492263d7fc5', '112', '2025-05-10 00:00:00', '2025-05-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-10 08:01:00'),
('db12252d-2d31-11f0-ac46-0492263d7fc5', '121', '2025-05-10 00:00:00', '2025-05-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-10 08:01:00'),
('db1226ec-2d31-11f0-ac46-0492263d7fc5', '124', '2025-05-10 00:00:00', '2025-05-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-10 08:01:00'),
('db122910-2d31-11f0-ac46-0492263d7fc5', '229', '2025-05-10 05:02:47', '2025-05-10 17:22:21', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-10 08:01:00'),
('db122c98-2d31-11f0-ac46-0492263d7fc5', '707', '2025-05-10 00:00:00', '2025-05-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-10 08:01:00'),
('db122e2b-2d31-11f0-ac46-0492263d7fc5', '801', '2025-05-10 00:00:00', '2025-05-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-10 08:01:00'),
('db1230ad-2d31-11f0-ac46-0492263d7fc5', '826', '2025-05-10 00:00:00', '2025-05-10 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-10 08:01:00'),
('dd574393-4ca8-11f0-ad99-0492263d7fc5', '000', '2025-06-19 00:00:00', '2025-06-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-19 09:01:00'),
('dd57451f-4ca8-11f0-ad99-0492263d7fc5', '1231', '2025-06-19 00:00:00', '2025-06-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-19 09:01:00'),
('dd574837-4ca8-11f0-ad99-0492263d7fc5', '001', '2025-06-19 00:00:00', '2025-06-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-19 09:01:00'),
('dd574c86-4ca8-11f0-ad99-0492263d7fc5', '826', '2025-06-19 00:00:00', '2025-06-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-19 09:01:00'),
('dd575099-4ca8-11f0-ad99-0492263d7fc5', '124', '2025-06-19 00:00:00', '2025-06-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-19 09:01:00'),
('dd575484-4ca8-11f0-ad99-0492263d7fc5', '121', '2025-06-19 00:00:00', '2025-06-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-19 09:01:00'),
('dd57589a-4ca8-11f0-ad99-0492263d7fc5', '707', '2025-06-19 00:00:00', '2025-06-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-19 09:01:00'),
('dd575c99-4ca8-11f0-ad99-0492263d7fc5', '112', '2025-06-19 00:00:00', '2025-06-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-19 09:01:00'),
('dd5760aa-4ca8-11f0-ad99-0492263d7fc5', '229', '2025-06-19 00:00:00', '2025-06-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-19 09:01:00'),
('dd5763f4-4ca8-11f0-ad99-0492263d7fc5', '801', '2025-06-19 00:00:00', '2025-06-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-19 09:01:00'),
('dd576657-4ca8-11f0-ad99-0492263d7fc5', '220802', '2025-06-19 07:00:00', '2025-06-19 19:00:00', NULL, NULL, 'HKM', '', '', '', '181124', '2025-06-19 09:01:00'),
('dd576cc9-4ca8-11f0-ad99-0492263d7fc5', '024', '2025-06-19 00:00:00', '2025-06-19 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-19 09:01:00'),
('df0c616a-4b2a-11f0-b4c3-0492263d7fc5', '000', '2025-12-25 00:00:00', '2025-12-25 00:00:00', NULL, NULL, 'Hari Libur', '', 'Natal 2025 ', '', NULL, '2025-06-17 11:26:34'),
('df0cc35d-4b2a-11f0-b4c3-0492263d7fc5', '001', '2025-12-25 00:00:00', '2025-12-25 00:00:00', NULL, NULL, 'Hari Libur', '', 'Natal 2025 ', '', NULL, '2025-06-17 11:26:34'),
('df0cc658-4b2a-11f0-b4c3-0492263d7fc5', '024', '2025-12-25 00:00:00', '2025-12-25 00:00:00', NULL, NULL, 'Hari Libur', '', 'Natal 2025 ', '', NULL, '2025-06-17 11:26:34'),
('df0cc854-4b2a-11f0-b4c3-0492263d7fc5', '111', '2025-12-25 00:00:00', '2025-12-25 00:00:00', NULL, NULL, 'Hari Libur', '', 'Natal 2025 ', '', NULL, '2025-06-17 11:26:34'),
('df0cca7d-4b2a-11f0-b4c3-0492263d7fc5', '112', '2025-12-25 00:00:00', '2025-12-25 00:00:00', NULL, NULL, 'Hari Libur', '', 'Natal 2025 ', '', NULL, '2025-06-17 11:26:34'),
('df0cccb2-4b2a-11f0-b4c3-0492263d7fc5', '121', '2025-12-25 00:00:00', '2025-12-25 00:00:00', NULL, NULL, 'Hari Libur', '', 'Natal 2025 ', '', NULL, '2025-06-17 11:26:34'),
('df0ccf09-4b2a-11f0-b4c3-0492263d7fc5', '1231', '2025-12-25 00:00:00', '2025-12-25 00:00:00', NULL, NULL, 'Hari Libur', '', 'Natal 2025 ', '', NULL, '2025-06-17 11:26:34'),
('df0cd1a0-4b2a-11f0-b4c3-0492263d7fc5', '124', '2025-12-25 00:00:00', '2025-12-25 00:00:00', NULL, NULL, 'Hari Libur', '', 'Natal 2025 ', '', NULL, '2025-06-17 11:26:34'),
('df0cd46a-4b2a-11f0-b4c3-0492263d7fc5', '220802', '2025-12-25 00:00:00', '2025-12-25 00:00:00', NULL, NULL, 'Hari Libur', '', 'Natal 2025 ', '', NULL, '2025-06-17 11:26:34'),
('df0cd77d-4b2a-11f0-b4c3-0492263d7fc5', '220803', '2025-12-25 00:00:00', '2025-12-25 00:00:00', NULL, NULL, 'Hari Libur', '', 'Natal 2025 ', '', NULL, '2025-06-17 11:26:34'),
('df0cdabf-4b2a-11f0-b4c3-0492263d7fc5', '229', '2025-12-25 00:00:00', '2025-12-25 00:00:00', NULL, NULL, 'Hari Libur', '', 'Natal 2025 ', '', NULL, '2025-06-17 11:26:34'),
('df0cde3f-4b2a-11f0-b4c3-0492263d7fc5', '707', '2025-12-25 00:00:00', '2025-12-25 00:00:00', NULL, NULL, 'Hari Libur', '', 'Natal 2025 ', '', NULL, '2025-06-17 11:26:34'),
('df0ce20f-4b2a-11f0-b4c3-0492263d7fc5', '801', '2025-12-25 00:00:00', '2025-12-25 00:00:00', NULL, NULL, 'Hari Libur', '', 'Natal 2025 ', '', NULL, '2025-06-17 11:26:34'),
('df0ce61b-4b2a-11f0-b4c3-0492263d7fc5', '826', '2025-12-25 00:00:00', '2025-12-25 00:00:00', NULL, NULL, 'Hari Libur', '', 'Natal 2025 ', '', NULL, '2025-06-17 11:26:34'),
('e2b31e1a-27bc-11f0-acd8-80c5f2f97990', '024', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 09:21:00'),
('e2b3201b-27bc-11f0-acd8-80c5f2f97990', '111', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 09:21:00'),
('e2b3222b-27bc-11f0-acd8-80c5f2f97990', '112', '2025-05-03 00:00:00', '2025-05-03 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-03 09:21:00'),
('e826e001-1c03-11f0-b115-0492263d7fc5', '112', '2025-04-17 00:00:00', '2025-04-17 00:00:00', NULL, NULL, 'Cuti Tahunan', '', 'Ibadah Haji (asdasdasd)', '', NULL, '2025-04-18 11:19:14'),
('ef9a0f71-4a01-11f0-b15b-0492263d7fc5', '000', '2025-06-16 00:00:00', '2025-06-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-16 00:01:00'),
('ef9a1680-4a01-11f0-b15b-0492263d7fc5', '001', '2025-06-16 00:00:00', '2025-06-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-16 00:01:00'),
('ef9a1d1c-4a01-11f0-b15b-0492263d7fc5', '826', '2025-06-16 08:00:00', '2025-06-16 17:00:00', NULL, NULL, 'HKM', '', 'Kartu ketinggalan', '', '181124', '2025-06-16 00:01:00'),
('ef9a21b8-4a01-11f0-b15b-0492263d7fc5', '124', '2025-06-16 00:00:00', '2025-06-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-16 00:01:00'),
('ef9a25ca-4a01-11f0-b15b-0492263d7fc5', '121', '2025-06-16 00:00:00', '2025-06-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-16 00:01:00'),
('ef9a2aa9-4a01-11f0-b15b-0492263d7fc5', '707', '2025-06-16 00:00:00', '2025-06-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-16 00:01:00'),
('ef9a2f04-4a01-11f0-b15b-0492263d7fc5', '112', '2025-06-16 00:00:00', '2025-06-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-16 00:01:00'),
('ef9a33a5-4a01-11f0-b15b-0492263d7fc5', '229', '2025-06-16 00:00:00', '2025-06-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-16 00:01:00');
INSERT INTO `attendance` (`attendance_id`, `user_id_machine`, `check_in`, `check_out`, `check_in2`, `check_out2`, `type`, `ijin_info`, `description`, `attachment`, `createdBy`, `createdAt`) VALUES
('ef9a3736-4a01-11f0-b15b-0492263d7fc5', '801', '2025-06-16 00:00:00', '2025-06-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-16 00:01:00'),
('ef9a39b7-4a01-11f0-b15b-0492263d7fc5', '220802', '2025-06-16 00:00:00', '2025-06-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-16 00:01:00'),
('ef9a4038-4a01-11f0-b15b-0492263d7fc5', '220803', '2025-06-16 07:00:00', '2025-06-16 19:00:00', NULL, NULL, 'HKM', '', 'Lembur wajib 3 jam', '', '181124', '2025-06-16 00:01:00'),
('ef9a44c0-4a01-11f0-b15b-0492263d7fc5', '024', '2025-06-16 00:00:00', '2025-06-16 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-16 00:01:00'),
('f0cc4b3f-200c-11f0-acd8-80c5f2f97990', '121', '2025-04-23 00:00:00', '2025-04-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-23 14:34:00'),
('f0cc4d47-200c-11f0-acd8-80c5f2f97990', '112', '2025-04-23 00:00:00', '2025-04-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-23 14:34:00'),
('f0cc4e23-200c-11f0-acd8-80c5f2f97990', '229', '2025-04-23 00:00:00', '2025-04-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-23 14:34:00'),
('f11ea86b-4093-11f0-a686-80c5f2f97990', '000', '2025-06-04 00:00:00', '2025-06-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-04 00:01:00'),
('f11eab31-4093-11f0-a686-80c5f2f97990', '001', '2025-06-04 00:00:00', '2025-06-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-04 00:01:00'),
('f11eae82-4093-11f0-a686-80c5f2f97990', '826', '2025-06-04 00:00:00', '2025-06-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-04 00:01:00'),
('f11eb1db-4093-11f0-a686-80c5f2f97990', '124', '2025-06-04 00:00:00', '2025-06-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-04 00:01:00'),
('f11eb50c-4093-11f0-a686-80c5f2f97990', '121', '2025-06-04 00:00:00', '2025-06-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-04 00:01:00'),
('f11eb877-4093-11f0-a686-80c5f2f97990', '707', '2025-06-04 00:00:00', '2025-06-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-04 00:01:00'),
('f11ebbac-4093-11f0-a686-80c5f2f97990', '112', '2025-06-04 00:00:00', '2025-06-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-04 00:01:00'),
('f11ebf1b-4093-11f0-a686-80c5f2f97990', '229', '2025-06-04 00:00:00', '2025-06-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-04 00:01:00'),
('f11ec253-4093-11f0-a686-80c5f2f97990', '801', '2025-06-04 00:00:00', '2025-06-04 00:00:00', NULL, NULL, 'Mangkir', '', '', '', '181124', '2025-06-04 00:01:00'),
('f11ec42a-4093-11f0-a686-80c5f2f97990', '220802', '2025-06-04 00:00:00', '2025-06-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-04 00:01:00'),
('f11ec978-4093-11f0-a686-80c5f2f97990', '220803', '2025-06-08 10:00:00', '2025-06-08 17:00:00', NULL, NULL, 'HKM', '', '', '', '181124', '2025-06-04 00:01:00'),
('f11eccda-4093-11f0-a686-80c5f2f97990', '024', '2025-06-04 00:00:00', '2025-06-04 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-06-04 00:01:00'),
('f3104d1e-3bdc-11f0-b018-80c5f2f97990', '000', '2025-05-29 08:00:00', '2025-05-29 18:00:00', NULL, NULL, 'HKM', 'Permit', 'tes, mantap', '', '181124', '2025-05-29 00:01:00'),
('f3105250-3bdc-11f0-b018-80c5f2f97990', '001', '2025-05-29 00:00:00', '2025-05-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-29 00:01:00'),
('f310582d-3bdc-11f0-b018-80c5f2f97990', '124', '2025-05-29 00:00:00', '2025-05-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-29 00:01:00'),
('f3105c87-3bdc-11f0-b018-80c5f2f97990', '121', '2025-05-29 00:00:00', '2025-05-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-29 00:01:00'),
('f310615b-3bdc-11f0-b018-80c5f2f97990', '707', '2025-05-29 00:00:00', '2025-05-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-29 00:01:00'),
('f310674f-3bdc-11f0-b018-80c5f2f97990', '112', '2025-05-29 00:00:00', '2025-05-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-29 00:01:00'),
('f3106f77-3bdc-11f0-b018-80c5f2f97990', '229', '2025-05-29 00:00:00', '2025-05-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-29 00:01:00'),
('f3107545-3bdc-11f0-b018-80c5f2f97990', '801', '2025-05-29 08:02:00', '2025-05-29 16:55:00', NULL, NULL, 'HKM', '', '', '', '181124', '2025-05-29 00:01:00'),
('f3107826-3bdc-11f0-b018-80c5f2f97990', '220802', '2025-05-29 00:00:00', '2025-05-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-29 00:01:00'),
('f310809d-3bdc-11f0-b018-80c5f2f97990', '024', '2025-05-29 00:00:00', '2025-05-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-29 00:01:00'),
('f4f2eb66-3725-11f0-a37c-80c5f2f97990', '000', '2025-05-23 00:00:00', '2025-05-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-23 00:01:00'),
('f4f2eedf-3725-11f0-a37c-80c5f2f97990', '001', '2025-05-23 00:00:00', '2025-05-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-23 00:01:00'),
('f4f2fa4c-3725-11f0-a37c-80c5f2f97990', '124', '2025-05-23 00:00:00', '2025-05-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-23 00:01:00'),
('f4f2fff1-3725-11f0-a37c-80c5f2f97990', '121', '2025-05-23 00:00:00', '2025-05-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-23 00:01:00'),
('f4f3071b-3725-11f0-a37c-80c5f2f97990', '707', '2025-05-23 00:00:00', '2025-05-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-23 00:01:00'),
('f4f30d29-3725-11f0-a37c-80c5f2f97990', '112', '2025-05-23 00:00:00', '2025-05-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-23 00:01:00'),
('f4f31490-3725-11f0-a37c-80c5f2f97990', '229', '2025-05-23 00:00:00', '2025-05-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-23 00:01:00'),
('f4f318fd-3725-11f0-a37c-80c5f2f97990', '801', '2025-05-23 00:00:00', '2025-05-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-23 00:01:00'),
('f4f31ac1-3725-11f0-a37c-80c5f2f97990', '220802', '2025-05-23 00:00:00', '2025-05-23 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-23 00:01:00'),
('f52353ba-27e3-11f0-acd8-80c5f2f97990', '801', '2025-04-02 00:00:00', '2025-04-02 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Tes', '', NULL, '2025-05-03 14:00:41'),
('f523572b-27e3-11f0-acd8-80c5f2f97990', '801', '2025-04-18 00:00:00', '2025-04-18 00:00:00', NULL, NULL, 'Cuti Bersama', '', 'Cuti Bersama Paskah', '', NULL, '2025-05-03 14:00:41'),
('f5e810e5-326e-11f0-aa6a-0492263d7fc5', '000', '2025-05-17 00:00:00', '2025-05-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-17 00:01:00'),
('f5e81246-326e-11f0-aa6a-0492263d7fc5', '001', '2025-05-17 00:00:00', '2025-05-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-17 00:01:00'),
('f5e816ef-326e-11f0-aa6a-0492263d7fc5', '024', '2025-05-17 00:00:00', '2025-05-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-17 00:01:00'),
('f5e818ad-326e-11f0-aa6a-0492263d7fc5', '111', '2025-05-17 00:00:00', '2025-05-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-17 00:01:00'),
('f5e81a77-326e-11f0-aa6a-0492263d7fc5', '112', '2025-05-17 00:00:00', '2025-05-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-17 00:01:00'),
('f5e81c2f-326e-11f0-aa6a-0492263d7fc5', '121', '2025-05-17 00:00:00', '2025-05-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-17 00:01:00'),
('f5e81ece-326e-11f0-aa6a-0492263d7fc5', '124', '2025-05-17 00:00:00', '2025-05-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-17 00:01:00'),
('f5e820e4-326e-11f0-aa6a-0492263d7fc5', '229', '2025-05-17 08:35:17', '2025-05-17 00:00:00', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-17 00:01:00'),
('f5e823cc-326e-11f0-aa6a-0492263d7fc5', '801', '2025-05-17 00:00:00', '2025-05-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-17 00:01:00'),
('f5e82798-326e-11f0-aa6a-0492263d7fc5', '220803', '2025-05-17 11:33:53', '2025-05-17 00:00:00', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-17 00:01:00'),
('f5e82a4d-326e-11f0-aa6a-0492263d7fc5', '826', '2025-05-17 00:00:00', '2025-05-17 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-17 00:01:00'),
('fc460b9c-2449-11f0-acd8-80c5f2f97990', '024', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00'),
('fc460d52-2449-11f0-acd8-80c5f2f97990', '111', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00'),
('fc460edd-2449-11f0-acd8-80c5f2f97990', '112', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00'),
('fc4610c1-2449-11f0-acd8-80c5f2f97990', '121', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00'),
('fc461247-2449-11f0-acd8-80c5f2f97990', '124', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00'),
('fc461421-2449-11f0-acd8-80c5f2f97990', '229', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00'),
('fc461736-2449-11f0-acd8-80c5f2f97990', '707', '2025-04-29 08:03:00', '2025-04-29 17:07:00', NULL, NULL, 'HKM', 'Sick', 'Telat aja 1 jam', 'fc461736-2449-11f0-acd8-80c5f2f97990.jpg', '181124', '2025-04-29 00:01:00'),
('fc4618b1-2449-11f0-acd8-80c5f2f97990', '220803', '2025-04-29 10:01:00', '2025-04-29 00:00:00', NULL, NULL, 'HKC', 'Permit', 'kerumah sakit', 'fc4618b1-2449-11f0-acd8-80c5f2f97990.jpg', '291024', '2025-04-29 00:01:00'),
('fc4619f4-2449-11f0-acd8-80c5f2f97990', '826', '2025-04-29 00:00:00', '2025-04-29 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-04-29 00:01:00'),
('fcf15a68-2900-11f0-acd8-80c5f2f97990', '024', '2025-05-05 00:00:00', '2025-05-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-05 00:01:00'),
('fcf15cd0-2900-11f0-acd8-80c5f2f97990', '111', '2025-05-05 00:00:00', '2025-05-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-05 00:01:00'),
('fcf15f19-2900-11f0-acd8-80c5f2f97990', '112', '2025-05-05 00:00:00', '2025-05-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-05 00:01:00'),
('fcf16190-2900-11f0-acd8-80c5f2f97990', '121', '2025-05-05 00:00:00', '2025-05-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-05 00:01:00'),
('fcf16383-2900-11f0-acd8-80c5f2f97990', '124', '2025-05-05 00:00:00', '2025-05-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-05 00:01:00'),
('fcf165b9-2900-11f0-acd8-80c5f2f97990', '229', '0000-00-00 00:00:00', '2025-05-05 00:00:00', NULL, NULL, 'HKC', '', '', '', NULL, '2025-05-05 00:01:00'),
('fcf169d7-2900-11f0-acd8-80c5f2f97990', '707', '2025-05-05 00:00:00', '2025-05-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-05 00:01:00'),
('fcf16b46-2900-11f0-acd8-80c5f2f97990', '801', '2025-05-05 00:00:00', '2025-05-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-05 00:01:00'),
('fcf16e17-2900-11f0-acd8-80c5f2f97990', '220803', '2025-05-05 07:52:22', '2025-05-05 17:06:46', NULL, '2025-05-06 20:55:04', 'HKC', '', '', '', NULL, '2025-05-05 00:01:00'),
('fcf170a7-2900-11f0-acd8-80c5f2f97990', '826', '2025-05-05 00:00:00', '2025-05-05 00:00:00', NULL, NULL, '', '', '', '', NULL, '2025-05-05 00:01:00'),
('fe380ad3-23c5-4d82-bcc6-2d2768675863', '801', '2025-06-14 08:00:00', '2025-06-14 14:00:00', NULL, NULL, 'HKM', '', 'Kartu Absen Ketinggalan', '', '181124', '2025-06-21 11:49:19');

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
  `date` date DEFAULT NULL,
  `createdBy` varchar(8) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `calendar`
--

INSERT INTO `calendar` (`calendar_id`, `description`, `type`, `date`, `createdBy`, `createdAt`) VALUES
('123', 'Tes', 'Cuti Bersama', '2025-04-02', NULL, '2025-06-17 11:08:27'),
('1f03f582-57f1-492b-90f4-f51e2ff99fa7', 'Cuti Bersama Paskah', 'Cuti Bersama', '2025-04-18', NULL, '2025-06-17 11:08:27'),
('934f4b20-3d18-4adf-afa5-cb5b8232b420', 'Natal 2025 ', 'Hari Libur', '2025-12-25', '291024', '2025-06-17 11:26:34');

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
  `user_id_machine` varchar(6) NOT NULL,
  `datetime` datetime NOT NULL,
  `type` varchar(50) NOT NULL,
  `transfer_status` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `check_io`
--

INSERT INTO `check_io` (`check_io_id`, `user_id_machine`, `datetime`, `type`, `transfer_status`) VALUES
('089541e7-0db0-4b9f-9512-16ccb322c107', '220803', '2025-05-02 07:31:02', 'Check In', 1),
('0c594c81-b810-4895-bd74-dfa4cd0c0df5', '229', '2025-05-10 05:10:26', 'Check In', 1),
('0e9ccf71-ade0-4065-8d00-b76deb9e524e', '229', '2025-05-10 05:02:47', 'Check In', 1),
('107e1d7b-5248-4745-8bcb-c5e5ef0b7ec2', '229', '2025-05-05 17:36:24', 'Check Out', 1),
('120909ce-7d1d-463b-9ec3-126f635b324d', '229', '2025-05-12 20:00:35', 'Check In', 1),
('196aabe3-f1c4-43a2-82af-5d786396e18b', '220802', '2025-05-07 17:08:02', 'Check Out', 0),
('19b8edb7-77f0-4534-b888-f8ea54b694e3', '229', '2025-05-11 17:16:55', 'Check Out', 1),
('1be985e5-3bda-4d4a-92f1-fbabe3b79c32', '229', '2025-05-11 08:24:14', 'Check In', 1),
('1df312af-4b20-4c70-8c06-991fabc89c71', '229', '2025-05-09 07:41:02', 'Check In', 1),
('20f8c1f0-161b-4a06-902c-fa74d085b2d0', '220802', '2025-05-04 07:45:53', 'Check In', 1),
('2329c916-43d0-4038-8d4e-ef517bbddd33', '229', '2025-05-13 08:03:47', 'Check In', 1),
('2423c7f2-5ab5-4cf2-afde-2677f1e9e897', '229', '2025-05-03 07:38:28', 'Check Out', 1),
('260f4a63-24c6-4a77-8209-952e702dfd39', '229', '2025-05-05 07:27:26', 'Check Out', 1),
('265f9ab2-0736-4f6b-8365-5abbe3a9f473', '229', '2025-05-01 08:24:51', 'Check In', 1),
('276bb5a8-87be-4538-82a3-990ffede04d1', '229', '2025-05-05 17:36:24', 'Check Out', 1),
('2c6e2b99-cd1e-4699-9c8a-b72ce1e6d265', '220802', '2025-05-05 17:06:45', 'Check Out', 0),
('2fbd3956-ae74-490b-ac88-a984ccbf212b', '229', '2025-05-06 07:48:29', 'Check Out', 1),
('3176b47f-ed62-4f92-8b3a-8a38397eb9f6', '229', '2025-05-13 17:58:41', 'Check Out', 1),
('31ea007b-cf57-4496-9834-302f22bea5ee', '229', '2025-05-10 05:30:19', 'Check Out', 1),
('34334c34-71c8-464b-91ec-78c4cb349cbe', '220802', '2025-05-06 17:05:45', 'Check In', 0),
('371a7aae-30cc-42e6-9c91-77abdbce3575', '229', '2025-05-06 07:48:32', 'Check In', 1),
('3c5eb627-fd8b-404e-9d26-d52c5e3c7360', '229', '2025-05-07 19:10:01', 'Check Out', 1),
('3d659f1d-09d0-4041-86eb-22df55afd360', '229', '2025-05-02 07:54:45', 'Check In', 1),
('458cafb1-b0ab-4302-8e85-a82220228269', '220802', '2025-05-06 20:55:03', 'Check Out', 0),
('493e19a1-023e-4701-bbc0-72f944ebf4db', '220803', '2025-05-06 17:05:27', 'Check Out', 1),
('4d85005e-295e-4d95-a323-91c195917e9e', '229', '2025-05-10 05:03:49', 'Check In', 1),
('4f15ae25-54e0-47b8-8502-cca22179ef11', '229', '2025-05-10 05:03:55', 'Check In', 1),
('511b7c34-133f-43af-ae8b-185c46a65c68', '229', '2025-05-08 07:36:03', 'Check In', 1),
('51af3252-2969-4f54-9cd1-245355d82f22', '229', '2025-05-14 10:54:06', 'Check In', 1),
('52b7e49b-249b-461b-8a0a-36f5faace063', '229', '2025-05-10 05:04:11', 'Check In', 1),
('53699026-bd85-4c2e-ad1f-4d2c05ccd011', '220802', '2025-05-01 07:53:05', 'Check In', 1),
('56739b96-45a4-4a58-8d36-d7edb51d531c', '229', '2025-05-05 02:40:03', 'Check In', 1),
('56ba1cdf-ee83-4c1c-b0df-2b2d788c755a', '229', '2025-05-03 07:40:07', 'Check In', 1),
('59db9f80-bd9c-47cc-b1f1-567102f6d843', '220803', '2025-05-03 17:02:20', 'Check Out', 1),
('616c95e4-8057-4f26-9ebb-4896e7739403', '229', '2025-05-06 18:05:13', 'Check Out', 1),
('6396b779-7c78-437d-a6c7-f46ae6f61429', '229', '2025-05-02 18:11:32', 'Check In', 1),
('6412e120-f67d-4a90-9545-68de5026185a', '220803', '2025-05-17 11:33:53', 'Check In', 1),
('646bdb4f-2fea-406a-b8b9-93b3d02d2d14', '229', '2025-05-13 08:03:52', 'Check In', 1),
('65690bef-2d96-457c-90e4-942f02c828bf', '229', '2025-05-03 07:40:09', 'Check In', 1),
('67dd14a2-25a3-4d60-a540-c0540de38a13', '229', '2025-05-14 17:10:57', 'Check Out', 1),
('6a3b4175-6620-4b14-aa1d-a2c278416c7f', '229', '2025-05-04 15:34:58', 'Check Out', 1),
('6ca6fbaf-3e0e-4561-ad6b-683007d4a9ec', '229', '2025-05-14 10:54:05', 'Check In', 1),
('7082914c-f733-4cab-a71f-6bee7ab246c0', '220802', '2025-05-17 11:40:23', 'Check In', 0),
('73f474b7-e2a1-4616-bfae-b24640bcdf29', '220802', '2025-05-01 16:53:32', 'Check In', 1),
('76964f9f-0e3f-4881-9aa0-404999924491', '229', '2025-05-03 07:47:46', 'Check In', 1),
('77558e46-14fb-449f-807b-dc1de447ba80', '220803', '2025-05-03 07:56:45', 'Check In', 1),
('7b3de6f5-e55c-431d-9e65-b0c0965d8b38', '229', '2025-05-02 07:54:30', 'Check Out', 1),
('7bbf1bf5-12be-433f-aed8-0b8106d33d3c', '220803', '2025-05-04 08:26:28', 'Check In', 1),
('7c750a90-a9a5-4fe1-b16d-a31990469fc7', '220803', '2025-05-07 08:03:30', 'Break In', 1),
('7f9c42fd-85ef-44af-9ec9-b8e7e4e8c563', '220802', '2025-05-02 07:30:59', 'Check In', 1),
('8081cb02-4524-44c2-833f-b2e11b0c72e0', '229', '2025-05-01 08:24:25', 'Check In', 1),
('81cc3650-c693-4f92-9304-5bc04c2756d5', '229', '2025-05-06 07:48:34', 'Check In', 1),
('821ba2ac-081c-47ec-a778-0206059f0dc0', '220803', '2025-05-04 17:36:43', 'Check Out', 1),
('82deee17-1554-477b-8124-207779ffac33', '229', '2025-05-05 07:28:27', 'Check In', 1),
('82f6b191-04a8-4357-a11f-0d153c6fbe47', '220802', '2025-05-02 17:45:45', 'Check Out', 1),
('8437078b-4cce-4179-bf51-203e37a7cf81', '229', '2025-05-03 07:38:23', 'Check In', 1),
('846f76cf-ab70-42c5-b95a-12fbeccf1207', '229', '2025-05-03 07:38:26', 'Check Out', 1),
('8791c127-f23a-4cb5-8aaa-b47501946ad8', '220803', '2025-05-05 17:06:46', 'Check Out', 1),
('87c98b2b-7010-4d0b-b134-98b9adb47999', '229', '2025-05-17 08:35:17', 'Check In', 1),
('8b9395e0-7193-4e2c-a51a-de012d1a0d37', '220803', '2025-05-06 17:35:47', 'Check In', 1),
('8dc0d3a8-d583-4d80-9057-10b6b359e653', '229', '2025-05-05 18:33:36', 'Check Out', 1),
('8f44bd8f-c0df-4d3e-b2a7-59cfb06aac9b', '220803', '2025-05-06 20:55:04', 'Check Out', 1),
('8fdc73b9-6577-48ff-bde0-c01545842d23', '220802', '2025-05-01 07:52:54', 'Check Out', 1),
('9196dd0f-3a99-442e-8460-29e747fbdddd', '229', '2025-05-04 15:32:36', 'Check Out', 1),
('922d5c59-a894-469b-828d-7eb542dd0ebe', '229', '2025-05-05 12:29:12', 'Check In', 1),
('96794b36-a124-4301-ab24-0ab19667b535', '220802', '2025-05-07 08:03:36', 'Check In', 0),
('972cf4db-da73-4c5c-a2c6-12c646e5cb99', '229', '2025-05-10 17:22:21', 'Check Out', 1),
('98266404-1703-42d7-bed7-ef9f9d0ed5d3', '220803', '2025-05-07 17:07:57', 'Break In', 1),
('9b8db36c-2a1a-43ea-a228-46d058737387', '229', '2025-05-10 05:03:45', 'Check In', 1),
('a2664cd5-04c6-4281-a9c0-5fe71e59d853', '200203', '2025-05-17 11:45:48', 'Check In', 1),
('a27cc7b2-2c8b-4ef3-ab10-3e1d9fc72f8b', '229', '2025-05-02 17:10:07', 'Check Out', 1),
('a3c7d2c2-ef74-4504-9e8e-9e98ef8fa4bd', '229', '2025-05-10 05:04:31', 'Check In', 1),
('a4f1df59-7079-4076-91a9-de1e52c1e150', '220802', '2025-05-05 07:52:19', '5', 0),
('b0e51457-8341-4019-8a53-642f17569983', '220802', '2025-05-07 17:26:02', 'Check In', 0),
('b0eccdc6-b688-4516-9de2-ae6f74849513', '229', '2025-05-06 07:47:16', 'Check In', 1),
('b1173d15-da0a-42fb-9905-f044b944ccc2', '229', '2025-05-08 16:57:22', 'Check Out', 1),
('b37795c9-9eff-4b86-a3f8-92210ea6043e', '220803', '2025-05-01 07:52:46', 'Check In', 1),
('b76519f0-508d-4192-8b96-f70bb7400adc', '229', '2025-05-03 09:51:46', 'Check In', 1),
('ba4f2747-2ed0-43fe-8455-20438278b937', '220803', '2025-05-06 07:59:07', 'Check In', 1),
('be477b75-78dd-45ae-b795-040c1af004fd', '229', '2025-05-07 19:10:02', 'Check Out', 1),
('c23ec203-fb52-4d29-b2ef-c984d155a0c4', '229', '2025-05-04 15:33:15', 'Check Out', 1),
('c3f1f614-bae3-4083-9377-4db95f828861', '229', '2025-05-13 08:02:28', 'Check In', 1),
('c68ee428-a6db-4f63-bd48-ac7536408009', '220803', '2025-05-02 07:45:21', 'Check In', 1),
('c73f8131-0675-464a-85a8-315877077c51', '229', '2025-05-04 18:38:05', 'Check In', 1),
('c7f7677a-4686-4cfc-8b06-d54f65b3c925', '229', '2025-05-04 09:31:11', 'Check In', 1),
('ce23d380-d8b2-4b87-b64b-a7c8ea9e78c2', '229', '2025-05-07 07:35:36', 'Check In', 1),
('ce4980d1-ca9a-44c6-b901-94ed7c233817', '220803', '2025-05-01 16:53:35', 'Check In', 1),
('ce5fd834-fd1e-464e-9117-48631d192cd5', '229', '2025-05-14 17:10:58', 'Check Out', 1),
('d06fba80-0412-4f9b-823c-fe7673a23d3b', '229', '2025-05-10 05:04:29', 'Check In', 1),
('d3033ca3-ed34-436a-9954-edf7714a8c42', '220802', '2025-05-02 07:45:23', 'Check In', 1),
('d311c7d1-6da9-43a3-8d43-cfe87c1c4b7c', '220803', '2025-05-05 07:52:22', 'Break Out', 1),
('d3b7f45d-f4b7-4cf8-9498-f3592a2f33ac', '220802', '2025-05-03 07:46:02', 'Check In', 1),
('d49ed5bd-4a2f-4c78-98a8-48d78e06b2f3', '220803', '2025-05-02 17:45:43', 'Check Out', 1),
('d6cefbca-fea2-4f22-adbc-bc44328228a1', '229', '2025-05-06 07:48:35', 'Check In', 1),
('da08e386-9d3f-4f10-a4eb-dd05a790c967', '220802', '2025-05-06 17:05:28', 'Check Out', 0),
('de7de67c-1657-4d84-8e58-f48fc4ccccbc', '229', '2025-05-05 02:40:42', 'Check Out', 1),
('e3a02c7d-95c0-4ea1-b071-1b879590577a', '220802', '2025-05-06 07:59:06', 'Check In', 0),
('e4e691e0-86c4-41af-a684-b38cdfc9ef07', '229', '2025-05-01 17:25:50', 'Check Out', 1),
('e8520c70-63c3-4228-a4de-a09e334069ab', '220802', '2025-05-03 17:25:43', 'Check In', 1),
('e947928d-028e-4323-9b90-584d45b0309b', '229', '2025-05-02 17:10:08', 'Check Out', 1),
('e9abe1a7-daa1-4a47-922e-ce1a6dda2830', '229', '2025-05-09 17:10:44', 'Check Out', 1),
('ee924164-35ee-4a37-ad6b-ddd9935f5bec', '229', '2025-05-06 07:48:25', 'Check In', 1),
('f23f5540-50ed-485a-af53-06e022a182c6', '229', '2025-05-13 08:02:31', 'Check Out', 1),
('f97d50cb-e2ee-4a64-8e67-a3f3326d335b', '229', '2025-05-10 05:04:12', 'Check In', 1),
('faf02167-2d3e-4e93-96bc-1d2d6e21ce92', '220802', '2025-05-04 17:14:19', 'Check Out', 1),
('fe023423-a221-4ff8-ae8c-99057431033c', '229', '2025-05-06 07:48:27', 'Check In', 1),
('fe1c0549-7152-49b9-8077-4665f8d3c32a', '229', '2025-05-03 07:38:22', 'Check In', 1),
('ffa4f3cc-addd-41f5-ae2c-8a2d6b213083', '229', '2025-05-04 18:36:30', 'Check Out', 1);

-- --------------------------------------------------------

--
-- Table structure for table `cuti`
--

CREATE TABLE `cuti` (
  `cuti_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cuti_group_id` varchar(40) NOT NULL DEFAULT 'uuid()',
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

INSERT INTO `cuti` (`cuti_id`, `cuti_group_id`, `payroll`, `type`, `description`, `date`, `year`, `status`, `approval`, `createdAt`) VALUES
('4b7627fe-fd37-490a-847f-8d2f7bced139', 'd1819f1b-913c-4902-96af-f0d4609ce492', '220801', 'Cuti Tahunan', 'cuti tahunan', '2025-06-05', 2025, 'Approved', '291024', '2025-06-17 15:30:18'),
('fb5701b3-8fa8-4fa9-b7e3-dbac0700ce67', '1348f312-feab-4ebc-bcc9-404e5f150b30', '181124', 'Cuti Tahunan', 'Acara nikahan saudara', '2025-06-27', 2025, 'Waiting', '181124', '2025-06-19 17:19:27');

--
-- Triggers `cuti`
--
DELIMITER $$
CREATE TRIGGER `cuti_onapproved_insert_attendace` AFTER UPDATE ON `cuti` FOR EACH ROW BEGIN
	IF NEW.status <> OLD.status AND NEW.status = 'Approved' THEN
		INSERT INTO attendance(attendance_id,user_id_machine,check_in,check_out,type,description) SELECT UUID(),user_id_machine,NEW.date,NEW.date, 
        IF(new.type = "Cuti Tahunan", "Cuti Tahunan", "Cuti Resmi"), 
        Concat(IF(new.type = "Cuti Tahunan", "Cuti Tahunan", "Cuti Resmi") , " - " ,NEW.description) from employee where payroll=NEW.payroll;
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
('253a63c1-0f44-4de2-ab1f-111b53cbae15', '5002', 'HRD', 'Human Resource and Development', 'Aktif'),
('9f251207-0bf9-41cd-82f4-08ed9f6eae95', '1004', 'CAT', 'Cementing & assembly', 'Aktif'),
('a3b885be-a168-46ba-9124-c9fbd7a188e3', '5003', 'MIS', 'Management Information System', 'Aktif');

-- --------------------------------------------------------

--
-- Table structure for table `employee`
--

CREATE TABLE `employee` (
  `payroll` varchar(8) NOT NULL,
  `user_id_machine` varchar(10) NOT NULL,
  `profile_id` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `name` varchar(250) NOT NULL,
  `password` varchar(250) NOT NULL,
  `position` varchar(100) NOT NULL,
  `department` varchar(6) DEFAULT NULL,
  `location` varchar(50) NOT NULL,
  `phone` varchar(13) NOT NULL,
  `overtime` tinyint(1) NOT NULL,
  `workhour` smallint(6) NOT NULL DEFAULT 8,
  `start_work` time NOT NULL DEFAULT '08:00:00',
  `approver` varchar(8) DEFAULT NULL,
  `substitute` varchar(8) DEFAULT NULL,
  `join_date` date NOT NULL DEFAULT current_timestamp(),
  `signature` varchar(250) NOT NULL,
  `status` enum('Aktif','Nonaktif') NOT NULL DEFAULT 'Aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employee`
--

INSERT INTO `employee` (`payroll`, `user_id_machine`, `profile_id`, `email`, `name`, `password`, `position`, `department`, `location`, `phone`, `overtime`, `workhour`, `start_work`, `approver`, `substitute`, `join_date`, `signature`, `status`) VALUES
('000000', '000', '30349278-b074-430c-af99-c51cdd45703f', 'itofficer0@sagatrade.co.id', 'tes', 'U2FsdGVkX1/GFCfMDBkb/4Zz86X/TcvGJ0fif8/tfxA=', 'Staff IT', '5003', 'Jakarta', '0852453688423', 1, 8, '08:00:00', '181124', '220801', '2023-06-15', '000000.jpg', 'Aktif'),
('062025', '1231', 'd80b49f2-a2ef-418f-aafb-9176e2a7345a', 'nadda@sagatrade.co.id', 'Nadda Syafira', 'U2FsdGVkX19K6IHuiX2Dp3GXLOt/MTwv9g0qAoMiBNk=', 'Staff HRD', '5002', 'Jakarta', '123456787', 1, 8, '08:00:00', '181124', '111112', '2025-06-23', '', 'Aktif'),
('111111', '111', 'c071a3dd-ad8d-49bb-97b2-9883d26f8eac', 'itofficer5@sagatrade.co.id', 'Didit', 'U2FsdGVkX1/O7apo7/xtbz9S4XAhD0y2FunIsxguNEQ=', 'Head of the Music Division', '1004', 'Jakarta', '081245637890', 1, 8, '08:00:00', '202207', '214505', '2025-04-26', '111111.jpg', 'Nonaktif'),
('111112', '001', 'c071a3dd-ad8d-49bb-97b2-9883d26f8eac', 'pujo@sagatrade.co.id', 'Pujo Basuki', 'U2FsdGVkX18h+pyvMlxj9cwqQzVBksBF0wPp30ld2Mw=', 'Kasi HRD', '5002', 'Jakarta', '085245368842', 0, 8, '08:00:00', '111112', '111112', '2025-05-09', '111112.jpg', 'Aktif'),
('140826', '826', 'Profile1', 'harry@sagatrade.co.id', 'Harry Gumbira Ramadhan', 'U2FsdGVkX1+4Rm+/D7R6GOd0Z2CyJlti85WRbSZDRW8=', 'Staff IT', '5003', 'Jakarta', '0818-0737-354', 0, 8, '08:00:00', '202201', '202201', '2025-04-26', '140826.jpg', 'Aktif'),
('181124', '124', 'c071a3dd-ad8d-49bb-97b2-9883d26f8eac', 'luvi@sagatrade.co.id', 'Luviana Riska', 'U2FsdGVkX19FlOOeNhhn9thgv8pJgolRSQgt2iFcLAs=', 'Leadman HRD', '5002', 'Jakarta', '0813-8473-847', 0, 8, '08:00:00', '000000', '111112', '2020-04-26', '181124.jpg', 'Aktif'),
('202201', '121', '5febe7d0-3b2b-4fc1-93eb-acf6724dbcc5', 'ryankudeta@gmail.com', 'Ryan Ferdy', 'U2FsdGVkX1+3TI3S25xViylQlkOJSAlttKWbP8gUX44=', 'Staff', '5003', 'Samarinda', '081234561234', 1, 8, '07:00:00', '202201', '213514', '2025-02-11', '202201.jpg', 'Aktif'),
('202207', '707', 'fe0a3d78-5144-4dc8-b891-a604ce14b85d', 'ricky@sagatade.co.id', 'Tjoa Ricky Febrianto', '', 'Staff IT Mantap', '5003', 'Samarinda', '085245368842', 1, 8, '08:00:00', '214505', '140826', '2024-03-25', '202207.jpg', 'Aktif'),
('213514', '112', 'Profile1', 'dedy@sagatrade.co.id', 'Dedy Setiawan', 'U2FsdGVkX1+3TI3S25xViylQlkOJSAlttKWbP8gUX44=', 'Staff', '5003', 'Samarinda', '081234561234', 0, 8, '08:00:00', '214505', '202201', '2025-04-16', '213514.jpg', 'Aktif'),
('214505', '229', 'Profile1', 'syamsuddin@sagatrade.co.id', 'Syamsuddin', 'U2FsdGVkX1/96VJUZUKKDLO2qfozddqiLwocvklckMo=', 'Kasi IT', '5003', 'Samarinda', '081244608676', 1, 8, '08:00:00', '291024', '213514', '2020-04-10', '214505.png', 'Aktif'),
('220801', '801', '5febe7d0-3b2b-4fc1-93eb-acf6724dbcc5', 'ananta@sagatrade.co.id', 'Muhammad Ananta', 'U2FsdGVkX1+pHklcSA9qvhcMhae0Pqkdsdl5lgwWoO0=', 'Staff IT', '5003', 'Jakarta', '085247594847', 1, 8, '08:00:00', '291024', '140826', '2022-08-01', '220801.jpg', 'Aktif'),
('220802', '220802', '5febe7d0-3b2b-4fc1-93eb-acf6724dbcc5', 'naufal@sagatrade.co.id', 'Muhammad Naufal Humam', 'U2FsdGVkX1+yod0fxCHVi0M7er9Xu0Hky+2kw4d4ZO0=', 'Staff IT', '5003', 'Jakarta', '085349845718', 1, 8, '07:00:00', '291024', '140826', '2021-08-03', '220802.jpg', 'Aktif'),
('220803', '220803', '5febe7d0-3b2b-4fc1-93eb-acf6724dbcc5', 'aziz@sagatrade.co.id', 'Abdul Aziz Arrofiq', 'U2FsdGVkX19jac9Vb9wYSlewT4forOItAiPkYZ8WMWI=', 'Staff IT', '5003', 'Jakarta', '0899-8921-062', 1, 8, '08:00:00', '291024', '140826', '2022-08-29', '220803.jpg', 'Aktif'),
('291024', '024', '30349278-b074-430c-af99-c51cdd45703f', 'paulus@sagatrade.co.id', 'Paulus Hendro Nugroho', 'U2FsdGVkX18N+AhWVrCccBhyztPBJHQwCIEvvEmsqsc=', 'Head of the IT', '5003', 'Jakarta', '0818-0627-127', 0, 8, '08:00:00', '291024', '140826', '2015-02-13', '291024.jpg', 'Aktif');

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
-- Dumping data for table `ijin`
--

INSERT INTO `ijin` (`ijin_id`, `payroll`, `type`, `description`, `date`, `status`, `approval`, `createdAt`) VALUES
('20e91b7c-1c31-4a49-a1e7-dd39874c3ae9', '220801', 'Pernikahan', 'Izin Pernikahan', '2025-06-17', 'Waiting', '291024', '2025-06-21 12:39:26'),
('57d0ed8b-acdb-4e0d-8898-b9f873fc0d14', '181124', 'Bencana Alam', 'Banjir', '2025-06-23', 'Approved', '181124', '2025-06-19 16:50:55'),
('72e6da97-2174-4b22-9cba-886595d6890a', '220801', 'Pernikahan', 'Izin Pernikahan', '2025-06-16', 'Waiting', '291024', '2025-06-21 12:39:26'),
('d6595473-7927-4a02-bfee-7ea63a0572a8', '181124', 'Bencana Alam', 'Banjir', '2025-06-30', 'Approved', '181124', '2025-06-19 16:46:54'),
('e1007b10-2ffa-4683-b299-cac1e0847984', '220801', 'Pernikahan', 'Izin Pernikahan', '2025-06-18', 'Waiting', '291024', '2025-06-21 12:39:26');

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
('30349278-b074-430c-af99-c51cdd45703f', 'Manager IT', 'Manager IT ', 5, 0, 'CURD', 'CRUD', 'RDU', 'CRDU', 'CURD', 'CRUD', 'CURD', '', '', '', '', '', 'Aktif'),
('5febe7d0-3b2b-4fc1-93eb-acf6724dbcc5', 'Staff IT', 'Staff IT', 1, 0, 'CRUD', 'C', 'CRUD', 'R', 'CRUD', 'CRUD', 'CUDR', '', '', '', '', '', 'Nonaktif'),
('c071a3dd-ad8d-49bb-97b2-9883d26f8eac', 'Kasi HRD', 'For Pak Pujo & Pak Agus', 3, 1, 'CRUD', 'CRUD', 'CUDR', 'CRUD', 'CRUD', 'CRUD', 'CURD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'Aktif'),
('d80b49f2-a2ef-418f-aafb-9176e2a7345a', 'Staff HRD', 'Staff HRD', 1, 1, 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'Nonaktif'),
('DEFAULT', 'Profile Default', 'Profile Default untuk karyawan baru/baru ditambahkan', 1, 0, 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'Aktif'),
('fe0a3d78-5144-4dc8-b891-a604ce14b85d', 'Ricky', 'Akun untuk dev', 1, 0, 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'RCUD', 'CRUD', 'CRUD', 'CRUD', 'Aktif'),
('Profile1', 'Kasubsi IT SMD', 'Kasubsi IT', 2, 0, 'CRUD', 'CRUD', 'CRUD', 'RUDC', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'CRUD', 'Aktif');

-- --------------------------------------------------------

--
-- Table structure for table `setting`
--

CREATE TABLE `setting` (
  `setting_id` varchar(40) NOT NULL,
  `start_periode` tinyint(6) NOT NULL DEFAULT 17,
  `end_periode` tinyint(6) NOT NULL DEFAULT 16,
  `overtime_allow` tinyint(6) NOT NULL DEFAULT 30,
  `overtime_round_up` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `setting`
--

INSERT INTO `setting` (`setting_id`, `start_periode`, `end_periode`, `overtime_allow`, `overtime_round_up`) VALUES
('id', 27, 26, 15, 0);

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
('1-SKPD_HR-GA_STM_06-2025', '1-SPPD_MIS_STM_06-2025', '220803', '2025-06-17 00:00:00', '2025-06-20 00:00:00', 'OPEN', '181124', '2025-06-17 15:54:44'),
('2-SKPD_HR-GA_STM_06-2025', '1-SPPD_HRD_STM_06-2025', '062025', '2025-06-23 00:00:00', '2025-06-26 00:00:00', 'OPEN', '181124', '2025-06-19 16:20:44'),
('3-SKPD_HR-GA_STM_06-2025', '2-SPPD_MIS_STM_06-2025', '220801', '2025-06-06 00:00:00', '2025-06-09 00:00:00', 'OPEN', '181124', '2025-06-20 15:34:51'),
('4-SKPD_HR-GA_STM_06-2025', '3-SPPD_MIS_STM_06-2025', '220803', '2025-06-23 00:00:00', '2025-06-27 00:00:00', 'OPEN', '181124', '2025-06-20 16:43:35');

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
('1-SPL_HRD_STM_06-2025', 'Lembur Muhammad Naufal Humam tanggal 28 May 2025', '5002', '2025-05-28 17:00:00', '2025-05-28 19:00:00', 'Approved', '181124', 'Approved', '181124', '2025-06-17 15:33:27'),
('1-SPL_MIS_STM_06-2025', 'Perintah Lembur - Take Video', '5003', '2025-05-31 08:00:00', '2025-05-31 12:00:00', 'Approved', '140826', 'Approved', '291024', '2025-06-17 15:54:50'),
('2-SPL_MIS_STM_06-2025', 'Take Video HUT 41 Sagatrade Murni', '5003', '2025-06-14 09:00:00', '2025-06-14 15:00:00', 'Approved', '140826', 'Approved', '291024', '2025-06-20 17:43:43');

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
('6e62b7f4-cc33-4df7-b07b-1050800efa2b', 0, '1-SPL_HRD_STM_06-2025', '220802', 'tes tes'),
('a6d7499c-53d8-4fb6-b5dd-7cbc6bf46b8d', 0, '1-SPL_MIS_STM_06-2025', '220801', 'Take Video ulang Tahun'),
('c9dbb91f-827f-4d1c-81e2-e854b4a06757', 0, '2-SPL_MIS_STM_06-2025', '220801', 'Take Video HUT 41 Sagatrade Murni');

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
('1-SPPD_HRD_STM_06-2025', 'Kordinasi take video HUT', 'Samarinda', '5002', '2025-06-23 00:00:00', '2025-06-26 00:00:00', 4, '181124', '2025-06-19 16:02:44'),
('1-SPPD_MIS_STM_06-2025', 'Dinas', 'Jakarta', '5003', '2025-06-17 00:00:00', '2025-06-20 00:00:00', 1, '291024', '2025-06-17 15:50:06'),
('2-SPPD_MIS_STM_06-2025', 'Take video HUT Sagatrade 41', 'Samarinda', '5003', '2025-06-06 00:00:00', '2025-06-09 00:00:00', 4, '291024', '2025-06-20 12:39:29'),
('3-SPPD_MIS_STM_06-2025', 'DInas ke samarinda', 'Samarinda', '5003', '2025-06-23 00:00:00', '2025-06-27 00:00:00', 10, '181124', '2025-06-20 16:42:23');

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
('4ae408a1-6b80-4cae-8b73-ea60f783698b', 0, '3-SPPD_MIS_STM_06-2025', '220803', 'Dinas ke samarinda'),
('5da8969b-d3cf-435b-9cbb-a3b29fd1b5e4', 0, '2-SPPD_MIS_STM_06-2025', '220801', 'Koordinasi take video HUT Sagatrade 41'),
('6ea12831-2d8e-4376-bd97-8691ecb5d5ee', 0, '1-SPPD_HRD_STM_06-2025', '062025', 'Kordinasi take video HUT'),
('825a5966-8073-4457-9764-0f6556f85e9b', 0, '1-SPPD_MIS_STM_06-2025', '220803', 'SPPD ke samarinda');

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
('1-SRL_HRD_STM_06-2025', '1-SPL_HRD_STM_06-2025', '220802', '2025-05-28 17:00:00', '2025-05-28 19:00:00', 'Approved', '291024', 'Approved', '291024', '2025-06-17 15:34:33'),
('1-SRL_MIS_STM_06-2025', '1-SPL_MIS_STM_06-2025', '220801', '2025-05-31 08:00:00', '2025-05-31 14:14:00', 'Approved', '140826', 'Approved', '291024', '2025-06-17 15:58:00');

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
('53986357-1c56-4c8f-993b-0d10c13c8ea4', '1-SRL_HRD_STM_06-2025', 'tes tes loremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremloremlorem ipsum', 'Completed'),
('c746ad8f-a4f7-49a4-a3a4-44f653121a48', '1-SRL_MIS_STM_06-2025', 'Take Video ulang Tahun', 'On Progress');

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
  ADD UNIQUE KEY `date` (`date`),
  ADD KEY `createdBy` (`createdBy`);

--
-- Indexes for table `check_io`
--
ALTER TABLE `check_io`
  ADD PRIMARY KEY (`check_io_id`),
  ADD KEY `user_id_mesin` (`user_id_machine`);

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
-- Constraints for table `calendar`
--
ALTER TABLE `calendar`
  ADD CONSTRAINT `calendar_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `employee` (`payroll`) ON DELETE SET NULL ON UPDATE CASCADE;

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
CREATE DEFINER=`root`@`localhost` EVENT `event_insert_attendance` ON SCHEDULE EVERY 1 HOUR STARTS '2025-04-23 00:01:00' ON COMPLETION NOT PRESERVE ENABLE DO CALL insert_daily_attendance()$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
