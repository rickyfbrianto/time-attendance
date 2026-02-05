<script lang="ts">    
    import {fade} from 'svelte/transition'
    import { Tabs, TabItem, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Label, Button, Modal, Alert, Badge, Tooltip } from 'flowbite-svelte';
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
    import { TextAlignCenter, Ban, Search, RefreshCw, Pencil, Trash, Plus, Save, Minus, Printer, QrCode } from '@lucide/svelte'
    import MyButton from '$/lib/components/MyButton.svelte';
	import MyLoading from '$/lib/components/MyLoading.svelte';
	import MyInput from '$/lib/components/MyInput.svelte';
	import { formatTanggal, pecahArray, pecahKataOther, getParams, capitalEachWord, isUrlActive } from '$/lib/utils';
    import { differenceInDays } from "date-fns";
	import axios from 'axios';
	import Svelecte from 'svelecte';
    import { jsPDF } from "jspdf";
    import stm from '$/lib/assets/stm.png'
    import stempel from '$/lib/assets/stempel.png'
    import "$/lib/assets/font/Comic-normal.js"
	import { z } from 'zod';
	import { fromZodError } from 'zod-validation-error';
    import MyPagination from '@/MyPagination.svelte';
    import MyAlert from '@/MyAlert.svelte';
    import MyDatePicker from '@/MyDatePicker.svelte';
	import { goto } from '$app/navigation';
	import MyBadge from '@/MyBadge.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { base } from '$app/paths';

    let {data} = $props()
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)
    const queryClient = useQueryClient()
    
    const rowsPerPage = 10
    const listApproveSKPDTTD = [
        {value: '120301', text: "Agus Saputro"},
        {value: '261203', text: "Gati Prasetyo"},
        {value: '202205', text: "Pujo Basuki Joyo Utomo"},
        {value: '945009', text: "Suhariyono Rachman"},
    ]
    const listApproveSKPDNama = listApproveSKPDTTD.filter(v => ['261203','120301'].includes(v.value))
    
    let modeDinas = $state({
        payroll: (()=> user?.payroll)(),
        tabNo: 1
    })
    
    let tableSPPD = $state(new TableHandler([], {rowsPerPage}))
    let tableSPPDSearch = tableSPPD.createSearch()
        
    const formSPPDAnswer = {
        answer:{
            sppd_id: "id",
            purpose:"",
            location:"",
            date: ["", ""],
            duration: 0,
            dept: (()=> (user.user_divisi && user.level > 1) ? "" : user?.department)(),
            createdBy: (()=> user?.payroll)(),
            sppd_detail:[{payroll:"", description:""}]
        },
        dept: (()=> (user.user_divisi && user.level > 1) ? "" : user?.department)(),
        payroll: (()=> (user.user_dept || user.user_divisi) && user.level > 1 ? "" : user?.payroll)(),
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
                date: z.tuple([z.string().trim().min(10), z.string().trim().min(10)], {message: "Date is not valid"}),
                sppd_detail: z.array(z.object({
                    payroll: z.string().trim().min(1),
                    description: z.string().trim().min(10)
                }))
            })
            const isValid = valid.safeParse(formSPPD.answer)
            if(isValid.success){            
                const req = await axios.post(`${base}/api/sppd`, formSPPD.answer)
                const res = await req.data
                formSPPDBatal()
                tableSPPD.invalidate()
                formSPPD.error = ""
                formSPPD.success = res.message
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
            const req = await axios.get(`${base}/api/sppd/${id}`)
            const res = await req.data
            if(res){
                formSPPD.edit = true
                formSPPD.add = false
                formSPPD.loading = false
                formSPPD.answer = {...res}
                formSPPD.answer.date = [formatTanggal(res.start_date, "date"), formatTanggal(res.end_date, "date")]
            }
        } catch (error) {
            formSPPD.loading = false
        }
    }

    const formSPPDDelete = async (id:string) =>{
        try {
            formSPPD.loading = true
            await axios.delete(`${base}/api/sppd/${id}`)
            tableSPPD.invalidate()
        } catch (error) {
        } finally {
            formSPPD.loading = false
        }
    }

    const handleCetakSPPD= async (id:string) =>{
        try {
            const req = await axios.get(`${base}/api/sppd/${id}`)
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
                doc.text("Form No", 152, rowData + rowInc)
                doc.text(": 11-21", 152 + 17, rowData + rowInc)
                rowInc += row1
                doc.text("Rev No", 152, rowData + rowInc)
                doc.text(": 0", 152 + 17, rowData + rowInc)
                rowInc += row1
                doc.text("Rev Date", 152, rowData + rowInc)
                doc.text(": Jan 2020", 152 + 17, rowData + rowInc)
                
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
                doc.text(`: ${val.employee.position}`, colData[1], rowData + rowInc)
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
                doc.text(`: ${formatTanggal(res.start_date, "date", "app")}`, colData[1], rowData + rowInc)
                doc.text(`s/d     ${formatTanggal(res.end_date, "date", "app")}`, colData[1] + 60, rowData + rowInc)
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
                doc.text(`Jakarta, ${formatTanggal(new Date(), "date", "app")}`, colData[0], rowData + rowInc)
                
                rowInc += row4 * 3
                doc.setFont('times', 'underline')
                doc.text(capitalEachWord(res.employee.name), colData[0], rowData + rowInc)
                rowInc += row1 * 1.2
                doc.setFont('times', 'normal')
                doc.text(res.employee.position, colData[0], rowData + rowInc)

                doc.setFontSize(10)
                rowInc += row4 + 2
                doc.text(`* File`, colData[0], rowData + rowInc)
                rowInc += row1
                doc.text(`* Disetujui 1 tingkat di atas yang bersangkutan (Minimal Kasi/Supervisor)`, colData[0], rowData + rowInc)
                doc.setFont('calibri', 'normal')
            })
            
            const blob = doc.output('blob')
            const url = URL.createObjectURL(blob);

            window.open(url); // buka tab baru
        } catch (err) {
            goto(`${base}/api/handleError?msg=${err.message}`)
        }
    }
    
    // SKPD
    let tableSKPD = $state(new TableHandler([], {rowsPerPage}))
    let tableSKPDSearch = tableSKPD.createSearch()
    
    const formSKPDAnswer = {
        answer:{
            addMode: false,
            sppd_id: "",
            skpd_id: "",
            skpd_detail: [{skpd_id: "", payroll:"", description: "", level: ""}],
            date: ["", ""],
            approve: "",
            approve_name: "",
            createdBy: (()=> user?.payroll)(),
        },
        sppd_id: "",
        payroll: (()=> user.user_type == 'HR' ? "" : user?.payroll)(),
        success:"",
        error:"",
        cetakPDFID:"",
        cetakPDF:false,
        modalPreview: false,
        modalApproveSKPD: false,
        modalDelete:false,
        loading:false,
        add:false,
        edit:false,
    }
    
    let formSKPD = $state({...formSKPDAnswer})
    
    const formSKPDSubmit = async () =>{
        try {
            formSKPD.loading = true
            formSKPD.answer.addMode = formSKPD.add
            const valid = z.object({
                sppd_id: z.string().trim().min(1),
                skpd_detail: z.array(z.object(
                    {skpd_id: z.string().trim().min(3), payroll: z.string().trim().min(6), description: z.string().trim().min(1), level: z.string().trim().min(1)}
                )),
                date: z.tuple([z.string().trim().min(10), z.string().trim().min(10)], {message: "Date is not valid"}),
            })
            
            const isValid = valid.safeParse(formSKPD.answer)
            if(isValid.success){
                const req = await axios.post(`${base}/api/skpd`, formSKPD.answer)
                const res = await req.data
                formSKPDBatal()
                tableSKPD.invalidate()
                tableSPPD.invalidate()
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
            const req = await axios.get(`${base}/api/skpd/${id}`)
            const res = await req.data
            if(res){
                formSKPD.answer = {...res}
                formSKPD.answer.sppd_id  = res.sppd_id
                setTimeout(()=>{
                    formSKPD.answer.date = [formatTanggal(res.real_start, "date"), formatTanggal(res.real_end, "date")]
                    formSKPD.answer.skpd_detail = [{skpd_id: res.skpd_id.replace(/\_/g,'/'), payroll: res.payroll, level: res.level, description: res.description}]
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
            const req = await axios.delete(`${base}/api/skpd/${id}`)
            const res = await req.data
            tableSKPD.invalidate()
            formSKPDBatal()
            formSKPD.success = res.message
        } catch (error: any) {
            formSKPD.error = error.response.data.message
            formSKPD.success = ""
        } finally {
            formSKPD.loading = false
        }
    }

    const handleApproveSKPD = async (id: string) => {
        try {
            const req = await axios.post(`${base}/api/skpd/${id}/approve_skpd`)
            const res = await req.data
            tableSKPD.invalidate()
            formSKPDBatal()
            queryClient.invalidateQueries({queryKey: ['getNotif', user.payroll]})
            formSKPD.success = res.message
        } catch (error: any) {
            formSKPD.error = error.response.data.message
            formSKPD.success = ""
        }
    }
    
    const handleCetakSKPD= async (id:string) =>{
        try {        
            const req = await axios.get(`${base}/api/skpd/${id}`)
            const res = await req.data

            const imageUrl = import.meta.env.VITE_VIEW_SIGNATURE
            // const isValid = await isUrlActive(imageUrl)
            // if (!isValid) throw new Error (`Service masih mati, silahkan dinyalakan`)
            
            if (!res.a_signature) throw new Error (`Approval ${capitalEachWord(res.a_name)} tidak ada signature`)

            const doc = new jsPDF({
                orientation:"p",
                unit:"mm",
                format:"a4"
            })

            const signatureSize = 20
            const rowData = 10
            const colData = [16, 45, 50]
            let rowInc = 0
            let row1 = 6
            let row2 = 8
            let row3 = 10

            doc.setTextColor("#174ca3")
            doc.addImage(stm, 16, 5, 22, 22)
            doc.setFontSize(28)
            rowInc += 4
            doc.text("P.T. SAGATRADE MURNI", 50, rowData + rowInc)
            doc.setFontSize(12)
            rowInc += row1
            doc.text("MANUFACTURES OF PRIMARY CEMENTING EQUIPMENT,", 50, rowData + rowInc)
            rowInc += 4
            doc.text("LINER HANGER EQUIPMENT AND COMPLETION TOOLS", 52, rowData + rowInc)
            // doc.rect(10, 28, 190, 238)
            doc.rect(10, 32, 190, 232)
            doc.setFont("Comic", "normal")
            doc.setFontSize(16)
            doc.setTextColor("#000000")
            rowInc += 18
            doc.text("SURAT KETERANGAN PERJALANAN DINAS", 52, rowData + rowInc)
            rowInc += row2
            doc.line(10, rowData + rowInc, 200, rowData + rowInc)
            
            rowInc += row2
            doc.setFont("times", "normal")
            doc.setFontSize(12)
            doc.text("Nomor", colData[0], rowData + rowInc)
            doc.text(`:    ${res.skpd_id.replace(/\_/g,'/')}`, 35, rowData + rowInc)
            doc.text(`Jakarta, ${formatTanggal(res.createdAt, "date", "app")}`, 142, rowData + rowInc)
            
            rowInc += row3
            doc.text("Dengan Hormat,", colData[0], rowData + rowInc)
            rowInc += row1
            doc.text("Dalam rangka tugas perusahaan, maka dengan ini kami berikan Surat Keterangan Perjalanan Dinas", colData[0], rowData + rowInc)
            rowInc += row1
            doc.text("kepada karyawan :", colData[0], rowData + rowInc)

            rowInc += row2
            doc.text("- Nama", colData[0], rowData + rowInc)
            doc.text(":", colData[1], rowData + rowInc)
            doc.text(capitalEachWord(res.name), colData[2], rowData + rowInc)
            doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
            rowInc += row2
            doc.text("- Payroll", colData[0], rowData + rowInc)
            doc.text(":", colData[1], rowData + rowInc)
            doc.text(res.payroll, colData[2], rowData + rowInc)
            doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
            rowInc += row2
            doc.text("- Level", colData[0], rowData + rowInc)
            doc.text(":", colData[1], rowData + rowInc)
            doc.text(res.level, colData[2], rowData + rowInc)
            doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
            rowInc += row2
            doc.text("- Jabatan", colData[0], rowData + rowInc)
            doc.text(":", colData[1], rowData + rowInc)
            doc.text(res.position, colData[2], rowData + rowInc)
            doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
            rowInc += row2
            doc.text("- Divisi/Bagian", colData[0], rowData + rowInc)
            doc.text(":", colData[1], rowData + rowInc)
            doc.text(res.dept, colData[2], rowData + rowInc)
            doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
            rowInc += row2
            doc.text("- Tujuan", colData[0], rowData + rowInc)
            doc.text(":", colData[1], rowData + rowInc)
            doc.text(capitalEachWord(res.location), colData[2], rowData + rowInc)
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
            doc.text(formatTanggal(res.real_start, "date","app"), colData[2], rowData + rowInc)
            doc.text(`s/d    ${formatTanggal(res.real_end, "date", "app")}`, colData[2] + 60, rowData + rowInc)
            doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 145, rowData + rowInc + 2)
            rowInc += row2
            doc.text("- Lamanya", colData[0], rowData + rowInc)
            doc.text(":", colData[1], rowData + rowInc)
            doc.text(`${differenceInDays(formatTanggal(res.real_end), formatTanggal(res.real_start)) + 1}`, colData[2], rowData + rowInc)
            doc.text(`hari kerja.`, colData[2] + 40, rowData + rowInc)
            doc.line(colData[1] + 2, rowData + rowInc + 2, colData[1] + 45, rowData + rowInc + 2)
            rowInc += row2 + 2
            doc.text("Demikian Surat Keterangan Perjalanan Dinas ini kami keluarkan agar dapat dipergunakan sebagaimana", colData[0], rowData + rowInc)
            rowInc += row1
            doc.text("mestinya.", colData[0], rowData + rowInc)
            rowInc += row1
            doc.text("Pimpinan Perusahaan,", colData[0], rowData + rowInc)
            doc.text("Pejabat yang dituju,", colData[0] + 130, rowData + rowInc)
            if(!listApproveSKPDNama.some(item => item.value === res.approve)){
                doc.text("for", colData[0] - 3, rowData + rowInc + row1)
            }
            doc.addImage(stempel, colData[0] + 10, rowData + rowInc, signatureSize, signatureSize)
            rowInc += row3 * 2.6
            doc.addImage(imageUrl + res.a_signature, colData[0] + 3, rowData + rowInc - (signatureSize + 4), signatureSize, signatureSize)
            doc.text(capitalEachWord(res.a_name), colData[0], rowData + rowInc)
            doc.line(colData[0] + 124, rowData + rowInc + 2, 186, rowData + rowInc + 2)
            rowInc += row1
            doc.text(res.a_position, colData[0], rowData + rowInc)
            rowInc += row2
            doc.text("Datang tanggal", colData[0] + 90, rowData + rowInc)
            doc.text(":", colData[0] + 120, rowData + rowInc)
            doc.line(colData[0] + 122, rowData + rowInc + 2, 190, rowData + rowInc + 2)
            rowInc += row2
            doc.text("Kembali tanggal", colData[0] + 90, rowData + rowInc)
            doc.text(":", colData[0] + 120, rowData + rowInc)
            doc.line(colData[0] + 122, rowData + rowInc + 2, 190, rowData + rowInc + 2)
            rowInc += row1
            // doc.setFillColor(186, 187, 194)
            // doc.rect(colData[0], rowData + rowInc, 176, 21, "FD")
            doc.text("PERHATIAN :", colData[0] + 4, rowData + rowInc)
            rowInc += row1
            doc.text("-", colData[0]  + 5, rowData + rowInc)
            doc.text("Surat Keterangan Perjalanan Dinas ini jangan sampai", colData[0] + 8, rowData + rowInc)
            rowInc += row1
            doc.text("hilang karena sebagai bukti secara administrasi dan harus", colData[0] + 8, rowData + rowInc)
            rowInc += row1
            doc.text("mendapat pengesahan dari pejabat yang dituju", colData[0] + 8, rowData + rowInc)
            rowInc += row1
            doc.text("* Pertinggal", colData[0], rowData + rowInc)

            rowInc += row2
            doc.setFontSize(10)
            doc.text("Head Office :", 95, rowData + rowInc)
            rowInc += 3
            doc.setFontSize(8)
            doc.text("Gandaria 8 Office Tower, Lt. 8, Jl. Sultan Iskandar Muda No-10, RT-10/RW-06 Kel. Kebayoran Lama - Jakarta 12770 Tel: (62-21) 7985951 Fax: (62-21) 7986134", 12, rowData + rowInc)
            rowInc += 4
            doc.setFontSize(10)
            doc.text("Marketing Office :", 90, rowData + rowInc)
            rowInc += 3
            doc.setFontSize(8)
            doc.text("Jl. Gandaria Tengah III No-25 Kramat Pela, Kebayoran Baru - Jakarta 12130 Telp : (62-21) 72797009, Fax : : (62-21) 7211435", 30, rowData + rowInc)
            rowInc += 4
            doc.setFontSize(10)
            doc.text("Factory :", 95, rowData + rowInc)
            rowInc += 3
            doc.setFontSize(8)
            doc.text("Jl. Lumba-lumba, Log. Pond Selili, Samarinda 75114 - Kalimantan Timur. Telp : (62-541) 240801 Fax : (62-541) 240604", 34, rowData + rowInc)
            
            const blob = doc.output('blob')
            const url = URL.createObjectURL(blob);

            window.open(url); // buka tab baru
            // doc.save(`${res.skpd_id}.pdf`);
        } catch (err) {
            goto(`${base}/api/handleError?msg=${err.message}`)
        }
    }
    
    const showPreviewSKPD = async (value: string) => {
        formSKPD.modalPreview = true

        const req = await axios.get(`${base}/api/skpd/${value}`)
        const res = await req.data
        if(res){
            formSKPD.answer = {...res}
            formSKPD.answer.sppd_id  = res.sppd_id
            setTimeout(()=>{
                formSKPD.answer.date = [formatTanggal(res.real_start, "date"), formatTanggal(res.real_end, "date")]
                formSKPD.answer.skpd_detail = [{skpd_id: res.skpd_id.replace(/\_/g,'/'), payroll: res.payroll, level: res.level, description: res.description}]
            }, 100)
        }
    }
    
    const getDept = async () =>{
        const req = await fetch(`${base}/api/data?type=dept_by_divisi&val=${user.dept.divisi}`)
        return await req.json()
    }
    
    const getUserByDept = $derived.by(() => {
        return async (val: string) =>{
            const req = await fetch(`${base}/api/data?type=user_filter_level&val=down&payroll=${user.payroll}&dept=${val}`)
            const res = await req.json()
            return res
        }       
    })
    
    const getSPPD = async () =>{
        const req = await fetch(`${base}/api/data?type=sppd_not_in_skpd`)
        const res = await req.json()
        return res
    }

    const getSPPDDetail = async (id: string) =>{
        const req = await fetch(`${base}/api/data?type=get_sppd_by_id&val=${id}`)
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
                const req = await fetch(`${base}/api/sppd?${getParams(state)}&payroll=${formSPPD.payroll || ""}&dept=${formSPPD.dept || ""}`)
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        tableSKPD.load(async (state:State) => {
            try {
                const req = await fetch(`${base}/api/skpd?${getParams(state)}&payroll=${formSKPD.payroll}`)
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })
    })

    $effect(()=>{
        // const selisihDate = formSPPD.answer.date.toString().split(" s/d ")
        const diff = differenceInDays(formSPPD.answer.date[1], formSPPD.answer.date[0]) + 1
        formSPPD.answer.duration = isNaN(diff) ? 0 : diff
    })

    $effect(()=> {
        getSPPD()
    })
    
    setTimeout(()=>{
        if((user.user_dept || user.user_divisi) && user.level > 1){
            tableSPPD.invalidate()
            modeDinas.tabNo = 1
        } else {
            modeDinas.tabNo = 2
        }
        tableSKPD.invalidate()
        modeDinas.tabNo = 2
    }, 1000)
</script>

<svelte:head>
    <title>Dinas</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        {#if (user.user_dept || user.user_divisi) && user.level > 1}
            <TabItem title="SPPD" open={modeDinas.tabNo == 1} onclick={()=> modeDinas.tabNo = 1}>
                <div class="flex flex-col p-4 gap-4 border border-stone-300 rounded-lg">
                    {#if formSPPD.error}
                        {#each formSPPD.error.split(';') as v}
                            <MyAlert pesan={v} func={()=> formSPPD.error = ""} color='red'/>
                        {/each}
                    {:else if formSPPD.success}
                        <MyAlert pesan={formSPPD.success} func={()=> formSPPD.success = ""} color='green'/>
                    {/if}
                    
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

                    {#if formSPPD.loading}
                        <MyLoading message="Load SPPD data"/>
                    {/if}
                    {#if formSPPD.add || formSPPD.edit}
                        <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-stone-300 rounded-lg'>
                            {#if user.user_divisi}
                                {#await getDept()}
                                    <MyLoading/>
                                {:then val}
                                    <div class="flex flex-col gap-2 flex-1">
                                        <Label>Department</Label>
                                        <Svelecte disabled={formSPPD.edit} class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={formSPPD.answer.dept} 
                                            options={val.map((v:any) => ({value: v.dept_code, text:v.dept_code + " - " + v.name}))}/>
                                    </div>
                                {/await}
                            {/if}

                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <input type='hidden' name="sppd_id" disabled={formSPPD.edit} bind:value={formSPPD.answer.sppd_id}/>
                                <MyInput type='textarea' title={`Judul`} name="purpose" bind:value={formSPPD.answer.purpose}/>
                                <MyInput type='text' title={`Lokasi`} name="location" bind:value={formSPPD.answer.location}/>

                                <div class="flex flex-col gap-2 flex-1">
                                    <Label>Tanggal Dinas</Label>
                                    <MyDatePicker bind:value={formSPPD.answer.date} mode='range'/>
                                </div>
                                
                                <MyInput type='text' title='Durasi' disabled bind:value={formSPPD.answer.duration} />
                            </div>
                            
                            {#if formSPPD.answer.dept}
                                {#await getUserByDept(formSPPD.answer.dept)}
                                    <MyLoading message={'Mengambil data user'}/>
                                {:then userDept}
                                    <div class="flex flex-col gap-3 bg-bgdark2 p-4 rounded-lg">
                                        {#each formSPPD.answer.sppd_detail as list, i}
                                            <div class="flex flex-col gap-2">
                                                <div class="flex gap-2 items-end">
                                                    <div class="flex flex-col gap-2 flex-1">
                                                        <Label>{`Karyawan ${i+1}`}</Label>
                                                        <Svelecte class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={list.payroll} 
                                                            options={userDept.map((v:any) => ({value: v.payroll, text:v.payroll +" - "+v.name}))}/>
                                                    </div>

                                                    {#if i == formSPPD.answer.sppd_detail.length - 1}
                                                        <MyButton onclick={()=>formSPPD.answer.sppd_detail.push({payroll:"", description:""})}><Plus size={14} color='green' /></MyButton>
                                                    {/if}
                                                    {#if formSPPD.answer.sppd_detail.length > 1}
                                                        <MyButton onclick={()=> formSPPD.answer.sppd_detail.splice(i, 1)}><Minus size={14} color='red' /></MyButton>
                                                    {/if}
                                                </div>
                                                <div class="flex flex-col">
                                                    <MyInput type='textarea' title={`Deskripsi ${i+1}`} name="description" bind:value={list.description}/>
                                                    <span class="italic text-[.8rem]">Minimal 10 karakter</span>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {/await}
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
                                <ThSort table={tableSPPD} field="purpose">Deskripsi</ThSort>
                                <ThSort table={tableSPPD} field="location">Lokasi</ThSort>
                                <ThSort table={tableSPPD} field="name">Nama</ThSort>
                                <ThSort table={tableSPPD} field="start_date">Tanggal Mulai</ThSort>
                                <ThSort table={tableSPPD} field="end_date">Tanggal Selesai</ThSort>
                                <ThSort table={tableSPPD} field="duration">Durasi</ThSort>
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
                                                <TableBodyCell tdClass='break-all font-medium'>{row.sppd_id.replace(/\_/g,'/')}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{row.purpose}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{row.location}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>
                                                    <div>
                                                        <span aria-label={row.name.split(', ').map((v: string) => capitalEachWord(v)).join(', ')} data-balloon-pos="up">{pecahKataOther(capitalEachWord(row.name), 1)}</span>
                                                    </div>
                                                </TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.start_date, "date", "app")}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.end_date, "date", "app")}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{row.duration + " Days"}</TableBodyCell>
                                                <TableBodyCell>
                                                    {#if !formSPPD.edit}
                                                        {#if (user.user_dept || user.user_divisi) && user.level > 1 && !row.isSKPDFromSPPD}
                                                            {#if pecahArray(userProfile.access_sppd, "U")}
                                                                <MyButton onclick={()=> formSPPDEdit(row.sppd_id)}><Pencil size={12} /></MyButton>
                                                                <Tooltip>Edit</Tooltip>
                                                            {/if}
                                                            {#if pecahArray(userProfile.access_sppd, "D")}
                                                                <MyButton onclick={()=> {
                                                                    formSPPD.modalDelete = true
                                                                    formSPPD.answer.sppd_id = row.sppd_id
                                                                }}><Trash size={12} /></MyButton>
                                                                <Tooltip>Hapus</Tooltip>
                                                            {/if}
                                                        {/if}
                                                        <MyButton onclick={()=> handleCetakSPPD(row.sppd_id)}><Printer size={12} /></MyButton>
                                                        <Tooltip>Print</Tooltip>
                                                    {/if}
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
                        <MyPagination table={tableSPPD}/>
                    </Datatable>
                </div>
            </TabItem>
        {/if}
        <TabItem title="SKPD" open={modeDinas.tabNo == 2} divClass="flex flex-col gap-4" onclick={()=> modeDinas.tabNo = 2}>
            <div class="flex flex-col gap-2 p-4 border border-stone-300 rounded-lg shadow-lg">
                {#await getSPPD()}
                    <span>Loading</span>
                {:then val}
                    <span class="text-[1.2rem] font-bold">{val.length} SPPD belum jadi SKPD</span>
                    {#each val as v}
                    <div class="flex gap-2 divide-x">
                        <span class='flex items-center gap-2'><QrCode size={12} />{v.sppd_id} {v.purpose}</span>
                    </div>
                    {/each}
                {/await}
            </div>
            <div class="flex flex-col p-4 gap-4 border border-stone-300 rounded-lg">
                {#if formSKPD.error}
                    {#each formSKPD.error.split(';') as v}
                        <MyAlert pesan={v} func={()=> formSKPD.error = ""} color='red'/>
                    {/each}
                {:else if formSKPD.success}
                    <MyAlert pesan={formSKPD.success} func={()=> formSKPD.success = ""} color='green'/>
                {/if}
        
                {#if (user.user_type == 'HR')}
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
                    <MyLoading message="Load SKPD data"/>
                {/if}
                {#if formSKPD.add || formSKPD.edit}
                    <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-stone-300 rounded-lg'>
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
                                <div class="flex flex-col gap-2">
                                    <Label>Menyetujui (pada) TTD</Label>
                                    <Svelecte class='rounded-lg bg-bgdark' clearable searchable selectOnTab multiple={false} bind:value={formSKPD.answer.approve} 
                                    options={listApproveSKPDTTD.map((v:any) => ({value: v.value, text: v.value + " - " + v.text}))}/>
                                    <span class='italic text-[.75rem]'>Selain Pak Agus dan Pak Gati ada tambahan keterangan "for" disamping tanda tangan</span>
                                </div>

                                <div class="flex flex-col gap-2 flex-1">
                                    <Label>Tanggal Dinas</Label>
                                    <MyDatePicker bind:value={formSKPD.answer.date} mode='range'/>
                                </div>
                                
                                <div class="flex flex-col gap-2">
                                    <Label>Menyetujui (pada) Nama</Label>
                                    <Svelecte class='rounded-lg bg-bgdark' clearable searchable selectOnTab multiple={false} bind:value={formSKPD.answer.approve_name} 
                                    options={listApproveSKPDNama.map((v:any) => ({value: v.value, text: v.value + " - " + v.text}))}/>
                                </div>

                                <div class="flex flex-col gap-2">
                                    <Label>Status</Label>
                                    <!-- <Svelecte class='rounded-lg bg-bgdark' clearable searchable selectOnTab multiple={false} bind:value={formSKPD.answer.approve_name} 
                                    options={listApproveSKPDNama.map((v:any) => ({value: v.value, text: v.value + " - " + v.text}))}/> -->
                                </div>
                            </div>
                            <div class="flex flex-col gap-3 bg-bgdark2 p-4 rounded-lg">
                                <span class='font-bold text-[1.2rem] font-quicksand'>Daftar Dinas Karyawan</span>
                                {#each formSKPD.answer.skpd_detail as item, i (item.payroll)}
                                    <div class="flex gap-2">
                                        <MyInput type='text' title='SKPD ID' disabled={formSKPD.edit} bind:value={item.skpd_id} />
                                        <MyInput type='text' disabled title='Payroll' bind:value={item.payroll} />
                                        <MyInput type='text' title='Level' bind:value={item.level} />
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
                            <ThSort table={tableSKPD} field="name">Nama</ThSort>
                            <ThSort table={tableSKPD} field="location">Lokasi</ThSort>
                            <ThSort table={tableSKPD} field="description">Deskripsi</ThSort>
                            <ThSort table={tableSPPD} field="real_start">Tanggal Mulai</ThSort>
                            <ThSort table={tableSPPD} field="real_end">Tanggal Selesai</ThSort>
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
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <div>{row.skpd_id.replace(/\_/g,'/')}</div>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <div>{row.sppd_id.replace(/\_/g,'/')}</div>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{capitalEachWord(row.name)}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{row.location}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{row.description}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.real_start, "date","app")}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.real_end, "date", "app")}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <div class="flex flex-col gap-2">
                                                    <MyBadge italic color={
                                                    ["OPEN"].includes(row.status) ? "default"
                                                    : ["APPROVED"].includes(row.status) ? "green" : "dark"}>{row.status}</MyBadge >
                                                    {#if user.payroll === row.approve_ttd && row.status == 'OPEN'}
                                                        <MyButton className='text-[.8rem]' onclick={()=> {
                                                            formSKPD.modalApproveSKPD = true
                                                            formSKPD.answer.skpd_id = row.skpd_id
                                                        }} size={"sm"}>Approve</MyButton>
                                                        <Tooltip>Approve</Tooltip>
                                                    {/if}
                                                    <MyButton className='text-[.8rem]' onclick={() => showPreviewSKPD(row.skpd_id)} size={"sm"}>Preview</MyButton>
                                                    <Tooltip>Preview</Tooltip>
                                                </div>
                                            </TableBodyCell>
                                            <TableBodyCell>
                                                {#if !formSKPD.edit}
                                                    {#if row.status == 'OPEN'}
                                                        {#if pecahArray(userProfile.access_skpd, "U")}
                                                            <MyButton onclick={()=> formSKPDEdit(row.skpd_id)}><Pencil size={12} /></MyButton>
                                                            <Tooltip>Edit</Tooltip>
                                                        {/if}
                                                        {#if pecahArray(userProfile.access_skpd, "D")}
                                                            <MyButton onclick={()=> {
                                                                formSKPD.modalDelete = true
                                                                formSKPD.answer.skpd_id = row.skpd_id
                                                            }}><Trash size={12} /></MyButton>
                                                            <Tooltip>Hapus</Tooltip>
                                                        {/if}
                                                    {/if}
                                                    {#if row.status != 'OPEN'}
                                                        <MyButton onclick={()=> handleCetakSKPD(row.skpd_id)}><Printer size={12} /></MyButton>
                                                        <Tooltip>Print</Tooltip>
                                                    {/if}
                                                {/if}                                                
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
                    <span class='text-[.75rem] italic mt-2'>Jika button approve muncul, maka anda menjadi user yang wajib approve untuk SKPD tersebut</span>
                    <MyPagination table={tableSKPD}/>
                </Datatable>
            </div>
        </TabItem>
    </Tabs>

    <Modal bind:open={formSKPD.modalPreview} size={'xl'} autoclose>
        <div class='flex flex-col gap-4 p-4 border border-stone-300 rounded-lg'>
            <MyInput type='text' title='SPPD ID' disabled bind:value={formSKPD.answer.sppd_id} />
        
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                    <Label>Menyetujui (pada) TTD</Label>
                    <Svelecte class='rounded-lg bg-bgdark' clearable disabled searchable selectOnTab multiple={false} bind:value={formSKPD.answer.approve} 
                    options={listApproveSKPDTTD.map((v:any) => ({value: v.value, text: v.value + " - " + v.text}))}/>
                    <span class='italic text-[.75rem]'>Selain Pak Agus dan Pak Gati ada tambahan keterangan "for" disamping tanda tangan</span>
                </div>

                <div class="flex flex-col gap-2 flex-1">
                    <Label>Tanggal Dinas</Label>
                    <MyDatePicker disabled bind:value={formSKPD.answer.date} mode='range'/>
                </div>
                
                <div class="flex flex-col gap-2">
                    <Label>Menyetujui (pada) Nama</Label>
                    <Svelecte class='rounded-lg bg-bgdark' clearable disabled searchable selectOnTab multiple={false} bind:value={formSKPD.answer.approve_name} 
                    options={listApproveSKPDNama.map((v:any) => ({value: v.value, text: v.value + " - " + v.text}))}/>
                </div>
            </div>
            <div class="flex flex-col gap-3 bg-bgdark2 p-4 rounded-lg">
                <span class='font-bold text-[1.2rem] font-quicksand'>Daftar Dinas Karyawan</span>
                {#each formSKPD.answer.skpd_detail as item, i (item.payroll)}
                    <div class="flex gap-2">
                        <MyInput type='text' disabled title='SKPD ID' bind:value={item.skpd_id} />
                        <MyInput type='text' disabled title='Payroll' bind:value={item.payroll} />
                        <MyInput type='text' disabled title='Level' bind:value={item.level} />
                        <MyInput type='text' disabled title='Description' bind:value={item.description} />
                    </div>
                {/each}
            </div>                    
            <span class='text-[.8rem]'>createdBy <Badge color='dark'>{user?.name}</Badge> </span>
        </div>
        <svelte:fragment slot="footer">
            <Button onclick={()=> formSKPD.modalPreview = false} class='flex gap-2 px-3 py-2' pill>Close</Button>
        </svelte:fragment>
    </Modal>
    
    <Modal bind:open={formSPPD.modalDelete} autoclose>
        <div class="flex flex-col gap-6">
            <h3>Hapus SPPD ?</h3>
        </div>
        <svelte:fragment slot="footer">
            <Button color='green' disabled={formSPPD.loading} onclick={() => formSPPDDelete(formSPPD.answer.sppd_id)}>Ya, hapus SPPD</Button>
            <Button color='red' onclick={() => formSPPD.modalDelete = false}>Tidak</Button>
        </svelte:fragment>
    </Modal>

    <Modal bind:open={formSKPD.modalDelete} autoclose>
        <div class="flex flex-col gap-6">
            <h3>Hapus SKPD ?</h3>
        </div>
        <svelte:fragment slot="footer">
            <Button color='green' disabled={formSKPD.loading} onclick={() => formSKPDDelete(formSKPD.answer.skpd_id)}>Ya, Hapus SKPD</Button>
            <Button color='red' onclick={() => formSKPD.modalDelete = false}>Tidak</Button>
        </svelte:fragment>
    </Modal>

    <Modal bind:open={formSKPD.modalApproveSKPD} autoclose>
        <div class="flex flex-col gap-6">
            <h3>Approve SKPD ?</h3>
        </div>
        <svelte:fragment slot="footer">
            <Button color='green' disabled={formSKPD.loading} onclick={() => handleApproveSKPD(formSKPD.answer.skpd_id)}>Ya, approve SKPD</Button>
            <Button color='red' onclick={formSKPDBatal}>Tidak</Button>
        </svelte:fragment>
    </Modal>
    
</main>

