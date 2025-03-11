import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export async function load(){
    try {
        const req = await prisma.$queryRaw`SELECT
            tgl.user_id_mesin,
            DATE_FORMAT( waktu, '%Y-%m-%d' ) AS tanggal,
            check_in.check_in,
            check_out.check_out
        FROM
            check_io AS tgl 
            LEFT JOIN (select user_id_mesin,DATE_FORMAT(waktu,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(waktu),'%H:%i:%s') as check_in from check_io where type='Check In' GROUP BY DATE_FORMAT(waktu,'%Y-%m-%d')) as check_in ON check_in.user_id_mesin=tgl.user_id_mesin AND check_in.tanggal=DATE_FORMAT(tgl.waktu,'%Y-%m-%d') 
            LEFT JOIN(select user_id_mesin,DATE_FORMAT(waktu,'%Y-%m-%d') as tanggal, DATE_FORMAT(min(waktu),'%H:%i:%s') as check_out from check_io where type='Check Out' GROUP BY DATE_FORMAT(waktu,'%Y-%m-%d')) as check_out ON check_out.user_id_mesin=tgl.user_id_mesin AND check_out.tanggal=DATE_FORMAT(tgl.waktu,'%Y-%m-%d')            
        GROUP BY
            DATE_FORMAT(
            waktu,
            '%Y-%m-%d')`;
        return {data:req}
    } catch (error) {
        return 
    }
}

export const actions = {
	// create: async ({ request }:{request: RequestHandler}) => {
	create: async ({ request }) => {
		const data = await request.formData();
        return {data}
	},
};
