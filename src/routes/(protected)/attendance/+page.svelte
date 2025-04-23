<script lang="ts">
    import { fade } from 'svelte/transition'
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Label, Tabs, TabItem, Alert, Badge, Select, Radio, Modal } from 'flowbite-svelte';
    import {Calendar, Ban, Search, RefreshCw, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Pencil, Trash, Plus, Save, Eye} from '@lucide/svelte'
	import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import MyButton from '@lib/components/MyButton.svelte';
	import MyLoading from '@lib/components/MyLoading.svelte';
	import MyInput from '@lib/components/MyInput.svelte';
	import { formatTanggal, pecahArray } from '@lib/utils';
    import { addMonths, differenceInHours, format, getYear, isBefore, startOfDay, subMonths } from "date-fns";
	import axios from 'axios';
	import Svelecte from 'svelecte';
	import { z } from 'zod';
	import { fromZodError } from 'zod-validation-error';
	import { getParams } from '@lib/data/api.js';
	import MyCalendar from '@/MyCalendar.svelte';

    const rowsPerPage = 10
    let {data} = $props()
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)
    let periode = $derived(data.periode)

    const sekarang = format(startOfDay(new Date()), "yyyy-MM-dd")
    let temp1 = new Date(Number(format(sekarang, "yyyy")), Number(format(sekarang, "MM")) - 1, periode?.start_periode)
    let temp2 = new Date(Number(format(sekarang, "yyyy")), Number(format(sekarang, "MM")) - 1, periode?.end_periode)
    const periode1 = isBefore(sekarang, temp1) ? format(subMonths(temp1, 1), "yyyy-MM-dd") : format(temp1, "yyyy-MM-dd")
    const periode2 = isBefore(sekarang, temp1) ? format(temp2, "yyyy-MM-dd") : format(addMonths(temp2, 1), "yyyy-MM-dd")

    let headerData: {title:string, value:string, icon: any }[] = $state([])
        
    let modalHeader = $state({
        modal:false,
        val:""
    })

    const listType = [
        {value:"HKM", name:"Hari Kerja Manual"},
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
            attachment: [],
            get createdBy() { return user?.payroll}
        },
        get dept() { return userProfile.user_hrd ? "" : user?.department},
        get payroll() { return user?.payroll},
        name: "",
        success:"",
        error:"",
        showCalendar: false,
        modal:false,
        loading:false,
        add:false,
        edit:false,
    }
    
    let formAttendance = $state({...formAttendanceAnswer})
    
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
                formAttendance.loading = true
                const req = await axios.post('/api/attendance', formData)
                const res = await req.data
                formAttendanceBatal()
                tableAttendance.invalidate()
                tableAttendanceDept.invalidate()
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

    const formAttendanceBatal = () => formAttendance = {...formAttendanceAnswer}
    
    const formAttendanceEdit = async (id:string) =>{
        try {
            formAttendance.modal = true
            formAttendance.loading = true
            const req = await axios.get(`/api/attendance/${id}`)
            const res = await req.data
            
            formAttendance.answer = {...res}
            setTimeout(()=>{
                formAttendance.answer.check_in = formatTanggal(res.check_in)
                formAttendance.answer.check_out = formatTanggal(res.check_out)
                formAttendance.answer.check_in2 = formatTanggal(res.check_in2)
                formAttendance.answer.check_out2 = formatTanggal(res.check_out2)
                formAttendance.answer.createdBy = user?.payroll
            }, 100)
            formAttendance.answer.attachment = []
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
            tableListAttendance.invalidate()
            formAttendance.success = res.message
        } catch (error: any) {
            formAttendance.error = error.response.data.message
            formAttendance.success = ""
        } finally {
            formAttendance.loading = false
        }
    }

    const selectAttendanceUser = async (val: string) =>{
        formAttendance.payroll = val
        tableAttendance.invalidate()
        tableAttendanceDept.invalidate()
    }
    
    const handleBackToMyAttendance = () =>{
        formAttendanceBatal()
        tableAttendance.invalidate()
        // tableAttendanceDept.invalidate()
    }
    
    // Attendance dept
    let tableAttendanceDept = $state(new TableHandler([], {rowsPerPage}))
    let tableAttendanceDeptSearch = tableAttendanceDept.createSearch()

    const formAttendanceDeptAnswer = {
        get dept() { return user?.department},
        type: "",
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    }
    
    let formAttendanceDept = $state({...formAttendanceDeptAnswer})
    
    // Attendance List for HRD
    let tableListAttendance = $state(new TableHandler([], {rowsPerPage}))
    let tableListAttendanceSearch = tableListAttendance.createSearch()

    const formListAttendanceAnswer = {
        get payroll() { return user?.payroll},
        get dept() { return userProfile.user_hrd ? "" : user?.department},
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    }
    
    let formListAttendance = $state({...formListAttendanceAnswer})

    // Attendance Log for HRD
    let tableLogAttendance = $state(new TableHandler([], {rowsPerPage}))
    let tableLogAttendanceSearch = tableLogAttendance.createSearch()

    const formLogAttendanceAnswer = {
        get payroll() { return user?.payroll},
        get dept() { return userProfile.user_hrd ? "" : user?.department},
        year: new Date().getFullYear(),
        month: new Date().getMonth(),
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    }
    
    let formLogAttendance = $state({...formLogAttendanceAnswer})
    
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
        const req = await fetch(`/api/data?type=sum_attendance_by_payroll&val=${val}&year=${year}&month=${month}`)
        const res = await req.json()
        formAttendance.name = res.Name
        
        delete res.Name
        headerData = Object.entries(res).map(val => ({title:val[0], value:val[1] as string, icon:Calendar}))
    }
    
    $effect(()=>{
    })
    
    $effect(()=>{
        tableAttendance.load(async (state:State) =>{
            try {
                const req = await fetch(`/api/attendance?${getParams(state)}&payroll=${formAttendance.payroll}&start_date=${periode1}&end_date=${periode2}`)
                if(!req.ok) throw new Error('Gagal mengambil data')
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        if (userProfile.level > 1){
            tableAttendanceDept.load(async (state:State) =>{
                try {
                    const req = await fetch(`/api/attendance?${getParams(state)}&dept=${formAttendance.dept || ""}&start_date=${periode1}&end_date=${periode2}`)
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
            tableListAttendance.load(async (state:State) =>{
                try {
                    const req = await fetch(`/api/attendance/list?${getParams(state)}&payroll=${formAttendance.payroll}`)
                    if(!req.ok) throw new Error('Gagal mengambil data')
                    const {items, totalItems} = await req.json()
                    state.setTotalRows(totalItems)
                    return items
                } catch (err:any) {
                    console.log(err.message)
                }
            })
        }

        tableLogAttendance.load(async (state:State) =>{
            try {
                const req = await fetch(`/api/attendance/log?${getParams(state)}&payroll=${formAttendance.payroll}&year=${formLogAttendance.year}&month=${formLogAttendance.month}`)
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
        tableAttendance.invalidate()
        if (userProfile.level > 1)
            tableAttendanceDept.invalidate()
        if(userProfile.user_hrd)
            tableListAttendance.invalidate()
        tableLogAttendance.invalidate()
    }, 1000)

    let dataTahun: {value: number, title: string}[] = []
    let dataBulan: {value: number, title: string}[] = []
    for(let a = 2020; a <= new Date().getFullYear(); a++){
        dataTahun.push({value: a, title: a.toString()})
    }
    for(let a = 0; a < 12; a++){
        dataBulan.push({value: Number(a), title: format(new Date(2000, a, 1), "MMMM")})
    }
</script>

<svelte:head>
    <title>Attendance</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    {#if formAttendance.payroll}
        {#await getAttendance(formAttendance.payroll)}
            <MyLoading message={`Loading users data`}/>
        {:then val}
            <div class={`flex rounded-lg p-6 gap-4 border-[2px] border-slate-200 text-textdark ${formAttendance.payroll == user.payroll ? "bg-bgdark":"bg-bgdark2"}`}>
                <div class="flex flex-col gap-2 min-w-fit">
                    <div class="flex flex-col">
                        <span class="font-bold text-[1.1rem]">{formAttendance.name}</span>
                        <span class='font-bold  text-[.95rem]'>{formAttendance.payroll}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <Calendar size={18}/>
                        <div class="flex gap-2">
                            <span class="font-bold">Today,</span>
                            <span>{format(new Date(), "dd-MM-yyyy")}</span>
                        </div>
                    </div>
                    <div class="flex gap-2 items-center">
                        <span>Periode</span>
                        <div class="flex flex-col gap-2">
                            <Badge color='indigo'>{periode1}</Badge>
                            <Badge color='indigo'>{periode2}</Badge>
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-col w-full gap-4">
                    <div class="hidden md:grid  md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 items-center gap-4">
                        {#each headerData as {title, value, icon: Icon}}
                            <div class={`flex flex-col items-start border-[2px] border-slate-200 px-4 py-2 rounded-lg overflow-hidden overflow-ellipsis whitespace-nowrap`}>
                                <!-- onclick={() => handleDetailHeader(title)}> -->
                                <span class="text-[.9rem] font-semibold">{title}</span>
                                <div class="flex justify-between items-center gap-2">
                                    <Icon size={16}/>
                                    <span class='text-[1.1rem] font-bold'>{value}</span>
                                </div>
                            </div>
                        {/each}
                    </div>
                    <div class="flex gap-4">
                        {#if formAttendance.payroll !== user?.payroll}
                        <MyButton onclick={handleBackToMyAttendance}>Back to my attendance</MyButton>
                        {/if}
                        <MyButton className='flex items-center gap-2' onclick={()=> formAttendance.showCalendar = true}><Calendar size={16} /> Calendar</MyButton>
                    </div>
                </div>
            </div>
        {/await}
    {/if}
    
    <div class="flex flex-col gap-3 p-4 border-slate-300 border rounded-lg">
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
        <div class="flex gap-4 items-center w-full">
            {#if (!formAttendance.add || !formAttendance.edit) && pecahArray(userProfile?.access_attendance, "C") && (userProfile?.user_hrd || userProfile?.level > 1)}
                <MyButton onclick={()=> {formAttendance.add = true; formAttendance.modal = true}}><Plus size={16}/></MyButton>
            {/if}
            {#if userProfile.user_hrd || userProfile.level > 1}
                <div class="flex flex-1 gap-2">
                    {#await getUser(formAttendance.dept)}
                        <MyLoading message="Loading data"/>
                    {:then val}
                        <Svelecte name='payroll' required searchable selectOnTab multiple={false} bind:value={formAttendance.payroll} 
                            options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " - " + v.name}))}
                            onChange={() => {
                                tableAttendance.invalidate()
                                tableAttendanceDept.invalidate()
                                tableLogAttendance.invalidate()
                            }}/>
                    {/await}
                </div>                
            {/if}
        </div>

        <Tabs contentClass='w-full' tabStyle="underline">
            <TabItem open title={user?.payroll == formAttendance.payroll ? "My Attendance": `Attendance ${formAttendance.name}`}>
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                    <div class="flex flex-col gap-4">
                        <div class="flex gap-2 items-start">
                            <select bind:value={tableAttendance.rowsPerPage} onchange={() => tableAttendance.setPage(1)}>
                                {#each [10, 20, 50, 100] as option}
                                    <option value={option}>{option}</option>
                                {/each}
                            </select>
                            <div class="flex w-full flex-col">
                                <MyInput type='text' bind:value={tableAttendanceSearch.value}/>
                                <span class="italic text-[.8rem]">For date must be following format example "2025-12-30" </span>
                            </div>
                            <MyButton onclick={()=>tableAttendanceSearch.set()}><Search size={16} /></MyButton>
                            <MyButton onclick={()=>tableAttendance.invalidate()}><RefreshCw size={16}/></MyButton>
                        </div>
                        <!-- {#if userProfile.user_hrd || userProfile.level > 1}
                            <div class="flex gap-2 items-start">
                                {#await getUser(formAttendance.dept)}
                                    <MyLoading message="Loading data"/>
                                {:then val}
                                    <Svelecte clearable searchable selectOnTab multiple={false} bind:value={formAttendance.payroll} 
                                        options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " - " + v.name}))}
                                        onChange={() => tableAttendance.invalidate()}/>
                                {/await}
                            </div>
                        {/if} -->
                    </div>
                    
                    <Datatable table={tableAttendance}>
                        <Table>
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
                                <TableBody tableBodyClass="divide-y">
                                    {#if tableAttendance.rows.length > 0}
                                        {#each tableAttendance.rows as row}
                                            <TableBodyRow class='h-10'>
                                                <TableBodyCell>{format(row.check_in, "EEEE")}</TableBodyCell>
                                                <TableBodyCell>{format(row.check_in, "dd MMMM yyyy")}</TableBodyCell>
                                                <TableBodyCell>{formatTanggal(row.check_in, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_in, "time")}</TableBodyCell>
                                                <TableBodyCell>{formatTanggal(row.check_out, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_out, "time")}</TableBodyCell>
                                                <TableBodyCell>
                                                    {#if differenceInHours(row.lembur_end, row.lembur_start) !== 0 && row.check_in != row.check_out && ['HKM','HKC'].includes(row.type)}
                                                        <Badge class='py-1' rounded color={differenceInHours(row.lembur_end, row.lembur_start) > 0 ? "green":"red"}>
                                                            {differenceInHours(row.lembur_end, row.lembur_start) > 0 ? "+" : (differenceInHours(row.lembur_end, row.lembur_start) < 0 ? "-":"") }
                                                            {differenceInHours(row.lembur_end, row.lembur_start) !== 0 ? differenceInHours(row.lembur_end, row.lembur_start) + " Hour": ""}
                                                            {format(row.lembur_end, "m") != "0" ? format(row.lembur_end, "m") + " Minute" :""}
                                                        </Badge>
                                                    {/if}
                                                </TableBodyCell>
                                                <TableBodyCell>{row.type}</TableBodyCell>
                                                <TableBodyCell>
                                                    <div class="flex flex-col gap-1 items-start">
                                                        {#each [...row.description.split(",").filter(v => v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                        formatTanggal(row.check_in, "time").slice(3,5) != "00" ? {type:"late", value:"Late"} : null,
                                                        differenceInHours(row.lembur_end, row.lembur_start) > 0 
                                                            ? {type:"lembur", value:`Overtime ${differenceInHours(row.lembur_end, row.lembur_start)} ${differenceInHours(row.lembur_end, row.lembur_start) == 1 ? " Hour":" Hours"} ${format(row.lembur_end, "m") != "0" ? format(row.lembur_end, "m") + " Minute" :""}`}
                                                            : null,
                                                        row.ijin_info
                                                            ? {type:"ijin_info", value: row.ijin_info}
                                                            : null
                                                        ] as val}
                                                            {#if val}
                                                                <Badge rounded color={val.type == "kerja" ? "indigo" 
                                                                : val.type == "late" ? "red" 
                                                                : val.type == "lembur" ? "yellow" 
                                                                : val.type == "ijin_info" ? "green" : "none"} class='capitalize'>{val.value}</Badge>
                                                            {/if}
                                                        {/each}
                                                    </div>
                                                </TableBodyCell>
                                                <TableBodyCell>
                                                    {#if row.payroll != user.payroll}
                                                        {#if pecahArray(userProfile.access_attendance, "U")}
                                                            <MyButton onclick={()=> formAttendanceEdit(row.attendance_id)}><Pencil size={12} /></MyButton>
                                                        {/if}
                                                        {#if pecahArray(userProfile.access_attendance, "D") && !["HKC"].includes(row.type)}
                                                            <MyButton onclick={()=> formAttendanceDelete(row.attendance_id)}><Trash size={12} /></MyButton>
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
                        {#if tableAttendance.rows.length > 0}
                            <div class="flex justify-between items-center gap-2 mt-3">
                                <p class='text-textdark self-end text-[.9rem]'>
                                    Showing {tableAttendance.rowCount.start} to {tableAttendance.rowCount.end} of {tableAttendance.rowCount.total} rows
                                    <Badge color="dark">Page {tableAttendance.currentPage}</Badge>
                                </p>
                                <div class="flex gap-2">
                                    <MyButton onclick={()=> tableAttendance.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                    <MyButton onclick={()=> tableAttendance.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                    {#each tableAttendance.pages as page}
                                        <MyButton className={`text-textdark text-[.9rem] px-3`} onclick={()=> tableAttendance.setPage(page)} type="button">{page}</MyButton>
                                    {/each}
                                    <MyButton onclick={()=> tableAttendance.setPage('next')}><ChevronRight size={16} /></MyButton>
                                    <MyButton onclick={()=> tableAttendance.setPage('last')}><ChevronLast size={16} /></MyButton>
                                </div>
                            </div>
                        {/if}
                    </Datatable>
                </div>
            </TabItem>
            {#if userProfile.level > 1}
                <TabItem title="Attendance Department">
                    <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">                
                        <div class="flex flex-col gap-4">
                            <div class="flex gap-2 items-start">
                                <select bind:value={tableAttendanceDept.rowsPerPage} onchange={() => tableAttendanceDept.setPage(1)}>
                                    {#each [10, 20, 50, 100] as option}
                                        <option value={option}>{option}</option>
                                    {/each}
                                </select>
                                <div class="flex w-full flex-col">
                                    <MyInput type='text' bind:value={tableAttendanceDeptSearch.value}/>
                                    <span class="italic text-[.8rem]">For date must be following format example "2025-12-30" </span>
                                </div>
                                <MyButton onclick={()=>tableAttendanceDeptSearch.set()}><Search size={16} /></MyButton>
                                <MyButton onclick={()=>tableAttendanceDept.invalidate()}><RefreshCw size={16}/></MyButton>
                            </div>
                            {#if userProfile.user_hrd}
                                <div class="flex gap-2 items-start">
                                    {#await getDept()}
                                        <MyLoading message="Loading data"/>
                                    {:then val}
                                        <Svelecte clearable searchable selectOnTab multiple={false} bind:value={formAttendance.dept} 
                                            options={val.map((v:any) => ({value: v.dept_code, text:v.dept_code + " - " + v.name}))}
                                            onChange={() => tableAttendanceDept.invalidate()}/>
                                    {/await}
                                </div>
                            {/if}
                        </div>
                        
                        <Datatable table={tableAttendanceDept}>
                            <Table>
                                <TableHead>
                                    <ThSort table={tableAttendanceDept} field="payroll">Payroll</ThSort>
                                    <ThSort table={tableAttendanceDept} field="name">Name</ThSort>
                                    <ThSort table={tableAttendanceDept} field="check_in">Day</ThSort>
                                    <ThSort table={tableAttendanceDept} field="check_in">Date</ThSort>
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
                                                    <TableBodyCell>
                                                        <div class="flex items-center gap-3">
                                                            <span class="min-w-[1rem]">{row.payroll}</span>
                                                            {#if formAttendance.payroll != row.payroll}
                                                                <MyButton onclick={()=> selectAttendanceUser(row.payroll)}><Eye size={12} /></MyButton>
                                                            {/if}
                                                        </div>
                                                    </TableBodyCell>
                                                    <TableBodyCell>{row.name}</TableBodyCell>
                                                    <TableBodyCell>{format(row.check_in, "EEEE")}</TableBodyCell>
                                                    <TableBodyCell>{format(row.check_in, "dd MMMM yyyy")}</TableBodyCell>
                                                    <TableBodyCell>{formatTanggal(row.check_in, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_in, "time")}</TableBodyCell>
                                                    <TableBodyCell>{formatTanggal(row.check_out, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_out, "time")}</TableBodyCell>
                                                    <TableBodyCell>
                                                        {#if differenceInHours(row.lembur_end, row.lembur_start) !== 0 && row.check_in != row.check_out}
                                                            <Badge class='py-1' rounded color={differenceInHours(row.lembur_end, row.lembur_start) > 0 ? "green":"red"}>
                                                                {differenceInHours(row.lembur_end, row.lembur_start) > 0 ? "+" : (differenceInHours(row.lembur_end, row.lembur_start) < 0 ? "-":"") }
                                                                {differenceInHours(row.lembur_end, row.lembur_start) !== 0 ? differenceInHours(row.lembur_end, row.lembur_start) + " Hour": ""}
                                                                {format(row.lembur_end, "m") != "0" ? format(row.lembur_end, "m") + " Minute" :""}
                                                            </Badge>
                                                        {/if}
                                                    </TableBodyCell>
                                                    <TableBodyCell>{row.type}</TableBodyCell>
                                                    <TableBodyCell>
                                                        <div class="flex flex-col gap-1 items-start">
                                                            {#each [...row.description.split(",").filter(v => v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                            formatTanggal(row.check_in, "time").slice(3,5) != "00" ? {type:"late", value:"Late"} : null,
                                                            differenceInHours(row.lembur_end, row.lembur_start) > 0 
                                                                ? {type:"lembur", value:`Overtime ${differenceInHours(row.lembur_end, row.lembur_start)} ${differenceInHours(row.lembur_end, row.lembur_start) == 1 ? " Hour":" Hour"} ${format(row.lembur_end, "m") != "0" ? format(row.lembur_end, "m") + " Minute" :""}`}
                                                                : null,
                                                            row.ijin_info
                                                                ? {type:"ijin_info", value: row.ijin_info}
                                                                : null
                                                            ] as val}
                                                                {#if val}
                                                                    <Badge rounded color={val.type == "kerja" ? "indigo" 
                                                                    : val.type == "late" ? "red" 
                                                                    : val.type == "lembur" ? "yellow" 
                                                                    : val.type == "ijin_info" ? "green" : "none"} class='capitalize'>{val.value}</Badge>
                                                                {/if}
                                                            {/each}
                                                        </div>
                                                    </TableBodyCell>
                                                    <TableBodyCell>
                                                        <!-- {#if formAttendance.payroll != row.payroll && row.payroll != user.payroll} -->
                                                        {#if formAttendance.payroll != row.payroll }
                                                            {#if pecahArray(userProfile.access_attendance, "U") && ["HKM"].includes(row.type)}
                                                                <MyButton onclick={()=> formAttendanceEdit(row.attendance_id)}><Pencil size={12} /></MyButton>
                                                            {/if}
                                                        {/if}
                                                        <!-- {#if pecahArray(userProfile.access_attendance, "D") && ["HKM"].includes(row.type)}
                                                            <MyButton onclick={()=> formAttendanceDelete(row.attendance_id)}><Trash size={12} /></MyButton>
                                                        {/if} -->
                                                    </TableBodyCell>
                                                </TableBodyRow>
                                            {/each}
                                        {:else}
                                            <span>No data available</span>
                                        {/if}
                                    </TableBody>
                                {/if}
                            </Table>
                            {#if tableAttendanceDept.rows.length > 0}
                                <div class="flex justify-between items-center gap-2 mt-3">
                                    <p class='text-textdark self-end text-[.9rem]'>
                                        Showing {tableAttendanceDept.rowCount.start} to {tableAttendanceDept.rowCount.end} of {tableAttendanceDept.rowCount.total} rows
                                        <Badge color="dark">Page {tableAttendanceDept.currentPage}</Badge>
                                    </p>
                                    <div class="flex gap-2">
                                        <MyButton onclick={()=> tableAttendanceDept.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                        <MyButton onclick={()=> tableAttendanceDept.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                        {#each tableAttendanceDept.pages as page}
                                            <MyButton className={`text-textdark text-[.9rem] px-3`} onclick={()=> tableAttendanceDept.setPage(page)} type="button">{page}</MyButton>
                                        {/each}
                                        <MyButton onclick={()=> tableAttendanceDept.setPage('next')}><ChevronRight size={16} /></MyButton>
                                        <MyButton onclick={()=> tableAttendanceDept.setPage('last')}><ChevronLast size={16} /></MyButton>
                                    </div>
                                </div>
                            {/if}
                        </Datatable>
                    </div>
                </TabItem>
            {/if}
            {#if userProfile.user_hrd}
                <TabItem title="Attendance Double (Conflict)">
                    <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">                
                        <div class="flex flex-col gap-4">
                            <div class="flex gap-2 items-start">
                                <select bind:value={tableListAttendance.rowsPerPage} onchange={() => tableListAttendance.setPage(1)}>
                                    {#each [10, 20, 50, 100] as option}
                                        <option value={option}>{option}</option>
                                    {/each}
                                </select>
                                <div class="flex w-full flex-col">
                                    <MyInput type='text' bind:value={tableListAttendanceSearch.value}/>
                                    <span class="italic text-[.8rem]">For date must be following format example "2025-12-30" </span>
                                </div>
                                <MyButton onclick={()=>tableListAttendanceSearch.set()}><Search size={16} /></MyButton>
                                <MyButton onclick={()=>tableListAttendance.invalidate()}><RefreshCw size={16}/></MyButton>
                            </div>
                            <!-- <div class="flex gap-2 items-start">
                                {#await getUser(formListAttendance.dept)}
                                    <MyLoading message="Loading data"/>
                                {:then val}
                                    <Svelecte clearable searchable selectOnTab multiple={false} bind:value={formListAttendance.payroll} 
                                        options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " - " + v.name}))}
                                        onChange={() => tableListAttendance.invalidate()}/>
                                {/await}
                            </div> -->
                        </div>
                        
                        <Datatable table={tableListAttendance}>
                            <Table>
                                <TableHead>
                                    <ThSort table={tableListAttendance} field="payroll">Payroll</ThSort>
                                    <ThSort table={tableListAttendance} field="name">Name</ThSort>
                                    <ThSort table={tableListAttendance} field="check_in">Day</ThSort>
                                    <ThSort table={tableListAttendance} field="check_in">Date</ThSort>
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
                                                    <TableBodyCell>{row.payroll}</TableBodyCell>
                                                    <TableBodyCell>{row.name}</TableBodyCell>
                                                    <TableBodyCell>{format(row.check_in, "EEEE")}</TableBodyCell>
                                                    <TableBodyCell>{format(row.check_in, "dd MMMM yyyy")}</TableBodyCell>
                                                    <TableBodyCell>{formatTanggal(row.check_in, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_in, "time")}</TableBodyCell>
                                                    <TableBodyCell>{formatTanggal(row.check_out, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_out, "time")}</TableBodyCell>
                                                    <TableBodyCell>{row.type}</TableBodyCell>
                                                    <TableBodyCell>
                                                        <div class="flex flex-col gap-1 items-start">
                                                            {#each [...row.description.split(",").filter(v => v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                            formatTanggal(row.check_in, "time").slice(3,5) != "00" ? {type:"late", value:"Late"} : null,
                                                            differenceInHours(row.lembur_end, row.lembur_start) > 0 
                                                                ? {type:"lembur", value:`Overtime ${differenceInHours(row.lembur_end, row.lembur_start)} ${differenceInHours(row.lembur_end, row.lembur_start) == 1 ? " Hour":" Hour"} ${format(row.lembur_end, "m") != "0" ? format(row.lembur_end, "m") + " Minute" :""}`}
                                                                : null,
                                                            row.ijin_info
                                                                ? {type:"ijin_info", value: row.ijin_info}
                                                                : null
                                                            ] as val}
                                                                {#if val}
                                                                    <Badge rounded color={val.type == "kerja" ? "indigo" 
                                                                    : val.type == "late" ? "red" 
                                                                    : val.type == "lembur" ? "yellow" 
                                                                    : val.type == "ijin_info" ? "green" : "none"} class='capitalize'>{val.value}</Badge>
                                                                {/if}
                                                            {/each}
                                                        </div>
                                                    </TableBodyCell>
                                                    <TableBodyCell>
                                                        {#if formListAttendance.payroll != row.payroll && row.payroll != user.payroll}
                                                            {#if pecahArray(userProfile.access_attendance, "D")}
                                                                <MyButton onclick={()=> formAttendanceDelete(row.attendance_id)}><Trash size={12} /></MyButton>
                                                            {/if}
                                                        {/if}
                                                    </TableBodyCell>
                                                </TableBodyRow>
                                            {/each}
                                        {:else}
                                            <span>No data available</span>
                                        {/if}
                                    </TableBody>
                                {/if}
                            </Table>
                            {#if tableListAttendance.rows.length > 0}
                                <div class="flex justify-between items-center gap-2 mt-3">
                                    <p class='text-textdark self-end text-[.9rem]'>
                                        Showing {tableListAttendance.rowCount.start} to {tableListAttendance.rowCount.end} of {tableListAttendance.rowCount.total} rows
                                        <Badge color="dark">Page {tableListAttendance.currentPage}</Badge>
                                    </p>
                                    <div class="flex gap-2">
                                        <MyButton onclick={()=> tableListAttendance.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                        <MyButton onclick={()=> tableListAttendance.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                        {#each tableListAttendance.pages as page}
                                            <MyButton className={`text-textdark text-[.9rem] px-3`} onclick={()=> tableListAttendance.setPage(page)} type="button">{page}</MyButton>
                                        {/each}
                                        <MyButton onclick={()=> tableListAttendance.setPage('next')}><ChevronRight size={16} /></MyButton>
                                        <MyButton onclick={()=> tableListAttendance.setPage('last')}><ChevronLast size={16} /></MyButton>
                                    </div>
                                </div>
                            {/if}
                        </Datatable>
                    </div>
                </TabItem>
            {/if}
            <TabItem title="Attendance Log">
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">                
                    <div class="flex flex-col gap-4">
                        <div class="flex gap-2 items-start">
                            <select bind:value={tableLogAttendance.rowsPerPage} onchange={() => tableLogAttendance.setPage(1)}>
                                {#each [10, 20, 50, 100] as option}
                                    <option value={option}>{option}</option>
                                {/each}
                            </select>
                            <div class="flex w-full flex-col">
                                <MyInput type='text' bind:value={tableAttendanceSearch.value}/>
                                <span class="italic text-[.8rem]">For date must be following format example "2025-12-30" </span>
                            </div>
                            <MyButton onclick={()=>tableLogAttendanceSearch.set()}><Search size={16} /></MyButton>
                            <MyButton onclick={()=>tableLogAttendance.invalidate()}><RefreshCw size={16}/></MyButton>
                        </div>
                        <div class="flex gap-2 items-start flex-wrap">
                            <select bind:value={formLogAttendance.year} onchange={()=> tableLogAttendance.invalidate()}>
                                {#each dataTahun as {title, value}}
                                    <option value={value}>{title} {value.toString() == new Date().getFullYear().toString() ? "Now" : null}</option>
                                {/each}
                            </select>
                            <select bind:value={formLogAttendance.month} onchange={()=> tableLogAttendance.invalidate()}>
                                {#each dataBulan as {title, value}}
                                    <option value={value}>{title} {value.toString() == format(periode1, "M") ? "Now" : null}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                    {Number(format(periode1, "M")) - 1}
                    
                    <Datatable table={tableLogAttendance}>
                        <Table>
                            <TableHead>
                                <ThSort table={tableLogAttendance} field="payroll">Payroll</ThSort>
                                <ThSort table={tableLogAttendance} field="name">Name</ThSort>
                                <ThSort table={tableLogAttendance} field="check_in">Day</ThSort>
                                <ThSort table={tableLogAttendance} field="check_in">Date</ThSort>
                                <ThSort table={tableLogAttendance} field="check_in">Clock In</ThSort>
                                <ThSort table={tableLogAttendance} field="check_out">Clock Out</ThSort>
                                <ThSort table={tableAttendance} field="">Difference</ThSort>
                                <ThSort table={tableAttendance} field="type">type</ThSort>
                                <ThSort table={tableAttendance} field="">Information</ThSort>
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
                                                <TableBodyCell>{row.payroll}</TableBodyCell>
                                                <TableBodyCell>{row.name}</TableBodyCell>
                                                <TableBodyCell>{format(row.check_in, "EEEE")}</TableBodyCell>
                                                <TableBodyCell>{format(row.check_in, "dd MMMM yyyy")}</TableBodyCell>
                                                <TableBodyCell>{formatTanggal(row.check_in, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_in, "time")}</TableBodyCell>
                                                <TableBodyCell>{formatTanggal(row.check_out, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_out, "time")}</TableBodyCell>
                                                <TableBodyCell>
                                                    {#if differenceInHours(row.lembur_end, row.lembur_start) !== 0 && row.check_in != row.check_out && ['HKM','HKC'].includes(row.type)}
                                                        <Badge class='py-1' rounded color={differenceInHours(row.lembur_end, row.lembur_start) > 0 ? "green":"red"}>
                                                            {differenceInHours(row.lembur_end, row.lembur_start) > 0 ? "+" : (differenceInHours(row.lembur_end, row.lembur_start) < 0 ? "-":"") }
                                                            {differenceInHours(row.lembur_end, row.lembur_start) !== 0 ? differenceInHours(row.lembur_end, row.lembur_start) + " Hour": ""}
                                                            {format(row.lembur_end, "m") != "0" ? format(row.lembur_end, "m") + " Minute" :""}
                                                        </Badge>
                                                    {/if}
                                                </TableBodyCell>
                                                <TableBodyCell>{row.type}</TableBodyCell>
                                                <TableBodyCell>
                                                    <div class="flex flex-col gap-1 items-start">
                                                        {#each [...row.description.split(",").filter(v => v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                        formatTanggal(row.check_in, "time").slice(3,5) != "00" ? {type:"late", value:"Late"} : null,
                                                        differenceInHours(row.lembur_end, row.lembur_start) > 0 
                                                            ? {type:"lembur", value:`Overtime ${differenceInHours(row.lembur_end, row.lembur_start)} ${differenceInHours(row.lembur_end, row.lembur_start) == 1 ? " Hour":" Hours"} ${format(row.lembur_end, "m") != "0" ? format(row.lembur_end, "m") + " Minute" :""}`}
                                                            : null,
                                                        row.ijin_info
                                                            ? {type:"ijin_info", value: row.ijin_info}
                                                            : null
                                                        ] as val}
                                                            {#if val}
                                                                <Badge rounded color={val.type == "kerja" ? "indigo" 
                                                                : val.type == "late" ? "red" 
                                                                : val.type == "lembur" ? "yellow" 
                                                                : val.type == "ijin_info" ? "green" : "none"} class='capitalize'>{val.value}</Badge>
                                                            {/if}
                                                        {/each}
                                                    </div>
                                                </TableBodyCell>
                                            </TableBodyRow>
                                        {/each}
                                    {:else}
                                        <span>No data available</span>
                                    {/if}
                                </TableBody>
                            {/if}
                        </Table>
                        {#if tableLogAttendance.rows.length > 0}
                            <div class="flex justify-between items-center gap-2 mt-3">
                                <p class='text-textdark self-end text-[.9rem]'>
                                    Showing {tableLogAttendance.rowCount.start} to {tableLogAttendance.rowCount.end} of {tableLogAttendance.rowCount.total} rows
                                    <Badge color="dark">Page {tableLogAttendance.currentPage}</Badge>
                                </p>
                                <div class="flex gap-2">
                                    <MyButton onclick={()=> tableLogAttendance.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                    <MyButton onclick={()=> tableLogAttendance.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                    {#each tableLogAttendance.pages as page}
                                        <MyButton className={`text-textdark text-[.9rem] px-3`} onclick={()=> tableLogAttendance.setPage(page)} type="button">{page}</MyButton>
                                    {/each}
                                    <MyButton onclick={()=> tableLogAttendance.setPage('next')}><ChevronRight size={16} /></MyButton>
                                    <MyButton onclick={()=> tableLogAttendance.setPage('last')}><ChevronLast size={16} /></MyButton>
                                </div>
                            </div>
                        {/if}
                    </Datatable>
                </div>
            </TabItem>
        </Tabs>
    </div>

    <Modal bind:open={formAttendance.showCalendar} size={"xl"} >
        <div class="flex flex-col mt-7 p-4 gap-4">
            <MyCalendar/>
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
                <MyLoading message="Get attendance data"/>
            {/if}
            {#if formAttendance.add || formAttendance.edit}
                <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg' enctype="multipart/form-data">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <input type='hidden' name="attendance_id" disabled={formAttendance.edit} bind:value={formAttendance.answer.attendance_id}/>

                        {#await getUser(formAttendance.dept)}
                            <MyLoading message="Loading data"/>
                        {:then val}
                            <div class="flex flex-col gap-2">
                                <Label>User Id Machine</Label>
                                <Svelecte clearable searchable selectOnTab multiple={false} optionClass='' bind:value={formAttendance.answer.user_id_machine} 
                                    options={val.map((v:any) => ({value: v.user_id_machine, text:v.payroll + " | " + v.user_id_machine + " | " + v.name}))}
                                />
                            </div>
                        {/await}                        
                        
                        {#if formAttendance.answer.user_id_machine}
                            <div class="flex flex-col gap-2">
                                <Label>Type</Label>
                                <Select size="md" items={listType} bind:value={formAttendance.answer.type} />
                            </div>

                            <div class="flex flex-col md:flex-row gap-2">
                                {#if formAttendance.answer.type == 'Sakit'}
                                    <MyInput type='date' title='Date From' name="check_in" endDate={formAttendance.answer.check_out} bind:value={formAttendance.answer.check_in}/>
                                    <MyInput type='date' title='Date End' name="check_out" startDate={formAttendance.answer.check_in} bind:value={formAttendance.answer.check_out}/>
                                {:else}
                                    <MyInput type='datetime' title='Check In' name="check_in" endDate={formAttendance.answer.check_out} bind:value={formAttendance.answer.check_in}/>
                                    <MyInput type='datetime' title='Check Out' name="check_out" startDate={formAttendance.answer.check_in} bind:value={formAttendance.answer.check_out}/>
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
                                <input class="border self-end" type="file" onchange={e => formAttendance.answer.attachment = e.target.files[0]}/>
                            {/if}
                        {/if}                            
                    </div>
                    <span class='text-[.8rem]'>createdBy <Badge color='dark'>{user.name}</Badge> </span>
                </form>
            {/if}
        </div>
    </Modal>
</main>