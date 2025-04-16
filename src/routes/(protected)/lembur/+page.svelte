<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Tabs, TabItem, Toast, Badge, Select, Label, Alert } from 'flowbite-svelte';
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import MyLoading from '@/MyLoading.svelte';
	import MyButton from '@/MyButton.svelte';
	import { Ban, Check, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, CloudCog, Minus, Pencil, Plus, Printer, RefreshCw, Save, Search, Trash, X } from '@lucide/svelte';
	import MyInput from '@/MyInput.svelte';
	import axios from 'axios';
	import { pecahArray, formatTanggal, getPeriode } from '@lib/utils.js';
    import { getParams } from '@lib/data/api';
	import { differenceInHours, format, set, setDate, startOfDay, subMonths } from 'date-fns';
    import Svelecte from 'svelecte'
    import bglembur from '@lib/assets/bg-lembur.jpg'
    import stm from '@lib/assets/stm.png'
    import { jsPDF } from "jspdf";
	import { z } from 'zod';
	import { fromZodError } from 'zod-validation-error';
    
    let {data} = $props()
    let user = $derived(data.user) 
    let userProfile = $derived(data.userProfile)

    const rowsPerPage = 10
    
    let tableSPL = $state(new TableHandler([], {rowsPerPage}))
    let tableSPLSearch = tableSPL.createSearch()
    
    const formSPLAnswer = {
        answer:{
            spl_id: "id",
            purpose:"",
            dept: user?.department,
            spl_detail:[{payroll:"",description:""}],
            est_start:"",
            est_end:"",
            createdBy: user?.payroll,
        },
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    }
    
    let formSPL = $state({...formSPLAnswer})
    
    const formSPLSubmit = async () =>{
        try {
            formSPL.loading = true
            const valid = z.object({
                spl_id: z.string().trim().min(1),
                purpose: z.string().trim().min(5),
                spl_detail: z.array(z.object({
                    payroll: z.string().trim().min(1).max(8),
                    description: z.string().trim().min(1).max(255),
                })),
                est_start: z.string().trim().min(1),
                est_end: z.string().trim().min(1),
                createdBy: z.string().trim().min(1),
            })
            const isValid = valid.safeParse(formSPL.answer)
            if(isValid.success){
                const req = await axios.post('/api/lembur/spl', formSPL.answer)
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
            const req = await axios.get(`/api/lembur/spl/${id}`)
            const res = await req.data
            
            formSPL.answer = {...res,
                est_start: formatTanggal(res.est_start),
                est_end: formatTanggal(res.est_end),
                spl_detail: res.spl_detail.map(({payroll, description}) => ({payroll, description: description.trim() }))
            }
            formSPL.edit = true
            formSPL.add = false
            formSPL.loading = false
        } catch (error) {
            formSPL.loading = false
        }
    }
    
    const formSPLDelete = async (id:string) =>{
        formSPL.error = ""
        const req = await axios.delete(`/api/lembur/spl/${id}`)
        const res = await req.data
        formSPL.success = res.message
        tableSPL.invalidate()
    }

    const handleCetakSPL= async (id:string) =>{
        const req = await axios.get(`/api/lembur/spl/${id}`)
        const res = await req.data

        const doc = new jsPDF({
            orientation:"l",
            unit:"mm",
            format:"a4"
        })

        const colData = [10, 58, 62]
        const rowData = 0
        let rowInc = 0
        let row1 = 4
        let row2 = 6
        let row3 = 8
        let row4 = 10

        const spl_detail = res.spl_detail.find(v => v.payroll == user?.payroll)

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
        const rightAlign = 244
        doc.rect(rightAlign, rowData + rowInc - 5, 48, rowData + rowInc + 10 )
        doc.setFontSize(10)
        doc.text("Form No", rightAlign + 2, rowData + rowInc)
        doc.text(": 11-19", rightAlign + 20, rowData + rowInc)
        rowInc += 4
        doc.text("Rev", rightAlign + 2, rowData + rowInc)
        doc.text(": 2", rightAlign + 20, rowData + rowInc)
        rowInc += 4
        doc.text("Rev Date", rightAlign + 2, rowData + rowInc)
        doc.text(": 22 March 2021", rightAlign + 20, rowData + rowInc)
        
        rowInc += row4 * 1.6
        doc.text("OVERTIME AUTHORIZATION FORM", 110, rowData + rowInc)
        
        rowInc += row3
        doc.setFontSize(11)
        doc.text("Document No", colData[0], rowData + rowInc)
        doc.text(`:  ${res.spl_id.replace(/\_/g, '/')}`, colData[0] + 30, rowData + rowInc)
        rowInc += 5
        doc.text("Date Prepare", colData[0], rowData + rowInc)
        doc.text(`:  ${format(new Date(), "dd MMMM yyyy")}`, colData[0] + 30, rowData + rowInc)
        rowInc += 5
        doc.text("Department", colData[0], rowData + rowInc)
        doc.text(`:  ${spl_detail.employee.dept.name}`, colData[0] + 30, rowData + rowInc)
        
        rowInc += row4
        const boxCheck = [10, 100, 166]
        doc.rect(boxCheck[0], rowData + rowInc - 4, 4, 4)
        doc.text(`Customer Requirement`, boxCheck[0] + 6, rowData + rowInc)
        doc.rect(boxCheck[1], rowData + rowInc - 4, 4, 4)
        doc.text(`Production Process`, boxCheck[1] + 6, rowData + rowInc)
        doc.rect(boxCheck[2], rowData + rowInc - 4, 4, 4)
        doc.text(`Project Requirements`, boxCheck[2] + 6, rowData + rowInc)

        rowInc += 2
        doc.rect(colData[0] - 2, rowData + rowInc, 280, 120)
        
        rowInc += row1
        
        rowInc += row3
        doc.text("Prepared by,", colData[0] + 10, rowData + rowInc)
        
        rowInc += row4 * 2
        doc.text("", colData[0] + 10, rowData + rowInc)

        doc.save(`${id}.pdf`);
    }
    
    // SRL
    let tableSRL = $state(new TableHandler([], {rowsPerPage}))
    let tableSRLSearch = tableSRL.createSearch()
    
    const formSRLAnswer = {
        answer:{
            srl_id: "id",
            spl_id: "",
            payroll: user?.payroll,
            real_start: "",
            real_end:"",
            overtime:0,
            srl_detail:[{description:"", status: ""}],
        },
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    }

    let formSRLDetailAnswer = $state([])
    
    let formSRL = $state({...formSRLAnswer})
    
    const formSRLSubmit = async () =>{
        try {
            formSRL.loading = true
            const valid = z.object({
                spl_id: z.string().trim().min(1),
            })
            const isValid = valid.safeParse(formSRL.answer)
            if(isValid.success){
                const req = await axios.post('/api/lembur/srl', formSRL.answer)
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
            const req = await axios.get(`/api/lembur/srl/${id}`)
            const res = await req.data
            
            formSRL.answer = {...res,
                real_start: formatTanggal(res.real_start),
                real_end: formatTanggal(res.real_end),
            }

            formSRL.edit = true
            formSRL.add = false
            formSRL.loading = false
        } catch (error) {
            formSRL.loading = false
        }
    }

    const handleCetakSRL= async (id:string) =>{
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
            doc.text(`: ${val.location}`, colData[1], rowData + rowInc)
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
        
        doc.save(`${res.sppd_id}.pdf`);
    }
    
    const getSPL = async () =>{
        const req = await fetch(`/api/data?type=spl_by_status&val=${user.payroll}`)
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
            const req = await fetch(`/api/data?type=user_by_dept&val=${user.department}`)
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
                const req = await fetch('/api/data?type=setting')
                const res = await req.json()
                if(res){
                    const temp = set(new Date(), {year: 2025, month: 3})
                    const {start_periode, end_periode} = getPeriode({...res, date: temp})

                    const req = await fetch(`/api/lembur/spl?${getParams(state)}&start_periode=${start_periode}&end_periode=${end_periode}`)
                    const {items, totalItems} = await req.json()
                    state.setTotalRows(totalItems)
                    return items
                }else{
                    throw new Error("Periode perlu disetting")
                }
            } catch (err:any) {
                console.log(err.message)
            }
        })

        tableSRL.load(async (state:State) => {
            try {
                const req = await fetch(`/api/lembur/srl?${getParams(state)}`)
                if(!req.ok) throw new Error('Gagal mengambil data')
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })
    })
    
    setTimeout(()=>{
        tableSPL.invalidate()
        tableSRL.invalidate()
    }, 1000)
</script>

<svelte:head>
    <title>Lembur</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem  title="Dashboard">
            <div class="relative flex items-center justify-center min-h-[70vh] rounded-lg" style={`background-image: url(${bglembur}); background-size: cover; background-position:top`}>
                <span class='text-white bg-slate-600/[.7] p-3 rounded-lg'>Overtime Page</span>
            </div>
        </TabItem>
        <TabItem open title="Surat Perintah Lembur">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                {#if formSPL.error}
                    {#each formSPL.error.split(';') as v}
                        <Alert dismissable>
                            <span>{v}</span>
                        </Alert>
                    {/each}
                {:else if formSPL.success}
                    <Alert border color="green" dismissable>
                        <span>{formSPL.success}</span>
                    </Alert>
                {/if}

                <div class="flex gap-2">                        
                    {#if formSPL.add || formSPL.edit}
                        {#if pecahArray(userProfile?.access_spl, "C") || pecahArray(userProfile.access_spl, "U")}
                            <MyButton onclick={formSPLBatal}><Ban size={16} /></MyButton>
                            <MyButton disabled={formSPL.loading} onclick={formSPLSubmit}><Save size={16}/></MyButton>
                        {/if}
                    {:else}
                        {#if pecahArray(userProfile?.access_spl, "C")}
                            <MyButton onclick={()=> formSPL.add = true}><Plus size={16}/></MyButton>
                        {/if}
                    {/if}
                </div>

                {#if formSPL.loading}
                    <MyLoading message="Get SPL data"/>
                {/if}
                {#if formSPL.add || formSPL.edit}
                    <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                        <MyInput type='textarea' title={`Purpose`} name="purpose" bind:value={formSPL.answer.purpose}/>
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <input type='hidden' name="spl_id" disabled={formSPL.edit} bind:value={formSPL.answer.spl_id}/>
                            
                            <MyInput type='datetime' title='Estimated Start' name="est_start" bind:value={formSPL.answer.est_start}/>
                            <MyInput type='datetime' title='Estimated End' name="est_end" bind:value={formSPL.answer.est_end}/>
                        </div>

                        <div class="flex flex-col gap-3 bg-bgdark2 p-4 rounded-lg border border-slate-300">
                            {#each formSPL.answer.spl_detail as list, i}
                                <div class="flex flex-col gap-2">
                                    <div class="flex gap-2 items-end">
                                        {#await getUserByDept() then val}
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
                                        <span class='text-[.8rem] italic'>For several jobs use comas as separator (,)</span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                        <span class='text-[.8rem]'>createdBy <Badge color='dark'>{user.name}</Badge> </span>
                    </form>
                {/if}
                
                <div class="flex gap-2">
                    <select bind:value={tableSPL.rowsPerPage} onchange={() => tableSPL.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <MyInput type='text' bind:value={tableSPLSearch.value}/>
                    <MyButton onclick={()=>tableSPLSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableSPL.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableSPL}>
                    <Table>
                        <TableHead class="bg-slate-500" >
                            <ThSort table={tableSPL} field="spl_id">SPL ID</ThSort>
                            <ThSort table={tableSPL} field="purpose">Purpose</ThSort>
                            <ThSort table={tableSPL} field="est_start">Datetime Start</ThSort>
                            <ThSort table={tableSPL} field="est_end">Datetime End</ThSort>
                            <ThSort table={tableSPL} field="createdAt">Created At</ThSort>
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
                                        <TableBodyRow>
                                            <TableBodyCell>{row.spl_id?.replace(/\_/g, '/')}</TableBodyCell>
                                            <TableBodyCell>{row.purpose}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.est_start)}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.est_end)}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.createdAt)}</TableBodyCell>
                                            {#if pecahArray(userProfile.access_spl, "U") || pecahArray(userProfile.access_spl, "D")}
                                                <TableBodyCell>
                                                    {#if pecahArray(userProfile.access_spl, "U")}<MyButton onclick={()=> formSPLEdit(row.spl_id)}><Pencil size={12} /></MyButton>{/if}
                                                    {#if pecahArray(userProfile.access_spl, "D")}<MyButton onclick={()=> formSPLDelete(row.spl_id)}><Trash size={12} /></MyButton>{/if}
                                                    <MyButton onclick={()=> handleCetakSPL(row.spl_id)}><Printer size={12} /></MyButton>
                                                </TableBodyCell>
                                            {/if}
                                        </TableBodyRow>
                                    {/each}
                                {:else}
                                    <TableBodyRow>
                                        <TableBodyCell>No data available</TableBodyCell>
                                    </TableBodyRow>
                                {/if}
                            </TableBody>
                        {/if}
                    </Table>
                    {#if tableSPL.rows.length > 0}
                        <div class="flex justify-between items-center gap-2 mt-3">
                            <p class='text-muted self-end text-[.9rem]'>
                                Showing {tableSPL.rowCount.start} to {tableSPL.rowCount.end} of {tableSPL.rowCount.total} rows
                                <Badge color="dark">Page {tableSPL.currentPage}</Badge>
                            </p>
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableSPL.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                <MyButton onclick={()=> tableSPL.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                {#each tableSPL.pages as page}
                                    <MyButton className={`text-muted text-[.9rem] px-3`} onclick={()=> tableSPL.setPage(page)} type="button">{page}</MyButton>
                                {/each}
                                <MyButton onclick={()=> tableSPL.setPage('next')}><ChevronRight size={16} /></MyButton>
                                <MyButton onclick={()=> tableSPL.setPage('last')}><ChevronLast size={16} /></MyButton>
                            </div>
                        </div>
                    {/if}
                </Datatable>
            </div>
        </TabItem>
        <TabItem title="Surat Realisasi Lembur">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                {#if formSRL.error}
                    {#each formSRL.error.split(';') as v}
                        <Alert dismissable>
                            <span>{v}</span>
                        </Alert>
                    {/each}
                {:else if formSRL.success}
                    <Alert color="green" dismissable>
                        <span>{formSRL.success}</span>
                    </Alert>
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
                    <MyLoading message="Get SPL data"/>
                {/if}
                {#if formSRL.add || formSRL.edit}
                    <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
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
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <input type='hidden' name="srl_id" disabled={formSRL.edit} bind:value={formSRL.answer.srl_id}/>
                            
                            {#if formSRL.answer.spl_id}
                                <MyInput type='datetime' disabled title='Real Start' name="real_start" bind:value={formSRL.answer.real_start}/>
                                <MyInput type='datetime' disabled title='Real End' name="real_end" bind:value={formSRL.answer.real_end}/>
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

                                            <!-- {#if i == formSRL.answer.srl_detail.length - 1}
                                                <MyButton onclick={()=>formSRL.answer.srl_detail.push({status:"", description:""})}><Plus size={14} color='green' /></MyButton>
                                            {/if}
                                            {#if formSRL.answer.srl_detail.length > 1}
                                                <MyButton onclick={()=> formSRL.answer.srl_detail.splice(i, 1)}><Minus size={14} color='red' /></MyButton>
                                            {/if} -->
                                        </div>
                                        <MyInput type='textarea' disabled title={`Job List ${i+1}`} name="description" bind:value={list.description}/>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                        <span class='text-[.8rem]'>createdBy <Badge color='dark'>{user.name}</Badge> </span>
                    </form>
                {/if}
                
                <div class="flex gap-2">
                    <select bind:value={tableSRL.rowsPerPage} onchange={() => tableSRL.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <MyInput type='text' bind:value={tableSRLSearch.value}/>
                    <MyButton onclick={()=>tableSRLSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableSRL.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableSRL}>
                    <Table>
                        <TableHead class="bg-slate-500" >
                            <ThSort table={tableSRL} field="srl_id">SRL ID</ThSort>
                            <ThSort table={tableSRL} field="spl_id">SPL ID</ThSort>
                            <ThSort table={tableSRL} field="name">Name</ThSort>
                            <ThSort table={tableSRL} field="real_start">Start</ThSort>
                            <ThSort table={tableSRL} field="real_start">End</ThSort>
                            <ThSort table={tableSRL} field="real_end">Duration</ThSort>
                            {#if pecahArray(userProfile.access_srl, "U") || pecahArray(userProfile.access_srl, "D")}
                                <ThSort table={tableSRL} field="">#</ThSort>
                            {/if}
                        </TableHead>

                        {#if tableSRL.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                            <TableBody tableBodyClass="divide-y">
                                {#if tableSRL.rows.length > 0}
                                    {#each tableSRL.rows as row}
                                        <TableBodyRow>
                                            <TableBodyCell>{row.srl_id.replace(/\_/g, '/')}</TableBodyCell>
                                            <TableBodyCell>{row.spl_id?.replace(/\_/g, '/')}</TableBodyCell>
                                            <TableBodyCell>{row.name}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.real_start)}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.real_end)}</TableBodyCell>
                                            <TableBodyCell>
                                                {differenceInHours(row.real_end,row.real_start)}  Hour
                                                {format(row.real_end, "mm") != "00" ? format(row.real_end, "mm") + " Minute" :""}
                                            </TableBodyCell>
                                            {#if pecahArray(userProfile.access_srl, "U") || pecahArray(userProfile.access_srl, "D")}
                                                <TableBodyCell>
                                                    {#if pecahArray(userProfile.access_srl, "U")}<MyButton onclick={()=> formSRLEdit(row.srl_id)}><Pencil size={12} /></MyButton>{/if}
                                                    <MyButton onclick={()=> handleCetakSRL(row.srl_id)}><Printer size={12} /></MyButton>
                                                    <!-- {#if pecahArray(userProfile.access_srl, "D")}<MyButton onclick={()=> formSRLDelete(row.spl_id)}><Trash size={12} /></MyButton>{/if} -->
                                                </TableBodyCell>
                                            {/if}
                                        </TableBodyRow>
                                    {/each}
                                {:else}
                                    <TableBodyRow>
                                        <TableBodyCell>No data available</TableBodyCell>
                                    </TableBodyRow>
                                {/if}
                            </TableBody>
                        {/if}
                    </Table>
                    {#if tableSRL.rows.length > 0}
                        <div class="flex justify-between items-center gap-2 mt-3">
                            <p class='text-muted self-end text-[.9rem]'>
                                Showing {tableSRL.rowCount.start} to {tableSRL.rowCount.end} of {tableSRL.rowCount.total} rows
                                <Badge color="dark">Page {tableSRL.currentPage}</Badge>
                            </p>
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableSRL.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                <MyButton onclick={()=> tableSRL.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                {#each tableSRL.pages as page}
                                    <MyButton className={`text-muted text-[.9rem] px-3`} onclick={()=> tableSRL.setPage(page)} type="button">{page}</MyButton>
                                {/each}
                                <MyButton onclick={()=> tableSRL.setPage('next')}><ChevronRight size={16} /></MyButton>
                                <MyButton onclick={()=> tableSRL.setPage('last')}><ChevronLast size={16} /></MyButton>
                            </div>
                        </div>
                    {/if}
                </Datatable>
            </div>
        </TabItem>
    </Tabs>
</main>