import { Prisma } from '@prisma/client';
import type { RequestEvent } from "@sveltejs/kit";
// import bcrypt from 'bcrypt'

export function handleLoginRequest (e : RequestEvent, pesan: string = "You need to login first"){
    const {pathname, search} = e.url
    const redirectTo = pathname + search
    return '/login?redirectTo=' + encodeURIComponent(redirectTo) + "&pesan=" + encodeURIComponent(pesan)
}

interface PesanProps{
    message: string;
    id?: string;
}

export function checkFieldKosong(data:any){
    let isError = false
    let errors : PesanProps[] = []
    let errorCount = 0
    Object.entries(data).forEach(value => {
        if (typeof value[1] == "string" && !value[1].trim()){
            errors.push({"message":"Ada yang kosong", id: value[0]})
            isError = true
            errorCount += 1
        }
    })
    return {isError, errors, errorCount}
}

// export async function hashPassword(password:string){
//     const salt = await bcrypt.genSalt(10)
//     const passwordHash = await bcrypt.hash(password, salt)
//     return passwordHash
// }

// export async function comparePassword(userPassword:string, hashPassword:string){
//     const result = await bcrypt.compare(userPassword, hashPassword)
//     return result
// }

export function prismaErrorHandler(error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                // return { error: 'Data sudah ada (duplikat)', status: 400 };
                return 'Data sudah ada (duplikat)'
            case 'P2025':
                // return { error: 'Data tidak ditemukan', status: 404 };
                return 'Data tidak ditemukan'
            case 'P2003':
                // return { error: 'Foreign key tidak valid', status: 400 };
                return 'Foreign key tidak valid'
            default:
                // return { error: 'Kesalahan database', status: 500 };
                return  'Kesalahan database'
        }
    }
    return 'Terjadi kesalahan server'
}