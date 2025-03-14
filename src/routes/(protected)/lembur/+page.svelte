<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Tabs, TabItem, Toast, Badge} from 'flowbite-svelte';
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import MyLoading from '@/MyLoading.svelte';
	import MyButton from '@/MyButton.svelte';
	import { Ban, Check, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Minus, Pencil, Plus, RefreshCw, Save, Search, Trash } from '@lucide/svelte';
	import MyInput from '@/MyInput.svelte';
	import axios from 'axios';
	import { pecahArray } from '@lib/utils.js';
	import { format } from 'date-fns';
	import { getParams } from '@lib/data/api';
    let { data } = $props()

    const rowsPerPage = 10
    
    let tableSPL = $state(new TableHandler([], {rowsPerPage}))
    let tableSPLSearch = tableSPL.createSearch()

    const formSPLAnswer = {
        spl_id: "id",
        payroll:"",
        description:[''],
        est_start:"",
        est_end:"",
        createdBy: data.user?.payroll            
    }
    
    let formSPL = $state({
        answer: {...formSPLAnswer},
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
            const req = await axios.post('/api/lembur/spl', formSPL.answer)
            const res = await req.data
            formSPL.success = res.message
            formSPLBatal()
        } catch (error: any) {
            formSPL.error = error.response.data.message
            formSPL.success = ""
        } finally {
            formSPL.loading = false
            tableSPL.invalidate()
        }
    }

    const formSPLBatal = () =>{
        formSPL.answer = {...formSPLAnswer}
        formSPL.add = false
        formSPL.edit = false
    }
    
    const formSPLEdit = async (id:string) =>{
        try {
            formSPL.loading = true
            const req = await axios.get(`/api/lembur/spl/${id}`)
            const res = await req.data
            formSPL.answer = {...res, description: res.spl_detail.map((val: {description:string}) => val.description)}
            formSPL.edit = true
            formSPL.add = false
            formSPL.loading = false
        } catch (error) {
            formSPL.loading = false
        }
    }

    const formSPLDelete = (id:string) =>{

    }

    $effect(()=>{
        tableSPL.load(async (state:State) => {
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
        <TabItem title="Dashboard">
            <span>Dashboard Page</span>
        </TabItem>
        <TabItem open title="Surat Perintah Lembur">
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
                    <MyLoading message="Get SPL data"/>
                {/if}
                {#if formSPL.add || formSPL.edit}
                    <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg bg-white' enctype="multipart/form-data">
                        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <input type='hidden' name="spl_id" disabled={formSPL.edit} bind:value={formSPL.answer.spl_id}/>
                            <MyInput type='text' title='Payroll' name="payroll" bind:value={formSPL.answer.payroll}/>
                            
                            <MyInput type='datetime' title='Waktu Mulai' name="est_start" bind:value={formSPL.answer.est_start}/>
                            <MyInput type='datetime' title='Waktu Selesai' name="est_end" bind:value={formSPL.answer.est_end}/>
                        </div>
                        <div class="flex flex-col gap-2">
                            {#each formSPL.answer.description as desc, i}
                                <div class="flex items-end gap-2">
                                    <MyInput type='textarea' title={`Description ${i+1}`} name="description" bind:value={formSPL.answer.description[i]}/>
                                    <div class="flex flex-col gap-2">
                                        {#if i == formSPL.answer.description.length - 1}
                                            <MyButton className='self-start' onclick={()=>formSPL.answer.description.push('')}><Plus size={14} color='green' /></MyButton>
                                        {/if}
                                        {#if formSPL.answer.description.length > 1}
                                            <MyButton className='self-start' onclick={()=> formSPL.answer.description.splice(i, 1)}><Minus size={14} color='red' /></MyButton>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        </div>
                        <span>User <Badge color='dark'>{formSPL.answer.createdBy}</Badge> </span>
                    </form>
                {/if}
                
                <Datatable table={tableSPL}>
                    <Table>
                        <TableHead class="bg-slate-500" >
                            <ThSort table={tableSPL} field="payroll"><TableHeadCell>Payroll</TableHeadCell></ThSort>
                            <ThSort table={tableSPL} field="employee_payroll.name"><TableHeadCell>Name</TableHeadCell></ThSort>
                            <ThSort table={tableSPL} field="est_start"><TableHeadCell>Datetime Start</TableHeadCell></ThSort>
                            <ThSort table={tableSPL} field="est_end"><TableHeadCell>Datetime End</TableHeadCell></ThSort>
                            {#if pecahArray(data.userProfile.access_spl, "U") || pecahArray(data.userProfile.access_spl, "D")}
                                <ThSort table={tableSPL} field=""><TableHeadCell>#</TableHeadCell></ThSort>
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
                                            <TableBodyCell>{row.payroll}</TableBodyCell>
                                            <TableBodyCell>{row.employee_payroll.name}</TableBodyCell>
                                            <TableBodyCell>{format(row.est_start, "dd-MM-yyyy HH:mm:ss")}</TableBodyCell>
                                            <TableBodyCell>{format(row.est_end, "dd-MM-yyyy HH:mm:ss")}</TableBodyCell>
                                            {#if pecahArray(data.userProfile.access_spl, "U") || pecahArray(data.userProfile.access_spl, "D")}
                                                <TableBodyCell>
                                                    {#if pecahArray(data.userProfile.access_spl, "U")}<MyButton onclick={()=> formSPLEdit(row.spl_id)}><Pencil size={12} /></MyButton>{/if}
                                                    {#if pecahArray(data.userProfile.access_spl, "D")}<MyButton onclick={()=> formSPLDelete(row.spl_id)}><Trash size={12} /></MyButton>{/if}
                                                </TableBodyCell>
                                            {/if}
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