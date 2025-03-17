<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Tabs, TabItem, Toast, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, TableSearch, Label, ImagePlaceholder, Dropdown, DropdownItem, MultiSelect, Select, Checkbox } from 'flowbite-svelte';
</script>

<svelte:head>
    <title>Dinas</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="Dashboard">
            <div class="flex justify-center items-center gap-4 min-h-[50vh]">
                <span>Dashboard Page</span>
            </div>
        </TabItem>
        <TabItem title="SPPD">
            <div class="flex flex-col gap-4">
                
            </div>
        </TabItem>
        <TabItem title="SKPD">
            <div class="flex flex-col gap-4">

            </div>
        </TabItem>
    </Tabs>
</main>

