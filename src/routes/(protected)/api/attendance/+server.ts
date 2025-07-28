import { formatTanggal, formatTanggalISO, pecahArray, prismaErrorHandler } from "@lib/utils";
import { error, json } from "@sveltejs/kit";
import { extname } from "node:path";
import { v4 as uuid4 } from "uuid";
import { writeFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@lib/utils.js'
import { eachDayOfInterval, format, getDay } from "date-fns";

export async function GET({ url }) {
    try {
        const page = Number(url.searchParams.get('_page')) || 1
        const limit = Number(url.searchParams.get('_limit')) || 10
        const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
        const sort = url.searchParams.get('_sort') || "att.check_in"
        const order = url.searchParams.get('_order') || "desc"
        const search = url.searchParams.get('_search') || ""

        const dept = url.searchParams.get('dept') || ""
        const payroll = url.searchParams.get('payroll') || ""
        const type = url.searchParams.get('type') || ""
        const start_date = url.searchParams.get('start_date') || ""
        const end_date = url.searchParams.get('end_date') || ""

        const status = await prisma.$transaction(async (tx) => {
            const items = await tx.$queryRawUnsafe(`SELECT att.attendance_id, att.user_id_machine, user.name, user.payroll, user.department as dept,
                att.check_in AS check_in, att.check_out AS check_out, att.check_in2, att.check_out2, 
                att.description, att.type, att.ijin_info, att.attachment, user.start_work, user.overtime, profile.level, profile.user_hrd,
                getSPL(user.payroll, att.check_in) as is_spl_exist,
                getUserWeekend(att.check_in, user.workhour) as isWeekend,
                getStartOvertime(att.attendance_id, user.workhour, user.start_work) AS lembur_start,
                roundCheckOut( att.check_in, att.check_out) as lembur_end
                FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    LEFT JOIN profile as profile on user.profile_id = profile.profile_id
                    WHERE (att.check_in like ? OR user.name like ? OR user.payroll like ?) 
                    AND user.department like ? AND user.payroll like ? AND att.type like ? AND DATE(check_in) BETWEEN ? AND ?
                    ORDER by ${sort} ${order}
                    LIMIT ${limit} OFFSET ${offset}`,
                `%${search}%`, `%${search}%`, `%${search}%`, `%${dept}%`, `%${payroll}%`, `%${type}%`, start_date, end_date)

            const [{ count }] = await tx.$queryRawUnsafe(`SELECT CAST(COUNT(*) as UNSIGNED) as count FROM (
                SELECT att.attendance_id FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    LEFT JOIN profile as profile on user.profile_id = profile.profile_id
                    WHERE (att.check_in like ? OR user.name like ? OR user.payroll like ?) 
                    AND user.department like ? AND user.payroll like ? AND att.type like ? AND DATE(check_in) BETWEEN ? AND ?
                    ) as tmp`,
                `%${search}%`, `%${search}%`, `%${search}%`, `%${dept}%`, `%${payroll}%`, `%${type}%`, start_date, end_date) as { count: number }[]
            const totalItems = Number(count)
            return { items, totalItems }
        })

        return json(status)
    } catch (error) {
        console.log("err catch", error);
        return { error }
    }
}

export async function POST({ request, locals }) {
    try {
        const attendance_id = uuid4()
        const data = await request.formData()
        const { userProfile } = locals
        const attachment = data.get('attachment')
        const isAttachment = typeof attachment == "object" ? true : false

        const status = await prisma.$transaction(async (tx) => {
            // untuk mengecek apakah ada attendance dengan tipe cuti bersama atau hari libur, jika ya maka update check in, check out dan type serta keterangan
            // const getCalendar = await tx.$queryRawUnsafe(`SELECT description FROM calendar WHERE DATE(date) = DATE(?)`, 
            //     data.get('check_in')) as {description: string}[]
            // const updateTime = await tx.$executeRawUnsafe(`
            //     UPDATE attendance SET check_in=?,check_out=?,type=?,description=?
            //     WHERE type in ('Cuti Bersama','Hari Libur') AND user_id_machine = ? AND DATE(check_in) = DATE(?) AND DATE(check_out) = DATE(?)`,
            //     data.get('check_in'), data.get('check_out'),
            //     data?.get('type'), data?.get('description') ? description +","+ data?.get('description'): description, data.get('user_id_machine'),
            //     data.get('check_in'), data.get('check_out'))
            // if(updateTime){
            //     return {message:"Data successfully updated"}
            // }

            const getAttendance = await tx.attendance.findFirst({
                where: { attendance_id: data.get('attendance_id') }
            })

            if (!getAttendance) {
                if (!pecahArray(userProfile.access_attendance, "C")) throw new Error("Cant insert Attendance, because you have no authorization")
                const user = await tx.employee.findUnique({
                    select: { workhour: true },
                    where: { user_id_machine: data.get('user_id_machine') }
                })
                const fileAttachment = isAttachment ? attendance_id + extname(attachment?.name || "") : ""

                if (data.get('type') == 'Sakit') {
                    // const eventSkip = ['Hari Libur', 'Cuti Bersama', 'Event Kantor', 'Sakit']
                    // const resAttendance = await prisma.$queryRawUnsafe(`SELECT type, check_in as date FROM attendance where DATE(check_in) BETWEEN ? AND ? AND user_id_machine = ?`,
                    //     data.get('check_in'), data.get('check_out'), data.get('user_id_machine')) as { type: string, date: string }[]

                    const daysInRange = eachDayOfInterval({ start: data.get('check_in'), end: data.get('check_out') })
                    const dayFree = user?.workhour == 7 ? [0] : [0, 6]

                    const temp = daysInRange.filter(v => !dayFree.includes(getDay(v)))
                        .map(v => formatTanggal(format(v, "yyyy-MM-dd"), "date"))

                    const query = temp.map(async (v: string) => {
                        return tx.$executeRawUnsafe(`INSERT INTO attendance
                                (attendance_id,user_id_machine,check_in,check_out,check_in2,check_out2,
                                type,ijin_info,description,attachment,createdBy,createdAt)
                                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())`,
                            uuid4(),
                            data.get('user_id_machine'),
                            v,
                            v,
                            data.get('check_in2') || null,
                            data.get('check_out2') || null,
                            data.get('type'),
                            data.get('ijin_info'),
                            data.get('description'),
                            fileAttachment,
                            data.get('createdBy')
                        )
                    })
                    const tempHasil = await Promise.all(query)

                    if (tempHasil && attachment) {
                        const filename = path.resolve(process.env.ATTACH_ATTANDANCE) + `/${fileAttachment}`
                        await writeFile(filename, Buffer.from(await attachment?.arrayBuffer()));
                    }
                } else {
                    const attendance = await tx.$executeRawUnsafe(`INSERT INTO attendance
                            (attendance_id,user_id_machine,check_in,check_out,check_in2,check_out2,
                            type,ijin_info,description,attachment,createdBy,createdAt)
                            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())`,
                        attendance_id,
                        data.get('user_id_machine'),
                        data.get('check_in'),
                        data.get('check_out'),
                        data.get('check_in2') || null,
                        data.get('check_out2') || null,
                        data.get('type'),
                        data.get('ijin_info'),
                        data.get('description'),
                        fileAttachment,
                        data.get('createdBy')
                    )

                    if (attendance && attachment) {
                        const filename = path.resolve(process.env.ATTACH_ATTANDANCE) + `/${fileAttachment}`
                        await writeFile(filename, Buffer.from(await attachment?.arrayBuffer()));
                    }
                }
                return { message: "Attendance successfully saved" }
            } else {
                if (!pecahArray(userProfile.access_attendance, "U")) throw new Error("Cant update Attendance, because you have no authorization")

                const fileAttachment = isAttachment ? data.get('attendance_id') + extname(attachment?.name || "") : ""

                const attendance = await tx.$executeRawUnsafe(`
                        UPDATE attendance SET user_id_machine=?,check_in=?,check_out=?,
                        check_in2=?,check_out2=?,type=?,ijin_info=?,description=?,attachment=?,createdBy=?
                        WHERE attendance_id = ?`,
                    data.get('user_id_machine'),
                    data.get('check_in'),
                    data.get('check_out'),
                    data.get('check_in2') || null,
                    data.get('check_out2') || null,
                    data.get('type'),
                    data?.get('ijin_info'),
                    data?.get('description'),
                    isAttachment ? fileAttachment : attachment,
                    data.get('createdBy'),
                    data.get('attendance_id')
                )

                if (attendance && isAttachment) {
                    // const filename = path.resolve('src/lib/assets/media/attach_attendance') + `/${data.get('attendance_id') + extname(attachment.name)}`
                    const filename = path.resolve(process.env.ATTACH_ATTANDANCE) + `/${fileAttachment}`
                    await writeFile(filename, Buffer.from(await attachment?.arrayBuffer()));
                }

                return { message: "Attendance successfully updated" }
            }
        })

        return json(status)
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}