<script lang="ts">    
    import {fade} from 'svelte/transition'
    import { Tabs, TabItem, Table, Badge, TableBody, TableBodyCell, TableBodyRow, TableHead, Label, Button, Modal, Alert } from 'flowbite-svelte';
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
    import { Ban, Search, RefreshCw, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Pencil, Trash, Plus, Save, Minus, Printer} from '@lucide/svelte'
    import MyButton from '@lib/components/MyButton.svelte';
	import MyLoading from '@lib/components/MyLoading.svelte';
	import MyInput from '@lib/components/MyInput.svelte';
	import { formatTanggal, pecahArray, pecahKataOther } from '@lib/utils';
    import { differenceInDays, format } from "date-fns";
	import axios from 'axios';
	import Svelecte from 'svelecte';
	import { getParams } from '@lib/data/api.js';
    import bgtravel from '@lib/assets/bg-travel.jpg'
    import { jsPDF } from "jspdf";
    import stm from '@lib/assets/stm.png'
    import "@lib/assets/font/Comic-normal.js"
	import { z } from 'zod';
	import { fromZodError } from 'zod-validation-error';

    let {data} = $props()
    
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)
    
    const rowsPerPage = 10
    
    let tableSPPD = $state(new TableHandler([], {rowsPerPage}))
    let tableSPPDSearch = tableSPPD.createSearch()
        
    const formSPPDAnswer = {
        answer:{
            sppd_id: "id",
            purpose:"",
            get dept() { return userProfile.user_hrd ? "" : user?.department},
            location:"",
            date: [],
            duration: 0,
            get createdBy() { return user?.payroll},
            sppd_detail:[{payroll:"", description:""}]
        },
        get dept() { return userProfile.user_hrd ? "" : user?.department},
        get payroll() { return userProfile.user_hrd || userProfile.level >= 5 ? "" : user?.payroll},
        success:"",
        error:"",
        modalDelete:false,
        loading:false,
        add:false,
        edit:false,
    }
    
    let formSPPD = $state({...formSPPDAnswer})
    
    const formSPPDSubmit = async () =>{
        try {
            formSPPD.loading = true
            const valid = z.object({
                sppd_id: z.string().trim().min(1),
                purpose: z.string().trim().min(1),
                location: z.string().trim().min(1),
                date: z.tuple([z.string(), z.string()], {message: "Date is not valid"}),
                sppd_detail: z.array(z.object({
                    payroll: z.string().trim().min(1),
                    description: z.string().trim().min(10)
                }))
            })
            const isValid = valid.safeParse(formSPPD.answer)
            if(isValid.success){            
                const req = await axios.post('/api/sppd', formSPPD.answer)
                const res = await req.data
                formSPPD.error = ""
                formSPPD.success = res.message
                formSPPDBatal()
                tableSPPD.invalidate()
            }else{
                const err = fromZodError(isValid.error)
                formSPPD.success = ""
                formSPPD.error = err.message
            }
        } catch (error: any) {
            formSPPD.error = error.response.data.message
            formSPPD.success = ""
        } finally {
            formSPPD.loading = false
        }
    }

    const formSPPDBatal = () => formSPPD = {...formSPPDAnswer}
    
    const formSPPDEdit = async (id:string) =>{
        try {
            formSPPD.loading = true            
            const req = await axios.get(`/api/sppd/${id}`)
            const res = await req.data
            if(res){
                formSPPD.answer = {...res}
                formSPPD.answer.date = [res.start_date, res.end_date]
            }
            
            formSPPD.edit = true
            formSPPD.add = false
            formSPPD.loading = false
        } catch (error) {
            formSPPD.loading = false
        }
    }

    const formSPPDDelete = async (id:string) =>{
        try {
            formSPPD.loading = true
            const req = await axios.delete(`/api/sppd/${id}`)
            const res = await req.data
            tableSPPD.invalidate()
        } catch (error) {
        } finally {
            formSPPD.loading = false
        }
    }

    const handleCetakSPPD= async (id:string) =>{
        const req = await axios.get(`/api/sppd/${id}`)
        const res = await req.data

        const doc = new jsPDF({
            orientation:"p",
            unit:"mm",
            format:"a4"
        })

        res.sppd_detail.forEach((val: any, i: number) => {
            if(i > 0) doc.addPage("a4", "p")

            const colData = [12, 58, 62]
            const rowData = 0
            let rowInc = 0
            let row1 = 4
            let row2 = 6
            let row3 = 8
            let row4 = 10

            rowInc += row4
            doc.rect(150, rowData + rowInc, 50, rowData + rowInc + 5)
            doc.setFont('times', 'normal', '')
            doc.setFontSize(10)
            rowInc += row1
            doc.text("Form No  : 11-21", 152, rowData + rowInc)
            rowInc += row1
            doc.text("Rev No   : 0", 152, rowData + rowInc)
            rowInc += row1
            doc.text("Rev Date : Jan 2020", 152, rowData + rowInc)
            
            rowInc += row3
            doc.rect(10, 28, 190, 236)
            doc.addImage(stm, 12, rowData + rowInc, 21, 21)
            doc.line(36, 28, 36, 54)
            rowInc += row1
            doc.setFont('times', 'normal', 'bold')
            doc.setFontSize(12)
            doc.text("HUMAN RESOURCES", 94, rowData + rowInc)
            doc.setFontSize(14)
            rowInc += row2
            doc.text("SURAT PERINTAH PERJALANAN DINAS", 67, rowData + rowInc)
            rowInc += 2
            doc.line(36, rowData + rowInc, 200, rowData + rowInc)
            rowInc += row3
            doc.setFont('times', 'italic')
            doc.setFontSize(12)
            doc.text("INSTRUCTION FOR BUSSINESS TRAVEL", 77, rowData + rowInc)
            rowInc += row1
            doc.line(10, rowData + rowInc, 200, rowData + rowInc)
            
            doc.setFont('times', 'normal')
            doc.setFontSize(12)
            rowInc += row4
            doc.text("Nomor / No", colData[0], rowData + rowInc)
            doc.text(`: ${res.sppd_id.replace(/\_/g, '/')}`, colData[1], rowData + rowInc)
            rowInc += row4
            doc.text("To", colData[0], rowData + rowInc)
            doc.text(":", colData[0] + 25, rowData + rowInc)
            doc.setFont('times', 'normal', 'bold')
            doc.text("Human Resources", colData[0] + 28, rowData + rowInc)
            rowInc += row2
            doc.setFont('times', 'normal')
            doc.text("From", colData[0], rowData + rowInc)
            doc.text(":", colData[0] + 25, rowData + rowInc)
            
            rowInc += row4
            doc.text("Karyawan tersebut di bawah ini diperintahkan untuk menjalankan tugas dinas dengan spesifikasi", colData[0], rowData + rowInc)
            rowInc += row2
            doc.text("sebagai berikut : /", colData[0], rowData + rowInc)

            rowInc += row4
            doc.text("Nama", colData[0], rowData + rowInc)
            doc.text(`: ${val.employee.name}`, colData[1], rowData + rowInc)
            rowInc += row1
            doc.setFont('times', 'italic')
            doc.text("Name", colData[0], rowData + rowInc)
            
            rowInc += row3
            doc.setFont('times', 'normal')
            doc.text("No. Payroll", colData[0], rowData + rowInc)
            doc.text(`: ${val.payroll}`, colData[1], rowData + rowInc)
            rowInc += row1
            doc.setFont('times', 'italic')
            doc.text("Payroll No.", colData[0], rowData + rowInc)

            rowInc += row3
            doc.setFont('times', 'normal')
            doc.text("Jabatan", colData[0], rowData + rowInc)
            doc.text(`: -`, colData[1], rowData + rowInc)
            rowInc += row1
            doc.setFont('times', 'italic')
            doc.text("Payroll No.", colData[0], rowData + rowInc)

            rowInc += row3
            doc.setFont('times', 'normal')
            doc.text("Department", colData[0], rowData + rowInc)
            doc.text(`: ${val.employee.dept.name}`, colData[1], rowData + rowInc)
            rowInc += row1
            doc.setFont('times', 'italic')
            doc.text("Department", colData[0], rowData + rowInc)

            rowInc += row3
            doc.setFont('times', 'normal')
            doc.text("Tujuan", colData[0], rowData + rowInc)
            doc.text(`: ${res.location}`, colData[1], rowData + rowInc)
            rowInc += row1
            doc.setFont('times', 'italic')
            doc.text("Destination", colData[0], rowData + rowInc)

            rowInc += row3
            doc.setFont('times', 'normal')
            doc.text("Tanggal", colData[0], rowData + rowInc)
            doc.text(`: ${format(res.start_date, "dd MMMM yyyy")}`, colData[1], rowData + rowInc)
            doc.text(`s/d     ${format(res.end_date, "dd MMMM yyyy")}`, colData[1] + 60, rowData + rowInc)
            rowInc += row1
            doc.setFont('times', 'italic')
            doc.text("Date", colData[0], rowData + rowInc)

            rowInc += row3
            doc.setFont('times', 'normal')
            doc.text("Deskripsi Tugas", colData[0], rowData + rowInc)
            doc.text(`: ${val.description}`, colData[1], rowData + rowInc)
            rowInc += row1
            doc.setFont('times', 'italic')
            doc.text("Description of Assignment", colData[0], rowData + rowInc)

            rowInc += row4 + 4
            doc.setFont('times', 'normal')
            doc.text("Terima kasih atas perhatiannya.", colData[0], rowData + rowInc)
            rowInc += row1
            doc.setFont('times', 'italic')
            doc.text("Thank you for your consideration on this matter.", colData[0], rowData + rowInc)

            rowInc += row4
            doc.setFont('times', 'normal')
            doc.text(`Jakarta, ${format(new Date(), "dd MMMM yyyy")}`, colData[0], rowData + rowInc)
            
            rowInc += row4 * 3
            doc.setFont('times', 'underline')
            doc.text(`Allan Cheong`, colData[0], rowData + rowInc)
            rowInc += row1
            doc.setFont('times', 'normal')
            doc.text(`Mill manager`, colData[0], rowData + rowInc)

            doc.setFontSize(10)
            rowInc += row4 + 4
            doc.text(`* File`, colData[0], rowData + rowInc)
            rowInc += row1
            doc.text(`* Disetujui 1 tingkat di atas yang bersangkutan (Minimal Kasi/Supervisor)`, colData[0], rowData + rowInc)
            doc.setFont('calibri', 'normal')
        })
        
        const blob = doc.output('blob')
        const url = URL.createObjectURL(blob);

        window.open(url); // buka tab baru
        
        // doc.save(`${res.sppd_id}.pdf`);
    }
    
    // SKPD
    let tableSKPD = $state(new TableHandler([], {rowsPerPage}))
    let tableSKPDSearch = tableSKPD.createSearch()
    
    const formSKPDAnswer = {
        answer:{
            skpd_id: "id",
            sppd_id:"",
            skpd_detail: [{payroll:"", description: ""}],
            date: ["", ""],
            status: "",
            get createdBy() { return user?.payroll},
        },
        sppd_id: "",
        get payroll() {return userProfile.user_hrd ? "" : user?.payroll},
        success:"",
        error:"",
        cetakPDFID:"",
        cetakPDF:false,
        modalDelete:false,
        loading:false,
        add:false,
        edit:false,
    }
    
    let formSKPD = $state({...formSKPDAnswer})

    let formSKPDTemp: any[] = $state([])
    
    const formSKPDSubmit = async () =>{
        try {
            formSKPD.loading = true
            const valid = z.object({
                sppd_id: z.string().trim().min(1),
                date: z.tuple([z.string().trim().min(1), z.string().trim().min(1)]),
                status: z.string().trim().min(1),
            })
            const isValid = valid.safeParse(formSKPD.answer)
            if(isValid.success){
                const req = await axios.post('/api/skpd', formSKPD.answer)
                const res = await req.data
                formSKPDBatal()
                tableSKPD.invalidate()
                formSKPD.success = res.message
            } else {
                const err = fromZodError(isValid.error)
                formSKPD.success = ""
                formSKPD.error = err.message
            }
        } catch (error: any) {
            formSKPD.error = error.response.data.message
            formSKPD.success = ""
        } finally {
            formSKPD.loading = false
        }
    }

    const formSKPDBatal = () => formSKPD = {...formSKPDAnswer}
    
    const formSKPDEdit = async (id:string) =>{
        try {
            formSKPD.loading = true
            const req = await axios.get(`/api/skpd/${id}`)
            const res = await req.data
            if(res){
                formSKPD.answer = {...res}
                setTimeout(()=>{
                    formSKPD.answer.date = [formatTanggal(res.real_start, "date"), formatTanggal(res.real_end, "date")]
                }, 100)
            }
            
            formSKPD.edit = true
            formSKPD.add = false
            formSKPD.loading = false
        } catch (error) {
            formSKPD.loading = false
        }
    }

    const formSKPDDelete = async (id:string) =>{
        try {
            formSKPD.loading = true
            const req = await axios.delete(`/api/skpd/${id}`)
            const res = await req.data
            tableSKPD.invalidate()
        } catch (error) {
        } finally {
            formSKPD.loading = false
        }
    }

    const handleCetakSKPD= async (id:string) =>{
        const req = await axios.get(`/api/skpd/${id}`)
        const res = await req.data

        const doc = new jsPDF({
            orientation:"p",
            unit:"mm",
            format:"a4"
        })

        const rowData = 10
        const colData = [16, 45, 50]
        let rowInc = 0
        let row1 = 6
        let row2 = 8
        let row3 = 10

        doc.setTextColor("#174ca3")
        doc.addImage(stm, 18, 8, 15, 15)
        doc.setFontSize(22)
        rowInc += row1
        doc.text("PT. SAGATRADE MURNI", 60, rowData + rowInc)
        doc.setFontSize(13)
        rowInc += row1
        doc.text("MANUFACTURES OF PRIMARY CEMENTING EQUIPMENT", 43, rowData + rowInc)
        doc.rect(10, 28, 190, 236)
        doc.setFont("Comic", "normal")
        doc.setFontSize(16)
        doc.setTextColor("#000000")
        rowInc += 18
        doc.text("SURAT KETERANGAN PERJALANAN DINAS", 52, rowData + rowInc)
        rowInc += row2
        doc.line(10, rowData + rowInc, 200, rowData + rowInc)
        
        rowInc += row3
        doc.setFont("times", "normal")
        doc.setFontSize(12)
        doc.text("Nomor", colData[0], rowData + rowInc)
        doc.text(`:    ${res.skpd_id.replace(/\_/g,'/')}`, 35, rowData + rowInc)
        doc.text(`Jakarta, ${format(res.real_start, "d MMMM yyyy")}`, 142, rowData + rowInc)
        
        rowInc += row3
        doc.text("Dengan Hormat,", colData[0], rowData + rowInc)
        rowInc += row1
        doc.text("Dalam rangka tugas perusahaan, maka dengan ini kami berikan Surat Keterangan Perjalanan Dinas", colData[0], rowData + rowInc)
        rowInc += row1
        doc.text("kepada karyawan :", colData[0], rowData + rowInc)

        rowInc += row2
        doc.text("- Nama", colData[0], rowData + rowInc)
        doc.text(":", colData[1], rowData + rowInc)
        doc.text(res.name, colData[2], rowData + rowInc)
        doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
        rowInc += row2
        doc.text("- Payroll", colData[0], rowData + rowInc)
        doc.text(":", colData[1], rowData + rowInc)
        doc.text(`STM - ${res.payroll}`, colData[2], rowData + rowInc)
        doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
        rowInc += row2
        doc.text("- Pangkat/Gol", colData[0], rowData + rowInc)
        doc.text(":", colData[1], rowData + rowInc)
        doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
        rowInc += row2
        doc.text("- Jabatan", colData[0], rowData + rowInc)
        doc.text(":", colData[1], rowData + rowInc)
        doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
        rowInc += row2
        doc.text("- Divisi/Bagian", colData[0], rowData + rowInc)
        doc.text(":", colData[1], rowData + rowInc)
        doc.text(res.dept, colData[2], rowData + rowInc)
        doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
        rowInc += row2
        doc.text("- Tujuan", colData[0], rowData + rowInc)
        doc.text(":", colData[1], rowData + rowInc)
        doc.text(res.location, colData[2], rowData + rowInc)
        doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
        rowInc += row2
        doc.text("- Keperluan", colData[0], rowData + rowInc)
        doc.text(":", colData[1], rowData + rowInc)
        doc.text(res.description.slice(0, 75).trim(), colData[2], rowData + rowInc)
        doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
        rowInc += row2
        doc.text(res.description.slice(75, 150).trim(), colData[2], rowData + rowInc)
        doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
        rowInc += row2
        doc.text("- Tanggal", colData[0], rowData + rowInc)
        doc.text(":", colData[1], rowData + rowInc)
        doc.text(format(res.real_start, "d MMMM yyyy"), colData[2], rowData + rowInc)
        doc.text(`s/d    ${format(res.real_end, "d MMMM yyyy")}`, colData[2] + 60, rowData + rowInc)
        doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
        rowInc += row2
        doc.text("- Lamanya", colData[0], rowData + rowInc)
        doc.text(":", colData[1], rowData + rowInc)
        doc.text(`${differenceInDays(formatTanggal(res.real_end), formatTanggal(res.real_start))}`, colData[2], rowData + rowInc)
        doc.text(`hari kerja.`, colData[2] + 40, rowData + rowInc)
        doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 45, rowData + rowInc + 2)
        rowInc += row2 + 2
        doc.text("Demikian Surat Keterangan Perjalanan Dinas ini kami keluarkan agar dapat dipergunakan sebagaimana", colData[0], rowData + rowInc)
        rowInc += row1
        doc.text("mestinya.", colData[0], rowData + rowInc)
        rowInc += row2
        doc.text("Pimpinan Perusahaan,", colData[0], rowData + rowInc)
        doc.text("Pejabat yang dituju,", colData[0] + 130, rowData + rowInc)
        rowInc += row3 * 2.4
        doc.text("Hari Sandi", colData[0], rowData + rowInc)
        doc.line(colData[0] + 124, rowData + rowInc + 2, 186, rowData + rowInc + 2)
        rowInc += row3
        doc.text("Datang tanggal", colData[0] + 90, rowData + rowInc)
        doc.text(":", colData[0] + 120, rowData + rowInc)
        doc.line(colData[0] + 122, rowData + rowInc + 2, 190, rowData + rowInc + 2)
        rowInc += row3
        doc.text("Kembali tanggal", colData[0] + 90, rowData + rowInc)
        doc.text(":", colData[0] + 120, rowData + rowInc)
        doc.line(colData[0] + 122, rowData + rowInc + 2, 190, rowData + rowInc + 2)
        rowInc += row1
        doc.setFillColor(186, 187, 194)
        doc.rect(colData[0], rowData + rowInc, 176, 21, "FD")
        rowInc += row1
        doc.text("PERHATIAN :", colData[0] + 4, rowData + rowInc)
        rowInc += row1
        doc.text("-", colData[0]  + 5, rowData + rowInc)
        doc.text("Harap lapor kepada pejabat yang dikunjungi dan meminta tanda tangan setelah selesai", colData[0] + 8, rowData + rowInc)
        rowInc += row1
        doc.text("menjalankan tugas", colData[0] + 8, rowData + rowInc)
        rowInc += row2
        doc.text("* Pertinggal", colData[0], rowData + rowInc)

        rowInc += row3
        doc.setFontSize(8)
        doc.text("Gandaria 8 Office Tower, Lt. 8, Jl. Sultan Iskandar Muda No-10, RT-10/RW-06 Kel. Kebayoran Lama - Jakarta 12770 Tel: (62-21) 7985951 Fax: (62-21) 7986134", 12, rowData + rowInc)
        rowInc += 4
        doc.setFontSize(9)
        doc.text("Marketing Office :", 90, rowData + rowInc)
        rowInc += 4
        doc.setFontSize(8)
        doc.text("Jl. Gandaria Tengah III No-25 Kramat Pela, Kebayoran Baru - Jakarta 12130 Telp : (62-21) 72797009, Fax : : (62-21) 7211435", 30, rowData + rowInc)
        rowInc += 4
        doc.setFontSize(9)
        doc.text("Factory :", 95, rowData + rowInc)
        rowInc += 4
        doc.setFontSize(8)
        doc.text("Jl. Lumba-lumba, Log. Pond Selili, Samarinda 75114 - Kalimantan Timur. Telp : (62-541) 240801 Fax : (62-541) 240604", 34, rowData + rowInc)
        
        const blob = doc.output('blob')
        const url = URL.createObjectURL(blob);

        window.open(url); // buka tab baru
        
        // doc.save(`${res.skpd_id}.pdf`);
    }
    
    const getDept = async () =>{
        const req = await fetch('/api/data?type=dept')
        return await req.json()
    }
    
    const getUserByDept = $derived.by(() => {
        return async (v:string) =>{
            const req = await fetch(`/api/data?type=user_by_dept&val=${v}`)
            const res = await req.json()
            return res
        }
    })
    
    const getSPPD = async () =>{
        const req = await fetch(`/api/data?type=sppd_not_in_skpd`)
        const res = await req.json()
        return res
    }

    const getSPPDDetail = async (id: string) =>{
        const req = await fetch(`/api/data?type=get_sppd_by_id&val=${id}`)
        const res = await req.json()

        setTimeout(()=>{
            formSKPD.answer.sppd_id = res.sppd_id
            formSKPD.answer.date = [formatTanggal(res.start_date), formatTanggal(res.end_date)]
            formSKPD.answer.skpd_detail = res.sppd_detail.map((v: any) => {
                return {payroll: v.payroll, description: v.description, user_id_machine: v.employee.user_id_machine}
            })
        }, 100)
    }
    
    $effect(()=>{
        tableSPPD.load(async (state:State) => {
            try {
                const req = await fetch(`/api/sppd?${getParams(state)}&payroll=${formSPPD.payroll || ""}&dept=${formSPPD.dept || ""}`)
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        tableSKPD.load(async (state:State) => {
            try {
                const req = await fetch(`/api/skpd?${getParams(state)}&payroll=${formSKPD.payroll}`)
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })
    })

    $effect(()=>{
        const diff = differenceInDays(formSPPD.answer.date[1], formSPPD.answer.date[0])
        formSPPD.answer.duration = isNaN(diff) ? 0 : diff
    })
    
    setTimeout(()=>{
        if(userProfile.user_hrd || userProfile.level >= 5){
            tableSPPD.invalidate()
        }
        tableSKPD.invalidate()
    }, 1000)
</script>

<svelte:head>
    <title>Dinas</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="Dashboard">
            <div class="relative flex items-center justify-center min-h-[70vh] rounded-lg" style={`background-image: url(${bgtravel}); background-size: cover; background-position:bottom`}>
                <span class='text-white bg-slate-600/[.7] p-3 rounded-lg'>Travel Page</span>
            </div>
        </TabItem>
        {#if userProfile.user_hrd || userProfile.level >= 5}
            <TabItem title="SPPD">
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                    {#if formSPPD.error}
                        {#each formSPPD.error.split(';') as v}
                            <Alert dismissable>
                                <span>{v}</span>
                            </Alert>
                        {/each}
                    {:else if formSPPD.success}
                        <Alert border color="green" dismissable>
                            <span>{formSPPD.success}</span>
                        </Alert>
                    {/if}
                    
                    {#if (userProfile?.user_hrd || userProfile?.level > 1)}
                        <div class="flex gap-2">
                            {#if formSPPD.add || formSPPD.edit}
                                {#if pecahArray(userProfile?.access_sppd, "C") || pecahArray(userProfile.access_sppd, "U")}
                                    <MyButton onclick={formSPPDBatal}><Ban size={16} /></MyButton>
                                    <MyButton disabled={formSPPD.loading} onclick={formSPPDSubmit}><Save size={16}/></MyButton>
                                {/if}
                            {:else}
                                {#if pecahArray(userProfile?.access_sppd, "C")}
                                    <MyButton onclick={()=> formSPPD.add = true}><Plus size={16}/></MyButton>
                                {/if}
                            {/if}
                        </div>
                    {/if}

                    {#if formSPPD.loading}
                        <MyLoading message="Get SPPD data"/>
                    {/if}
                    {#if formSPPD.add || formSPPD.edit}
                        <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                            {#if userProfile.user_hrd}
                                {#await getDept() then val}
                                    <div class="flex flex-col gap-2 flex-1">
                                        <Label>Department</Label>
                                        <Svelecte disabled={formSPPD.edit} class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={formSPPD.answer.dept} 
                                            options={val.map((v:any) => ({value: v.dept_code, text:v.dept_code + " - " + v.name}))}/>
                                    </div>
                                {/await}
                            {/if}

                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <MyInput type='textarea' title={`Purpose`} name="purpose" bind:value={formSPPD.answer.purpose}/>
                                <MyInput type='text' title={`Location`} name="location" bind:value={formSPPD.answer.location}/>
                                <input type='hidden' name="sppd_id" disabled={formSPPD.edit} bind:value={formSPPD.answer.sppd_id}/>                            
                                <MyInput type='daterange' title='Date' name="date" bind:value={formSPPD.answer.date}/>
                                <MyInput type='text' title='Duration' bind:value={formSPPD.answer.duration} />
                            </div>
                            
                            {#if formSPPD.answer.dept}
                                <div class="flex flex-col gap-3 bg-bgdark2 p-4 rounded-lg">
                                    {#each formSPPD.answer.sppd_detail as list, i}
                                        <div class="flex flex-col gap-2">
                                            <div class="flex gap-2 items-end">
                                                {#await getUserByDept(formSPPD.answer.dept) then val}
                                                    <div class="flex flex-col gap-2 flex-1">
                                                        <Label>{`Employee ${i+1}`}</Label>
                                                        <Svelecte class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={list.payroll} 
                                                            options={val.map((v:any) => ({value: v.payroll, text:v.payroll +" - "+v.name}))}/>
                                                    </div>
                                                {/await}

                                                {#if i == formSPPD.answer.sppd_detail.length - 1}
                                                    <MyButton onclick={()=>formSPPD.answer.sppd_detail.push({payroll:"", description:""})}><Plus size={14} color='green' /></MyButton>
                                                {/if}
                                                {#if formSPPD.answer.sppd_detail.length > 1}
                                                    <MyButton onclick={()=> formSPPD.answer.sppd_detail.splice(i, 1)}><Minus size={14} color='red' /></MyButton>
                                                {/if}
                                            </div>
                                            <div class="flex flex-col">
                                                <MyInput type='textarea' title={`Description ${i+1}`} name="description" bind:value={list.description}/>
                                                <span class="italic text-[.8rem]">Minimal 10 character</span>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                            
                            <span class='text-[.8rem]'>createdBy <Badge color='dark'>{user?.name}</Badge> </span>
                        </form>
                    {/if}
                    
                    <div class="flex gap-2">
                        <select bind:value={tableSPPD.rowsPerPage} onchange={() => tableSPPD.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                        <MyInput type='text' bind:value={tableSPPDSearch.value} onkeydown={(e: KeyboardEvent) => {
                            if(e.key.toLowerCase() === 'enter') tableSPPDSearch.set()
                        }}/>
                        <MyButton onclick={()=>tableSPPDSearch.set()}><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableSPPD.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>

                    <Datatable table={tableSPPD}>
                        <Table>
                            <TableHead>
                                <ThSort table={tableSPPD} field="sppd_id">SPPD ID</ThSort>
                                <ThSort table={tableSPPD} field="purpose">Purpose</ThSort>
                                <ThSort table={tableSPPD} field="location">Location</ThSort>
                                <ThSort table={tableSPPD} field="name">Name</ThSort>
                                <ThSort table={tableSPPD} field="start_date">Start Date</ThSort>
                                <ThSort table={tableSPPD} field="end_date">End Date</ThSort>
                                <ThSort table={tableSPPD} field="duration">Duration</ThSort>
                                <ThSort table={tableSPPD} field="">#</ThSort>
                            </TableHead>

                            {#if tableSPPD.isLoading}
                                <div class="flex p-4 items-center">
                                    <MyLoading message="Loading data"/>
                                </div>
                            {:else}
                                <TableBody tableBodyClass="divide-y">
                                    {#if tableSPPD.rows.length > 0}
                                        {#each tableSPPD.rows as row:any}
                                            <TableBodyRow class='h-10'>
                                                <TableBodyCell>{row.sppd_id.replace(/\_/g,'/')}</TableBodyCell>
                                                <TableBodyCell>{row.purpose}</TableBodyCell>
                                                <TableBodyCell>{row.location}</TableBodyCell>
                                                <TableBodyCell><div title={row.name}>{pecahKataOther(row.name, 1)}</div></TableBodyCell>
                                                <TableBodyCell>{formatTanggal(row.start_date, "date")}</TableBodyCell>
                                                <TableBodyCell>{formatTanggal(row.end_date, "date")}</TableBodyCell>
                                                <TableBodyCell>{row.duration + " Days"}</TableBodyCell>
                                                <TableBodyCell>
                                                    {#if (userProfile?.user_hrd || userProfile?.level > 1)}
                                                        {#if pecahArray(userProfile.access_sppd, "U")}
                                                            <MyButton onclick={()=> formSPPDEdit(row.sppd_id)}><Pencil size={12} /></MyButton>
                                                        {/if}
                                                        {#if pecahArray(userProfile.access_sppd, "D")}
                                                            <MyButton onclick={()=> {
                                                                formSPPD.modalDelete = true
                                                                formSPPD.answer.sppd_id = row.sppd_id
                                                            }}><Trash size={12} /></MyButton>
                                                        {/if}
                                                    {/if}
                                                    <MyButton onclick={()=> handleCetakSPPD(row.sppd_id)}><Printer size={12} /></MyButton>
                                                </TableBodyCell>
                                            </TableBodyRow>
                                        {/each}
                                    {:else}
                                        <TableBodyRow class='h-10'>
                                            <TableBodyCell colspan={10}>No data available</TableBodyCell>
                                        </TableBodyRow>
                                    {/if}
                                </TableBody>
                            {/if}
                        </Table>
                        {#if tableSPPD.rows.length > 0}
                            <div class="flex justify-between items-center gap-2 mt-3">
                                <p class='text-textdark self-end text-[.9rem]'>
                                    Showing {tableSPPD.rowCount.start} to {tableSPPD.rowCount.end} of {tableSPPD.rowCount.total} rows
                                    <Badge color="dark">Page {tableSPPD.currentPage}</Badge>
                                </p>
                                <div class="flex gap-2">
                                    <MyButton onclick={()=> tableSPPD.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                    <MyButton onclick={()=> tableSPPD.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                    {#each tableSPPD.pages as page}
                                        <MyButton className={`text-textdark text-[.9rem] px-3`} onclick={()=> tableSPPD.setPage(page)} type="button">{page}</MyButton>
                                    {/each}
                                    <MyButton onclick={()=> tableSPPD.setPage('next')}><ChevronRight size={16} /></MyButton>
                                    <MyButton onclick={()=> tableSPPD.setPage('last')}><ChevronLast size={16} /></MyButton>
                                </div>
                            </div>
                        {/if}
                    </Datatable>
                </div>
            </TabItem>
        {/if}
        <TabItem title="SKPD">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                {JSON.stringify(formSKPD.answer)}
                {#if formSKPD.error}
                    {#each formSKPD.error.split(';') as v}
                        <Alert dismissable>
                            <span>{v}</span>
                        </Alert>
                    {/each}
                {:else if formSKPD.success}
                    <Alert border color="green" dismissable>
                        <span>{formSKPD.success}</span>
                    </Alert>
                {/if}
        
                {#if (userProfile?.user_hrd)}
                    <div class="flex gap-2">
                        {#if formSKPD.add || formSKPD.edit}
                            {#if pecahArray(userProfile?.access_skpd, "C") || pecahArray(userProfile.access_skpd, "U")}
                                <MyButton onclick={formSKPDBatal}><Ban size={16} /></MyButton>
                                <MyButton disabled={formSKPD.loading} onclick={formSKPDSubmit}><Save size={16}/></MyButton>
                            {/if}
                        {:else}
                            {#if pecahArray(userProfile?.access_skpd, "C")}
                                <MyButton onclick={()=> formSKPD.add = true}><Plus size={16}/></MyButton>
                            {/if}
                        {/if}
                    </div>
                {/if}
        
                {#if formSKPD.loading}
                    <MyLoading message="Get SKPD data"/>
                {/if}
                {#if formSKPD.add || formSKPD.edit}
                    <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                        {#if formSKPD.add}
                            {#await getSPPD() then val}
                                <div class="flex flex-col gap-2 flex-1">
                                    <Label>SPPD ID</Label>
                                    <Svelecte class='rounded-lg bg-bgdark' clearable searchable selectOnTab multiple={false} bind:value={formSKPD.sppd_id} 
                                    options={val.map((v:any) => ({value: v.sppd_id, text:v.sppd_id.replace(/\_/g, '/') + " - " + v.purpose, sppd_id: v.sppd_id}))}
                                    onChange={(e: any) => getSPPDDetail(e.sppd_id)}
                                    />
                                </div>
                            {/await}
                        {:else}
                        <MyInput type='text' title='SPPD ID' disabled={formSKPD.edit} bind:value={formSKPD.answer.sppd_id} />
                        {/if}
                
                        {#if formSKPD.answer.sppd_id}
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <MyInput type='daterange' disabled title='Date' name="date" bind:value={formSKPD.answer.date}/>

                                <div class="flex flex-col gap-2">
                                    <Label>Status</Label>
                                    <select bind:value={formSKPD.answer.status}>
                                        {#each ["OPEN","CLOSE"] as option}
                                            <option value={option}>{option}</option>
                                        {/each}
                                    </select>
                                </div>
                            </div>
                            <div class="flex flex-col gap-2">
                                {#each formSKPD.answer.skpd_detail as item, i (item.payroll)}
                                    <div class="flex gap-2">
                                        <MyInput type='text' disabled title='Payroll' bind:value={item.payroll} />
                                        <MyInput type='text' disabled title='Description' bind:value={item.description} />
                                    </div>
                                {/each}
                            </div>
                        {/if}
                        
                        <span class='text-[.8rem]'>createdBy <Badge color='dark'>{user?.name}</Badge> </span>
                    </form>
                {/if}
                
                <div class="flex gap-2">
                    <select bind:value={tableSKPD.rowsPerPage} onchange={() => tableSKPD.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <MyInput type='text' bind:value={tableSKPDSearch.value} onkeydown={(e: KeyboardEvent) => {
                        if(e.key.toLowerCase() === 'enter') tableSKPDSearch.set()
                    }}/>
                    <MyButton onclick={()=>tableSKPDSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableSKPD.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableSKPD}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableSKPD} field="skpd_id">SKPD ID</ThSort>
                            <ThSort table={tableSKPD} field="sppd_id">SPPD ID</ThSort>
                            <ThSort table={tableSKPD} field="payroll">Payroll</ThSort>
                            <ThSort table={tableSKPD} field="name">Name</ThSort>
                            <ThSort table={tableSKPD} field="location">Location</ThSort>
                            <ThSort table={tableSKPD} field="description">Description</ThSort>
                            <ThSort table={tableSPPD} field="real_start">Start Date</ThSort>
                            <ThSort table={tableSPPD} field="real_end">End Date</ThSort>
                            <ThSort table={tableSKPD} field="status">Status</ThSort>
                            <ThSort table={tableSKPD} field="">#</ThSort>
                        </TableHead>
        
                        {#if tableSKPD.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                            <TableBody tableBodyClass="divide-y">
                                {#if tableSKPD.rows.length > 0}
                                    {#each tableSKPD.rows as row:any}
                                        <TableBodyRow class='h-10'>
                                            <TableBodyCell>{row.skpd_id.replace(/\_/g,'/')}</TableBodyCell>
                                            <TableBodyCell>{row.sppd_id.replace(/\_/g,'/')}</TableBodyCell>
                                            <TableBodyCell>{row.payroll}</TableBodyCell>
                                            <TableBodyCell>{row.name}</TableBodyCell>
                                            <TableBodyCell>{row.location}</TableBodyCell>
                                            <TableBodyCell>{row.description}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.real_start, "date")}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.real_end, "date")}</TableBodyCell>
                                            <TableBodyCell>{row.status}</TableBodyCell>
                                            <TableBodyCell>
                                                {#if pecahArray(userProfile.access_skpd, "U")}
                                                <MyButton onclick={()=> formSKPDEdit(row.skpd_id)}><Pencil size={12} /></MyButton>
                                                {/if}
                                                {#if pecahArray(userProfile.access_skpd, "D")}
                                                    <MyButton onclick={()=> {
                                                        formSKPD.modalDelete = true
                                                        formSKPD.answer.skpd_id = row.skpd_id
                                                    }}><Trash size={12} /></MyButton>
                                                {/if}                                                
                                                <MyButton onclick={()=> handleCetakSKPD(row.skpd_id)}><Printer size={12} /></MyButton>
                                            </TableBodyCell>
                                        </TableBodyRow>
                                    {/each}
                                {:else}
                                    <TableBodyRow class='h-10'>
                                        <TableBodyCell colspan={10}>No data available</TableBodyCell>
                                    </TableBodyRow>
                                {/if}
                            </TableBody>
                        {/if}
                    </Table>
                    {#if tableSKPD.rows.length > 0}
                        <div class="flex justify-between items-center gap-2 mt-3">
                            <p class='text-textdark self-end text-[.9rem]'>
                                Showing {tableSKPD.rowCount.start} to {tableSKPD.rowCount.end} of {tableSKPD.rowCount.total} rows
                                <Badge color="dark">Page {tableSKPD.currentPage}</Badge>
                            </p>
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableSKPD.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                <MyButton onclick={()=> tableSKPD.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                {#each tableSKPD.pages as page}
                                    <MyButton className={`text-textdark text-[.9rem] px-3`} onclick={()=> tableSKPD.setPage(page)} type="button">{page}</MyButton>
                                {/each}
                                <MyButton onclick={()=> tableSKPD.setPage('next')}><ChevronRight size={16} /></MyButton>
                                <MyButton onclick={()=> tableSKPD.setPage('last')}><ChevronLast size={16} /></MyButton>
                            </div>
                        </div>
                    {/if}
                </Datatable>
            </div>

            <Modal title="Terms of Service" bind:open={formSKPD.cetakPDF} size={'xl'} autoclose>
                <div class="flex flex-col py-1" id="cetakPDF">
                    <span>hello world</span>
                    <div class="flex w-full ">
                    <span class="">Hallo</span>
                    </div>
                    <div class="flex w-full ">
                        <span>Surat Keterangan Perjalanan Dinas</span>
                    </div>
                </div>
            </Modal>
        </TabItem>
    </Tabs>

    <Modal bind:open={formSPPD.modalDelete} autoclose>
        <div class="flex flex-col gap-6">
            <h3>Delete SPPD ?</h3>
        </div>
        <svelte:fragment slot="footer">
            <Button color='green' disabled={formSPPD.loading} onclick={() => formSPPDDelete(formSPPD.answer.sppd_id)}>Yes, delete this data</Button>
            <Button color='red' onclick={() => formSPPD.modalDelete = false}>No</Button>
        </svelte:fragment>
    </Modal>

    <Modal bind:open={formSKPD.modalDelete} autoclose>
        <div class="flex flex-col gap-6">
            <h3>Delete SKPD ?</h3>
        </div>
        <svelte:fragment slot="footer">
            <Button color='green' disabled={formSKPD.loading} onclick={() => formSKPDDelete(formSKPD.answer.skpd_id)}>Yes, delete this data</Button>
            <Button color='red' onclick={() => formSKPD.modalDelete = false}>No</Button>
        </svelte:fragment>
    </Modal>
    
</main>

