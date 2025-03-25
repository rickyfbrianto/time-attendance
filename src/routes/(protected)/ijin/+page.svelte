<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Tabs, TabItem, Toast, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Label, ImagePlaceholder, Select } from 'flowbite-svelte';
	import {Calendar, Ban, Check, Search, RefreshCw, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Pencil, Trash, Plus, Save, Badge, CalendarCheck, NotebookPen} from '@lucide/svelte'
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
    import MyButton from '@lib/components/MyButton.svelte';
	import MyLoading from '@lib/components/MyLoading.svelte';
	import MyInput from '@lib/components/MyInput.svelte';
    import axios from 'axios';
	import { formatTanggal, pecahArray } from '@lib/utils.js';
	import { Duration } from 'luxon';
	import { addDays, differenceInDays, eachDayOfInterval, format, getDay } from 'date-fns';

    const rowsPerPage = 10
    let {data} = $props()
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)

    const headerData = [
        {title:"Total Cuti", value:18, icon: Calendar, link:""},
        {title:"Sisa Cuti", value: 2, icon: Calendar, link:""},
        {title:"Cuti Bersama", value: 1, icon: Calendar, link:""},
        {title:"Ijin", value: 1, icon: Calendar, link:""},
    ]
    
    let tableIjin = $state(new TableHandler([], {rowsPerPage}))
    let tableIjinSearch = tableIjin.createSearch()

    const formIjinAnswer = {
        ijin_id: "id",
        date:[],
        type:"",
        askDuration:0,
        description: "",
        payroll: user?.payroll || "",
        dept: user?.department || "",
        status: "OPEN",
    }
    
    let formIjin = $state({
        answer: {...formIjinAnswer},
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    })
    
    const formIjinSubmit = async () =>{
        try {
            formIjin.error = ""
            formIjin.loading = true
            const req = await axios.post('/api/ijin', formIjin.answer)
            const res = await req.data
            formIjin.success = res.message
            formIjinBatal()
            tableIjin.invalidate()
        } catch (error: any) {
            formIjin.error = error.response.data.message
            formIjin.success = ""
        } finally {
            formIjin.loading = false
        }
    }

    const formIjinBatal = () =>{
        formIjin.answer = {...formIjinAnswer}
        formIjin.add = false
        formIjin.edit = false
    }
    
    const formIjinEdit = async (id:string) =>{
        try {
            formIjin.add = false
            formIjin.edit = true
            formIjin.loading = true
            const req = await axios.get(`/api/ijin/${id}`)
            const res = await req.data
            
            formIjin.answer = {...res}
            setTimeout(()=>{
                formIjin.answer.date = [formatTanggal(res.start_date), formatTanggal(res.end_date)]
            }, 100)
            
            formIjin.loading = false
        } catch (error) {
            formIjin.loading = false
        }
    }

    const formIjinDelete = async (id:string) =>{
        try {
            formIjin.loading = true
            const req = await axios.delete(`/api/ijin/${id}`)
            const res = await req.data
            tableIjin.invalidate()
        } catch (error) {
        } finally {
            formIjin.loading = false
        }
    }

    const typeList =[
        ['Pernikahan Saya', 3],
        ['Pernikahan Keluarga', 4], 
        ['Kelahiran', 5],
        ['Kematian', 6],
        ['Bencana Alam', 7],
        ['Keluarga Rawat Inap', 8],
        ['Cuti Khitanan/Baptis',2],
        ['Ibadah Haji',10]
    ]
    
    $effect(()=>{
        if(Array.isArray(formIjin.answer.date) && formIjin.answer.date[0] && formIjin.answer.date[1]){
            const daysInRange = eachDayOfInterval({ start: formIjin.answer.date[0], end: formIjin.answer.date[1] });
            
            const dayNames = daysInRange.map(date => getDay(date));
            const dayFree = user?.workhour == 7 ? [0] : [0, 6]
            let dayCount = 0 
            dayNames.forEach(day => {
                if(!dayFree.includes(day)) dayCount++
            })
            formIjin.answer.askDuration = isNaN(dayCount) ? 0 : dayCount
        }
    })
    
    $effect(()=>{
        tableIjin.load(async (state:State) =>{
            try {
                const req = await fetch(`/api/ijin?payroll=${user?.payroll}`)
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
        tableIjin.invalidate()
    }, 1000)

    console.log(user)
</script>

<svelte:head>
    <title>Ijin Page</title>
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
        <TabItem open title="Ijin">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                {#if formIjin.error || formIjin.success}
                    <Toast color="red">
                        <span class='flex gap-2'>
                            {#if formIjin.error}
                                <Ban size={16} color="#d41c08" />
                            {:else}
                                <Check size={16} color="#08d42a" />
                            {/if}
                            {formIjin.error || formIjin.success}
                        </span>
                    </Toast>
                {/if}

                <div class="flex gap-2">
                    {#if formIjin.add || formIjin.edit}
                        {#if pecahArray(userProfile?.access_ijin, "C") || pecahArray(userProfile.access_ijin, "U")}
                            <MyButton onclick={formIjinBatal}><Ban size={16} /></MyButton>
                            <MyButton disabled={formIjin.loading} onclick={formIjinSubmit}><Save size={16}/></MyButton>
                        {/if}
                    {:else}
                        {#if pecahArray(userProfile?.access_ijin, "C")}
                            <MyButton onclick={()=> formIjin.add = true}><Plus size={16}/></MyButton>
                        {/if}
                    {/if}
                </div>

                {#if formIjin.loading}
                    <MyLoading message="Get ijin data"/>
                {/if}

                {#if formIjin.add || formIjin.edit}
                    <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <input type='hidden' name="ijin_id" disabled={formIjin.edit} bind:value={formIjin.answer.ijin_id}/>
                            <div class="flex flex-col gap-2">
                                <MyInput type='daterange' title='Date' name="date" bind:value={formIjin.answer.date}/>
                                <div class="flex flex-col gap-2">
                                    <Label>Type</Label>
                                    <Select class='border-slate-300 bg-bgdark rounded-lg ring-0' bind:value={formIjin.answer.type}>
                                        {#each typeList as [item], i}
                                            <option value={item}>{item}</option>
                                        {/each}
                                    </Select>
                                </div>
                                <div class="flex flex-1 flex-col gap-2">
                                    <span class="text-[.8rem]">Your ask <span>{formIjin.answer.askDuration}</span></span>
                                </div>
                            </div>
                            <div class="flex flex-col self-start">
                                <MyInput type='textarea' title='Description' rows={4} name="description" bind:value={formIjin.answer.description}/>
                                <span class='text-[.9rem] italic'>Description min 5 character</span>
                            </div>
                        </div>
                    </form>
                {/if}
                
                <div class="flex gap-2">
                    <select class='border-slate-300 bg-bgdark rounded-lg ring-0' bind:value={tableIjin.rowsPerPage} onchange={() => tableIjin.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <MyInput type='text' bind:value={tableIjinSearch.value}/>
                    <MyButton onclick={()=>tableIjinSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableIjin.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableIjin}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableIjin} field="ijin_id">Ijin ID</ThSort>
                            <ThSort table={tableIjin} field="name">Name</ThSort>
                            <ThSort table={tableIjin} field="date">Date</ThSort>
                            <ThSort table={tableIjin} field="type">Type</ThSort>
                            <ThSort table={tableIjin} field="description">Description</ThSort>
                            <ThSort table={tableIjin} field="">#</ThSort>
                        </TableHead>

                        {#if tableIjin.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                            <TableBody tableBodyClass="divide-y">
                                {#if tableIjin.rows.length > 0}
                                    {#each tableIjin.rows as row}
                                        <TableBodyRow>                                            
                                            <TableBodyCell>{row.ijin_id}</TableBodyCell>
                                            <TableBodyCell>{row.name}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.date, false) || ""}</TableBodyCell>
                                            <TableBodyCell>{row.type}</TableBodyCell>
                                            <TableBodyCell>{row.description}</TableBodyCell>
                                            <TableBodyCell>
                                                {#if pecahArray(userProfile.access_ijin, "U")}
                                                    <MyButton onclick={()=> formIjinEdit(row.ijin_id)}><Pencil size={12} /></MyButton>
                                                {/if}
                                                <MyButton onclick={()=> formIjinDelete(row.ijin_id)}><Trash size={12} /></MyButton>
                                            </TableBodyCell>
                                        </TableBodyRow>
                                    {/each}
                                {:else}
                                    <TableBodyRow>
                                        <TableBodyCell><span>No data available</span></TableBodyCell>
                                    </TableBodyRow>
                                {/if}
                            </TableBody>
                        {/if}
                    </Table>
                    {#if tableIjin.rows.length > 0}
                        <div class="flex justify-between items-center gap-2 mt-3">
                            <p class='text-textdark self-end text-[.9rem]'>
                                Showing {tableIjin.rowCount.start} to {tableIjin.rowCount.end} of {tableIjin.rowCount.total} rows
                                <Badge color="dark">Page {tableIjin.currentPage}</Badge>
                            </p>
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableIjin.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                <MyButton onclick={()=> tableIjin.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                {#each tableIjin.pages as page}
                                    <MyButton className={`text-textdark text-[.9rem] px-3`} onclick={()=> tableIjin.setPage(page)} type="button">{page}</MyButton>
                                {/each}
                                <MyButton onclick={()=> tableIjin.setPage('next')}><ChevronRight size={16} /></MyButton>
                                <MyButton onclick={()=> tableIjin.setPage('last')}><ChevronLast size={16} /></MyButton>
                            </div>
                        </div>
                    {/if}
                </Datatable>
            </div>
        </TabItem>
    </Tabs>
</main>

