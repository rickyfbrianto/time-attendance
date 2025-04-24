import { DateTime } from "luxon";
import { Prisma } from '@prisma/client';
import type { RequestEvent } from "@sveltejs/kit";
import CryptoJS from "crypto-js";
import { addMonths, format, isBefore, setDate, startOfDay, subMonths } from "date-fns";
import { PrismaClient } from '@prisma/client';

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

export const cekRules = (user: {}, type: string, akses: string) => {
    let temp = user?.profile[type]?.split('')
    return temp.includes(akses)
}

export const formatTanggal = (val:string, mode: "date"|"time"|"datetime" = "datetime") => {
    if(!val) return ""
    const temp = DateTime.fromISO(val, { zone: "UTC" })
    const newMode = mode == "datetime" ? "yyyy-MM-dd HH:mm:ss" : (mode == "date" ? "yyyy-MM-dd" : (mode == "time" ? "HH:mm:ss" : ""))
    const newFormat = temp.setLocale('id').toFormat(newMode).trim()
    return newFormat
}

export const formatTanggalISO = (val:Date | string) =>{
    return format(new Date(val), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
}

export const ListAccess = [
    {value:"C", name:"Create"},
    {value:"R", name:"Read"},
    {value:"U", name:"Update"},
    {value:"D", name:"Delete"},
]

export function handleLoginRedirect (e : RequestEvent, pesan: string = "You need to login first"){
    const {pathname, search} = e.url
    const redirectTo = pathname + search
    return '/login?redirectTo=' + encodeURIComponent(redirectTo) + "&pesan=" + encodeURIComponent(pesan)
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
                return "Data is already exist (duplicate)"
            case 'P2025':
                return "No data found, please refresh data"
            case 'P2003':
                return "Foreign key not valid"
            default:
                return "Database failure"
            }
        }
    return `There is error cause (${error.message || "Server error"})`
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

export function generatePeriode(start: number, end: number){
    const sekarang = format(startOfDay(new Date()), "yyyy-MM-dd")
    let temp1 = new Date(Number(format(sekarang, "yyyy")), Number(format(sekarang, "MM")) - 1, start)
    let temp2 = new Date(Number(format(sekarang, "yyyy")), Number(format(sekarang, "MM")) - 1, end)
    const periode1 = isBefore(sekarang, temp1) ? format(subMonths(temp1, 1), "yyyy-MM-dd") : format(temp1, "yyyy-MM-dd")
    const periode2 = isBefore(sekarang, temp1) ? format(temp2, "yyyy-MM-dd") : format(addMonths(temp2, 1), "yyyy-MM-dd")
    return {start: periode1, end: periode2}
}