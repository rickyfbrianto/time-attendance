import { error, json } from "@sveltejs/kit";
import { checkFieldKosong, prismaErrorHandler } from "@lib/utils";
import { v4 as uuid4 } from "uuid";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET({url}){
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "profile_id"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""
    
    const status = await prisma.$transaction(async (tx) => {
        const items = await tx.profile.findMany({
            skip:offset,
            take:limit,
            select:{
                profile_id:true,
                name:true,
                description:true,
                level:true,
                delegation:true,
            },
            where:{
                OR:[
                    {description:{contains: search}},
                    {name:{contains: search}}
                ]
            },
            orderBy:{[sort]: order}
        })
    
        const totalItems = await tx.profile.count({
            where:{
                OR:[
                    {description:{contains: search}},
                    {name:{contains: search}}
                ]
            },
        })

        return {items, totalItems}
    },{
        maxWait: 5000,
        timeout: 10000,
    })

    return json(status)
}

export async function POST({ request }) {
	try {
        const data = await request.json();
		const { isError, errorCount } = checkFieldKosong(data);
		if (isError) {
            error(500, { message: `${errorCount} input masih kosong` });
		}

		await prisma.profile.create({
				data: { ...data, profile_id: uuid4() },
			})
        return json({ message: "Data successfully saved" });
	} catch (err) {
		console.log("err catch",err);
		error(500, { message: prismaErrorHandler(err) });
	}
}

export async function PUT({request}){
    try {
        const data = await request.json();
		const { isError, errorCount } = checkFieldKosong(data);
		if (isError) {
            error(500, { message: `${errorCount} input masih kosong` });
		}
        const {profile_id} = data
        delete data.profile_id

		await prisma.profile.update({
            data: { ...data },
            where:{profile_id}
        })
        return json({ message: "Data successfully updated" });
	} catch (err) {
		console.log("err catch",err);
		error(500, { message: prismaErrorHandler(err) });
	}
}

export async function DELETE({ params }) {
	const id = await params.id;
	return json({ id });
}
