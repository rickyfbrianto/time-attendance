<script lang='ts'>
    import Calendar  from '@event-calendar/core';
    import TimeGrid from '@event-calendar/time-grid';
    import listPlugin from '@event-calendar/list';
    import dayGridPlugin from '@event-calendar/day-grid';
    // import interactionPlugin from '@event-calendar/interaction'
	import { getYear } from 'date-fns';
	import MyLoading from '@/MyLoading.svelte';
    import {getColorCalendar} from "$/lib/utils";
    
    let {payroll} = $props()
    
    let plugins = [TimeGrid, dayGridPlugin, listPlugin];
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
        events: [],
    });

    const getCalendar = async (v: string) =>{
        const year = getYear(new Date())
        // const month = getMonth(new Date()) + 1
        const month = 12
        const reqCalendar = await fetch(`/api/data?type=get_calendar&val=${v}&year=${year}&month=${month}`)
        const resCalendar = await reqCalendar.json() as any[]
        const temp = resCalendar.map((v: any) => ({title: v.description, start: v.date, end: v.date, allDay:true, backgroundColor:"#B0413E"}))

        const reqAttendance = await fetch(`/api/data?type=get_attendance_by_payroll&val=${payroll}&year=${year}&month=${month}`)
        const resAttendance = await reqAttendance.json() as any[]
        const temp2 = resAttendance.map((v: any) => {
            const backgroundColor = getColorCalendar(v.type)
            return {title: v.type, start: v.check_in, end: v.check_in, allDay:true, backgroundColor, startEditable: true}
        })

        opsiCalendar.events = [...temp, ...temp2]
    }
</script>

<div class="flex flex-col flex-1 gap-2 p-4 border-[var(--color-bgside)] border-[2px] rounded-lg">
    <span class="text-[1.5rem] font-bold">Calendar {payroll}</span>
    {#await getCalendar('')}
        <MyLoading message="Loading calendar data"/>
    {:then val}
        <Calendar {plugins} options={opsiCalendar} />
    {/await}
</div>