import { formatTanggalISO, prismaErrorHandler, safeDate } from "@lib/utils";
import { error, json } from "@sveltejs/kit";
import { extname } from "node:path";
import { v4 as uuid4} from "uuid";
import { writeFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@lib/utils.js'

export async function GET({url}){
    try {
        const page = Number(url.searchParams.get('_page')) || 1
        const limit = Number(url.searchParams.get('_limit')) || 10
        const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
        const sort = url.searchParams.get('_sort') || "att.check_in"
        const order = url.searchParams.get('_order') || "asc"
        const search = url.searchParams.get('_search') || ""
        
        const dept = url.searchParams.get('dept') || ""
        const payroll = url.searchParams.get('payroll') || ""
        
        const status = await prisma.$transaction(async (tx) =>{
            const items = await tx.$queryRawUnsafe(`SELECT att.attendance_id, att.user_id_machine, user.name, user.payroll, att.check_in AS check_in, att.check_out AS check_out, 
                att.description, att.type, att.ijin_info, 
                GetStartOvertime( att.check_in, att.check_out, user.workhour) AS lembur_start,
                RoundCheckOut( att.check_in, att.check_out) as lembur_end
                FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    WHERE (user.department like ? AND user.payroll like ?) AND (att.check_in like ? OR user.name like ? OR user.payroll like ?)
                    ORDER by ${sort} ${order}
                    LIMIT ${limit} OFFSET ${offset}`,
                `%${dept}%`, `%${payroll}%`, `%${search}%`, `%${search}%`, `%${search}%`) as {count:number}[]
            
            const [{count}] = await tx.$queryRawUnsafe(`SELECT CAST(COUNT(*) as UNSIGNED) as count FROM (
                SELECT att.attendance_id FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    WHERE (user.department like ? AND user.payroll like ?) AND (att.check_in like ? OR user.name like ? OR user.payroll like ?)
                    ) as tmp`,
                `%${dept}%`, `%${payroll}%`, `%${search}%`, `%${search}%`, `%${search}%`) as {count:number}[]
            const totalItems = Number(count)
            return {items, totalItems}
        })
                
        return json(status)
    } catch (error) {
        console.log("err catch",error);
        return {error}
    }
}

export async function POST({request, url}) {
    try {
        const data = await request.formData()
        const attendance_id = uuid4()
        const attachment = data.get('attachment')
        
        const status = await prisma.$transaction(async (tx) => {
            // untuk mengecek apakah ada attendance dengan tipe cuti bersama atau hari libur, jika ya maka update check in, check out dan type serta keterangan
            const getTime = await tx.$queryRawUnsafe(`
            SELECT attendance_id as getTime FROM attendance 
            WHERE type in ('Cuti Bersama','Hari Libur') AND user_id_machine = ? AND DATE(check_in) = DATE(?) AND DATE(check_out) = DATE(?)`, 
            data.get('user_id_machine'), data.get('check_in'), data.get('check_out')) as {}[]

            if(getTime[0]){
                const [{description}] = await tx.$queryRawUnsafe(`SELECT description FROM calendar WHERE DATE(date) = DATE(?)`, 
                    data.get('check_in')) as {description: string}[]
                await tx.$queryRawUnsafe(`
                    UPDATE attendance SET check_in=?,check_out=?,type=?,description=?
                    WHERE type in ('Cuti Bersama','Hari Libur') AND user_id_machine = ? AND DATE(check_in) = DATE(?) AND DATE(check_out) = DATE(?)`,
                    data.get('check_in'), data.get('check_out'),
                    // `${data.get('date')}T${data.get('check_in')}Z`,  `${data.get('date')}T${data.get('check_out')}Z`,
                    data?.get('type'), data?.get('description') ? description +","+ data?.get('description'): description, data.get('user_id_machine'),
                    data.get('check_in'), data.get('check_out'))
                return {message:"Data successfully updated"}
            }

            const getAttendance = await tx.attendance.findFirst({
                where:{attendance_id : data.get('attendance_id')}
            })
            
            if(!getAttendance){
                console.log('insert time attendance baru')
                const attendance = await tx.$queryRawUnsafe(`INSERT INTO attendance
                    (attendance_id,user_id_machine,check_in,check_out,check_in2,check_out2,type,ijin_info,description,attachment,createdBy,createdAt)
                    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())`,
                    attendance_id, 
                    data.get('user_id_machine'),
                    data.get('check_in'),
                    data.get('check_out'),
                    data.get('check_in2') || null,
                    data.get('check_out2') || null,
                    data.get('type'),
                    data.get('ijin_info'),
                    data.get('description'),
                    attachment ? attendance_id + extname(attachment.name) : null,
                    data.get('createdBy')
                )
                
                const check_io = await tx.check_io.create({
                    data:{
                        check_io_id: uuid4(),
                        user_id_machine: data.get('user_id_machine'),
                        check_in: new Date(data.get('check_in') + " UTC"),
                        check_out: new Date(data.get('check_out') + " UTC"),
                        type: data.get('type'),
                    }
                })

                if(attendance && check_io && attachment){
                    const filename = path.resolve('src/lib/assets/attach_attendance') + `/${attendance_id + extname(attachment.name)}`
                    await writeFile(filename, Buffer.from(await attachment?.arrayBuffer()));
                }

                return {message:"Data successfully saved"}
            } else {
                console.log('update time attendance baru')
                const attendance = await tx.$queryRawUnsafe(`
                    UPDATE attendance SET user_id_machine=?,check_in=?,check_out=?,
                    check_in2=?,check_out2=?,type=?,ijin_info=?,description=?,attachment=?,createdBy=?
                    WHERE attendance_id = ?`,
                    data.get('user_id_machine'),
                    data.get('check_in'),
                    data.get('check_out'),
                    data.get('check_in2') || null ,
                    data.get('check_out2') || null ,
                    data.get('type'),
                    data?.get('ijin_info'),
                    data?.get('description'),
                    attachment ? data.get('attendance_id') + extname(attachment.name) : getAttendance.attachment,
                    data.get('createdBy'),
                    data.get('attendance_id')
                )

                if(attendance && attachment){
                    const filename = path.resolve('src/lib/assets/attach_attendance') + `/${data.get('attendance_id') + extname(attachment.name)}`
                    await writeFile(filename, Buffer.from(await attachment?.arrayBuffer()));
                }

                return {message:"Data successfully updated"}
            }
        })

        return json(status)
    } catch (err) {
        console.log(err)
        error(500, { message: prismaErrorHandler(err) });
    }
}