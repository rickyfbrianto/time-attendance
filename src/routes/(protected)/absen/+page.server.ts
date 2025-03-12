import { PrismaClient } from "@prisma/client";
import {json} from "@sveltejs/kit"

const prisma = new PrismaClient()

export async function load({request, params, fetch}){
    const req = await fetch('/absen')
    const res = await req.json()
    return {data:res}
}

export const actions = {
	// create: async ({ request }:{request: RequestHandler}) => {
	create: async ({ request }) => {
		const data = await request.formData();
        return {data}
	},
};
