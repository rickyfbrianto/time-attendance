import { Prisma } from '@prisma/client';
import type { RequestEvent } from "@sveltejs/kit";
import CryptoJS from "crypto-js";

interface PesanProps{
    message: string;
    id?: string;
}

interface EncryptedData {
    iv: string;
    encrypted: string;
}

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