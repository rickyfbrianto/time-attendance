import { decryptData } from '@lib/utils'
import {error, json} from '@sveltejs/kit'
import { prisma } from '@lib/utils.js'
import jwt from 'jsonwebtoken';

export async function POST({ cookies, request}){
    try {
        let {payroll, password, remember_me} = await request.json()
        const data = await prisma.employee.findUnique({
            select:{payroll:true, password:true},
            where:{ 
                payroll,
                status: "Aktif"
            },
        })

        if(data){
            if(password === decryptData(data.password, import.meta.env.VITE_KEY)){
                // const token = jwt.sign({payroll}, import.meta.env.VITE_JWT_SECRET, { expiresIn: remember_me ? "1w" : '6h' })
                const token = jwt.sign({payroll}, process.env.JWT_SECRET!, { expiresIn: remember_me ? "1w" : '10h' })
                cookies.set("token", token, {
                    path: `/`,
                    secure:false, 
                    // httpOnly:true
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