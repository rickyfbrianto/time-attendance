import { error, json, type RequestHandler } from "@sveltejs/kit";
import { encryptData, pecahArray, prismaErrorHandler } from "@lib/utils";
import { extname } from "node:path";
import { writeFileSync } from 'fs'
import path from 'path'
import { prisma } from '@lib/utils.js'

export const GET: RequestHandler = async ({ url }) => {
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "payroll"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""

    const status = await prisma.$transaction(async (tx) => {
        const items = await tx.$queryRawUnsafe(`
            SELECT e.payroll, e.name, e.position, d.name as dept, p.name as profile_name, e.location, e.email, e.status FROM employee e
            LEFT JOIN dept d ON e.department = d.dept_code
            LEFT JOIN profile p ON p.profile_id = e.profile_id
            WHERE e.payroll like ? OR e.name like ? OR e.position like ? OR d.name like ? OR e.location like ? OR e.email like ? 
            ORDER by ${sort} ${order}
            LIMIT ${limit} OFFSET ${offset}`,
            `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)

        const [{ count }] = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM employee e
            LEFT JOIN dept d ON e.department = d.dept_code 
            WHERE e.payroll like ? OR e.name like ? OR e.position like ? OR d.name like ? OR e.location like ? OR e.email like ?`,
            `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`) as { count: number }[]

        return { items, totalItems: Number(count) }
    })

    return json(status)
}

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const data = await request.formData()
        const { userProfile } = locals
        const signature = data.get('signature')
        const isSignature = typeof signature == "object" ? true : false
        const fileSignature = isSignature ? data.get('payroll') + extname(signature?.name || "") : ""

        const status = await prisma.$transaction(async (tx) => {
            const getUser = await tx.employee.findFirst({
                where: { payroll: data.get('payroll') }
            })

            if (!getUser) {
                if (!pecahArray(userProfile.access_user, "C")) throw new Error("Cant insert User, because you have no authorization")
                const createUser = await tx.$executeRawUnsafe(`INSERT INTO employee
                    (payroll,profile_id,user_id_machine,name,password,position,department,
                    location,phone,overtime,workhour,start_work,email,approver, substitute, join_date, signature, level, user_type, user_dept, user_divisi, cuti_kunci, cuti_suspen, hostname, status)
                    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    data.get('payroll'),
                    data.get('profile_id'),
                    data.get('user_id_machine'),
                    data.get('name'),
                    encryptData(data.get('password'), import.meta.env.VITE_KEY),
                    data.get('position'),
                    data.get('department'),
                    data.get('location'),
                    data.get('phone'),
                    data.get('overtime') == 'true' ? 1 : 0,
                    Number(data.get('workhour')),
                    data.get('start_work'),
                    data.get('email'),
                    data.get('approver'),
                    data.get('substitute'),
                    data.get('join_date'),
                    isSignature ? fileSignature : "",
                    data.get('level'),
                    data.get('user_type'),
                    data.get('user_dept') == 'true' ? 1 : 0,
                    data.get('user_divisi') == 'true' ? 1 : 0,
                    data.get('cuti_kunci') == 'true' ? 1 : 0,
                    data.get('cuti_suspen') == 'true' ? 1 : 0,
                    data.get('hostname'),
                    data.get('status')
                )

                if (createUser && isSignature) {
                    const uploadsDir = path.join(process.env.ATTACH_SIGNATURE, fileSignature)
                    const filePath = path.resolve(uploadsDir);
                    writeFileSync(filePath, Buffer.from(await signature?.arrayBuffer()));
                }

                return { message: "User successfully saved" }
            } else {
                if (!pecahArray(userProfile.access_user, "U")) throw new Error("Cant update User, because you have no authorization")
                const updateUser = await tx.$executeRawUnsafe(`
                    UPDATE employee SET profile_id=?,user_id_machine=?,name=?,position=?,department=?,location=?,
                    phone=?,overtime=?,workhour=?,start_work=?,email=?,approver=?,substitute=?,join_date=?,signature=?,
                    level=?,user_type=?,user_dept=?,user_divisi=?,cuti_kunci=?,cuti_suspen=?,hostname=?,status=? where payroll=?`,
                    data.get('profile_id'),
                    data.get('user_id_machine'),
                    data.get('name'),
                    data.get('position'),
                    data.get('department'),
                    data.get('location'),
                    data.get('phone'),
                    data.get('overtime') == 'true' ? 1 : 0,
                    Number(data.get('workhour')),
                    data.get('start_work'),
                    data.get('email'),
                    data.get('approver'),
                    data.get('substitute'),
                    data.get('join_date'),
                    isSignature ? fileSignature : signature,
                    data.get('level'),
                    data.get('user_type'),
                    data.get('user_dept') == 'true' ? 1 : 0,
                    data.get('user_divisi') == 'true' ? 1 : 0,
                    data.get('cuti_kunci') == 'true' ? 1 : 0,
                    data.get('cuti_suspen') == 'true' ? 1 : 0,
                    data.get('hostname'),
                    data.get('status'),
                    data.get('payroll')
                )

                if (updateUser && isSignature) {
                    const uploadsDir = path.join(process.env.ATTACH_SIGNATURE, fileSignature)
                    const filePath = path.resolve(uploadsDir);
                    writeFileSync(filePath, Buffer.from(await signature?.arrayBuffer()));
                }

                return { message: "User successfully updated" }
            }
        })

        return json(status)
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}