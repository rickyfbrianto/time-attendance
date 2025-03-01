import { PrismaClient } from "@prisma/client";

export const load = async () => {
	const prisma = new PrismaClient();
	const req = await prisma.profile.findMany();
	return { data: req };
};

export const actions = {
	// create: async ({ request }:{request: RequestHandler}) => {
	create: async ({ cookies, request }) => {
		const data = await request.formData();
        return {data}
	},
};
