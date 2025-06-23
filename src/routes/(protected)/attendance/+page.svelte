<script lang="ts">
    import { fade } from 'svelte/transition'
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Label, Tabs, TabItem, Alert, Badge, Select, Radio, Modal, Button } from 'flowbite-svelte';
    import {Calendar, Ban, Search, RefreshCw, SquarePlus, Pencil, Trash, Plus, Save, Paperclip, CircleAlert, IdCard, CalendarClock, SquareCheck } from '@lucide/svelte'
	import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import MyButton from '$/lib/components/MyButton.svelte';
	import MyLoading from '$/lib/components/MyLoading.svelte';
	import MyInput from '$/lib/components/MyInput.svelte';
	import TableAttendanceClockIn from '$/lib/components/TableAttendanceClockIn.svelte';
	import TableAttendanceClockOut from '$/lib/components/TableAttendanceClockOut.svelte';
	import TableAttendanceDifference from '$/lib/components/TableAttendanceDifference.svelte';
	import { formatTanggal, pecahArray, generatePeriode, namaHari, getParams, isLate, hitungDifference, formatDifference } from '$/lib/utils';
    import { format, getYear, set } from "date-fns";
	import axios from 'axios';
	import Svelecte from 'svelecte';
	import { z } from 'zod';
	import { fromZodError } from 'zod-validation-error';
	import MyCalendar from '@/MyCalendar.svelte';
    import { invalidateAll } from '$app/navigation';
	import MyPagination from '@/MyPagination.svelte';
    
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
    ]
    
    let dataTahun: {value: number, title: string}[] = []
    let dataBulan: {value: number, title: string}[] = []
    for(let a = 2020; a <= new Date().getFullYear(); a++){
        dataTahun.push({value: a, title: a.toString()})
    }
    
    for(let a = 0; a < 12; a++){
        dataBulan.push({value: Number(a), title: format(new Date(2000, a, 1), "MMMM")})
    }
    
    let headerData: {title:string, value:string, icon: any }[] = $state([])

    const listType = [
        {value:"HKM", name:"Hari Kerja Manual"},
        {value:"Mangkir", name:"Mangkir"},
        {value:"Sakit", name:"Sakit Berkepanjangan/Sakit Ringan"},
    ]
        
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
            type: "",
            ijin_info: "",
            description: "",
            // attachment: [],
            attachment: "",
            createdBy: (()=> user?.payroll)(),
        },
        dept: (()=> userProfile.user_hrd ? "" : user?.department)(),
        payroll: (()=> user?.payroll)(),
        type:"",
        success:"",
        error:"",
        attachment: "",
        showCalendar: false,
        modal:false,
        modalAttachment:false,
        modalDelete:false,
        disabled: false,
        loading:false,
        add:false,
        edit:false,
    }

    let formAttendance = $state({...formAttendanceAnswer})

    let modeAttendance = $state({
        payroll: formAttendanceAnswer.payroll,
        name: "",
        periode: {
            start: "",
            end: "",
        },
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
            setTimeout(()=>{
                formAttendance.answer.attachment = res.attachment == null ? null : res.attachment
                formAttendance.answer.check_in = formatTanggal(res.check_in)
                formAttendance.answer.check_out = formatTanggal(res.check_out)
                formAttendance.answer.check_in2 = formatTanggal(res.check_in2)
                formAttendance.answer.check_out2 = formatTanggal(res.check_out2)
                formAttendance.answer.createdBy = user?.payroll
            }, 100)
            formAttendance.disabled = res.type ? true : false
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
        // tableAttendanceDept.invalidate()
    }
    
    // Attendance dept
    let tableAttendanceDept = $state(new TableHandler([], {rowsPerPage}))
    let tableAttendanceDeptSearch = tableAttendanceDept.createSearch()
    
    let formAttendanceDept = $state({
        dept: (()=> userProfile.user_hrd ? "" : user?.department)(),
        type:"",
    })
    
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
        month: new Date().getMonth(),
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
            approval2:"",            
        },
        dept: (()=> user?.department)(),
        payroll: (()=> userProfile.level > 1 ? "": user?.payroll)(),
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
                approval2: z.string().trim().min(1),
                spl_detail: z.array(z.object({
                    description: z.string().trim().min(1)
                }))
            })
            const isValid = valid.safeParse(formSPL.answer)
            if(isValid.success){
                const req = await axios.post('/api/lembur/spl', formSPL.answer)
                const res = await req.data
                formSPL.success = res.message
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
    
    // Fetch
    const getUser = async (val: string = "") =>{
        const req = await fetch(`/api/data?type=user_by_dept&val=${val || ""}`)
        return await req.json()
    }

    const getDept = async (val:string = '')=>{
        const req = await fetch(`/api/data?type=dept&val=${val}`)
        const res = await req.json()
        return res
    }

    const getAttendance = async (val:string) =>{
        const year = getYear(new Date())
        // const month = getMonth(new Date()) + 1
        const month = 12
        const req = await fetch(`/api/data?type=sum_attendance_by_payroll&val=${val}&year=${year}&month=${month}&start_date=${modeAttendance.periode.start}&end_date=${modeAttendance.periode.end}`)
        // const req = await fetch(`/api/data?type=sum_attendance_by_payroll&val=${val}&year=${year}&month=${month}`)
        const res = await req.json()
        modeAttendance.name = res.Name
        
        delete res.Name
        headerData = Object.entries(res).map(val => ({title:val[0], value:val[1] as string, icon:Calendar}))
    }

    const getUserByDept = $derived.by(() => {
        return async () =>{
            const req = await fetch(`/api/data?type=user_by_dept&val=${formSPL.dept}`)
            const res = await req.json()
            return res
        }
    })

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

        if (userProfile.level > 1 || userProfile.user_hrd) {
            tableAttendanceDept.load(async (state: any) => {
                try {
                    const req = await fetch(`/api/attendance?${getParams(state)}&dept=${formAttendanceDept.dept || ""}&type=${formAttendanceDept.type}&start_date=${modeAttendance.periode.start}&end_date=${modeAttendance.periode.end}`)
                    if(!req.ok) throw new Error('Gagal mengambil data')
                    const {items, totalItems} = await req.json()
                    state.setTotalRows(totalItems)
                    return items
                } catch (err:any) {
                    console.log(err.message)
                }
            })
        }

        if(userProfile.user_hrd){
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
        modeAttendance.periode = {
            start: generatePeriode(temp.toString(), Number(setting?.start_periode), Number(setting?.end_periode)).start,
            end: generatePeriode(temp.toString(), Number(setting?.start_periode), Number(setting?.end_periode)).end,
        }
    })
    
    setTimeout(()=>{
        tableAttendance.invalidate()
        if (userProfile.level > 1 || userProfile.user_hrd)
            tableAttendanceDept.invalidate()
        if(userProfile.user_hrd)
            tableListAttendance.invalidate()
        
        formLogAttendance.month = Number(format(modeAttendance.periode.start, "M"))
        tableLogAttendance.invalidate()
    }, 1000)
</script>

<svelte:head>
    <title>Attendance {(modeAttendance.payroll !== user?.payroll ? "View | " : "") + modeAttendance.name}</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">    
    {#if modeAttendance.payroll && modeAttendance.tabNo != 2}
        {#await getAttendance(modeAttendance.payroll)}
            <MyLoading message={`Loading data user`}/>
        {:then}
            <div class={`flex rounded-lg p-4 gap-4 border-[2px] border-slate-200 text-textdark ${modeAttendance.payroll == user.payroll ? "bg-bgdark":"bg-bgdark2"}`}>
                <div class="flex flex-col gap-2 min-w-fit">
                    <div class="flex flex-col">
                        <span class="font-bold text-[1rem]">{modeAttendance.name}</span>
                        <Badge class='flex gap-2 self-start text-white bg-slate-500 py-1'><IdCard size={14}/> {modeAttendance.payroll}</Badge>
                    </div>
                    <div class="flex items-center gap-2">
                        <Calendar size={15}/>
                        <div class="flex items-center gap-2">
                            <span class="text-[.9rem] font-bold">Today,</span>
                            <span class='text-[.9rem]'>{format(new Date(), "dd-MM-yyyy")}</span>
                        </div>
                    </div>
                    <div class="flex gap-2 items-center">
                        <CalendarClock />
                        <div class="flex flex-col gap-2">
                            <Badge color='indigo'>{modeAttendance.periode.start}</Badge>
                            <Badge color='indigo'>{modeAttendance.periode.end}</Badge>
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
                        <MyButton className='flex items-center gap-2' onclick={()=> formAttendance.showCalendar = true}><Calendar size={16} /> Calendar</MyButton>
                    </div>
                </div>
            </div>
        {/await}
    {/if}
    
    <div class="flex flex-col gap-3 px-4 py-4 border-slate-300 border rounded-lg">
        {#if !formAttendance.modal}
            {#if formAttendance.error}
                {#each formAttendance.error.split(';') as v}
                    <Alert dismissable>
                        <span>{v}</span>
                    </Alert>
                {/each}
            {:else if formAttendance.success}
                <Alert border color="green" dismissable>
                    <span>{formAttendance.success}</span>
                </Alert>
            {/if}
        {/if}

        <!-- Tombol Add -->
        {#if ((userProfile?.user_hrd || userProfile?.level > 1) && modeAttendance.tabNo != 2)}
            <div class="flex gap-2 items-center w-full">
                {#if (!formAttendance.add || !formAttendance.edit) && pecahArray(userProfile?.access_attendance, "C")}
                    <MyButton onclick={formAttendanceAdd}><Plus size={16}/></MyButton>
                {/if}
                <div class="flex flex-1 gap-2">
                    {#await getUser(formAttendance.dept)}
                        <MyLoading message="Loading data"/>
                    {:then val}
                        <Svelecte class='border-none' optionClass='p-2' name='payroll' required searchable selectOnTab multiple={false} bind:value={modeAttendance.payroll} 
                            options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " - " + v.name}))}
                            onChange={() => {
                                tableAttendance.invalidate()
                                tableListAttendance.invalidate()
                                tableLogAttendance.invalidate()
                        }}/>
                        {#if modeAttendance.payroll !== user?.payroll}
                            <Button onclick={handleBackToMyAttendance}>Back to my attendance</Button>
                        {/if}
                    {/await}
                </div>                
            </div>
        {/if}
        
        {#if modeAttendance.payroll}
            <Tabs contentClass='w-full' tabStyle="underline">
                <!-- Attendance pribadi/orang lain -->
                <TabItem open={modeAttendance.tabNo == 1} title={user?.payroll == modeAttendance.payroll ? "My Attendance": `Attendance ${modeAttendance.name}`} onclick={()=> modeAttendance.tabNo = 1} >
                    <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                        <div class="flex flex-col gap-4">
                            <div class="flex gap-2 items-start">
                                <select bind:value={tableAttendance.rowsPerPage} onchange={() => tableAttendance.setPage(1)}>
                                    {#each [30, 60, 90, 120] as option}
                                        <option value={option}>{option}</option>
                                    {/each}
                                </select>
                                <div class="flex flex-col">
                                    <select bind:value={formAttendance.type} onchange={()=> tableAttendance.invalidate()}>
                                        {#each filterType as option}
                                            <option value={option.value}>{option.title}</option>
                                        {/each}
                                    </select>
                                </div>
                                <div class="flex w-full flex-col">
                                    <MyInput type='text' bind:value={tableAttendanceSearch.value} onkeydown={(e: KeyboardEvent)=> {
                                        if(e.key.toLowerCase() === 'enter') tableAttendanceSearch.set()
                                    }}/>
                                    <span class="italic text-[.8rem]">For date must be following format example "2025-12-30" </span>
                                </div>
                                <MyButton className='p-3' onclick={()=>tableAttendanceSearch.set()}><Search size={16} /></MyButton>
                                <MyButton className='p-3' onclick={async ()=>{
                                    await invalidateAll()
                                    getAttendance(modeAttendance.payroll)
                                    tableAttendance.invalidate()
                                }}><RefreshCw size={16}/></MyButton>
                            </div>
                            <!-- {#if userProfile.user_hrd || userProfile.level > 1}
                                <div class="flex gap-2 items-start">
                                    {#await getUser(formAttendance.dept)}
                                        <MyLoading message="Loading data"/>
                                    {:then val}
                                        <Svelecte clearable searchable selectOnTab multiple={false} bind:value={modeAttendance.payroll} 
                                            options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " - " + v.name}))}
                                            onChange={() => tableAttendance.invalidate()}/>
                                    {/await}
                                </div>
                            {/if} -->
                        </div>
                        
                        <span class='italic text-[.8rem] text-blue-400'>* Overtime start from {setting?.overtime_allow} minute {setting?.overtime_round_up ? "(Round up)":""}</span>
                        <Datatable table={tableAttendance}>
                            <Table divClass="w-auto">
                                <TableHead>
                                    <ThSort table={tableAttendance} field="check_in">Day</ThSort>
                                    <ThSort table={tableAttendance} field="check_in">Date</ThSort>
                                    <ThSort table={tableAttendance} field="check_in">Clock In</ThSort>
                                    <ThSort table={tableAttendance} field="check_out">Clock Out</ThSort>
                                    <ThSort table={tableAttendance} field="">Difference</ThSort>
                                    <ThSort table={tableAttendance} field="type">type</ThSort>
                                    <ThSort table={tableAttendance} field="">Information</ThSort>
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
                                                <TableBodyRow class='h-10'>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{namaHari[Number(format(formatTanggal(row.check_in), "c")) - 1]}</div>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{format(formatTanggal(row.check_in), "d MMMM yyyy")}</div>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <TableAttendanceClockIn check_in={row.check_in} check_in2={row.check_in2}/>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <TableAttendanceClockOut check_out={row.check_out} check_out2={row.check_out2} check_in={row.check_in}/>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <TableAttendanceDifference check_in={row.lembur_start} check_out={row.check_out} check_in2={row.check_in2} check_out2={row.check_out2} overtime={setting.overtime_allow}/>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>{row.type}</TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <div class="flex gap-1 flex-wrap max-w-[10rem]">
                                                            {#each [...row.description.split(",").filter((v: string) => v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                                (isLate(formatTanggal(row.start_work), formatTanggal(row.check_in)) && !row.isWeekend) ? {type:"late", value:"Late"} : null,
                                                                (()=> {
                                                                    const {hour, minute} = hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2)
                                                                    const isOvertime = (hour > 0) || (hour == 0 && minute >= setting?.overtime_allow) && row.overtime
                                                                    return isOvertime
                                                                        ? {type:"lembur", value:`Overtime ${formatDifference({ round_up: setting?.overtime_round_up, overtime: setting?.overtime_allow, ...hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2), })}`}
                                                                        : null
                                                                })(),
                                                                row.ijin_info ? {type:"ijin_info", value: row.ijin_info} : null
                                                                ] as val}
                                                                {#if val}
                                                                    <Badge rounded color={val.type == "kerja" ? "dark" 
                                                                        : val.type == "late" ? "red" 
                                                                        : val.type == "lembur" ? "green" 
                                                                        : val.type == "ijin_info" ? "yellow" : "none"} onclick={()=> {
                                                                            if(val.type == 'lembur' && pecahArray(userProfile.access_spl, "C") && row.overtime && !row.is_spl_exist){
                                                                                createSPL(row.payroll, row.name, row.lembur_start, row.check_out)
                                                                            }
                                                                        }} class='flex gap-2 break-words whitespace-normal'>{val.value}
                                                                        {#if val.type == 'lembur' && pecahArray(userProfile.access_spl, "C") && row.overtime && !row.is_spl_exist}
                                                                            <SquarePlus size={14}/>
                                                                        {/if}
                                                                    </Badge>
                                                                {/if}
                                                            {/each}
                                                        </div>
                                                    </TableBodyCell>
                                                    <TableBodyCell>
                                                        {#if row.payroll != user.payroll && pecahArray(userProfile.access_attendance, "U")}
                                                            {#if (!userProfile.user_hrd && userProfile.level > row.level) 
                                                                || (userProfile.user_hrd && row.user_hrd && userProfile.level > row.level) 
                                                                || (userProfile.user_hrd && !row.user_hrd)
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
                {#if userProfile.level > 1 || userProfile.user_hrd}
                    <TabItem open={modeAttendance.tabNo == 2} title="Attendance Department" onclick={()=> modeAttendance.tabNo = 2} >
                        <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">                
                            <div class="flex flex-col gap-4">
                                <div class="flex gap-2 items-start">
                                    <select bind:value={tableAttendanceDept.rowsPerPage} onchange={() => tableAttendanceDept.setPage(1)}>
                                        {#each [30, 60, 90, 120] as option}
                                            <option value={option}>{option}</option>
                                        {/each}
                                    </select>
                                    <div class="flex flex-col">
                                        <select bind:value={formAttendanceDept.type} onchange={()=> tableAttendanceDept.invalidate()}>
                                            {#each filterType as option}
                                                <option value={option.value}>{option.title}</option>
                                            {/each}
                                        </select>
                                    </div>
                                    <div class="flex w-full flex-col">
                                        <MyInput type='text' bind:value={tableAttendanceDeptSearch.value} onkeydown={e => {
                                            if(e.key.toLowerCase() === 'enter') tableAttendanceDeptSearch.set()
                                        }}/>
                                        <span class="italic text-[.8rem]">For date must be following format example "2025-12-30" </span>
                                    </div>
                                    <MyButton className='p-3' onclick={()=>tableAttendanceDeptSearch.set()}><Search size={16} /></MyButton>
                                    <MyButton className='p-3' onclick={async ()=> {
                                        await invalidateAll()
                                        tableAttendanceDept.invalidate()
                                    }}><RefreshCw size={16}/></MyButton>
                                </div>
                                {#if userProfile.user_hrd}
                                    <div class="flex gap-2 items-start">
                                        {#await getDept()}
                                            <MyLoading message="Loading data"/>
                                        {:then val}
                                            <Svelecte clearable searchable selectOnTab multiple={false} bind:value={formAttendanceDept.dept} 
                                                options={val.map((v:any) => ({value: v.dept_code, text:v.dept_code + " - " + v.name}))}
                                                onChange={() => tableAttendanceDept.invalidate()}/>
                                        {/await}
                                    </div>
                                {/if}
                            </div>
                            
                            <span class='italic text-[.8rem] text-blue-400'>* Overtime start from {setting?.overtime_allow} minute {setting?.overtime_round_up ? "(Round up)":""}</span>
                            <Datatable table={tableAttendanceDept}>
                                <Table>
                                    <TableHead>
                                        <ThSort table={tableAttendanceDept} field="check_in">Day</ThSort>
                                        <ThSort table={tableAttendanceDept} field="check_in">Date</ThSort>
                                        <ThSort table={tableAttendanceDept} field="payroll">Payroll</ThSort>
                                        <ThSort table={tableAttendanceDept} field="name">Name</ThSort>
                                        <ThSort table={tableAttendanceDept} field="check_in">Clock In</ThSort>
                                        <ThSort table={tableAttendanceDept} field="check_out">Clock Out</ThSort>
                                        <ThSort table={tableAttendanceDept} field="">Difference</ThSort>
                                        <ThSort table={tableAttendanceDept} field="type">type</ThSort>
                                        <ThSort table={tableAttendanceDept} field="">Information</ThSort>
                                        <ThSort table={tableAttendanceDept} field="">#</ThSort>
                                    </TableHead>
            
                                    {#if tableAttendanceDept.isLoading}
                                        <div class="flex p-4 items-center">
                                            <MyLoading message="Loading data"/>
                                        </div>
                                    {:else}
                                        <TableBody tableBodyClass="divide-y">
                                            {#if tableAttendanceDept.rows.length > 0}
                                                {#each tableAttendanceDept.rows as row}
                                                    <TableBodyRow class='h-10'>
                                                        <TableBodyCell tdClass='break-all font-medium'>
                                                            <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{namaHari[Number(format(formatTanggal(row.check_in), "c")) - 1]}</div>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>
                                                            <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{format(formatTanggal(row.check_in), "d MMMM yyyy")}</div>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{row.payroll}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{row.name}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>
                                                            <TableAttendanceClockIn check_in={row.check_in} check_in2={row.check_in2}/>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>
                                                            <TableAttendanceClockOut check_out={row.check_out} check_out2={row.check_out2} check_in={row.check_in}/>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>
                                                            <TableAttendanceDifference check_in={row.lembur_start} check_out={row.check_out} check_in2={row.check_in2} check_out2={row.check_out2} overtime={setting.overtime_allow}/>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{row.type}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>
                                                            <div class="flex gap-1 flex-wrap max-w-[10rem]">
                                                                {#each [...row.description.split(",").filter((v: string) => v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                                    (isLate(formatTanggal(row.start_work), formatTanggal(row.check_in)) && !row.isWeekend) ? {type:"late", value:"Late"} : null,
                                                                    (()=> {
                                                                        const {hour, minute} = hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2)
                                                                        const isOvertime = (hour > 0) || (hour == 0 && minute >= setting?.overtime_allow) && row.overtime
                                                                        return isOvertime
                                                                            ? {type:"lembur", value:`Overtime ${formatDifference({ round_up: setting?.overtime_round_up, overtime: setting?.overtime_allow, ...hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2), })}`}
                                                                            : null
                                                                    })(),
                                                                    row.ijin_info ? {type:"ijin_info", value: row.ijin_info} : null
                                                                    ] as val}
                                                                    {#if val}
                                                                        <Badge rounded color={val.type == "kerja" ? "dark" 
                                                                            : val.type == "late" ? "red" 
                                                                            : val.type == "lembur" ? "green" 
                                                                            : val.type == "ijin_info" ? "yellow" : "none"} onclick={()=> {
                                                                                if(val.type == 'lembur' && pecahArray(userProfile.access_spl, "C") && row.overtime && !row.is_spl_exist){
                                                                                    createSPL(row.payroll, row.name, row.lembur_start, row.check_out)
                                                                                }
                                                                            }} class='flex gap-2 break-words whitespace-normal'>{val.value}
                                                                            {#if val.type == 'lembur' && pecahArray(userProfile.access_spl, "C") && row.overtime && !row.is_spl_exist}
                                                                                <SquarePlus size={14}/>
                                                                            {/if}
                                                                        </Badge>
                                                                    {/if}
                                                                {/each}
                                                            </div>
                                                        </TableBodyCell>
                                                        <TableBodyCell>
                                                            {#if row.payroll != user.payroll && pecahArray(userProfile.access_attendance, "U")}
                                                                {#if (!userProfile.user_hrd && userProfile.level > row.level) 
                                                                    || (userProfile.user_hrd && row.user_hrd && userProfile.level > row.level) 
                                                                    || (userProfile.user_hrd && !row.user_hrd)
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
                <!-- Attendance Double -->
                {#if userProfile.user_hrd}
                    <TabItem open={modeAttendance.tabNo == 3} title="Attendance Double (Conflict)" onclick={()=> modeAttendance.tabNo = 3}>
                        <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">                
                            <div class="flex flex-col gap-4">
                                <div class="flex gap-2 items-start">
                                    <select bind:value={tableListAttendance.rowsPerPage} onchange={() => tableListAttendance.setPage(1)}>
                                        {#each [30, 60, 90, 120] as option}
                                            <option value={option}>{option}</option>
                                        {/each}
                                    </select>
                                    <div class="flex flex-col">
                                        <select bind:value={formListAttendance.type} onchange={()=> tableListAttendance.invalidate()}>
                                            {#each filterType as option}
                                                <option value={option.value}>{option.title}</option>
                                            {/each}
                                        </select>
                                    </div>
                                    <div class="flex w-full flex-col">
                                        <MyInput type='text' bind:value={tableListAttendanceSearch.value} onkeydown={e => {
                                            if(e.key.toLowerCase() === 'enter') tableListAttendanceSearch.set()
                                        }}/>
                                        <span class="italic text-[.8rem]">For date must be following format example "2025-12-30" </span>
                                    </div>
                                    <MyButton className='p-3' onclick={()=>tableListAttendanceSearch.set()}><Search size={16} /></MyButton>
                                    <MyButton className='p-3' onclick={async ()=> {
                                        await invalidateAll()
                                        getAttendance(modeAttendance.payroll)
                                        tableListAttendance.invalidate()
                                    }}><RefreshCw size={16}/></MyButton>
                                </div>
                            </div>
                            
                            <span class='italic text-[.8rem] text-blue-400'>* Overtime start from {setting?.overtime_allow} minute {setting?.overtime_round_up ? "(Round up)":""}</span>
                            <Datatable table={tableListAttendance}>
                                <Table>
                                    <TableHead>
                                        <ThSort table={tableListAttendance} field="check_in">Day</ThSort>
                                        <ThSort table={tableListAttendance} field="check_in">Date</ThSort>
                                        <ThSort table={tableListAttendance} field="payroll">Payroll</ThSort>
                                        <ThSort table={tableListAttendance} field="name">Name</ThSort>
                                        <ThSort table={tableListAttendance} field="check_in">Clock In</ThSort>
                                        <ThSort table={tableListAttendance} field="check_out">Clock Out</ThSort>
                                        <ThSort table={tableListAttendance} field="type">type</ThSort>
                                        <ThSort table={tableListAttendance} field="">Information</ThSort>
                                        <ThSort table={tableListAttendance} field="">#</ThSort>
                                    </TableHead>
            
                                    {#if tableListAttendance.isLoading}
                                        <div class="flex p-4 items-center">
                                            <MyLoading message="Loading data"/>
                                        </div>
                                    {:else}
                                        <TableBody tableBodyClass="divide-y">
                                            {#if tableListAttendance.rows.length > 0}
                                                {#each tableListAttendance.rows as row}
                                                    <TableBodyRow class='h-10'>
                                                        <TableBodyCell tdClass='break-all font-medium'>
                                                            <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{namaHari[Number(format(formatTanggal(row.check_in), "c")) - 1]}</div>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>
                                                            <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{format(formatTanggal(row.check_in), "d MMMM yyyy")}</div>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{row.payroll}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{row.name}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>
                                                            <TableAttendanceClockIn check_in={row.check_in} check_in2={row.check_in2}/>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>
                                                            <TableAttendanceClockOut check_out={row.check_out} check_out2={row.check_out2} check_in={row.check_in}/>
                                                        </TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>{row.type}</TableBodyCell>
                                                        <TableBodyCell tdClass='break-all font-medium'>
                                                            <div class="flex gap-1 flex-wrap max-w-[10rem]">
                                                                {#each [...row.description.split(",").filter((v: string) => v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                                    (isLate(formatTanggal(row.start_work), formatTanggal(row.check_in)) && !row.isWeekend) ? {type:"late", value:"Late"} : null,
                                                                    (()=> {
                                                                        const {hour, minute} = hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2)
                                                                        const isOvertime = (hour > 0) || (hour == 0 && minute >= setting?.overtime_allow) && row.overtime
                                                                        return isOvertime
                                                                            ? {type:"lembur", value:`Overtime ${formatDifference({ round_up: setting?.overtime_round_up, overtime: setting?.overtime_allow, ...hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2), })}`}
                                                                            : null
                                                                    })(),
                                                                    row.ijin_info ? {type:"ijin_info", value: row.ijin_info} : null
                                                                    ] as val}
                                                                    {#if val}
                                                                        <Badge rounded color={val.type == "kerja" ? "dark" 
                                                                            : val.type == "late" ? "red" 
                                                                            : val.type == "lembur" ? "green" 
                                                                            : val.type == "ijin_info" ? "yellow" : "none"} onclick={()=> {
                                                                                if(val.type == 'lembur' && pecahArray(userProfile.access_spl, "C") && row.overtime && !row.is_spl_exist){
                                                                                    createSPL(row.payroll, row.name, row.lembur_start, row.check_out)
                                                                                }
                                                                            }} class='flex gap-2 break-words whitespace-normal'>{val.value}
                                                                            {#if val.type == 'lembur' && pecahArray(userProfile.access_spl, "C") && row.overtime && !row.is_spl_exist}
                                                                                <SquarePlus size={14}/>
                                                                            {/if}
                                                                        </Badge>
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
                    <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">                
                        <div class="flex flex-col gap-4">
                            <div class="flex gap-2 items-start">
                                <select bind:value={tableLogAttendance.rowsPerPage} onchange={() => tableLogAttendance.setPage(1)}>
                                    {#each [30, 60, 90, 120] as option}
                                        <option value={option}>{option}</option>
                                    {/each}
                                </select>
                                <div class="flex flex-col">
                                    <select bind:value={formLogAttendance.type} onchange={()=> tableLogAttendance.invalidate()}>
                                        {#each filterType as option}
                                            <option value={option.value}>{option.title}</option>
                                        {/each}
                                    </select>
                                </div>
                                <div class="flex w-full flex-col">
                                    <MyInput type='text' bind:value={tableLogAttendanceSearch.value} onkeydown={e => {
                                        if(e.key.toLowerCase() === 'enter') tableLogAttendanceSearch.set()
                                    }}/>
                                    <span class="italic text-[.8rem]">For date must be following format example "2025-12-30" </span>
                                </div>
                                <MyButton className='p-3' onclick={()=>tableLogAttendanceSearch.set()}><Search size={16} /></MyButton>
                                <MyButton className='p-3' onclick={async ()=>{
                                    await invalidateAll()
                                    tableLogAttendance.invalidate()
                                }}><RefreshCw size={16}/></MyButton>
                            </div>
                            <!-- Filter periode -->
                            <div class="flex gap-2 items-start flex-wrap">
                                <select bind:value={formLogAttendance.year} onchange={()=> tableLogAttendance.invalidate()}>
                                    {#each dataTahun as {title, value}}
                                        <option value={value}>{title} {value.toString() == new Date().getFullYear().toString() ? "(Now)" : null}</option>
                                    {/each}
                                </select>
                                <select bind:value={formLogAttendance.month} onchange={()=> tableLogAttendance.invalidate()}>
                                    {#each dataBulan as {title, value}}
                                        <option value={value}>{title} {value.toString() == format(modeAttendance.periode.start, "M") ? "(Now)" : null}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>
                        
                        <span class='italic text-[.8rem] text-blue-400'>* Overtime start from {setting?.overtime_allow} minute {setting?.overtime_round_up ? "(Round up)":""}</span>
                        <Datatable table={tableLogAttendance}>
                            <Table>
                                <TableHead>
                                    <ThSort table={tableLogAttendance} field="check_in">Day</ThSort>
                                    <ThSort table={tableLogAttendance} field="check_in">Date</ThSort>
                                    <ThSort table={tableLogAttendance} field="payroll">Payroll</ThSort>
                                    <ThSort table={tableLogAttendance} field="name">Name</ThSort>
                                    <ThSort table={tableLogAttendance} field="check_in">Clock In</ThSort>
                                    <ThSort table={tableLogAttendance} field="check_out">Clock Out</ThSort>
                                    <ThSort table={tableLogAttendance} field="">Difference</ThSort>
                                    <ThSort table={tableLogAttendance} field="type">type</ThSort>
                                    <ThSort table={tableLogAttendance} field="">Information</ThSort>
                                    <ThSort table={tableLogAttendance} field="">#</ThSort>
                                </TableHead>
        
                                {#if tableLogAttendance.isLoading}
                                    <div class="flex p-4 items-center">
                                        <MyLoading message="Loading data"/>
                                    </div>
                                {:else}
                                    <TableBody tableBodyClass="divide-y">
                                        {#if tableLogAttendance.rows.length > 0}
                                            {#each tableLogAttendance.rows as row}
                                                <TableBodyRow class='h-10'>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{namaHari[Number(format(formatTanggal(row.check_in), "c")) - 1]}</div>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{format(formatTanggal(row.check_in), "d MMMM yyyy")}</div>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>{row.payroll}</TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>{row.name}</TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <TableAttendanceClockIn check_in={row.check_in} check_in2={row.check_in2}/>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <TableAttendanceClockOut check_out={row.check_out} check_out2={row.check_out2} check_in={row.check_in}/>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <TableAttendanceDifference check_in={row.lembur_start} check_out={row.check_out} check_in2={row.check_in2} check_out2={row.check_out2} overtime={setting.overtime_allow}/>
                                                    </TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>{row.type}</TableBodyCell>
                                                    <TableBodyCell tdClass='break-all font-medium'>
                                                        <div class="flex gap-1 flex-wrap max-w-[10rem]">
                                                            {#each [...row.description.split(",").filter((v: string) => v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                                (isLate(formatTanggal(row.start_work), formatTanggal(row.check_in)) && !row.isWeekend) ? {type:"late", value:"Late"} : null,
                                                                (()=> {
                                                                    const {hour, minute} = hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2)
                                                                    const isOvertime = (hour > 0) || (hour == 0 && minute >= setting?.overtime_allow) && row.overtime
                                                                    return isOvertime
                                                                        ? {type:"lembur", value:`Overtime ${formatDifference({ round_up: setting?.overtime_round_up, overtime: setting?.overtime_allow, ...hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2), })}`}
                                                                        : null
                                                                })(),
                                                                row.ijin_info ? {type:"ijin_info", value: row.ijin_info} : null
                                                                ] as val}
                                                                {#if val}
                                                                    <Badge rounded color={val.type == "kerja" ? "dark" 
                                                                        : val.type == "late" ? "red" 
                                                                        : val.type == "lembur" ? "green" 
                                                                        : val.type == "ijin_info" ? "yellow" : "none"} onclick={()=> {
                                                                            if(val.type == 'lembur' && pecahArray(userProfile.access_spl, "C") && row.overtime && !row.is_spl_exist){
                                                                                createSPL(row.payroll, row.name, row.lembur_start, row.check_out)
                                                                            }
                                                                        }} class='flex gap-2 break-words whitespace-normal'>{val.value}
                                                                        {#if val.type == 'lembur' && pecahArray(userProfile.access_spl, "C") && row.overtime && !row.is_spl_exist}
                                                                            <SquarePlus size={14}/>
                                                                        {/if}
                                                                    </Badge>
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
                <Alert color='red'>You need select user to see this page</Alert>
            </div>
        {/if}
    </div>

    <Modal bind:open={formSPL.modalSPL} size='xl'>
        <div class="flex flex-col gap-6">
            <h3>Create SPL Direct</h3>
            
            {#if formSPL.error}
                {#each formSPL.error.split(';') as v}
                    <Alert dismissable>
                        <span>{v}</span>
                    </Alert>
                {/each}
            {:else if formSPL.success}
                <Alert color="green" dismissable>
                    <span>{formSPL.success}</span>
                </Alert>
            {/if}
            
            <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                <MyInput type='textarea' title={`Purpose`} name="purpose" bind:value={formSPL.answer.purpose}/>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">                    
                    <MyInput type='datetime' disabled title='Time Start' name="est_start" bind:value={formSPL.answer.est_start}/>
                    <MyInput type='datetime' disabled title='Time End' name="est_end" bind:value={formSPL.answer.est_end}/>
                    {#await getUserByDept() then val}
                        <div class="flex flex-col gap-2 flex-1">
                            <Label>Approval 1</Label>
                            <Svelecte class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={formSPL.answer.approval1} 
                                options={val.map((v:any) => ({value: v.payroll, text:v.payroll +" - "+v.name}))}
                            />
                        </div>
                        <div class="flex flex-col gap-2 flex-1">
                            <Label>Approval 2</Label>
                            <Svelecte class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={formSPL.answer.approval2} 
                                options={val.map((v:any) => ({value: v.payroll, text:v.payroll +" - "+v.name}))}
                            />
                        </div>
                    {/await}
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
            <img src={import.meta.env.VITE_VIEW_ATTANDANCE+formAttendance.attachment} class='' alt="Preview attachment" title='Preview attachment'>
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
        <div class="flex flex-col mt-7 p-4 gap-4">
            <MyCalendar payroll={modeAttendance.payroll}/>
        </div>
    </Modal>

    <Modal bind:open={formAttendance.modal} size={"xl"} classBody="overflow-visible">
        <div class="flex flex-col mt-7 p-4 gap-4 border border-slate-400 rounded-lg">
            {#if formAttendance.modal}
                {#if formAttendance.error}
                    {#each formAttendance.error.split(';') as v}
                        <Alert dismissable>
                            <span>{v}</span>
                        </Alert>
                    {/each}
                {:else if formAttendance.success}
                    <Alert border color="green" dismissable>
                        <span>{formAttendance.success}</span>
                    </Alert>
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
                        <input type='hidden' name="attendance_id" disabled={formAttendance.edit} bind:value={formAttendance.answer.attendance_id}/>

                        {#await getUser(formAttendance.dept)}
                            <MyLoading message="Loading user data"/>
                        {:then val}
                            <div class="flex flex-col gap-2">
                                <Label>User Id Machine</Label>
                                <Svelecte disabled={formAttendance.edit} clearable searchable selectOnTab multiple={false} optionClass='' bind:value={formAttendance.answer.user_id_machine} 
                                    options={val.map((v:any) => ({value: v.user_id_machine, text:v.payroll + " | " + v.user_id_machine + " | " + v.name}))}
                                />
                            </div>
                        {/await}                        
                        
                        {#if formAttendance.answer.user_id_machine}
                            <div class="flex flex-col gap-2">
                                <Label>Type</Label>
                                <Select size="md" disabled={formAttendance.disabled} items={listType} bind:value={formAttendance.answer.type} />
                            </div>

                            <div class="flex flex-col md:flex-row gap-2">
                                {#if formAttendance.answer.type == 'Sakit'}
                                    <MyInput type='date' title='Date From' name="check_in" endDate={formAttendance.answer.check_out} bind:value={formAttendance.answer.check_in} disabled={formAttendance.disabled}/>
                                    <MyInput type='date' title='Date End' name="check_out" startDate={formAttendance.answer.check_in} bind:value={formAttendance.answer.check_out} disabled={formAttendance.disabled}/>
                                {:else}
                                    <MyInput type='datetime' title='Check In' name="check_in" bind:value={formAttendance.answer.check_in} disabled={formAttendance.disabled}/>
                                    <MyInput type='datetime' title='Check Out' name="check_out" bind:value={formAttendance.answer.check_out} disabled={formAttendance.disabled}/>
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
                                    <Radio value="Permit" bind:group={formAttendance.answer.ijin_info}>Permit</Radio>
                                    <Radio value="Sick" bind:group={formAttendance.answer.ijin_info}>Sick</Radio>
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