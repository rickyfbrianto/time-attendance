<script lang="ts">
    import { fade, slide } from 'svelte/transition'
    import { Tabs, TabItem } from 'flowbite-svelte';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch, Button, Modal, Label, Input, ImagePlaceholder } from 'flowbite-svelte';
    import {dataSample} from '@lib/store/appstore'
	import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import { Badge, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, RefreshCw, Search } from '@lucide/svelte';
    import MyButton from '@lib/components/MyButton.svelte'
	import { getParams } from '@lib/data/api.js';
	import MyLoading from '@/MyLoading.svelte';
    let {data} = $props()
    
    let openRow: number[] = $state([]) 
    const toggleRow = (i: number) => {
        if(openRow.includes(i)){
            openRow = openRow.filter((item) => item !== i)
        } else {
            openRow.push(i)
        }
    }

    let tableAbsen = new TableHandler([], {rowsPerPage: 10})
    let tableAbsenSearch = tableAbsen.createSearch()

    let tableAbsenDept = new TableHandler([], {rowsPerPage: 10})
    let tableAbsenDeptSearch = tableAbsenDept.createSearch()

    $effect(()=>{
        tableAbsen.load(async (state: State) => {
            try {
                const req = await fetch(`/api/absen?${getParams(state)}&payroll=${data.user?.payroll}`)
                if (!req.ok) throw new Error('Gagal mengambil data');
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (error) {
                
            }
        })

        tableAbsenDept.load(async (state: State) => {
            try {
                const req = await fetch(`/api/absen?${getParams(state)}&dept=${data.user?.department}`)
                if (!req.ok) throw new Error('Gagal mengambil data');
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (error) {
                
            }
        })
    })

    setTimeout(()=>{
        tableAbsen.invalidate()
        tableAbsenDept.invalidate()
    }, 1000)
</script>

<svelte:head>
    <title>Check In & Out</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-4">    
    <Tabs>
        <TabItem open title="My Absent">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 bg-white rounded-lg ">                
                <div class="flex flex-col gap-2">
                    <div class="flex justify-between gap-2">
                        <select class='self-end border-slate-300 rounded-lg ring-0' bind:value={tableAbsen.rowsPerPage} onchange={() => tableAbsen.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <input class='flex-1 rounded-lg border border-slate-300 ring-0' bind:value={tableAbsenSearch.value}/>
                        <MyButton onclick={()=>tableAbsenSearch.set()} className='bg-white'><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableAbsen.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                </div>
                
                <Datatable table={tableAbsen}>
                    <Table>
                        <TableHead class="bg-slate-500" >
                            <ThSort table={tableAbsen} field="name"><TableHeadCell>Payroll</TableHeadCell></ThSort>
                            <ThSort table={tableAbsen} field="name"><TableHeadCell>Name</TableHeadCell></ThSort>
                            <ThSort table={tableAbsen} field="tanggal"><TableHeadCell>Tanggal</TableHeadCell></ThSort>
                            <ThSort table={tableAbsen} field="check_in"><TableHeadCell>Check In</TableHeadCell></ThSort>
                            <ThSort table={tableAbsen} field="check_out"><TableHeadCell>Check Out</TableHeadCell></ThSort>
                        </TableHead>

                        {#if tableAbsen.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                            <TableBody tableBodyClass="divide-y">
                                {#if tableAbsen.rows.length > 0}
                                    {#each tableAbsen.rows as row}
                                        <TableBodyRow>
                                            <TableBodyCell>{row.payroll}</TableBodyCell>
                                            <TableBodyCell>{row.name}</TableBodyCell>
                                            <TableBodyCell>{row.tanggal}</TableBodyCell>
                                            <TableBodyCell>{row.check_in || "-"}</TableBodyCell>
                                            <TableBodyCell>{row.check_out || "-"}</TableBodyCell>
                                        </TableBodyRow>
                                    {/each}
                                {:else}
                                    <span>No data available</span>
                                {/if}
                            </TableBody>
                        {/if}
                    </Table>
                    {#if tableAbsen.rows.length > 0}
                        <div class="flex justify-between items-center gap-2 mt-3">
                            <p class='text-muted self-end text-[.9rem]'>
                                Showing {tableAbsen.rowCount.start} to {tableAbsen.rowCount.end} of {tableAbsen.rowCount.total} rows
                                <Badge color="dark">Page {tableAbsen.currentPage}</Badge>
                            </p>
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableAbsen.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                <MyButton onclick={()=> tableAbsen.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                {#each tableAbsen.pages as page}
                                    <MyButton className={`text-muted text-[.9rem] px-3`} onclick={()=> tableAbsen.setPage(page)} type="button">{page}</MyButton>
                                {/each}
                                <MyButton onclick={()=> tableAbsen.setPage('next')}><ChevronRight size={16} /></MyButton>
                                <MyButton onclick={()=> tableAbsen.setPage('last')}><ChevronLast size={16} /></MyButton>
                            </div>
                        </div>
                    {/if}
                </Datatable>
            </div>
        </TabItem>
        <TabItem title="Departement">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 bg-white rounded-lg ">
                <div class="flex flex-col gap-2">
                    <div class="flex justify-between gap-2">
                        <select class='self-end border-slate-300 rounded-lg ring-0' bind:value={tableAbsenDept.rowsPerPage} onchange={() => tableAbsenDept.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <input class='flex-1 rounded-lg border border-slate-300 ring-0' bind:value={tableAbsenDeptSearch.value}/>
                        <MyButton onclick={()=>tableAbsenDeptSearch.set()} className='bg-white'><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableAbsenDept.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                </div>
                
                <Datatable table={tableAbsenDept}>
                    <Table>
                        <TableHead class="bg-slate-500" >
                            <ThSort table={tableAbsenDept} field="payroll"><TableHeadCell>Payroll</TableHeadCell></ThSort>
                            <ThSort table={tableAbsenDept} field="name"><TableHeadCell>Name</TableHeadCell></ThSort>
                            <ThSort table={tableAbsenDept} field="tanggal"><TableHeadCell>Tanggal</TableHeadCell></ThSort>
                            <ThSort table={tableAbsenDept} field="check_in"><TableHeadCell>Check In</TableHeadCell></ThSort>
                            <ThSort table={tableAbsenDept} field="check_out"><TableHeadCell>Check Out</TableHeadCell></ThSort>
                        </TableHead>

                        {#if tableAbsenDept.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                        <TableBody tableBodyClass="divide-y">
                            {#if tableAbsenDept.rows.length > 0}
                                {#each tableAbsenDept.rows as row}
                                    <TableBodyRow>
                                        <TableBodyCell>{row.payroll}</TableBodyCell>
                                        <TableBodyCell>{row.name}</TableBodyCell>
                                        <TableBodyCell>{row.tanggal}</TableBodyCell>
                                        <TableBodyCell>{row.check_in || "-"}</TableBodyCell>
                                        <TableBodyCell>{row.check_out || "-"}</TableBodyCell>
                                    </TableBodyRow>
                                {/each}
                            {:else}
                                <span>No data available</span>
                            {/if}
                        </TableBody>                            
                        {/if}
                    </Table>
                    {#if tableAbsenDept.rows.length > 0}
                        <div class="flex justify-between items-center gap-2 mt-3">
                            <p class='text-muted self-end text-[.9rem]'>
                                Showing {tableAbsenDept.rowCount.start} to {tableAbsenDept.rowCount.end} of {tableAbsenDept.rowCount.total} rows
                                <Badge color="dark">Page {tableAbsenDept.currentPage}</Badge>
                            </p>
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableAbsenDept.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                <MyButton onclick={()=> tableAbsenDept.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                {#each tableAbsenDept.pages as page}
                                    <MyButton className={`text-muted text-[.9rem] px-3`} onclick={()=> tableAbsenDept.setPage(page)} type="button">{page}</MyButton>
                                {/each}
                                <MyButton onclick={()=> tableAbsenDept.setPage('next')}><ChevronRight size={16} /></MyButton>
                                <MyButton onclick={()=> tableAbsenDept.setPage('last')}><ChevronLast size={16} /></MyButton>
                            </div>
                        </div>
                    {/if}
                </Datatable>
            </div>
        </TabItem>
    </Tabs>
</main>