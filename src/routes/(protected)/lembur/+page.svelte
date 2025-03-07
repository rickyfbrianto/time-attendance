<script lang="ts">
    import {fade} from 'svelte/transition'
    import {Tabs, TabItem, Toast, Checkbox, Select} from 'flowbite-svelte'
    import { DotsVerticalOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
    import {Plus, RefreshCw, Save, Ban } from 'lucide-svelte'
    import MyButton from '@/MyButton.svelte';
    import MyInput from '@/MyInput.svelte';

    const formProfileState = $state({
        answer:{},
        error:"",
        search:"",
        refresh:false,
        add:false,
        actionTable: false,
        selectedId :""
    })
    
</script>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-4">
    <Tabs class='bg-white'>
        <TabItem open title="SPL">
            <div class="flex flex-col gap-2">
                {#if formProfileState.error}
                    <Toast color="red">
                        <ExclamationCircleOutline slot="icon" class="w-6 h-6 text-primary-500 bg-primary-100 dark:bg-primary-800 dark:text-primary-200" />
                        {formProfileState.error}
                    </Toast>
                {/if}

                <div class="flex gap-2 my-2">
                    <MyButton onclick={()=> formProfileState.refresh = true}><RefreshCw size={16}/></MyButton>
                    <MyButton onclick={()=> formProfileState.add = true}><Plus size={16}/></MyButton>
                </div>

                {#if formProfileState.add}
                    <form transition:fade={{duration:500}} method="POST" onsubmit={formProfileSubmit} class='flex flex-col gap-2 p-4 border border-slate-300 rounded-lg bg-white'>
                        <div class="flex flex-col gap-4">                            
                            <input type='hidden' name="profile_id" bind:value={formProfileState.answer.profile_id}/>
                            <div class="flex flex-col md:flex-row gap-4">
                                <div class="flex flex-col gap-4 flex-1">
                                    <MyInput type='text' title='Nama' name="name" bind:value={formProfileState.answer.name}/>
                                </div>
                                <MyInput type='textarea' title='Description' rows={4} name="description" bind:value={formProfileState.answer.description}/>
                            </div>
                                                        
                            
                        </div>
                        {JSON.stringify(formProfileState.answer)}
                        <div class="flex self-start gap-2">
                            <MyButton onclick={()=>formProfileState.add = false}><Ban /></MyButton>
                            <MyButton type={'submit'}><Save /></MyButton>
                        </div>
                    </form>
                {/if}

                <div class="flex gap-2 mb-4">
                    <MyInput type='text' name='search' bind:value={formProfileState.search} />
                    <MyButton>Cari</MyButton>
                    <MyButton>Reset</MyButton>
                </div>
                
                <!-- <TableSearch class="rounded-lg" hoverable={true}>
                    <TableHead class="bg-slate-200" >
                        <TableHeadCell defaultSort>Name</TableHeadCell>
                        <TableHeadCell>Description</TableHeadCell>
                        <TableHeadCell>Level</TableHeadCell>
                        <TableHeadCell>User HRD</TableHeadCell>
                        <TableHeadCell>Delegation</TableHeadCell>
                        <TableHeadCell>#</TableHeadCell>
                    </TableHead>

                    {#await getDataProfile(formProfileState.refresh)}
                        <TableBody tableBodyClass="divide-y">
                            <TableBodyRow>
                                <TableBodyCell colspan={6}>Loading data</TableBodyCell>
                            </TableBodyRow>
                        </TableBody>
                    {:then val}
                        <TableBody tableBodyClass="divide-y">
                            {#each val.data as itemdata, i}
                                <TableBodyRow>
                                    <TableBodyCell>{itemdata.name}</TableBodyCell>
                                    <TableBodyCell>{itemdata.description}</TableBodyCell>
                                    <TableBodyCell>{itemdata.level}</TableBodyCell>
                                    <TableBodyCell>{itemdata.user_hrd}</TableBodyCell>
                                    <TableBodyCell>{itemdata.delegation}</TableBodyCell>
                                    <TableBodyCell>
                                        <DotsVerticalOutline class="dark:text-white" onclick={()=> formProfileState.selectedId = itemdata.profile_id}/>
                                        <Dropdown triggeredBy={formProfileState.selectedId} placement="left">
                                            <DropdownItem onclick={()=> {toggleRow(itemdata.profile_id)}}>Detail</DropdownItem>
                                            <DropdownItem onclick={()=> console.log(itemdata.profile_id)}>Edit</DropdownItem>
                                            <DropdownItem>Hapus</DropdownItem>
                                        </Dropdown>
                                    </TableBodyCell>
                                </TableBodyRow>
                                {#if openRow.includes(itemdata.profile_id)}
                                    <TableBodyRow>
                                        <TableBodyCell colspan={6} class="p-0">
                                            <div class="px-2 py-3" transition:fade={{ duration: 300 }}>
                                                <ImagePlaceholder />
                                            </div>
                                        </TableBodyCell>
                                    </TableBodyRow>
                                {/if}
                            {/each}
                        </TableBody> 
                    {:catch val}
                    <TableBody tableBodyClass="divide-y">
                    <TableBodyRow>
                        <TableBodyCell colspan={6}>Error: {val.message}</TableBodyCell>
                    </TableBodyRow>
                    </TableBody>
                    {/await}
                </TableSearch> -->
            </div>
        </TabItem>
    </Tabs>
</main>