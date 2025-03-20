<script lang="ts">
    import SveltyPicker from 'svelty-picker'
    import { fade, slide } from 'svelte/transition'
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Label, Tabs, TabItem, Toast, Badge, Select } from 'flowbite-svelte';
    import {Calendar, SquareArrowUpRight, SquareArrowDownRight, TicketsPlane, Ban, Check, Search, RefreshCw, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Pencil, Trash, Plus, Save} from '@lucide/svelte'
    import {dataSample } from '@lib/store/appstore'
	import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import MyButton from '@lib/components/MyButton.svelte';
	import MyLoading from '@lib/components/MyLoading.svelte';
	import MyInput from '@lib/components/MyInput.svelte';
	import { formatTanggal, pecahArray } from '@lib/utils';
    import { format } from "date-fns";
	import axios from 'axios';
	import Svelecte from 'svelecte';

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
        {value:"BI", name:"Break In"},
        {value:"BO", name:"Break Out"},
        {value:"I", name:"Ijin"},
        {value:"C", name:"Cuti"},
        {value:"M", name:"Mangkir"},
    ]
    
    const rowsPerPage = 10
    
    let tableAttendance = $state(new TableHandler([], {rowsPerPage}))
    let tableAttendanceSearch = tableAttendance.createSearch()
    
    const formAttendanceAnswer = {
        attendance_id: "id",
        user_id_machine:"",
        check_in:"",
        check_out:"",
        check_in2: "",
        check_out2: "",
        type: "",
        description: "",
        attachment: [],
        createdBy: data.user?.payroll || "",
    }
    
    let formAttendance = $state({
        answer: {...formAttendanceAnswer},
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    })
    
    const formAttendanceSubmit = async () =>{
        try {
            formAttendance.error = ""
            formAttendance.loading = true
            const formData = new FormData()
            Object.entries(formAttendance.answer).forEach(val=>{
                formData.append(val[0], val[1])
            })            
            const req = await fetch('/api/attendance', {
                method:"POST",
                body: formData,
            })
            const res = await req.json()
            formAttendance.success = res.message
            formAttendanceBatal()
        } catch (error: any) {
            formAttendance.error = error.message
            formAttendance.success = ""
        } finally {
            formAttendance.loading = false
            tableAttendance.invalidate()
        }
    }

    const formAttendanceBatal = () =>{
        formAttendance.answer = {...formAttendanceAnswer}
        formAttendance.add = false
        formAttendance.edit = false
    }
    
    const formAttendanceEdit = async (id:string) =>{
        try {
            formAttendance.loading = true
            const req = await axios.get(`/api/attendance/${id}`)
            const res = await req.data
            
            formAttendance.answer = {...res}
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

    const getUser = async () =>{
        const req = await fetch('/api/data?type=user')
        return await req.json()
    }
    
    $effect(()=>{
        tableAttendance.load(async (state:State) =>{
            try {
                const req = await fetch(`/api/attendance?payroll=${data.user?.payroll}`)
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
    }, 1000)
</script>

<svelte:head>
    <title>Attendance</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">    
    
    <div class="grid grid-cols-1 lg:grid-cols-2 justify-between rounded-lg p-6 gap-4 border-[2px] border-slate-200">
        <div class="flex items-center gap-2">
            <Calendar size={24}/>
            <div class="flex flex-col">
                <span class="font-bold">Today</span>
                <span>{format(new Date(), "dd-MM-yyyy")}</span>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-center gap-4">
            {#each headerData as {type, title, value, icon: Icon, link}}
                <a href={link} class="border-[2px] border-slate-200 px-4 py-2 rounded-lg  overflow-hidden overflow-ellipsis whitespace-nowrap">
                    <span class="text-[.9rem] font-semibold">{title}</span>
                    <div class="flex justify-between items-center gap-1">
                        <span class='text-[1.4rem]'>{value}</span>
                        <Icon size={20}/>
                    </div>
                </a>
            {/each}
        </div>
    </div>

    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="Dashboard">
            <div class="flex justify-center items-center gap-4 min-h-[50vh]">
                <span>Dashboard Page</span>
            </div>
        </TabItem>
        <TabItem title="Attendance">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                {#if formAttendance.error || formAttendance.success}
                    <Toast color="red">
                        {#if formAttendance.error}
                            <Ban size={16} color="#d41c08" />
                        {:else}
                            <Check size={16} color="#08d42a" />
                        {/if}
                        {formAttendance.error || formAttendance.success}
                    </Toast>
                {/if}

                <div class="flex flex-col gap-2">
                    <div class="flex justify-between gap-2">
                        <div class="flex gap-2">
                            {#if formAttendance.add || formAttendance.edit}
                                {#if pecahArray(userProfile?.access_attendance, "C") || pecahArray(userProfile.access_attendance, "U")}
                                    <MyButton onclick={formAttendanceBatal}><Ban size={16} /></MyButton>
                                    <MyButton disabled={formAttendance.loading} onclick={formAttendanceSubmit}><Save size={16}/></MyButton>
                                {/if}
                            {:else}
                                {#if pecahArray(userProfile?.access_attendance, "C")}
                                    <MyButton onclick={()=> formAttendance.add = true}><Plus size={16}/></MyButton>
                                {/if}
                            {/if}
                        </div>
                        <select class='self-end border-slate-300 bg-bgdark rounded-lg ring-0' bind:value={tableAttendance.rowsPerPage} onchange={() => tableAttendance.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <MyInput type='text' bind:value={tableAttendanceSearch.value}/>
                        <MyButton onclick={()=>tableAttendanceSearch.set()}><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableAttendance.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
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
                            
                            <div class="flex flex-col gap-2">
                                <Label>Type</Label>
                                <Select size="md" class='w-full' items={listType} bind:value={formAttendance.answer.type} />
                            </div>

                            <div class="flex flex-col md:flex-row gap-2">
                                <MyInput type='datetime' title='Check In' name="check_in" bind:value={formAttendance.answer.check_in}/>                            
                                <MyInput type='datetime' title='Check Out' name="check_out" bind:value={formAttendance.answer.check_out}/>                            
                            </div>
                            <div class="flex flex-col">
                                <div class="flex flex-col md:flex-row gap-2">
                                    <MyInput type='datetime' title='Check In 2' name="check_in2" bind:value={formAttendance.answer.check_in2}/>
                                    <MyInput type='datetime' title='Check Out 2' name="check_out2" bind:value={formAttendance.answer.check_out2}/>
                                </div>
                                <span class='text-[.8rem] italic text-textdark'>Check in/out 2 for handle check in on same day (default empty)</span>
                            </div>
                            <MyInput type='textarea' title='Description' bind:value={formAttendance.answer.description} />
                        </div>
                        <input type="file" onchange={e => formAttendance.answer.attachment = e.target.files[0]}/>
                        <span class='text-[.8rem]'>createdBy <Badge color='dark'>{data.user.name}</Badge> </span>
                    </form>
                {/if}
                
                <Datatable table={tableAttendance}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableAttendance} field="name"><TableHeadCell>Name</TableHeadCell></ThSort>
                            <ThSort table={tableAttendance} field="check_in"><TableHeadCell>Check In</TableHeadCell></ThSort>
                            <ThSort table={tableAttendance} field="check_out"><TableHeadCell>Check Out</TableHeadCell></ThSort>
                            <ThSort table={tableAttendance} field="type"><TableHeadCell>Type</TableHeadCell></ThSort>
                            <ThSort table={tableAttendance} field="description"><TableHeadCell>Description</TableHeadCell></ThSort>
                            <ThSort table={tableAttendance} field=""><TableHeadCell>#</TableHeadCell></ThSort>
                        </TableHead>

                        {#if tableAttendance.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                            <TableBody tableBodyClass="divide-y">
                                {#if tableAttendance.rows.length > 0}
                                    {#each tableAttendance.rows as row}
                                        <TableBodyRow>
                                            <TableBodyCell>{row.name}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.check_in) || ""}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.check_out) || ""}</TableBodyCell>
                                            <TableBodyCell>
                                                {row.type == "HKC" ? "Hari Kerja Check Log" :
                                                row.type == "HKM" ? "Hari Kerja Manual" :
                                                row.type == "CO" ? "Check Out" :
                                                row.type == "BI" ? "Break In" :
                                                row.type == "BO" ? "Break Out" : 
                                                row.type == "M" ? "Mangkir" : 
                                                row.type == "I" ? "Ijin" : 
                                                row.type == "C" ? "Cuti" :""}
                                            </TableBodyCell>
                                            <TableBodyCell>{row.description ?? "-"}</TableBodyCell>
                                            <TableBodyCell>
                                                {#if pecahArray(userProfile.access_attendance, "U") && !["HKC"].includes(row.type)}
                                                    <MyButton onclick={()=> formAttendanceEdit(row.attendance_id)}><Pencil size={12} /></MyButton>
                                                {/if}
                                                <MyButton onclick={()=> formAttendanceDelete(row.attendance_id)}><Trash size={12} /></MyButton>
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
</main>