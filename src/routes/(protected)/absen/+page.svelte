<script lang="ts">
    import { fade, slide } from 'svelte/transition'
    import { Tabs, TabItem } from 'flowbite-svelte';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch, Button, Modal, Label, Input, ImagePlaceholder } from 'flowbite-svelte';
    import {dataSample} from '@lib/store/appstore'

    let modalTambah = $state(false)
    
    const formStatic = [
        {type:"text", name:"nama", title:"Nama"},
        {type:"date", name:"status", title:"Status", placeholder:"Masukkan Tanggal"},
        {type:"text", name:"payrol", title:"Payrol", placeholder:"Payrol"},
    ]

    let {data} = $props()
    console.log(data.data)

    const formState = $state({
        answer: {},
        error:""
    })

    let openRow: number[] = $state([]) 
    const toggleRow = (i: number) => {
        if(openRow.includes(i)){
            openRow = openRow.filter((item) => item !== i)
        } else {
            openRow.push(i)
        }
    }

    let getAbsen = $state(async () =>{
        const req = await fetch(`/api/absen`)
        const res = await req.json()
        return res
    })
    let allAbsen = $derived(getAbsen())
    
    let id = $state(1)
    const getAbsenById = $state(async (id:number) =>{
        const req = await fetch(`/api/absen/${id}`)
        const res = await req.json()
        return res
    })

    const formSubmit = (e:SubmitEvent) =>{
        e.preventDefault()
        
    }
</script>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-4">    
    <Tabs>
        <TabItem open title="My Absent">
            <div class="flex gap-2">
                <Button onclick={()=> getAbsen()}>Refresh Table</Button>
                <Button onclick={() => (modalTambah = true)}>Tambah</Button>
            </div>
            <Table class="bg-black" hoverable={true} filter={(item:string, searchTerm:string) => item.title.toLowerCase().includes(searchTerm.toLowerCase())}>
                <caption class="text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                    <p class="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">Browse a list of Flowbite products designed to help you work and play, stay organized, get answers, keep in touch, grow your business, and more.</p>
                </caption>
                <TableHead class="bg-slate-200" >
                    <TableHeadCell>User ID</TableHeadCell>
                    <TableHeadCell defaultSort sort={(a:{maker:string}, b:{maker:string}) => a.maker.localeCompare(b.maker)}>ID</TableHeadCell>
                    <TableHeadCell>Title</TableHeadCell>
                    <TableHeadCell sort={(a:{id:number}, b:{id:number}) => a.id - b.id}>Completed</TableHeadCell>
                </TableHead>

                {#await allAbsen}
                    <TableBody tableBodyClass="divide-y">
                        <TableBodyRow>
                            <TableBodyCell colspan={4}>Loading data</TableBodyCell>
                        </TableBodyRow>
                    </TableBody>
                {:then val}
                    <TableBody tableBodyClass="divide-y">
                        {#each val as item, i}
                            <TableBodyRow onclick={() => toggleRow(i)}>
                                {#each Object.entries(item) as [key, value]}
                                    <TableBodyCell>{value}</TableBodyCell>
                                {/each}
                            </TableBodyRow>
                            {#if openRow.includes(i)}
                                <TableBodyRow>
                                    <TableBodyCell colspan={Object.keys(item).length}>
                                        <div class="flex">
                                            {#await getAbsenById(item['id'])}
                                            <span>Loading data...</span>
                                            {:then val}
                                            <span>{val.title}</span>                                                
                                            {/await}
                                        </div>
                                    </TableBodyCell>
                                </TableBodyRow>
                            {/if}
                        {/each}
                    </TableBody>
                {/await}
            </Table>
        </TabItem>
        <TabItem title="Departement">
            <Table class="bg-black" hoverable={true} filter={(item:string, searchTerm:string) => item.maker.toLowerCase().includes(searchTerm.toLowerCase())}>
                <TableHead class="bg-slate-200" >
                    <TableHeadCell>Product name</TableHeadCell>
                    <TableHeadCell defaultSort sort={(a:{maker:string}, b:{maker:string}) => a.maker.localeCompare(b.maker)}>Color</TableHeadCell>
                    <TableHeadCell>Category</TableHeadCell>
                    <TableHeadCell sort={(a:{id:number}, b:{id:number}) => a.id - b.id}>Price</TableHeadCell>
                </TableHead>
                <TableBody tableBodyClass="divide-y">
                    {#each $dataSample as item, i}
                        <TableBodyRow on:click={() => toggleRow(i)}>
                            <TableBodyCell>{item.id}</TableBodyCell>
                            <TableBodyCell>{item.maker}</TableBodyCell>
                            <TableBodyCell>{item.type}</TableBodyCell>
                            <TableBodyCell>{item.make}</TableBodyCell>
                        </TableBodyRow>
                        {#if openRow.includes(i)}
                            <TableBodyRow>
                                <TableBodyCell colspan={4} class="p-0">
                                    <div class="px-2 py-3" transition:slide={{ duration: 300, axis: 'y' }}>
                                        <ImagePlaceholder />
                                    </div>
                                </TableBodyCell>
                            </TableBodyRow>
                        {/if}
                    {/each}
                </TableBody>
            </Table>
        </TabItem>
    </Tabs>
</main>