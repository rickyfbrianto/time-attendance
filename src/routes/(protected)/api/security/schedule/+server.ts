import { prisma, formatTanggal, formatTanggalISO, pecahArray, prismaErrorHandler } from "@lib/utils";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import { v4 as uuid4 } from "uuid";

export const GET: RequestHandler = async ({ url }) => {
    const payroll = url.searchParams.get('payroll') || ""
    const area = url.searchParams.get('area') || ""
    const year = url.searchParams.get('year') || ""
    const month = url.searchParams.get('month') || ""

    const req = await prisma.$queryRawUnsafe(`
        SELECT s.id, s.date, e.payroll, e.name, s.shift, s.area FROM security as s
        LEFT JOIN employee as e ON e.payroll = s.payroll
        WHERE s.payroll like ? AND s.area like ? AND YEAR(s.date) = ? AND month(s.date) = ?`,
        `%${payroll}%`, `%${area}%`, year, month)
    return json(req)
}

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const data = await request.json()
        const { userProfile } = locals

        const status = await prisma.$transaction(async (tx) => {
            const getSchedule = await tx.security.findFirst({
                where: { id: data.id }
            })

            if (!getSchedule) {
                // if (!pecahArray(userProfile.access_attendance, "C")) throw new Error("Cant insert schedule, because you have no authorization")
                const query = data.date.map(async (date: string) => {
                    const alreadySchedule = await tx.security.findFirst({
                        where: {
                            payroll: data.payroll,
                            date: formatTanggalISO(date)
                        }
                    })
                    if (alreadySchedule) throw new Error(`Schedule sudah ada ${formatTanggal(date, "date", "app")}`)

                    return tx.$executeRawUnsafe(`INSERT INTO security (id, payroll, date, shift, area) 
                        VALUES(?, ?, ?, ?, ?)`,
                        uuid4(),
                        data.payroll,
                        date,
                        data.shift,
                        data.area,
                    )
                })
                const tempHasil = await Promise.all(query)

                if (tempHasil) {
                    return { message: "Schedule berhasil di tambah" }
                }
            } else {
                // if (!pecahArray(userProfile.access_attendance, "U")) throw new Error("Cant update schedule, because you have no authorization")
                const tempHasil = await tx.$executeRawUnsafe(`UPDATE security SET payroll=?, date=?, shift=?, area=? WHERE id = ?`,
                    data.payroll,
                    data.date,
                    data.shift,
                    data.area,
                    data.id
                )

                if (tempHasil) {
                    return { message: "Schedule berhasil di ubah" }
                }
            }
        })

        return json(status)
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}