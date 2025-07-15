<script lang='ts'>
    import { Table, TableBody, TableHeadCell, TableBodyCell, TableBodyRow, TableHead, Badge, Timeline, TimelineItem } from 'flowbite-svelte';
	import { generatePeriode } from '@lib/utils';
	import Svelecte from 'svelecte';
    import { fade } from 'svelte/transition'
    import { TableHandler } from '@vincjo/datatables/server';
	import { format, set } from 'date-fns';
	import MyLoading from '@/MyLoading.svelte';
	import MyChart from '@/MyChart.svelte';
	import { Box, CalendarClock, CalendarRange, Minus } from '@lucide/svelte';

    let {data} = $props()
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)
    let setting = $derived(data.periode)
    
    let dataTahun: {value: number, title: string}[] = []
    let dataBulan: {value: number, title: string}[] = []
    for(let a = 2020; a <= new Date().getFullYear() + 1; a++){
        dataTahun.push({value: a, title: a.toString()})
    }
    
    for(let a = 0; a < 12; a++){
        dataBulan.push({value: Number(a), title: format(new Date(2000, a, 1), "MMMM")})
    }
    
    let modeReport = $state({
        dept: (()=> user?.department)(),
        payroll: (()=> user?.payroll)(),
        type: "",
        start_date:"",
        end_date:"",
        year: new Date().getFullYear().toString(),
        month: (new Date().getMonth() + 2).toString(),
        typeChart: "pie"
    })
    
    const getDept = async (val:string = '')=>{
        const req = await fetch(`/api/data?type=dept&val=${val}`)
        const res = await req.json()
        return res
    }

    const getReportAttendance = async () =>{
        try {
            const req = await fetch(`/api/data?type=get_report_attendance_dept&dept=${modeReport.dept}&start_date=${modeReport.start_date}&end_date=${modeReport.end_date}`)
            const res = await req.json()
            return res
        } catch (error) {
            return "gagal"
        }
    }

    const getReportDisiplin = async () =>{
        try {
            const req = await fetch(`/api/data?type=get_report_disiplin_dept&dept=${modeReport.dept}&start_date=${modeReport.start_date}&end_date=${modeReport.end_date}`)
            const res = await req.json()
            return res
        } catch (error) {
            return "gagal"
        }
    }

    const getReportLembur = async () =>{
        try {
            const req = await fetch(`/api/data?type=get_report_lembur_dept&dept=${modeReport.dept}&start_date=${modeReport.start_date}&end_date=${modeReport.end_date}`)
            const res = await req.json()
            return res
        } catch (error) {
            return "gagal"
        }
    }

    let tableAttendance = $state(new TableHandler([]))

    let formAttendance = $state({
        year: new Date().getFullYear(),
        month: new Date().getMonth()
    })
    
    $effect(()=> {
        const temp = set(new Date(), {year: formAttendance.year, month: formAttendance.month, date: setting?.end_periode})
        modeReport.start_date = generatePeriode(temp.toString(), Number(setting?.start_periode), Number(setting?.end_periode)).start
        modeReport.end_date = generatePeriode(temp.toString(), Number(setting?.start_periode), Number(setting?.end_periode)).end
    })

    const handleFilterChart = (val: any[], type: string, title: string = "") => {
        try {
            if(!type) throw new Error ("Type wajib diisi")
            const warnaList = ["#1E352F", "#CBDFBD","#7EBDC2","#FFADC6","#F4D35E", 
            "#FF7F11","#AF3B6E", "#CE4760" , "#4ECDC4", "#1C5D99"]
            let temp = Object.entries(val).map(([key, data]) => {
                return {data: data[type], colors: warnaList[Math.floor(Math.random() * warnaList.length)], label: data.name}
            })

            const chartData = {
                labels: temp.map(item => item.label),
                datasets: [{
                    data: temp.map(item => item.data),
                    backgroundColor: temp.map(item => item.colors),
                    label: title
                }]
            };

            let chartOptions =  {
                responsive: true,
                plugins: {
                    legend: {
                        display: false,
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'start',
                        color: '#FFF',
                        formatter: (value: number | string) => (value > 0) ? value : null
                    },
                    title: {
                        display: true,
                        text: title ? title : `Chart ${modeReport.dept}`
                    }
                },
                animations: {
                    x: {
                        easing: 'easeInOutElastic',
                        from: (ctx) => {
                            if (ctx.type === 'data') {
                                if (ctx.mode === 'default' && !ctx.dropped) {
                                ctx.dropped = true;
                                return 0;
                                }
                            }
                        }
                    },
                    radius: {
                        duration: 5000,
                        easing: 'linear',
                        loop: (context) => context.active
                    }
                }                
            }
            return {data: chartData, option: chartOptions }
        } catch (error) {
            console.error(error.message)
        }
    }
</script>

<svelte:head>
    <title>Report</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full w-full">
    <div class="relative flex flex-1 flex-col border-[var(--color-bgside)] border-[2px] rounded-lg p-3 gap-3">
        {#if userProfile.user_hrd || userProfile.level > 1}
            <div class="sticky top-[0] bg-bgdark flex gap-2 border-[var(--color-bgside)] border rounded-lg p-4 z-10 shadow-lg">
                {#await getDept()}
                    <MyLoading message="Loading data"/>
                {:then val}
                    <div class="flex items-center gap-2">
                        <CalendarRange class='self-center' size={16} />
                        <div class="flex flex-col gap-2">
                            <select bind:value={formAttendance.year} >
                                {#each dataTahun as {title, value}}
                                <option value={value}>
                                    {title} {value.toString() == format(modeReport.start_date, "yyyy") ? "(Select)" : null}
                                    {value.toString() == new Date().getFullYear().toString() ? "(Now)" : null}
                                </option>
                                {/each}
                            </select>
                            <select bind:value={formAttendance.month} >
                                {#each dataBulan as {title, value}}
                                <option value={value}>
                                    {title} {value.toString() == format(modeReport.start_date, "M") ? "(Select)" : null}
                                    {value.toString() == (new Date().getMonth()).toString() ? "(Now)" : null}
                                </option>
                                {/each}
                            </select> 
                        </div>
                    </div>
                    <div class="flex flex-col gap-2 flex-1">
                        <div class="flex items-center gap-2 p-2">
                            <CalendarClock size={16} />
                            <Badge>{modeReport.start_date}</Badge>
                            <Minus size={16} />
                            <Badge>{modeReport.end_date}</Badge>
                        </div>
                        <div class="flex items-center gap-2 p-2">
                            <Box size={16} />
                            <Svelecte class='' clearable searchable selectOnTab multiple={false} bind:value={modeReport.dept} 
                            options={val.map((v:any) => ({value: v.dept_code, text:v.dept_code + " - " + v.name}))}
                            onChange={() => tableAttendance.invalidate()}/>
                        </div>
                    </div>
                {/await}
            </div>
        {/if}
        
        <Timeline>
            <TimelineItem title="Report Attendance Department">
                {#await getReportAttendance() }
                    <MyLoading message="Loading report data"/>
                {:then val}
                    {#if val.length > 0}
                        <div class="flex flex-col gap-4 mt-2">
                            <Table class='border border-bgside'>
                                <TableHead>
                                    {#each Object.entries(val[0]) as value, i}
                                        <TableHeadCell class='py-2'>{value[0]}</TableHeadCell>
                                    {/each}
                                </TableHead>
                                <TableBody>
                                    {#each val, i}
                                        <TableBodyRow>
                                            {#each Object.entries(val[i]) as value, i (value[0])}
                                                <TableBodyCell class={`py-2 ${i == 0 ? "":"text-center"}`}>{value[1]}</TableBodyCell>
                                            {/each}
                                        </TableBodyRow>
                                    {/each}
                                </TableBody>
                            </Table>
                            <div class="flex gap-4">
                                <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                                    <MyChart chartData={handleFilterChart(val, "Attendance")?.data} chartOptions={handleFilterChart(val, "Attendance", "Attendance (Days)")?.option} type={"bar"} chartClass='max-h-[20rem]' />
                                </div>
                                <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                                    <MyChart chartData={handleFilterChart(val, "Mangkir")?.data} chartOptions={handleFilterChart(val, "Mangkir", "Tidak Masuk Kantor (Days)")?.option} type={"bar"} chartClass='max-h-[20rem]' />
                                </div>  
                            </div>
                        </div>
                    {:else}
                    <span class='text-[1.5rem] text-center font-bold italic'>No data</span>
                    {/if}
                {/await}
            </TimelineItem>
            <TimelineItem title="Report Kedisiplinan Department">
                {#await getReportDisiplin() }
                    <MyLoading message="Loading report data"/>
                {:then val}
                    {#if val.length > 0}
                        <div class="flex flex-col gap-4 mt-2">
                            <Table class='border border-bgside'>
                                <TableHead>
                                    {#each Object.entries(val[0]) as value, i}
                                        <TableHeadCell class='py-2'>{value[0]}</TableHeadCell>
                                    {/each}
                                </TableHead>
                                <TableBody>
                                    {#each val, i}
                                        <TableBodyRow>
                                            {#each Object.entries(val[i]) as value, i (value[0])}
                                                <TableBodyCell class={`py-2 ${i == 0 ? "":"text-center"}`}>{value[1]}</TableBodyCell>
                                            {/each}
                                        </TableBodyRow>
                                    {/each}
                                </TableBody>
                            </Table>
                            <div class="flex gap-4">
                                <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                                    <MyChart chartData={handleFilterChart(val, "Late", "Late")?.data} chartOptions={handleFilterChart(val, "Late", "Late (Days)")?.option} type={"bar"} chartClass='max-h-[20rem]' />
                                </div>
                                <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                                    <MyChart chartData={handleFilterChart(val, "Avg Telat", "Avg Minutes Telat")?.data} chartOptions={handleFilterChart(val, "Avg Telat", "Avg Minutes Telat (Minutes)")?.option} type={"bar"} chartClass='max-h-[20rem]' />
                                </div>  
                            </div>
                        </div>
                    {:else}
                        <span class='text-[1.5rem] text-center font-bold italic'>No data</span>
                    {/if}
                {/await}
            </TimelineItem>
            <TimelineItem title="Report Lembur Department">
                {#await getReportLembur() }
                    <MyLoading message="Loading report data"/>
                {:then val}
                    {#if val.length > 0}
                        <div class="flex flex-col gap-4">
                            <Table class='border border-bgside'>
                                <TableHead>
                                    {#each Object.entries(val[0]) as value, i}
                                        <TableHeadCell class='py-2'>{value[0]}</TableHeadCell>
                                    {/each}
                                </TableHead>
                                <TableBody>
                                    {#each val, i}
                                        <TableBodyRow>
                                            {#each Object.entries(val[i]) as value, i (value[0])}
                                                <TableBodyCell class={`py-2 ${i == 0 ? "":"text-center"}`}>{value[1]}</TableBodyCell>
                                            {/each}
                                        </TableBodyRow>
                                    {/each}
                                </TableBody>
                            </Table>
                            <div class="flex gap-4">
                                <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                                    <MyChart chartData={handleFilterChart(val, "Lembur", "Lembur")?.data} chartOptions={handleFilterChart(val, "Lembur", "Lembur (Days)")?.option} type={"bar"} chartClass='max-h-[20rem]' />
                                </div>
                                <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                                    <MyChart chartData={handleFilterChart(val, "Jam Lembur", "Total Lembur")?.data} chartOptions={handleFilterChart(val, "Jam Lembur", "Total Lembur (Hour)")?.option} type={"bar"} chartClass='max-h-[20rem]' />
                                </div>  
                            </div>
                        </div>
                    {:else}
                        <span class='text-[1.5rem] text-center font-bold italic'>No data</span>
                    {/if}
                {/await}
            </TimelineItem>
        </Timeline>
    </div>
</main>