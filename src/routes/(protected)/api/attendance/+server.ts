import { prismaErrorHandler } from "@lib/utils";
import { error, json } from "@sveltejs/kit";
import { extname } from "node:path";
import { v4 as uuid4} from "uuid";
import { appendFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@lib/utils.js'

export async function GET({url}){
    try {
        const dept = url.searchParams.get('dept')
        const payroll = url.searchParams.get('payroll')
        let where = "WHERE 1=1 " + (dept ? ` AND user.department = '${dept}'` :"") + (payroll ? ` AND user.payroll = '${payroll}'` :"") 
        
        const status = await prisma.$transaction(async (tx) =>{
            const items = await tx.$queryRawUnsafe(`SELECT att.user_id_machine, user.name, DATE_FORMAT( datetime, '%Y-%m-%d' ) AS tanggal, check_in.check_in, check_out.check_out, att.type
                FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    LEFT JOIN (select user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(datetime),'%H:%i:%s') as check_in from check_io where type='CI' GROUP BY user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d')) as check_in ON check_in.user_id_machine=att.user_id_machine AND check_in.tanggal=DATE_FORMAT(att.datetime,'%Y-%m-%d')
                    LEFT JOIN (select user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(datetime),'%H:%i:%s') as check_out from check_io where type='CO' GROUP BY user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d')) as check_out ON check_out.user_id_machine=att.user_id_machine AND check_out.tanggal=DATE_FORMAT(att.datetime,'%Y-%m-%d') 
                    ${where}
                GROUP BY att.user_id_machine, DATE_FORMAT(datetime, '%Y-%m-%d')
                ORDER by datetime asc`)
            
            const tempTotal = await tx.$queryRawUnsafe(`SELECT CAST(COUNT(*) as UNSIGNED) as count FROM (SELECT att.user_id_machine
                FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    LEFT JOIN (select user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(datetime),'%H:%i:%s') as check_in from check_io where type='CI' GROUP BY user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d')) as check_in ON check_in.user_id_machine=att.user_id_machine AND check_in.tanggal=DATE_FORMAT(att.datetime,'%Y-%m-%d') 
                    LEFT JOIN (select user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(datetime),'%H:%i:%s') as check_out from check_io where type='CO' GROUP BY user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d')) as check_out ON check_out.user_id_machine=att.user_id_machine AND check_out.tanggal=DATE_FORMAT(att.datetime,'%Y-%m-%d')
                    ${where}
                GROUP BY att.user_id_machine, DATE_FORMAT(datetime, '%Y-%m-%d')) as tmp`)
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
            const attendance = await tx.attendance.create({
                data:{
                    attendance_id,
                    user_id_machine: data.get('user_id_machine'),
                    datetime: data.get('datetime'),
                    type: data.get('type'),
                    description: data.get('description'),
                    attachment: attachment ? attendance_id + extname(attachment.name) : null,
                    createdBy: data.get('createdBy'),
                }
            })
            
            const check_io = await tx.check_io.create({
                data:{
                    check_io_id: uuid4(),
                    user_id_machine: data.get('user_id_machine'),
                    datetime: data.get('datetime'),
                    type: data.get('type'),
                }
            })

            if(attendance && check_io && attachment){
                const filename = path.resolve('src/lib/assets/attach_attendance') + `/${attendance_id + extname(attachment.name)}`
                await appendFile(filename, Buffer.from(await attachment?.arrayBuffer()));
            }
            return {message:"Data saved successfully"}
        })

        return json(status)
    } catch (err) {
        console.log(err)
        error(500, { message: prismaErrorHandler(err) });
    }
}

export async function PUT({request}) {
    const data = await request.formData()
    console.log(data.get('attachment'))
    return json({data:"ok"})
}