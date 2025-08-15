import { prisma, formatTanggal, formatTanggalISO, capitalEachWord, prismaErrorHandler } from "@lib/utils";
import { error, json } from "@sveltejs/kit";

export async function POST({ request, locals }) {
    try {
        const data = await request.json()

        const status = await prisma.$transaction(async (tx) => {
            const getSchedule = await tx.security.findFirst({
                where: { id: data.id }
            })

            if (getSchedule) {
                const alreadySchedule = await tx.security.findFirst({
                    where: {
                        payroll: data.payroll,
                        date: formatTanggalISO(data.date[0]),
                    }
                })
                if (alreadySchedule) throw new Error(`Schedule ${capitalEachWord(data.name)} sudah ada di tanggal ${formatTanggal(formatTanggalISO(data.date), "date")}`)

                const query = data.date.map(async (date: string) => {
                    return tx.$executeRawUnsafe(`UPDATE security SET date = Date(?) WHERE id = ?`,
                        date,
                        data.id
                    )
                })
                const tempHasil = await Promise.all(query)

                if (tempHasil) {
                    return { message: `Schedule sukses di ubah ke ${formatTanggal(data.date[0], "date")}` }
                }
            }
        })

        return json(status)
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}