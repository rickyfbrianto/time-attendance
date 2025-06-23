<script>
	import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "@lucide/svelte";
    import { Tooltip } from "flowbite-svelte"
	import MyButton from "./MyButton.svelte";
	import { Badge } from "flowbite-svelte";

    let {table} = $props();
</script>

{#if table.rows.length > 0}
    <div class="flex justify-between items-center gap-2 mt-3 border border-slate-300 rounded-lg py-2 px-3">
        <div class="flex flex-col space-y-1">
            <Badge class='self-start text-white bg-slate-500 py-1'>Page {table.currentPage}</Badge>
            <p class='text-textdark self-end text-[.8rem]'>Showing {table.rowCount.start} to {table.rowCount.end} of {table.rowCount.total} rows</p>
        </div>
        <div class="flex gap-1">
            <MyButton onclick={()=> table.setPage(1)}><ChevronFirst size={14} /></MyButton>
            <Tooltip class='z-10'>First page</Tooltip>
            <MyButton onclick={()=> table.setPage('previous')}><ChevronLeft size={14} /></MyButton>
            <Tooltip class='z-10'>Previous page</Tooltip>
            {#each table.pagesWithEllipsis as page}
                {#if table.currentPage == page}
                    <span class='flex items-center border-b-[3px] border-slate-500 p-2 px-2 mx-2 font-bold'>{page}</span>
                    <Tooltip class='z-10'>I'm here at page {page}</Tooltip>
                {:else}
                    {#if page}
                        <MyButton className={`${table.currentPage == page ? "text-stone-400":"text-textdark"} text-[.8rem] px-3`} onclick={()=> table.setPage(page)} type="button">{page ?? "..."}</MyButton>
                        <Tooltip class='z-10'>Go to page {page}</Tooltip>
                    {:else}
                        <span class='flex items-center text-textdark font-bold p-2'>...</span>
                    {/if}
                {/if}
            {/each}
            <MyButton onclick={()=> table.setPage('next')}><ChevronRight size={14} /></MyButton>
            <Tooltip class='z-10'>Next page</Tooltip>
            <MyButton onclick={()=> table.setPage('last')}><ChevronLast size={14} /></MyButton>
            <Tooltip class='z-10'>Last page</Tooltip>
        </div>
    </div>
{/if}