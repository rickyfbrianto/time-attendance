<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Tabs, TabItem, Toast, Table, Badge, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, TableSearch, Label, ImagePlaceholder, Dropdown, DropdownItem, MultiSelect, Select, Checkbox } from 'flowbite-svelte';
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
    import {Calendar, SquareArrowUpRight, SquareArrowDownRight, TicketsPlane, Ban, Check, Search, RefreshCw, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Pencil, Trash, Plus, Save, Minus} from '@lucide/svelte'
    import MyButton from '@lib/components/MyButton.svelte';
	import MyLoading from '@lib/components/MyLoading.svelte';
	import MyInput from '@lib/components/MyInput.svelte';
	import { formatTanggal, pecahArray } from '@lib/utils';
    import { differenceInDays, format } from "date-fns";
	import axios from 'axios';
	import Svelecte from 'svelecte';
    import SveltyPicker from 'svelty-picker'
	import { getParams } from '@lib/data/api.js';

    let {data} = $props()
    
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)
    
    const rowsPerPage = 10
    
    let tableSPPD = $state(new TableHandler([], {rowsPerPage}))
    let tableSPPDSearch = tableSPPD.createSearch()
    
    const formSPPDAnswer = {
        sppd_id: "id",
        dept:"",
        date:"",
        start_date:"",
        end_date:"",
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
            // const formData = new FormData()
            // Object.entries(formSPPD.answer).forEach(val=>{
            //     formData.append(val[0], val[1])
            // })
            // formData.set('start_date', formSPPD.answer.start_date[0])
            // formData.set('end_date', formSPPD.answer.start_date[1])

            const req = await axios.post('/api/sppd', formSPPD.answer)
            const res = await req.data()
            formSPPD.success = res.message
            formSPPDBatal()
        } catch (error: any) {
            formSPPD.error = error.message
            formSPPD.success = ""
        } finally {
            formSPPD.loading = false
            tableSPPD.invalidate()
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
            
            formSPPD.answer = {...res}
            formSPPD.answer.attachment = []
            
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

        // tableSRL.load(async (state:State) => {
        //     try {
        //         const req = await fetch(`/api/lembur/srl?${getParams(state)}`)
        //         if(!req.ok) throw new Error('Gagal mengambil data')
        //         const {items, totalItems} = await req.json()
        //         state.setTotalRows(totalItems)
        //         return items
        //     } catch (err:any) {
        //         console.log(err.message)
        //     }
        // })
    })

    $effect(()=>{
        const diff = differenceInDays(formSPPD.answer.start_date[1], formSPPD.answer.start_date[0])
        formSPPD.answer.duration = isNaN(diff) ? 0 : diff
    })
    
    setTimeout(()=>{
        tableSPPD.invalidate()
        // tableSRL.invalidate()
    }, 1000)
</script>

<svelte:head>
    <title>Dinas</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="Dashboard">
            <div class="flex justify-center items-center gap-4 min-h-[50vh]">
                <span>Dashboard Page</span>
            </div>
        </TabItem>
        <TabItem open title="SPPD">
            {JSON.stringify(formSPPD.answer)}
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                {#if formSPPD.error || formSPPD.success}
                    <Toast color="red">
                        {#if formSPPD.error}
                            <Ban size={16} color="#d41c08" />
                        {:else}
                            <Check size={16} color="#08d42a" />
                        {/if}
                        {formSPPD.error || formSPPD.success}
                    </Toast>
                {/if}

                <div class="flex flex-col gap-2">
                    <div class="flex justify-between gap-2">
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
                        <select class='self-end border-slate-300 bg-bgdark rounded-lg ring-0' bind:value={tableSPPD.rowsPerPage} onchange={() => tableSPPD.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <MyInput type='text' bind:value={tableSPPDSearch.value}/>
                        <MyButton onclick={()=>tableSPPDSearch.set()}><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableSPPD.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                </div>

                {#if formSPPD.loading}
                    <MyLoading message="Get attendance data"/>
                {/if}
                {#if formSPPD.add || formSPPD.edit}
                    <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg' enctype="multipart/form-data">
                        {#await getDept() then val}
                            <div class="flex flex-col gap-2 flex-1">
                                <Label>Department</Label>
                                <Svelecte disabled={formSPPD.edit} class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={formSPPD.answer.dept} 
                                    options={val.map((v:any) => ({value: v.dept_code, text:v.dept_code + " | " + v.name}))}/>
                            </div>
                        {/await}
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <input type='hidden' name="sppd_id" disabled={formSPPD.edit} bind:value={formSPPD.answer.sppd_id}/>                            
                            <MyInput type='daterange' title='Start Date' name="start_date" formatDate="yyyy-mm-dd" bind:value={formSPPD.answer.start_date}/>
                            <MyInput type='text' title='Duration' bind:value={formSPPD.answer.duration} />
                        </div>
                        
                        {#if formSPPD.answer.dept}
                            <div class="flex flex-col gap-3">
                                {#each formSPPD.answer.sppd_detail as list, i}
                                    <div class="flex flex-col gap-2 border-t-[2px] border-slate-300 pt-2">
                                        <div class="flex gap-2 items-end">
                                            {#await getUserByDept(formSPPD.answer.dept) then val}
                                                <div class="flex flex-col gap-2 flex-1">
                                                    <Label>{`Employee ${i+1}`}</Label>
                                                    <Svelecte class='rounded-lg' clearable searchable selectOnTab multiple={false} bind:value={formSPPD.answer.sppd_detail[i].payroll} 
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
                                        <div class="flex flex-1 flex-col">
                                            <MyInput type='textarea' title={`Job List ${i+1}`} name="description" bind:value={formSPPD.answer.sppd_detail[i].description}/>
                                            <span class='text-[.8rem] italic'>For several jobs use comas as separator (,)</span>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                        
                        <span class='text-[.8rem]'>createdBy <Badge color='dark'>{data.user.name}</Badge> </span>
                    </form>
                {/if}
                
                <Datatable table={tableSPPD}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableSPPD} field="sppd_id"><TableHeadCell>SPPD ID</TableHeadCell></ThSort>
                            <ThSort table={tableSPPD} field="start_date"><TableHeadCell>Start Date</TableHeadCell></ThSort>
                            <ThSort table={tableSPPD} field="end_date"><TableHeadCell>End Date</TableHeadCell></ThSort>
                            <ThSort table={tableSPPD} field="duration"><TableHeadCell>Duration</TableHeadCell></ThSort>
                            <ThSort table={tableSPPD} field="name"><TableHeadCell>Created By</TableHeadCell></ThSort>
                            <ThSort table={tableSPPD} field=""><TableHeadCell>#</TableHeadCell></ThSort>
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
                                            <TableBodyCell>{formatTanggal(row.start_date) || ""}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.end_date) || ""}</TableBodyCell>
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
                                    <span>No data available</span>
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
            <div class="flex flex-col gap-4">

            </div>
        </TabItem>
    </Tabs>
</main>

