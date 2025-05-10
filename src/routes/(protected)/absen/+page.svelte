<script lang="ts">
    import { fade, slide } from 'svelte/transition'
    import { Tabs, TabItem } from 'flowbite-svelte';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Checkbox, Button, Badge } from 'flowbite-svelte';
	import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import { Calendar, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, RefreshCw, Search } from '@lucide/svelte';
    import MyButton from '@lib/components/MyButton.svelte'
	import { getParams } from '@lib/data/api.js';
	import MyLoading from '@/MyLoading.svelte';
	import MyInput from '@/MyInput.svelte';
	import { formatTanggal, generatePeriode, namaHari, isLate } from '@lib/utils.js';
	import { differenceInHours, format } from 'date-fns';
	import Svelecte from 'svelecte';
    
    const rowsPerPage = 30
    let {data} = $props()
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)
    let setting = $derived(data.periode)
    let periode = $derived(generatePeriode(Number(setting?.start_periode), Number(setting?.end_periode)))
    
    let openRow: number[] = $state([]) 
    const toggleRow = (i: number) => {
        if(openRow.includes(i)){
            openRow = openRow.filter((item) => item !== i)
        } else {
            openRow.push(i)
        }
    }

    let tableAbsen = new TableHandler([], {rowsPerPage})
    let tableAbsenSearch = tableAbsen.createSearch()

    const formAbsenAnswer = {
        get dept() { return user?.department},
        get payroll() { return user?.payroll},
        name: "",
        success:"",
        error:"",
        showCalendar: false,
        loading:false,
        add:false,
        edit:false,
    }
    
    let formAbsen = $state({...formAbsenAnswer})
    
    // Absen Dept
    let tableAbsenDept = new TableHandler([], {rowsPerPage})
    let tableAbsenDeptSearch = tableAbsenDept.createSearch()

    const formAbsenDeptAnswer = {
        get dept() { return user?.department},
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    }
    
    let formAbsenDept = $state({...formAbsenDeptAnswer})

    const handleBackToMyAbsent = () =>{
        formAbsen.payroll = user?.payroll
        tableAbsen.invalidate()
    }

    // Fetch
    const getUser = async (val: string = "") =>{
        const req = await fetch(`/api/data?type=user_by_dept&val=${val || ""}`)
        return await req.json()
    }

    const getDept = async (val:string = '')=>{
        const req = await fetch(`/api/data?type=dept&val=${val}`)
        const res = await req.json()
        return res
    }

    $effect(()=>{
        if(!formAbsen.payroll) formAbsen.payroll = user.payroll
    })
    
    $effect(()=>{
        tableAbsen.load(async (state: State) => {
            try {
                const req = await fetch(`/api/absen?${getParams(state)}&payroll=${formAbsen.payroll}&start_date=${periode.start}&end_date=${periode.end}`)
                if (!req.ok) throw new Error('Gagal mengambil data');
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (error) {
                
            }
        })

        if (userProfile.level > 1){
            tableAbsenDept.load(async (state: State) => {
                try {
                    const req = await fetch(`/api/absen?${getParams(state)}&dept=${formAbsenDept.dept || ""}&start_date=${periode.start}&end_date=${periode.end}`)
                    if (!req.ok) throw new Error('Gagal mengambil data');
                    const {items, totalItems} = await req.json()
                    state.setTotalRows(totalItems)
                    return items
                } catch (error) {
                    
                }
            })
        }
    })

    setTimeout(()=>{
        tableAbsen.invalidate()
        if (userProfile.level > 1){
            tableAbsenDept.invalidate()
        }
    }, 1000)
</script>

<svelte:head>
    <title>Check In & Out</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full border-slate-300">        
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="Absent">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                {#if userProfile.level > 1}
                    <div class="flex flex-1 gap-2">
                        {#await getUser(formAbsen.dept)}
                            <MyLoading message="Loading data"/>
                        {:then val}
                            <!-- <select bind:value={formAbsen.payroll} class='flex-1' onchange={e=> tableAbsen.invalidate()}>
                                {#each val as {payroll, name}}
                                    <option value={payroll}>{payroll + " - " + name}</option>
                                {/each}
                            </select> -->

                            <Svelecte searchable selectOnTab bind:value={formAbsen.payroll} 
                                options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " - " + v.name}))}
                                onChange={() => tableAbsen.invalidate()}/>
                            
                            {#if formAbsen.payroll !== user?.payroll}
                                <Button onclick={handleBackToMyAbsent}>Back to my absent</Button>
                            {/if}
                        {/await}
                    </div>
                {/if}
                
                <div class="flex gap-2 items-start">
                    <select bind:value={tableAbsen.rowsPerPage} onchange={() => tableAbsen.setPage(1)}>
                        {#each [30, 60, 90, 120] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <div class="flex w-full flex-col">
                        <MyInput type='text' bind:value={tableAbsenSearch.value} onkeydown={(e: KeyboardEvent) => {
                            if(e.key.toLowerCase() === 'enter') tableAbsenSearch.set()
                        }}/>
                        <span class="italic text-[.8rem]">For date must be following format example "2025-12-30" </span>
                    </div>
                    <MyButton onclick={()=>tableAbsenSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableAbsen.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableAbsen}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableAbsen} field="name">Name</ThSort>
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
                                            <TableBodyCell>{row.name}</TableBodyCell>
                                            <TableBodyCell>
                                                <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{namaHari[Number(format(formatTanggal(row.check_in), "c")) - 1]}</div>
                                            </TableBodyCell>
                                            <TableBodyCell>
                                                <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{format(formatTanggal(row.check_in), "d MMMM yyyy")}</div>
                                            </TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.check_in, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_in, "time")}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.check_out, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_out, "time")}</TableBodyCell>
                                            <TableBodyCell>
                                                {#if differenceInHours(row.check_out, row.lembur_start) > 0 && row.check_in != row.check_out}
                                                    <Badge rounded color={"green"}>
                                                        {differenceInHours(row.check_out, row.lembur_start) > 0 ? "+" : (differenceInHours(row.check_out, row.lembur_start) < 0 ? "-":"") }
                                                        {differenceInHours(row.check_out, row.lembur_start) !== 0 ? differenceInHours(row.check_out, row.lembur_start) + " Hour": ""}
                                                        {Number(format(row.check_out, "m")) > 0 ? format(row.check_out, "m") + " Minute" :""}
                                                    </Badge>
                                                {/if}
                                            </TableBodyCell>
                                            <TableBodyCell>
                                                <div class="flex gap-1 flex-wrap max-w-[10rem]">
                                                    {#each [...row.description.split(",").filter(v => v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                        isLate(formatTanggal(row.start_work), formatTanggal(row.check_in)) ? {type:"late", value:"Late"} : null,
                                                        differenceInHours(row.check_out, row.lembur_start) > 0 
                                                            ? {type:"lembur", value:`Overtime ${differenceInHours(row.check_out, row.lembur_start)} Hour ${Number(format(row.check_out, "m")) > 0 ? format(row.check_out, "m") + " Minute" :""}`}
                                                            : null,
                                                        row.ijin_info
                                                            ? {type:"ijin_info", value: row.ijin_info}
                                                            : null
                                                        ] as val}
                                                        {#if val}
                                                            <Badge rounded color={val.type == "kerja" ? "dark" 
                                                            : val.type == "late" ? "red" 
                                                            : val.type == "lembur" ? "green" 
                                                            : val.type == "ijin_info" ? "yellow" : "none"} class='break-words whitespace-normal'>{val.value}</Badge>
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
        {#if userProfile.level > 1}
            <TabItem title="Departement">
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                    {#if userProfile.user_hrd}
                        <div class="flex flex-1 gap-2">
                            {#await getDept()}
                                <MyLoading message="Loading data"/>
                            {:then val}
                                <Svelecte clearable searchable selectOnTab bind:value={formAbsenDept.dept} 
                                    options={val.map((v:any) => ({value: v.dept_code, text:v.dept_code + " - " + v.name}))}
                                    onChange={() => tableAbsenDept.invalidate()}/>
                            {/await}
                        </div>
                    {/if}

                    <div class="flex gap-2 items-start">
                        <select bind:value={tableAbsenDept.rowsPerPage} onchange={() => tableAbsenDept.setPage(1)}>
                            {#each [30, 60, 90, 120] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                        <div class="flex w-full flex-col">
                            <MyInput type='text' bind:value={tableAbsenDeptSearch.value} onkeydown={(e: KeyboardEvent) => {
                                if(e.key.toLowerCase() === 'enter') tableAbsenDeptSearch.set()
                            }}/>
                            <span class="italic text-[.8rem]">For date must be following format example "2025-12-30" </span>
                        </div>
                        <MyButton onclick={()=>tableAbsenDeptSearch.set()}><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableAbsenDept.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                    
                    <Datatable table={tableAbsenDept}>
                        <Table>
                            <TableHead>
                                <ThSort table={tableAbsenDept} field="check_in">Day</ThSort>
                                <ThSort table={tableAbsenDept} field="check_in">Date</ThSort>
                                <ThSort table={tableAbsenDept} field="payroll">Payroll</ThSort>
                                <ThSort table={tableAbsenDept} field="name">Name</ThSort>
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
                                            <TableBodyCell>
                                                <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{namaHari[Number(format(formatTanggal(row.check_in), "c")) - 1]}</div>
                                            </TableBodyCell>
                                            <TableBodyCell>
                                                <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{format(formatTanggal(row.check_in), "d MMMM yyyy")}</div>
                                            </TableBodyCell>
                                            <TableBodyCell>{row.payroll}</TableBodyCell>
                                            <TableBodyCell>{row.name}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.check_in, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_in, "time")}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.check_out, "time").slice(0,2) == "00" ? "-" : formatTanggal(row.check_out, "time")}</TableBodyCell>
                                            <TableBodyCell>
                                                {#if differenceInHours(row.check_out, row.lembur_start) > 0 && row.check_in != row.check_out}
                                                    <Badge rounded color={"green"}>
                                                        {differenceInHours(row.check_out, row.lembur_start) > 0 ? "+" : (differenceInHours(row.check_out, row.lembur_start) < 0 ? "-":"") }
                                                        {differenceInHours(row.check_out, row.lembur_start) !== 0 ? differenceInHours(row.check_out, row.lembur_start) + " Hour": ""}
                                                        {Number(format(row.check_out, "m")) > 0 ? format(row.check_out, "m") + " Minute" :""}
                                                    </Badge>
                                                {/if}
                                            </TableBodyCell>
                                            <TableBodyCell>
                                                <div class="flex gap-1 flex-wrap max-w-[10rem]">
                                                    {#each [...row.description.split(",").filter(v => v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                        isLate(formatTanggal(row.start_work), formatTanggal(row.check_in)) ? {type:"late", value:"Late"} : null,
                                                        differenceInHours(row.check_out, row.lembur_start) > 0 
                                                            ? {type:"lembur", value:`Overtime ${differenceInHours(row.check_out, row.lembur_start)} Hour ${Number(format(row.check_out, "m")) > 0 ? format(row.check_out, "m") + " Minute" :""}`}
                                                            : null,
                                                        row.ijin_info
                                                            ? {type:"ijin_info", value: row.ijin_info}
                                                            : null
                                                        ] as val}
                                                        {#if val}
                                                            <Badge rounded color={val.type == "kerja" ? "dark" 
                                                            : val.type == "late" ? "red" 
                                                            : val.type == "lembur" ? "green" 
                                                            : val.type == "ijin_info" ? "yellow" : "none"} class='break-words whitespace-normal'>{val.value}</Badge>
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
        {/if}
    </Tabs>
</main>