
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


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

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

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
exports.employee_status = exports.$Enums.employee_status = {
  Aktif: 'Aktif',
  Nonaktif: 'Nonaktif'
};

exports.calendar_type = exports.$Enums.calendar_type = {
  Hari_Libur: 'Hari_Libur',
  Cuti_Bersama: 'Cuti_Bersama',
  Event_Kantor: 'Event_Kantor'
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

exports.dept_status = exports.$Enums.dept_status = {
  Aktif: 'Aktif',
  Nonaktif: 'Nonaktif'
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

exports.cuti_status = exports.$Enums.cuti_status = {
  Waiting: 'Waiting',
  Reject: 'Reject',
  Approved: 'Approved',
  Cancelled: 'Cancelled'
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
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
