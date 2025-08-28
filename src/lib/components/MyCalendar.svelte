<script lang='ts'>
    import Calendar  from '@event-calendar/core';
    import TimeGrid from '@event-calendar/time-grid';
    import listPlugin from '@event-calendar/list';
    import dayGridPlugin from '@event-calendar/day-grid';
	import { getYear } from 'date-fns';
	import MyLoading from '@/MyLoading.svelte';
    import {capitalEachWord, getColorCalendar} from "$/lib/utils";
    
    let {payroll, name} = $props()
    
    let calendarEl = $state()
    
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
        locale: "id",
        titleFormat:{
            day: 'numeric', month: 'long', year: 'numeric',
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

        const reqAttendance = await fetch(`/api/data?type=get_attendance_by_payroll&val=${payroll}&year=${year}&month=${month}`)
        const resAttendance = await reqAttendance.json() as any[]
        const temp = resAttendance.map((v: any) => {
            const backgroundColor = getColorCalendar(v.type)
            return {title: v.type, start: v.check_in, end: v.check_in, allDay:true, backgroundColor, startEditable: true}
        })
        
        opsiCalendar.events = [...temp]
    }
</script>

<div class="flex flex-col flex-1 gap-2 p-4 border-[var(--color-bgside)] border-[1px] rounded-lg">
    <span class="text-[1.5rem] font-bold">Kalender {capitalEachWord(name)}</span>
    {#await getCalendar('')}
        <MyLoading message="Loading calendar data"/>
    {:then val}
        <Calendar bind:this={calendarEl} {plugins} options={opsiCalendar} />
    {/await}
</div>