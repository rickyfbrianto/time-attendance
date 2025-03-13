import {json, error } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET({fetch}){
    try {
        // const data = await prisma.employee.findUnique()
        return json('a')
    } catch (error) {
        
    }
}

// export async function PUT ({request, cookies, url, locals}){
export async function PUT (event){
    try {        
        const data = await event.request.json()
        return json({"message":data})
    } catch (err:any) {
        error(503, {message: err.message}), 1000
    }
}