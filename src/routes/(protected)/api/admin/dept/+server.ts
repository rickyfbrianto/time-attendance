import { error, json, type RequestHandler } from '@sveltejs/kit'
import { pecahArray, prisma, prismaErrorHandler } from '@lib/utils'
import { v4 } from 'uuid'

export const GET: RequestHandler = async ({ url }) => {
    try {
        const page = Number(url.searchParams.get('_page')) || 1
        const limit = Number(url.searchParams.get('_limit')) || 10
        const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
        const sort = url.searchParams.get('_sort') ?? "dept_id"
        const order = url.searchParams.get('_order') ?? "asc"
        const search = url.searchParams.get('_search') ?? ""

        const status = await prisma.$transaction(async (tx) => {
            const items = await tx.$queryRawUnsafe(`
                SELECT * FROM dept 
                WHERE (dept_code like ? OR name like ? OR status like ?)
                ORDER by ${sort} ${order}
                LIMIT ${limit} OFFSET ${offset}`,
                `%${search}%`, `%${search}%`, `%${search}%`)

            const [{ count }] = await tx.$queryRawUnsafe(`SELECT COUNT(*) as count FROM dept 
                WHERE (dept_code like ? OR name like ? OR status like ?)`,
                `%${search}%`, `%${search}%`, `%${search}%`) as { count: number }[]

            return { items, totalItems: Number(count) }
        })

        return json(status)
    } catch (err: any) {
        console.log(err.message)
        error(500, err.messsage)
    }
}

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const data = await request.json()
        const { userProfile } = locals
        const status = await prisma.$transaction(async tx => {
            const getDept = await prisma.dept.findUnique({
                where: { dept_id: data.dept_id }
            })

            if (!getDept) {
                if (!pecahArray(userProfile.access_dept, "C")) throw new Error("Cant insert Department, because you have no authorization")
                await tx.dept.create({
                    data: {
                        ...data,
                        dept_id: v4()
                    }
                })

                return { message: "Data successfully saved" }
            } else {
                if (!pecahArray(userProfile.access_dept, "U")) throw new Error("Cant update Department, because you have no authorization")
                await tx.dept.update({
                    data: {
                        dept_code: data.dept_code,
                        divisi: data.divisi,
                        initial: data.initial,
                        name: data.name,
                        status: data.status
                    }, where: {
                        dept_id: data.dept_id
                    }
                })
                return { message: "Data successfully updated" }
            }
        })

        return json(status)
    } catch (err: any) {
        error(500, prismaErrorHandler(err))
    }
}