<script lang="ts">
    import { fade } from 'svelte/transition'
    import { Badge } from 'flowbite-svelte';
    import { generatePeriode } from '$/lib/utils.js';
	import MyCalendar from '@/MyCalendar.svelte';
	import MyLoading from '@/MyLoading.svelte';
	import Svelecte from 'svelecte';
	import MyChart from '@/MyChart.svelte';
	import { CalendarArrowDown, CalendarArrowUp, CircleUserRound } from '@lucide/svelte';

    let {data} = $props()
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)
    let setting = $derived(data.periode)
    let periode = $derived(generatePeriode(new Date().toString(), Number(setting?.start_periode), Number(setting?.end_periode)))

    const modeView = {
        dept: (()=> userProfile.user_hrd ? "" : user?.department)(),
        payroll: (()=> user?.payroll)(),
        name: (()=> user?.name)(),
    }

    let modeDashboard = $state({
        dept: modeView.dept,
        payroll: modeView.payroll,
        name: modeView.name,
        typeChart: "pie"
    })
    
    // Fetch
    const getUser = async (val: string = "") =>{
        const req = await fetch(`/api/data?type=user_by_dept&val=${modeDashboard.dept || ""}`)
        return await req.json()
    }

    const getReportAttendance = async () =>{
        const req = await fetch(`/api/data?type=get_report_dashboard1&payroll=${modeDashboard.payroll}&start_date=${periode.start}&end_date=${periode.end}`)
        const res = await req.json()

        const warnaList = ["#F1DABF", "#CBDFBD","#7EBDC2","#FFADC6","#F4D35E"]
        const data = Object.entries(res).map(([key, data], index) => ({data, colors: warnaList[index], label: key }))

        const chartData = {
            labels: data.map(item => item.label + (item.data > 0 ? " - " + item.data + " days": "")),
            datasets: [{
                data: data.map(item => item.data),
                backgroundColor: data.map(item => item.colors),
                label: "# in Days"
            }]
        };
        return chartData
    }
    
    let chartOptionsBar = $derived({
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position:"top",
                labels: {
                    color: 'rgb(145, 199, 132)'
                }
            },
            datalabels: {
                anchor: 'end',
                align: 'start',
                color: '#000',
                formatter: (value: number | string) => (value > 0) ? value + " days" : null
            },
            title: {
                display: true,
                text: `Attendance Bar Chart's ${modeDashboard.name}`
            }
        },
    });

    let chartOptionsPie = $derived({
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position:"left",
                labels: {
                    color: 'rgb(145, 199, 132)'
                }
            },
            datalabels: {
                anchor: 'end',
                align: 'start',
                color: '#000',
                formatter: (value: number | string) => (value > 0) ? value + " days" : null
            },
            title: {
                display: true,
                text: `Attendance Pie Chart's ${modeDashboard.name}`
            }
        },
    });
</script>

<svelte:head>
    <title>Dashboard</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-6 h-full">    
    <div class="flex flex-1 flex-col border-[var(--color-bgside)] border-[2px] rounded-lg p-3 gap-3">
        {#if userProfile.user_hrd || userProfile.level > 1}
            {#await getUser(modeDashboard.dept)}
                <MyLoading message="Loading user data"/>
            {:then val}
                <div class="flex flex-col gap-2">
                    <Svelecte class='border-none' optionClass='p-2' name='payroll' required searchable selectOnTab multiple={false} bind:value={modeDashboard.payroll} 
                        options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " - " + v.name, nama: v.name}))}
                        onChange={(e: any) => {
                            modeDashboard.name = e.nama
                        }}/>
                </div>
            {/await}
        {/if}
        <div class='flex justify-between border border-bgside p-2 rounded-lg'>
            <div class="flex items-center gap-2">
                <CircleUserRound size={15}/>
                <Badge class='py-2'>{modeDashboard.name}</Badge>
            </div>
            <div class="flex items-center gap-2">
                <CalendarArrowDown size={15}/>
                <Badge color='dark' class='py-2'>{periode.start}</Badge>
                <CalendarArrowUp size={15}/>
                <Badge color='dark' class='py-2'>{periode.end}</Badge>
            </div>
        </div>
        {#await getReportAttendance() }
            <MyLoading message={`Loading ${modeDashboard.name} chart`}/>
        {:then dataReport}
        <div class="flex gap-3">
            <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                <MyChart chartData={dataReport} chartOptions={chartOptionsBar} type={"bar"} chartClass='max-h-[20rem]' />
            </div>
            <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                <MyChart chartData={dataReport} chartOptions={chartOptionsPie} type='pie' chartClass='max-h-[20rem]' />
            </div>
        </div>

        {/await}
    </div>
    <!-- <div class="flex flex-1 flex-col border-[var(--color-bgside)] border-[2px] rounded-lg p-4 gap-2">
        {#if userProfile.user_hrd || userProfile.level > 1}
            {#await getUser(modeDashboard.dept)}
                <MyLoading message={`Loading ${modeDashboard.name} chart`}/>
            {:then val}
                <div class="flex flex-col">
                    <Svelecte class='border-none' optionClass='p-2' name='payroll' required searchable selectOnTab multiple={false} bind:value={modeDashboard.payroll} 
                        options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " - " + v.name, nama: v.name}))}
                        onChange={(e: any) => {
                            modeDashboard.name = e.nama
                        }}/>
                </div>
            {/await}
        {/if}
        {#await getReportAttendance() }
            <MyLoading message={`Loading ${modeDashboard.name} chart`}/>
        {:then dataReport}
            
        {/await}
    </div> -->

    <div class="flex min-h-[85vh]">
        <MyCalendar payroll={user?.payroll}/>
    </div>
</main>