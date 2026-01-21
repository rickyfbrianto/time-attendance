import type { RequestEvent } from "@sveltejs/kit";
import CryptoJS from "crypto-js";
import { addDays, addMonths, format, isBefore, setDate, startOfDay, subMonths, set, differenceInMinutes, parse, differenceInDays, differenceInHours } from "date-fns";
import { Prisma, PrismaClient } from '@prisma-app/client';
import type { State } from "@vincjo/datatables/server";
import { formatInTimeZone } from 'date-fns-tz';
import { id } from 'date-fns/locale'

export const prisma = new PrismaClient({
    transactionOptions: {
        maxWait: 5000,
        timeout: 60000
    }
})

export const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

let dataTahun: { value: number, title: string }[] = []
let dataBulan: { value: number, title: string }[] = []

for (let a = 2020; a <= new Date().getFullYear() + 1; a++) {
    dataTahun.push({ value: a, title: a.toString() })
}
for (let a = 0; a < 12; a++) {
    // dataBulan.push({ value: Number(a), title: namaBulan[a] })
    dataBulan.push({ value: Number(a), title: namaBulan[a] })
}

interface EncryptedData {
    iv: string;
    encrypted: string;
}

// export const formatTanggal = (val: string, mode: "date" | "time" | "datetime" = "datetime", format: "system" | "app" = "system") => {
//     if (!val) return ""
//     const temp = DateTime.fromISO(val, { zone: "UTC" })
//     const formatDate = format == "system" ? "yyyy-MM-dd" : "dd-MM-yyyy"
//     const newMode = mode == "datetime" ? `${formatDate} HH:mm:ss` : (mode == "date" ? formatDate : (mode == "time" ? "HH:mm:ss" : ""))
//     return temp.setLocale('id').toFormat(newMode).trim()
// }

export const formatTanggal = (val: string | Date, mode: "date" | "time" | "datetime" = "datetime", formatTanggal: "system" | "app" = "system") => {
    if (!val) return ""
    const formatDate = formatTanggal == "system" ? "yyyy-MM-dd" : "d MMMM yyyy"
    const newMode = mode == "datetime" ? `${formatDate} HH:mm:ss` : (mode == "date" ? formatDate : (mode == "time" ? "HH:mm:ss" : ""))
    return formatInTimeZone(val, 'UTC', newMode, { locale: id })
}

export function capitalEachWord(text: string) {
    return text.toString()
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
}

export function formatDateToSQLString(val: string | Date) {
    const date = new Date(val)
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(0).padStart(2, '0');
    const mi = String(0).padStart(2, '0');
    const ss = String(0).padStart(2, '0');

    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export const formatTanggalISO = (val: Date | string) => {
    return format(new Date(val), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
}

export const ListAccess = [
    { value: "C", name: "Create" },
    { value: "R", name: "Read" },
    { value: "U", name: "Update" },
    { value: "D", name: "Delete" },
]

export function handleLoginRedirect(e: RequestEvent, pesan: string = "You need to login first") {
    const { pathname, search } = e.url
    const redirectTo = pathname + search
    return '/login?redirectTo=' + encodeURIComponent(redirectTo) + "&pesan=" + encodeURIComponent(pesan)
}

export async function isUrlActive(url: string) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response;
    } catch (error) {
        return false;
    }
}

export function encryptDynamic(value: string, secretKey: string): EncryptedData {
    const iv = CryptoJS.lib.WordArray.random(128 / 8); //iv untuk generate acak setiap value meskipun nilainya sama

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

export function decryptDynamic(encryptedObj: EncryptedData, secretKey: string): string {
    const iv = CryptoJS.enc.Hex.parse(encryptedObj.iv);

    const decrypted = CryptoJS.AES.decrypt(encryptedObj.encrypted, secretKey, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
}

export function encryptData(value: string, secretKey: string): string {
    const encrypted = CryptoJS.AES.encrypt(value, secretKey);
    return encrypted.toString()
}

export function decryptData(value: string, secretKey: string): string {
    const decrypted = CryptoJS.AES.decrypt(value, secretKey);

    return decrypted.toString(CryptoJS.enc.Utf8);
}

export function prismaErrorHandler(error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                return "Data sudah ada sebelumnya (duplikat)"
            case 'P2025':
                return "Data tidak ada atau data mungkin telah diperbarui"
            case 'P2003':
                return "Foreign key not valid"
            default:
                return `Database failure (${error.message})`
        }
    }
    return `Muncul error (${error.message || "Server error"})`
}

export function pecahArray(value: string, check: string) {
    let temp = value.split('')
    return temp.includes(check)
}

export function getPeriode({ start_periode, end_periode, date }: { start_periode: number, end_periode: number, date: Date }) {
    const newStart = (start_periode < end_periode) ? startOfDay(setDate(date, start_periode)) : startOfDay(setDate(subMonths(date, 1), start_periode))
    const newEnd = (start_periode < end_periode) ? startOfDay(setDate(date, end_periode)) : startOfDay(setDate(date, end_periode))

    return { start_periode: format(newStart, "yyyy-MM-dd"), end_periode: format(newEnd, "yyyy-MM-dd") }
}

export function generatePeriode(date: string, start: number, end: number) {
    const sekarang = format(startOfDay(new Date(date)), "yyyy-MM-dd")
    let temp1 = new Date(Number(format(sekarang, "yyyy")), Number(format(sekarang, "MM")) - 1, start)
    let temp2 = new Date(Number(format(sekarang, "yyyy")), Number(format(sekarang, "MM")) - 1, end)
    const periode1 = isBefore(sekarang, temp1) ? format(subMonths(temp1, 1), "yyyy-MM-dd") : format(temp1, "yyyy-MM-dd")
    const periode2 = isBefore(sekarang, temp1) ? format(temp2, "yyyy-MM-dd") : format(addMonths(temp2, 1), "yyyy-MM-dd")
    return { start: periode1, end: periode2 }
}

export const getColorCalendar = (val: string) => {
    const type = [
        { type: 'Calendar', color: '#B0413E' },
        { type: 'Cuti Tahunan', color: '#F7CE5B' },
        { type: 'Cuti Resmi', color: '#008DD5' },
        { type: 'Ijin Resmi', color: '#008DD5' },
        { type: 'Lembur', color: '#1D2D44' },
        { type: 'Sakit', color: '#E43F6F' },
        { type: 'HKC', color: '#99D17B' },
        { type: 'HKM', color: '#99D17B' },
        { type: 'Off', color: '#D7263D' },
        { type: 'Pagi', color: '#588B8B' },
        { type: 'Malam', color: '#363537' },
    ]

    const newType = type.find((v) => v.type == val)
    return newType?.color || '#1D2D44'
}

export function getLastIjinDate(startDate: string, daysToAdd: number, workhour: number) {
    let date = new Date(startDate);
    let addedDays = 1;

    while (addedDays < daysToAdd) {
        date = addDays(date, 1);
        const isLibur = workhour == 7 ? ['Sunday'] : workhour == 8 ? ['Saturday', 'Sunday'] : []

        if (!isLibur.includes(format(date, 'EEEE'))) {
            addedDays++;
        }
    }

    return date;
}

export function pecahKataOther(val: string, potong: number = 1) {
    const temp = val.split(',').filter((v: string) => v).map((v: string) => v.trim())
    const andOthers = temp.length - potong
    const newSplit = temp.slice(0, potong).join(', ')
    let newTemp = newSplit
    newTemp += andOthers > 0 ? " dan " + (andOthers) + ` lainnya` : ""
    return newTemp
}

export function getRandomHexColor() {
    const randomColor = Math.floor(Math.random() * 0xffffff);
    return `#${randomColor.toString(16).padStart(6, '0')}`;
}

export const getParams = (state: State) => {
    const { rowsPerPage, sort, filters, search, offset, currentPage } = state;

    let params = ""

    if (currentPage) {
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

export const hitungJamMenit = (menit: number) => {
    const hour = Math.floor(menit / 60);
    const minute = menit % 60;
    return { hour, minute }
}

export const selisihWaktu = (val1: string | Date, val2: string | Date) => {
    const start = new Date(val1)
    const end = new Date(val2)
    return hitungJamMenit(differenceInMinutes(start, end))
}

export const selisihWaktuHari = (start: Date | string, end: Date | string) => {
    const day = differenceInDays(end, start);
    const hour = differenceInHours(end, start) - day * 24;
    const minute = differenceInMinutes(end, start) - (day * 24 * 60) - (hour * 60);
    return { day, hour, minute };
}

export const formatWaktuHari = ({ day, hour, minute }: { day: number, hour: number, minute: number }) => {
    const temp = `${day > 0 ? day + " Hari" : ""} ${hour > 0 ? hour + " Jam" : ""} ${minute > 0 ? minute + " Menit" : ""}`
    return temp
}

export const formatLate = ({ hour, minute }: { hour: number, minute: number }) => {
    const tempHour = hour > 0 ? hour + " Jam" : ""
    const tempMinute = minute > 0 ? minute + " Menit" : ""
    return tempHour + " " + tempMinute
}

export const hitungDifference = (check_in, check_out, check_in2, check_out2) => {
    const { hour: hoursA, minute: minutesA } = selisihWaktu(check_out, check_in);
    const { hour: hoursB, minute: minutesB } = selisihWaktu(check_out2, check_in2);

    let totalMinutes = 0;
    if (new Date(check_in) < new Date(check_out)) {
        totalMinutes = (hoursA * 60 + minutesA) + (hoursB * 60 + minutesB);
    } else {
        totalMinutes = (hoursB * 60 + minutesB);
    }

    return hitungJamMenit(totalMinutes)
}

export const formatDifference = ({ hour, minute, overtime, round_up = false }: { hour: number, minute: number, overtime: number, round_up: boolean }) => {
    hour += round_up ? (minute >= overtime ? 1 : 0) : 0
    minute = round_up ? (minute >= overtime ? 0 : minute) : minute
    const temp = `${hour > 0 ? hour + " Hour" : ""} ${minute > 0 ? minute + " Minute" : ""}`
    return temp
}

export { dataTahun, dataBulan }

// Untuk >= 15 ? 30 jika >= 45 60
// export const formatDifference = ({ hour, minute, overtime, round_up = false }: { hour: number, minute: number, overtime: number, round_up: boolean }) => {
//     const roundUpTo = 30
//     hour += round_up ? (minute > roundUpTo && (minute % roundUpTo) >= overtime ? 1 : 0) : 0
//     minute = round_up
//         ? minute < roundUpTo && minute >= overtime
//             ? 30
//             : minute > roundUpTo && (minute % roundUpTo) >= overtime ? 0 : minute
//         : minute

//     return `${hour > 0 ? hour + " Hour" : ""} ${minute > 0 ? minute + " Minute" : ""}`
// }