<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Tabs, TabItem, Toast, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, TableSearch, Label, ImagePlaceholder, Dropdown, DropdownItem, MultiSelect, Select, Checkbox } from 'flowbite-svelte';
	import {Calendar, TicketsPlane, Ban, Check, Search, RefreshCw, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Pencil, Trash, Plus, Save, Badge} from '@lucide/svelte'
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
    import MyButton from '@lib/components/MyButton.svelte';
	import MyLoading from '@lib/components/MyLoading.svelte';
	import MyInput from '@lib/components/MyInput.svelte';
    import axios from 'axios';
	import { pecahArray } from '@lib/utils.js';

    const rowsPerPage = 10
    let {data} = $props()
    let userProfile = $derived(data.userProfile)

    const headerData = [
        {title:"Total Cuti", value:18, icon: Calendar, link:""},
        {title:"Sisa Cuti", value: 2, icon: Calendar, link:""},
        {title:"Cuti Bersama", value: 1, icon: Calendar, link:""},
        {title:"Ijin", value: 1, icon: Calendar, link:""},
    ]
    
    let tableCuti = $state(new TableHandler([], {rowsPerPage}))
    let tableCutiSearch = tableCuti.createSearch()
    
    const formCutiAnswer = {
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
    
    let formCuti = $state({
        answer: {...formCutiAnswer},
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    })
    
    const formCutiSubmit = async () =>{
        try {
            formCuti.error = ""
            formCuti.loading = true
            const formData = new FormData()
            Object.entries(formCuti.answer).forEach(val=>{
                formData.append(val[0], val[1])
            })            
            const req = await fetch('/api/cuti', {
                method:"POST",
                body: formData,
            })
            const res = await req.json()
            formCuti.success = res.message
            formCutiBatal()
        } catch (error: any) {
            formCuti.error = error.message
            formCuti.success = ""
        } finally {
            formCuti.loading = false
            tableCuti.invalidate()
        }
    }

    const formCutiBatal = () =>{
        formCuti.answer = {...formCutiAnswer}
        formCuti.add = false
        formCuti.edit = false
    }
    
    const formCutiEdit = async (id:string) =>{
        try {
            formCuti.loading = true
            const req = await axios.get(`/api/cuti/${id}`)
            const res = await req.data
            
            formCuti.answer = {...res}
            formCuti.answer.attachment = []
            
            formCuti.edit = true
            formCuti.add = false
            formCuti.loading = false
        } catch (error) {
            formCuti.loading = false
        }
    }

    const formCutiDelete = async (id:string) =>{
        try {
            formCuti.loading = true
            const req = await axios.delete(`/api/cuti/${id}`)
            const res = await req.data
            tableCuti.invalidate()
        } catch (error) {
        } finally {
            formCuti.loading = false
        }
    }

    $effect(()=>{
        tableCuti.load(async (state:State) =>{
            try {
                const req = await fetch(`/api/cuti?payroll=${data.user?.payroll}`)
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
        tableCuti.invalidate()
    }, 1000)
</script>

<svelte:head>
    <title>Cuti & Ijin</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">    
    
    <div class="grid grid-cols-1 justify-between rounded-lg p-6 gap-4 border-[2px] border-slate-200">
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 items-center gap-4">
            {#each headerData as {title, value, icon: Icon, link}}
                <a href={link} class="border-[2px] border-slate-200 px-4 py-2 min-w-[10rem] rounded-lg  overflow-hidden overflow-ellipsis whitespace-nowrap">
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
        <TabItem open title="Cuti">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                {#if formCuti.error || formCuti.success}
                    <Toast color="red">
                        {#if formCuti.error}
                            <Ban size={16} color="#d41c08" />
                        {:else}
                            <Check size={16} color="#08d42a" />
                        {/if}
                        {formCuti.error || formCuti.success}
                    </Toast>
                {/if}

                <div class="flex flex-col gap-2">
                    <div class="flex justify-between gap-2">
                        <div class="flex gap-2">
                            {#if formCuti.add || formCuti.edit}
                                {#if pecahArray(userProfile?.access_attendance, "C") || pecahArray(userProfile.access_attendance, "U")}
                                    <MyButton onclick={formCutiBatal}><Ban size={16} /></MyButton>
                                    <MyButton disabled={formCuti.loading} onclick={formCutiSubmit}><Save size={16}/></MyButton>
                                {/if}
                            {:else}
                                {#if pecahArray(userProfile?.access_attendance, "C")}
                                    <MyButton onclick={()=> formCuti.add = true}><Plus size={16}/></MyButton>
                                {/if}
                            {/if}
                        </div>
                        <select class='self-end border-slate-300 bg-bgdark rounded-lg ring-0' bind:value={tableCuti.rowsPerPage} onchange={() => tableCuti.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <MyInput type='text' bind:value={tableCutiSearch.value}/>
                        <MyButton onclick={()=>tableCutiSearch.set()}><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableCuti.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                </div>

                {#if formCuti.loading}
                    <MyLoading message="Get cuti data"/>
                {/if}
                {#if formCuti.add || formCuti.edit}
                    <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <input type='hidden' name="attendance_id" disabled={formCuti.edit} bind:value={formCuti.answer.attendance_id}/>
                            <MyInput type='text' title='User Id Mesin' name="user_id_machine" bind:value={formCuti.answer.user_id_machine}/>
                            <div class="flex flex-col gap-2">
                                <Label>Type</Label>
                                <Select size="md" class='w-full' items={listType} bind:value={formCuti.answer.type} />
                            </div>

                            <div class="flex flex-col md:flex-row gap-2">
                                <MyInput type='datetime' title='Check In' name="check_in" bind:value={formCuti.answer.check_in}/>                            
                                <MyInput type='datetime' title='Check Out' name="check_out" bind:value={formCuti.answer.check_out}/>                            
                            </div>
                            <div class="flex flex-col">
                                <div class="flex flex-col md:flex-row gap-2">
                                    <MyInput type='datetime' title='Check In 2' name="check_in2" bind:value={formCuti.answer.check_in2}/>
                                    <MyInput type='datetime' title='Check Out 2' name="check_out2" bind:value={formCuti.answer.check_out2}/>
                                </div>
                                <span class='text-[.8rem] italic text-textdark'>Check in/out 2 for handle check in on same day (default empty)</span>
                            </div>
                            <MyInput type='textarea' title='Description' bind:value={formCuti.answer.description} />
                        </div>
                        <span class='text-[.8rem]'>createdBy <Badge color='dark'>{data.user.name}</Badge> </span>
                    </form>
                {/if}
                
                <Datatable table={tableCuti}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableCuti} field="name"><TableHeadCell>Name</TableHeadCell></ThSort>
                            <ThSort table={tableCuti} field="check_in"><TableHeadCell>Check In</TableHeadCell></ThSort>
                            <ThSort table={tableCuti} field="check_out"><TableHeadCell>Check Out</TableHeadCell></ThSort>
                            <ThSort table={tableCuti} field="type"><TableHeadCell>Type</TableHeadCell></ThSort>
                            <ThSort table={tableCuti} field="description"><TableHeadCell>Description</TableHeadCell></ThSort>
                            <ThSort table={tableCuti} field=""><TableHeadCell>#</TableHeadCell></ThSort>
                        </TableHead>

                        {#if tableCuti.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                            <TableBody tableBodyClass="divide-y">
                                {#if tableCuti.rows.length > 0}
                                    {#each tableCuti.rows as row}
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
                    {#if tableCuti.rows.length > 0}
                        <div class="flex justify-between items-center gap-2 mt-3">
                            <p class='text-textdark self-end text-[.9rem]'>
                                Showing {tableCuti.rowCount.start} to {tableCuti.rowCount.end} of {tableCuti.rowCount.total} rows
                                <Badge color="dark">Page {tableCuti.currentPage}</Badge>
                            </p>
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableCuti.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                <MyButton onclick={()=> tableCuti.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                {#each tableCuti.pages as page}
                                    <MyButton className={`text-textdark text-[.9rem] px-3`} onclick={()=> tableCuti.setPage(page)} type="button">{page}</MyButton>
                                {/each}
                                <MyButton onclick={()=> tableCuti.setPage('next')}><ChevronRight size={16} /></MyButton>
                                <MyButton onclick={()=> tableCuti.setPage('last')}><ChevronLast size={16} /></MyButton>
                            </div>
                        </div>
                    {/if}
                </Datatable>
            </div>
        </TabItem>
        <TabItem title="Ijin">
            <div class="flex flex-col gap-4">

            </div>
        </TabItem>
    </Tabs>
</main>

