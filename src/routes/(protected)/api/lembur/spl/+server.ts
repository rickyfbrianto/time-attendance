import { error, json } from "@sveltejs/kit";
import { formatTanggalISO, pecahArray, prismaErrorHandler } from "@lib/utils";
import { v4 as uuid4 } from "uuid";
import { prisma } from '@lib/utils.js'
import { format, subMonths } from "date-fns";

export async function GET({ url }) {
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "est_start"
    const order = url.searchParams.get('_order') ?? "desc"
    const search = url.searchParams.get('_search') ?? ""

    const payroll = url.searchParams.get('payroll') || ""
    const start_date = url.searchParams.get('start_date') || ""
    const end_date = url.searchParams.get('end_date') || ""

    const status = await prisma.$transaction(async (tx) => {
        const items = await tx.$queryRawUnsafe(`
            SELECT s.spl_id, s.purpose, s.est_start, s.est_end, approval1.name as approval1, s.status1 FROM SPL as s
			LEFT JOIN spl_detail sd ON sd.spl_id = s.spl_id
            LEFT JOIN employee as approval1 ON approval1.payroll = s.approval1
            WHERE (s.spl_id like ? OR s.purpose like ? OR s.est_start like ?) AND sd.payroll like ? AND DATE(s.est_start) BETWEEN ? AND ?
            GROUP BY s.spl_id
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            `%${search.replace(/\//g, '_')}%`, `%${search}%`, `%${search}%`, `%${payroll}%`, start_date, end_date, limit, offset)

        const [{ count }] = await tx.$queryRawUnsafe(`SELECT COUNT(*) as count FROM (
            SELECT s.spl_id FROM SPL as s
                LEFT JOIN spl_detail sd ON sd.spl_id = s.spl_id
                LEFT JOIN employee as approval1 ON approval1.payroll = s.approval1
                WHERE (s.spl_id like ? OR s.purpose like ? OR s.est_start like ?) AND sd.payroll like ? AND DATE(s.est_start) BETWEEN ? AND ?
                GROUP BY s.spl_id
            ) as tmp;`,
            `%${search.replace(/\//g, '_')}%`, `%${search}%`, `%${search}%`, `%${payroll}%`, start_date, end_date) as { count: number }[]

        return { items, totalItems: Number(count) }
    })

    return json(status)
}

export async function POST({ request, locals }) {
    try {
        const data = await request.json();
        const { userProfile } = locals
        const dataSPLDetail: { payroll: string, description: string }[] = []
        data.spl_detail.forEach((val: { payroll: string, description: string }) => {
            if (val.description) {
                const newDesc = val.description.split(',').filter(v => v).map(v => v.trim()).join(', ')
                dataSPLDetail.push({ payroll: val.payroll, description: newDesc.trim() })
            }
        })

        const status = await prisma.$transaction(async tx => {
            const getSPL = await tx.spl.findUnique({
                where: { spl_id: data.spl_id }
            })

            if (!getSPL) {
                if (!pecahArray(userProfile.access_spl, "C")) throw new Error("Cant insert SPL, because you have no authorization")
                let newID
                const separator = "_"
                const dept = await tx.dept.findUnique({ where: { dept_code: data.dept } })

                const payrollList = dataSPLDetail.map(v => `'${v.payroll}'`).join(', ')
                const [{ count }] = await tx.$queryRawUnsafe(`
                    SELECT COUNT(*) as count FROM spl s
                        LEFT JOIN spl_detail sd ON s.spl_id = sd.spl_id
                        WHERE DATE(est_start) = DATE(?) AND sd.payroll IN (${payrollList})`,
                    data.est_start
                ) as { count: number }[]
                if (count >= 1) throw new Error("Cant insert SPL, because data is already exist")

                const [{ id }] = await tx.$queryRawUnsafe(`
                    SELECT 
                    IFNULL(MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(spl_id, '${separator}', 1), '-', 1) AS unsigned)), 0) as id 
                    from SPL WHERE 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(spl_id, '${separator}', 2), '${separator}', -1) = ? AND
                    SUBSTRING_INDEX(SUBSTRING_INDEX(spl_id, '${separator}', -1), '-', 1) = month(now()) AND 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(spl_id, '${separator}', -1), '-', -1) = year(now())`,
                    dept?.initial) as { id: number }[]
                const lastID = Number(id) + 1
                newID = `${lastID}-SPL${separator}${dept?.initial}${separator}STM${separator}${format(new Date(), "MM-yyyy")}`

                await tx.$queryRawUnsafe(`
                    INSERT INTO SPL (spl_id,purpose,dept,est_start,est_end,approval1,createdBy,createdAt) VALUES (?,?,?,?,?,?,?,now())`,
                    newID, data.purpose, data.dept, formatTanggalISO(data.est_start), formatTanggalISO(data.est_end), data.approval1, data.createdBy
                )

                await tx.spl_detail.createMany({
                    data: dataSPLDetail.map(({ payroll, description }, step) => ({
                        spl_detail_id: uuid4(),
                        spl_id: newID,
                        payroll, step, description
                    }))
                })

                return { message: "SPL Berhasil Disimpan" }
            } else {
                if (!pecahArray(userProfile.access_spl, "U")) throw new Error("Cant update SPL, because you have no authorization")
                const updateSPL = await tx.$executeRawUnsafe(`
                    UPDATE SPL SET purpose=?,est_start=?,est_end=?,approval1=? WHERE spl_id=? AND status1 = ? `,
                    data.purpose, data.est_start, data.est_end, data.approval1, data.spl_id, 'Waiting'
                )

                if (!updateSPL) throw new Error("Cant update SPL, because data is changed")

                await tx.spl_detail.deleteMany({
                    where: { spl_id: data.spl_id }
                })

                await tx.spl_detail.createMany({
                    data: dataSPLDetail.map(({ payroll, description }, step) => ({
                        spl_detail_id: uuid4(),
                        spl_id: data.spl_id,
                        payroll, step, description
                    }))
                })

                return { message: "SPL Berhasil Diubah" }
            }
        })

        return json(status);
    } catch (err: any) {
        error(500, prismaErrorHandler(err))
    }
}