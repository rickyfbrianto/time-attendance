import { error, json } from "@sveltejs/kit";
import { v4 as uuid4 } from "uuid";
import { prisma, prismaErrorHandler } from '@lib/utils.js'
import { format } from "date-fns";

export async function GET({ url }) {
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "sppd_id"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""

    const dept = url.searchParams.get('dept') || ""
    const payroll = url.searchParams.get('payroll') || ""

    const status = await prisma.$transaction(async (tx) => {
        // const items = await tx.$queryRawUnsafe(`
        //     SELECT s.sppd_id, purpose, s.location, start_date, end_date, duration, e.name, d.name as dept_name FROM SPPD as s
        //     LEFT JOIN dept as d ON d.dept_code = s.dept
        //     LEFT JOIN employee as e ON e.payroll = s.createdBy
        //     LEFT JOIN sppd_detail as sd ON s.sppd_id = sd.sppd_id
        //     WHERE (s.dept like ? && sd.payroll like ?) && (s.sppd_id like ? OR purpose like ? OR start_date like ? OR end_date like ? OR e.name like ?)
        //     GROUP BY s.sppd_id
        //     ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
        //     `%${dept}%`, `%${payroll}%`, `%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`, limit, offset)
        const items = await tx.$queryRawUnsafe(`
            SELECT s.sppd_id, purpose, s.location, start_date, end_date, duration, GROUP_CONCAT(e.name SEPARATOR ', ') as name, d.name as dept_name,
            isSKPDFromSPPD(s.sppd_id) as isSKPDFromSPPD
            FROM sppd_detail as sd 
			LEFT JOIN SPPD as s ON s.sppd_id = sd.sppd_id
            LEFT JOIN dept as d ON d.dept_code = s.dept
            LEFT JOIN employee as e ON e.payroll = sd.payroll
            WHERE (s.dept like ? && sd.payroll like ? ) && (s.sppd_id like ? OR purpose like ? OR start_date like ? OR end_date like ? OR e.name like ?)
            GROUP BY s.sppd_id
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            `%${dept}%`, `%${payroll}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, limit, offset)

        const [{ count }] = await tx.$queryRawUnsafe(`
            SELECT COUNT(*) as count FROM (
                SELECT s.sppd_id FROM sppd_detail as sd
                    LEFT JOIN SPPD as s ON s.sppd_id = sd.sppd_id
                    LEFT JOIN dept as d ON d.dept_code = s.dept
                    LEFT JOIN employee as e ON e.payroll = sd.payroll
                    WHERE (s.dept like ? && sd.payroll like ? ) && (s.sppd_id like ? OR purpose like ? OR start_date like ? OR end_date like ? OR e.name like ?)
                    GROUP BY s.sppd_id
            ) as tmp`,
            `%${dept}%`, `%${payroll}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`) as { count: number }[]
        return { items, totalItems: Number(count) }
    })

    return json(status)
}

export async function POST({ request, }) {
    try {
        const data = await request.json();

        const dataSPPDDetail: { payroll: string, description: string }[] = []
        data.sppd_detail.map((val: any) => {
            dataSPPDDetail.push({ payroll: val.payroll, description: val.description })
        })

        const status = await prisma.$transaction(async tx => {
            const getSPPD = await tx.sppd.findUnique({
                where: { sppd_id: data.sppd_id }
            })

            if (!getSPPD) {
                let newID
                const separator = "_"
                const dept = await tx.dept.findUnique({ where: { dept_code: data.dept } })

                const [{ id }] = await tx.$queryRawUnsafe(`
                    SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(sppd_id, '${separator}', 1), '-', 1) AS unsigned)), 0) as id
                    from SPPD where 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(sppd_id, '${separator}', 2), '${separator}', -1) = ? AND
                    SUBSTRING_INDEX(SUBSTRING_INDEX(sppd_id, '${separator}', -1), '-', -1) = year(now())`,
                    dept?.initial) as { id: number }[]
                const lastID = Number(id) + 1
                newID = `${lastID}-SPPD${separator}${dept?.initial}${separator}STM${separator}${format(new Date(), "MM-yyyy")}`

                await tx.$executeRawUnsafe(`
                    INSERT INTO sppd (sppd_id,purpose,location,dept,start_date,end_date,duration,createdBy,createdAt) 
                    VALUES(?,?,?,?,?,?,?,?,now())`,
                    newID, data.purpose, data.location, data.dept, data.date[0], data.date[1], data.duration, data.createdBy)

                await tx.sppd_detail.createMany({
                    data: dataSPPDDetail.map(({ payroll, description }, step) => ({
                        sppd_detail_id: uuid4(),
                        sppd_id: newID,
                        payroll, step, description
                    }))
                })

                return { message: "Data berhasil disimpan" }
            } else {
                await tx.$executeRawUnsafe(`
                    UPDATE sppd SET purpose=?,location=?,dept=?,start_date=?,end_date=?,duration=? WHERE sppd_id=?`,
                    data.purpose, data.location, data.dept, data.date[0], data.date[1], data.duration, data.sppd_id)

                await tx.sppd_detail.deleteMany({
                    where: { sppd_id: data.sppd_id }
                })

                await tx.sppd_detail.createMany({
                    data: dataSPPDDetail.map(({ payroll, description }, step) => ({
                        sppd_detail_id: uuid4(),
                        sppd_id: data.sppd_id,
                        payroll, step, description
                    }))
                })

                return { message: "Data berhasil diperbarui" }
            }
        })

        return json(status);
    } catch (err: any) {
        error(500, prismaErrorHandler(err))
    }
}