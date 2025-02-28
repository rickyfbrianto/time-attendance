<script>
    import { fade } from 'svelte/transition'
    import {Calendar, SquareArrowUpRight, SquareArrowDownRight} from 'lucide-svelte'
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch, Button, Modal, Label, Input } from 'flowbite-svelte';
    
    const headerData = [
        {type:"total", title:"Total Att", value:18, icon: SquareArrowUpRight, link:""},
        {type:"overtime", title:"Overtime", value: 2, icon: SquareArrowDownRight, link:""},
        {type:"late", title:"Late", value: 1, icon: SquareArrowUpRight, link:""},
        {type:"dinas", title:"Perjalanan Dinas", value: 1, icon: SquareArrowDownRight, link:""},
        {type:"absen", title:"Absen", value: 3, icon: SquareArrowDownRight, link:""},
        {type:"annual_leave", title:"Annual Leave", value: 0, icon: SquareArrowDownRight, link:""},
    ]

    let items = [
        { id: 1, maker: 'Toyota', type: 'ABC', make: 2017 },
        { id: 2, maker: 'Ford', type: 'CDE', make: 2018 },
        { id: 3, maker: 'Volvo', type: 'FGH', make: 2019 },
        { id: 4, maker: 'Saab', type: 'IJK', make: 2020 }
    ];

    let modalTambah = $state(false)

    const formStatic = [
        {type:"text", name:"nama", title:"Nama"},
        {type:"date", name:"status", title:"Status", placeholder:"Masukkan Tanggal"},
        {type:"text", name:"payrol", title:"Payrol", placeholder:"Payrol"},
    ]

    const formState = $state({
        answer: {},
        error:""
    })
</script>

<div in:fade={{delay:500}} out:fade class="flex flex-col gap-4">    
    <div class="flex flex-wrap justify-between bg-white rounded-lg p-4 gap-4">
        <div class="flex items-center gap-2">
            <Calendar size={24}/>
            <div class="flex flex-col">
                <span class="font-bold">Today</span>
                <span>1 Maret 2025</span>
            </div>
        </div>
        <div class="flex flex-wrap items-center gap-4 ">
            {#each headerData as {type, title, value, icon, link}}
                <a href={link} class="border border-slate-300 px-4 py-2 rounded-lg min-w-[6rem] md:min-w-[10rem]">
                    <span class="text-[18px] font-light">{title}</span>
                    <div class="flex justify-between items-center gap-1">
                        <span class='text-[24px]'>{value}</span>
                        <svelte:component this={icon} size="24" />
                    </div>
                </a>
            {/each}
        </div>
    </div>

    <div class="flex flex-col bg-white rounded-lg p-4">
        <Button class="self-start" on:click={() => (modalTambah = true)}>Tambah</Button>
        <Modal title="Terms of Service" bind:open={modalTambah} autoclose outsideclose size="xl">
            <form action="" class="flex gap-4">                
                {#each formStatic as {name, title, placeholder, type}}
                    <div class="flex flex-col gap-2 flex-1/2">
                        <Label>{title}</Label>
                        <input id={name} {name} {type} {placeholder} bind:value={formState.answer[name]}
                        class="p-2 rounded-lg outline-none border-slate-200"/>
                    </div>
                {/each}
            </form>
        </Modal>
        
        <Table class="bg-black" {items} placeholder="Search by maker name" hoverable={true} filter={(item, searchTerm) => item.maker.toLowerCase().includes(searchTerm.toLowerCase())}>
            <TableHead class="bg-slate-200">
                <TableHeadCell>Product name</TableHeadCell>
                <TableHeadCell>Color</TableHeadCell>
                <TableHeadCell>Category</TableHeadCell>
                <TableHeadCell>Price</TableHeadCell>
            </TableHead>
            <TableBody tableBodyClass="divide-y">
                <TableBodyRow slot="row" let:item>
                    <TableBodyCell>{item.id}</TableBodyCell>
                    <TableBodyCell>{item.maker}</TableBodyCell>
                    <TableBodyCell>{item.type}</TableBodyCell>
                    <TableBodyCell>{item.make}</TableBodyCell>
                </TableBodyRow>
            </TableBody>
        </Table>
    </div>
</div>