<script lang="ts">
    import { fade } from 'svelte/transition'
    import { Tabs, TabItem } from 'flowbite-svelte';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Button, Badge } from 'flowbite-svelte';
	import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import { RefreshCw, Search } from '@lucide/svelte';
    import MyButton from '$/lib/components/MyButton.svelte'
	import MyLoading from '@/MyLoading.svelte';
	import MyInput from '@/MyInput.svelte';
    import TableAttendanceClockIn from '$/lib/components/TableAttendanceClockIn.svelte';
	import TableAttendanceClockOut from '$/lib/components/TableAttendanceClockOut.svelte';
	import TableAttendanceDifference from '$/lib/components/TableAttendanceDifference.svelte';
	import { formatTanggal, generatePeriode, namaHari, isLate, getParams, hitungDifference, formatDifference } from '$/lib/utils.js';
	import { format } from 'date-fns';
	import Svelecte from 'svelecte';
    import { invalidateAll } from '$app/navigation';
	import MyPagination from '@/MyPagination.svelte';
    
    const rowsPerPage = 30
    let {data} = $props()
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)
    let setting = $derived(data.periode)
    let periode = $derived(generatePeriode(new Date().toString(), Number(setting?.start_periode), Number(setting?.end_periode)))
    
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
        payroll: (()=> user?.payroll)(),
        dept: (()=> user?.department)(),
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
        dept: (()=> user?.department)(),
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
                    <MyButton onclick={()=>tableAbsenSearch.set()} size='lg'><Search size={16} /></MyButton>
                    <MyButton onclick={async ()=> {
                        await invalidateAll()
                        tableAbsen.invalidate()
                    }} size='lg'><RefreshCw size={16}/></MyButton>
                </div>
                
                <span class='italic text-[.8rem] text-blue-400'>* Overtime start from {setting?.overtime_allow} minute {setting?.overtime_round_up ? "(Round up)":""}</span>
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
                                            <TableBodyCell tdClass='break-all font-medium'>{row.name}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{namaHari[Number(format(formatTanggal(row.check_in), "c")) - 1]}</div>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{format(formatTanggal(row.check_in), "d MMMM yyyy")}</div>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <TableAttendanceClockIn check_in={row.check_in} check_in2={row.check_in2}/>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <TableAttendanceClockOut check_out={row.check_out} check_out2={row.check_out2} check_in={row.check_in}/>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <TableAttendanceDifference check_in={row.lembur_start} check_out={row.check_out} check_in2={row.check_in2} check_out2={row.check_out2} overtime={setting.overtime_allow}/>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <div class="flex gap-1 flex-wrap max-w-[10rem]">
                                                    {#each [...row.description.split(",").filter((v: string) => v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                        (isLate(formatTanggal(row.start_work), formatTanggal(row.check_in), setting?.late_dispen) && !row.isWeekend) ? {type:"late", value:"Late"} : null,
                                                        (()=> {
                                                            const {hour, minute} = hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2)
                                                            const isOvertime = (hour > 0) || (hour == 0 && minute >= setting?.overtime_allow) && row.overtime
                                                            return isOvertime
                                                                ? {type:"lembur", value:`Overtime ${formatDifference({ round_up: setting?.overtime_round_up, overtime: setting?.overtime_allow, ...hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2), })}`}
                                                                : null
                                                        })(),
                                                        row.ijin_info ? {type:"ijin_info", value: row.ijin_info} : null
                                                        ] as val}
                                                        {#if val}
                                                            <Badge rounded color={val.type == "kerja" ? "dark" 
                                                                : val.type == "late" ? "red" 
                                                                : val.type == "lembur" ? "green" 
                                                                : val.type == "ijin_info" ? "yellow" : "none"} class='flex gap-2 break-words whitespace-normal'>{val.value}
                                                            </Badge>
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
                    <MyPagination table={tableAbsen} />
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
                        <MyButton onclick={()=>tableAbsenDeptSearch.set()} size='lg'><Search size={16} /></MyButton>
                        <MyButton onclick={async ()=> {
                            await invalidateAll()
                            tableAbsenDept.invalidate()
                        }} size='lg'><RefreshCw size={16}/></MyButton>
                    </div>
                    
                    <span class='italic text-[.8rem] text-blue-400'>* Overtime start from {setting?.overtime_allow} minute {setting?.overtime_round_up ? "(Round up)":""}</span>
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
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{namaHari[Number(format(formatTanggal(row.check_in), "c")) - 1]}</div>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <div class={format(formatTanggal(row.check_in), "EEE") == "Sun" ? "text-red-500":""}>{format(formatTanggal(row.check_in), "d MMMM yyyy")}</div>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{row.payroll}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{row.name}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <TableAttendanceClockIn check_in={row.check_in} check_in2={row.check_in2}/>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <TableAttendanceClockOut check_out={row.check_out} check_out2={row.check_out2} check_in={row.check_in}/>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <TableAttendanceDifference check_in={row.lembur_start} check_out={row.check_out} check_in2={row.check_in2} check_out2={row.check_out2} overtime={setting.overtime_allow}/>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <div class="flex gap-1 flex-wrap max-w-[10rem]">
                                                    {#each [...row.description.split(",").filter((v: string) => v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                        (isLate(formatTanggal(row.start_work), formatTanggal(row.check_in), setting?.late_dispen) && !row.isWeekend) ? {type:"late", value:"Late"} : null,
                                                        (()=> {
                                                            const {hour, minute} = hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2)
                                                            const isOvertime = (hour > 0) || (hour == 0 && minute >= setting?.overtime_allow) && row.overtime
                                                            return isOvertime
                                                                ? {type:"lembur", value:`Overtime ${formatDifference({ round_up: setting?.overtime_round_up, overtime: setting?.overtime_allow, ...hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2), })}`}
                                                                : null
                                                        })(),
                                                        row.ijin_info ? {type:"ijin_info", value: row.ijin_info} : null
                                                        ] as val}
                                                        {#if val}
                                                            <Badge rounded color={val.type == "kerja" ? "dark" 
                                                                : val.type == "late" ? "red" 
                                                                : val.type == "lembur" ? "green" 
                                                                : val.type == "ijin_info" ? "yellow" : "none"} class='flex gap-2 break-words whitespace-normal'>{val.value}
                                                            </Badge>
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
                        <MyPagination table={tableAbsenDept} />
                    </Datatable>
                </div>
            </TabItem>
        {/if}
    </Tabs>
</main>