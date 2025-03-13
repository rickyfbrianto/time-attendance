import {json} from '@sveltejs/kit'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(){
    try {
        const status = await prisma.$transaction(async (tx) =>{
            const items = await tx.$queryRaw`SELECT att.user_id_machine, user.payroll, user.name, DATE_FORMAT( datetime, '%Y-%m-%d' ) AS tanggal,
                check_in.check_in, check_out.check_out
                FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    LEFT JOIN (select user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(datetime),'%H:%i:%s') as check_in from check_io where type='CI' GROUP BY user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d')) as check_in ON check_in.user_id_machine=att.user_id_machine AND check_in.tanggal=DATE_FORMAT(att.datetime,'%Y-%m-%d')         
                    LEFT JOIN (select user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(datetime),'%H:%i:%s') as check_out from check_io where type='CO' GROUP BY user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d')) as check_out ON check_out.user_id_machine=att.user_id_machine AND check_out.tanggal=DATE_FORMAT(att.datetime,'%Y-%m-%d')
                GROUP BY att.user_id_machine, DATE_FORMAT(datetime, '%Y-%m-%d')
                ORDER by datetime asc`
            
            const tempTotal = await tx.$queryRaw`SELECT CAST(COUNT(*) as UNSIGNED) as count FROM (SELECT att.user_id_machine, user.payroll, user.name, DATE_FORMAT( datetime, '%Y-%m-%d' ) AS tanggal,
                check_in.check_in, check_out.check_out
                FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    LEFT JOIN (select user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(datetime),'%H:%i:%s') as check_in from check_io where type='CI' GROUP BY user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d')) as check_in ON check_in.user_id_machine=att.user_id_machine AND check_in.tanggal=DATE_FORMAT(att.datetime,'%Y-%m-%d') 
                    LEFT JOIN (select user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(datetime),'%H:%i:%s') as check_out from check_io where type='CO' GROUP BY user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d')) as check_out ON check_out.user_id_machine=att.user_id_machine AND check_out.tanggal=DATE_FORMAT(att.datetime,'%Y-%m-%d')
                GROUP BY att.user_id_machine, DATE_FORMAT(datetime, '%Y-%m-%d')) as tmp`
            const totalItems = Number(tempTotal[0].count)
            return {items, totalItems}
        })
                
        return json(status)
    } catch (error) {
        console.log("err catch",error);
        return {error}
    }
}