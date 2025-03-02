<script lang="ts">
    import {fade} from 'svelte/transition'
    import { FireOutline } from 'flowbite-svelte-icons';
    import { Tabs, TabItem, Button, Toast, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch, Modal, Label, Input, ImagePlaceholder } from 'flowbite-svelte';
    import InputForm from '@lib/components/InputForm.svelte'
    import axios from 'axios'
    import {Plus, RefreshCw, Save, Ban} from 'lucide-svelte'
    import MyButton from '@lib/components/MyButton.svelte'
        
    const fieldProfile = $state([
        { type:"text", name:"nama", title:"Nama Lengkap", required:true},
        { type:"password", name:"password", title:"Password", required:true, password:true},
        { type:"date", name:"Tanggal Lahir", title:"Tanggal Lahir", required:true},
        { type:"range", name:"umur", title:"Umur", required:true},
        { type:"email", name:"email", title:"Email", required:true},
    ])

    const formProfileState = $state({
        answer: fieldProfile.map(val => ({[val.name]:""})).reduce((acc, obj) => {
            return { ...acc, ...obj };
        }, {}),
        error:"",
        refresh:false,
        add:false
    })

    const getDataProfile = $derived(async(ref:boolean)=>{
        formProfileState.refresh = false
        const req = await fetch('/admin/profile')
        const result = await req.json()
        return result
    })

    const formProfileSubmit = async (e:SubmitEvent) =>{
        e.preventDefault()
        try {
            const req = await axios.post('/admin/profile', formProfileState.answer)
            const res = await req.data
        } catch (error) {
            
        }
    }
    
    let openRow: number[] = $state([]) 
    const toggleRow = (i: number) => {
        if(openRow.includes(i)){
            openRow = openRow.filter((item) => item !== i)
        } else {
            openRow.push(i)
        }
    }

    const fieldUser = $state([
        { type:"text", name:"nama", title:"Nama Lengkap", required:true},
        { type:"password", name:"password", title:"Password", required:true, password:true},
        { type:"date", name:"Tanggal Lahir", title:"Tanggal Lahir", required:true},
        { type:"range", name:"umur", title:"Umur", required:true},
        { type:"email", name:"email", title:"Email", required:true},
    ])

    const formUserState = $state({
        answer: fieldUser.map(val => ({[val.name]:""})).reduce((acc, obj) => {
            return { ...acc, ...obj };
        }, {}),
        error:"",
        refresh:false,
        add:false
    })

    let getDataUser = $derived(async(ref:boolean)=>{
        formUserState.refresh = false
        const req = await fetch('/admin/user')
        const result = await req.json()
        return result
    })

    const formUserSubmit = async (e:SubmitEvent) =>{
        e.preventDefault()
        try {
            const req = await axios.post('/admin/user', formUserState.answer)
            const res = await req.data
        } catch (error) {
            
        }
    }
</script>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-4">
    <Tabs class='bg-white'>
        <TabItem open title="Profile">
            <div class="flex flex-col gap-2">                
                <!-- <Toast>
                    <FireOutline slot="icon" class="w-6 h-6 text-primary-500 bg-primary-100 dark:bg-primary-800 dark:text-primary-200" />
                    Set yourself free.
                </Toast> -->

                <div class="flex gap-2 my-2">
                    <MyButton onclick={()=> formProfileState.refresh = true}><RefreshCw size={16}/></MyButton>
                    <MyButton onclick={()=> formProfileState.add = true}><Plus size={16}/></MyButton>
                </div>

                {#if formProfileState.add}
                    <form transition:fade={{duration:500}} method="POST" onsubmit={formProfileSubmit} class='flex flex-col gap-2 p-4 border border-slate-300 rounded-lg bg-white'>
                        <div class="flex flex-col gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {#each fieldProfile as form}
                                <InputForm {...form} bind:value={formProfileState.answer[form.name]} className=""/>
                            {/each}
                        </div>
                        {JSON.stringify(formProfileState.answer)}
                        <div class="flex self-start gap-2">
                            <MyButton onclick={()=>formProfileState.add = false}><Ban /></MyButton>
                            <MyButton type={'submit'}><Save /></MyButton>
                        </div>
                    </form>
                {/if}

                <TableSearch class="rounded-lg" hoverable={true}>
                    <TableHead class="bg-slate-200" >
                        <TableHeadCell sort={(a:{profile_id:string}, b:{profile_id:string}) => a.profile_id.localeCompare(b.profile_id)}>Profile ID</TableHeadCell>
                        <TableHeadCell defaultSort>Name</TableHeadCell>
                        <TableHeadCell>Description</TableHeadCell>
                        <TableHeadCell>Level</TableHeadCell>
                        <TableHeadCell>User HRD</TableHeadCell>
                        <TableHeadCell>Delegation</TableHeadCell>
                    </TableHead>

                    {#await getDataProfile(formProfileState.refresh)}
                        <TableBody tableBodyClass="divide-y">
                            <TableBodyRow>
                                <TableBodyCell colspan={6}>Loading data</TableBodyCell>
                            </TableBodyRow>
                        </TableBody>
                    {:then val: any}
                        <TableBody tableBodyClass="divide-y">
                            {#each val.data as itemdata, i}
                                <TableBodyRow onclick={() => toggleRow(i)}>
                                    {#each Object.entries(itemdata) as [key, value]}
                                        <TableBodyCell>{value}</TableBodyCell>
                                    {/each}
                                </TableBodyRow>
                                {#if openRow.includes(i)}
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
                    {/await}
                </TableSearch>
            </div>
        </TabItem>
        <TabItem title="User">
            <div class="flex flex-col gap-2">                
                <!-- <Toast>
                    <FireOutline slot="icon" class="w-6 h-6 text-primary-500 bg-primary-100 dark:bg-primary-800 dark:text-primary-200" />
                    Set yourself free.
                </Toast> -->

                <div class="flex gap-2 my-2">
                    <MyButton onclick={()=> formUserState.refresh = true}><RefreshCw size={16}/></MyButton>
                    <MyButton onclick={()=> formUserState.add = true}><Plus size={16}/></MyButton>
                </div>

                {#if formUserState.add}
                    <form transition:fade={{duration:500}} method="POST" onsubmit={formUserSubmit} class='flex flex-col gap-2 p-4 border border-slate-300 rounded-lg bg-white'>
                        <div class="flex flex-col gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {#each fieldProfile as form}
                                <InputForm {...form} bind:value={formUserState.answer[form.name]} className=""/>
                            {/each}
                        </div>
                        {JSON.stringify(formUserState.answer)}
                        <div class="flex self-start gap-2">
                            <MyButton onclick={()=>formUserState.add = false}><Ban /></MyButton>
                            <MyButton type={'submit'}><Save /></MyButton>
                        </div>
                    </form>
                {/if}

                <Table class="rounded-lg" hoverable={true}>
                    <TableHead class="bg-slate-200" >                        
                        <TableHeadCell>Payroll</TableHeadCell>
                        <TableHeadCell>Profile ID</TableHeadCell>
                        <TableHeadCell>Card No</TableHeadCell>
                        <TableHeadCell>Name</TableHeadCell>
                        <TableHeadCell>Department</TableHeadCell>
                    </TableHead>

                    {#await getDataUser(formUserState.refresh)}
                        <TableBody tableBodyClass="divide-y">
                            <TableBodyRow>
                                <TableBodyCell colspan={6}>Loading data</TableBodyCell>
                            </TableBodyRow>
                        </TableBody>
                    {:then val: any}
                        <TableBody tableBodyClass="divide-y">
                            {#each val.data as item, i}
                                <TableBodyRow onclick={() => toggleRow(i)}>
                                    {#each Object.entries(item) as [key, value]}
                                        <TableBodyCell>{value}</TableBodyCell>
                                    {/each}
                                </TableBodyRow>
                                {#if openRow.includes(i)}
                                    <TableBodyRow>
                                        <TableBodyCell colspan={Object.keys(item).length}>
                                            <div class="flex">
                                                <!-- {#await getAbsenById(item['id'])}
                                                <span>Loading data...</span>
                                                {:then val}
                                                <span>{val.title}</span>                                                
                                                {/await} -->
                                            </div>
                                        </TableBodyCell>
                                    </TableBodyRow>
                                {/if}
                            {/each}
                        </TableBody>
                    {/await}
                </Table>
            </div>
        </TabItem>
    </Tabs>
</main>