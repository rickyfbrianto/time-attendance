<script lang="ts">
    import { fade, fly } from 'svelte/transition'
    import { Badge, Alert } from 'flowbite-svelte';
    import { generatePeriode, capitalEachWord } from '$/lib/utils.js';
	import MyCalendar from '@/MyCalendar.svelte';
	import MyLoading from '@/MyLoading.svelte';
	import Svelecte from 'svelecte';
	import MyChart from '@/MyChart.svelte';
	import { CalendarArrowDown, CalendarArrowUp, CircleUserRound, Bell } from '@lucide/svelte';

    let {data} = $props()
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)
    let setting = $derived(data.periode)
    let periode = $derived(generatePeriode(new Date().toString(), Number(setting?.start_periode), Number(setting?.end_periode)))

    let modeDashboard = $state({
        dept: (()=> user.user_type == 'HR' ? "" : user?.department)(),
        payroll: (()=> user?.payroll)(),
        name: (()=> user?.name)(),
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

<main in:fade={{delay:100}} out:fade class="flex flex-col p-4 gap-5 h-full bg-gradient-to-lr from:slate-200 to-teal-100 overflow-auto" style="scrollbar-width: none;">
    <div transition:fly={{y: -250, duration: 1500, delay:1000}} class="flex flex-col px-5 py-6 rounded-lg bg-gradient-to-r from-neutral-50 to-zinc-100 dark:from-neutral-600 dark:to-zinc-800 shadow-lg">
        <span class='text-[1.5rem] font-quicksand'>Hello, <span class='font-bold'>{capitalEachWord(user.name)}</span></span>
        <Badge class='pb-1 font-bold self-start bg-merah text-white'>{user.email}</Badge>
        <div class="flex gap-4">
            <div class="flex flex-col flex-1 items-start mt-4">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white tracking-wide font-quicksand">Welcome to Time Attendance</h5>
            </div>
        </div>
    </div>

    <div class="flex gap-5 min-h-[65vh] h-[65vh]">
        <div transition:fly={{ y: 50, duration: 1500, delay: 1250 }} class="flex flex-1">
            <MyCalendar payroll={user?.payroll}/>
        </div>
        <!-- <div transition:fly={{ y: 50, duration: 1500, delay: 1500 }} class="flex flex-col w-[24rem] bg-slate-50 dark:bg-neutral-700 p-2 rounded-lg shadow-md">
            <div class="flex items-center p-2 gap-2">
                <Bell size={16}/>
                <span class='text-[.8rem] italic font-bold'>Notifikasi</span>
            </div>
            <div class="grid grid-cols-2 overflow-auto gap-2 mt-2">
                {#each Array.from({length: 5}, (_, x) => x) as x}
                    <Alert color={'red'} class='flex items-center justify-between'>
                        <span class="italic font-bold">Data {x+1}</span>
                    </Alert>
                {/each}
            </div>
        </div> -->
    </div>   
    
    <div transition:fly={{ x: -250, duration: 1500, delay: 1750 }} class="flex flex-1 flex-col gap-5">
        <div class='flex flex-1 justify-between border border-bgside p-4 rounded-lg'>
            {#if user.user_type == 'HR' || user.level > 1}
                <div class="flex gap-4">
                    {#await getUser(modeDashboard.dept)}
                        <MyLoading message="Loading user data"/>
                    {:then val}
                        <div class="flex">
                            <Svelecte class='border-none' optionClass='p-2' name='payroll' required searchable selectOnTab multiple={false} bind:value={modeDashboard.payroll} 
                            options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " - " + v.name, nama: v.name}))}
                            onChange={(e: any) => modeDashboard.name = e.nama}/>
                        </div>
                    {/await}
                    <div class="flex items-center gap-2">
                        <CircleUserRound size={15}/>
                        <Badge class='py-2'>{modeDashboard.name}</Badge>
                    </div>
                </div>
            {/if}
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
            <div class="grid grid-cols-2 gap-5">
                <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                    <MyChart chartData={dataReport} chartOptions={chartOptionsBar} type={"bar"} chartClass='max-h-[24rem]' />
                </div>
                <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                    <MyChart chartData={dataReport} chartOptions={chartOptionsPie} type='pie' chartClass='max-h-[24rem]' />
                </div>
            </div>
        {/await}
    </div>
    
    <!-- <div class="flex min-h-[85vh]" id="calendar">
        <MyCalendar payroll={user?.payroll}/>
    </div> -->
</main>