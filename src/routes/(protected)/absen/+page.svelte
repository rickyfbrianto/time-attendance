<script lang="ts">
    import { fade, slide } from 'svelte/transition'
    import { Tabs, TabItem } from 'flowbite-svelte';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Checkbox, Button, Modal, Label, Input, ImagePlaceholder } from 'flowbite-svelte';
	import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import { Badge, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, ClockArrowDown, ClockArrowUp, RefreshCw, Search } from '@lucide/svelte';
    import MyButton from '@lib/components/MyButton.svelte'
	import { getParams } from '@lib/data/api.js';
	import MyLoading from '@/MyLoading.svelte';
	import MyInput from '@/MyInput.svelte';
	import { formatTanggal, getPeriode } from '@lib/utils.js';
    import gsap from 'gsap'
	import { mount, unmount } from 'svelte';
    
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

    const getSetting = async () =>{
        const req = await fetch('/api/admin/setting')
        const {start_periode, end_periode} = await req.json()
        const temp = getPeriode({start_periode, end_periode, date: new Date()})
        return temp
    }

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

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    <div class="flex items-center gap-2">
        {#await getSetting() then {start_periode, end_periode}}
            <div class="flex gap-2 p-3 bg-bgdark2 text-textdark rounded-lg">
                <ClockArrowDown size={16}/>
                <span class="text-[.9rem]">Start Periode {start_periode}</span>
            </div>
            <div class="flex gap-2 p-3 bg-bgdark2 text-textdark rounded-lg">
                <ClockArrowUp size={16}/>
                <span class="text-[.9rem]">End Periode {end_periode}</span>
            </div>
        {/await}
    </div>
    
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="My Absent">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">                
                <div class="flex gap-2">
                    <select bind:value={tableAbsen.rowsPerPage} onchange={() => tableAbsen.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <MyInput type='text' bind:value={tableAbsenSearch.value}/>
                    <MyButton onclick={()=>tableAbsenSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableAbsen.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableAbsen}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableAbsen} field="payroll">Payroll</ThSort>
                            <ThSort table={tableAbsen} field="name">Name</ThSort>
                            <ThSort table={tableAbsen} field="check_in">Check In</ThSort>
                            <ThSort table={tableAbsen} field="check_out">Check Out</ThSort>
                            <ThSort table={tableAbsen} field="tanggal">Type</ThSort>
                            <ThSort table={tableAbsen} field="description">Description</ThSort>
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
                                            <TableBodyCell>{formatTanggal(row.check_in)}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.check_out)}</TableBodyCell>
                                            <TableBodyCell>
                                                {row.type == "HKC" ? "Hari Kerja Check Log" :
                                                row.type == "HKM" ? "Hari Kerja Manual" : ""}
                                            </TableBodyCell>
                                            <TableBodyCell>{row.description}</TableBodyCell>
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
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                <div class="flex gap-2">
                    <select bind:value={tableAbsenDept.rowsPerPage} onchange={() => tableAbsenDept.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <MyInput type='text' bind:value={tableAbsenDeptSearch.value}/>
                    <MyButton onclick={()=>tableAbsenDeptSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableAbsenDept.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableAbsenDept}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableAbsenDept} field="payroll">Payroll</ThSort>
                            <ThSort table={tableAbsenDept} field="name">Name</ThSort>
                            <ThSort table={tableAbsenDept} field="check_in">Check In</ThSort>
                            <ThSort table={tableAbsenDept} field="check_out">Check Out</ThSort>
                            <ThSort table={tableAbsenDept} field="tanggal">Type</ThSort>
                            <ThSort table={tableAbsenDept} field="description">Description</ThSort>
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
                                        <TableBodyCell>{formatTanggal(row.check_in)}</TableBodyCell>
                                        <TableBodyCell>{formatTanggal(row.check_out)}</TableBodyCell>
                                        <TableBodyCell>
                                            {row.type == "HKC" ? "Hari Kerja Check Log" :
                                            row.type == "HKM" ? "Hari Kerja Manual" : ""}
                                        </TableBodyCell>
                                        <TableBodyCell>{row.description}</TableBodyCell>
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