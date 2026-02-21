<script lang='ts'>
    import Calendar from '@event-calendar/core';
    import TimeGrid from '@event-calendar/time-grid';
    import listPlugin from '@event-calendar/list';
    import dayGridPlugin from '@event-calendar/day-grid';
    import interactionPlugin from '@event-calendar/interaction';
    import '@event-calendar/core/index.css';
    import { Label, Modal } from 'flowbite-svelte';
	import { fade, fly } from 'svelte/transition';
    import MyDatePicker from '@/MyDatePicker.svelte';
    import MyButton from '@/MyButton.svelte';
    import MyLoading from '@/MyLoading.svelte';
    import MyAlert from '@/MyAlert.svelte';
    import Svelecte from 'svelecte';
    import { Save, Ban, CalendarCheck } from '@lucide/svelte'
	import z from 'zod';
	import axios from 'axios';
	import { fromZodError } from 'zod-validation-error';
	import { getYear, addHours, addDays } from 'date-fns';
	import { formatDateToSQLString, formatTanggal, getColorCalendar, capitalEachWord } from '@lib/utils';
	import { base } from '$app/paths';

    let {data} = $props()
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)
    let setting = $derived(data.periode)
    let isUserAllowed = $derived(setting?.approval_lembur_security == user?.payroll)

    let plugins = $derived.by(()=> 
        [TimeGrid, dayGridPlugin, listPlugin, interactionPlugin]
            .filter(v => isUserAllowed ? v : v != interactionPlugin)
    )

    const formSecurityState = {
        answer: {
            id: "id",
            payroll: "",
            date: [""],
            shift: "",
            area: "",
        },
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        payroll: "",
        add: true, 
        area: "",
        success:"",
        error:"",
        loading: false,
        modal: false,
    }

    let formSecurity = $state({...formSecurityState})

    const modeSecurity = $state({
        year: formSecurity.year,
        month: formSecurity.month
    })
    
    let calendarEl = $state({
        timeZone: 'UTC',
        view: 'dayGridMonth',
        firstDay: 1, 
        weekNumbers: true,
        weekNumberFormat: { week: 'numeric' },
        nowIndicator: true,
        datesSet: function(info) {
            modeSecurity.month = info.view.currentStart.getMonth() + 1
            modeSecurity.year = info.view.currentStart.getFullYear()
            getReportSecurity()
        },
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
                click: ()=> getReportSecurity()
            },
        },
        eventDidMount: ({ event, el }) => {
            el.addEventListener('dblclick', async () => {
                if(!isUserAllowed) return
                const req = await axios.get(`${base}/api/security/schedule/${event.id}`)
                const res = await req.data
                formSecurity.add = false
                formSecurity.answer.id = res.id
                formSecurity.answer.area = res.area
                formSecurity.answer.payroll = res.payroll
                formSecurity.answer.shift = res.shift
                formSecurity.answer.date = formatTanggal(res.date)
            });
        },
        eventDrop: async (info) => {
            try{
                if(!isUserAllowed) return
                formSecurity.error = ""
                formSecurity.success = ""
                formSecurity.answer.id = info.event.id
                formSecurity.loading = true
                formSecurity.answer.date = [formatDateToSQLString(info.event.start)]
                const req = await axios.post(`${base}/api/security/schedule/updatedate`, {
                    id: formSecurity.answer.id,
                    date: formSecurity.answer.date,
                    payroll: info.event.extendedProps.payroll,
                    name: info.event.extendedProps.name,
                    shift: info.event.extendedProps.shift,
                })
                const res = await req.data
                handleCancel()
                getReportSecurity()
                formSecurity.error = ""
                formSecurity.success = res.message
                formSecurity.loading = false
            } catch (error: any) {
                formSecurity.error = error.response.data.message
                formSecurity.success = ""
                info.revert()
            } finally {
                formSecurity.loading = false
            }
        },
        events: [{}],
    });

    const areaList = [
        {value:"", text: "Semua Area"},
        {value:"Gandaria", text: "Gandaria"},
        {value:"Narogong", text: "Narogong"},
        {value:"Kemang", text: "Kemang"}
    ]
    
    const handleCancel = () => {
        formSecurity.answer = {...formSecurityState.answer}
        formSecurity.add = true
    }
    
    const handleSubmit = async () => {
        try {            
            formSecurity.loading = true            
            const valid = z.object({
                id: z.string().trim().min(1),
                payroll: z.string().trim().min(6),
                date: z.union([z.array(z.string().trim().min(10)), z.string().min(10)]) ,
                shift: z.string().trim().min(3),
                area: z.string()
            })

            const isValid = valid.safeParse(formSecurity.answer)
            if(isValid.success){
                const req = await axios.post(`${base}/api/security/schedule`, formSecurity.answer)
                const res = await req.data
                handleCancel()
                getReportSecurity()
                formSecurity.error = ""
                formSecurity.success = res.message
            }else{
                const err = fromZodError(isValid.error)
                formSecurity.success = ""
                formSecurity.error = err.message
            }
        } catch (error: any) {
            formSecurity.error = error.response.data.message
            formSecurity.success = ""
        } finally {
            formSecurity.loading = false
        }
    }

    const getUser = async () =>{
        const req = await fetch(`${base}/api/data?type=user_by_user_type&val=security`)
        return await req.json()
    }

    const getReportSecurity = async () =>{        
        const reqSchedule = await fetch(`${base}/api/security/schedule?payroll=${formSecurity.payroll}&area=${formSecurity.area}&year=${modeSecurity.year}&month=${modeSecurity.month}`)
        const resSchedule = await reqSchedule.json() as any[]        
        const tempSchedule = resSchedule.map((value: any) => {
            const {name, shift, date, id, payroll, area} = value
            const shiftPagi = [formatTanggal(addHours(date, 8)), formatTanggal(addHours(date, 20))]
            const shiftMalam = [formatTanggal(addHours(date, 20)), formatTanggal(addHours(date, 24))]
            const shiftOff = [formatTanggal(date), formatTanggal(date)]
            const [startDate, endDate] = shift.toLowerCase() == 'pagi' ? shiftPagi : (shift.toLowerCase() == 'malam' ? shiftMalam : shiftOff)
            return {
                id, title: name, start: formatTanggal(startDate), end: formatTanggal(endDate), backgroundColor: getColorCalendar(shift), 
                allDay: shift.toLowerCase() == 'off', type: "calendar", payroll, name, shift, area
            }
        })

        calendarEl.events = [...tempSchedule.map(v => {
            return {
                id: v.id, title: `(${v.area[0]}) ${capitalEachWord(v.title)}`, start: v.start, end: v.end, backgroundColor: v.backgroundColor, 
                editable: false,
                allDay: v.allDay, startEditable: true, extendedProps: {
                    payroll: v.payroll,
                    shift: v.shift,
                    name: v.name
                }
            }
        })]
    }

    $effect(()=> {
        setTimeout(async ()=> getReportSecurity(), 2000)
    })
</script>

<svelte:head>
    <title>Security Page</title>
</svelte:head>

<main in:fade={{delay:100}} out:fade class="flex flex-col gap-4 p-4 h-full w-full">
    {#await getUser()}
        <MyLoading message="Loading data"/>
    {:then val}
        <div transition:fly={{y: -250, duration: 1500, delay:1000}} class="flex flex-col p-4 gap-2 rounded-lg bg-gradient-to-r from-neutral-50 to-zinc-100 dark:from-neutral-600 dark:to-zinc-800">
            <span class='text-[1.4rem] font-quicksand'>Security Schedule</span>

            <div transition:fly={{ y: -100, duration: 1250, delay: 750 }} class="flex gap-4 pt-2 border-t border-slate-300">
                <div class="flex flex-col gap-1">
                    <Label>Area</Label>
                    <select value={formSecurity.area} id="" onchange={e => {
                        formSecurity.area = e.target.value
                        getReportSecurity()
                    }}>
                        {#each areaList as {value, text}}
                            <option value={value}>{text}</option>
                        {/each}
                    </select>
                </div>
                
                <div class="flex flex-col gap-1">
                    <Label>Payroll</Label>
                    <Svelecte class='border-none' optionClass='p-2' name='payroll' required searchable selectOnTab multiple={false} bind:value={formSecurity.payroll} 
                        onChange={e => {
                            formSecurity.payroll = e.value
                            getReportSecurity()
                        }}
                        options={[{value:"", text: "Semua Security"}, ...val.map((v) => ({value: v.payroll, text:capitalEachWord(v.payroll + " - " + v.name)}))] }/>
                </div>
                <span class='self-end italic text-[0.75rem]'>G = Gandaria, N = Narogong, K = Kemang</span>
            </div>
        </div>
    
        {#if formSecurity.error || formSecurity.success}
            <div class="flex flex-col gap-2 px-3">
                {#if formSecurity.error}
                    {#each formSecurity.error.split(';') as v}
                        <MyAlert color='red' pesan={v} func={()=> formSecurity.error = ""}/>
                    {/each}
                {:else if formSecurity.success}
                    <MyAlert pesan={formSecurity.success} func={()=> formSecurity.success = ""}/>
                {/if}
            </div>
        {/if}
        
        <div transition:fly={{ y: 100, duration: 1500, delay: 1250 }} class="flex flex-col flex-1 gap-4">        
            <div class="flex gap-4 flex-1">
                {#if isUserAllowed}
                    <div class="flex flex-col self-start border border-slate-200 rounded-lg w-[22rem] order-2 shadow-lg">
                        <div class={`flex ${formSecurity.add ? "bg-bgactive":"bg-bgside"} p-3 rounded-t-lg`}>
                            <span class='text-[1rem] flex items-center gap-2'><CalendarCheck size={16} />{formSecurity.add ? "Tambah Schedule" : "Ubah schedule"}</span>
                        </div>
                        
                        <form class='flex flex-col p-3 gap-2 font-quicksand'>
                            <div class="flex flex-col gap-2 flex-1">
                                <Label>Payroll</Label>
                                <Svelecte class='border-none' optionClass='p-2' name='payroll' searchable selectOnTab multiple={false} bind:value={formSecurity.answer.payroll} 
                                    onChange={e => formSecurity.answer.payroll = e.value}
                                    options={val.map((v) => ({value: v.payroll, text: capitalEachWord(v.payroll + " - " + v.name)}))}/>
                            </div>

                            <div class="flex flex-col gap-2 flex-1">
                                <Label>Date</Label>
                                <MyDatePicker bind:value={formSecurity.answer.date} mode={`${formSecurity.add ? "multiple" : "single"}`}/>
                                <!-- <MyDatePicker bind:value={formSecurity.answer.date} mode={`multiple`}/> -->
                                <!-- <MyDatePicker bind:value={formSecurity.answer.tes} mode='multiple'/> -->
                            </div>
                            
                            <div class="flex flex-col gap-2 flex-1">
                                <Label>Shift</Label>
                                <Svelecte class='border-none' optionClass='p-2' name='shift' searchable selectOnTab multiple={false} bind:value={formSecurity.answer.shift} 
                                onChange={({value}: {value: string}) => formSecurity.answer.shift = value}
                                options={["Pagi","Malam","Off"].map((v) => ({value: v, text: v}))}/>
                            </div>

                            <div class="flex flex-col gap-2 flex-1">
                                <Label>Area</Label>
                                <Svelecte class='border-none' optionClass='p-2' name='area' searchable selectOnTab multiple={false} bind:value={formSecurity.answer.area} 
                                onChange={({value}: {value: string}) => formSecurity.answer.area = value}
                                options={["Gandaria","Narogong","Kemang"].map((v) => ({value: v, text: v}))}/>
                            </div>
                        </form>

                        <div class="flex flex-col px-3 pb-3">
                            <span class='italic text-[0.75rem]'>*Double click untuk edit schedule</span>
                            <span class='italic text-[0.75rem]'>*Tarik dan lepas untuk ganti tanggal dengan cepat</span>
                        </div>

                        <div class={`flex gap-2 p-3 ${formSecurity.add ? "bg-bgactive":"bg-bgside"}`}>
                            <MyButton type='button' className='flex items-center gap-2 self-start' onclick={handleCancel}>
                                <Ban size={12}/>
                            </MyButton>
                            <MyButton type='submit' className='flex items-center gap-2 self-start' onclick={handleSubmit}>
                                <Save size={12}/>
                            </MyButton>
                        </div>
                    </div>
                {/if}
                <div class="flex flex-col gap-2 w-full min-h-[70vh]">
                    <Calendar {plugins} options={calendarEl}/>
                </div>
            </div>

            <Modal class='bg-bgdark' title="Logout" size="sm" bind:open={formSecurity.modal}>
                <div class="flex flex-col flex-1 border border-slate-200 rounded-lg w-full order-2 shadow-lg">
                    <div class="flex bg-bgactive p-3 rounded-t-lg">
                        <span class='text-[1rem]'>Security Schedule</span>
                    </div>
                    
                    <form class='flex flex-col p-3 gap-2 '>
                        <div class="flex flex-col gap-2 flex-1">
                            <Label>Payroll</Label>
                            <Svelecte class='border-none' optionClass='p-2' name='payroll' required searchable selectOnTab multiple={false} bind:value={formSecurity.answer.payroll} 
                                onChange={e => formSecurity.answer.payroll = e.value}
                                options={val.map((v) => ({value: v.payroll, text:v.payroll + " - " + v.name}))}/>
                        </div>

                        <div class="flex flex-col gap-2 flex-1">
                            <Label>Date</Label>
                            <MyDatePicker bind:value={formSecurity.answer.date} mode='multiple'/>
                        </div>
                        
                        <div class="flex flex-col gap-2 flex-1">
                            <Label>Shift</Label>
                            <Svelecte class='border-none' optionClass='p-2' name='shift' required searchable selectOnTab multiple={false} bind:value={formSecurity.answer.shift} 
                            onChange={({value}: {value: string}) => formSecurity.answer.shift = value}
                            options={["Pagi","Malam","Off"].map((v) => ({value: v, text: v}))}/>
                        </div>

                        <div class="flex flex-col gap-2 flex-1">
                            <Label>Area</Label>
                            <Svelecte class='border-none' optionClass='p-2' name='area' required searchable selectOnTab multiple={false} bind:value={formSecurity.answer.area} 
                            onChange={({value}: {value: string}) => formSecurity.answer.area = value}
                            options={["Gandaria","Narogong","Kemang"].map((v) => ({value: v, text: v}))}/>
                        </div>

                        <MyButton className='flex items-center gap-2 self-start' onclick={handleSubmit}>
                            <Save size={14}/>
                        </MyButton>
                    </form>
                </div>
            </Modal>
        </div>
    {/await}
</main>