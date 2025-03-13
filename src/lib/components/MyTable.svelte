<script lang='ts'>
	import { Datatable, TableHandler, ThSort } from "@vincjo/datatables/server";
	import MyButton from "./MyButton.svelte";
	import { getParams } from "@lib/data/api";
	import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Pencil, Search, Trash } from "@lucide/svelte";
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge } from 'flowbite-svelte';

    let {action} = $props()
    
    let table = $state(new TableHandler([], {rowsPerPage: 5}))
    let tableSearch = table.createSearch()
    
    $effect(()=>{
        table.load(async(state: State) => {
            try {
                const req = await fetch(`/api/admin/profile?${getParams(state)}`);
                if (!req.ok) throw new Error('Gagal mengambil data');
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })
    })
</script>

<div class="flex flex-col">
    <div class="flex gap-2">
        <input class='flex-1 rounded-lg border border-slate-300 ring-0' bind:value={tableSearch.value}/>
        <MyButton onclick={()=>tableSearch.set()} className='bg-white'><Search size={16} /></MyButton>
        <select class='self-end border-slate-300 rounded-lg ring-0' bind:value={table.rowsPerPage} onchange={() => table.setPage(1)}>
            {#each [5, 10, 20, 50] as option}
                <option value={option}>{option}</option>
            {/each}
        </select>
    </div>

    <Datatable table={table}>
        <Table hoverable={true} striped={true}>
            <TableHead class="bg-slate-500" >
                <ThSort table={table} field="profile_id"><TableHeadCell>Profile ID</TableHeadCell></ThSort>
                <ThSort table={table} field="name"><TableHeadCell>Name</TableHeadCell></ThSort>
                <ThSort table={table} field="description"><TableHeadCell>Description</TableHeadCell></ThSort>
                <!-- <ThSort table={table} field=""><TableHeadCell>#</TableHeadCell></ThSort> -->
            </TableHead>

            <TableBody tableBodyClass="divide-y">
                {#if table.rows.length > 0}
                    {#each table.rows as row}
                        <TableBodyRow>
                            <TableBodyCell>{row.profile_id}</TableBodyCell>
                            <TableBodyCell>{row.name}</TableBodyCell>
                            <TableBodyCell>{row.description}</TableBodyCell>
                            {#if action}
                                <!-- <TableBodyCell>
                                    <MyButton onclick={()=> formProfileEdit(row.profile_id)}><Pencil size={12} /></MyButton>
                                    <MyButton onclick={()=> formProfileEdit(row.profile_id)}><Trash size={12} /></MyButton>
                                </TableBodyCell> -->
                            {/if}
                        </TableBodyRow>
                    {/each}
                {:else}
                    <TableBodyRow>
                        <TableBodyCell colspan={4}>No data available</TableBodyCell>
                    </TableBodyRow>
                {/if}
            </TableBody>
        </Table>
        {#if table.rows.length > 0}
        <div class="flex justify-between items-center gap-2 mt-3">
            <p class='text-muted self-end text-[.9rem]'>
                Showing {table.rowCount.start} to {table.rowCount.end} of {table.rowCount.total} rows
                <Badge color="dark" border>Page {table.currentPage}</Badge>
            </p>
            <div class="flex gap-2">
                <MyButton onclick={()=> table.setPage(1)}><ChevronFirst size={16} /></MyButton>
                <MyButton onclick={()=> table.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                {#each table.pages as page}
                    <MyButton className={`text-muted text-[.9rem] px-3`} onclick={()=> table.setPage(page)} type="button">{page}</MyButton>
                {/each}
                <MyButton onclick={()=> table.setPage('next')}><ChevronRight size={16} /></MyButton>
                <MyButton onclick={()=> table.setPage('last')}><ChevronLast size={16} /></MyButton>
            </div>
        </div>
        {/if}
    </Datatable>
</div>