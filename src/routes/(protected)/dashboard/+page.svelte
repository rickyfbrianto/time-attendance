<script lang="ts">
    import { fade } from 'svelte/transition'
    import { Button, Chart, Dropdown, DropdownItem } from 'flowbite-svelte';
    import { Select, Label } from 'flowbite-svelte';
    import DonutChart from '@lib/components/DonutChart.svelte'
	import MyCalendar from '@/MyCalendar.svelte';

    let {data} = $props()
    let user = $derived(data.user)
    
    let selected = $state("")
    
    const filterDate = [
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

    
</script>

<svelte:head>
    <title>Dashboard</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-6 h-full">
    <div class="flex gap-4 rounded-lg">
        <div class="flex flex-1 flex-col border-[var(--color-bgside)] border-[2px] rounded-lg p-4">
            <div class="flex justify-between items-center w-full">
                <span class="font-poppins text-[16px]">Report 1</span>
                <Select color="primary" items={filterDate} underline bind:value={selected} placeholder="Pilih" class="w-[8rem]" />
            </div>

            <DonutChart {dataChart} />
        </div>
        <div class="flex flex-1 flex-col border-[var(--color-bgside)] border-[2px] rounded-lg p-4">
            <div class="flex justify-between items-center w-full">
                <span class="font-poppins text-[16px]">Report 2</span>
                <Select color="primary" items={filterDate} underline bind:value={selected} placeholder="Pilih" class="w-[8rem]" />
            </div>

            <DonutChart {dataChart} />
        </div>
        <div class="flex flex-1 flex-col border-[var(--color-bgside)] border-[2px] rounded-lg p-4">
            <div class="flex justify-between items-center w-full">
                <span class="font-poppins text-[16px]">Report 3</span>
                <Select color="primary" items={filterDate} underline bind:value={selected} placeholder="Pilih" class="w-[8rem]" />
            </div>

            <DonutChart {dataChart} />
        </div>
    </div>

    <div class="flex min-h-[85vh]">
        <MyCalendar payroll={user?.payroll}/>
    </div>
</main>