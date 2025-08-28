import { prisma } from '@lib/utils'
import { error, json } from '@sveltejs/kit'

// 1 periode
// export async function GET({params, url}){
//     try {
//         const {id} = params
//         const payroll = url.searchParams.get('payroll') || ""
//         const start_date = url.searchParams.get('start_date') || ""
//         const end_date = url.searchParams.get('end_date') || ""

//         // const req = await prisma.srl.findUnique({
//         const req = await prisma.srl.findMany({
//             select:{
//                 srl_id:true,
//                 spl_id:true,
//                 payroll:true,
//                 employee:{
//                     select:{
//                         payroll:true,
//                         name:true,
//                         signature:true,
//                         dept:{
//                             select:{
//                                 initial: true
//                             }
//                         }
//                     }
//                 },
//                 real_start:true,
//                 real_end:true,
//                 employee_srl_approval1Toemployee:{
//                     select:{
//                         name:true,
//                         signature: true
//                     }
//                 },
//                 employee_srl_approval2Toemployee:{
//                     select:{
//                         name: true,
//                         signature: true,
//                     }
//                 },
//                 createdAt:true,
//                 srl_detail:{
//                     select:{
//                         description:true,
//                         status:true
//                     }
//                 }
//             },
//             where: {
//                 // srl_id: id,
//                 real_start: {
//                     gte: new Date(start_date),
//                     lte: new Date(end_date)
//                 },
//                 payroll
//             }
//         }) 
//         return json(req)
//     } catch (err:any) {
//         error(500, err.message)
//     }
// }

export async function GET({ params }) {
    try {
        const { id } = params
        const req = await prisma.srl.findUnique({
            select: {
                srl_id: true,
                spl_id: true,
                payroll: true,
                employee_srl_payrollToemployee: {
                    select: {
                        name: true,
                        signature: true,
                        workhour: true,
                        dept: {
                            select: {
                                initial: true
                            }
                        }
                    }
                },
                real_start: true,
                real_end: true,
                employee_srl_approval1Toemployee: {
                    select: {
                        name: true,
                        signature: true
                    }
                },
                employee_srl_approval2Toemployee: {
                    select: {
                        name: true,
                        signature: true,
                    }
                },
                createdAt: true,
                srl_detail: {
                    select: {
                        description: true,
                        status: true
                    }
                }
            },
            where: {
                srl_id: id,
            }
        })

        return json(req)
    } catch (err: any) {
        error(500, err.message)
    }
}