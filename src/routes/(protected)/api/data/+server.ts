import { error, json } from "@sveltejs/kit";
import { prisma } from '@lib/utils'

export async function GET({url}){
    try {
        const type = url.searchParams.get('type')
        const val = url.searchParams.get('val')

        
        if(type == "user"){
            const req = await prisma.employee.findMany({
                omit:{password:true}
            })
            return json(req)
        } else if(type == "setting"){
            const req = await prisma.setting.findFirst()
            return json(req)
        } else if(type == "profile"){
            const req = await prisma.profile.findMany()
            return json(req)
        }else if(type=='dept'){
            const req = await prisma.$queryRawUnsafe(`
                SELECT * FROM DEPT WHERE dept_code LIKE ?`, `%${val || ""}%`)
            return json(req)
        }else if(type=='spl_by_status'){
            const req = await prisma.$queryRawUnsafe(`
                SELECT * FROM spl WHERE status LIKE ?`, `%${val || ""}%`)
            return json(req)
        }else if(type=='spl_detail_by_spl_id'){
            const req = await prisma.$queryRawUnsafe(`
                SELECT spl_detail.payroll, e.name FROM spl_detail
                LEFT JOIN employee e ON e.payroll = spl_detail.payroll
                 WHERE spl_id LIKE ?`, `%${val || ""}%`)
            return json(req)
        }else{
            throw new Error("Parameter Invalid")
        }
    } catch (err:any) {
        error(500, err.message)
    }
}