<script lang="ts">
    import { fade, slide } from 'svelte/transition'
    import { Tabs, TabItem } from 'flowbite-svelte';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch, Button, Modal, Label, Input, ImagePlaceholder } from 'flowbite-svelte';
    import {dataSample} from '@lib/store/appstore'

    let modalTambah = $state(false)

    const {data} = $props()
    
    const formStatic = [
        {type:"text", name:"nama", title:"Nama"},
        {type:"date", name:"status", title:"Status", placeholder:"Masukkan Tanggal"},
        {type:"text", name:"payrol", title:"Payrol", placeholder:"Payrol"},
    ]

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
        // console.log(openRow)
    }

    // let id = $state(1)
    // const temp = async (id:number) =>{
    //     const req = await fetch(`/api/absen/${id}`)
    //     const res = await req.json()
    //     return res
    // }

    const formSubmit = (e:SubmitEvent) =>{
        e.preventDefault()
        console.log(formState.answer)
    }
</script>

<main in:fade={{delay:500}} out:fade class="flex flex-col gap-4">
    <div class="flex flex-col bg-white rounded-lg p-4">
        <Modal title="Terms of Service" bind:open={modalTambah} autoclose={false} size="xl">
            <form onsubmit={formSubmit} class="grid grid-cols-2 gap-4">                
                {#each formStatic as {name, title, placeholder, type}}
                    <div class="flex flex-col gap-2 flex-1/2">
                        <Label>{title}</Label>
                        <input id={name} {name} {type} {placeholder} bind:value={formState.answer[name]}
                        class="p-2 rounded-lg outline-none border-slate-200"/>
                    </div>
                {/each}
                <button type="submit" class="bg-green-400">Save</button>
            </form>
        </Modal>
        
        <Tabs>
            <TabItem open title="My Absent">
                <Table class="bg-black" hoverable={true} filter={(item:string, searchTerm:string) => item.maker.toLowerCase().includes(searchTerm.toLowerCase())}>
                    <caption class="text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                        <Button class="self-start" onclick={() => (modalTambah = true)}>Tambah</Button>
                        <p class="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">Browse a list of Flowbite products designed to help you work and play, stay organized, get answers, keep in touch, grow your business, and more.</p>
                    </caption>
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

    </div>
</main>