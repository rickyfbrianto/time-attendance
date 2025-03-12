<script lang="ts">
    import { fade, slide } from 'svelte/transition'
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch, Button, Modal, Label, Input, ImagePlaceholder, Tabs, TabItem } from 'flowbite-svelte';
    import {Calendar, SquareArrowUpRight, SquareArrowDownRight, ShieldUser, GalleryHorizontalEnd, TicketsPlane, Hourglass, Plane, LayoutDashboard} from 'lucide-svelte'
    import {dataSample} from '@lib/store/appstore'

    const headerData = [
        {type:"total", title:"Total Att", value:18, icon: SquareArrowUpRight, link:""},
        {type:"overtime", title:"Overtime", value: 2, icon: SquareArrowDownRight, link:""},
        {type:"late", title:"Late", value: 1, icon: SquareArrowUpRight, link:""},
        {type:"dinas", title:"Perjalanan Dinas", value: 1, icon: TicketsPlane, link:""},
        {type:"absen", title:"Absen", value: 3, icon: SquareArrowDownRight, link:""},
        {type:"annual_leave", title:"Annual Leave", value: 0, icon: SquareArrowDownRight, link:""},
    ]
</script>

<svelte:head>
    <title>Attendance</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-4 gap-4">
    <div class="flex flex-wrap justify-between bg-white rounded-lg p-4 gap-4 border border-slate-200">
        <div class="flex items-center gap-2">
            <Calendar size={24}/>
            <div class="flex flex-col">
                <span class="font-bold">Today</span>
                <span>1 Maret 2025</span>
            </div>
        </div>
        <div class="flex flex-wrap items-center gap-4 ">
            {#each headerData as {type, title, value, icon, link}}
                <a href={link} class="border border-slate-200 px-4 py-2 rounded-lg min-w-[8rem] md:min-w-[12rem] overflow-hidden overflow-ellipsis whitespace-nowrap">
                    <span class="text-[.9rem] font-semibold font-light">{title}</span>
                    <div class="flex justify-between items-center gap-1">
                        <span class='text-[1.4rem]'>{value}</span>
                        <svelte:component this={icon} size={20} />
                    </div>
                </a>
            {/each}
        </div>
    </div>

    <Tabs>
        <TabItem open title="Dashboard">
            <div class="flex flex-col gap-4">
                <span>Dashboard Page</span>
            </div>
        </TabItem>
        <TabItem title="Attendance">
            <div class="flex flex-col gap-4">
                <span>Dashboard Page</span>
            </div>
        </TabItem>
        <TabItem title="Attendance Log">
            <div class="flex flex-col gap-4">
                <Table class="bg-black" hoverable={true}>
                    <TableHead class="bg-slate-200" >
                        <TableHeadCell>Product name</TableHeadCell>
                        <TableHeadCell defaultSort sort={(a:{maker:string}, b:{maker:string}) => a.maker.localeCompare(b.maker)}>Color</TableHeadCell>
                        <TableHeadCell>Category</TableHeadCell>
                        <TableHeadCell sort={(a:{id:number}, b:{id:number}) => a.id - b.id}>Price</TableHeadCell>
                    </TableHead>
                    <TableBody tableBodyClass="divide-y">
                        {#each $dataSample as item, i}
                            <TableBodyRow>
                                <TableBodyCell>{item.id}</TableBodyCell>
                                <TableBodyCell>{item.maker}</TableBodyCell>
                                <TableBodyCell>{item.type}</TableBodyCell>
                                <TableBodyCell>{item.make}</TableBodyCell>
                            </TableBodyRow>
                        {/each}
                    </TableBody>
                </Table>
            </div>
        </TabItem>
    </Tabs>
    <div class="flex flex-col bg-white rounded-lg p-4">
        
    </div>
</main>