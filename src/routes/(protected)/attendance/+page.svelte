<script lang="ts">
    import { fade, slide } from 'svelte/transition'
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch, Button, Modal, Label, Input, ImagePlaceholder, Tabs, TabItem, Toast, Select, MultiSelect, Datepicker } from 'flowbite-svelte';
    import {Calendar, SquareArrowUpRight, SquareArrowDownRight, ShieldUser, GalleryHorizontalEnd, TicketsPlane, Hourglass, Plane, LayoutDashboard, Ban, Check, Search, RefreshCw, Badge, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Pencil, Trash, Plus, Save} from 'lucide-svelte'
    import {dataSample, userStore} from '@lib/store/appstore'
	import { Datatable, TableHandler, ThSort } from '@vincjo/datatables/server';
	import MyButton from '@/MyButton.svelte';
	import MyLoading from '@/MyLoading.svelte';
	import MyInput from '@/MyInput.svelte';
	import { pecahArray } from '@lib/utils';
    import SveltyPicker from 'svelty-picker'
	import axios from 'axios';

    const headerData = [
        {type:"total", title:"Total Att", value:18, icon: SquareArrowUpRight, link:""},
        {type:"overtime", title:"Overtime", value: 2, icon: SquareArrowDownRight, link:""},
        {type:"late", title:"Late", value: 1, icon: SquareArrowUpRight, link:""},
        {type:"dinas", title:"Perjalanan Dinas", value: 1, icon: TicketsPlane, link:""},
        {type:"absen", title:"Absen", value: 3, icon: SquareArrowDownRight, link:""},
        {type:"annual_leave", title:"Annual Leave", value: 0, icon: SquareArrowDownRight, link:""},
    ]

    const listType = [
        {value:"CI", name:"Check In"},
        {value:"CO", name:"Check Out"},
        {value:"BI", name:"Break In"},
        {value:"BO", name:"Break Out"},
        {value:"I", name:"Ijin"},
        {value:"C", name:"Cuti"},
        {value:"M", name:"Mangkir"},
    ]
    
    const rowsPerPage = 10
    
    let tableAttendance = $state(new TableHandler([], {rowsPerPage}))
    let tableAttendanceSearch = tableAttendance.createSearch()
    
    let formAttendance = $state({
        answer: {
            attendance_id: "id",
            user_id_mesin:"",
            waktu:"",
            type: "",
            description: "",
            attachment: "",
            createdBy: $userStore.payroll,
        },
        success:"",
        error:"",
        loading:false,
        refresh:false,
        add:false,
        edit:false,
    })

    const formAttendanceSubmit = async () =>{
        try {
            formAttendance.error = ""
            formAttendance.loading = true
            Object.entries(formAttendance.answer).forEach(val=>{
                if(typeof val[1] === 'object'){
                    formAttendance.answer[val[0]] = val[1].join("")
                }
            })

            if(formAttendance.add){
                const req = await axios.post('/api/attendance', formAttendance.answer)
                const res = await req.data
                formAttendance.success = res.message
            }else if(formAttendance.edit){
                const req = await axios.put('/api/admin/profile', formAttendance.answer)
                const res = await req.data
                formAttendance.success = res.message
            }
        } catch (error: any) {
            formAttendance.error = error.message
            formAttendance.success = ""
        } finally {
            formAttendance.loading = false
            tableAttendance.invalidate()
            formAttendanceBatal()
        }
    }

    const formAttendanceBatal = () =>{
        Object.entries(formAttendance.answer).forEach(val=>{
            formAttendance.answer[val[0]] = (typeof val[1] == "boolean" ? false : "")
        })
        formAttendance.add = false
        formAttendance.edit = false
    }
    
    const formAttendanceEdit = (id:string) =>{

    }

    const formAttendanceDelete = (id:string) =>{

    }

    const profile = $derived($userStore.profile)

    // console.log(pecahArray(profile?.access_attendance, "C"))
</script>

<svelte:head>
    <title>Attendance</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-4 gap-4">
    <div class="flex flex-wrap justify-between bg-white rounded-lg p-4 gap-4 border border-slate-200">
        <div class="flex items-center gap-2">
            <Calendar size={24}/>
            <div class="flex flex-col">
                <span class="font-bold">Today</span>
                <span>1 Maret 2025</span>
            </div>
        </div>
        <div class="flex flex-wrap items-center gap-4 ">
            {#each headerData as {type, title, value, icon: Icon, link}}
                <a href={link} class="border border-slate-200 px-4 py-2 rounded-lg min-w-[8rem] md:min-w-[12rem] overflow-hidden overflow-ellipsis whitespace-nowrap">
                    <span class="text-[.9rem] font-semibold">{title}</span>
                    <div class="flex justify-between items-center gap-1">
                        <span class='text-[1.4rem]'>{value}</span>
                        <Icon size={20}/>
                    </div>
                </a>
            {/each}
        </div>
    </div>

    <Tabs>
        <TabItem open title="Dashboard">
            <div class="flex flex-col gap-4">
                <span>Dashboard Page</span>
            </div>
        </TabItem>
        <TabItem title="Attendance">
            <div class="flex flex-col gap-4">                
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

                <div class="flex flex-col gap-2 bg-white rounded-lg p-4 border-slate-500">
                    <div class="flex justify-between gap-2">
                        <div class="flex gap-2">                        
                            {#if formAttendance.add || formAttendance.edit}
                                {#if pecahArray($userStore.profile.access_attendance, "C") || pecahArray($userStore.profile.access_attendance, "U")}
                                    <MyButton onclick={formAttendanceBatal}><Ban size={16} /></MyButton>
                                    <MyButton disabled={formAttendance.loading} onclick={formAttendanceSubmit}><Save size={16}/></MyButton>
                                {/if}
                            {:else}
                                {#if pecahArray($userStore.profile.access_attendance, "C")}
                                    <MyButton onclick={()=> formAttendance.add = true}><Plus size={16}/></MyButton>
                                {/if}
                            {/if}
                        </div>
                        <select class='self-end border-slate-300 rounded-lg ring-0' bind:value={tableAttendance.rowsPerPage} onchange={() => tableAttendance.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <input class='flex-1 rounded-lg border border-slate-300 ring-0' bind:value={tableAttendanceSearch.value}/>
                        <MyButton onclick={()=>tableAttendanceSearch.set()} className='bg-white'><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableAttendance.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                </div>

                {#if formAttendance.loading}
                    <MyLoading message="Get profile data"/>
                {/if}
                {#if formAttendance.add || formAttendance.edit}
                    <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg bg-white' enctype="multipart/form-data">
                        <input type='hidden' name="attendance_id" disabled={formAttendance.edit} bind:value={formAttendance.answer.attendance_id}/>
                        <MyInput type='text' title='User Id Mesin' name="user_id_mesin" bind:value={formAttendance.answer.user_id_mesin}/>
                        <MyInput type='datetime' title='Waktu' name="Waktu" bind:value={formAttendance.answer.waktu}/>
                        
                        <div class="flex flex-col gap-2">
                            <Label>Type</Label>
                            <Select size="md" class='w-full' items={listType} bind:value={formAttendance.answer.type} />
                        </div>

                        <MyInput type='textarea' title='Description' bind:value={formAttendance.answer.description} />
                        <MyInput type='file' title='Attachment' bind:value={formAttendance.answer.attachment} />
                        {JSON.stringify(formAttendance.answer)}
                    </form>
                {/if}
                
                <Datatable table={tableAttendance}>
                    <Table>
                        <TableHead class="bg-slate-500" >
                            <ThSort table={tableAttendance} field="name"><TableHeadCell>Name</TableHeadCell></ThSort>
                            <ThSort table={tableAttendance} field="description"><TableHeadCell>Description</TableHeadCell></ThSort>
                            <ThSort table={tableAttendance} field="level"><TableHeadCell>Level</TableHeadCell></ThSort>
                            <ThSort table={tableAttendance} field="delegation"><TableHeadCell>Delegation</TableHeadCell></ThSort>
                            <ThSort table={tableAttendance} field=""><TableHeadCell>#</TableHeadCell></ThSort>
                        </TableHead>

                        <TableBody tableBodyClass="divide-y">
                            {#if tableAttendance.rows.length > 0}
                                {#each tableAttendance.rows as row}
                                    <TableBodyRow>
                                        <TableBodyCell>{row.name}</TableBodyCell>
                                        <TableBodyCell>{row.waktu}</TableBodyCell>
                                        <TableBodyCell>{row.type}</TableBodyCell>
                                        <TableBodyCell>{row.description}</TableBodyCell>
                                        <TableBodyCell>
                                            {#if pecahArray($userStore.profile.access_attendance, "U")}
                                                <MyButton onclick={()=> formAttendanceEdit(row.attendance_id)}><Pencil size={12} /></MyButton>
                                            {/if}
                                            <MyButton onclick={()=> formAttendanceDelete(row.attendance_id)}><Trash size={12} /></MyButton>
                                        </TableBodyCell>
                                    </TableBodyRow>
                                {/each}
                            {:else}
                                <TableBodyRow>
                                    <TableBodyCell colspan={4}>
                                        {#if tableAttendance.isLoading}Loading {:else}No data available{/if}
                                    </TableBodyCell>
                                </TableBodyRow>
                            {/if}
                        </TableBody>
                    </Table>
                    {#if tableAttendance.rows.length > 0}
                        <div class="flex justify-between items-center gap-2 mt-3">
                            <p class='text-muted self-end text-[.9rem]'>
                                Showing {tableAttendance.rowCount.start} to {tableAttendance.rowCount.end} of {tableAttendance.rowCount.total} rows
                                <Badge color="dark">Page {tableAttendance.currentPage}</Badge>
                            </p>
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableAttendance.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                <MyButton onclick={()=> tableAttendance.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                {#each tableAttendance.pages as page}
                                    <MyButton className={`text-muted text-[.9rem] px-3`} onclick={()=> tableAttendance.setPage(page)} type="button">{page}</MyButton>
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
                <Table class="bg-black" hoverable={true}>
                    <TableHead class="bg-slate-200" >
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
    <div class="flex flex-col bg-white rounded-lg p-4">
        
    </div>
</main>