import { error, json } from "@sveltejs/kit";
import { pecahArray, prismaErrorHandler } from "@lib/utils";
import { v4 as uuid4 } from "uuid";
import { prisma } from '@lib/utils.js'

export async function GET({url }){
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
                user_hrd: true
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
    })

    return json(status)
}

export async function POST({ request, locals }) {
	try {
        const data = await request.json();
        const {userProfile, user} = locals
        const status = await prisma.$transaction(async (tx) => {
            const getProfile = await tx.profile.findFirst({
                where:{profile_id : data.profile_id}
            })
            
            if(!getProfile){
                if(!pecahArray(userProfile.access_profile, "C")) throw new Error("Cant insert Profile, because you have no authorization")
                await prisma.profile.create({
                    data: { ...data, profile_id: uuid4() },
                })
                return { message: "Profile successfully saved" }
            }else{
                if(!pecahArray(userProfile.access_profile, "U")) throw new Error("Cant update Profile, because you have no authorization")
                await prisma.profile.update({
                    data:{ ...data },
                    where:{ profile_id : data.profile_id}
                })
                return { message: "Profile successfully updated" }
            }
        })

        return json(status)
	} catch (err) {
		error(500, prismaErrorHandler(err))
	}
}