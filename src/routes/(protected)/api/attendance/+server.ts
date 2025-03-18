import { prismaErrorHandler } from "@lib/utils";
import { error, json } from "@sveltejs/kit";
import { extname } from "node:path";
import { v4 as uuid4} from "uuid";
import { appendFile, writeFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@lib/utils.js'

export async function GET({url}){
    try {
        const dept = url.searchParams.get('dept')
        const payroll = url.searchParams.get('payroll')
        let where = "WHERE 1=1 " + (dept ? ` AND user.department = '${dept}'` :"") + (payroll ? ` AND user.payroll = '${payroll}'` :"") 
        
        const status = await prisma.$transaction(async (tx) =>{
            const items = await tx.$queryRawUnsafe(`SELECT att.attendance_id, att.user_id_machine, user.name, att.check_in AS check_in, att.check_out AS check_out, att.description, att.type
                FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    ${where}
                ORDER by DATE_FORMAT(att.check_in, '%Y-%m-%d') asc`)
            
            const tempTotal = await tx.$queryRawUnsafe(`SELECT CAST(COUNT(*) as UNSIGNED) as count FROM (
                SELECT att.attendance_id FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    ${where}
                    ) as tmp`)
            const totalItems = Number(tempTotal[0].count)
            return {items, totalItems}
        }, {
            maxWait:5000,
            timeout:10000
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
            const getAttendance = await tx.attendance.findUnique({
                where:{attendance_id : data.get('attendance_id')}
            })

            if(!getAttendance){
                const attendance = await tx.attendance.create({
                    data:{
                        attendance_id,
                        user_id_machine: data.get('user_id_machine'),
                        check_in: new Date(data.get('check_in') + " UTC"),
                        check_out: new Date(data.get('check_out') + " UTC"),
                        type: data.get('type'),
                        description: data?.get('description') ?? "-",
                        attachment: attachment ? attendance_id + extname(attachment.name) : null,
                        createdBy: data.get('createdBy'),
                    }
                })
                
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
                const attendance = await tx.attendance.update({
                    data:{
                        user_id_machine: data.get('user_id_machine'),
                        check_in: new Date(data.get('check_in') + " UTC"),
                        check_out: new Date(data.get('check_out') + " UTC"),
                        type: data.get('type'),
                        description: data?.get('description') ?? "-",
                        attachment: attachment ? data.get('attendance_id') + extname(attachment.name) : getAttendance.attachment,
                        createdBy: data.get('createdBy'),
                    }, where:{
                        attendance_id: data.get('attendance_id')
                    }
                })

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