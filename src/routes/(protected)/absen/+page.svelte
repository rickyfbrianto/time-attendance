<script lang="ts">
    import { fade, slide } from 'svelte/transition'
    import { Tabs, TabItem } from 'flowbite-svelte';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch, Button, Modal, Label, Input, ImagePlaceholder } from 'flowbite-svelte';
    import {dataSample} from '@lib/store/appstore'
	import { Badge, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-svelte';
	import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
    import MyButton from '@lib/components/MyButton.svelte'
    
    let openRow: number[] = $state([]) 
    const toggleRow = (i: number) => {
        if(openRow.includes(i)){
            openRow = openRow.filter((item) => item !== i)
        } else {
            openRow.push(i)
        }
    }

    let tableAbsen = new TableHandler([], {rowsPerPage: 10})
    let tableAbsenSearch = tableAbsen.createSearch()

    $effect(()=>{
        tableAbsen.load(async (state: State) => {
            try {
                const req = await fetch('/api/absen')
                if (!req.ok) throw new Error('Gagal mengambil data');
                const res = await req.json()
                state.setTotalRows(res.length)
                return res
            } catch (error) {
                
            }
        })
    })
    
    $effect(()=>{
        tableAbsen.invalidate()
    })
</script>

<svelte:head>
    <title>Check In & Out</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-4">    
    <Tabs>
        <TabItem open title="My Absent">
            <div class="flex flex-col gap-4">                
                <div class="flex flex-col gap-2 bg-white rounded-lg p-4 border-slate-500">
                    <div class="flex justify-between gap-2">
                        <select class='self-end border-slate-300 rounded-lg ring-0' bind:value={tableAbsen.rowsPerPage} onchange={() => tableAbsen.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <input class='flex-1 rounded-lg border border-slate-300 ring-0' bind:value={tableAbsenSearch.value}/>
                        <MyButton onclick={()=>tableAbsenSearch.set()} className='bg-white'><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableAbsen}><RefreshCw size={16}/></MyButton>
                    </div>
                </div>
                
                <Datatable table={tableAbsen}>
                    <Table>
                        <TableHead class="bg-slate-500" >
                            <ThSort table={tableAbsen} field="name"><TableHeadCell>Payroll</TableHeadCell></ThSort>
                            <ThSort table={tableAbsen} field="name"><TableHeadCell>Name</TableHeadCell></ThSort>
                            <ThSort table={tableAbsen} field="tanggal"><TableHeadCell>Tanggal</TableHeadCell></ThSort>
                            <ThSort table={tableAbsen} field="check_in"><TableHeadCell>Check In</TableHeadCell></ThSort>
                            <ThSort table={tableAbsen} field="check_out"><TableHeadCell>Check Out</TableHeadCell></ThSort>
                        </TableHead>

                        <TableBody tableBodyClass="divide-y">
                            {#if tableAbsen.rows.length > 0}
                                {#each tableAbsen.rows as row}
                                    <TableBodyRow>
                                        <TableBodyCell>{row.payroll}</TableBodyCell>
                                        <TableBodyCell>{row.name}</TableBodyCell>
                                        <TableBodyCell>{row.tanggal}</TableBodyCell>
                                        <TableBodyCell>{row.check_in || "-"}</TableBodyCell>
                                        <TableBodyCell>{row.check_out || "-"}</TableBodyCell>
                                    </TableBodyRow>
                                {/each}
                            {:else}
                                <TableBodyRow>
                                    <TableBodyCell colspan={4}>
                                        {#if tableAbsen.isLoading}Loading {:else}No data available{/if}
                                    </TableBodyCell>
                                </TableBodyRow>
                            {/if}
                        </TableBody>
                    </Table>
                    {#if tableAbsen.rows.length > 0}
                        <div class="flex justify-between items-center gap-2 mt-3">
                            <p class='text-muted self-end text-[.9rem]'>
                                Showing {tableAbsen.rowCount.start} to {tableAbsen.rowCount.end} of {tableAbsen.rowCount.total} rows
                                <Badge color="dark">Page {tableAbsen.currentPage}</Badge>
                            </p>
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableAbsen.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                <MyButton onclick={()=> tableAbsen.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                {#each tableAbsen.pages as page}
                                    <MyButton className={`text-muted text-[.9rem] px-3`} onclick={()=> tableAbsen.setPage(page)} type="button">{page}</MyButton>
                                {/each}
                                <MyButton onclick={()=> tableAbsen.setPage('next')}><ChevronRight size={16} /></MyButton>
                                <MyButton onclick={()=> tableAbsen.setPage('last')}><ChevronLast size={16} /></MyButton>
                            </div>
                        </div>
                    {/if}
                </Datatable>
            </div>
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