<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Tabs, TabItem, Toast, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, TableSearch, Label, ImagePlaceholder, Dropdown, DropdownItem, MultiSelect, Select, Checkbox } from 'flowbite-svelte';
</script>

<svelte:head>
    <title>Cuti & Ijin</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-4">
    <Tabs class='bg-white'>
        <TabItem open title="Dashboard">
            <span>Dashboard Page</span>
        </TabItem>
        <TabItem title="Cuti">
            <div class="flex flex-col gap-4">
                
            </div>
        </TabItem>
        <TabItem title="Ijin">
            <div class="flex flex-col gap-4">

            </div>
        </TabItem>
    </Tabs>
</main>

