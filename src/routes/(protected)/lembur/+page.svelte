 <script lang="ts">
    import {fade} from 'svelte/transition'
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Tabs, TabItem, Button, Badge, Label, Alert, Tooltip, Modal } from 'flowbite-svelte';
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import MyLoading from '@/MyLoading.svelte';
	import MyButton from '@/MyButton.svelte';
	import { Ban, Check, Minus, Pencil, Plus, Printer, RefreshCw, Save, Search, Trash, X, Eye } from '@lucide/svelte';
	import MyInput from '@/MyInput.svelte';
	import axios from 'axios';
	import { pecahArray, formatTanggal, namaHari, generatePeriode, getParams, selisihWaktu, formatDifference, namaBulan, dataTahun, dataBulan, capitalEachWord } from '$/lib/utils.js';
	import { differenceInHours, format, set, getDay, differenceInMinutes } from 'date-fns';
    import Svelecte from 'svelecte'
    import stm from '$/lib/assets/stm.png'
    import { jsPDF } from "jspdf";
	import { z } from 'zod';
	import { fromZodError } from 'zod-validation-error';
    import autoTable, { applyPlugin } from 'jspdf-autotable'
    import MyPagination from '@/MyPagination.svelte';
    import MyAlert from '@/MyAlert.svelte';
    import MyDatePicker from '@/MyDatePicker.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
    
    let {data} = $props()
    let user = $derived(data.user) 
    let userProfile = $derived(data.userProfile)
    let setting = $derived(data.periode)
    let periode = $derived(generatePeriode(new Date().toString(), Number(setting?.start_periode), Number(setting?.end_periode)))

    let modeLembur = $state({
        periode: {
            start: (()=> periode.start)(),
            end: (()=> periode.end)(),
            // start: "",
            // end: "",
        },
        tabNo: 1
    })
    
    const rowsPerPage = 10
    
    let tableSPL = $state(new TableHandler([], {rowsPerPage}))
    let tableSPLSearch = tableSPL.createSearch()
    
    let formSPLAnswer = {
        answer:{
            spl_id: "id",
            purpose:"",
            est_start:"",
            est_end:"",            
            approval1:"",
            status1:"",
            createdBy: (()=> user?.payroll)(),
            dept: (()=> user?.department)(),
            spl_detail:[{payroll:"", name:"", description:""}],
        },
        dept: (()=> user?.department)(),
        payroll: (()=> user.level > 1 ? "": user?.payroll)(),
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        success:"",
        error:"",
        modalDelete: false,
        loading:false,
        add:false,
        edit:false,
        modalPreview: false
    }
    
    let formSPL = $state({...formSPLAnswer})
    
    const formSPLSubmit = async () =>{
        try {
            formSPL.loading = true
            const valid = z.object({
                spl_id: z.string().trim().min(1),
                // dept: z.string().trim().min(1),
                purpose: z.string().trim().min(5),
                est_start: z.string().trim().min(1),
                est_end: z.string().trim().min(1),
                approval1: z.string().trim().min(1),
                spl_detail: z.array(z.object({
                    payroll: z.string().trim().min(1).max(8),
                    description: z.string().trim().min(1).max(255),
                })),
                createdBy: z.string().trim().min(1),
            })
            const isValid = valid.safeParse(formSPL.answer)
            if(isValid.success){
                const req = await axios.post(`${base}/api/lembur/spl`, formSPL.answer)
                const res = await req.data                
                formSPLBatal()
                tableSPL.invalidate()
                formSPL.success = res.message
            } else{
                const err = fromZodError(isValid.error)
                formSPL.success = ""
                formSPL.error = err.message
            }
        } catch (error: any) {
            formSPL.error = error.response.data.message
            formSPL.success = ""
        } finally {
            formSPL.loading = false
        }
    }

    const formSPLBatal = () => formSPL = {...formSPLAnswer}
    
    const formSPLEdit = async (id:string) =>{
        try {
            formSPL.loading = true
            formSPL.error = ""
            formSPL.success = ""
            const req = await axios.get(`${base}/api/lembur/spl/${id}/edit`)
            const res = await req.data
            if(res){
                formSPL.answer = {...res,
                    est_start: formatTanggal(res.est_start),
                    est_end: formatTanggal(res.est_end),
                    spl_detail: res.spl_detail.map(({payroll, description}) => ({payroll, description: description.trim() }))
                }
                formSPL.edit = true
                formSPL.add = false
            }else{
                formSPL.error = "Cant edit data"
                formSPL.success = ""
            }
        } catch (error) {
        } finally {
            formSPL.loading = false
            tableSPL.invalidate()
        }
    }
    
    const formSPLDelete = async (id:string) =>{
        try {
            formSPL.loading = true
            const req = await axios.delete(`${base}/api/lembur/spl/${id}/delete`)
            const res = await req.data
            formSPL.error = ""
            formSPL.success = res.message
        } catch (error) {
            formSPL.error = "Cant delete SPL"
            formSPL.success = ""            
        } finally {
            formSPL.loading = false
            tableSPL.invalidate()
        }
    }

    const handleCetakSPL = async (id:string) =>{
        try {        
            const req = await axios.get(`${base}/api/lembur/spl/${id}/print`)
            const res = await req.data

            if(!res.employee_spl_createdByToemployee.signature && !res.employee_spl_approval1Toemployee.signature && !res.employee_spl_acknowledgeByToemployee.signature){
                throw new Error('Ada user yang tidak memiliki signature untuk SPL ini')
            }

            const doc = new jsPDF({
                orientation:"l",
                unit:"mm",
                format:"a4"
            })

            const signatureSize = 20
            const colData = [8, 90, 160, 230]
            const rowData = 0
            let rowInc = 0
            let row1 = 4
            let row2 = 6
            let row3 = 8
            let row4 = 10

            rowInc += row4
            doc.setFont('times', 'normal', '')
            doc.addImage(stm, colData[0], rowData + rowInc - 5, 20, 20)
            doc.setFontSize(18)
            doc.setTextColor("#174ca3")
            doc.text("PT. SAGATRADE MURNI", colData[0] + 30, rowData + rowInc)
            doc.setTextColor("#000")
            doc.text("MANUFACTURERS OF PRIMARY CEMENTING", colData[0] + 30, rowData + rowInc + row2)
            doc.text("EQUIPMENT", colData[0] + 30, rowData + rowInc + (row2 * 2))
            
            const rightAlign = 238
            doc.rect(rightAlign, rowData + rowInc - 5, 50, rowData + rowInc + 6 )
            doc.setFontSize(10)
            doc.text("Form No", rightAlign + 2, rowData + rowInc)
            doc.text(": 11-19", rightAlign + 20, rowData + rowInc)
            rowInc += 4
            doc.text("Rev", rightAlign + 2, rowData + rowInc)
            doc.text(": 2", rightAlign + 20, rowData + rowInc)
            rowInc += 4
            doc.text("Rev Date", rightAlign + 2, rowData + rowInc)
            doc.text(": 22 March 2021", rightAlign + 20, rowData + rowInc)
            
            rowInc += row4
            doc.setFontSize(14)
            doc.text("OVERTIME AUTHORIZATION FORM", 108, rowData + rowInc)
            
            rowInc += row3 * 1.2
            doc.setFontSize(11)
            doc.text("Document No", colData[0], rowData + rowInc)
            doc.text(`:  ${res.spl_id.replace(/\_/g, '/')}`, colData[0] + 30, rowData + rowInc)
            rowInc += 5
            doc.text("Date Prepare", colData[0], rowData + rowInc)
            doc.text(`:  ${formatTanggal(res.createdAt, "date", "app")}`, colData[0] + 30, rowData + rowInc)
            rowInc += 5
            doc.text("Department", colData[0], rowData + rowInc)
            doc.text(`:  ${res.dept_spl_deptTodept.name}`, colData[0] + 30, rowData + rowInc)
            
            rowInc += row4
            const boxCheck = [colData[0], 105, 180]
            doc.rect(boxCheck[0], rowData + rowInc - 4, 4, 4)
            doc.text(`Customer Requirement`, boxCheck[0] + 6, rowData + rowInc)
            doc.rect(boxCheck[1], rowData + rowInc - 4, 4, 4)
            doc.text(`Production Process`, boxCheck[1] + 6, rowData + rowInc)
            doc.rect(boxCheck[2], rowData + rowInc - 4, 4, 4)
            doc.text(`Project Requirements`, boxCheck[2] + 6, rowData + rowInc)

            const totalMinutes = differenceInMinutes(res.est_end, res.est_start)
            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60
                    
            rowInc += 2
            autoTable(doc, {
                startY: rowData + rowInc,
                theme:"grid",
                head: [['No','Name', 'Payroll', 'Start', 'Finish', 'Total Hours', 'Description of Work']],
                margin: {left: colData[0]},
                body: res.spl_detail.flatMap((v: any, i: number) => {
                    const [no, nama, payroll, start, finish] = [i + 1, capitalEachWord(v.employee.name), v.employee.payroll, formatTanggal(res.est_start,"time").substring(0,5), formatTanggal(res.est_end,"time").substring(0,5)]
                    const prev = payroll
                    return v.description.split(',').filter((v: string) => v).map((desc: string, index: number) => {
                        const [temp_no, temp_nama, temp_payroll, temp_start, temp_finish, temp_total] = (index > 0 && prev == payroll)
                        ? ["", "", "", "", "", ""]
                        : [no, nama, payroll, start, finish, `${hours} Jam ${minutes} menit`]
                        return [temp_no, temp_nama, temp_payroll, temp_start, temp_finish, temp_total, desc.trim()]
                    })
                }),
                styles: {cellPadding: 1, halign: 'center' },
                headStyles:{ fillColor:"#FFF", textColor:"#000", halign: 'center', lineWidth: 0.2, fontSize: 9},
                bodyStyles:{fontSize: 9, halign: 'center'},
                columnStyles: {
                    0:{cellWidth: 10, valign: 'middle'}, 1:{cellWidth: 55, valign: 'middle'}, 2:{cellWidth: 20, valign: 'middle'}, 
                    3:{cellWidth: 17, valign: 'middle'}, 4:{cellWidth: 17, valign: 'middle'}, 5:{cellWidth: 28, valign: 'middle'}, 6:{cellWidth: 133, halign: 'left', valign: 'middle'}
                },
            })

            rowInc = doc.lastAutoTable.finalY + row2
            doc.text(`Prepared By,`, colData[0], rowData + rowInc)
            doc.text(`Approved By,`, colData[1], rowData + rowInc)
            doc.text(`Reviewer By`, colData[2], rowData + rowInc)
            doc.text(`Acknowledged By`, colData[3], rowData + rowInc)

            rowInc += row3
            doc.addImage(import.meta.env.VITE_VIEW_SIGNATURE + res.employee_spl_createdByToemployee.signature, colData[0], rowData + rowInc - 5, signatureSize, signatureSize)
            doc.addImage(import.meta.env.VITE_VIEW_SIGNATURE + res.employee_spl_approval1Toemployee.signature, colData[1], rowData + rowInc - 5, signatureSize, signatureSize)
            doc.addImage(import.meta.env.VITE_VIEW_SIGNATURE + res.employee_spl_acknowledgeByToemployee.signature, colData[3], rowData + rowInc - 5, signatureSize, signatureSize)
            
            rowInc += signatureSize
            doc.text(capitalEachWord(res.employee_spl_createdByToemployee.name), colData[0], rowData + rowInc)
            doc.text(capitalEachWord(res.employee_spl_approval1Toemployee.name), colData[1], rowData + rowInc)
            doc.text(capitalEachWord(res.employee_spl_acknowledgeByToemployee.name), colData[3], rowData + rowInc)

            const blob = doc.output('blob')
            const url = URL.createObjectURL(blob);

            window.open(url); // buka tab baru
            // doc.save(`${id}.pdf`);
        } catch (err) {
            goto(`${base}/api/handleError?msg=${err.message}`)
        }
    }

    const handleAcknowledgedSPL = async (id:string) =>{
        try {
            const req = await axios.post(`${base}/api/lembur/spl/${id}/acknowledge`, {
                acknowledgeBy: user.payroll
            })
            const res = await req.data
            tableSPL.invalidate()
            formSPL.error = ""
            formSPL.success = res.message
        } catch (error: any) {
            formSPL.error = error.response.data.message
            formSPL.success = ""
        }
    }

    // SPL approval 1
    let tableSPLApproval1 = $state(new TableHandler([], {rowsPerPage}))
    
    const formSPLApproval1Answer = {
        answer:{
            spl_id: "id",
            status:"",
        },
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    }

    let formSPLApproval1 = $state({...formSPLApproval1Answer})

    const handleApproveSPL1 = async (spl_id: string, val: string) => {
        try {
            formSPLApproval1.answer.spl_id = spl_id
            formSPLApproval1.answer.status = val
            const req = await axios.post(`${base}/api/lembur/spl/approve1`, formSPLApproval1.answer)
            const res = await req.data
            tableSPLApproval1.invalidate()
            tableSPL.invalidate()
            formSPLApproval1.error = ""
            formSPLApproval1.success = res.message
        } catch (error: any) {
            formSPLApproval1.error = error.response.data.message
            formSPLApproval1.success = ""
        }
    }
                
    const showPreviewSPL = async (value: string) => {
        formSPL.modalPreview = true

        const req = await axios.get(`${base}/api/lembur/spl/${value}/preview`)
        const res = await req.data
        if(res){
            formSPL.answer = {...res,
                est_start: formatTanggal(res.est_start, "datetime", "app"),
                est_end: formatTanggal(res.est_end, "datetime", "app"),
                spl_detail: res.spl_detail.map((val) => ({name: capitalEachWord(val.employee.name), description: val.description.trim() }))
            }
        }
    }
    
    // SRL
    let tableSRL = $state(new TableHandler([], {rowsPerPage}))
    let tableSRLSearch = tableSRL.createSearch()
    
    const formSRLAnswer = {
        answer:{
            srl_id: "id",
            spl_id: "",
            real_start: "",
            real_end:"",
            approval1:"",
            approval2:"",
            overtime:0,
            payroll: (()=> user?.payroll)(),
            srl_detail:[{description:"", status: ""}],
        },
        createdByName: "",
        payroll: (()=> user.level > 1 ? "": user?.payroll)(),
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        success:"",
        error:"",
        modalDelete: false,
        loading:false,
        add:false,
        edit:false,
        modalPreview:false
    }

    let formSRLDetailAnswer = $state([])
    
    let formSRL = $state({...formSRLAnswer})
    
    const formSRLSubmit = async () =>{
        try {
            formSRL.loading = true
            formSRL.error = ""
            formSRL.success = ""
            const valid = z.object({
                spl_id: z.string().trim().min(1),
                approval1: z.string().trim().min(1),
                approval2: z.string().trim().min(1),
            })
            const isValid = valid.safeParse(formSRL.answer)
            if(isValid.success){
                const req = await axios.post(`${base}/api/lembur/srl`, formSRL.answer)
                const res = await req.data
                formSRLBatal()
                tableSRL.invalidate()
                formSRL.success = res.message
            }else{
                const err = fromZodError(isValid.error)
                formSRL.success = ""
                formSRL.error = err.message
            }
        } catch (error: any) {
            formSRL.error = error.response.data.message
            formSRL.success = ""
        } finally {
            formSRL.loading = false
        }
    }

    const formSRLBatal = () => formSRL = {...formSRLAnswer}
    
    const formSRLEdit = async (id:string) =>{
        try {
            formSRL.loading = true
            const req = await axios.get(`${base}/api/lembur/srl/${id}/edit`)
            const res = await req.data
            if(res){
                formSRL.answer = {...res,
                    real_start: formatTanggal(res.real_start),
                    real_end: formatTanggal(res.real_end),
                    overtime: differenceInHours(res.real_end,res.real_start)
                }
                formSRL.edit = true
                formSRL.add = false
            }else{
                formSRL.error = "Cant edit data"
                tableSRL.invalidate()
            }
        } catch (error) {
        } finally {
            formSRL.loading = false
        }
    }

    const formSRLDelete = async (id:string) => {
        try {
            formSRL.loading = true
            const req = await axios.delete(`${base}/api/lembur/srl/${id}/delete`)
            const res = await req.data
            formSRL.error = ""
            formSRL.success = res.message
        } catch (error) {
            formSRL.error = "Cant delete SRL"
            formSRL.success = ""            
        } finally {
            formSRL.loading = false
            tableSRL.invalidate()
        }
    }

    const handleCetakSRL= async (id:string) =>{
        try {
            const req = await axios.get(`${base}/api/lembur/srl/${id}/print`)
            const res = await req.data
            
            if(!res.employee_srl_payrollToemployee.signature || !res.employee_srl_approval1Toemployee.signature || !res.employee_srl_approval2Toemployee.signature){
                throw new Error('Ada user yang tidak memiliki signature untuk SRL ini')
            }            
            
            applyPlugin(jsPDF)

            const doc = new jsPDF({
                orientation:"l",
                unit:"mm",
                format:"a4"
            })

            const signatureSize = 20
            const colData = [8, 115, 220]
            const rowData = 0
            let rowInc = 0
            let row1 = 4
            let row2 = 6
            let row3 = 8
            let row4 = 10

            const totalMinutes = differenceInMinutes(res.real_end, res.real_start)
            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60

            // const spl_detail = res.spl_detail.find(v => v.payroll == user?.payroll)

            rowInc += row4
            doc.setFont('times', 'normal', '')
            doc.addImage(stm, colData[0], rowData + rowInc - 5, 20, 20)
            doc.setFontSize(18)
            doc.setTextColor("#174ca3")
            doc.text("PT. SAGATRADE MURNI", colData[0] + 30, rowData + rowInc)
            doc.setTextColor("#000")
            doc.text("MANUFACTURERS OF PRIMARY CEMENTING", colData[0] + 30, rowData + rowInc + row2)
            doc.text("EQUIPMENT", colData[0] + 30, rowData + rowInc + (row2 * 2))
            
            doc.setFontSize(16)
            const rightAlign = 238
            doc.rect(rightAlign, rowData + rowInc - 5, 50, rowData + rowInc + 6 )
            doc.setFontSize(10)
            doc.text("Form No", rightAlign + 2, rowData + rowInc)
            doc.text(": 11-20", rightAlign + 20, rowData + rowInc)
            rowInc += 4
            doc.text("Rev.", rightAlign + 2, rowData + rowInc)
            doc.text(": 0", rightAlign + 20, rowData + rowInc)
            rowInc += 4
            doc.text("Date", rightAlign + 2, rowData + rowInc)
            doc.text(": Jan 2020", rightAlign + 20, rowData + rowInc)
            
            rowInc += row4 * 1.6
            doc.setFont('times', 'normal', 'bold')
            doc.setFontSize(14)
            doc.text("Formulir Pelaporan Jam Kerja Lembur Pada hari Minggu/Hari libur resmi & hari kerja biasa", 50, rowData + rowInc)
            doc.line(50 , rowData + rowInc + 1, 250, rowData + rowInc + 1)

            rowInc += row3
            const workhour = res.employee_srl_payrollToemployee.workhour
            const hariWeekend = workhour == 7 ? [6] : [0, 6]
            
            doc.setFontSize(11)
            doc.setFont('times', 'normal', 'bold')
            doc.text("Kepada", colData[0], rowData + rowInc)
            doc.text(`:  HRD`, colData[0] + 20, rowData + rowInc)
            doc.text(`| Hari Minggu`, colData[0] + 135, rowData + rowInc)
            doc.setFillColor(hariWeekend.includes(getDay(formatTanggal(res.real_start))) ? "#000": "#F9F7F3")
            doc.rect(colData[0] + 175, rowData + rowInc - 3.5 , 4, 4, "FD" )
            
            rowInc += 5
            doc.text("Dept.", colData[0], rowData + rowInc)
            doc.text(`:  ${res.employee_srl_payrollToemployee.dept.initial}`, colData[0] + 20, rowData + rowInc)
            doc.text(`| Hari Libur Resmi`, colData[0] + 135, rowData + rowInc)
            doc.setFillColor("#F9F7F3")
            doc.rect(colData[0] + 175, rowData + rowInc - 3.5 , 4, 4, "FD")
            rowInc += 5
            doc.text("Bulan", colData[0], rowData + rowInc)
            doc.text(`:  ${namaBulan[Number(format(res.real_start, "M"))- 1]}`, colData[0] + 20, rowData + rowInc)
            doc.text(`| Hari Kerja Biasa`, colData[0] + 135, rowData + rowInc)
            doc.setFillColor(hariWeekend.includes(getDay(formatTanggal(res.real_start))) ? "#F9F7F3": "#000")
            doc.rect(colData[0] + 175, rowData + rowInc - 3.5 , 4, 4, "FD")
            
            rowInc += row2
            autoTable(doc, {
                startY: rowData + rowInc,
                theme:"grid",
                head: [['No','Name', 'Payroll', 'Tanggal', 'Waktu', 'Jumlah Jam Kerja', 'Pekerjaan yang di kerjakan', 'Keterangan']],
                margin: {left: colData[0]},
                body: res.srl_detail.map((v:any, i: number) => {
                    const [nama, payroll, tanggal, waktu, jumlah] = i == 0 
                        ? [capitalEachWord(res.employee_srl_payrollToemployee.name), res.payroll, namaHari[getDay(formatTanggal(res.real_start, "date"))] + ", " + format(formatTanggal(res.real_start, "date"), "dd-MM-yyyy"), formatTanggal(res.real_start,"time").substring(0,5) + " - " + formatTanggal(res.real_end,"time").substring(0,5), `${hours} Jam ${minutes} menit`]
                        : ["","","","", ""]
                    return [i + 1, nama, payroll, tanggal, waktu, jumlah, v.description, v.status]
                }),
                styles: {cellPadding: 1, halign: 'center' },
                headStyles:{ fillColor:"#FFF", textColor:"#000", halign: 'center', lineWidth: 0.2},
                bodyStyles:{fontSize: 9, halign: 'center'},
                columnStyles: {
                    0:{cellWidth: 10, valign: 'middle'}, //No
                    1:{cellWidth: 55, valign: 'middle'}, //Nama
                    2:{cellWidth: 17, valign: 'middle'}, //Payroll
                    3:{cellWidth: 30, valign: 'middle'}, //Tanggal
                    4:{cellWidth: 22, valign: 'middle'}, //Waktu
                    5:{cellWidth: 26, valign: 'middle'}, //Jumlah Jam Kerja
                    6:{cellWidth: 95, valign: 'middle', halign: 'left'},  //Description
                    7:{cellWidth: 25, valign: 'middle'} //Status
                },
            })

            rowInc = doc.lastAutoTable.finalY + row2
            doc.text(`Dibuat Oleh`, colData[0], rowData + rowInc)
            doc.text(`Diperiksa Oleh`, colData[1], rowData + rowInc)
            doc.text(`Disetujui Oleh`, colData[2], rowData + rowInc)

            rowInc += row3
            doc.addImage(import.meta.env.VITE_VIEW_SIGNATURE + res.employee_srl_payrollToemployee.signature, colData[0], rowData + rowInc - 5, signatureSize, signatureSize)
            doc.addImage(import.meta.env.VITE_VIEW_SIGNATURE + res.employee_srl_approval1Toemployee.signature, colData[1], rowData + rowInc - 5, signatureSize, signatureSize)
            doc.addImage(import.meta.env.VITE_VIEW_SIGNATURE + res.employee_srl_approval2Toemployee.signature, colData[2], rowData + rowInc - 5, signatureSize, signatureSize)
            
            rowInc += row2 * 3.1
            doc.text(capitalEachWord(res.employee_srl_payrollToemployee.name), colData[0], rowData + rowInc)
            doc.text(capitalEachWord(res.employee_srl_approval1Toemployee.name), colData[1], rowData + rowInc)
            doc.text(capitalEachWord(res.employee_srl_approval2Toemployee.name), colData[2], rowData + rowInc)
            
            const blob = doc.output('blob')
            const url = URL.createObjectURL(blob);

            window.open(url); // buka tab baru
        } catch (err) {
            goto(`${base}/api/handleError?msg=${err.message}`)
        }
    }

    // SRL approval 1
    let tableSRLApproval1 = $state(new TableHandler([], {rowsPerPage}))
    
    const formSRLApproval1Answer = $state({
        answer:{
            srl_id: "",
            status:"",
        },
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    })
    
    let formSRLApproval1 = $state({...formSRLApproval1Answer})
    
    const handleApproveSRL1 = async (srl_id: string, val: string) => {
        try {
            formSRLApproval1.answer.srl_id = srl_id
            formSRLApproval1.answer.status = val
            const req = await axios.post(`${base}/api/lembur/srl/approve1`, formSRLApproval1.answer)
            const res = await req.data
            tableSRLApproval1.invalidate()
            tableSRLApproval2.invalidate()
            tableSRL.invalidate()
            formSRLApproval1.error = ""
            formSRLApproval1.success = res.message
        } catch (error: any) {
            formSRLApproval1.error = error.response.data.message
            formSRLApproval1.success = ""
        }
    }
    
    // SPL approval 2
    let tableSRLApproval2 = $state(new TableHandler([], {rowsPerPage}))
    
    const formSRLApproval2Answer = $state({
        answer:{
            srl_id: "",
            status:"",
        },
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    })
    
    let formSRLApproval2 = $state({...formSRLApproval2Answer})
    
    const handleApproveSRL2 = async (srl_id: string, val: string) => {
        try {
            formSRLApproval2.answer.srl_id = srl_id
            formSRLApproval2.answer.status = val
            const req = await axios.post(`${base}/api/lembur/srl/approve2`, formSRLApproval2.answer)
            const res = await req.data
            tableSRLApproval2.invalidate()
            tableSRL.invalidate()
            formSRLApproval2.error = ""
            formSRLApproval2.success = res.message
        } catch (error: any) {
            formSRLApproval2.error = error.response.data.message
            formSRLApproval2.success = ""
        }
    }
    
    const showPreviewSRL = async (value: string) => {
        formSRL.modalPreview = true

        const req = await axios.get(`${base}/api/lembur/srl/${value}/preview`)
        const res = await req.data
        if(res){
            formSRL.answer = {...res,
                real_start: formatTanggal(res.real_start),
                real_end: formatTanggal(res.real_end),
                overtime: differenceInHours(res.real_end,res.real_start)
            }
            formSRL.createdByName = res.employee_srl_payrollToemployee.name
        }
    }
    
    const getSPL = async () =>{
        const req = await fetch(`${base}/api/data?type=spl_by_status&val=${user.payroll}`)
        const res = await req.json()
        type Props = {
            est_start: string,
            est_end: string,
            spl_id: string,
            description: string
        }
        formSRLDetailAnswer = res.map(({est_start, est_end, spl_id, description}:Props) => {
            return {est_start, est_end, spl_id, description, overtime: differenceInHours(est_end, est_start)}
        })
        return res
    }

    const getUserByDept = $derived.by(() => {
        return async () =>{
            const req = await fetch(`${base}/api/data?type=user_by_dept&val=${user.department}`)
            const res = await req.json()
            return res
        }
    })

    const getUserAtasan = $derived.by(() => {
        return async (val: string) =>{
            const req = await fetch(`${base}/api/data?type=user_filter_level&val=up&payroll=${val}`)
            const res = await req.json()
            return res
        }
    })

    const getUserForLembur = $derived.by(() => {
        return async () =>{
            const req = await fetch(`${base}/api/data?type=user_for_lembur&val=${user.department}`)
            const res = await req.json()
            return res
        }
    })
    
    const getSPLAll = (id:string) =>{
        const {description, overtime, est_start, est_end} = formSRLDetailAnswer.find((v:any) => v.spl_id == id) as any
        formSRL.answer.real_start = formatTanggal(est_start)
        formSRL.answer.real_end = formatTanggal(est_end)
        formSRL.answer.overtime = overtime
        formSRL.answer.srl_detail = description.split(',').map((v: string) => ({description: v.trim(), status:"Completed"}))
    }

    $effect(()=>{
        tableSPL.load(async (state:State) => {
            try {           
                const req = await fetch(`${base}/api/lembur/spl?${getParams(state)}&dept=${formSPL.dept}&payroll=${formSPL.payroll}&start_date=${modeLembur.periode.start}&end_date=${modeLembur.periode.end}`)
                if(!req.ok) throw new Error('Gagal mengambil data')
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        tableSPLApproval1.load(async (state:State) => {
            try {
                const req = await fetch(`${base}/api/lembur/spl/approve1?${getParams(state)}&payroll=${user.payroll}`)
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })
        
        tableSRL.load(async (state:State) => {
            try {
                const req = await fetch(`${base}/api/lembur/srl?${getParams(state)}&payroll=${formSRL.payroll}&start_date=${modeLembur.periode.start}&end_date=${modeLembur.periode.end}`)
                if(!req.ok) throw new Error('Gagal mengambil data')
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        tableSRLApproval1.load(async (state:State) => {
            try {
                const req = await fetch(`${base}/api/lembur/srl/approve1?${getParams(state)}&payroll=${user.payroll}`)
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        tableSRLApproval2.load(async (state:State) => {
            try {
                const req = await fetch(`${base}/api/lembur/srl/approve2?${getParams(state)}&payroll=${user.payroll}`)
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })
    })
    
    $effect(()=> {
        const temp = modeLembur.tabNo == 1 
            ? set(new Date(), {year: formSPL.year, month: formSPL.month, date: setting?.end_periode})
            : set(new Date(), {year: formSRL.year, month: formSRL.month, date: setting?.end_periode})
        modeLembur.periode = {
            start: generatePeriode(temp.toString(), Number(setting?.start_periode), Number(setting?.end_periode)).start,
            end: generatePeriode(temp.toString(), Number(setting?.start_periode), Number(setting?.end_periode)).end,
        }
    })
    
    setTimeout(()=>{
        tableSPL.invalidate()
        tableSPLApproval1.invalidate()
        tableSRL.invalidate()
        tableSRLApproval1.invalidate()
        tableSRLApproval2.invalidate()
    }, 1000)
</script>

<svelte:head>
    <title>Lembur</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    <Modal bind:open={formSPL.modalDelete} autoclose>
        <div class="flex flex-col gap-6">
            <h3>Delete SPL ?</h3>
        </div>
        <svelte:fragment slot="footer">
            <Button color='green' disabled={formSPL.loading} onclick={() => formSPLDelete(formSPL.answer.spl_id)}>Yes, delete this data</Button>
            <Button color='red' onclick={() => formSPL.modalDelete = false}>No</Button>
        </svelte:fragment>
    </Modal>

    <Modal bind:open={formSRL.modalDelete} autoclose>
        <div class="flex flex-col gap-6">
            <h3>Delete SRL ?</h3>
        </div>
        <svelte:fragment slot="footer">
            <Button color='green' disabled={formSRL.loading} onclick={() => formSRLDelete(formSRL.answer.srl_id)}>Yes, delete this data</Button>
            <Button color='red' onclick={() => formSRL.modalDelete = false}>No</Button>
        </svelte:fragment>
    </Modal>

    <Modal bind:open={formSPL.modalPreview} autoclose>
        <div class="flex flex-col gap-2 max-h-[85vh]">
            <span class='text-[1.2rem] font-bold'>Preview Approval SPL</span>
            <MyInput type='textarea' disabled title={`Purpose`} name="purpose" bind:value={formSPL.answer.purpose}/>
                                
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">                
                <div class="flex flex-col gap-2 flex-1">
                    <Label>Estimasi Awal</Label>
                    <span class='font-bold'>{formSPL.answer.est_start}</span>
                </div>
                <div class="flex flex-col gap-2 flex-1">
                    <Label>Estimasi Selesai</Label>
                    <span class='font-bold'>{formSPL.answer.est_end}</span> 
                </div>
                {#await getUserByDept() then val}
                    <div class="flex flex-col gap-2 flex-1">
                        <Label>Approval 1</Label>
                        <Svelecte class='rounded-lg' disabled bind:value={formSPL.answer.approval1} 
                            options={val.map((v:any) => ({value: v.payroll, text:v.payroll +" - "+v.name}))}
                        />
                    </div>
                {/await}
            </div>

            <div class="flex flex-col gap-2 p-2 bg-bgdark2">
                <span class='font-bold text-[1.2rem] font-quicksand'>Daftar Karyawan</span>
                {#each formSPL.answer.spl_detail as val1, i}
                    <div class="flex flex-col gap-1">
                        <Badge color='green' class='self-start'>{val1.name}</Badge>
                        <div class="flex p-2 px-3 gap-2 border border-bgside rounded-lg flex-wrap">
                            {#each val1.description.split(",").map(v => v.trim()) as val2, i}
                                <span class='text-wrap break-all'>{(i+1) + ". " + val2}</span>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
        <svelte:fragment slot="footer">
            <Button onclick={()=> formSPL.modalPreview = false} class='flex gap-2 px-3 py-2' pill>Close</Button>
        </svelte:fragment>
    </Modal>

    <Modal bind:open={formSRL.modalPreview} autoclose>
        <div class="flex flex-col gap-2 max-h-[85vh]">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {#if formSRL.answer.spl_id}
                    <MyInput type='text' disabled title='SRL ID' name="srl_id" bind:value={formSRL.answer.srl_id}/>    
                    <MyInput type='text' disabled title='Overtime (hours)' name="overtime" bind:value={formSRL.answer.overtime}/>
                    <MyInput type='text' disabled title='Realisasi Start' name="real_start" bind:value={formSRL.answer.real_start}/>
                    <MyInput type='text' disabled title='Realisasi End' name="real_end" bind:value={formSRL.answer.real_end}/>
                    {#await getUserByDept() then val}
                        <div class="flex flex-col gap-2 flex-1">
                            <Label>Approval 1</Label>
                            <Svelecte class='rounded-lg' disabled bind:value={formSRL.answer.approval1} 
                                options={val.map((v:any) => ({value: v.payroll, text:v.payroll +" - "+ capitalEachWord(v.name)}))}
                            />
                        </div>
                        <div class="flex flex-col gap-2 flex-1">
                            <Label>Approval 2</Label>
                            <Svelecte class='rounded-lg' disabled bind:value={formSRL.answer.approval2} 
                                options={val.map((v:any) => ({value: v.payroll, text:v.payroll +" - "+ capitalEachWord(v.name)}))}
                            />
                        </div>
                    {/await}
                {/if}
            </div>

            <div class="flex flex-col gap-1">
                <span class='text-[.9rem] italic'>Job description and status</span>
                {#each formSRL.answer.srl_detail as val1, i}
                    <div class="flex items-center gap-1 flex-wrap p-2 border-[1px] border-bgside rounded-lg">
                        <Badge class='self-start'>{val1.status}</Badge>
                        <span class="text-[.8rem] text-wrap break-all italic">{val1.description}</span>
                    </div>
                {/each}
            </div>
            <span class='text-[.8rem]'>createdBy <Badge color='dark'>{capitalEachWord(formSRL.createdByName)}</Badge> </span>
        </div>
        <svelte:fragment slot="footer">
            <Button onclick={()=> formSPL.modalPreview = false} class='flex gap-2 px-3 py-2' pill>Close</Button>
        </svelte:fragment>
    </Modal>
    
    <Tabs contentClass='bg-bgdark' tabStyle="pill">
        <TabItem open title="Surat Perintah Lembur" onclick={()=> modeLembur.tabNo = 1}>
            <Tabs contentClass='bg-bgdark' tabStyle="underline">
                <TabItem open title="List">
                    <div class="flex flex-col gap-4 pt-4">
                        {#if formSPL.error}
                            {#each formSPL.error.split(';') as v}
                                <MyAlert pesan={v} func={()=> formSPL.error = ""} color='red'/>
                            {/each}
                        {:else if formSPL.success}
                            <MyAlert pesan={formSPL.success} func={()=> formSPL.success = ""} color='green'/>
                        {/if}
        
                        <div class="flex gap-2">                        
                            {#if formSPL.add || formSPL.edit}
                                {#if pecahArray(userProfile?.access_spl, "C") || pecahArray(userProfile.access_spl, "U")}
                                    <MyButton onclick={formSPLBatal}><Ban size={16} /></MyButton>
                                    <MyButton disabled={formSPL.loading} onclick={formSPLSubmit}><Save size={16}/></MyButton>
                                {/if}
                            {:else}
                                {#if pecahArray(userProfile?.access_spl, "C") && user.level > 1}
                                    <MyButton onclick={()=> formSPL.add = true}><Plus size={16}/></MyButton>
                                {/if}
                            {/if}
                        </div>
        
                        {#if formSPL.loading}
                            <MyLoading message="Loading data"/>
                        {/if}

                        {#if formSPL.add || formSPL.edit}
                            <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                                <MyInput type='textarea' title={`Purpose`} name="purpose" bind:value={formSPL.answer.purpose}/>
                                
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <input type='hidden' name="spl_id" disabled={formSPL.edit} bind:value={formSPL.answer.spl_id}/>
                                    
                                    <div class="flex flex-col gap-2 flex-1">
                                        <Label>Estimated Start</Label>
                                        <MyDatePicker bind:value={formSPL.answer.est_start} time />
                                    </div>
                                    <div class="flex flex-col gap-2 flex-1">
                                        <Label>Estimated End</Label>
                                        <MyDatePicker bind:value={formSPL.answer.est_end} time />
                                    </div>
                                    {#await getUserByDept() then val}
                                        <div class="flex flex-col gap-2 flex-1">
                                            <Label>Approval 1</Label>
                                            <Svelecte class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={formSPL.answer.approval1} 
                                                options={val.map((v:any) => ({value: v.payroll, text:v.payroll +" - "+v.name}))}
                                            />
                                        </div>
                                    {/await}
                                </div>
        
                                <div class="flex flex-col gap-3 bg-bgdark2 p-4 rounded-lg border border-slate-300">
                                    {#each formSPL.answer.spl_detail as list, i}
                                        <div class="flex flex-col gap-2">
                                            <div class="flex gap-2 items-end">
                                                {#await getUserForLembur() then val}
                                                    <div class="flex flex-col gap-2 flex-1">
                                                        <Label>{`Employee ${i+1}`}</Label>
                                                        <Svelecte class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={list.payroll} 
                                                            options={val.map((v:any) => ({value: v.payroll, text:v.payroll +" - "+v.name}))}
                                                        />
                                                    </div>
                                                {/await}
                                                
                                                {#if i == formSPL.answer.spl_detail.length - 1}
                                                    <MyButton onclick={()=>formSPL.answer.spl_detail.push({payroll:"", description:""})}><Plus size={14} color='green' /></MyButton>
                                                {/if}
                                                {#if formSPL.answer.spl_detail.length > 1}
                                                    <MyButton onclick={()=> formSPL.answer.spl_detail.splice(i, 1)}><Minus size={14} color='red' /></MyButton>
                                                {/if}
                                            </div>
                                            <div class="flex flex-1 flex-col">
                                                <MyInput type='textarea' title={`Job List ${i+1}`} name="description" bind:value={list.description}/>
                                                <span class='text-[.8rem] italic'>Untuk beberapa pekerjaan pisahkan dengan tanda koma (,)</span>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                                <span class='text-[.8rem]'>createdBy <Badge color='dark'>{capitalEachWord(user.name)}</Badge> </span>
                            </form>
                        {/if}
                        
                        <div class="flex flex-col gap-4">
                            <div class="flex gap-2 items-start">
                                <select bind:value={tableSPL.rowsPerPage} onchange={() => tableSPL.setPage(1)}>
                                    {#each [10, 20, 50, 100] as option}
                                        <option value={option}>{option}</option>
                                    {/each}
                                </select>
                                <select bind:value={formSPL.year} onchange={()=> tableSPL.setPage(1)}>
                                    {#each dataTahun as {title, value}}
                                        <option value={value}>
                                            {title} {value.toString() == format(modeLembur.periode.start, "yyyy") ? "(Select)" : null}
                                        </option>
                                    {/each}
                                </select>
                                <select bind:value={formSPL.month} onchange={()=> tableSPL.setPage(1)}>
                                    <option value={''}>Semua</option>
                                    {#each dataBulan as {title, value}}
                                        <option value={value}>
                                            {title} {value == Number(format(modeLembur.periode.end, "M")) - 1 ? "(Select)" : null}
                                        </option>
                                    {/each}
                                </select>
                                <div class="flex w-full flex-col">
                                    <MyInput type='text' bind:value={tableSPLSearch.value} onkeydown={(e: KeyboardEvent) => {
                                        if(e.key.toLowerCase() === 'enter') tableSPLSearch.set()
                                    }}/>
                                    <span class="italic text-[.8rem]">Pencarian tanggal mengikuti format "2025-12-30"</span>
                                </div>
                                <MyButton onclick={()=>tableSPLSearch.set()}><Search size={16} /></MyButton>
                                <MyButton onclick={()=>tableSPL.invalidate()}><RefreshCw size={16}/></MyButton>
                            </div>
                        </div>
                        
                        <Datatable table={tableSPL}>
                            <Table>
                                <TableHead class="bg-slate-500" >
                                    <ThSort table={tableSPL} field="spl_id">SPL ID</ThSort>
                                    <ThSort table={tableSPL} field="purpose">Deskripsi</ThSort>
                                    <ThSort table={tableSPL} field="est_start">Hari</ThSort>
                                    <ThSort table={tableSPL} field="est_start">Tanggal Mulai</ThSort>
                                    <ThSort table={tableSPL} field="est_end">Tanggal Selesai</ThSort>
                                    <ThSort table={tableSPL} field="approval1">Approval 1</ThSort>
                                    {#if pecahArray(userProfile.access_spl, "U") || pecahArray(userProfile.access_spl, "D")}
                                        <ThSort table={tableSPL} field="">#</ThSort>
                                    {/if}
                                </TableHead>
        
                                {#if tableSPL.isLoading}
                                    <div class="flex p-4 items-center">
                                        <MyLoading message="Loading data"/>
                                    </div>
                                {:else}
                                    <TableBody tableBodyClass="divide-y">
                                        {#if tableSPL.rows.length > 0}
                                            {#each tableSPL.rows as row}
                                                <TableBodyRow class='h-10'>
                                                    <TableBodyCell tdClass='break-all font-medium'>{row.spl_id?.replace(/\_/g, '/')}</TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>{row.purpose}</TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>{namaHari[Number(format(row.est_start, "c")) - 1]}</TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.est_start, "datetime", "app")}</TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.est_end, "datetime", "app")}</TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <div class="flex flex-col items-start gap-2">
                                                            <Badge color='indigo'>{capitalEachWord(row.approval1)}</Badge>
                                                            <div class="flex gap-2">
                                                                <Badge color={
                                                                    ['Reject','Cancelled'].includes(row.status1) ? "red" :
                                                                    row.status1 == "Approved" ? "green" : "dark"}>{row.status1}
                                                                </Badge>
                                                                {#if row.acknowledgeBy}
                                                                <Badge color={"green"}>Review HR</Badge>
                                                                {/if}
                                                            </div>
                                                        </div>
                                                    </TableBodyCell>
                                                    <TableBodyCell>
                                                        {#if !formSPL.edit}
                                                            {#if (pecahArray(userProfile.access_spl, "U") || pecahArray(userProfile.access_spl, "D")) && row.status1 == 'Waiting' && user.level > 1}
                                                                {#if pecahArray(userProfile.access_spl, "U")}<MyButton onclick={()=> formSPLEdit(row.spl_id)}><Pencil size={12} /></MyButton>{/if}
                                                                {#if pecahArray(userProfile.access_spl, "D")}
                                                                    <MyButton onclick={()=> {
                                                                        formSPL.modalDelete = true
                                                                        formSPL.answer.spl_id = row.spl_id
                                                                    }}><Trash size={12} /></MyButton>
                                                                    <Tooltip>Hapus</Tooltip>
                                                                {/if}
                                                            {/if}
                                                            {#if row.status1 == 'Approved'}
                                                                {#if row.acknowledgeBy}
                                                                <MyButton onclick={()=> handleCetakSPL(row.spl_id)}><Printer size={12} /></MyButton>
                                                                <Tooltip>Print</Tooltip>
                                                                {/if}
                                                                {#if !row.acknowledgeBy && user.user_type == 'HR'}
                                                                    <MyButton onclick={()=> handleAcknowledgedSPL(row.spl_id)}>Acknowledge</MyButton>
                                                                    <Tooltip>Acknowledge</Tooltip>
                                                                {/if}
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
                            <MyPagination table={tableSPL}/>
                        </Datatable>
                    </div>
                </TabItem>
                {#if user.level > 1}
                    <TabItem title="Approve SPL">
                        <div class="flex flex-col gap-4 pt-4">
                            {#if formSPLApproval1.error}
                                {#each formSPLApproval1.error.split(';') as v}
                                    <MyAlert pesan={v} func={()=> formSPLApproval1.error = ""} color='red'/>
                                {/each}
                            {:else if formSPLApproval1.success}
                                <MyAlert pesan={formSPLApproval1.success} func={()=> formSPLApproval1.success = ""} color='green'/>
                            {/if}
            
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableSPLApproval1.invalidate()}><RefreshCw size={16}/></MyButton>
                            </div>
                            
                            <Datatable table={tableSPLApproval1}>
                                <Table>
                                    <TableHead>
                                        <ThSort table={tableSPLApproval1} field="purpose">Deskripsi</ThSort>
                                        <ThSort table={tableSPLApproval1} field="est_start">Tanggal Mulai</ThSort>
                                        <ThSort table={tableSPLApproval1} field="est_end">Tanggal Selesai</ThSort>
                                        <ThSort table={tableSPLApproval1} field="approval1">Approval</ThSort>
                                        <ThSort table={tableSPLApproval1} field="">#</ThSort>
                                    </TableHead>
            
                                    {#if tableSPLApproval1.isLoading}
                                        <div class="flex p-4 items-center">
                                            <MyLoading message="Loading data"/>
                                        </div>
                                    {:else}
                                        <TableBody tableBodyClass="divide-y">
                                            {#if tableSPLApproval1.rows.length > 0}
                                                {#each tableSPLApproval1.rows as row}
                                                    <TableBodyRow class='h-10'>
                                                        <TableBodyCell tdClass='break-all font-medium'>{row.purpose}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.est_start, "datetime", "app") || ""}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.est_end, "datetime", "app") || ""}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{row.approval1}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>
                                                            {#if row.status1 == "Waiting"}
                                                                <Button onclick={()=> handleApproveSPL1(row.spl_id, 'Approved')} color='green' class='p-2' pill><Check size={14} /></Button>
                                                                <Tooltip>Approve SPL</Tooltip>
                                                                <Button onclick={()=> handleApproveSPL1(row.spl_id, 'Reject')} color='red' class='p-2' pill><X size={14} /></Button>
                                                                <Tooltip>Reject SPL</Tooltip>
                                                                <Button onclick={()=> showPreviewSPL(row.spl_id)} color='dark' class='p-2' pill><Eye size={14} /></Button>
                                                                <Tooltip>Preview SPL</Tooltip>
                                                            {/if}
                                                        </TableBodyCell>
                                                    </TableBodyRow>
                                                {/each}
                                            {:else}
                                                <TableBodyRow class='h-10'>
                                                    <TableBodyCell colspan={10}><span>No data available</span></TableBodyCell>
                                                </TableBodyRow>
                                            {/if}
                                        </TableBody>
                                    {/if}
                                </Table>
                                <MyPagination table={tableSPLApproval1}/>
                            </Datatable>
                        </div>
                    </TabItem>
                {/if}
            </Tabs>
        </TabItem>
        
        <TabItem title="Surat Realisasi Lembur" onclick={()=> modeLembur.tabNo = 2}>
            <Tabs contentClass='bg-bgdark' tabStyle="underline">
                <TabItem open title="List">
                    <div class="flex flex-col gap-4 pt-4">
                        {#if formSRL.error}
                            {#each formSRL.error.split(';') as v}
                                <MyAlert pesan={v} func={()=> formSRL.error = ""} color='red'/>
                            {/each}
                        {:else if formSRL.success}
                            <MyAlert pesan={formSRL.success} func={()=> formSRL.success = ""} color='green'/>
                        {/if}
        
                        <div class="flex gap-2">                        
                            {#if formSRL.add || formSRL.edit}
                                {#if pecahArray(userProfile?.access_srl, "C") || pecahArray(userProfile.access_srl, "U")}
                                    <MyButton onclick={formSRLBatal}><Ban size={16} /></MyButton>
                                    <MyButton disabled={formSRL.loading} onclick={formSRLSubmit}><Save size={16}/></MyButton>
                                {/if}
                            {:else}
                                {#if pecahArray(userProfile?.access_srl, "C")}
                                    <MyButton onclick={()=> formSRL.add = true}><Plus size={16}/></MyButton>
                                {/if}
                            {/if}
                        </div>
        
                        {#if formSRL.loading}
                            <MyLoading message="Load SPL data"/>
                        {/if}
                        {#if formSRL.add || formSRL.edit}
                            <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                                {#if formSRL.add}
                                    {#await getSPL()}
                                        <MyLoading message="Loading data..."/>
                                    {:then val}
                                        <div class="flex flex-col gap-2 flex-1">
                                            <Label>SPL ID</Label>
                                            <Svelecte class='rounded-lg' disabled={formSRL.edit} clearable searchable selectOnTab multiple={false} bind:value={formSRL.answer.spl_id} 
                                                options={val.map((v:any) => ({value: v.spl_id, text:v.spl_id.replace(/\_/g, '/') + " - " + v.purpose}))}
                                                onChange={(e:any) => getSPLAll(e.value)}
                                            />
                                        </div>
                                    {/await}
                                {/if}
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {#if formSRL.answer.spl_id}
                                        {#if formSRL.edit}
                                            <MyInput type='text' disabled title='SPL ID' name="spl_id" bind:value={formSRL.answer.spl_id}/>    
                                            <MyInput type='text' disabled title='SRL ID' name="srl_id" bind:value={formSRL.answer.srl_id}/>    
                                        {/if}
                                        <MyInput type='datetime' disabled title='Real Start' name="real_start" bind:value={formSRL.answer.real_start}/>
                                        <MyInput type='datetime' disabled title='Real End' name="real_end" bind:value={formSRL.answer.real_end}/>
                                        {#await getUserAtasan(user.payroll) then val}
                                            <div class="flex flex-col gap-2 flex-1">
                                                <Label>Approval 1</Label>
                                                <Svelecte class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={formSRL.answer.approval1} 
                                                    options={val.map((v:any) => ({value: v.payroll, text:v.payroll +" - "+v.name}))}
                                                />
                                            </div>
                                            <div class="flex flex-col gap-2 flex-1">
                                                <Label>Approval 2</Label>
                                                <Svelecte class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={formSRL.answer.approval2} 
                                                    options={val.map((v:any) => ({value: v.payroll, text:v.payroll +" - "+v.name}))}
                                                />
                                            </div>
                                        {/await}
                                        <MyInput type='text' title='Overtime (hours)' name="overtime" bind:value={formSRL.answer.overtime} disabled/>
                                    {/if}
                                </div>
        
                                {#if formSRL.answer.spl_id}
                                    <div class="flex flex-col gap-3 bg-bgdark2 p-4 rounded-lg border border-slate-300">
                                        {#each formSRL.answer.srl_detail as list, i}
                                            <div class="flex flex-col gap-2">
                                                <div class="flex gap-2 items-end">
                                                    <div class="flex flex-1 flex-col gap-2">
                                                        <Label>Status {i + 1}</Label>
                                                        <select bind:value={list.status}>
                                                            {#each ["Hold", "On Progress", "Completed"] as option}
                                                                <option value={option}>{option}</option>
                                                            {/each}
                                                        </select>
                                                    </div>
                                                </div>
                                                <MyInput type='textarea' disabled title={`Job List ${i+1}`} name="description" bind:value={list.description}/>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                                <span class='text-[.8rem]'>createdBy <Badge color='dark'>{capitalEachWord(user.name)}</Badge> </span>
                            </form>
                        {/if}
                        
                        <div class="flex flex-col gap-4">
                            <div class="flex gap-2 items-start">
                                <select bind:value={tableSRL.rowsPerPage} onchange={() => tableSRL.setPage(1)}>
                                    {#each [10, 20, 50, 100] as option}
                                        <option value={option}>{option}</option>
                                    {/each}
                                </select>
                                <select bind:value={formSRL.year} onchange={()=> tableSRL.setPage(1)}>
                                    {#each dataTahun as {title, value}}
                                        <option value={value}>
                                            {title} {value.toString() == format(modeLembur.periode.start, "yyyy") ? "(Select)" : null}
                                        </option>
                                    {/each}
                                </select>
                                <select bind:value={formSRL.month} onchange={()=> tableSRL.setPage(1)}>
                                    {#each dataBulan as {title, value}}
                                        <option value={value}>
                                            {title} {value == Number(format(modeLembur.periode.end, "M")) - 1 ? "(Select)" : null}
                                        </option>
                                    {/each}
                                </select>
                                <div class="flex w-full flex-col">
                                    <MyInput type='text' bind:value={tableSRLSearch.value} onkeydown={(e: KeyboardEvent) => {
                                        if(e.key.toLowerCase() === 'enter') tableSRLSearch.set()
                                    }}/>
                                    <span class="italic text-[.8rem]">Pencarian tanggal mengikuti format "2025-12-30"</span>
                                </div>
                                <MyButton onclick={()=>tableSRLSearch.set()}><Search size={16} /></MyButton>
                                <MyButton onclick={()=>tableSRL.invalidate()}><RefreshCw size={16}/></MyButton>
                            </div>
                        </div>
                        
                        <Datatable table={tableSRL}>
                            <Table>
                                <TableHead class="bg-slate-500" >
                                    <ThSort table={tableSRL} field="srl_id">SRL ID</ThSort>
                                    <ThSort table={tableSRL} field="real_start">Tanggal</ThSort>
                                    <ThSort table={tableSRL} field="name">Nama</ThSort>
                                    <ThSort table={tableSRL} field="real_start">Jam Mulai</ThSort>
                                    <ThSort table={tableSRL} field="real_start">Jam Selesai</ThSort>
                                    <ThSort table={tableSRL} field="real_end">Total Jam</ThSort>
                                    <ThSort table={tableSRL} field="approval1">Approval 1</ThSort>
                                    <ThSort table={tableSRL} field="approval2">Approval 2</ThSort>
                                    <ThSort table={tableSRL} field="">#</ThSort>
                                </TableHead>
        
                                {#if tableSRL.isLoading}
                                    <div class="flex p-4 items-center">
                                        <MyLoading message="Loading data"/>
                                    </div>
                                {:else}
                                    <TableBody tableBodyClass="divide-y">
                                        {#if tableSRL.rows.length > 0}
                                            {#each tableSRL.rows as row}
                                                <TableBodyRow class='h-10'>
                                                    <TableBodyCell tdClass='break-all font-medium'>{row.srl_id.replace(/\_/g, '/')}</TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <div class={format(formatTanggal(row.real_start), "EEE") == "Sun" ? "text-red-500":""}>
                                                            {namaHari[Number(format(formatTanggal(row.real_start), "c")) - 1]},  
                                                            {formatTanggal(row.real_start, "date","app")}
                                                        </div>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>{capitalEachWord(row.name)}</TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.real_start, "time")}</TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.real_end, "time")}</TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <Badge rounded color={"green"}>
                                                            + {formatDifference({ round_up: setting?.overtime_round_up, overtime: setting?.overtime_allow, ...selisihWaktu(row.real_end, row.real_start)})}
                                                        </Badge>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <div class="flex flex-col items-start gap-2">
                                                            <Badge color='indigo'>{capitalEachWord(row.approval1)}</Badge>
                                                            <Badge color={
                                                                ['Reject','Cancelled'].includes(row.status1) ? "red" :
                                                                row.status1 == "Approved" ? "green" : "dark"}>{row.status1}
                                                            </Badge>
                                                        </div>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <div class="flex flex-col items-start gap-2">
                                                            <Badge color='indigo'>{capitalEachWord(row.approval2)}</Badge>
                                                            <Badge color={
                                                                ['Reject','Cancelled'].includes(row.status2) ? "red" :
                                                                row.status2 == "Approved" ? "green" : "dark"}>{row.status2}
                                                            </Badge>
                                                        </div>
                                                    </TableBodyCell>                                                    
                                                    <TableBodyCell>
                                                        {#if !formSRL.edit}
                                                            {#if (pecahArray(userProfile.access_srl, "U") || pecahArray(userProfile.access_srl, "D")) && row.status1 == 'Waiting' && row.status2 == 'Waiting'}
                                                                {#if pecahArray(userProfile.access_srl, "U")}
                                                                    <MyButton onclick={()=> formSRLEdit(row.srl_id)}><Pencil size={12} /></MyButton>
                                                                    <Tooltip>Edit</Tooltip>
                                                                {/if}
                                                                {#if pecahArray(userProfile.access_srl, "D")}
                                                                    <MyButton onclick={()=> {
                                                                        formSRL.modalDelete = true
                                                                        formSRL.answer.srl_id = row.srl_id
                                                                    }}><Trash size={12} /></MyButton>
                                                                    <Tooltip>Hapus</Tooltip>
                                                                {/if}
                                                            {/if}
                                                            {#if row.status1 == 'Approved' && row.status2 == 'Approved'}
                                                                <MyButton onclick={()=> handleCetakSRL(row.srl_id)}><Printer size={12} /></MyButton>
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
                            <MyPagination table={tableSRL}/>
                        </Datatable>
                    </div>
                </TabItem>
                {#if user.level > 1}
                    <TabItem title="Approve SRL 1">
                        <div class="flex flex-col gap-4 pt-4">
                            {#if formSRLApproval1.error}
                                {#each formSRLApproval1.error.split(';') as v}
                                    <MyAlert pesan={v} func={()=> formSRLApproval1.error = ""} color='red'/>
                                {/each}
                            {:else if formSRLApproval1.success}
                                <MyAlert pesan={formSRLApproval1.success} func={()=> formSRLApproval1.success = ""} color='green'/>
                            {/if}
            
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableSRLApproval1.invalidate()}><RefreshCw size={16}/></MyButton>
                            </div>
                            
                            <Datatable table={tableSRLApproval1}>
                                <Table>
                                    <TableHead>
                                        <ThSort table={tableSRLApproval1} field="payroll">Payroll</ThSort>
                                        <ThSort table={tableSRLApproval1} field="real_start">Tanggal Mulai</ThSort>
                                        <ThSort table={tableSRLApproval1} field="real_end">Tanggal Selesai</ThSort>
                                        <ThSort table={tableSRLApproval1} field="approval1">Approval 1</ThSort>
                                        <ThSort table={tableSRLApproval1} field="">#</ThSort>
                                    </TableHead>
            
                                    {#if tableSRLApproval1.isLoading}
                                        <div class="flex p-4 items-center">
                                            <MyLoading message="Loading data"/>
                                        </div>
                                    {:else}
                                        <TableBody tableBodyClass="divide-y">
                                            {#if tableSRLApproval1.rows.length > 0}
                                                {#each tableSRLApproval1.rows as row}
                                                    <TableBodyRow class='h-10'>
                                                        <TableBodyCell tdClass='break-all font-medium'>{row.payroll}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.real_start, "datetime", "app") || ""}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.real_end, "datetime", "app") || ""}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{row.approval1}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>
                                                            {#if row.status1 == "Waiting"}
                                                                <Button onclick={()=> handleApproveSRL1(row.srl_id, 'Approved')} color='green' class='p-2' pill><Check size={14} /></Button>
                                                                <Tooltip>Approve SRL</Tooltip>
                                                                <Button onclick={()=> handleApproveSRL1(row.srl_id, 'Reject')} color='red' class='p-2' pill><X size={14} /></Button>
                                                                <Tooltip>Reject SRL</Tooltip>
                                                                <Button onclick={()=> showPreviewSRL(row.srl_id)} color='dark' class='p-2' pill><Eye size={14} /></Button>
                                                                <Tooltip>Preview SRL</Tooltip>
                                                            {/if}
                                                        </TableBodyCell>
                                                    </TableBodyRow>
                                                {/each}
                                            {:else}
                                                <TableBodyRow class='h-10'>
                                                    <TableBodyCell colspan={10}><span>No data available</span></TableBodyCell>
                                                </TableBodyRow>
                                            {/if}
                                        </TableBody>
                                    {/if}
                                </Table>
                                <MyPagination table={tableSRLApproval1}/>
                            </Datatable>
                        </div>
                    </TabItem>
                    <TabItem title="Approve SRL 2">
                        <div class="flex flex-col gap-4 pt-4">
                            {#if formSRLApproval2.error}
                                {#each formSRLApproval2.error.split(';') as v}
                                    <MyAlert pesan={v} func={()=> formSRLApproval2.error = ""} color='red'/>
                                {/each}
                            {:else if formSRLApproval2.success}
                                <MyAlert pesan={formSRLApproval2.success} func={()=> formSRLApproval2.success = ""} color='green'/>
                            {/if}
            
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableSRLApproval2.invalidate()}><RefreshCw size={16}/></MyButton>
                            </div>
                            
                            <Datatable table={tableSRLApproval2}>
                                <Table>
                                    <TableHead>
                                        <ThSort table={tableSRLApproval2} field="payroll">Payroll</ThSort>
                                        <ThSort table={tableSRLApproval2} field="real_start">Tanggal Mulai</ThSort>
                                        <ThSort table={tableSRLApproval2} field="real_end">Tanggal Selesai</ThSort>
                                        <ThSort table={tableSRLApproval2} field="approval2">Approval 2</ThSort>
                                        <ThSort table={tableSRLApproval2} field="">#</ThSort>
                                    </TableHead>
            
                                    {#if tableSRLApproval2.isLoading}
                                        <div class="flex p-4 items-center">
                                            <MyLoading message="Loading data"/>
                                        </div>
                                    {:else}
                                        <TableBody tableBodyClass="divide-y">
                                            {#if tableSRLApproval2.rows.length > 0}
                                                {#each tableSRLApproval2.rows as row}
                                                    <TableBodyRow class='h-10'>
                                                        <TableBodyCell tdClass='break-all font-medium'>{row.payroll}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.real_start, "datetime","app") || ""}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.real_end, "datetime", "app") || ""}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{row.approval2}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>
                                                            {#if row.status2 == "Waiting"}
                                                                <Button onclick={()=> handleApproveSRL2(row.srl_id, 'Approved')} color='green' class='p-2' pill><Check size={14} /></Button>
                                                                <Tooltip>Approve SRL</Tooltip>
                                                                <Button onclick={()=> handleApproveSRL2(row.srl_id, 'Reject')} color='red' class='p-2' pill><X size={14} /></Button>
                                                                <Tooltip>Reject SRL</Tooltip>
                                                                <Button onclick={()=> showPreviewSRL(row.srl_id)} color='dark' class='p-2' pill><Eye size={14} /></Button>
                                                                <Tooltip>Preview SRL</Tooltip>
                                                            {/if}
                                                        </TableBodyCell>
                                                    </TableBodyRow>
                                                {/each}
                                            {:else}
                                                <TableBodyRow class='h-10'>
                                                    <TableBodyCell colspan={10}><span>No data available</span></TableBodyCell>
                                                </TableBodyRow>
                                            {/if}
                                        </TableBody>
                                    {/if}
                                </Table>
                                <MyPagination table={tableSRLApproval2}/>
                            </Datatable>
                        </div>
                    </TabItem>
                {/if}
            </Tabs>
        </TabItem>
    </Tabs>
</main>