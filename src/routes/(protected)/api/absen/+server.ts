import {json} from '@sveltejs/kit'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(){
    try {
        const items = await prisma.$queryRaw`SELECT
                    tgl.user_id_machine,
                    user.payroll,
                    user.name,
                    DATE_FORMAT( datetime, '%Y-%m-%d' ) AS tanggal,
                    check_in.check_in,
                    check_out.check_out
                FROM
                    check_io AS tgl
                    LEFT JOIN employee as user on user.user_id_machine = tgl.user_id_machine
                    LEFT JOIN (select user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(datetime),'%H:%i:%s') as check_in from check_io where type='Check In' GROUP BY user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d')) as check_in ON check_in.user_id_machine=tgl.user_id_machine AND check_in.tanggal=DATE_FORMAT(tgl.datetime,'%Y-%m-%d') 
                    LEFT JOIN(select user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(datetime),'%H:%i:%s') as check_out from check_io where type='Check Out' GROUP BY user_id_machine,DATE_FORMAT(datetime,'%Y-%m-%d')) as check_out ON check_out.user_id_machine=tgl.user_id_machine AND check_out.tanggal=DATE_FORMAT(tgl.datetime,'%Y-%m-%d')
                GROUP BY tgl.user_id_machine, DATE_FORMAT(datetime, '%Y-%m-%d')`

        return json(items)
    } catch (error) {
        return {error}
    }
}

export async function POST({request}) {
    const data = await request.json()
    console.log(data)    

    return json({data})
}