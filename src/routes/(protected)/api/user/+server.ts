import { error, json } from '@sveltejs/kit'
import { prismaErrorHandler } from "@lib/utils";
import { extname } from "node:path";
import { writeFileSync } from 'fs'
import path from 'path'
import { prisma } from '@lib/utils.js'

export async function GET({ locals, url }) {
    const payroll = url.searchParams.get('payroll')

    const data = await prisma.employee.findFirst({
        select: {
            payroll: true,
            name: true,
            position: true,
            email: true,
            profile: true,
            department: true,
            location: true
        },
        where: { payroll: payroll },
    })

    return json({ user: data })
}

export async function POST({ request }) {
    try {
        const data = await request.formData()
        const signature = data.get('signature')
        const isSignature = typeof signature == "object" ? true : false
        const fileSignature = isSignature ? data.get('payroll') + extname(signature?.name || "") : ""

        const status = await prisma.$transaction(async (tx) => {
            const updateUser = await tx.$executeRawUnsafe(`
                UPDATE employee SET phone=?,location=?,signature=? where payroll=?`,
                data.get('phone'),
                data.get('location'),
                isSignature ? fileSignature : signature,
                data.get('payroll'),
            )

            if (updateUser && isSignature) {
                const uploadsDir = path.join(process.env.ATTACH_SIGNATURE, fileSignature)
                const filePath = path.resolve(uploadsDir);
                writeFileSync(filePath, Buffer.from(await signature?.arrayBuffer()));
            }

            return { message: "User successfully updated" }
        })

        return json(status)
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}