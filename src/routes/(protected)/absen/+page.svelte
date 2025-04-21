<script lang="ts">
    import { fade, slide } from 'svelte/transition'
    import { Tabs, TabItem } from 'flowbite-svelte';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Checkbox, Button, Modal, Label, Input, ImagePlaceholder, Badge } from 'flowbite-svelte';
	import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, ClockArrowDown, ClockArrowUp, RefreshCw, Search } from '@lucide/svelte';
    import MyButton from '@lib/components/MyButton.svelte'
	import { getParams } from '@lib/data/api.js';
	import MyLoading from '@/MyLoading.svelte';
	import MyInput from '@/MyInput.svelte';
	import { formatTanggal, getPeriode } from '@lib/utils.js';
	import { differenceInHours, format } from 'date-fns';
    
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
    <!-- <div class="flex items-center gap-2">
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
    </div> -->
    
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="My Absent">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">                
                <div class="flex gap-2 items-start">
                    <select bind:value={tableAbsen.rowsPerPage} onchange={() => tableAbsen.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <div class="flex w-full flex-col">
                        <MyInput type='text' bind:value={tableAbsenSearch.value}/>
                        <span class="italic text-[.8rem]">For date must be following format example "2025-12-30" </span>
                    </div>
                    <MyButton onclick={()=>tableAbsenSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableAbsen.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableAbsen}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableAbsen} field="check_in">Day</ThSort>
                            <ThSort table={tableAbsen} field="check_in">Date</ThSort>
                            <ThSort table={tableAbsen} field="check_in">Clock In</ThSort>
                            <ThSort table={tableAbsen} field="check_out">Clock Out</ThSort>
                            <ThSort table={tableAbsen} field="">Difference</ThSort>
                            <ThSort table={tableAbsen} field="">Information</ThSort>
                        </TableHead>

                        {#if tableAbsen.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                            <TableBody tableBodyClass="divide-y">
                                {#if tableAbsen.rows.length > 0}
                                    {#each tableAbsen.rows as row}
                                        <TableBodyRow class='h-10'>
                                            <TableBodyCell>{format(row.check_in, "EEEE")}</TableBodyCell>
                                            <TableBodyCell>{format(row.check_in, "dd MMMM yyyy")}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.check_in, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_in, "time")}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.check_out, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_out, "time")}</TableBodyCell>
                                            <TableBodyCell>
                                                {#if differenceInHours(row.lembur_end, row.lembur_start) !== 0 && row.check_in != row.check_out}
                                                    <Badge rounded color={differenceInHours(row.lembur_end, row.lembur_start) > 0 ? "green":"red"}>
                                                        {differenceInHours(row.lembur_end, row.lembur_start) > 0 ? "+" : (differenceInHours(row.lembur_end, row.lembur_start) < 0 ? "-":"") }
                                                        {differenceInHours(row.lembur_end, row.lembur_start) !== 0 ? differenceInHours(row.lembur_end, row.lembur_start) + " Hour": ""}
                                                        {format(row.lembur_end, "m") != "0" ? format(row.lembur_end, "m") + " Minute" :""}
                                                    </Badge>
                                                {/if}
                                            </TableBodyCell>
                                            <TableBodyCell>
                                                <div class="flex flex-col gap-1 items-start">
                                                    {#each [...row.description.split(",").filter(v => v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                    formatTanggal(row.check_in, "time").slice(3,5) != "00" ? {type:"late", value:"Late"} : null,
                                                    differenceInHours(row.lembur_end, row.lembur_start) > 0 
                                                        ? {type:"lembur", value:`Overtime ${differenceInHours(row.lembur_end, row.lembur_start)} ${differenceInHours(row.lembur_end, row.lembur_start) == 1 ? " Hour":" Hours"} ${format(row.lembur_end, "m") != "0" ? format(row.lembur_end, "m") + " Minute" :""}`}
                                                        : null,
                                                    row.ijin_info
                                                        ? {type:"ijin_info", value: row.ijin_info}
                                                        : null
                                                    ] as val}
                                                        {#if val}
                                                            <Badge rounded color={val.type == "kerja" ? "indigo" 
                                                            : val.type == "late" ? "red" 
                                                            : val.type == "lembur" ? "yellow" 
                                                            : val.type == "ijin_info" ? "dark" : "none"} class=''>{val.value}</Badge>
                                                        {/if}
                                                    {/each}
                                                </div>
                                            </TableBodyCell>
                                        </TableBodyRow>
                                    {/each}
                                {:else}
                                    <TableBodyRow class='h-10'>
                                        <TableBodyCell colspan={10}>No data available</TableBodyCell>
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
                <div class="flex gap-2 items-start">
                    <select bind:value={tableAbsenDept.rowsPerPage} onchange={() => tableAbsenDept.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <div class="flex w-full flex-col">
                        <MyInput type='text' bind:value={tableAbsenDeptSearch.value}/>
                        <span class="italic text-[.8rem]">For date must be following format example "2025-12-30" </span>
                    </div>
                    <MyButton onclick={()=>tableAbsenDeptSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableAbsenDept.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableAbsenDept}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableAbsenDept} field="payroll">Payroll</ThSort>
                            <ThSort table={tableAbsenDept} field="name">Name</ThSort>
                            <ThSort table={tableAbsenDept} field="check_in">Day</ThSort>
                            <ThSort table={tableAbsenDept} field="check_in">Date</ThSort>
                            <ThSort table={tableAbsenDept} field="check_in">Clock In</ThSort>
                            <ThSort table={tableAbsenDept} field="check_out">Clock Out</ThSort>
                            <ThSort table={tableAbsenDept} field="">Difference</ThSort>
                            <ThSort table={tableAbsenDept} field="">Information</ThSort>
                        </TableHead>

                        {#if tableAbsenDept.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                        <TableBody tableBodyClass="divide-y">
                            {#if tableAbsenDept.rows.length > 0}
                                {#each tableAbsenDept.rows as row}
                                    <TableBodyRow class='h-10'>
                                        <TableBodyCell>{row.payroll}</TableBodyCell>
                                        <TableBodyCell>{row.name}</TableBodyCell>
                                        <TableBodyCell>{format(row.check_in, "EEEE")}</TableBodyCell>
                                        <TableBodyCell>{format(row.check_in, "dd MMMM yyyy")}</TableBodyCell>
                                        <TableBodyCell>{formatTanggal(row.check_in, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_in, "time")}</TableBodyCell>
                                        <TableBodyCell>{formatTanggal(row.check_out, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_out, "time")}</TableBodyCell>
                                        <TableBodyCell>
                                            {#if differenceInHours(row.lembur_end, row.lembur_start) !== 0 && row.check_in != row.check_out}
                                                <Badge rounded color={differenceInHours(row.lembur_end, row.lembur_start) > 0 ? "green":"red"}>
                                                    {differenceInHours(row.lembur_end, row.lembur_start) > 0 ? "+" : (differenceInHours(row.lembur_end, row.lembur_start) < 0 ? "-":"") }
                                                    {differenceInHours(row.lembur_end, row.lembur_start) !== 0 ? differenceInHours(row.lembur_end, row.lembur_start) + " Hour": ""}
                                                    {format(row.lembur_end, "m") != "0" ? format(row.lembur_end, "m") + " Minute" :""}
                                                </Badge>
                                            {/if}
                                        </TableBodyCell>
                                        <TableBodyCell>
                                            <div class="flex flex-col gap-1 items-start">
                                                {#each [...row.description.split(",").filter(v => v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                formatTanggal(row.check_in, "time").slice(3,5) != "00" ? {type:"late", value:"Late"} : null,
                                                differenceInHours(row.lembur_end, row.lembur_start) > 0 
                                                    ? {type:"lembur", value:`Overtime ${differenceInHours(row.lembur_end, row.lembur_start)} ${differenceInHours(row.lembur_end, row.lembur_start) == 1 ? " Hour":" Hours"} ${format(row.lembur_end, "m") != "0" ? format(row.lembur_end, "m") + " Minute" :""}`}
                                                    : null,
                                                row.ijin_info
                                                    ? {type:"ijin_info", value: row.ijin_info}
                                                    : null
                                                ] as val}
                                                    {#if val}
                                                        <Badge rounded color={val.type == "kerja" ? "indigo" 
                                                        : val.type == "late" ? "red" 
                                                        : val.type == "lembur" ? "yellow" 
                                                        : val.type == "ijin_info" ? "dark" : "none"} class=''>{val.value}</Badge>
                                                    {/if}
                                                {/each}
                                            </div>
                                        </TableBodyCell>
                                    </TableBodyRow>
                                {/each}
                            {:else}
                                <TableBodyRow class='h-10'>
                                    <TableBodyCell colspan={10}>No data available</TableBodyCell>
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