import { checkFieldKosong, prismaErrorHandler } from '@lib/utils';
import { error, json } from '@sveltejs/kit'
import { PrismaClient } from '@prisma/client';
import { v4 as uuid4 } from 'uuid';

const prisma = new PrismaClient()

export async function GET({request}){
    try {
        const data = await prisma.setting.findFirst()
        return json(data)
    } catch (err) {
        console.log("err catch",err);
        error(500, { message: prismaErrorHandler(err) });
    }
}

export async function POST({request}){
    try {
        const data = await request.json()

        const { isError, errorCount } = checkFieldKosong(data);
        if (isError) {
            throw new Error(`${errorCount} input masih kosong`)
        }

        const status = await prisma.$transaction(async tx => {
            const getSetting = await tx.setting.findFirst()

            if(!getSetting){
                await prisma.setting.create({
                    data: { ...data, setting_id: uuid4() },
                })
            }else{
                delete data.setting_id
                
                await prisma.setting.update({
                    data:{...data},
                    where:{setting_id: getSetting.setting_id}
                })
            }

            return {message: getSetting ? "Data successfully updated":"Data successfully saved"}
        },{
            maxWait: 5000,
            timeout: 10000,
        })

        return json(status);
    } catch (err:any) {
        console.log("err catch",err);
        error(500, err.message)
    }
}