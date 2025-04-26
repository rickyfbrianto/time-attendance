
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime,
  createParam,
} = require('./runtime/edge.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}





/**
 * Enums
 */
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.EmployeeScalarFieldEnum = {
  payroll: 'payroll',
  user_id_machine: 'user_id_machine',
  profile_id: 'profile_id',
  email: 'email',
  name: 'name',
  password: 'password',
  position: 'position',
  department: 'department',
  location: 'location',
  phone: 'phone',
  workhour: 'workhour',
  approver: 'approver',
  substitute: 'substitute',
  join_date: 'join_date',
  signature: 'signature',
  status: 'status'
};

exports.Prisma.ProfileScalarFieldEnum = {
  profile_id: 'profile_id',
  name: 'name',
  description: 'description',
  level: 'level',
  user_hrd: 'user_hrd',
  access_sppd: 'access_sppd',
  access_skpd: 'access_skpd',
  access_attendance: 'access_attendance',
  access_spl: 'access_spl',
  access_srl: 'access_srl',
  access_cuti: 'access_cuti',
  access_ijin: 'access_ijin',
  access_calendar: 'access_calendar',
  access_user: 'access_user',
  access_profile: 'access_profile',
  access_dept: 'access_dept',
  access_setting: 'access_setting'
};

exports.Prisma.Check_ioScalarFieldEnum = {
  check_io_id: 'check_io_id',
  user_id_machine: 'user_id_machine',
  check_in: 'check_in',
  check_out: 'check_out',
  type: 'type',
  createdAt: 'createdAt'
};

exports.Prisma.AttendanceScalarFieldEnum = {
  attendance_id: 'attendance_id',
  user_id_machine: 'user_id_machine',
  check_in: 'check_in',
  check_out: 'check_out',
  check_in2: 'check_in2',
  check_out2: 'check_out2',
  type: 'type',
  ijin_info: 'ijin_info',
  description: 'description',
  attachment: 'attachment',
  createdBy: 'createdBy',
  createdAt: 'createdAt'
};

exports.Prisma.Temp_check_ioScalarFieldEnum = {
  check_io_id: 'check_io_id',
  user_id_machine: 'user_id_machine',
  datetime: 'datetime',
  type: 'type'
};

exports.Prisma.CalendarScalarFieldEnum = {
  calendar_id: 'calendar_id',
  description: 'description',
  type: 'type',
  date: 'date'
};

exports.Prisma.SettingScalarFieldEnum = {
  setting_id: 'setting_id',
  start_periode: 'start_periode',
  end_periode: 'end_periode'
};

exports.Prisma.SplScalarFieldEnum = {
  spl_id: 'spl_id',
  purpose: 'purpose',
  est_start: 'est_start',
  est_end: 'est_end',
  status1: 'status1',
  approval1: 'approval1',
  status2: 'status2',
  approval2: 'approval2',
  createdAt: 'createdAt'
};

exports.Prisma.Spl_detailScalarFieldEnum = {
  spl_detail_id: 'spl_detail_id',
  step: 'step',
  spl_id: 'spl_id',
  payroll: 'payroll',
  description: 'description'
};

exports.Prisma.DeptScalarFieldEnum = {
  dept_id: 'dept_id',
  dept_code: 'dept_code',
  initial: 'initial',
  name: 'name',
  status: 'status'
};

exports.Prisma.SrlScalarFieldEnum = {
  srl_id: 'srl_id',
  spl_id: 'spl_id',
  payroll: 'payroll',
  real_start: 'real_start',
  real_end: 'real_end',
  status1: 'status1',
  approval1: 'approval1',
  status2: 'status2',
  approval2: 'approval2',
  createdAt: 'createdAt'
};

exports.Prisma.Srl_detailScalarFieldEnum = {
  srl_detail_id: 'srl_detail_id',
  srl_id: 'srl_id',
  description: 'description',
  status: 'status'
};

exports.Prisma.CutiScalarFieldEnum = {
  cuti_id: 'cuti_id',
  payroll: 'payroll',
  type: 'type',
  description: 'description',
  date: 'date',
  year: 'year',
  status: 'status',
  approval: 'approval',
  createdAt: 'createdAt'
};

exports.Prisma.SppdScalarFieldEnum = {
  sppd_id: 'sppd_id',
  purpose: 'purpose',
  location: 'location',
  dept: 'dept',
  start_date: 'start_date',
  end_date: 'end_date',
  duration: 'duration',
  createdBy: 'createdBy',
  createdAt: 'createdAt'
};

exports.Prisma.Sppd_detailScalarFieldEnum = {
  sppd_detail_id: 'sppd_detail_id',
  step: 'step',
  sppd_id: 'sppd_id',
  payroll: 'payroll',
  description: 'description'
};

exports.Prisma.SkpdScalarFieldEnum = {
  skpd_id: 'skpd_id',
  sppd_id: 'sppd_id',
  payroll: 'payroll',
  real_start: 'real_start',
  real_end: 'real_end',
  status: 'status',
  createdBy: 'createdBy',
  createdAt: 'createdAt'
};

exports.Prisma.IjinScalarFieldEnum = {
  ijin_id: 'ijin_id',
  payroll: 'payroll',
  type: 'type',
  description: 'description',
  date: 'date',
  status: 'status',
  approval: 'approval',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.employeeOrderByRelevanceFieldEnum = {
  payroll: 'payroll',
  user_id_machine: 'user_id_machine',
  profile_id: 'profile_id',
  email: 'email',
  name: 'name',
  password: 'password',
  position: 'position',
  department: 'department',
  location: 'location',
  phone: 'phone',
  approver: 'approver',
  substitute: 'substitute',
  signature: 'signature'
};

exports.Prisma.profileOrderByRelevanceFieldEnum = {
  profile_id: 'profile_id',
  name: 'name',
  description: 'description',
  access_sppd: 'access_sppd',
  access_skpd: 'access_skpd',
  access_attendance: 'access_attendance',
  access_spl: 'access_spl',
  access_srl: 'access_srl',
  access_cuti: 'access_cuti',
  access_ijin: 'access_ijin',
  access_calendar: 'access_calendar',
  access_user: 'access_user',
  access_profile: 'access_profile',
  access_dept: 'access_dept',
  access_setting: 'access_setting'
};

exports.Prisma.check_ioOrderByRelevanceFieldEnum = {
  check_io_id: 'check_io_id',
  user_id_machine: 'user_id_machine',
  type: 'type'
};

exports.Prisma.attendanceOrderByRelevanceFieldEnum = {
  attendance_id: 'attendance_id',
  user_id_machine: 'user_id_machine',
  type: 'type',
  ijin_info: 'ijin_info',
  description: 'description',
  attachment: 'attachment',
  createdBy: 'createdBy'
};

exports.Prisma.temp_check_ioOrderByRelevanceFieldEnum = {
  check_io_id: 'check_io_id',
  user_id_machine: 'user_id_machine',
  type: 'type'
};

exports.Prisma.calendarOrderByRelevanceFieldEnum = {
  calendar_id: 'calendar_id',
  description: 'description'
};

exports.Prisma.settingOrderByRelevanceFieldEnum = {
  setting_id: 'setting_id'
};

exports.Prisma.splOrderByRelevanceFieldEnum = {
  spl_id: 'spl_id',
  purpose: 'purpose',
  approval1: 'approval1',
  approval2: 'approval2'
};

exports.Prisma.spl_detailOrderByRelevanceFieldEnum = {
  spl_detail_id: 'spl_detail_id',
  spl_id: 'spl_id',
  payroll: 'payroll',
  description: 'description'
};

exports.Prisma.deptOrderByRelevanceFieldEnum = {
  dept_id: 'dept_id',
  dept_code: 'dept_code',
  initial: 'initial',
  name: 'name'
};

exports.Prisma.srlOrderByRelevanceFieldEnum = {
  srl_id: 'srl_id',
  spl_id: 'spl_id',
  payroll: 'payroll',
  approval1: 'approval1',
  approval2: 'approval2'
};

exports.Prisma.srl_detailOrderByRelevanceFieldEnum = {
  srl_detail_id: 'srl_detail_id',
  srl_id: 'srl_id',
  description: 'description',
  status: 'status'
};

exports.Prisma.cutiOrderByRelevanceFieldEnum = {
  cuti_id: 'cuti_id',
  payroll: 'payroll',
  type: 'type',
  description: 'description',
  approval: 'approval'
};

exports.Prisma.sppdOrderByRelevanceFieldEnum = {
  sppd_id: 'sppd_id',
  purpose: 'purpose',
  location: 'location',
  dept: 'dept',
  createdBy: 'createdBy'
};

exports.Prisma.sppd_detailOrderByRelevanceFieldEnum = {
  sppd_detail_id: 'sppd_detail_id',
  sppd_id: 'sppd_id',
  payroll: 'payroll',
  description: 'description'
};

exports.Prisma.skpdOrderByRelevanceFieldEnum = {
  skpd_id: 'skpd_id',
  sppd_id: 'sppd_id',
  payroll: 'payroll',
  createdBy: 'createdBy'
};

exports.Prisma.ijinOrderByRelevanceFieldEnum = {
  ijin_id: 'ijin_id',
  payroll: 'payroll',
  type: 'type',
  description: 'description',
  approval: 'approval'
};
exports.calendar_type = exports.$Enums.calendar_type = {
  Hari_Libur: 'Hari_Libur',
  Cuti_Bersama: 'Cuti_Bersama',
  Event_Kantor: 'Event_Kantor'
};

exports.dept_status = exports.$Enums.dept_status = {
  Aktif: 'Aktif',
  Nonaktif: 'Nonaktif'
};

exports.skpd_status = exports.$Enums.skpd_status = {
  OPEN: 'OPEN',
  CLOSE: 'CLOSE'
};

exports.ijin_status = exports.$Enums.ijin_status = {
  Waiting: 'Waiting',
  Reject: 'Reject',
  Approved: 'Approved',
  Cancelled: 'Cancelled'
};

exports.cuti_status = exports.$Enums.cuti_status = {
  Waiting: 'Waiting',
  Reject: 'Reject',
  Approved: 'Approved',
  Cancelled: 'Cancelled'
};

exports.srl_status1 = exports.$Enums.srl_status1 = {
  Waiting: 'Waiting',
  Reject: 'Reject',
  Approved: 'Approved',
  Cancelled: 'Cancelled'
};

exports.srl_status2 = exports.$Enums.srl_status2 = {
  Waiting: 'Waiting',
  Reject: 'Reject',
  Approved: 'Approved',
  Cancelled: 'Cancelled'
};

exports.spl_status1 = exports.$Enums.spl_status1 = {
  Waiting: 'Waiting',
  Reject: 'Reject',
  Approved: 'Approved',
  Cancelled: 'Cancelled'
};

exports.spl_status2 = exports.$Enums.spl_status2 = {
  Waiting: 'Waiting',
  Reject: 'Reject',
  Approved: 'Approved',
  Cancelled: 'Cancelled'
};

exports.employee_status = exports.$Enums.employee_status = {
  Aktif: 'Aktif',
  Nonaktif: 'Nonaktif'
};

exports.Prisma.ModelName = {
  employee: 'employee',
  profile: 'profile',
  check_io: 'check_io',
  attendance: 'attendance',
  temp_check_io: 'temp_check_io',
  calendar: 'calendar',
  setting: 'setting',
  spl: 'spl',
  spl_detail: 'spl_detail',
  dept: 'dept',
  srl: 'srl',
  srl_detail: 'srl_detail',
  cuti: 'cuti',
  sppd: 'sppd',
  sppd_detail: 'sppd_detail',
  skpd: 'skpd',
  ijin: 'ijin'
};
/**
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "C:\\Users\\RICKY\\Desktop\\time-attendance\\src\\lib\\prisma\\client",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "windows",
        "native": true
      }
    ],
    "previewFeatures": [],
    "sourceFilePath": "C:\\Users\\RICKY\\Desktop\\time-attendance\\prisma\\schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": "../../../../.env",
    "schemaEnvPath": "../../../../.env"
  },
  "relativePath": "../../../../prisma",
  "clientVersion": "6.6.0",
  "engineVersion": "f676762280b54cd07c770017ed3711ddde35f37a",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "mysql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "generator client {\n  provider = \"prisma-client-js\"\n  output   = \"../src/lib/prisma/client\"\n}\n\ndatasource db {\n  provider = \"mysql\"\n  url      = env(\"DATABASE_URL\")\n}\n\nmodel employee {\n  payroll                                         String          @id @db.VarChar(8)\n  user_id_machine                                 String          @unique(map: \"user_id_mesin\") @db.VarChar(6)\n  profile_id                                      String?         @db.VarChar(50)\n  email                                           String          @unique(map: \"Employee_Email_key\") @db.VarChar(100)\n  name                                            String          @db.VarChar(250)\n  password                                        String          @db.VarChar(250)\n  position                                        String          @db.VarChar(100)\n  department                                      String?         @db.VarChar(6)\n  location                                        String          @db.VarChar(100)\n  phone                                           String          @db.VarChar(13)\n  workhour                                        Int             @default(8) @db.SmallInt\n  approver                                        String?         @db.VarChar(8)\n  substitute                                      String?         @db.VarChar(8)\n  join_date                                       DateTime        @default(now()) @db.Date\n  signature                                       String          @db.VarChar(250)\n  status                                          employee_status @default(Aktif)\n  attendance_attendance_createdByToemployee       attendance[]    @relation(\"attendance_createdByToemployee\")\n  attendance_attendance_user_id_machineToemployee attendance[]    @relation(\"attendance_user_id_machineToemployee\")\n  check_io                                        check_io[]\n  cuti_cuti_approvalToemployee                    cuti[]          @relation(\"cuti_approvalToemployee\")\n  cuti                                            cuti[]\n  profile                                         profile?        @relation(fields: [profile_id], references: [profile_id], map: \"Employee_profile_id_fkey\")\n  employee_employee_approverToemployee            employee?       @relation(\"employee_approverToemployee\", fields: [approver], references: [payroll])\n  other_employee_employee_approverToemployee      employee[]      @relation(\"employee_approverToemployee\")\n  dept                                            dept?           @relation(fields: [department], references: [dept_code])\n  employee_employee_substituteToemployee          employee?       @relation(\"employee_substituteToemployee\", fields: [substitute], references: [payroll])\n  other_employee_employee_substituteToemployee    employee[]      @relation(\"employee_substituteToemployee\")\n  ijin_ijin_approvalToemployee                    ijin[]          @relation(\"ijin_approvalToemployee\")\n  ijin                                            ijin[]\n  skpd_skpd_createdByToemployee                   skpd[]          @relation(\"skpd_createdByToemployee\")\n  skpd_skpd_payrollToemployee                     skpd[]          @relation(\"skpd_payrollToemployee\")\n  spl_spl_approval1Toemployee                     spl[]           @relation(\"spl_approval1Toemployee\")\n  spl_spl_approval2Toemployee                     spl[]           @relation(\"spl_approval2Toemployee\")\n  spl_detail                                      spl_detail[]\n  sppd                                            sppd[]\n  sppd_detail                                     sppd_detail[]\n  srl_srl_approval1Toemployee                     srl[]           @relation(\"srl_approval1Toemployee\")\n  srl_srl_approval2Toemployee                     srl[]           @relation(\"srl_approval2Toemployee\")\n  srl                                             srl[]\n\n  @@index([profile_id], map: \"Employee_profile_id_fkey\")\n  @@index([department], map: \"employee_department_fkey\")\n  @@index([approver], map: \"approver\")\n  @@index([substitute], map: \"substitute\")\n  @@fulltext([payroll, user_id_machine, profile_id, email, name, position, department, location, phone], map: \"payroll\")\n}\n\nmodel profile {\n  profile_id        String     @id @db.VarChar(50)\n  name              String     @db.VarChar(100)\n  description       String     @db.VarChar(255)\n  level             Int        @db.TinyInt\n  user_hrd          Boolean\n  access_sppd       String     @db.VarChar(4)\n  access_skpd       String     @db.VarChar(4)\n  access_attendance String     @db.VarChar(4)\n  access_spl        String     @db.VarChar(4)\n  access_srl        String     @db.VarChar(4)\n  access_cuti       String     @db.VarChar(4)\n  access_ijin       String     @db.VarChar(4)\n  access_calendar   String     @db.VarChar(4)\n  access_user       String     @db.VarChar(4)\n  access_profile    String     @db.VarChar(4)\n  access_dept       String     @db.VarChar(4)\n  access_setting    String     @db.VarChar(4)\n  employee          employee[]\n}\n\nmodel check_io {\n  check_io_id     String    @id @db.VarChar(40)\n  user_id_machine String?   @db.VarChar(6)\n  check_in        DateTime  @db.DateTime(0)\n  check_out       DateTime  @db.DateTime(0)\n  type            String    @db.VarChar(50)\n  createdAt       DateTime  @default(now()) @db.DateTime(0)\n  employee        employee? @relation(fields: [user_id_machine], references: [user_id_machine], map: \"Check_io_user_id_machine_fkey\")\n\n  @@index([user_id_machine], map: \"Check_io_user_id_mesin_fkey\")\n}\n\nmodel attendance {\n  attendance_id                                 String    @id @db.VarChar(40)\n  user_id_machine                               String?   @db.VarChar(6)\n  check_in                                      DateTime  @db.DateTime(0)\n  check_out                                     DateTime  @db.DateTime(0)\n  check_in2                                     DateTime? @db.DateTime(0)\n  check_out2                                    DateTime? @db.DateTime(0)\n  type                                          String    @db.VarChar(50)\n  ijin_info                                     String    @db.VarChar(50)\n  description                                   String    @db.VarChar(255)\n  attachment                                    String?   @db.Text\n  createdBy                                     String?   @db.VarChar(8)\n  createdAt                                     DateTime  @default(now()) @db.DateTime(0)\n  employee_attendance_createdByToemployee       employee? @relation(\"attendance_createdByToemployee\", fields: [createdBy], references: [payroll], map: \"Attendance_created_by_fkey\")\n  employee_attendance_user_id_machineToemployee employee? @relation(\"attendance_user_id_machineToemployee\", fields: [user_id_machine], references: [user_id_machine], map: \"Attendance_user_id_machine_fkey\")\n\n  @@index([createdBy], map: \"createdBy\")\n  @@index([user_id_machine], map: \"user_id_mesin\")\n  @@index([check_in], map: \"check_in\")\n  @@index([check_in2], map: \"check_in2\")\n  @@index([check_out], map: \"check_out\")\n  @@index([check_out2], map: \"check_out2\")\n  @@index([type], map: \"type\")\n}\n\nmodel temp_check_io {\n  check_io_id     String   @id @db.VarChar(40)\n  user_id_machine String   @db.VarChar(6)\n  datetime        DateTime @db.DateTime(0)\n  type            String   @db.VarChar(50)\n\n  @@index([user_id_machine], map: \"user_id_mesin\")\n}\n\nmodel calendar {\n  calendar_id String         @id @db.VarChar(40)\n  description String?        @db.VarChar(255)\n  type        calendar_type?\n  date        DateTime?      @unique(map: \"date\") @db.Date\n}\n\nmodel setting {\n  setting_id    String @id @db.VarChar(40)\n  start_periode Int    @default(17) @db.TinyInt\n  end_periode   Int    @default(16) @db.TinyInt\n}\n\nmodel spl {\n  spl_id                           String       @id @db.VarChar(40)\n  purpose                          String       @db.VarChar(255)\n  est_start                        DateTime     @db.DateTime(0)\n  est_end                          DateTime     @db.DateTime(0)\n  status1                          spl_status1  @default(Waiting)\n  approval1                        String?      @db.VarChar(8)\n  status2                          spl_status2  @default(Waiting)\n  approval2                        String?      @db.VarChar(8)\n  createdAt                        DateTime     @default(now()) @db.DateTime(0)\n  employee_spl_approval1Toemployee employee?    @relation(\"spl_approval1Toemployee\", fields: [approval1], references: [payroll])\n  employee_spl_approval2Toemployee employee?    @relation(\"spl_approval2Toemployee\", fields: [approval2], references: [payroll])\n  spl_detail                       spl_detail[]\n  srl                              srl[]\n\n  @@index([est_end], map: \"est_end\")\n  @@index([est_start], map: \"est_start\")\n  @@index([approval1], map: \"approval1\")\n  @@index([approval2], map: \"approval2\")\n}\n\nmodel spl_detail {\n  spl_detail_id String    @id @db.VarChar(40)\n  step          Int       @db.TinyInt\n  spl_id        String    @db.VarChar(40)\n  payroll       String?   @db.VarChar(8)\n  description   String    @db.VarChar(255)\n  employee      employee? @relation(fields: [payroll], references: [payroll])\n  spl           spl       @relation(fields: [spl_id], references: [spl_id], onDelete: Cascade)\n\n  @@index([spl_id], map: \"spl_id\")\n  @@index([payroll], map: \"payroll\")\n}\n\nmodel dept {\n  dept_id              String      @id @db.VarChar(40)\n  dept_code            String      @unique(map: \"dept_code\") @db.VarChar(6)\n  initial              String      @db.VarChar(10)\n  name                 String      @db.VarChar(100)\n  status               dept_status\n  employee             employee[]\n  sppd_sppd_deptTodept sppd[]      @relation(\"sppd_deptTodept\")\n\n  @@fulltext([dept_code, name], map: \"dept_code_2\")\n}\n\nmodel srl {\n  srl_id                           String       @id @db.VarChar(40)\n  spl_id                           String?      @db.VarChar(40)\n  payroll                          String?      @db.VarChar(8)\n  real_start                       DateTime     @db.DateTime(0)\n  real_end                         DateTime     @db.DateTime(0)\n  status1                          srl_status1  @default(Waiting)\n  approval1                        String?      @db.VarChar(8)\n  status2                          srl_status2  @default(Waiting)\n  approval2                        String?      @db.VarChar(8)\n  createdAt                        DateTime     @db.DateTime(0)\n  employee_srl_approval1Toemployee employee?    @relation(\"srl_approval1Toemployee\", fields: [approval1], references: [payroll])\n  employee_srl_approval2Toemployee employee?    @relation(\"srl_approval2Toemployee\", fields: [approval2], references: [payroll])\n  employee                         employee?    @relation(fields: [payroll], references: [payroll])\n  spl                              spl?         @relation(fields: [spl_id], references: [spl_id])\n  srl_detail                       srl_detail[]\n\n  @@index([payroll], map: \"payroll\")\n  @@index([spl_id], map: \"spl_id\")\n  @@index([approval1], map: \"approval\")\n  @@index([approval2], map: \"approval2\")\n  @@index([real_end], map: \"real_end\")\n  @@index([real_start], map: \"real_start\")\n}\n\nmodel srl_detail {\n  srl_detail_id String  @id @db.VarChar(40)\n  srl_id        String? @db.VarChar(40)\n  description   String  @db.VarChar(255)\n  status        String  @db.VarChar(50)\n  srl           srl?    @relation(fields: [srl_id], references: [srl_id], onDelete: Cascade)\n\n  @@index([srl_id], map: \"srl_id\")\n}\n\nmodel cuti {\n  cuti_id                          String      @id @db.VarChar(40)\n  payroll                          String?     @db.VarChar(8)\n  type                             String      @db.VarChar(50)\n  description                      String      @db.VarChar(255)\n  date                             DateTime    @db.Date\n  year                             Int         @db.SmallInt\n  status                           cuti_status\n  approval                         String?     @db.VarChar(8)\n  createdAt                        DateTime    @db.DateTime(0)\n  employee_cuti_approvalToemployee employee?   @relation(\"cuti_approvalToemployee\", fields: [approval], references: [payroll])\n  employee                         employee?   @relation(fields: [payroll], references: [payroll])\n\n  @@index([payroll], map: \"payroll\")\n  @@index([approval], map: \"approval\")\n  @@index([date], map: \"date\")\n}\n\nmodel sppd {\n  sppd_id              String        @id @db.VarChar(40)\n  purpose              String        @db.VarChar(255)\n  location             String        @db.VarChar(100)\n  dept                 String?       @db.VarChar(6)\n  start_date           DateTime      @db.DateTime(0)\n  end_date             DateTime      @db.DateTime(0)\n  duration             Int           @db.TinyInt\n  createdBy            String?       @db.VarChar(8)\n  createdAt            DateTime      @db.DateTime(0)\n  skpd                 skpd[]\n  employee             employee?     @relation(fields: [createdBy], references: [payroll])\n  dept_sppd_deptTodept dept?         @relation(\"sppd_deptTodept\", fields: [dept], references: [dept_code])\n  sppd_detail          sppd_detail[]\n\n  @@index([createdBy], map: \"createdBy\")\n  @@index([dept], map: \"dept\")\n}\n\nmodel sppd_detail {\n  sppd_detail_id String    @id @db.VarChar(40)\n  step           Int       @db.TinyInt\n  sppd_id        String?   @db.VarChar(40)\n  payroll        String?   @db.VarChar(8)\n  description    String    @db.VarChar(255)\n  employee       employee? @relation(fields: [payroll], references: [payroll])\n  sppd           sppd?     @relation(fields: [sppd_id], references: [sppd_id], onDelete: Cascade)\n\n  @@index([payroll], map: \"payroll\")\n  @@index([sppd_id], map: \"sppd_id\")\n}\n\nmodel skpd {\n  skpd_id                           String      @id @default(\"getNomorSKPD()\") @db.VarChar(40)\n  sppd_id                           String?     @db.VarChar(40)\n  payroll                           String?     @db.VarChar(8)\n  real_start                        DateTime    @db.DateTime(0)\n  real_end                          DateTime    @db.DateTime(0)\n  status                            skpd_status\n  createdBy                         String?     @db.VarChar(8)\n  createdAt                         DateTime    @db.DateTime(0)\n  employee_skpd_createdByToemployee employee?   @relation(\"skpd_createdByToemployee\", fields: [createdBy], references: [payroll])\n  employee_skpd_payrollToemployee   employee?   @relation(\"skpd_payrollToemployee\", fields: [payroll], references: [payroll])\n  sppd                              sppd?       @relation(fields: [sppd_id], references: [sppd_id], onDelete: Cascade)\n\n  @@index([createdBy], map: \"createdBy\")\n  @@index([payroll], map: \"payroll\")\n  @@index([sppd_id], map: \"sppd_id\")\n}\n\nmodel ijin {\n  ijin_id                          String      @id @db.VarChar(40)\n  payroll                          String?     @db.VarChar(8)\n  type                             String      @db.VarChar(50)\n  description                      String      @db.VarChar(255)\n  date                             DateTime    @db.Date\n  status                           ijin_status\n  approval                         String?     @db.VarChar(8)\n  createdAt                        DateTime    @db.DateTime(0)\n  employee_ijin_approvalToemployee employee?   @relation(\"ijin_approvalToemployee\", fields: [approval], references: [payroll])\n  employee                         employee?   @relation(fields: [payroll], references: [payroll])\n\n  @@index([payroll], map: \"payroll\")\n  @@index([approval], map: \"approval\")\n  @@index([date], map: \"date\")\n}\n\nenum calendar_type {\n  Hari_Libur   @map(\"Hari Libur\")\n  Cuti_Bersama @map(\"Cuti Bersama\")\n  Event_Kantor @map(\"Event Kantor\")\n}\n\nenum dept_status {\n  Aktif\n  Nonaktif\n}\n\nenum skpd_status {\n  OPEN\n  CLOSE\n}\n\nenum ijin_status {\n  Waiting\n  Reject\n  Approved\n  Cancelled\n}\n\nenum cuti_status {\n  Waiting\n  Reject\n  Approved\n  Cancelled\n}\n\nenum srl_status1 {\n  Waiting\n  Reject\n  Approved\n  Cancelled\n}\n\nenum srl_status2 {\n  Waiting\n  Reject\n  Approved\n  Cancelled\n}\n\nenum spl_status1 {\n  Waiting\n  Reject\n  Approved\n  Cancelled\n}\n\nenum spl_status2 {\n  Waiting\n  Reject\n  Approved\n  Cancelled\n}\n\nenum employee_status {\n  Aktif\n  Nonaktif\n}\n",
  "inlineSchemaHash": "a7efc2ac04dbcec491694769d85b3cb4058ccde327f404af9256af4aa2bddcf6",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"employee\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"payroll\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id_machine\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"profile_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"50\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"email\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"100\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"250\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"password\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"250\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"position\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"100\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"department\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"location\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"100\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"phone\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"13\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"workhour\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":[\"SmallInt\",[]],\"default\":8,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"approver\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"substitute\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"join_date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":[\"Date\",[]],\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"signature\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"250\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"employee_status\",\"nativeType\":null,\"default\":\"Aktif\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"attendance_attendance_createdByToemployee\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"attendance\",\"nativeType\":null,\"relationName\":\"attendance_createdByToemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"attendance_attendance_user_id_machineToemployee\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"attendance\",\"nativeType\":null,\"relationName\":\"attendance_user_id_machineToemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"check_io\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"check_io\",\"nativeType\":null,\"relationName\":\"check_ioToemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cuti_cuti_approvalToemployee\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"cuti\",\"nativeType\":null,\"relationName\":\"cuti_approvalToemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cuti\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"cuti\",\"nativeType\":null,\"relationName\":\"cutiToemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"profile\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"profile\",\"nativeType\":null,\"relationName\":\"employeeToprofile\",\"relationFromFields\":[\"profile_id\"],\"relationToFields\":[\"profile_id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee_employee_approverToemployee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"employee_approverToemployee\",\"relationFromFields\":[\"approver\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"other_employee_employee_approverToemployee\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"employee_approverToemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"dept\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"dept\",\"nativeType\":null,\"relationName\":\"deptToemployee\",\"relationFromFields\":[\"department\"],\"relationToFields\":[\"dept_code\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee_employee_substituteToemployee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"employee_substituteToemployee\",\"relationFromFields\":[\"substitute\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"other_employee_employee_substituteToemployee\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"employee_substituteToemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"ijin_ijin_approvalToemployee\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ijin\",\"nativeType\":null,\"relationName\":\"ijin_approvalToemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"ijin\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ijin\",\"nativeType\":null,\"relationName\":\"employeeToijin\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"skpd_skpd_createdByToemployee\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"skpd\",\"nativeType\":null,\"relationName\":\"skpd_createdByToemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"skpd_skpd_payrollToemployee\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"skpd\",\"nativeType\":null,\"relationName\":\"skpd_payrollToemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"spl_spl_approval1Toemployee\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"spl\",\"nativeType\":null,\"relationName\":\"spl_approval1Toemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"spl_spl_approval2Toemployee\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"spl\",\"nativeType\":null,\"relationName\":\"spl_approval2Toemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"spl_detail\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"spl_detail\",\"nativeType\":null,\"relationName\":\"employeeTospl_detail\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sppd\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"sppd\",\"nativeType\":null,\"relationName\":\"employeeTosppd\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sppd_detail\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"sppd_detail\",\"nativeType\":null,\"relationName\":\"employeeTosppd_detail\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"srl_srl_approval1Toemployee\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"srl\",\"nativeType\":null,\"relationName\":\"srl_approval1Toemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"srl_srl_approval2Toemployee\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"srl\",\"nativeType\":null,\"relationName\":\"srl_approval2Toemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"srl\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"srl\",\"nativeType\":null,\"relationName\":\"employeeTosrl\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"profile\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"profile_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"50\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"100\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"level\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":[\"TinyInt\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_hrd\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Boolean\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"access_sppd\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"4\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"access_skpd\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"4\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"access_attendance\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"4\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"access_spl\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"4\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"access_srl\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"4\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"access_cuti\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"4\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"access_ijin\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"4\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"access_calendar\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"4\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"access_user\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"4\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"access_profile\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"4\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"access_dept\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"4\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"access_setting\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"4\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"employeeToprofile\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"check_io\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"check_io_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id_machine\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"check_in\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"check_out\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"50\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"check_ioToemployee\",\"relationFromFields\":[\"user_id_machine\"],\"relationToFields\":[\"user_id_machine\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"attendance\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"attendance_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id_machine\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"check_in\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"check_out\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"check_in2\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"check_out2\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"50\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"ijin_info\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"50\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"attachment\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Text\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee_attendance_createdByToemployee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"attendance_createdByToemployee\",\"relationFromFields\":[\"createdBy\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee_attendance_user_id_machineToemployee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"attendance_user_id_machineToemployee\",\"relationFromFields\":[\"user_id_machine\"],\"relationToFields\":[\"user_id_machine\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"temp_check_io\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"check_io_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id_machine\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"datetime\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"50\"]],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"calendar\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"calendar_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"calendar_type\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"Date\",[]],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"setting\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"setting_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"start_periode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":[\"TinyInt\",[]],\"default\":17,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"end_periode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":[\"TinyInt\",[]],\"default\":16,\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"spl\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"spl_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purpose\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"est_start\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"est_end\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status1\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"spl_status1\",\"nativeType\":null,\"default\":\"Waiting\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"approval1\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status2\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"spl_status2\",\"nativeType\":null,\"default\":\"Waiting\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"approval2\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee_spl_approval1Toemployee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"spl_approval1Toemployee\",\"relationFromFields\":[\"approval1\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee_spl_approval2Toemployee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"spl_approval2Toemployee\",\"relationFromFields\":[\"approval2\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"spl_detail\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"spl_detail\",\"nativeType\":null,\"relationName\":\"splTospl_detail\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"srl\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"srl\",\"nativeType\":null,\"relationName\":\"splTosrl\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"spl_detail\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"spl_detail_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"step\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":[\"TinyInt\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"spl_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"payroll\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"employeeTospl_detail\",\"relationFromFields\":[\"payroll\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"spl\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"spl\",\"nativeType\":null,\"relationName\":\"splTospl_detail\",\"relationFromFields\":[\"spl_id\"],\"relationToFields\":[\"spl_id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"dept\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"dept_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"dept_code\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"initial\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"10\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"100\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"dept_status\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"deptToemployee\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sppd_sppd_deptTodept\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"sppd\",\"nativeType\":null,\"relationName\":\"sppd_deptTodept\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"srl\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"srl_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"spl_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"payroll\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"real_start\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"real_end\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status1\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"srl_status1\",\"nativeType\":null,\"default\":\"Waiting\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"approval1\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status2\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"srl_status2\",\"nativeType\":null,\"default\":\"Waiting\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"approval2\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee_srl_approval1Toemployee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"srl_approval1Toemployee\",\"relationFromFields\":[\"approval1\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee_srl_approval2Toemployee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"srl_approval2Toemployee\",\"relationFromFields\":[\"approval2\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"employeeTosrl\",\"relationFromFields\":[\"payroll\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"spl\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"spl\",\"nativeType\":null,\"relationName\":\"splTosrl\",\"relationFromFields\":[\"spl_id\"],\"relationToFields\":[\"spl_id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"srl_detail\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"srl_detail\",\"nativeType\":null,\"relationName\":\"srlTosrl_detail\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"srl_detail\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"srl_detail_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"srl_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"50\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"srl\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"srl\",\"nativeType\":null,\"relationName\":\"srlTosrl_detail\",\"relationFromFields\":[\"srl_id\"],\"relationToFields\":[\"srl_id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"cuti\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"cuti_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"payroll\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"50\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"Date\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"year\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":[\"SmallInt\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"cuti_status\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"approval\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee_cuti_approvalToemployee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"cuti_approvalToemployee\",\"relationFromFields\":[\"approval\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"cutiToemployee\",\"relationFromFields\":[\"payroll\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"sppd\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"sppd_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purpose\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"location\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"100\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"dept\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"start_date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"end_date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"duration\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":[\"TinyInt\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"skpd\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"skpd\",\"nativeType\":null,\"relationName\":\"skpdTosppd\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"employeeTosppd\",\"relationFromFields\":[\"createdBy\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"dept_sppd_deptTodept\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"dept\",\"nativeType\":null,\"relationName\":\"sppd_deptTodept\",\"relationFromFields\":[\"dept\"],\"relationToFields\":[\"dept_code\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sppd_detail\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"sppd_detail\",\"nativeType\":null,\"relationName\":\"sppdTosppd_detail\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"sppd_detail\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"sppd_detail_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"step\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":[\"TinyInt\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sppd_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"payroll\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"employeeTosppd_detail\",\"relationFromFields\":[\"payroll\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sppd\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"sppd\",\"nativeType\":null,\"relationName\":\"sppdTosppd_detail\",\"relationFromFields\":[\"sppd_id\"],\"relationToFields\":[\"sppd_id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"skpd\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"skpd_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"default\":\"getNomorSKPD()\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sppd_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"payroll\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"real_start\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"real_end\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"skpd_status\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee_skpd_createdByToemployee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"skpd_createdByToemployee\",\"relationFromFields\":[\"createdBy\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee_skpd_payrollToemployee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"skpd_payrollToemployee\",\"relationFromFields\":[\"payroll\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sppd\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"sppd\",\"nativeType\":null,\"relationName\":\"skpdTosppd\",\"relationFromFields\":[\"sppd_id\"],\"relationToFields\":[\"sppd_id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"ijin\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"ijin_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"40\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"payroll\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"50\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"Date\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ijin_status\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"approval\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"8\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":[\"DateTime\",[\"0\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee_ijin_approvalToemployee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"ijin_approvalToemployee\",\"relationFromFields\":[\"approval\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"employee\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"employee\",\"nativeType\":null,\"relationName\":\"employeeToijin\",\"relationFromFields\":[\"payroll\"],\"relationToFields\":[\"payroll\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false}},\"enums\":{\"calendar_type\":{\"values\":[{\"name\":\"Hari_Libur\",\"dbName\":\"Hari Libur\"},{\"name\":\"Cuti_Bersama\",\"dbName\":\"Cuti Bersama\"},{\"name\":\"Event_Kantor\",\"dbName\":\"Event Kantor\"}],\"dbName\":null},\"dept_status\":{\"values\":[{\"name\":\"Aktif\",\"dbName\":null},{\"name\":\"Nonaktif\",\"dbName\":null}],\"dbName\":null},\"skpd_status\":{\"values\":[{\"name\":\"OPEN\",\"dbName\":null},{\"name\":\"CLOSE\",\"dbName\":null}],\"dbName\":null},\"ijin_status\":{\"values\":[{\"name\":\"Waiting\",\"dbName\":null},{\"name\":\"Reject\",\"dbName\":null},{\"name\":\"Approved\",\"dbName\":null},{\"name\":\"Cancelled\",\"dbName\":null}],\"dbName\":null},\"cuti_status\":{\"values\":[{\"name\":\"Waiting\",\"dbName\":null},{\"name\":\"Reject\",\"dbName\":null},{\"name\":\"Approved\",\"dbName\":null},{\"name\":\"Cancelled\",\"dbName\":null}],\"dbName\":null},\"srl_status1\":{\"values\":[{\"name\":\"Waiting\",\"dbName\":null},{\"name\":\"Reject\",\"dbName\":null},{\"name\":\"Approved\",\"dbName\":null},{\"name\":\"Cancelled\",\"dbName\":null}],\"dbName\":null},\"srl_status2\":{\"values\":[{\"name\":\"Waiting\",\"dbName\":null},{\"name\":\"Reject\",\"dbName\":null},{\"name\":\"Approved\",\"dbName\":null},{\"name\":\"Cancelled\",\"dbName\":null}],\"dbName\":null},\"spl_status1\":{\"values\":[{\"name\":\"Waiting\",\"dbName\":null},{\"name\":\"Reject\",\"dbName\":null},{\"name\":\"Approved\",\"dbName\":null},{\"name\":\"Cancelled\",\"dbName\":null}],\"dbName\":null},\"spl_status2\":{\"values\":[{\"name\":\"Waiting\",\"dbName\":null},{\"name\":\"Reject\",\"dbName\":null},{\"name\":\"Approved\",\"dbName\":null},{\"name\":\"Cancelled\",\"dbName\":null}],\"dbName\":null},\"employee_status\":{\"values\":[{\"name\":\"Aktif\",\"dbName\":null},{\"name\":\"Nonaktif\",\"dbName\":null}],\"dbName\":null}},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = undefined
config.compilerWasm = undefined

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

