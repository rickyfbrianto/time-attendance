<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Label, Tabs, TabItem, Toast, Badge, Select } from 'flowbite-svelte';
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import MyLoading from '@/MyLoading.svelte';
	import MyButton from '@/MyButton.svelte';
	import { Ban, Check, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Pencil, Plus, RefreshCw, Save, Search, Trash } from '@lucide/svelte';
	import MyInput from '@/MyInput.svelte';
	import axios from 'axios';
	import { pecahArray } from '@lib/utils.js';
	import { format } from 'date-fns';
	import { getParams } from '@lib/data/api';
    let {data} = $props()

    const rowsPerPage = 10
    
    let tableSPL = $state(new TableHandler([], {rowsPerPage}))
    let tableSPLSearch = tableSPL.createSearch()

    let formSPL = $state({
        answer: {
            spl_id: "id",
            payroll:"",
            description:"",
            datetime_start:"",
            datetime_end:"",
            createdBy: data.user?.payroll            
        },
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    })
    
    const formSPLSubmit = async () =>{
        try {
            formSPL.error = ""
            formSPL.loading = true
            
            if(formSPL.add){
                const req = await axios.post('/api/lembur/spl', formSPL.answer)
                const res = await req.data
                formSPL.success = res.message
            }else if(formSPL.edit){
                const req = await axios.put('/api/attendance', formSPL.answer)
                const res = await req.data
                formSPL.success = res.message
            }
        } catch (error: any) {
            formSPL.error = error.message
            formSPL.success = ""
        } finally {
            formSPL.loading = false
            tableSPL.invalidate()
            formSPLBatal()
        }
    }

    const formSPLBatal = () =>{
        Object.entries(formSPL.answer).forEach(val=>{
            formSPL.answer[val[0]] = (typeof val[1] == "boolean" ? false : "")
        })
        formSPL.add = false
        formSPL.edit = false
    }
    
    const formSPLEdit = (id:string) =>{

    }

    const formSPLDelete = (id:string) =>{

    }

    $effect(()=>{
        tableSPL.load(async (state:State) =>{
            try {
                const req = await fetch(`/api/lembur/spl?${getParams(state)}`)
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
    }, 1000)
</script>

<svelte:head>
    <title>Lembur</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-4">
    <Tabs class='bg-white'>
        <TabItem open title="Dashboard">
            <span>Dashboard Page</span>
        </TabItem>
        <TabItem title="Surat Perintah Lembur">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 bg-white rounded-lg ">
                {#if formSPL.error || formSPL.success}
                    <Toast color="red">
                        {#if formSPL.error}
                            <Ban size={16} color="#d41c08" />
                        {:else}
                            <Check size={16} color="#08d42a" />
                        {/if}
                        {formSPL.error || formSPL.success}
                    </Toast>
                {/if}

                <div class="flex flex-col gap-2">
                    <div class="flex justify-between gap-2">
                        <div class="flex gap-2">                        
                            {#if formSPL.add || formSPL.edit}
                                {#if pecahArray(data.userProfile?.access_spl, "C") || pecahArray(data.userProfile.access_spl, "U")}
                                    <MyButton onclick={formSPLBatal}><Ban size={16} /></MyButton>
                                    <MyButton disabled={formSPL.loading} onclick={formSPLSubmit}><Save size={16}/></MyButton>
                                {/if}
                            {:else}
                                {#if pecahArray(data.userProfile?.access_spl, "C")}
                                    <MyButton onclick={()=> formSPL.add = true}><Plus size={16}/></MyButton>
                                {/if}
                            {/if}
                        </div>
                        <select class='self-end border-slate-300 rounded-lg ring-0' bind:value={tableSPL.rowsPerPage} onchange={() => tableSPL.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <input class='flex-1 rounded-lg border border-slate-300 ring-0' bind:value={tableSPLSearch.value}/>
                        <MyButton onclick={()=>tableSPLSearch.set()} className='bg-white'><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableSPL.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                </div>

                {#if formSPL.loading}
                    <MyLoading message="Get attendance data"/>
                {/if}
                {#if formSPL.add || formSPL.edit}
                    <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg bg-white' enctype="multipart/form-data">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <input type='hidden' name="spl_id" disabled={formSPL.edit} bind:value={formSPL.answer.spl_id}/>
                            <MyInput type='text' title='Payroll' name="payroll" bind:value={formSPL.answer.payroll}/>
                            <MyInput type='textarea' title='Description' name="description" bind:value={formSPL.answer.description}/>
                            <MyInput type='datetime' title='Waktu Mulai' name="datetime_start" bind:value={formSPL.answer.datetime_start}/>
                            <MyInput type='datetime' title='Waktu Selesai' name="datetime_end" bind:value={formSPL.answer.datetime_end}/>
                        </div>
                        <span>User <Badge color='dark'>{data.user?.name}</Badge> </span>
                        {JSON.stringify(formSPL.answer)}
                    </form>
                {/if}
                
                <Datatable table={tableSPL}>
                    <Table>
                        <TableHead class="bg-slate-500" >
                            <ThSort table={tableSPL} field="payroll"><TableHeadCell>Payroll</TableHeadCell></ThSort>
                            <ThSort table={tableSPL} field="employee_payroll.name"><TableHeadCell>Name</TableHeadCell></ThSort>
                            <ThSort table={tableSPL} field="description"><TableHeadCell>description</TableHeadCell></ThSort>
                            <ThSort table={tableSPL} field="datetime_start"><TableHeadCell>Datetime Start</TableHeadCell></ThSort>
                            <ThSort table={tableSPL} field="datetime_end"><TableHeadCell>Datetime End</TableHeadCell></ThSort>
                            <ThSort table={tableSPL} field=""><TableHeadCell>#</TableHeadCell></ThSort>
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
                                            <TableBodyCell>{row.payroll}</TableBodyCell>
                                            <TableBodyCell>{row.employee_payroll.name}</TableBodyCell>
                                            <TableBodyCell>{row.description}</TableBodyCell>
                                            <TableBodyCell>{format(row.datetime_start, "dd-MM-yyyy HH:mm:ss")}</TableBodyCell>
                                            <TableBodyCell>{format(row.datetime_end, "dd-MM-yyyy HH:mm:ss")}</TableBodyCell>
                                            <TableBodyCell>
                                                {#if pecahArray(data.userProfile.access_spl, "U")}
                                                <MyButton onclick={()=> formSPLEdit(row.spl_id)}><Pencil size={12} /></MyButton>
                                                {/if}
                                                {#if pecahArray(data.userProfile.access_spl, "D")}
                                                <MyButton onclick={()=> formSPLDelete(row.spl_id)}><Trash size={12} /></MyButton>
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
            <div class="flex flex-col gap-4">

            </div>
        </TabItem>
    </Tabs>
</main>