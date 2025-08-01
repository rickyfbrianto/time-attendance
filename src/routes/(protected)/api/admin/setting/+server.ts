import { pecahArray, prismaErrorHandler } from '@lib/utils';
import { error, json } from '@sveltejs/kit'
import { prisma } from '@lib/utils.js'

export async function GET() {
    try {
        const data = await prisma.setting.findFirst()
        return json(data)
    } catch (err) {
        console.log("err catch", err);
        error(500, { message: prismaErrorHandler(err) });
    }
}

export async function POST({ request, locals }) {
    try {
        const data = await request.json()
        const { userProfile } = locals

        const status = await prisma.$transaction(async tx => {
            const getSetting = await tx.setting.findFirst()

            if (!getSetting) {
                if (!pecahArray(userProfile.access_setting, "C")) throw new Error("Cant insert Setting, because you have no authorization")
                await prisma.setting.create({
                    data: { ...data },
                })

                return { message: "Setting successfully saved" }
            } else {
                if (!pecahArray(userProfile.access_setting, "U")) throw new Error("Cant update Setting, because you have no authorization")
                await prisma.setting.update({
                    data: { ...data },
                    where: { setting_id: getSetting.setting_id }
                })

                return { message: "Setting successfully updated" }
            }
        })

        return json(status);
    } catch (err: any) {
        error(500, prismaErrorHandler(err))
    }
}