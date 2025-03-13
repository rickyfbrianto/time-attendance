import { prismaErrorHandler } from "@lib/utils";
import { error, json } from "@sveltejs/kit";
import { PrismaClient } from "@prisma/client";
import { v4 as uuid4} from "uuid";
import {writeFile} from 'node:fs/promises'
import { extname } from "node:path";

const prisma = new PrismaClient()

export async function GET(){
    try {
        const status = await prisma.$transaction(async (tx) =>{
            const items = await tx.$queryRaw`SELECT att.user_id_machine, user.name, DATE_FORMAT( datetime, '%Y-%m-%d' ) AS tanggal,
                check_in.check_in, check_out.check_out
                FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    LEFT JOIN (select user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(datetime),'%H:%i:%s') as check_in from check_io where type='CI' GROUP BY user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d')) as check_in ON check_in.user_id_machine=att.user_id_machine AND check_in.tanggal=DATE_FORMAT(att.datetime,'%Y-%m-%d')         
                    LEFT JOIN (select user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(datetime),'%H:%i:%s') as check_out from check_io where type='CO' GROUP BY user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d')) as check_out ON check_out.user_id_machine=att.user_id_machine AND check_out.tanggal=DATE_FORMAT(att.datetime,'%Y-%m-%d')
                GROUP BY att.user_id_machine, DATE_FORMAT(datetime, '%Y-%m-%d')
                ORDER by datetime asc`
            
            const tempTotal = await tx.$queryRaw`SELECT CAST(COUNT(*) as UNSIGNED) as count FROM (SELECT att.user_id_machine
                FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    LEFT JOIN (select user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(datetime),'%H:%i:%s') as check_in from check_io where type='CI' GROUP BY user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d')) as check_in ON check_in.user_id_machine=att.user_id_machine AND check_in.tanggal=DATE_FORMAT(att.datetime,'%Y-%m-%d') 
                    LEFT JOIN (select user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(datetime),'%H:%i:%s') as check_out from check_io where type='CO' GROUP BY user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d')) as check_out ON check_out.user_id_machine=att.user_id_machine AND check_out.tanggal=DATE_FORMAT(att.datetime,'%Y-%m-%d')
                GROUP BY att.user_id_machine, DATE_FORMAT(datetime, '%Y-%m-%d')) as tmp`
            const totalItems = Number(tempTotal[0].count)
            return {items, totalItems}
        }, {maxWait:5000,timeout:10000})
                
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
        
        const {status} = await prisma.$transaction(async (tx) => {
            // await writeFile(`./lib/assets/${attendance_id + extname(data.get('attachment'))}`, await data.get('attachment').stream())
            await tx.attendance.create({
                data:{
                    attendance_id,
                    user_id_machine: data.get('user_id_machine'),
                    datetime: new Date(data.get('datetime')),
                    type: data.get('type'),
                    description: data.get('description'),
                    attachment: attachment ? attendance_id + extname(attachment.name) : null,
                    createdBy: data.get('createdBy'),
                }
            })
            
            await tx.check_io.create({
                data:{
                    check_io_id: uuid4(),
                    user_id_machine: data.get('user_id_machine'),
                    datetime: new Date(data.get('datetime')),
                    type: data.get('type'),
                }
            })

            return {status:true}
        })

        if(status && attachment){
            const filename = `/uploads/${attendance_id + extname(attachment.name)}`
            await writeFile(filename, Buffer.from(await attachment?.arrayBuffer()));
            return json({message:"Data saved successfully"})
        }
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