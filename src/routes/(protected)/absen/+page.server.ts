import { PrismaClient } from "@prisma/client";

export const actions = {
	// create: async ({ request }:{request: RequestHandler}) => {
	create: async ({ cookies, request }) => {
		const data = await request.formData();
        return {data}
	},
};
