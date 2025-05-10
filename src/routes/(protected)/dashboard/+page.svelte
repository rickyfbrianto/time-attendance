<script lang="ts">
    import { fade } from 'svelte/transition'
        import { Select, Label } from 'flowbite-svelte';
    import { formatTanggal, generatePeriode, namaHari, isLate, getRandomHexColor } from '@lib/utils.js';
    import DonutChart from '@lib/components/DonutChart.svelte'
	import MyCalendar from '@/MyCalendar.svelte';
	import { getYear } from 'date-fns';
	import MyLoading from '@/MyLoading.svelte';
	import Svelecte from 'svelecte';

    let {data} = $props()
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)
    let setting = $derived(data.periode)
    let periode = $derived(generatePeriode(Number(setting?.start_periode), Number(setting?.end_periode)))
    
    let selected = $state("")
    
    const filterDate = [
        {name:"year", value:"This Year"},
        {name:"month", value:"This Month"},
        {name:"date", value:"This Date"},
    ]

    const modeView = {
        get dept() { return userProfile.user_hrd ? "" : user?.department},
        get payroll() { return user?.payroll},
    }

    let modeDashboard = $state({
        dept: modeView.dept,
        payroll: modeView.payroll,
        name: "",
    })
    
    // Fetch
    const getUser = async (val: string = "") =>{
        const req = await fetch(`/api/data?type=user_by_dept&val=${modeDashboard.dept || ""}`)
        return await req.json()
    }

    const getReport = async () =>{
        const req = await fetch(`/api/data?type=get_report_dashboard1&payroll=${modeDashboard.payroll}&start_date=${periode.start}&end_date=${periode.end}`)
        const res = await req.json()

        const data = Object.entries(res).map(([key, value], index) => {
            return {series:value, colors: getRandomHexColor(), labels: key }
        })
        return data
    }
</script>

<svelte:head>
    <title>Dashboard</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-6 h-full">
    <div class="flex gap-4 rounded-lg">
        <div class="flex flex-1 flex-col border-[var(--color-bgside)] border-[2px] rounded-lg p-4">
            {#if userProfile.user_hrd || userProfile.level > 1}
                {#await getUser(modeDashboard.dept)}
                    <MyLoading message="Loading data"/>
                {:then val}
                    <div class="flex flex-col">
                        <Label>User</Label>
                        <Svelecte class='border-none' optionClass='p-2' name='payroll' required searchable selectOnTab multiple={false} bind:value={modeDashboard.payroll} 
                        options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " - " + v.name}))}
                        onChange={() => {}}/>
                    </div>
        
                {/await}
            {/if}
            {#await getReport() }
                <MyLoading message="Loading chart"/>
            {:then dataReport}
                <DonutChart data={dataReport} label='Report TES' />
            {/await}
        </div>
        <div class="flex flex-1 flex-col border-[var(--color-bgside)] border-[2px] rounded-lg p-4">
            <div class="flex justify-between items-center w-full">
                <span class="font-poppins text-[16px]">Report 3</span>
                <Select color="primary" items={filterDate} underline bind:value={selected} placeholder="Pilih" class="w-[8rem]" />
            </div>

            <!-- <DonutChart {dataChart} /> -->
        </div>
    </div>

    <div class="flex min-h-[85vh]">
        <MyCalendar payroll={user?.payroll}/>
    </div>
</main>