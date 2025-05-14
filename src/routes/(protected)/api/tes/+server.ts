import { error, json } from "@sveltejs/kit";
// import { getUser } from "@lib/prisma/client/sql";
import { prisma } from "@lib/utils";
import { getUser } from "@prisma-app/client/sql/getUser.js";

export async function GET(){
    const req = await prisma.$queryRawTyped(getUser('202207'))
    console.log('dari get',req)
    return json({data: req})
}