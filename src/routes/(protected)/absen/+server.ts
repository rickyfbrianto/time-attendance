import {json} from '@sveltejs/kit'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(){
    try {
        // user.nama, LEFT JOIN employee as user ON check_io.user_id_mesin = user.user_id_mesin
        const req = await prisma.$queryRaw`SELECT
            check_io.user_id_mesin,
            user.name,
            DATE_FORMAT( waktu, '%Y-%m-%d' ) AS tanggal,
            check_in.check_in,
            check_out.check_out
        FROM
            check_io
            LEFT JOIN employee as user ON user.user_id_mesin = check_io.user_id_mesin
            LEFT JOIN (select user_id_mesin,DATE_FORMAT(waktu,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(waktu),'%H:%i:%s') as check_in from check_io where type='Check In' GROUP BY DATE_FORMAT(waktu,'%Y-%m-%d')) as check_in ON check_in.user_id_mesin=check_io.user_id_mesin AND check_in.tanggal=DATE_FORMAT(check_io.waktu,'%Y-%m-%d') 
            LEFT JOIN(select user_id_mesin,DATE_FORMAT(waktu,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(waktu),'%H:%i:%s') as check_out from check_io where type='Check Out' GROUP BY DATE_FORMAT(waktu,'%Y-%m-%d')) as check_out ON check_out.user_id_mesin=check_io.user_id_mesin AND check_out.tanggal=DATE_FORMAT(check_io.waktu,'%Y-%m-%d')            
        GROUP BY
            DATE_FORMAT(waktu, '%Y-%m-%d')`;
        return json(req)
    } catch (error) {
        return {error}
    }
}