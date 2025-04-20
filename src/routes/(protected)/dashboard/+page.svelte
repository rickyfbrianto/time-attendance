<script lang="ts">
    import { fade } from 'svelte/transition'
    import { Button, Chart, Dropdown, DropdownItem } from 'flowbite-svelte';
    import { Select, Label } from 'flowbite-svelte';
    import DonutChart from '@lib/components/DonutChart.svelte'
    // import daygridPlugin from '@fullcalendar/daygrid';
    import '@event-calendar/core/index.css';
    import Calendar  from '@event-calendar/core';
    import TimeGrid from '@event-calendar/time-grid';
    import listPlugin from '@event-calendar/list';
    import dayGridPlugin from '@event-calendar/day-grid';
    import interactionPlugin from '@event-calendar/interaction'
	import { addDays, getYear } from 'date-fns';
	import MyLoading from '@/MyLoading.svelte';
        
    let selected = $state("")
    
    const data = [
        {name:"year", value:"This Year"},
        {name:"month", value:"This Month"},
        {name:"date", value:"This Date"},
    ]
    
    const dataChart = {
        label:"Days",
        data: [
            {series:2, colors:"#1D2D44", labels:"Perjalanan Dinas"},
            {series:12, colors:"#F7CE5B", labels:"Lembur"},
            {series:0, colors:"#A0B3C1", labels:"Cuti"},
            {series:1, colors:"#E71D36", labels:"Sakit"}
            ]
    }

    let plugins = [TimeGrid, dayGridPlugin, listPlugin, interactionPlugin];
    let opsiCalendar = $state({
        timeZone: 'UTC',
        view: 'dayGridMonth',
        weekNumbers: true,
        nowIndicator:true,
        headerToolbar:{
            start: 'refresh,custom1 prev,today,next', center: 'title', end: 'listMonth,dayGridMonth,timeGridWeek,timeGridDay'
        },
        titleFormat:{
            year: 'numeric', month: 'long', day: 'numeric'
        },
        customButtons:{
            refresh:{
                text: 'Refresh',
                click: ()=> getCalendar('')
            },
            custom1:{
                text: 'Custom',
                click: ()=> {
                    console.log('tes')
                }
            },
        },
        selectable:true,
        events: [],
    });

    const getCalendar = async (v: string) =>{
        const year = getYear(new Date())
        // const month = getMonth(new Date()) + 1
        const month = 12
        const req = await fetch(`/api/data?type=get_calendar&val=${v}&year=${year}&month=${month}`)
        const res = await req.json()
        const temp = res.map((v: any) => ({title: v.description, start: v.date, end: v.date, allDay:true}))
        opsiCalendar.events = temp
        return res
    }
</script>

<svelte:head>
    <title>Dashboard</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    <div class="grid grid-cols-12 auto-cols-max gap-4 rounded-lg">
        <div class="col-start-1 col-end-6 md:col-start-1 md:col-end-4 flex flex-col items-center p-4 gap-4 border-[2px] rounded-[20px]">
            <div class="flex justify-between items-center w-full">
                <span class="font-poppins text-[16px]">Report 1</span>
                <Select color="primary" items={data} underline bind:value={selected} placeholder="Pilih" class="w-[8rem]" />
            </div>

            <DonutChart {dataChart} />
        </div>
        <div class="col-start-1 col-end-13 order-3 md:order-2 md:col-start-4 md:col-end-9 flex items-center p-4 gap-4 border-[2px] rounded-[20px]">
            <span class="font-poppins text-[16px]">Report 2</span>
            
            <Select color="primary" items={data} underline bind:value={selected} placeholder="Pilih" class="w-[5rem]" />
        </div>
        <div class="order-2 md:order-3 col-start-6 col-end-13 md:col-start-9 md:col-end-13 flex items-center p-4 gap-4 border-[2px] rounded-[20px]">
            <span class="font-poppins text-[16px]">Report 3</span>
            
            <Select color="primary" items={data} underline bind:value={selected} placeholder="Pilih" class="w-[5rem]" />
        </div>
    </div>
    <div class="flex flex-col flex-1 gap-2 p-4 border-[var(--color-bgside)] border-[2px] rounded-lg">
        <div class="flex flex-col">
            <span class="text-[1.5rem] font-bold">My Calendar</span>
            <a class="text-[.9rem] text-blue-500 italic underline" href="/attendance">Click me to attendance</a>
        </div>
        {#await getCalendar('')}
            <MyLoading message="Loading calendar data"/>
        {:then val}
            <Calendar {plugins} options={opsiCalendar} />
        {/await}
    </div>
    {#snippet head(d:string)}
        <div class="flex bg-red-400 p-4">
            <span>Hallo {d}</span>        
        </div>
    {/snippet}
</main>