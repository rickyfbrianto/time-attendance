<script lang='ts'>
    import Calendar  from '@event-calendar/core';
    import TimeGrid from '@event-calendar/time-grid';
    import listPlugin from '@event-calendar/list';
    import dayGridPlugin from '@event-calendar/day-grid';
    import interactionPlugin from '@event-calendar/interaction'
	import { addDays, getYear } from 'date-fns';
	import MyLoading from '@/MyLoading.svelte';
    
    let plugins = [TimeGrid, dayGridPlugin, listPlugin, interactionPlugin];
    let opsiCalendar = $state({
        timeZone: 'UTC',
        view: 'dayGridMonth',
        firstDay: 1, 
        weekNumbers: true,
        weekNumberFormat: { week: 'numeric' },
        nowIndicator: true,
        headerToolbar:{
            start: 'refresh prev,today,next', center: 'title', end: 'listMonth,dayGridMonth,timeGridWeek,timeGridDay'
        },
        titleFormat:{
            year: 'numeric', month: 'long', day: 'numeric'
        },
        customButtons:{
            refresh:{
                text: 'Refresh',
                click: ()=> getCalendar('')
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

<main>
    <div class="flex flex-col flex-1 gap-2 p-4 border-[var(--color-bgside)] border-[2px] rounded-lg">
        <span class="text-[1.5rem] font-bold">Calendar</span>
        {#await getCalendar('')}
            <MyLoading message="Loading calendar data"/>
        {:then val}
            <Calendar {plugins} options={opsiCalendar} />
        {/await}
    </div>
</main>