<script lang="ts">
    import { fade } from 'svelte/transition'
    import { Tabs, TabItem } from 'flowbite-svelte';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Button } from 'flowbite-svelte';
	import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
	import { RefreshCw, Search } from '@lucide/svelte';
    import MyButton from '$/lib/components/MyButton.svelte'
	import MyLoading from '@/MyLoading.svelte';
	import MyInput from '@/MyInput.svelte';
    import TableAttendanceClockIn from '$/lib/components/TableAttendanceClockIn.svelte';
	import TableAttendanceClockOut from '$/lib/components/TableAttendanceClockOut.svelte';
	import TableAttendanceDifference from '$/lib/components/TableAttendanceDifference.svelte';
	import { formatTanggal, generatePeriode, namaHari, getParams, hitungDifference, formatDifference, formatLate, hitungJamMenit, capitalEachWord } from '$/lib/utils.js';
	import { format, getDay } from 'date-fns';
	import Svelecte from 'svelecte';
    import { invalidateAll } from '$app/navigation';
	import MyPagination from '@/MyPagination.svelte';
	import MyBadge from '@/MyBadge.svelte';
    
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
        dept: (()=> user?.user_type == "HR" ? "" : user?.department)(),
        showCalendar: false,
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
        tableAbsen.setPage(1)
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

        if (user.level > 1){
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
        if (user.level > 1){
            tableAbsenDept.invalidate()
        }
    }, 1000)
</script>

<svelte:head>
    <title>Absen</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full border-slate-300">        
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="Absen">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                {#if user.level > 1}
                    <div class="flex flex-1 gap-2">
                        {#await getUser(formAbsen.dept)}
                            <MyLoading message="Loading data"/>
                        {:then val}
                            <Svelecte searchable selectOnTab bind:value={formAbsen.payroll} 
                                options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " - " + capitalEachWord(v.name)}))}
                                onChange={() => tableAbsen.setPage(1)}/>
                            
                            {#if formAbsen.payroll !== user?.payroll}
                                <Button onclick={handleBackToMyAbsent}>Kembali ke attendance saya</Button>
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
                        <span class="italic text-[.8rem]">Pencarian tanggal mengikuti format "2025-12-30"</span>
                    </div>
                    <MyButton onclick={()=>tableAbsenSearch.set()} size='lg'><Search size={16} /></MyButton>
                    <MyButton onclick={async ()=> {
                        await invalidateAll()
                        tableAbsen.invalidate()
                    }} size='lg'><RefreshCw size={16}/></MyButton>
                </div>
                
                <span class='italic text-[.8rem] text-blue-400'>* Overtime dimulai setelah {setting?.overtime_allow} menit {setting?.overtime_round_up ? "(Round up)":""}</span>
                <Datatable table={tableAbsen}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableAbsen} field="name">Nama</ThSort>
                            <ThSort table={tableAbsen} field="check_in">Hari</ThSort>
                            <ThSort table={tableAbsen} field="check_in">Tanggal</ThSort>
                            <ThSort table={tableAbsen} field="check_in">Absen Masuk</ThSort>
                            <ThSort table={tableAbsen} field="check_out">Absen Keluar</ThSort>
                            <ThSort table={tableAbsen} field="">Selisih</ThSort>
                            <ThSort table={tableAbsen} field="">Informasi</ThSort>
                        </TableHead>

                        {#if tableAbsen.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                            <TableBody>
                                {#if tableAbsen.rows.length > 0}
                                    {#each tableAbsen.rows as row}
                                        <TableBodyRow class={`h-10 ${getDay(formatTanggal(row.check_in, "date")) == 0 ? "!bg-red-50":""}`} >
                                            <TableBodyCell tdClass='break-all font-medium'>{capitalEachWord(row.name)}</TableBodyCell>
                                            <TableBodyCell tdClass='w-[50px] max-w-[50px] break-all font-medium'>
                                                <span class={getDay(formatTanggal(row.check_in, "date")) == 0 ? "text-red-500":""}>{namaHari[getDay(formatTanggal(row.check_in, "date"))]}</span>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='w-[150px] max-w-[150px] break-all font-medium'>
                                                <span class={getDay(formatTanggal(row.check_in, "date")) == 0 ? "text-red-500":""}>{formatTanggal(row.check_in, "date", "app")}</span>
                                            </TableBodyCell>

                                            <TableBodyCell tdClass='w-[180px] max-w-[180px] break-all font-medium'>
                                                <TableAttendanceClockIn check_in={row.check_in} check_in2={row.check_in2}/>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='w-[180px] max-w-[180px] break-all font-medium'>
                                                <TableAttendanceClockOut check_out={row.check_out} check_out2={row.check_out2} check_in={row.check_in}/>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='w-[180px] max-w-[180px] break-all font-medium'>
                                                <TableAttendanceDifference check_in={row.lembur_start} check_out={row.check_out} check_in2={row.check_in2} check_out2={row.check_out2} overtime={setting.overtime_allow}/>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <div class="flex gap-1 flex-wrap">
                                                    {#each [...row.description.split(",").filter((v: string) => row.ijin_info ? null : v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                        (row.late_in_minute > 0 && !row.isWeekend) ? 
                                                            {type:"late", value:"Late " + formatLate(hitungJamMenit(row.late_in_minute))} : null,
                                                        (()=> {
                                                            const {hour, minute} = hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2)
                                                            const isOvertime = (hour > 0) || (hour == 0 && minute >= 55) && row.overtime
                                                            return isOvertime
                                                                ? {type:"lembur", value:`Overtime ${formatDifference({ round_up: setting?.overtime_round_up, overtime: setting?.overtime_allow, ...hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2), })}`}
                                                                : null
                                                        })(),
                                                        row.ijin_info ? {type:"ijin_info", value: row.ijin_info + ` (${row.description})`} : null
                                                        ] as val}
                                                        {#if val}
                                                            <MyBadge italic border={val.type == "kerja"} color={
                                                                ["kerja"].includes(val.type) ? "default"
                                                                : ["late"].includes(val.type) ? "red" 
                                                                : ["lembur"].includes(val.type) ? "green" 
                                                                : ["ijin_info"].includes(val.type) ? "yellow" 
                                                                : "dark"}>
                                                                {val.value}
                                                            </MyBadge>
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
        {#if user.level > 1}
            <TabItem title="Departemen">
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                    {#if userProfile.user_type == 'HR'}
                        <div class="flex flex-1 gap-2">
                            {#await getDept()}
                                <MyLoading message="Loading data"/>
                            {:then val}
                                <Svelecte clearable searchable selectOnTab bind:value={formAbsenDept.dept} 
                                    options={val.map((v:any) => ({value: v.dept_code, text:v.dept_code + " - " + v.name}))}
                                    onChange={() => tableAbsenDept.setPage(1)}/>
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
                            <span class="italic text-[.8rem]">Pencarian tanggal mengikuti format "2025-12-30"</span>
                        </div>
                        <MyButton onclick={()=>tableAbsenDeptSearch.set()} size='lg'><Search size={16} /></MyButton>
                        <MyButton onclick={async ()=> {
                            await invalidateAll()
                            tableAbsenDept.invalidate()
                        }} size='lg'><RefreshCw size={16}/></MyButton>
                    </div>
                    
                    <span class='italic text-[.8rem] text-blue-400'>* Overtime dimulai setelah {setting?.overtime_allow} menit {setting?.overtime_round_up ? "(Round up)":""}</span>
                    <Datatable table={tableAbsenDept}>
                        <Table>
                            <TableHead>
                                <ThSort table={tableAbsenDept} field="check_in">Hari</ThSort>
                                <ThSort table={tableAbsenDept} field="check_in">Tanggal</ThSort>
                                <ThSort table={tableAbsenDept} field="payroll">Payroll</ThSort>
                                <ThSort table={tableAbsenDept} field="name">Nama</ThSort>
                                <ThSort table={tableAbsenDept} field="check_in">Absen Masuk</ThSort>
                                <ThSort table={tableAbsenDept} field="check_out">Absen Keluar</ThSort>
                                <ThSort table={tableAbsenDept} field="">Selisih</ThSort>
                                <ThSort table={tableAbsenDept} field="">Informasi</ThSort>
                            </TableHead>

                            {#if tableAbsenDept.isLoading}
                                <div class="flex p-4 items-center">
                                    <MyLoading message="Loading data"/>
                                </div>
                            {:else}
                            <TableBody>
                                {#if tableAbsenDept.rows.length > 0}
                                    {#each tableAbsenDept.rows as row}
                                        <TableBodyRow class={`h-10 ${getDay(formatTanggal(row.check_in, "date")) == 0 ? "!bg-red-50":""}`} >
                                            <TableBodyCell tdClass='w-[50px] max-w-[50px] break-all font-medium'>
                                                <span class={getDay(formatTanggal(row.check_in, "date")) == 0 ? "text-red-500":""}>{namaHari[getDay(formatTanggal(row.check_in, "date"))]}</span>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='w-[150px] max-w-[150px] break-all font-medium'>
                                                <span class={getDay(formatTanggal(row.check_in, "date")) == 0 ? "text-red-500":""}>{formatTanggal(row.check_in, "date", "app")}</span>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='w-[50px] max-w-[50px] break-all font-medium'>{row.payroll}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{capitalEachWord(row.name)}</TableBodyCell>
                                            <TableBodyCell tdClass='w-[180px] max-w-[180px] break-all font-medium'>
                                                <TableAttendanceClockIn check_in={row.check_in} check_in2={row.check_in2}/>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='w-[180px] max-w-[180px] break-all font-medium'>
                                                <TableAttendanceClockOut check_out={row.check_out} check_out2={row.check_out2} check_in={row.check_in}/>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='w-[180px] max-w-[180px] break-all font-medium'>
                                                <TableAttendanceDifference check_in={row.lembur_start} check_out={row.check_out} check_in2={row.check_in2} check_out2={row.check_out2} overtime={setting.overtime_allow}/>
                                            </TableBodyCell>
                                            <TableBodyCell tdClass='font-medium'>
                                                <div class="flex gap-1 flex-wrap">
                                                    {#each [...row.description.split(",").filter((v: string) => row.ijin_info ? null : v.trim()).map((v: string) => ({type:"kerja", value: v})), 
                                                        (row.late_in_minute > 0 && !row.isWeekend) ? 
                                                            {type:"late", value:"Late " + formatLate(hitungJamMenit(row.late_in_minute))} : null,
                                                        (()=> {
                                                            const {hour, minute} = hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2)
                                                            const isOvertime = (hour > 0) || (hour == 0 && minute >= 55) && row.overtime
                                                            return isOvertime
                                                                ? {type:"lembur", value:`Overtime ${formatDifference({ round_up: setting?.overtime_round_up, overtime: setting?.overtime_allow, ...hitungDifference(row.lembur_start, row.check_out, row.check_in2, row.check_out2), })}`}
                                                                : null
                                                        })(),
                                                        row.ijin_info ? {type:"ijin_info", value: row.ijin_info + ` (${row.description})`} : null
                                                        ] as val}
                                                        {#if val}
                                                            <MyBadge italic border={val.type == "kerja"} color={
                                                                ["kerja"].includes(val.type) ? "default"
                                                                : ["late"].includes(val.type) ? "red" 
                                                                : ["lembur"].includes(val.type) ? "green" 
                                                                : ["ijin_info"].includes(val.type) ? "yellow" 
                                                                : "dark"}>
                                                                {val.value}
                                                            </MyBadge>
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