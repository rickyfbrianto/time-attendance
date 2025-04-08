<script lang="ts">
    import { fade } from 'svelte/transition'
    import { Button, Chart, Dropdown, DropdownItem } from 'flowbite-svelte';
    import { Select, Label } from 'flowbite-svelte';
    import DonutChart from '@lib/components/DonutChart.svelte'
    // import { Calendar } from '@fullcalendar/core';
    
    let selected = ""
    
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
</script>

<svelte:head>
    <title>Dashboard</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    <div class="grid grid-cols-12 auto-cols-max gap-4">
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
    <div class="flex">
        <span>Tes</span>
        <div id="mycalendar" class="flex">

        </div>
    </div>
    {#snippet head(d:string)}
        <div class="flex bg-red-400 p-4">
            <span>Hallo {d}</span>        
        </div>
    {/snippet}
</main>