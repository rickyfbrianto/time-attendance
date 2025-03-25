<script lang="ts">    
    import {fade} from 'svelte/transition'
    import { Tabs, TabItem, Toast, Table, Badge, TableBody, TableBodyCell, TableBodyRow, TableHead, TableSearch, Label, ImagePlaceholder, Dropdown, DropdownItem, MultiSelect, Select, Checkbox, Datepicker } from 'flowbite-svelte';
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
    import {Calendar, SquareArrowUpRight, SquareArrowDownRight, TicketsPlane, Ban, Check, Search, RefreshCw, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Pencil, Trash, Plus, Save, Minus, Printer} from '@lucide/svelte'
    import MyButton from '@lib/components/MyButton.svelte';
	import MyLoading from '@lib/components/MyLoading.svelte';
	import MyInput from '@lib/components/MyInput.svelte';
	import { formatTanggal, pecahArray } from '@lib/utils';
    import { differenceInDays, format } from "date-fns";
	import axios from 'axios';
	import Svelecte from 'svelecte';
	import { getParams } from '@lib/data/api.js';
    import bgtravel from '@lib/assets/bg-travel.jpg'

    let {data} = $props()
    
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)
    
    const rowsPerPage = 10
    
    let tableSPPD = $state(new TableHandler([], {rowsPerPage}))
    let tableSPPDSearch = tableSPPD.createSearch()
    
    const formSPPDAnswer = {
        sppd_id: "id",
        purpose:"",
        dept:"",
        date: [],
        duration: 0,
        createdBy: data.user?.payroll || "",
        sppd_detail:[{payroll:"", description:"", location:""}]
    }
    
    let formSPPD = $state({
        answer: {...formSPPDAnswer},
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    })
    
    const formSPPDSubmit = async () =>{
        try {
            formSPPD.error = ""
            formSPPD.loading = true
            const req = await axios.post('/api/sppd', formSPPD.answer)
            const res = await req.data
            formSPPD.success = res.message
            formSPPDBatal()
            tableSPPD.invalidate()
        } catch (error: any) {
            formSPPD.error = error.response.data.message
            formSPPD.success = ""
        } finally {
            formSPPD.loading = false
        }
    }

    const formSPPDBatal = () =>{
        formSPPD.answer = {...formSPPDAnswer}
        formSPPD.add = false
        formSPPD.edit = false
    }
    
    const formSPPDEdit = async (id:string) =>{
        try {
            formSPPD.loading = true
            const req = await axios.get(`/api/sppd/${id}`)
            const res = await req.data
            if(res){
                formSPPD.answer = {...res}
                formSPPD.answer.date = [res.start_date, res.end_date]
            }
            
            formSPPD.edit = true
            formSPPD.add = false
            formSPPD.loading = false
        } catch (error) {
            formSPPD.loading = false
        }
    }

    const formSPPDDelete = async (id:string) =>{
        try {
            formSPPD.loading = true
            const req = await axios.delete(`/api/sppd/${id}`)
            const res = await req.data
            tableSPPD.invalidate()
        } catch (error) {
        } finally {
            formSPPD.loading = false
        }
    }
    
    // SKPD
    let tableSKPD = $state(new TableHandler([], {rowsPerPage}))
    let tableSKPDSearch = tableSKPD.createSearch()
    
    const formSKPDAnswer = {
        skpd_id: "id",
        sppd_id:"",
        payroll:"",
        date: ["", ""],
        status: "",
        createdBy: data.user?.payroll || "",
    }
    
    let formSKPD = $state({
        answer: {...formSKPDAnswer},
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    })

    let formSKPDTemp:any[] = $state([])
    
    const formSKPDSubmit = async () =>{
        try {
            formSKPD.error = ""
            formSKPD.loading = true
            const req = await axios.post('/api/skpd', formSKPD.answer)
            const res = await req.data
            formSKPD.success = res.message
            formSKPDBatal()
            tableSKPD.invalidate()
        } catch (error: any) {
            formSKPD.error = error.response.data.message
            formSKPD.success = ""
        } finally {
            formSKPD.loading = false
        }
    }

    const formSKPDBatal = () =>{
        formSKPD.answer = {...formSKPDAnswer}
        formSKPD.add = false
        formSKPD.edit = false
    }
    
    const formSKPDEdit = async (id:string) =>{
        try {
            formSKPD.loading = true
            const req = await axios.get(`/api/skpd/${id}`)
            const res = await req.data
            if(res){
                formSKPD.answer = {...res}
                setTimeout(()=>{
                    formSKPD.answer.date = [formatTanggal(res.real_start), formatTanggal(res.real_end)]
                }, 100)
            }
            
            formSKPD.edit = true
            formSKPD.add = false
            formSKPD.loading = false
        } catch (error) {
            formSKPD.loading = false
        }
    }

    const formSKPDDelete = async (id:string) =>{
        try {
            formSKPD.loading = true
            const req = await axios.delete(`/api/skpd/${id}`)
            const res = await req.data
            tableSKPD.invalidate()
        } catch (error) {
        } finally {
            formSKPD.loading = false
        }
    }
    
    const getDept = async () =>{
        const req = await fetch('/api/data?type=dept')
        return await req.json()
    }
    
    const getUserByDept = $derived.by(() => {
        return async (v:string) =>{
            const req = await fetch(`/api/data?type=user_by_dept&val=${v}`)
            const res = await req.json()
            return res
        }
    })
    
    const getSPPD = async () =>{
        const req = await fetch(`/api/data?type=sppd_by_payroll&val=${user.payroll}`)
        const res = await req.json()
        formSKPDTemp = [...res]
        return res
    }

    const fillSKPD = (id:string) =>{
        const temp = formSKPDTemp.find(val => val.sppd_id == id)

        setTimeout(()=>{
            formSKPD.answer.date = [formatTanggal(temp.start_date), formatTanggal(temp.end_date)]
        }, 100)
        formSKPD.answer.payroll = temp.payroll
    }
    
    $effect(()=>{
        tableSPPD.load(async (state:State) => {
            try {
                const req = await fetch(`/api/sppd?${getParams(state)}`)
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        tableSKPD.load(async (state:State) => {
            try {
                const req = await fetch(`/api/skpd?${getParams(state)}`)
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })
    })

    $effect(()=>{
        const diff = differenceInDays(formSPPD.answer.date[1], formSPPD.answer.date[0])
        formSPPD.answer.duration = isNaN(diff) ? 0 : diff
    })
    
    setTimeout(()=>{
        tableSPPD.invalidate()
        tableSKPD.invalidate()
    }, 1000)
</script>

<svelte:head>
    <title>Dinas</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="Dashboard">
            <div class="relative flex items-center justify-center min-h-[70vh] rounded-lg" style={`background-image: url(${bgtravel}); background-size: cover; background-position:bottom`}>
                <span class='text-white bg-slate-600/[.7] p-3 rounded-lg'>Travel Page</span>
            </div>
        </TabItem>
        <TabItem title="SPPD">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                {#if formSPPD.error || formSPPD.success}
                    <Toast color="red">
                        <span class='flex gap-2'>
                            {#if formSPPD.error}
                            <Ban size={16} color="#d41c08" />
                            {:else}
                            <Check size={16} color="#08d42a" />
                            {/if}
                            {formSPPD.error || formSPPD.success}
                        </span>
                    </Toast>
                {/if}

                <div class="flex gap-2">
                    {#if formSPPD.add || formSPPD.edit}
                        {#if pecahArray(userProfile?.access_sppd, "C") || pecahArray(userProfile.access_sppd, "U")}
                            <MyButton onclick={formSPPDBatal}><Ban size={16} /></MyButton>
                            <MyButton disabled={formSPPD.loading} onclick={formSPPDSubmit}><Save size={16}/></MyButton>
                        {/if}
                    {:else}
                        {#if pecahArray(userProfile?.access_sppd, "C")}
                            <MyButton onclick={()=> formSPPD.add = true}><Plus size={16}/></MyButton>
                        {/if}
                    {/if}
                </div>

                {#if formSPPD.loading}
                    <MyLoading message="Get SPPD data"/>
                {/if}
                {#if formSPPD.add || formSPPD.edit}
                    <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                        {#await getDept() then val}
                            <div class="flex flex-col gap-2 flex-1">
                                <Label>Department</Label>
                                <Svelecte disabled={formSPPD.edit} class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={formSPPD.answer.dept} 
                                    options={val.map((v:any) => ({value: v.dept_code, text:v.dept_code + " | " + v.name}))}/>
                            </div>
                        {/await}

                        <MyInput type='textarea' title={`Purpose`} name="purpose" bind:value={formSPPD.answer.purpose}/>

                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <input type='hidden' name="sppd_id" disabled={formSPPD.edit} bind:value={formSPPD.answer.sppd_id}/>                            
                            <MyInput type='daterange' title='Date' name="date" bind:value={formSPPD.answer.date}/>
                            <MyInput type='text' title='Duration' bind:value={formSPPD.answer.duration} />
                        </div>
                        
                        {#if formSPPD.answer.dept}
                            <div class="flex flex-col gap-3 bg-bgdark2 p-4 rounded-lg">
                                {#each formSPPD.answer.sppd_detail as list, i}
                                    <div class="flex flex-col gap-2">
                                        <div class="flex gap-2 items-end">
                                            {#await getUserByDept(formSPPD.answer.dept) then val}
                                                <div class="flex flex-col gap-2 flex-1">
                                                    <Label>{`Employee ${i+1}`}</Label>
                                                    <Svelecte class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={list.payroll} 
                                                        options={val.map((v:any) => ({value: v.payroll, text:v.payroll +" | "+v.name}))}/>
                                                </div>
                                            {/await}

                                            {#if i == formSPPD.answer.sppd_detail.length - 1}
                                                <MyButton onclick={()=>formSPPD.answer.sppd_detail.push({payroll:"", location:"", description:""})}><Plus size={14} color='green' /></MyButton>
                                            {/if}
                                            {#if formSPPD.answer.sppd_detail.length > 1}
                                                <MyButton onclick={()=> formSPPD.answer.sppd_detail.splice(i, 1)}><Minus size={14} color='red' /></MyButton>
                                            {/if}
                                        </div>
                                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <MyInput type='text' title={`Location ${i+1}`} bind:value={list.location} />
                                            <MyInput type='textarea' title={`Description ${i+1}`} name="description" bind:value={list.description}/>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                        
                        <span class='text-[.8rem]'>createdBy <Badge color='dark'>{data.user.name}</Badge> </span>
                    </form>
                {/if}
                
                <div class="flex gap-2">
                    <select class='self-end border-slate-300 bg-bgdark rounded-lg ring-0' bind:value={tableSPPD.rowsPerPage} onchange={() => tableSPPD.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <MyInput type='text' bind:value={tableSPPDSearch.value}/>
                    <MyButton onclick={()=>tableSPPDSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableSPPD.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>

                <Datatable table={tableSPPD}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableSPPD} field="sppd_id">SPPD ID</ThSort>
                            <ThSort table={tableSPPD} field="purpose">Purpose</ThSort>
                            <ThSort table={tableSPPD} field="start_date">Start Date</ThSort>
                            <ThSort table={tableSPPD} field="end_date">End Date</ThSort>
                            <ThSort table={tableSPPD} field="duration">Duration</ThSort>
                            <ThSort table={tableSPPD} field="name">Created By</ThSort>
                            <ThSort table={tableSPPD} field="">#</ThSort>
                        </TableHead>

                        {#if tableSPPD.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                            <TableBody tableBodyClass="divide-y">
                                {#if tableSPPD.rows.length > 0}
                                    {#each tableSPPD.rows as row}
                                        <TableBodyRow>
                                            <TableBodyCell>{row.sppd_id}</TableBodyCell>
                                            <TableBodyCell>{row.purpose}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.start_date,false)}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.end_date, false)}</TableBodyCell>
                                            <TableBodyCell>{row.duration + " Days"}</TableBodyCell>
                                            <TableBodyCell>{row.name}</TableBodyCell>
                                            <TableBodyCell>
                                                {#if pecahArray(userProfile.access_sppd, "U")}
                                                    <MyButton onclick={()=> formSPPDEdit(row.sppd_id)}><Pencil size={12} /></MyButton>
                                                {/if}
                                                <MyButton onclick={()=> formSPPDDelete(row.sppd_id)}><Trash size={12} /></MyButton>
                                            </TableBodyCell>
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
                    {#if tableSPPD.rows.length > 0}
                        <div class="flex justify-between items-center gap-2 mt-3">
                            <p class='text-textdark self-end text-[.9rem]'>
                                Showing {tableSPPD.rowCount.start} to {tableSPPD.rowCount.end} of {tableSPPD.rowCount.total} rows
                                <Badge color="dark">Page {tableSPPD.currentPage}</Badge>
                            </p>
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableSPPD.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                <MyButton onclick={()=> tableSPPD.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                {#each tableSPPD.pages as page}
                                    <MyButton className={`text-textdark text-[.9rem] px-3`} onclick={()=> tableSPPD.setPage(page)} type="button">{page}</MyButton>
                                {/each}
                                <MyButton onclick={()=> tableSPPD.setPage('next')}><ChevronRight size={16} /></MyButton>
                                <MyButton onclick={()=> tableSPPD.setPage('last')}><ChevronLast size={16} /></MyButton>
                            </div>
                        </div>
                    {/if}
                </Datatable>
            </div>
        </TabItem>
        <TabItem title="SKPD">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                {#if formSKPD.error || formSKPD.success}
                    <Toast color="red">
                        <span class='flex gap-2'>
                            {#if formSKPD.error}
                            <Ban size={16} color="#d41c08" />
                            {:else}
                            <Check size={16} color="#08d42a" />
                            {/if}
                            {formSKPD.error || formSKPD.success}
                        </span>
                    </Toast>
                {/if}
        
                <div class="flex gap-2">
                    {#if formSKPD.add || formSKPD.edit}
                        {#if pecahArray(userProfile?.access_skpd, "C") || pecahArray(userProfile.access_skpd, "U")}
                            <MyButton onclick={formSKPDBatal}><Ban size={16} /></MyButton>
                            <MyButton disabled={formSKPD.loading} onclick={formSKPDSubmit}><Save size={16}/></MyButton>
                        {/if}
                    {:else}
                        {#if pecahArray(userProfile?.access_skpd, "C")}
                            <MyButton onclick={()=> formSKPD.add = true}><Plus size={16}/></MyButton>
                        {/if}
                    {/if}
                </div>
        
                {#if formSKPD.loading}
                    <MyLoading message="Get SKPD data"/>
                {/if}
                {#if formSKPD.add || formSKPD.edit}
                    <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                        {#await getSPPD() then val}
                            <div class="flex flex-col gap-2 flex-1">
                                <Label>SPL ID</Label>
                                <Svelecte class='rounded-lg bg-bgdark' disabled={formSKPD.edit} clearable searchable selectOnTab multiple={false} bind:value={formSKPD.answer.sppd_id} 
                                options={val.map((v:any) => ({value: v.sppd_id, text:v.sppd_id + " | " + v.purpose, sppd_id: v.sppd_id}))}
                                onChange={(e:any) => {
                                    fillSKPD(e.sppd_id)
                                    formSKPD.answer.date = ['2025-01-01', '2025-01-11']
                                }}/>
                            </div>
                        {/await}
                
                        {#if formSKPD.answer.sppd_id}
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <input type='hidden' name="skpd_id" disabled={formSKPD.edit} bind:value={formSKPD.answer.skpd_id}/>

                                <MyInput type='daterange' title='Date' name="date" bind:value={formSKPD.answer.date}/>
                                <MyInput type='text' title='Payroll' bind:value={formSKPD.answer.payroll} />
                                <div class="flex flex-col gap-2">
                                    <Label>Status</Label>
                                    <select class='border-slate-300 bg-bgdark rounded-lg ring-0' bind:value={formSKPD.answer.status}>
                                        {#each ["OPEN","CLOSE"] as option}
                                            <option value={option}>{option}</option>
                                        {/each}
                                    </select>
                                </div>
                            </div>
                        {/if}
                        
                        <span class='text-[.8rem]'>createdBy <Badge color='dark'>{data.user.name}</Badge> </span>
                    </form>
                {/if}
                
                <div class="flex gap-2">
                    <select class='self-end border-slate-300 bg-bgdark rounded-lg ring-0' bind:value={tableSKPD.rowsPerPage} onchange={() => tableSKPD.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <MyInput type='text' bind:value={tableSKPDSearch.value}/>
                    <MyButton onclick={()=>tableSKPDSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableSKPD.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableSKPD}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableSKPD} field="skpd_id">SKPD ID</ThSort>
                            <ThSort table={tableSKPD} field="sppd_id">SPPD ID</ThSort>
                            <ThSort table={tableSKPD} field="location">Location</ThSort>
                            <ThSort table={tableSKPD} field="description">Description</ThSort>
                            <ThSort table={tableSKPD} field="real_start">Start Date</ThSort>
                            <ThSort table={tableSKPD} field="real_end">End Date</ThSort>
                            <ThSort table={tableSKPD} field="">#</ThSort>
                        </TableHead>
        
                        {#if tableSKPD.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                            <TableBody tableBodyClass="divide-y">
                                {#if tableSKPD.rows.length > 0}
                                    {#each tableSKPD.rows as row}
                                        <TableBodyRow>
                                            <TableBodyCell>{row.skpd_id}</TableBodyCell>
                                            <TableBodyCell>{row.sppd_id}</TableBodyCell>
                                            <TableBodyCell>{row.location}</TableBodyCell>
                                            <TableBodyCell>{row.description}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.real_start,false)}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.real_end, false)}</TableBodyCell>
                                            <TableBodyCell>
                                                {#if pecahArray(userProfile.access_skpd, "U")}
                                                <MyButton onclick={()=> formSKPDEdit(row.skpd_id)}><Pencil size={12} /></MyButton>
                                                {/if}
                                                {#if pecahArray(userProfile.access_skpd, "D")}
                                                    <MyButton onclick={()=> formSKPDDelete(row.skpd_id)}><Trash size={12} /></MyButton>
                                                    {/if}
                                                <MyButton onclick={()=> formSKPDDelete(row.skpd_id)}><Printer size={12} /></MyButton>
                                            </TableBodyCell>
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
                    {#if tableSKPD.rows.length > 0}
                        <div class="flex justify-between items-center gap-2 mt-3">
                            <p class='text-textdark self-end text-[.9rem]'>
                                Showing {tableSKPD.rowCount.start} to {tableSKPD.rowCount.end} of {tableSKPD.rowCount.total} rows
                                <Badge color="dark">Page {tableSKPD.currentPage}</Badge>
                            </p>
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableSKPD.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                <MyButton onclick={()=> tableSKPD.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                {#each tableSKPD.pages as page}
                                    <MyButton className={`text-textdark text-[.9rem] px-3`} onclick={()=> tableSKPD.setPage(page)} type="button">{page}</MyButton>
                                {/each}
                                <MyButton onclick={()=> tableSKPD.setPage('next')}><ChevronRight size={16} /></MyButton>
                                <MyButton onclick={()=> tableSKPD.setPage('last')}><ChevronLast size={16} /></MyButton>
                            </div>
                        </div>
                    {/if}
                </Datatable>
            </div>
        </TabItem>
    </Tabs>
</main>

