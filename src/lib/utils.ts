import { DateTime } from "luxon";
import type { RequestEvent } from "@sveltejs/kit";
import CryptoJS from "crypto-js";
import { addDays, addMonths, format, isBefore, isAfter, setDate, startOfDay, subMonths, set, differenceInMinutes } from "date-fns";
import { Prisma } from '@prisma-app/client';
import { PrismaClient } from '@prisma-app/client'
import type { State } from "@vincjo/datatables/server";

export const prisma = new PrismaClient({
    transactionOptions:{
        maxWait:5000,
        timeout: 10000
    }
})

export const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

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
                return `Database failure (${error.message})`
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

export const getColorCalendar = (val: string) =>{
    const type = [
        {type:'Calendar', color:'#B0413E'},
        {type:'Cuti Tahunan', color:'#F7CE5B'},
        {type:'Cuti Resmi', color:'#008DD5'},
        {type:'Ijin Resmi', color:'#008DD5'},
        {type:'Lembur', color:'#1D2D44'},
        {type:'Sakit', color:'#E43F6F'},
        {type:'HKC', color:'#99D17B'},
        {type:'HKM', color:'#99D17B'}
    ]
    const newType = type.find((v) => v.type == val)
    return newType?.color || '#1D2D44'
}

export function getLastIjinDate(startDate: string, daysToAdd: number, workhour: number) {
    let date = new Date(startDate);
    let addedDays = 1;

    while (addedDays < daysToAdd) {        
        date = addDays(date, 1);
        const isLibur = workhour == 7 ? ['Sunday'] : workhour == 8 ? ['Saturday','Sunday'] : []

        if (!isLibur.includes(format(date, 'EEEE'))) {   
            addedDays++;
        }
    }

    return date;
}

export function pecahKataOther(val: string, potong: number = 1){
    const temp = val.split(',').filter((v: string) => v).map((v: string) => v.trim())
    const andOthers = temp.length - potong
    const newSplit = temp.slice(0, potong).join(', ')
    let newTemp = newSplit
    newTemp += andOthers > 0 ? " and " + (andOthers) + ` other${andOthers > 1 ? "s": ""}` : ""
    return newTemp
}

export const isLate = (w1: string, w2: string) =>{
    const temp1 = w1.split(' ').map((v: string) => v)[1]
    const temp2 = w2.split(' ').map((v: string) => v)[1]
    
    const [hours1, , ,] = temp1.split(":").map((v: string) => v)
    const [hours2, minutes2, seconds2] = temp2.split(":").map((v: string) => v)
    
    const new1 = set(new Date(), {
        hours: Number(hours1),
        minutes: 0,
        seconds: 0
    })

    const new2 = set(new Date(), {
        hours: Number(hours2), 
        minutes: Number(minutes2), 
        seconds: Number(seconds2)
    })
    return isBefore(new1, new2)
}

export function getRandomHexColor() {
    const randomColor = Math.floor(Math.random() * 0xffffff);
    return `#${randomColor.toString(16).padStart(6, '0')}`;
}

export const getParams = (state: State) => {
	const { rowsPerPage, sort, filters, search, offset, currentPage } = state;

    let params =""

    if(currentPage){
        params = `_page=${currentPage}`;
    }
	if (rowsPerPage) {
		params += `&_limit=${rowsPerPage}`;
	}
	if (offset) {
		params += `&_offset=${offset}`;
	}
	if (sort) {
		params += `&_sort=${String(sort.field)}&_order=${sort.direction}`;
	}
	if (filters) {
		params += filters.map(({ filterBy, value }) => `&${filterBy}=${value}`).join();
	}
	if (search) {
		params += `&_search=${search}`;
	}
	return params;
};

export const hitungDifference = (val1: string | Date, val2: string | Date) =>{
    const start = new Date(val1)
    const end = new Date(val2)
    const totalMinutes = differenceInMinutes(start, end)

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return {hours, minutes}
}

export const formatDifference = ({hours, minutes}: {hours: number, minutes: number}) => {
    return `${hours > 0 ? hours + " Hour" : ""} ${minutes > 0 ? minutes + " Minute" : ""}`
}