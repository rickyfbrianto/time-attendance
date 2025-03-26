<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Tabs, TabItem, Toast, Badge, Select, Label, Dropdown} from 'flowbite-svelte';
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import MyLoading from '@/MyLoading.svelte';
	import MyButton from '@/MyButton.svelte';
	import { Ban, Check, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, CloudCog, Minus, Pencil, Plus, RefreshCw, Save, Search, Trash } from '@lucide/svelte';
	import MyInput from '@/MyInput.svelte';
	import axios from 'axios';
	import { pecahArray, formatTanggal, getPeriode } from '@lib/utils.js';
    import { getParams } from '@lib/data/api';
	import { format, set, setDate, startOfDay, subMonths } from 'date-fns';
    import Svelecte from 'svelecte'
    import bglembur from '@lib/assets/bg-lembur.jpg'
    
    let {data} = $props()
    let user = $derived(data.user) 
    let userProfile = $derived(data.userProfile)

    const rowsPerPage = 10
    
    let tableSPL = $state(new TableHandler([], {rowsPerPage}))
    let tableSPLSearch = tableSPL.createSearch()

    let settingState = $state({
        start_periode: new Date(),
        end_periode: new Date(),
    })
    
    const formSPLAnswer = {
        spl_id: "id",
        purpose:"",
        dept: user?.department,
        spl_detail:[{payroll:"",description:""}],
        est_start:"",
        est_end:"",
        createdBy: user?.payroll,
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
            tableSPL.invalidate()
        } catch (error: any) {
            formSPL.error = error.response.data.message
            formSPL.success = ""
        } finally {
            formSPL.loading = false
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
            
            formSPL.answer = {...res,
                est_start: formatTanggal(res.est_start),
                est_end: formatTanggal(res.est_end),
                spl_detail: res.spl_detail.map(({payroll, description}) => ({payroll, description: description.trim() }))
            }
            formSPL.edit = true
            formSPL.add = false
            formSPL.loading = false
        } catch (error) {
            formSPL.loading = false
        }
    }

    const formSPLDelete = async (id:string) =>{
        formSPL.error = ""
        const req = await axios.delete(`/api/lembur/spl/${id}`)
        const res = await req.data
        formSPL.success = res.message
        tableSPL.invalidate()
    }
    
    // SRL
    let tableSRL = $state(new TableHandler([], {rowsPerPage}))
    let tableSRLSearch = tableSRL.createSearch()
    
    const formSRLAnswer = {
        srl_id: "id",
        spl_id: "",
        payroll: user?.payroll,
        real_start: "",
        real_end:"",
        srl_detail:[{description:"", status: ""}],
    }

    let formSRLDetailAnswer = $state([])
    
    let formSRL = $state({
        answer: {...formSRLAnswer},
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    })
    
    const formSRLSubmit = async () =>{
        try {
            formSRL.error = ""
            formSRL.loading = true
            const req = await axios.post('/api/lembur/srl', formSRL.answer)
            const res = await req.data
            formSRL.success = res.message
            formSRLBatal()
            tableSRL.invalidate()
        } catch (error: any) {
            formSRL.error = error.response.data.message
            formSRL.success = ""
        } finally {
            formSRL.loading = false
        }
    }

    const formSRLBatal = () =>{
        formSRL.answer = {...formSRLAnswer}
        formSRL.add = false
        formSRL.edit = false
    }
    
    const formSRLEdit = async (id:string) =>{
        try {
            formSRL.loading = true
            const req = await axios.get(`/api/lembur/srl/${id}`)
            const res = await req.data
            
            formSRL.answer = {...res,
                real_start: formatTanggal(res.real_start),
                real_end: formatTanggal(res.real_end),
            }

            formSRL.edit = true
            formSRL.add = false
            formSRL.loading = false
        } catch (error) {
            formSRL.loading = false
        }
    }

    const getSPL = async () =>{
        const req = await fetch(`/api/data?type=spl_by_status&val=${user.payroll}`)
        const res = await req.json()
        formSRLDetailAnswer = res.map((val: any) => ({est_start:val.est_start, est_end: val.est_end, spl_id: val.spl_id, description: val.description}))
        return res
    }
    
    const getUserByDept = $derived.by(() => {
        return async () =>{
            const req = await fetch(`/api/data?type=user_by_dept&val=${user.department}`)
            const res = await req.json()
            return res
        }
    })

    const getSPLAll = (id:string) =>{
        const {description, est_start, est_end} = formSRLDetailAnswer.find((v:any) => v.spl_id == id) as unknown as {description:string, est_start:string, est_end:string}
        setTimeout(()=>{
            formSRL.answer.real_start = formatTanggal(est_start)
            formSRL.answer.real_end = formatTanggal(est_end)
        }, 100)
        formSRL.answer.srl_detail = description.split(',').map(v => v.trim())
            .map(v => ({description: v.trim(), status:"Completed"}))
    }

    $effect(()=>{
        tableSPL.load(async (state:State) => {
            try {
                const req = await fetch('/api/data?type=setting')
                const res = await req.json()
                if(res){
                    const temp = set(new Date(), {year: 2025, month: 3})
                    const {start_periode, end_periode} = getPeriode({...res, date: temp})

                    const req = await fetch(`/api/lembur/spl?${getParams(state)}&start_periode=${start_periode}&end_periode=${end_periode}`)
                    const {items, totalItems} = await req.json()
                    state.setTotalRows(totalItems)
                    return items
                }else{
                    throw new Error("Periode perlu disetting")
                }
            } catch (err:any) {
                console.log(err.message)
            }
        })

        tableSRL.load(async (state:State) => {
            try {
                const req = await fetch(`/api/lembur/srl?${getParams(state)}`)
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
        tableSRL.invalidate()
    }, 1000)
</script>

<svelte:head>
    <title>Lembur</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="Dashboard">
            <div class="relative flex items-center justify-center min-h-[70vh] rounded-lg" style={`background-image: url(${bglembur}); background-size: cover; background-position:top`}>
                <span class='text-white bg-slate-600/[.7] p-3 rounded-lg'>Overtime Page</span>
            </div>
        </TabItem>
        <TabItem title="Surat Perintah Lembur">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                {#if formSPL.error || formSPL.success}
                    <Toast color="red">
                        <span class='flex gap-2'>
                            {#if formSPL.error}
                                <Ban size={16} color="#d41c08" />
                            {:else}
                                <Check size={16} color="#08d42a" />
                            {/if}
                            {formSPL.error || formSPL.success}
                        </span>
                    </Toast>
                {/if}

                <div class="flex gap-2">                        
                    {#if formSPL.add || formSPL.edit}
                        {#if pecahArray(userProfile?.access_spl, "C") || pecahArray(userProfile.access_spl, "U")}
                            <MyButton onclick={formSPLBatal}><Ban size={16} /></MyButton>
                            <MyButton disabled={formSPL.loading} onclick={formSPLSubmit}><Save size={16}/></MyButton>
                        {/if}
                    {:else}
                        {#if pecahArray(userProfile?.access_spl, "C")}
                            <MyButton onclick={()=> formSPL.add = true}><Plus size={16}/></MyButton>
                        {/if}
                    {/if}
                </div>

                {#if formSPL.loading}
                    <MyLoading message="Get SPL data"/>
                {/if}
                {#if formSPL.add || formSPL.edit}
                    <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                        <MyInput type='textarea' title={`Purpose`} name="purpose" bind:value={formSPL.answer.purpose}/>
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <input type='hidden' name="spl_id" disabled={formSPL.edit} bind:value={formSPL.answer.spl_id}/>
                            
                            <MyInput type='datetime' title='Waktu Mulai' name="est_start" bind:value={formSPL.answer.est_start}/>
                            <MyInput type='datetime' title='Waktu Selesai' name="est_end" bind:value={formSPL.answer.est_end}/>
                        </div>

                        <div class="flex flex-col gap-3 bg-bgdark2 p-4 rounded-lg border border-slate-300">
                            {#each formSPL.answer.spl_detail as list, i}
                                <div class="flex flex-col gap-2">
                                    <div class="flex gap-2 items-end">
                                        {#await getUserByDept() then val}
                                            <div class="flex flex-col gap-2 flex-1">
                                                <Label>{`Employee ${i+1}`}</Label>
                                                <Svelecte class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={list.payroll} 
                                                    options={val.map((v:any) => ({value: v.payroll, text:v.payroll +" | "+v.name}))}
                                                />
                                            </div>
                                        {/await}
                                        
                                        {#if i == formSPL.answer.spl_detail.length - 1}
                                            <MyButton onclick={()=>formSPL.answer.spl_detail.push({payroll:"", description:""})}><Plus size={14} color='green' /></MyButton>
                                        {/if}
                                        {#if formSPL.answer.spl_detail.length > 1}
                                            <MyButton onclick={()=> formSPL.answer.spl_detail.splice(i, 1)}><Minus size={14} color='red' /></MyButton>
                                        {/if}
                                    </div>
                                    <div class="flex flex-1 flex-col">
                                        <MyInput type='textarea' title={`Job List ${i+1}`} name="description" bind:value={list.description}/>
                                        <span class='text-[.8rem] italic'>For several jobs use comas as separator (,)</span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                        <span class='text-[.8rem]'>createdBy <Badge color='dark'>{user.name}</Badge> </span>
                    </form>
                {/if}
                
                <div class="flex gap-2">
                    <select bind:value={tableSPL.rowsPerPage} onchange={() => tableSPL.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <MyInput type='text' bind:value={tableSPLSearch.value}/>
                    <MyButton onclick={()=>tableSPLSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableSPL.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableSPL}>
                    <Table>
                        <TableHead class="bg-slate-500" >
                            <ThSort table={tableSPL} field="spl_id">SPL ID</ThSort>
                            <ThSort table={tableSPL} field="purpose">Purpose</ThSort>
                            <ThSort table={tableSPL} field="est_start">Datetime Start</ThSort>
                            <ThSort table={tableSPL} field="est_end">Datetime End</ThSort>
                            {#if pecahArray(userProfile.access_spl, "U") || pecahArray(userProfile.access_spl, "D")}
                                <ThSort table={tableSPL} field="">#</ThSort>
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
                                            <TableBodyCell>{row.spl_id}</TableBodyCell>
                                            <TableBodyCell>{row.purpose}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.est_start)}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.est_end)}</TableBodyCell>
                                            {#if pecahArray(userProfile.access_spl, "U") || pecahArray(userProfile.access_spl, "D")}
                                                <TableBodyCell>
                                                    {#if pecahArray(userProfile.access_spl, "U")}<MyButton onclick={()=> formSPLEdit(row.spl_id)}><Pencil size={12} /></MyButton>{/if}
                                                    {#if pecahArray(userProfile.access_spl, "D")}<MyButton onclick={()=> formSPLDelete(row.spl_id)}><Trash size={12} /></MyButton>{/if}
                                                </TableBodyCell>
                                            {/if}
                                        </TableBodyRow>
                                    {/each}
                                {:else}
                                    <TableBodyRow>
                                        <TableBodyCell>No data available</TableBodyCell>
                                    </TableBodyRow>
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
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                {#if formSRL.error || formSRL.success}
                    <Toast color="red">
                        <span class='flex gap-2'>
                            {#if formSRL.error}
                            <Ban size={16} color="#d41c08" />
                            {:else}
                            <Check size={16} color="#08d42a" />
                            {/if}
                            {formSRL.error || formSRL.success}
                        </span>
                    </Toast>
                {/if}

                <div class="flex gap-2">                        
                    {#if formSRL.add || formSRL.edit}
                        {#if pecahArray(userProfile?.access_srl, "C") || pecahArray(userProfile.access_srl, "U")}
                            <MyButton onclick={formSRLBatal}><Ban size={16} /></MyButton>
                            <MyButton disabled={formSRL.loading} onclick={formSRLSubmit}><Save size={16}/></MyButton>
                        {/if}
                    {:else}
                        {#if pecahArray(userProfile?.access_srl, "C")}
                            <MyButton onclick={()=> formSRL.add = true}><Plus size={16}/></MyButton>
                        {/if}
                    {/if}
                </div>

                {#if formSRL.loading}
                    <MyLoading message="Get SPL data"/>
                {/if}
                {#if formSRL.add || formSRL.edit}
                    <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                        {#await getSPL() then val}
                            <div class="flex flex-col gap-2 flex-1">
                                <Label>SPL ID</Label>
                                <Svelecte class='rounded-lg' disabled={formSRL.edit} clearable searchable selectOnTab multiple={false} bind:value={formSRL.answer.spl_id} 
                                    options={val.map((v:any) => ({value: v.spl_id, text:v.spl_id + " | " + v.purpose}))}
                                    onChange={(e:any) => getSPLAll(e.value)}
                                />
                            </div>
                        {/await}
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <input type='hidden' name="srl_id" disabled={formSRL.edit} bind:value={formSRL.answer.srl_id}/>
                            
                            {#if formSRL.answer.spl_id}                                
                                <MyInput type='text' title='Realisasi Mulai' name="real_start" bind:value={formSRL.answer.real_start}/>
                                <MyInput type='text' title='Realisasi Selesai' name="real_end" bind:value={formSRL.answer.real_end}/>
                            {/if}
                        </div>

                        {#if formSRL.answer.spl_id}
                        <div class="flex flex-col gap-3 bg-bgdark2 p-4 rounded-lg border border-slate-300">
                                {#each formSRL.answer.srl_detail as list, i}
                                    <div class="flex flex-col gap-2">
                                        <div class="flex gap-2 items-end">
                                            <div class="flex flex-1 flex-col gap-2">
                                                <Label>Status {i + 1}</Label>
                                                <select bind:value={list.status}>
                                                    {#each ["Hold", "On Progress", "Completed"] as option}
                                                        <option value={option}>{option}</option>
                                                    {/each}
                                                </select>
                                            </div>

                                            {#if i == formSRL.answer.srl_detail.length - 1}
                                                <MyButton onclick={()=>formSRL.answer.srl_detail.push({status:"", description:""})}><Plus size={14} color='green' /></MyButton>
                                            {/if}
                                            {#if formSRL.answer.srl_detail.length > 1}
                                                <MyButton onclick={()=> formSRL.answer.srl_detail.splice(i, 1)}><Minus size={14} color='red' /></MyButton>
                                            {/if}
                                        </div>
                                        <MyInput type='textarea' title={`Job List ${i+1}`} name="description" bind:value={list.description}/>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                        <span class='text-[.8rem]'>createdBy <Badge color='dark'>{user.name}</Badge> </span>
                    </form>
                {/if}
                
                <div class="flex gap-2">
                    <select bind:value={tableSRL.rowsPerPage} onchange={() => tableSRL.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <MyInput type='text' bind:value={tableSRLSearch.value}/>
                    <MyButton onclick={()=>tableSRLSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableSRL.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableSRL}>
                    <Table>
                        <TableHead class="bg-slate-500" >
                            <ThSort table={tableSRL} field="srl_id">SRL ID</ThSort>
                            <ThSort table={tableSRL} field="spl_id">SPL ID</ThSort>
                            <ThSort table={tableSRL} field="name">Name</ThSort>
                            <ThSort table={tableSRL} field="real_start">Real Start</ThSort>
                            <ThSort table={tableSRL} field="real_end">Real End</ThSort>
                            {#if pecahArray(userProfile.access_srl, "U") || pecahArray(userProfile.access_srl, "D")}
                                <ThSort table={tableSRL} field="">#</ThSort>
                            {/if}
                        </TableHead>

                        {#if tableSRL.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                            <TableBody tableBodyClass="divide-y">
                                {#if tableSRL.rows.length > 0}
                                    {#each tableSRL.rows as row}
                                        <TableBodyRow>
                                            <TableBodyCell>{row.srl_id}</TableBodyCell>
                                            <TableBodyCell>{row.spl_id}</TableBodyCell>
                                            <TableBodyCell>{row.name}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.real_start)}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.real_end)}</TableBodyCell>
                                            {#if pecahArray(userProfile.access_srl, "U") || pecahArray(userProfile.access_srl, "D")}
                                                <TableBodyCell>
                                                    {#if pecahArray(userProfile.access_srl, "U")}<MyButton onclick={()=> formSRLEdit(row.srl_id)}><Pencil size={12} /></MyButton>{/if}
                                                    <!-- {#if pecahArray(userProfile.access_srl, "D")}<MyButton onclick={()=> formSRLDelete(row.spl_id)}><Trash size={12} /></MyButton>{/if} -->
                                                </TableBodyCell>
                                            {/if}
                                        </TableBodyRow>
                                    {/each}
                                {:else}
                                    <TableBodyRow>
                                        <TableBodyCell>No data available</TableBodyCell>
                                    </TableBodyRow>
                                {/if}
                            </TableBody>
                        {/if}
                    </Table>
                    {#if tableSRL.rows.length > 0}
                        <div class="flex justify-between items-center gap-2 mt-3">
                            <p class='text-muted self-end text-[.9rem]'>
                                Showing {tableSRL.rowCount.start} to {tableSRL.rowCount.end} of {tableSRL.rowCount.total} rows
                                <Badge color="dark">Page {tableSRL.currentPage}</Badge>
                            </p>
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableSRL.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                <MyButton onclick={()=> tableSRL.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                {#each tableSRL.pages as page}
                                    <MyButton className={`text-muted text-[.9rem] px-3`} onclick={()=> tableSRL.setPage(page)} type="button">{page}</MyButton>
                                {/each}
                                <MyButton onclick={()=> tableSRL.setPage('next')}><ChevronRight size={16} /></MyButton>
                                <MyButton onclick={()=> tableSRL.setPage('last')}><ChevronLast size={16} /></MyButton>
                            </div>
                        </div>
                    {/if}
                </Datatable>
            </div>
        </TabItem>
    </Tabs>
</main>