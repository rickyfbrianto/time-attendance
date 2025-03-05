import { encryptData, decryptData } from '@lib/utils'
import {error, json} from '@sveltejs/kit'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';

export async function POST({ cookies, request, locals}){
    try {
        let {payroll, password} = await request.json()

        const prisma = new PrismaClient()
        const data = await prisma.employee.findUnique({
            select:{payroll:true, password:true},
            where:{ payroll },
        })

        if(data){
            if(password === decryptData(data.password, import.meta.env.VITE_KEY)){
                const token = jwt.sign({payroll}, import.meta.env.VITE_TOKEN, { expiresIn: '1h' })
                cookies.set("token", token, {
                    path:"/",
                    httpOnly:true
                })
                return json({"message":"Login berhasil", token})
            }else{
                throw new Error('Login gagal, password salah')
            }
        }else{
            throw new Error('Login gagal, payroll tidak ditemukan')
        }
    } catch (err:any) {
        error(500, {"message": err.message})
    }
}