import { DateTime } from "luxon";
import { Prisma } from '@prisma/client';
import type { RequestEvent } from "@sveltejs/kit";
import CryptoJS from "crypto-js";
import { PrismaClient } from '@prisma/client';
import { format, setDate, startOfDay, subMonths } from "date-fns";

export const prisma = new PrismaClient({
    transactionOptions:{
        maxWait:5000,
        timeout: 10000
    }
})

interface PesanProps{
    message: string;
    id?: string;
}

interface EncryptedData {
    iv: string;
    encrypted: string;
}

export const formatTanggal = (val:string, incTime:boolean = true) => {
    const temp = DateTime.fromISO(val, { zone: "UTC" })
    return temp.toFormat(`yyyy-MM-dd ${incTime ? "HH:mm:ss":""}`).trim()
    // const temp = format(new Date(val), `yyyy-MM-dd ${incTime ? "HH:mm:ss":""}`)
    // return temp
}

export const ListAccess = [
    {value:"C", name:"Create"},
    {value:"R", name:"Read"},
    {value:"U", name:"Update"},
    {value:"D", name:"Delete"},
]

export const ListLevel = [
    {value:"L0", name:"0"},
    {value:"L1", name:"1"},
    {value:"L2", name:"2"},
    {value:"L3", name:"3"},
    {value:"L4", name:"4"},
    {value:"L5", name:"5"},
    {value:"L6", name:"6"},
    {value:"L7", name:"7"},
    {value:"L8", name:"8"},
    {value:"L9", name:"9"},
    {value:"L10", name:"10"},
]


export function handleLoginRedirect (e : RequestEvent, pesan: string = "You need to login first"){
    const {pathname, search} = e.url
    const redirectTo = pathname + search
    return '/login?redirectTo=' + encodeURIComponent(redirectTo) + "&pesan=" + encodeURIComponent(pesan)
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

export function isEmpty(obj: any): boolean {
    for(let key in obj){
        //if the value is 'object'
        if(obj[key] instanceof Object === true){
            if(isEmpty(obj[key]) === false) return false;
        }
        //if value is string/number
        else{
          //if array or string have length is not 0.
            if(obj[key].length !== 0) return false;
        }
    }
    return true;
}

export function encryptDynamic(value:string, secretKey:string):EncryptedData {    
    const iv = CryptoJS.lib.WordArray.random(128/8); //iv untuk generate acak setiap value meskipun nilainya sama
    
    const encrypted = CryptoJS.AES.encrypt(value, secretKey, {
      iv,      // Tambahkan IV
      mode: CryptoJS.mode.CBC,  // Mode enkripsi
      padding: CryptoJS.pad.Pkcs7  // Padding standar
    });

    return {
        iv: iv.toString(),
        encrypted: encrypted.toString()
    };
}

export function decryptDynamic(encryptedObj:EncryptedData, secretKey:string):string {
    const iv = CryptoJS.enc.Hex.parse(encryptedObj.iv);
    
    const decrypted = CryptoJS.AES.decrypt(encryptedObj.encrypted , secretKey, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
}

export function encryptData(value:string, secretKey:string):string {       
    const encrypted = CryptoJS.AES.encrypt(value, secretKey);

    return encrypted.toString()
}

export function decryptData(value:string, secretKey:string):string {    
    const decrypted = CryptoJS.AES.decrypt(value , secretKey);

    return decrypted.toString(CryptoJS.enc.Utf8);
}

export function prismaErrorHandler(error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                return 'Data sudah ada (duplikat)'
            case 'P2025':
                return 'Data tidak ditemukan'
            case 'P2003':
                return 'Foreign key tidak valid'
            default:
                return  'Kesalahan database'
        }
    }
    return 'Terjadi kesalahan server'
}

export function pecahArray(value : string, check:string){
    let temp = value.split('')
    return temp.includes(check)
}

export function getPeriode ({start_periode, end_periode, date}:{start_periode:number, end_periode:number, date:Date}){
    const newStart = (start_periode < end_periode) ? startOfDay(setDate(date, start_periode)) : startOfDay(setDate(subMonths(date, 1), start_periode))
    const newEnd = (start_periode < end_periode) ? startOfDay(setDate(date, end_periode)) : startOfDay(setDate(date, end_periode))

    return {start_periode: format(newStart, "yyyy-MM-dd"), end_periode: format(newEnd, "yyyy-MM-dd")}
}

export const safeDate = (val: string) =>{
    const temp = (val == 'null' || val == '') ? null : val
    return temp
}