<script lang="ts">
    import { fade } from 'svelte/transition'
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Label, Tabs, TabItem, Alert, Badge, Select, Radio, Modal } from 'flowbite-svelte';
    import {Calendar, SquareArrowUpRight, SquareArrowDownRight, TicketsPlane, Ban, Check, Search, RefreshCw, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Pencil, Trash, Plus, Save, Eye} from '@lucide/svelte'
    import {dataSample } from '@lib/store/appstore'
	import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import MyButton from '@lib/components/MyButton.svelte';
	import MyLoading from '@lib/components/MyLoading.svelte';
	import MyInput from '@lib/components/MyInput.svelte';
	import { formatTanggal, pecahArray } from '@lib/utils';
    import { differenceInHours, differenceInMinutes, differenceInSeconds, format } from "date-fns";
	import axios from 'axios';
	import Svelecte from 'svelecte';
	import { z } from 'zod';
	import { fromZodError } from 'zod-validation-error';
	import { getParams } from '@lib/data/api.js';

    let {data} = $props()
    
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)

    const headerData = [
        {type:"total", title:"Total Att", value:18, icon: SquareArrowUpRight, link:""},
        {type:"overtime", title:"Overtime", value: 2, icon: SquareArrowDownRight, link:""},
        {type:"late", title:"Late", value: 1, icon: SquareArrowUpRight, link:""},
        {type:"dinas", title:"Perjalanan Dinas", value: 1, icon: TicketsPlane, link:""},
        {type:"absen", title:"Absen", value: 3, icon: SquareArrowDownRight, link:""},
        {type:"annual_leave", title:"Annual Leave", value: 0, icon: SquareArrowDownRight, link:""},
    ]

    const listType = [
        {value:"HKM", name:"Hari Kerja Manual"},
        {value:"I", name:"Ijin Resmi"},
        {value:"C", name:"Cuti"},
        {value:"M", name:"Mangkir"},
    ]
    
    const rowsPerPage = 10
    
    let tableAttendance = $state(new TableHandler([], {rowsPerPage}))
    let tableAttendanceSearch = tableAttendance.createSearch()
    
    const formAttendanceAnswer = {
        answer: {
            attendance_id: "id",
            user_id_machine:"",
            date:"",
            check_in:"",
            check_out:"",
            check_in2: "",
            check_out2: "",
            type: "",
            ijin_info: "",
            description: "",
            attachment: [],
            createdBy: user?.payroll || "",
        },
        payroll: user?.payroll || "",
        name: "",
        success:"",
        error:"",
        tab: 0,
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
        } catch (error) {
        } finally {
            formAttendance.loading = false
        }
    }

    const handleBackToMyAttendance = () =>{
        formAttendanceBatal()
        tableAttendance.invalidate()
        tableAttendanceDept.invalidate()
    }
    
    // Attendance dept
    let tableAttendanceDept = $state(new TableHandler([], {rowsPerPage}))
    let tableAttendanceDeptSearch = tableAttendanceDept.createSearch()

    const getUser = async (val: string = "") =>{
        const req = await fetch(`/api/data?type=user&val=${val}`)
        return await req.json()
    }

    const getAttendance = $derived.by(()=>{
        return async (val:string) =>{
            const req = await fetch(`/api/data?type=user&val=${val}`)
            const res = await req.json()
            formAttendance.name = res[0].name
            return res[0]
        }
    })

    const selectAttendanceUser = async (val: string) =>{
        formAttendance.payroll = val
        tableAttendance.invalidate()
        tableAttendanceDept.invalidate()
    }
    
    $effect(()=>{
        tableAttendance.load(async (state:State) =>{
            try {
                const req = await fetch(`/api/attendance?${getParams(state)}&payroll=${formAttendance.payroll}`)
                if(!req.ok) throw new Error('Gagal mengambil data')
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        tableAttendanceDept.load(async (state:State) =>{
            try {
                const req = await fetch(`/api/attendance?${getParams(state)}&dept=${user?.department}`)
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
        tableAttendanceDept.invalidate()
    }, 1000)
</script>

<svelte:head>
    <title>Attendance</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    {#await getAttendance(formAttendance.payroll)}
        <MyLoading message="Loading user"/>
    {:then val}
        <div class={`flex justify-between rounded-lg p-6 gap-4 border-[2px] border-slate-200 text-textdark ${formAttendance.payroll == user.payroll ? "bg-bgdark":"bg-bgdark2"}`}>
            <div class="flex flex-col gap-2 min-w-[8rem]">
                <div class="flex flex-col">
                    <span class="font-bold text-[1.2rem]">{val.name}</span>
                    <span class='font-bold'>{val.payroll}</span>
                </div>
                <div class="flex items-center gap-2">
                    <Calendar size={18}/>
                    <div class="flex">
                        <span class="font-bold">Today,</span>
                        <span>{format(new Date(), "dd-MM-yyyy")}</span>
                    </div>
                </div>
                {#if formAttendance.payroll !== user.payroll}
                    <MyButton onclick={handleBackToMyAttendance}>Back to my attendance</MyButton>
                {/if}
            </div>
        
            <div class="hidden lg:flex flex-wrap items-center gap-4">
                {#each headerData as {type, title, value, icon: Icon, link}}
                    <a href={link} class="border-[2px] border-slate-200 px-4 py-2 min-w-[10rem] rounded-lg overflow-hidden overflow-ellipsis whitespace-nowrap">
                        <span class="text-[.9rem] font-semibold">{title}</span>
                        <div class="flex justify-between items-center gap-1">
                            <span class='text-[1.4rem]'>{value}</span>
                            <Icon size={20}/>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    {/await}

    <div class="flex flex-col items-start gap-2 p-4 border-slate-300 border rounded-lg">
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

        {#if (!formAttendance.add || !formAttendance.edit) && pecahArray(userProfile?.access_attendance, "C")}
            <MyButton onclick={()=> {formAttendance.add = true; formAttendance.modal = true}}><Plus size={16}/></MyButton>
        {/if}

        <Tabs contentClass='w-full' tabStyle="underline">
            <TabItem open title={user?.payroll == formAttendance.payroll ? "My Attendance": `Attendance ${formAttendance.name}`}>
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">                
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
                                                    {#if pecahArray(userProfile.access_attendance, "U") }
                                                        <MyButton onclick={()=> formAttendanceEdit(row.attendance_id)}><Pencil size={12} /></MyButton>
                                                    {/if}
                                                    {#if pecahArray(userProfile.access_attendance, "D") && ["HKM"].includes(row.type)}
                                                        <MyButton onclick={()=> formAttendanceDelete(row.attendance_id)}><Trash size={12} /></MyButton>
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
            <TabItem title="Attendance Department">
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">                
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
                                                    <div class="flex items-center gap-2">
                                                        {row.payroll}
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
            <TabItem title="Attendance Log">
                <div class="flex flex-col gap-4">
                    <Table hoverable={true}>
                        <TableHead>
                            <TableHeadCell>Product name</TableHeadCell>
                            <TableHeadCell defaultSort sort={(a:{maker:string}, b:{maker:string}) => a.maker.localeCompare(b.maker)}>Color</TableHeadCell>
                            <TableHeadCell>Category</TableHeadCell>
                            <TableHeadCell sort={(a:{id:number}, b:{id:number}) => a.id - b.id}>Price</TableHeadCell>
                        </TableHead>
                        <TableBody tableBodyClass="divide-y">
                            {#each $dataSample as item, i}
                                <TableBodyRow>
                                    <TableBodyCell>{item.id}</TableBodyCell>
                                    <TableBodyCell>{item.maker}</TableBodyCell>
                                    <TableBodyCell>{item.type}</TableBodyCell>
                                    <TableBodyCell>{item.make}</TableBodyCell>
                                </TableBodyRow>
                            {/each}
                        </TableBody>
                    </Table>
                </div>
            </TabItem>
        </Tabs>
    </div>

    <Modal bind:open={formAttendance.modal} size={"xl"}>
        <div class="flex flex-col mt-7 p-4 gap-4 border border-slate-400 rounded-lg">
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

                        {#await getUser() then val}
                            <div class="flex flex-col gap-2 flex-1">
                                <Label>User Id Machine</Label>
                                <Svelecte class='rounded-lg' clearable searchable selectOnTab multiple={false} optionClass='' bind:value={formAttendance.answer.user_id_machine} 
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
                                <MyInput type='datetime' title='Check In' name="check_in" bind:value={formAttendance.answer.check_in}/>                            
                                <MyInput type='datetime' title='Check Out' name="check_out" bind:value={formAttendance.answer.check_out}/>                            
                            </div>
                            <!-- <div class="flex flex-col">
                                <div class="flex flex-col md:flex-row gap-2">
                                    <MyInput type='datetime' title='Check In 2' name="check_in2" bind:value={formAttendance.answer.check_in2}/>
                                    <MyInput type='datetime' title='Check Out 2' name="check_out2" bind:value={formAttendance.answer.check_out2}/>
                                </div>
                                <span class='text-[.8rem] italic text-textdark'>Check in/out 2 for handle check in on same day (default empty)</span>
                            </div> -->
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