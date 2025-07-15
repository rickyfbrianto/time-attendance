import z from 'zod'

export const ProfileSchema = z.object({
    profile_id: z.string(),
    name: z.string().min(3, "Min 3 Character").max(100, "Max 100 Character"),
    description: z.string().min(5, "Min 5 Character").max(255, "Max 255 Character"),
    level: z.number(),
    user_hrd: z.boolean(),
    access_sppd: z.string().max(4, "Max 4 Character"),
    access_skpd: z.string().max(4, "Max 4 Character"),
    access_attendance: z.string().max(4, "Max 4 Character"),
    access_spl: z.string().max(4, "Max 4 Character"),
    access_srl: z.string().max(4, "Max 4 Character"),
    access_cuti: z.string().max(4, "Max 4 Character"),
    access_ijin: z.string().max(4, "Max 4 Character"),
    access_calendar: z.string().max(4, "Max 4 Character"),
    access_user: z.string().max(4, "Max 4 Character"),
    access_profile: z.string().max(4, "Max 4 Character"),
    access_dept: z.string().max(4, "Max 4 Character"),
    access_setting: z.string().max(4, "Max 4 Character"),
    status: z.string().min(1)
})

export type TProfileSchema = z.infer<typeof ProfileSchema>

export const UserSchema = z.object({
    payroll: z.string().min(6, "Min 6 Character").max(8, "Max 8 Character"),
    user_id_machine: z.string().min(3, "Min 3 Character").max(10, "Max 10 Character"),
    profile_id: z.string().trim().min(1),
    email: z.string().email().max(100, "Max 100 Character"),
    name: z.string().min(3, "Min 3 Character").max(250, "Max 250 Character"),
    password: z.string().min(3, "Min 3 Character").max(30, "Max 30 Character"),
    position: z.string().min(5, "Min 5 Character").max(100, "Max 100 Character"),
    department: z.string().length(4, "Need 4 Character"),
    location: z.string().min(5, "Min 5 Character").max(50, "Max 50 Character"),
    phone: z.string().min(6, "Min 6 Character").max(13, "Max 13 Character"),
    overtime: z.boolean(),
    workhour: z.number().gte(7, "Min 7").lte(8, "Max 8"),
    start_work: z.string().time(),
    approver: z.string().min(6, "Min 6 Character").max(8, "Max 8 Character"),
    substitute: z.string().min(6, "Min 6 Character").max(8, "Max 8 Character"),
    join_date: z.string().date(),
    signature: z.union([z.string().max(250, "Max 250 Character"), z.object({})]),
    user_security: z.boolean(),
    user_hod: z.boolean(),
    hostname: z.string().min(6, "Min 11 Character").max(31, "Max 31 Character"),
    status: z.string().min(1)
})

export type TUserSchema = z.infer<typeof UserSchema>

export const DeptSchema = z.object({
    dept_id: z.string(),
    dept_code: z.number().min(4, "Min 4 Character").max(6, "Max 6 Character"),
    initial: z.string().min(2, "Min 2 Character").max(15, "Max 15 Character"),
    name: z.string().min(3, "Min 3 Character").max(100, "Max 100 Character"),
    status: z.string().trim().min(1),
})

export type TDeptSchema = z.infer<typeof DeptSchema>

export const SettingSchema = z.object({
    setting_id: z.string(),
    start_periode: z.number().gte(1, "Min 1").lte(31, "Max 31"),
    end_periode: z.number().gte(1, "Min 1").lte(31, "Max 31"),
    late_dispen: z.number().gte(0, "Min 0").lte(60, "Max 60"),
    overtime_allow: z.number().gte(1, "Min 1").lte(29, "Max 29"),
    overtime_round_up: z.boolean()
})

export type TSettingSchema = z.infer<typeof SettingSchema>

export const CalendarSchema = z.object({
    calendar_id: z.string(),
    description: z.string().min(4, "Min 4 Character").max(255, "Max 255 Character"),
    type: z.string().trim().min(1),
    date: z.string().date()
})

export type TCalendarSchema = z.infer<typeof CalendarSchema>