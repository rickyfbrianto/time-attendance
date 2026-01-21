<script lang="ts">
    import { fade } from 'svelte/transition'
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Label, Tabs, TabItem, Badge, Select, Radio, Modal, Button, Alert, Tooltip } from 'flowbite-svelte';
    import {Calendar, Ban, Search, RefreshCw, Building, Pencil, Trash, Plus, Save, Paperclip, IdCard, CalendarClock, BookOpen, CalendarCheck2, Sheet } from '@lucide/svelte'
	import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import TableAttendanceClockIn from '$/lib/components/TableAttendanceClockIn.svelte';
	import TableAttendanceClockOut from '$/lib/components/TableAttendanceClockOut.svelte';
	import TableAttendanceDifference from '$/lib/components/TableAttendanceDifference.svelte';
	import { formatTanggal, pecahArray, generatePeriode, namaHari, getParams, hitungDifference, formatDifference, formatLate, dataTahun, dataBulan, capitalEachWord, hitungJamMenit } from '$/lib/utils';
    import { format, getDay, set } from "date-fns";
	import axios from 'axios';
	import Svelecte from 'svelecte';
	import { z } from 'zod';
	import { fromZodError } from 'zod-validation-error';
    import { goto, invalidateAll } from '$app/navigation';
	import MyCalendar from '@/MyCalendar.svelte';
	import MyPagination from '@/MyPagination.svelte';
	import MyAlert from '@/MyAlert.svelte';
	import MyImage from '@/MyImage.svelte';
	import MyBadge from '@/MyBadge.svelte';
	import MyDatePicker from '@/MyDatePicker.svelte';
    import MyButton from '@/MyButton.svelte';
	import MyLoading from '@/MyLoading.svelte';
	import MyInput from '@/MyInput.svelte';
	import { useDept, useUserByDept } from '@lib/fetch.js';
    import * as xlsx from 'xlsx'
        
    const rowsPerPage = 30
    let {data} = $props()
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)
    let setting = $derived(data.periode)
    
    const filterType = [
        {value:"", title: "Semua"},
        {value:"HKC", title: "Hari Kerja Card"},
        {value:"HKM", title: "Hari Kerja Manual"},
        {value:"Ijin Resmi", title: "Ijin Resmi"},
        {value:"Cuti Resmi", title: "Cuti Resmi"},
        {value:"Cuti Bersama", title: "Cuti Bersama"},
        {value:"Cuti Tahunan", title: "Cuti Tahunan"},
        {value:"Dinas", title: "Dinas"},
        {value:"Sakit", title: "Sakit"},
        {value:"00:00:00", title: "Check In 00:00:00"},
    ]

    let headerData: {title:string, value:string, icon: any }[] = $state([])
    
    const listType = $derived.by(()=> {
        const temp = [
            {value:"HKM", name:"Hari Kerja Manual"},
            {value:"Mangkir", name:"Mangkir"},
            {value:"Off", name:"Off Security"},
            {value:"Sakit", name:"SAKIT"}
        ]
        // return temp.filter(v => v.value != (formAttendance.add ? "Mangkir" : "Sakit"))
        return temp.filter(v => formAttendance.add ? !["Mangkir","Off"].includes(v.value) : !["Sakit"].includes(v.value))
    })

    let tableAttendance = $state(new TableHandler([], {rowsPerPage}))
    let tableAttendanceSearch = tableAttendance.createSearch()
    
    const formAttendanceAnswer = {
        answer: {
            attendance_id: "id",
            user_id_machine: "",
            date:"",
            check_in: "",
            check_out: "",
            check_in2: "",
            check_out2: "",
            temp_type: "",
            type: "",
            ijin_info: "",
            description: "",
            // attachment: [],
            attachment: "",
            createdBy: (()=> user?.payroll)(),
        },
        dept: (()=> user.user_type == 'HR' ? "" : user?.department)(),
        payroll: (()=> user?.payroll)(),
        type:"",
        success:"",
        error:"",
        attachment: "",
        showCalendar: false,
        modal:false,
        modalAttachment:false,
        modalDelete:false,
        loading:false,
        add:false,
        edit:false,
    }

    let formAttendance = $state({...formAttendanceAnswer})

    let modeAttendance = $state({
        payroll: (()=> user?.payroll)(),
        name: "",
        periode: {
            start: "",
            end: "",
        },
        hari_kerja: 0,
        hari_weekend: 0,
        tabNo: 1
    })

    const formAttendanceSubmit = async () =>{
        try {            
            formAttendance.loading = true
            const valid = z.object({
                user_id_machine: z.string().trim().min(1),
                check_in: z.string().trim().min(1),
                check_out: z.string().trim().min(1),
                type: z.string().trim().min(1),
            })
            
            const formData = new FormData()
            Object.entries(formAttendance.answer).forEach(val=>{
                formData.append(val[0], val[1])
            })  

            const isValid = valid.safeParse(formAttendance.answer)
            if(isValid.success){
                const req = await axios.post('/api/attendance', formData)
                const res = await req.data
                formAttendanceBatal()
                tableAttendance.invalidate()
                tableAttendanceDept.invalidate()
                tableListAttendance.invalidate()
                tableLogAttendance.invalidate()
                formAttendance.success = res.message
            }else{
                const err = fromZodError(isValid.error)
                formAttendance.success = ""
                formAttendance.error = err.message
            }
        } catch (error: any) {
            formAttendance.error = error.response.data.message
            formAttendance.success = ""
        } finally {
            formAttendance.loading = false
        }
    }

    const formAttendanceAdd = () =>{
        formAttendance.add = true
        formAttendance.modal = true
        formAttendance.success = ""
        formAttendance.error = ""
    }

    const formAttendanceBatal = () => formAttendance = {...formAttendanceAnswer}
    
    const formAttendanceEdit = async (id:string) =>{
        try {
            formAttendance.success = ""
            formAttendance.error = ""
            formAttendance.modal = true
            formAttendance.loading = true
            const req = await axios.get(`/api/attendance/${id}`)
            const res = await req.data
            
            formAttendance.answer = {...res}
            formAttendance.answer.attachment = res.attachment == null ? null : res.attachment
            formAttendance.answer.check_in = formatTanggal(res.check_in)
            formAttendance.answer.check_out = formatTanggal(res.check_out)
            formAttendance.answer.check_in2 = formatTanggal(res.check_in2)
            formAttendance.answer.check_out2 = formatTanggal(res.check_out2)
            formAttendance.answer.temp_type = res.type
            formAttendance.answer.createdBy = user?.payroll

            formAttendance.edit = true
            formAttendance.add = false
            formAttendance.loading = false
        } catch (error) {
            formAttendance.loading = false
        }
    }

    const formAttendanceDelete = async (id:string) =>{
        try {
            formAttendance.loading = true
            const req = await axios.delete(`/api/attendance/${id}`)
            const res = await req.data
            tableAttendance.invalidate()
            tableAttendanceDept.invalidate()
            tableListAttendance.invalidate()
            tableLogAttendance.invalidate()
            formAttendance.success = res.message
        } catch (error: any) {
            formAttendance.error = error.response.data.message
            formAttendance.success = ""
        } finally {
            formAttendance.loading = false
        }
    }

    const showAttendanceAttachment = (id:string) =>{
        formAttendance.modalAttachment = true
        formAttendance.attachment = id
    }
    
    const handleBackToMyAttendance = () =>{
        modeAttendance.payroll = user?.payroll
        tableAttendance.invalidate()
        tableListAttendance.invalidate()
        tableLogAttendance.invalidate()
    }
    
    const handleReportAttendance = () => goto('/attendance/report')
    
    // Attendance dept
    let tableAttendanceDept = $state(new TableHandler([], {rowsPerPage}))
    let tableAttendanceDeptSearch = tableAttendanceDept.createSearch()
    
    let formAttendanceDept = $state({
        dept: (()=> user.user_type == 'HR' ? "" : user?.department)(),
        type:"",
        filterAbsen: "Semua"
    })

    const onExportExcel = async () => {
        const workbook = xlsx.utils.book_new()
        if (formAttendanceDept.dept) {
            const req = await fetch(`/api/attendance/excel?dept=${formAttendanceDept.dept || ""}&filterAbsen=${formAttendanceDept.filterAbsen}&type=${formAttendanceDept.type}&start_date=${modeAttendance.periode.start}&end_date=${modeAttendance.periode.end}`)
            if(!req.ok) throw new Error('Gagal mengambil data')
            const res = await req.json()

            const dataAllDept = res?.map((item, iItem) => {
                return {
                    No: iItem + 1, 
                    Payroll: item.payroll,
                    Nama: item.name,
                    CheckIn: item.check_in,
                }
            })

            xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(dataAllDept), `Summary ${formAttendanceDept.filterAbsen} Karyawan`)
            xlsx.writeFile(workbook, `Attendance ${formAttendanceDept.filterAbsen} Karyawan Department ${formAttendanceDept.dept}.xlsx`)
        }
    }

    // Attendance List for HRD
    let tableListAttendance = $state(new TableHandler([], {rowsPerPage}))
    let tableListAttendanceSearch = tableListAttendance.createSearch()

    let formListAttendance = $state({
        type:"",
    })

    // Attendance Log for HRD
    let tableLogAttendance = $state(new TableHandler([], {rowsPerPage}))
    let tableLogAttendanceSearch = tableLogAttendance.createSearch()
    
    let formLogAttendance = $state({
        attendance_id:"",
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        type:"",
        error:"",
        success:"",
        modalDelete: false,
        loading:false,
    })

    // Form SPL
    const formSPLAnswer = {
        answer:{
            spl_id: "id",
            purpose:"",
            dept: (()=> user?.department)(),
            spl_detail:[{payroll:"", description:""}],
            est_start:"",
            est_end:"",            
            approval1:"",
            createdBy: (()=> user?.payroll)(),
        },
        dept: (()=> user?.department)(),
        payroll: (()=> user.level > 1 ? "": user?.payroll)(),
        success:"",
        error:"",
        modalSPL: false,
        loading:false,
    }
    
    let formSPL = $state({...formSPLAnswer})

    const createSPL = (payroll: string, nama: string, check_in: string, check_out: string)=> {
        formSPL = {...formSPLAnswer}
        formSPL.modalSPL = true
        formSPL.answer.purpose = `Lembur ${nama} tanggal ${format(formatTanggal(check_in, "date"), "d MMMM yyyy")}`
        formSPL.answer.spl_detail[0].payroll = payroll
        formSPL.answer.est_start = formatTanggal(check_in)
        formSPL.answer.est_end = formatTanggal(check_out)
    }
    
    const formSPLSubmit = async () =>{
        try {
            formSPL.loading = true
            formSPL.error = ""
            formSPL.success = ""
            const valid = z.object({
                purpose: z.string().trim().min(1),
                approval1: z.string().trim().min(1),
                spl_detail: z.array(z.object({
                    description: z.string().trim().min(1)
                })),
                createdBy: z.string().trim().min(1),
            })
            const isValid = valid.safeParse(formSPL.answer)
            if(isValid.success){
                const req = await axios.post('/api/lembur/spl', formSPL.answer)
                const res = await req.data
                formSPL.success = res.message
                setTimeout(()=> {
                    formSPL = {...formSPLAnswer}
                    tableAttendance.invalidate()
                }, 1000)
            }else{
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
    
    const getAttendance = async ({val, year, month, start_date, end_date}: {val:string, year: number, month: number, start_date: string, end_date: string}) =>{
        const req = await fetch(`/api/data?type=sum_attendance_by_payroll&val=${val}&year=${year}&month=${month}&start_date=${start_date}&end_date=${end_date}`)
        const res = await req.json()
        setTimeout(()=> {
            modeAttendance.name = res.Name
            modeAttendance.hari_kerja = res.hari_kerja
            modeAttendance.hari_weekend = res.hari_weekend
            
            delete res.Name
            delete res.hari_kerja
            delete res.hari_weekend
            headerData = Object.entries(res).map(val => ({title:val[0], value:val[1] as string, icon:Calendar}))
        }, 100)
    }

    const getDept = useDept()
    
    const getUser = useUserByDept((() => formAttendance.dept)())

    const getUserByDept = useUserByDept((() => formSPL.dept)())

    $effect(()=>{
        tableAttendance.load(async(state: State) => {
            try {
                const req = await fetch(`/api/attendance?${getParams(state)}&payroll=${modeAttendance.payroll}&type=${formAttendance.type}&start_date=${modeAttendance.periode.start}&end_date=${modeAttendance.periode.end}`)
                if(!req.ok) throw new Error('Gagal mengambil data')
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        if (user.level > 1 || user.user_type == 'HR') {
            tableAttendanceDept.load(async (state: any) => {
                try {
                    const req = await fetch(`/api/attendance?${getParams(state)}&filterAbsen=${formAttendanceDept.filterAbsen}&dept=${formAttendanceDept.dept || ""}&type=${formAttendanceDept.type}&start_date=${modeAttendance.periode.start}&end_date=${modeAttendance.periode.end}`)
                    if(!req.ok) throw new Error('Gagal mengambil data')
                    const {items, totalItems} = await req.json()
                    state.setTotalRows(totalItems)
                    return items
                } catch (err:any) {
                    console.log(err.message)
                }
            })
        }

        if(user.user_type == 'HR'){
            tableListAttendance.load(async (state: any) => {
                try {
                    const req = await fetch(`/api/attendance/list?${getParams(state)}&payroll=${modeAttendance.payroll}&type=${formListAttendance.type}`)
                    if(!req.ok) throw new Error('Gagal mengambil data')
                    const {items, totalItems} = await req.json()
                    state.setTotalRows(totalItems)
                    return items
                } catch (err:any) {
                    console.log(err.message)
                }
            })
        }

        tableLogAttendance.load(async (state: any) => {
            try {
                const req = await fetch(`/api/attendance/log?${getParams(state)}&payroll=${modeAttendance.payroll}&type=${formLogAttendance.type}&year=${formLogAttendance.year}&month=${formLogAttendance.month}`)
                if(!req.ok) throw new Error('Gagal mengambil data')
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })
    })

    $effect(()=> {
        const temp = modeAttendance.tabNo == 4 ? set(new Date(), {year: formLogAttendance.year, month: formLogAttendance.month, date: setting?.end_periode}) : new Date()
        modeAttendance.periode = generatePeriode(temp.toString(), Number(setting?.start_periode), Number(setting?.end_periode))
    })
    
    setTimeout(()=>{
        tableAttendance.invalidate()
        if (user.level > 1 || user.user_type == 'HR')
            tableAttendanceDept.invalidate()
        if(user.user_type == 'HR')
            tableListAttendance.invalidate()
        
        formLogAttendance.month = Number(format(modeAttendance.periode.start, "M"))
        tableLogAttendance.invalidate()
    }, 1000)

    const ListFilter = [
        {label: "Semua", value:"Semua"},
        {label: "Masuk", value:"Masuk"},
        {label: "Tidak Masuk", value:"Tidak Masuk"},
    ]
</script>

<svelte:head>
    <title>Attendance {(modeAttendance.payroll !== user?.payroll ? "View | " : "") + capitalEachWord(modeAttendance.name)}</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full w-full">
    {#if modeAttendance.tabNo == 2}
        <MyAlert color='red' pesan={'Cant display dashboard on Department mode'} close={false}/>
    {:else}
        {#if modeAttendance.payroll }
            {#await getAttendance({val: modeAttendance.payroll,year:formLogAttendance.year, month: formLogAttendance.month, start_date: modeAttendance.periode.start, end_date: modeAttendance.periode.end})}
                <MyLoading message={`Loading data user`}/>
            {:then}
                <div class={`flex rounded-lg p-4 gap-4 border-[2px] border-slate-200 text-textdark ${modeAttendance.payroll == user.payroll ? "bg-bgdark":"bg-bgdark2 shadow-lg"}`}>
                    <div class="flex flex-col gap-2 min-w-fit">
                        <div class="flex flex-col">
                            <span class="font-bold text-[1rem]">{modeAttendance.name}</span>
                            <Badge class='flex gap-2 self-start text-white bg-slate-500 py-1'><IdCard size={14}/> {modeAttendance.payroll}</Badge>
                        </div>
                        <div class="flex items-center gap-2">
                            <Calendar size={15}/>
                            <div class="flex items-center gap-2">
                                <span class="text-[.9rem] font-bold">Hari ini,</span>
                                <span class='text-[.9rem]'>{formatTanggal(new Date(), "date", "app")}</span>
                            </div>
                        </div>
                        <div class="flex gap-2 items-center">
                            <CalendarClock />
                            <div class="flex flex-col gap-2">
                                <Badge color='indigo'>{formatTanggal(modeAttendance.periode.start, "date", "app")}</Badge>
                                <Badge color='indigo'>{formatTanggal(modeAttendance.periode.end, "date", "app")}</Badge>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col w-full gap-4">
                        <div class="hidden lg:flex flex-wrap items-end w-full items-center gap-4">
                            {#each headerData as {title, value, icon: Icon}}
                                <div class={`flex-1 flex flex-col min-w-[8rem] items-start border-[2px] border-slate-200 p-4 rounded-lg overflow-hidden overflow-ellipsis whitespace-nowrap`}>
                                    <span class="text-[.85rem] font-semibold">{title}</span>
                                    <div class="flex justify-between items-center gap-2">
                                        <Icon size={15}/>
                                        <span class='text-[1rem] font-bold'>{value}</span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                        <div class="flex gap-4">
                            <Alert class='p-1 px-3 flex items-center gap-2' color={"blue"}>
                                <CalendarCheck2 size={16}/>
                                <span class="text-[.75rem] font-medium">{modeAttendance.hari_kerja} Hari Kerja, {modeAttendance.hari_weekend} Akhir pekan</span>
                            </Alert>
                            <Tooltip>*{modeAttendance.hari_kerja} Hari Kerja (Senin ke Jumat), {modeAttendance.hari_weekend} Akhir pekan (Sabtu ke Minggu)</Tooltip>
                            <MyButton className='flex items-center gap-2' onclick={()=> formAttendance.showCalendar = true}><Calendar size={16} /> Kalender</MyButton>
                            {#if user.user_type == 'HR'}
                                <MyButton className='flex items-center gap-2' onclick={handleReportAttendance}>
                                    <BookOpen size={16} />Report
                                </MyButton>
                            {/if}
                        </div>
                    </div>
                </div>
            {/await}
        {/if}
    {/if}
    
    <div class="flex flex-col gap-3 pb-4">
        {#if !formAttendance.modal}
            {#if formAttendance.error}
                {#each formAttendance.error.split(';') as v}
                    <MyAlert color='red' pesan={v} func={()=> formAttendance.error = ""}/>
                {/each}
            {:else if formAttendance.success}
                <MyAlert pesan={formAttendance.success} func={()=> formAttendance.success = ""}/>
            {/if}
        {/if}

        <!-- Tombol Add -->
        {#if ((user.user_type == 'HR' || user.level > 1) && modeAttendance.tabNo != 2)}
            <div class="flex gap-2 items-center w-full">
                {#if (!formAttendance.add || !formAttendance.edit) && pecahArray(userProfile?.access_attendance, "C")}
                    <MyButton onclick={formAttendanceAdd}><Plus size={16}/></MyButton>
                {/if}
                <div class="flex flex-1 gap-2">
                    {#if getUser.isFetching || getUser.isPending}
                        <MyLoading message="Loading data"/>
                    {/if}
                    {#if getUser.data}
                        <Svelecte class='border-none' optionClass='p-2' name='payroll' required searchable selectOnTab multiple={false} bind:value={modeAttendance.payroll} 
                            options={getUser.data.map((v:any) => ({value: v.payroll, text: capitalEachWord(v.payroll + " - " + v.name)}))}
                            onChange={() => {
                                tableAttendance.setPage(1)
                                tableListAttendance.setPage(1)
                                tableLogAttendance.setPage(1)
                        }}/>
                        {#if modeAttendance.payroll !== user?.payroll}
                            <Button onclick={handleBackToMyAttendance}>Kembali ke attendance saya</Button>
                        {/if}
                    {/if}
                </div>
            </div>
        {/if}
        
        {#if modeAttendance.payroll}
            <Tabs contentClass='w-full' tabStyle="underline">
                <!-- Attendance pribadi/orang lain -->
                <TabItem open={modeAttendance.tabNo == 1} title={user?.payroll == modeAttendance.payroll ? "Attendance Saya": `Attendance ${capitalEachWord(modeAttendance.name)}`} onclick={()=> modeAttendance.tabNo = 1} >
                    <div class="flex flex-col gap-4">
                        <div class="flex gap-2 items-start">
                            <select bind:value={tableAttendance.rowsPerPage} onchange={() => tableAttendance.setPage(1)}>
                                {#each [30, 60, 90, 120] as option}
                                    <option value={option}>{option}</option>
                                {/each}
                            </select>
                            <div class="flex flex-col">
                                <select bind:value={formAttendance.type} onchange={()=> tableAttendance.setPage(1)}>
                                    {#each filterType as option}
                                        <option value={option.value}>{option.title}</option>
                                    {/each}
                                </select>
                            </div>
                            <div class="flex w-full flex-col">
                                <MyInput type='text' bind:value={tableAttendanceSearch.value} onkeydown={(e: KeyboardEvent)=> {
                                    if(e.key.toLowerCase() === 'enter') tableAttendanceSearch.set()
                                }}/>
                                <span class="italic text-[.8rem]">Pencarian tanggal mengikuti format "2025-12-30" </span>
                            </div>
                            <MyButton className='p-3' onclick={()=>tableAttendanceSearch.set()}><Search size={16} /></MyButton>
                            <MyButton className='p-3' onclick={async ()=>{
                                await invalidateAll()
                                tableAttendance.invalidate()
                            }}><RefreshCw size={16}/></MyButton>
                        </div>
                        
                        <span class='italic text-[.8rem] text-blue-400'>* Overtime dimulai setelah {setting?.overtime_allow} menit {setting?.overtime_round_up ? "(Round up)":""}</span>
                        <Datatable table={tableAttendance}>
                            <Table divClass="w-auto">
                                <TableHead>
                                    <ThSort table={tableAttendance} field="check_in">Hari</ThSort>
                                    <ThSort table={tableAttendance} field="check_in">Tanggal</ThSort>
                                    <ThSort table={tableAttendance} field="check_in">Absen Masuk</ThSort>
                                    <ThSort table={tableAttendance} field="check_out">Absen Keluar</ThSort>
                                    <ThSort table={tableAttendance} field="">Selisih</ThSort>
                                    <ThSort table={tableAttendance} field="type">Tipe</ThSort>
                                    <ThSort table={tableAttendance} field="">Informasi</ThSort>
                                    <ThSort table={tableAttendance} field="">#</ThSort>
                                </TableHead>
        
                                {#if tableAttendance.isLoading}
                                    <div class="flex p-4 items-center">
                                        <MyLoading message="Loading data"/>
                                    </div>
                                {:else}
                                    <TableBody>
                                        {#if tableAttendance.rows.length > 0}
                                            {#each tableAttendance.rows as row}
                                                <TableBodyRow class={`h-10 ${getDay(formatTanggal(row.check_in, "date")) == 0 || ["Hari Libur","Event Kantor"].includes(row.type) ? "!bg-red-100":""}`} >
                                                    <TableBodyCell tdClass='min-w-[50px] w-[50px] max-w-[50px] break-all font-medium'>
                                                        <span class={getDay(formatTanggal(row.check_in, "date")) == 0 ? "text-red-500":""}>{namaHari[getDay(formatTanggal(row.check_in, "date"))]}</span>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='min-w-[150px] w-[150px] max-w-[150px] break-all font-medium'>
                                                        <span class={getDay(formatTanggal(row.check_in, "date")) == 0 ? "text-red-500":""}>{formatTanggal(row.check_in, "date", "app")}</span>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='min-w-[180px] w-[180px] break-all font-medium'>
                                                        <TableAttendanceClockIn check_in={row.check_in} check_in2={row.check_in2}/>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='min-w-[180px] w-[180px] break-all font-medium'>
                                                        <TableAttendanceClockOut check_out={row.check_out} check_out2={row.check_out2} check_in={row.check_in}/>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='min-w-[180px] w-[180px] break-all font-medium'>
                                                        <TableAttendanceDifference check_in={row.lembur_start} check_out={row.check_out} check_in2={row.check_in2} check_out2={row.check_out2} overtime={setting.overtime_allow}/>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='min-w-[160px] w-[160px] break-all font-medium'>
                                                        {#if row.type}<MyBadge bold border>{row.type}</MyBadge>{/if}
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='font-medium'>
                                                        <div class="flex gap-1 flex-wrap">
                                                            {#each [...row.description.split(",").filter((v: string) => row.ijin_info ? null : v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                                (row.late_in_minute > 0 && !row.isWeekend) ? 
                                                                    {type:"late", value:"Late " + formatLate(hitungJamMenit(row.late_in_minute))} : null,
                                                                (()=> {
                                                                    const {hour, minute} = hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2)
                                                                    const isOvertime = (hour > 0) || (hour == 0 && minute >= 55) && row.overtime
                                                                    return isOvertime
                                                                        ? {type:"lembur", value:`Overtime ${formatDifference({ round_up: setting?.overtime_round_up, overtime: setting?.overtime_allow, ...hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2), })}`}
                                                                        : null
                                                                })(),
                                                                row.ijin_info ? {type:"ijin_info", value: row.ijin_info + ` (${row.description})`} : null
                                                                ] as val}
                                                                {#if val}
                                                                    <MyBadge italic border={val.type == "kerja"} color={
                                                                        ["kerja"].includes(val.type) ? "default"
                                                                        : ["late"].includes(val.type) ? "red" 
                                                                        : ["ijin_info"].includes(val.type) ? "dark" 
                                                                        : ["lembur"].includes(val.type) && row.is_spl_exist ? "green" 
                                                                        : "yellow"} onclick={()=> {
                                                                            if(val.type == 'lembur' && pecahArray(userProfile.access_spl, "C") && row.overtime && !row.is_spl_exist && user.dept.dept_code == row.dept)
                                                                                createSPL(row.payroll, capitalEachWord(row.name), row.lembur_start, row.check_out)
                                                                        }}>
                                                                        {val.value}
                                                                        {#if val.type == 'lembur' && pecahArray(userProfile.access_spl, "C") && row.overtime && !row.is_spl_exist && user.dept.dept_code == row.dept}
                                                                            <Plus size={12}/>
                                                                        {/if}
                                                                    </MyBadge>
                                                                {/if}
                                                            {/each}
                                                        </div>
                                                    </TableBodyCell>
                                                    <TableBodyCell>
                                                        {#if row.payroll != user.payroll && pecahArray(userProfile.access_attendance, "U")}
                                                            {#if (user.user_type != 'HR' && user.level > row.level) 
                                                                || (user.user_type == 'HR' && row.user_type == 'HR' && user.level > row.level) 
                                                                || (user.user_type == 'HR' && row.user_type != 'HR')
                                                            }
                                                                <MyButton onclick={()=> formAttendanceEdit(row.attendance_id)}><Pencil size={12} /></MyButton>
                                                            {/if}
                                                        {/if}
                                                        {#if row.attachment}
                                                            <MyButton onclick={()=> showAttendanceAttachment(row.attachment)}><Paperclip size={12} /></MyButton>
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

                            <MyPagination table={tableAttendance} />
                        </Datatable>
                    </div>
                </TabItem>
                <!-- Attendance department -->
                {#if user.level > 1 || user.user_type == 'HR'}
                    <TabItem open={modeAttendance.tabNo == 2} title="Attendance Departemen" onclick={()=> modeAttendance.tabNo = 2} >
                        <div class="flex flex-col gap-4">
                            <div class="flex flex-col gap-4">
                                <div class="flex gap-2 items-start">
                                    <select bind:value={tableAttendanceDept.rowsPerPage} onchange={() => tableAttendanceDept.setPage(1)}>
                                        {#each [30, 60, 90, 120] as option}
                                            <option value={option}>{option}</option>
                                        {/each}
                                    </select>
                                    <div class="flex flex-col">
                                        <select bind:value={formAttendanceDept.type} onchange={()=> tableAttendanceDept.setPage(1)}>
                                            {#each filterType as option}
                                                <option value={option.value}>{option.title}</option>
                                            {/each}
                                        </select>
                                    </div>
                                    <div class="flex w-full flex-col">
                                        <MyInput type='text' bind:value={tableAttendanceDeptSearch.value} onkeydown={e => {
                                            if(e.key.toLowerCase() === 'enter') tableAttendanceDeptSearch.set()
                                        }}/>
                                        <span class="italic text-[.8rem]">Pencarian tanggal mengikuti format "2025-12-30" </span>
                                    </div>
                                    <MyButton className='p-3' onclick={()=>tableAttendanceDeptSearch.set()}><Search size={16} /></MyButton>
                                    <MyButton className='p-3' onclick={async ()=> {
                                        await invalidateAll()
                                        tableAttendanceDept.invalidate()
                                    }}><RefreshCw size={16}/></MyButton>
                                </div>
                                {#if user.user_type == 'HR'}
                                    <div class="flex gap-4 items-center">
                                        <Building size={14} />
                                        {#if getDept.isPending || getDept.isFetching}
                                            <MyLoading message="Loading data"/>
                                        {/if}
                                        {#if getDept.data}
                                            <Svelecte clearable searchable selectOnTab multiple={false} bind:value={formAttendanceDept.dept} 
                                                options={getDept.data.map((v:any) => ({value: v.dept_code, text:v.dept_code + " - " + v.name}))}
                                                onChange={() => tableAttendanceDept.setPage(1)}/>
                                        {/if}
                                        <div class="flex items-center flex-1 gap-2">
                                            <span class='font-bold italic'>Status Kehadiran</span>
                                            <Svelecte clearable selectOnTab multiple={false} bind:value={formAttendanceDept.filterAbsen} 
                                                options={ListFilter.map((v:any) => ({value: v.value, text:v.label}))}
                                                onChange={() => tableAttendanceDept.setPage(1)}/>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class='font-bold italic'>Export</span>
                                            <button onclick={onExportExcel} class='flex items-center justify-center border-slate-200 border rounded-lg w-[2rem] h-[2rem]'>
                                                <Sheet size={14} color='green'/>
                                            </button>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                            
                            <span class='italic text-[.8rem] text-blue-400'>* Overtime dimulai setelah {setting?.overtime_allow} menit {setting?.overtime_round_up ? "(Round up)":""}</span>
                            <Datatable table={tableAttendanceDept}>
                                <Table>
                                    <TableHead>
                                        <ThSort table={tableAttendanceDept} field="check_in">Hari</ThSort>
                                        <ThSort table={tableAttendanceDept} field="check_in">Tanggal</ThSort>
                                        <ThSort table={tableAttendanceDept} field="payroll">Payroll</ThSort>
                                        <ThSort table={tableAttendanceDept} field="name">Nama</ThSort>
                                        <ThSort table={tableAttendanceDept} field="check_in">Absen Masuk</ThSort>
                                        <ThSort table={tableAttendanceDept} field="check_out">Absen Keluar</ThSort>
                                        <ThSort table={tableAttendanceDept} field="">Selisih</ThSort>
                                        <ThSort table={tableAttendanceDept} field="type">Tipe</ThSort>
                                        <ThSort table={tableAttendanceDept} field="">Informasi</ThSort>
                                        <ThSort table={tableAttendanceDept} field="">#</ThSort>
                                    </TableHead>
            
                                    {#if tableAttendanceDept.isLoading}
                                        <div class="flex p-4 items-center">
                                            <MyLoading message="Loading data"/>
                                        </div>
                                    {:else}
                                        <TableBody>
                                            {#if tableAttendanceDept.rows.length > 0}
                                                {#each tableAttendanceDept.rows as row}
                                                    <TableBodyRow class={`h-10 ${getDay(formatTanggal(row.check_in, "date")) == 0 || ["Hari Libur","Event Kantor"].includes(row.type) ? "!bg-red-100":""}`} >
                                                        <TableBodyCell tdClass='min-w-[50px] w-[50px] max-w-[50px] break-all font-medium'>
                                                            <span class={getDay(formatTanggal(row.check_in, "date")) == 0 ? "text-red-500":""}>{namaHari[getDay(formatTanggal(row.check_in, "date"))]}</span>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='min-w-[150px] w-[150px] max-w-[150px] break-all font-medium'>
                                                            <span class={getDay(formatTanggal(row.check_in, "date")) == 0 ? "text-red-500":""}>{formatTanggal(row.check_in, "date", "app")}</span>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{row.payroll}</TableBodyCell>
                                                        <TableBodyCell tdClass='min-w-[180px] w-[180px] break-all font-medium'>{capitalEachWord(row.name)}</TableBodyCell>
                                                        <TableBodyCell tdClass='min-w-[160px] w-[180px] break-all font-medium'>
                                                            <TableAttendanceClockIn check_in={row.check_in} check_in2={row.check_in2}/>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='min-w-[160px] w-[180px] break-all font-medium'>
                                                            <TableAttendanceClockOut check_out={row.check_out} check_out2={row.check_out2} check_in={row.check_in}/>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='min-w-[160px] w-[180px] break-all font-medium'>
                                                            <TableAttendanceDifference check_in={row.lembur_start} check_out={row.check_out} check_in2={row.check_in2} check_out2={row.check_out2} overtime={setting.overtime_allow}/>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='min-w-[160px] w-[160px] max-w-[160px] break-all font-medium'>
                                                            {#if row.type}<MyBadge bold border>{row.type}</MyBadge>{/if}    
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='font-medium'>
                                                            <div class="flex gap-1 flex-wrap">
                                                                {#each [...row.description.split(",").filter((v: string) => row.ijin_info ? null : v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                                    (row.late_in_minute > 0 && !row.isWeekend) ? 
                                                                        {type:"late", value:"Late " + formatLate(hitungJamMenit(row.late_in_minute))} : null,
                                                                    (()=> {
                                                                        const {hour, minute} = hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2)
                                                                        const isOvertime = (hour > 0) || (hour == 0 && minute >= 55) && row.overtime
                                                                        return isOvertime
                                                                            ? {type:"lembur", value:`Overtime ${formatDifference({ round_up: setting?.overtime_round_up, overtime: setting?.overtime_allow, ...hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2), })}`}
                                                                            : null
                                                                    })(),
                                                                    row.ijin_info ? {type:"ijin_info", value: row.ijin_info + ` (${row.description})`} : null
                                                                    ] as val}
                                                                    {#if val}
                                                                        <MyBadge italic border={val.type == "kerja"} color={
                                                                            ["kerja"].includes(val.type) ? "default"
                                                                            : ["late"].includes(val.type) ? "red" 
                                                                            : ["lembur"].includes(val.type) ? "green" 
                                                                            : ["ijin_info"].includes(val.type) ? "yellow" 
                                                                            : "dark"} onclick={()=> {
                                                                                if(val.type == 'lembur' && pecahArray(userProfile.access_spl, "C") && row.overtime && !row.is_spl_exist && user.dept.dept_code == row.dept)
                                                                                    createSPL(row.payroll, capitalEachWord(row.name), row.lembur_start, row.check_out)
                                                                            }}>
                                                                            {val.value}
                                                                            {#if val.type == 'lembur' && pecahArray(userProfile.access_spl, "C") && row.overtime && !row.is_spl_exist && user.dept.dept_code == row.dept}
                                                                                <Plus size={12}/>
                                                                            {/if}
                                                                        </MyBadge>
                                                                    {/if}
                                                                {/each}
                                                            </div>
                                                        </TableBodyCell>
                                                        <TableBodyCell>
                                                            {#if row.payroll != user.payroll && pecahArray(userProfile.access_attendance, "U")}
                                                                {#if (user.user_type != 'HR' && user.level > row.level) 
                                                                    || (user.user_type == 'HR' && row.user_type == 'HR' && user.level > row.level) 
                                                                    || (user.user_type == 'HR' && row.user_type != 'HR')
                                                                }
                                                                    <MyButton onclick={()=> formAttendanceEdit(row.attendance_id)}><Pencil size={12} /></MyButton>
                                                                {/if}
                                                            {/if}
                                                            {#if row.attachment}
                                                                <MyButton onclick={()=> showAttendanceAttachment(row.attachment)}><Paperclip size={12} /></MyButton>
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
                                <MyPagination table={tableAttendanceDept} />
                            </Datatable>
                        </div>
                    </TabItem>
                {/if}
                <!-- Attendance Duplikat -->
                {#if user.user_type == 'HR'}
                    <TabItem open={modeAttendance.tabNo == 3} title="Attendance Duplikat" onclick={()=> modeAttendance.tabNo = 3}>
                        <div class="flex flex-col gap-4">
                            <div class="flex flex-col gap-4">
                                <div class="flex gap-2 items-start">
                                    <select bind:value={tableListAttendance.rowsPerPage} onchange={() => tableListAttendance.setPage(1)}>
                                        {#each [30, 60, 90, 120] as option}
                                            <option value={option}>{option}</option>
                                        {/each}
                                    </select>
                                    <div class="flex flex-col">
                                        <select bind:value={formListAttendance.type} onchange={()=> tableListAttendance.setPage(1)}>
                                            {#each filterType as option}
                                                <option value={option.value}>{option.title}</option>
                                            {/each}
                                        </select>
                                    </div>
                                    <div class="flex w-full flex-col">
                                        <MyInput type='text' bind:value={tableListAttendanceSearch.value} onkeydown={e => {
                                            if(e.key.toLowerCase() === 'enter') tableListAttendanceSearch.set()
                                        }}/>
                                        <span class="italic text-[.8rem]">Pencarian tanggal mengikuti format "2025-12-30"</span>
                                    </div>
                                    <MyButton className='p-3' onclick={()=>tableListAttendanceSearch.set()}><Search size={16} /></MyButton>
                                    <MyButton className='p-3' onclick={async ()=> {
                                        await invalidateAll()
                                        tableListAttendance.invalidate()
                                    }}><RefreshCw size={16}/></MyButton>
                                </div>
                            </div>
                            
                            <span class='italic text-[.8rem] text-blue-400'>* Overtime dimulai setelah {setting?.overtime_allow} menit {setting?.overtime_round_up ? "(Round up)":""}</span>
                            <Datatable table={tableListAttendance}>
                                <Table>
                                    <TableHead>
                                        <ThSort table={tableListAttendance} field="check_in">Hari</ThSort>
                                        <ThSort table={tableListAttendance} field="check_in">Tanggal</ThSort>
                                        <ThSort table={tableListAttendance} field="payroll">Payroll</ThSort>
                                        <ThSort table={tableListAttendance} field="name">Nama</ThSort>
                                        <ThSort table={tableListAttendance} field="check_in">Absen Masuk</ThSort>
                                        <ThSort table={tableListAttendance} field="check_out">Absen Keluar</ThSort>
                                        <ThSort table={tableListAttendance} field="type">Tipe</ThSort>
                                        <ThSort table={tableListAttendance} field="">Informasi</ThSort>
                                        <ThSort table={tableListAttendance} field="">#</ThSort>
                                    </TableHead>
            
                                    {#if tableListAttendance.isLoading}
                                        <div class="flex p-4 items-center">
                                            <MyLoading message="Loading data"/>
                                        </div>
                                    {:else}
                                        <TableBody>
                                            {#if tableListAttendance.rows.length > 0}
                                                {#each tableListAttendance.rows as row}
                                                    <TableBodyRow class={`h-10 ${getDay(formatTanggal(row.check_in, "date")) == 0 || ["Hari Libur","Event Kantor"].includes(row.type) ? "!bg-red-100":""}`} >
                                                        <TableBodyCell tdClass='min-w-[50px] w-[50px] max-w-[50px] break-all font-medium'>
                                                            <span class={getDay(formatTanggal(row.check_in, "date")) == 0 ? "text-red-500":""}>{namaHari[getDay(formatTanggal(row.check_in, "date"))]}</span>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='min-w-[150px] w-[150px] break-all font-medium'>
                                                            <span class={getDay(formatTanggal(row.check_in, "date")) == 0 ? "text-red-500":""}>{formatTanggal(row.check_in, "date", "app")}</span>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{row.payroll}</TableBodyCell>
                                                        <TableBodyCell tdClass='min-w-[180px] w-[180px] break-all font-medium'>{capitalEachWord(row.name)}</TableBodyCell>
                                                        <TableBodyCell tdClass='min-w-[180px] w-[180px] break-all font-medium'>
                                                            <TableAttendanceClockIn check_in={row.check_in} check_in2={row.check_in2}/>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='min-w-[180px] w-[180px] break-all font-medium'>
                                                            <TableAttendanceClockOut check_out={row.check_out} check_out2={row.check_out2} check_in={row.check_in}/>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='min-w-[180px] w-[180px] break-all font-medium'>
                                                            {#if row.type}<MyBadge bold border>{row.type}</MyBadge>{/if}
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='font-medium'>
                                                            <div class="flex gap-1 flex-wrap">
                                                                {#each [...row.description.split(",").filter((v: string) => row.ijin_info ? null : v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                                    (row.late_in_minute > 0 && !row.isWeekend) ? 
                                                                        {type:"late", value:"Late " + formatLate(hitungJamMenit(row.late_in_minute))} : null,
                                                                    (()=> {
                                                                        const {hour, minute} = hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2)
                                                                        const isOvertime = (hour > 0) || (hour == 0 && minute >= 55) && row.overtime
                                                                        return isOvertime
                                                                            ? {type:"lembur", value:`Overtime ${formatDifference({ round_up: setting?.overtime_round_up, overtime: setting?.overtime_allow, ...hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2), })}`}
                                                                            : null
                                                                    })(),
                                                                    row.ijin_info ? {type:"ijin_info", value: row.ijin_info + ` (${row.description})`} : null
                                                                    ] as val}
                                                                    {#if val}
                                                                        <MyBadge italic border={val.type == "kerja"} color={
                                                                            ["kerja"].includes(val.type) ? "default"
                                                                            : ["late"].includes(val.type) ? "red" 
                                                                            : ["lembur"].includes(val.type) ? "green" 
                                                                            : ["ijin_info"].includes(val.type) ? "yellow" 
                                                                            : "dark"}>
                                                                            {val.value}
                                                                        </MyBadge>
                                                                    {/if}
                                                                {/each}
                                                            </div>
                                                        </TableBodyCell>
                                                        <TableBodyCell>
                                                            {#if row.payroll != user?.payroll && pecahArray(userProfile.access_attendance, "D")}
                                                                <MyButton onclick={()=> {
                                                                    formAttendance.modalDelete = true
                                                                    formAttendance.answer.attendance_id = row.attendance_id
                                                                }}><Trash size={12} /></MyButton>
                                                            {/if}
                                                            {#if row.attachment}
                                                                <MyButton onclick={()=> showAttendanceAttachment(row.attachment)}><Paperclip size={12} /></MyButton>
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
                                <MyPagination table={tableListAttendance}/>
                            </Datatable>
                        </div>
                    </TabItem>
                {/if}
                <!-- Attendance Log -->
                <TabItem open={modeAttendance.tabNo == 4} title="Attendance Log" onclick={()=> modeAttendance.tabNo = 4}>
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-4">
                            <div class="flex gap-2 items-start">
                                <select bind:value={tableLogAttendance.rowsPerPage} onchange={() => tableLogAttendance.setPage(1)}>
                                    {#each [30, 60, 90, 120] as option}
                                        <option value={option}>{option}</option>
                                    {/each}
                                </select>
                                <div class="flex flex-col">
                                    <select bind:value={formLogAttendance.type} onchange={()=> {tableLogAttendance.setPage(1)}}>
                                        {#each filterType as option}
                                            <option value={option.value}>{option.title}</option>
                                        {/each}
                                    </select>
                                </div>
                                <div class="flex w-full flex-col">
                                    <MyInput type='text' bind:value={tableLogAttendanceSearch.value} onkeydown={e => {
                                        if(e.key.toLowerCase() === 'enter') tableLogAttendanceSearch.set()
                                    }}/>
                                    <span class="italic text-[.8rem]">Pencarian tanggal mengikuti format "2025-12-30"</span>
                                </div>
                                <MyButton className='p-3' onclick={()=>tableLogAttendanceSearch.set()}><Search size={16} /></MyButton>
                                <MyButton className='p-3' onclick={async ()=>{
                                    await invalidateAll()
                                    tableLogAttendance.invalidate()
                                }}><RefreshCw size={16}/></MyButton>
                            </div>
                            <!-- Filter periode -->
                            <div class="flex gap-2 items-start flex-wrap">
                                <select bind:value={formLogAttendance.year} onchange={()=> tableLogAttendance.setPage(1)}>
                                    {#each dataTahun as {title, value}}
                                        <option value={value}>
                                            {title} {value.toString() == format(modeAttendance.periode.start, "yyyy") ? "(Select)" : null}
                                            {value.toString() == new Date().getFullYear().toString() ? "(Now)" : null}
                                        </option>
                                    {/each}
                                </select>
                                <select bind:value={formLogAttendance.month} onchange={()=> tableLogAttendance.setPage(1)}>
                                    {#each dataBulan as {title, value}}
                                        <option value={value}>
                                            {title} {value == Number(format(modeAttendance.periode.end, "M")) - 1 ? "(Select)" : null}
                                            {value == new Date().getMonth() + 1 ? "(Now)" : null}
                                        </option>
                                    {/each}
                                </select>
                            </div>
                        </div>
                                                
                        <span class='italic text-[.8rem] text-blue-400'>* Overtime dimulai setelah {setting?.overtime_allow} menit {setting?.overtime_round_up ? "(Round up)":""}</span>
                        <Datatable table={tableLogAttendance}>
                            <Table>
                                <TableHead>
                                    <ThSort table={tableLogAttendance} field="check_in">Hari</ThSort>
                                    <ThSort table={tableLogAttendance} field="check_in">Tanggal</ThSort>
                                    <ThSort table={tableLogAttendance} field="payroll">Payroll</ThSort>
                                    <ThSort table={tableLogAttendance} field="name">Nama</ThSort>
                                    <ThSort table={tableLogAttendance} field="check_in">Absen Masuk</ThSort>
                                    <ThSort table={tableLogAttendance} field="check_out">Absen Keluar</ThSort>
                                    <ThSort table={tableLogAttendance} field="">Selisih</ThSort>
                                    <ThSort table={tableLogAttendance} field="type">Tipe</ThSort>
                                    <ThSort table={tableLogAttendance} field="">Informasi</ThSort>
                                    <ThSort table={tableLogAttendance} field="">#</ThSort>
                                </TableHead>

                                {#if tableLogAttendance.isLoading}
                                    <div class="flex p-4 items-center">
                                        <MyLoading message="Loading data"/>
                                    </div>
                                {:else}
                                    <TableBody>
                                        {#if tableLogAttendance.rows.length > 0}
                                            {#each tableLogAttendance.rows as row}
                                                <TableBodyRow class={`h-10 ${getDay(formatTanggal(row.check_in, "date")) == 0 || ["Hari Libur","Event Kantor"].includes(row.type) ? "!bg-red-100":""}`} >
                                                    <TableBodyCell tdClass='min-w-[50px] w-[50px] max-w-[50px] break-all font-medium'>
                                                        <span class={getDay(formatTanggal(row.check_in, "date")) == 0 ? "text-red-500":""}>{namaHari[getDay(formatTanggal(row.check_in, "date"))]}</span>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='min-w-[150px] w-[150px] break-all font-medium'>
                                                        <span class={getDay(formatTanggal(row.check_in, "date")) == 0 ? "text-red-500":""}>{formatTanggal(row.check_in, "date", "app")}</span>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>{row.payroll}</TableBodyCell>
                                                    <TableBodyCell tdClass='min-w-[180px] w-[180px] break-all font-medium'>{capitalEachWord(row.name)}</TableBodyCell>
                                                    <TableBodyCell tdClass='min-w-[180px] w-[180px] break-all font-medium'>
                                                        <TableAttendanceClockIn check_in={row.check_in} check_in2={row.check_in2}/>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='min-w-[180px] w-[180px] break-all font-medium'>
                                                        <TableAttendanceClockOut check_out={row.check_out} check_out2={row.check_out2} check_in={row.check_in}/>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='min-w-[180px] w-[180px] break-all font-medium'>
                                                        <TableAttendanceDifference check_in={row.lembur_start} check_out={row.check_out} check_in2={row.check_in2} check_out2={row.check_out2} overtime={setting.overtime_allow}/>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='min-w-[160px] w-[160px] max-w-[160px] break-all font-medium'>
                                                        {#if row.type}<MyBadge bold border>{row.type}</MyBadge>{/if}
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='font-medium'>
                                                        <div class="flex gap-1 flex-wrap">
                                                            {#each [...row.description.split(",").filter((v: string) => row.ijin_info ? null : v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                                (row.late_in_minute > 0 && !row.isWeekend) ? 
                                                                    {type:"late", value:"Late " + formatLate(hitungJamMenit(row.late_in_minute))} : null,
                                                                (()=> {
                                                                    const {hour, minute} = hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2)
                                                                    const isOvertime = (hour > 0) || (hour == 0 && minute >= 55) && row.overtime
                                                                    return isOvertime
                                                                        ? {type:"lembur", value:`Overtime ${formatDifference({ round_up: setting?.overtime_round_up, overtime: setting?.overtime_allow, ...hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2), })}`}
                                                                        : null
                                                                })(),
                                                                row.ijin_info ? {type:"ijin_info", value: row.ijin_info + ` (${row.description})`} : null
                                                                ] as val}
                                                                {#if val}
                                                                    <MyBadge italic border={val.type == "kerja"} color={
                                                                        ["kerja"].includes(val.type) ? "default"
                                                                        : ["late"].includes(val.type) ? "red" 
                                                                        : ["lembur"].includes(val.type) ? "green" 
                                                                        : ["ijin_info"].includes(val.type) ? "yellow" 
                                                                        : "dark"}>
                                                                        {val.value}
                                                                    </MyBadge>
                                                                {/if}
                                                            {/each}
                                                        </div>
                                                    </TableBodyCell>
                                                    <TableBodyCell>
                                                        {#if row.attachment}
                                                            <MyButton onclick={()=> showAttendanceAttachment(row.attachment)}><Paperclip size={12} /></MyButton>
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
                            
                            <MyPagination table={tableLogAttendance}/>
                        </Datatable>
                    </div>
                </TabItem>
            </Tabs>
        {:else}
            <div class="flex flex-col gap-4 p-4 border border-slate-400 rounded-lg">
                <MyAlert color='red' pesan={"You need select user to see this page"}/>
            </div>
        {/if}
    </div>

    <Modal bind:open={formSPL.modalSPL} size='xl'>
        <div class="flex flex-col gap-6">
            <h3>Create SPL Direct</h3>
            
            {#if formSPL.error}
                {#each formSPL.error.split(';') as v}
                    <MyAlert color='red' pesan={v} func={()=> formSPL.error = ""}/>
                {/each}
            {:else if formSPL.success}
                <MyAlert color='green' pesan={formSPL.success} func={()=> formSPL.success = ""}/>
            {/if}
            
            <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                <MyInput type='textarea' title={`Purpose`} name="purpose" bind:value={formSPL.answer.purpose}/>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">                    
                    <MyInput type='datetime' disabled title='Time Start' name="est_start" bind:value={formSPL.answer.est_start}/>
                    <MyInput type='datetime' disabled title='Time End' name="est_end" bind:value={formSPL.answer.est_end}/>
                    {#if getUserByDept.data}
                        <div class="flex flex-col gap-2 flex-1">
                            <Label>Approval 1</Label>
                            <Svelecte class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={formSPL.answer.approval1} 
                                options={getUserByDept.data.map((v:any) => ({value: v.payroll, text: capitalEachWord(v.payroll +" - "+v.name)}))}
                            />
                        </div>
                    {/if}
                </div>

                <div class="flex flex-col gap-3 bg-bgdark2 p-4 rounded-lg border border-slate-300">
                    {#each formSPL.answer.spl_detail as list, i}
                        <div class="flex flex-col gap-2">
                            <MyInput type='text' disabled title='Payroll' name="payroll" bind:value={list.payroll}/>                                

                            <div class="flex flex-1 flex-col">
                                <MyInput type='textarea' title="Job List" name="description" bind:value={list.description}/>
                                <span class='text-[.8rem] italic'>For several jobs use comas as separator (,)</span>
                            </div>
                        </div>
                    {/each}
                </div>
            </form>
            
        </div>
        <svelte:fragment slot="footer">
            {#if pecahArray(userProfile?.access_spl, "C")}
                <Button color='green' type='submit' onclick={formSPLSubmit}>Simpan</Button>
            {/if}
            <Button color='red' onclick={() => formSPL.modalSPL = false}>Tutup</Button>
        </svelte:fragment>
    </Modal>

    <Modal bind:open={formAttendance.modalAttachment} autoclose>
        <div class="flex flex-col gap-6 overflow-hidden max-h-[80vh]">
            <h3>Attachment</h3>
            <MyImage src={import.meta.env.VITE_VIEW_ATTANDANCE+formAttendance.attachment}/>
        </div>
        <svelte:fragment slot="footer">
            <Button color='red' onclick={() => formAttendance.modalAttachment = false}>Tutup</Button>
        </svelte:fragment>
    </Modal>

    <Modal bind:open={formAttendance.modalDelete} autoclose>
        <div class="flex flex-col gap-6">
            <h3>Delete Attendance ?</h3>
        </div>
        <svelte:fragment slot="footer">
            <Button color='green' disabled={formAttendance.loading} onclick={() => formAttendanceDelete(formAttendance.answer.attendance_id)}>Yes, delete this data</Button>
            <Button color='red' onclick={() => formAttendance.modalDelete = false}>No</Button>
        </svelte:fragment>
    </Modal>
    
    <Modal bind:open={formAttendance.showCalendar} size={"xl"} >
        <div class="flex flex-col p-4 gap-4 h-[85vh]">
            <MyCalendar payroll={modeAttendance.payroll} name={modeAttendance.name}/>
        </div>
    </Modal>

    <Modal bind:open={formAttendance.modal} size={"xl"} classBody="overflow-visible">
        <div class="flex flex-col mt-7 p-4 gap-4 border border-slate-400 rounded-lg">
            {#if formAttendance.modal}
                {#if formAttendance.error}
                    {#each formAttendance.error.split(';') as v}
                        <MyAlert color='red' pesan={v} func={()=> formAttendance.error = ""}/>
                    {/each}
                {:else if formAttendance.success}
                    <MyAlert color='green' pesan={formAttendance.success} func={()=> formAttendance.success = ""}/>
                {/if}
            {/if}
            
            <div class="flex gap-2">
                {#if pecahArray(userProfile?.access_attendance, "C") || pecahArray(userProfile.access_attendance, "U")}
                    <MyButton onclick={formAttendanceBatal}><Ban size={16} /></MyButton>
                    {#if !formAttendance.loading}
                        <MyButton onclick={formAttendanceSubmit}><Save size={16}/></MyButton>
                    {/if}
                {/if}
            </div>
            
            {#if formAttendance.loading}
                <MyLoading message="Load attendance data"/>
            {/if}
            {#if formAttendance.add || formAttendance.edit}
                <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg' enctype="multipart/form-data">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {#if getUser.isFetching || getUser.isPending}
                            <MyLoading message="Loading user data"/>
                        {/if}
                        {#if getUser.data}
                            <div class="flex flex-col gap-2">
                                <Label>User Id Machine</Label>
                                <Svelecte disabled={formAttendance.edit} clearable searchable selectOnTab multiple={false} optionClass='' bind:value={formAttendance.answer.user_id_machine} 
                                    options={getUser.data.map((v:any) => ({value: v.user_id_machine, text:v.payroll + " | " + v.user_id_machine + " | " + capitalEachWord(v.name)}))}
                                />
                            </div>
                        {/if}
                        
                        {#if formAttendance.answer.user_id_machine}
                            {#if formAttendance.edit && formAttendance.answer.temp_type}
                                <MyInput type='text' title='Type' disabled={(formAttendance.answer.type ? true : false) && formAttendance.edit} bind:value={formAttendance.answer.type} />
                            {:else if formAttendance.add || (formAttendance.edit && !formAttendance.answer.temp_type)}
                                <div class="flex flex-col gap-2">
                                    <Label>Type</Label>
                                    <Select size="md" items={listType} bind:value={formAttendance.answer.type} />
                                </div>
                            {/if}

                            <div class="flex flex-col md:flex-row gap-2">
                                {#if formAttendance.answer.type == 'Sakit'}
                                    <div class="flex flex-col gap-2 flex-1">
                                        <Label>Date From</Label>
                                        <MyDatePicker bind:value={formAttendance.answer.check_in} disabled={formAttendance.edit}/>
                                    </div>
                                    <div class="flex flex-col gap-2 flex-1">
                                        <Label>Date End</Label>
                                        <MyDatePicker bind:value={formAttendance.answer.check_out} disabled={formAttendance.edit}/>
                                    </div>
                                {:else}
                                    <div class="flex flex-col gap-2 flex-1">                                        
                                        <Label>Check In</Label>
                                        <MyDatePicker bind:value={formAttendance.answer.check_in} time disabled={formAttendance.answer.type != "HKM"}/>
                                    </div>
                                    <div class="flex flex-col gap-2 flex-1">
                                        <Label>Check Out</Label>
                                        <MyDatePicker bind:value={formAttendance.answer.check_out} time disabled={formAttendance.answer.type != "HKM"}/>
                                    </div>
                                {/if}
                            </div>

                            <div class="flex flex-col">
                                <MyInput type='textarea' title='Description' bind:value={formAttendance.answer.description} />
                                <span class='italic text-[.8rem]'>For multiple description separate with comas (,)</span>
                            </div>

                            <div class="flex flex-col gap-2">
                                <Label>Information</Label>
                                <div class="flex gap-4 border-[2px] border-slate-200 p-2 rounded-lg">
                                    <Radio value="" bind:group={formAttendance.answer.ijin_info}>None</Radio>
                                    <Radio value="Permit" bind:group={formAttendance.answer.ijin_info}>Ijin</Radio>
                                    <Radio value="Sick" bind:group={formAttendance.answer.ijin_info}>Sakit</Radio>
                                </div>
                            </div>
                            
                            {#if formAttendance.answer.user_id_machine}
                                <div class="flex flex-col gap-2">
                                    <Label>Attachment</Label>
                                    <input class="border" type="file" accept=".jpg" onchange={e => formAttendance.answer.attachment = e.target.files[0]}/>
                                </div>
                            {/if}
                        {/if}                            
                    </div>
                    <span class='text-[.8rem]'>createdBy <Badge color='dark'>{user.name}</Badge> </span>
                </form>
            {/if}
        </div>
    </Modal>
</main>
