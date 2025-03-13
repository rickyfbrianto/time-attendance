import { prismaErrorHandler } from "@lib/utils";
import { error, json } from "@sveltejs/kit";
import { PrismaClient } from "@prisma/client";
import { v4 as uuid4} from "uuid";
import {writeFile} from 'node:fs/promises'
import { extname } from "node:path";

const prisma = new PrismaClient()

export async function POST({request}) {
    try {
        const data = await request.formData()
        const attendance_id = uuid4()
        
        const status = prisma.$transaction(async tx => {
            // await writeFile(`./lib/assets/${attendance_id + extname(data.get('attachment'))}`, await data.get('attachment').stream())
            await tx.attendance.create({
                data:{
                    attendance_id,
                    user_id_machine: data.get('user_id_machine'),
                    datetime: new Date(data.get('waktu')),
                    type: data.get('type'),
                    description: data.get('description'),
                    attachment: attendance_id + extname(data.get('attachment').name),
                    createdBy: data.get('createdBy'),
                }
            })
            
            await tx.check_io.create({
                data:{
                    check_io_id: uuid4(),
                    user_id_machine: data.get('user_id_machine'),
                    datetime: new Date(data.get('waktu')),
                    type: data.get('type'),
                }
            })
        })
        console.log("status",status)
        return json({data:"ok"})
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