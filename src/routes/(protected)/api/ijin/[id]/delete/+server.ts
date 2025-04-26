import { error, json } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'

export async function DELETE({params}){
    try {
        const {id} = params
        await prisma.ijin.delete({
            where:{
                ijin_id:id,
                status: "Waiting",
            }
        })

        return json({message:"Data successfully deleted"})
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}