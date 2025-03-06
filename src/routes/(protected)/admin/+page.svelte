<script lang="ts">
    import {fade} from 'svelte/transition'
    import { DotsVerticalOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
    import { Tabs, TabItem, Button, Toast, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, TableSearch, Label, ImagePlaceholder, Dropdown, DropdownItem, MultiSelect, Select, Checkbox } from 'flowbite-svelte';
    import MyInput from '@lib/components/MyInput.svelte'
    import axios from 'axios'
    import {Plus, RefreshCw, Save, Ban } from 'lucide-svelte'
    import MyButton from '@lib/components/MyButton.svelte'

    const fieldProfile = $state([
        { type:"text", name:"nama", title:"Nama Lengkap", required:true},
        { type:"password", name:"password", title:"Password", required:true, password:true},
        { type:"date", name:"Tanggal Lahir", title:"Tanggal Lahir", required:true},
        { type:"range", name:"umur", title:"Umur", required:true},
        { type:"email", name:"email", title:"Email", required:true},
    ])

    const listProfileAccess = [
        {value:"C", name:"Create"},
        {value:"R", name:"Read"},
        {value:"U", name:"Update"},
        {value:"D", name:"Delete"},
    ]
    const listProfileLevel = [
        {value:"0", name:"0"},
        {value:"1", name:"1"},
    ]
        
    let formProfileState = $state({
        answer: {},
        error:"",
        search:"",
        refresh:false,
        add:false,
        actionTable: false,
        selectedId :""
    })

    const getDataProfile = $derived(async(ref:boolean)=>{
        formProfileState.refresh = false
        const req = await fetch('/admin/profile')
        const result = await req.json()
        return result
    })

    const formProfileSubmit = async (e:SubmitEvent) =>{
        e.preventDefault()
        console.log(formProfileState.answer)
        Object.entries(formProfileState.answer).forEach(val=>{
            if(typeof val[1] === 'object'){
                formProfileState.answer[val[0]] = val[1].join("")
            }
        })
        try {
            const req = await axios.post('/admin/profile', formProfileState.answer)
            const res = await req.data
        } catch (error) {
            
        }
    }
    
    let openRow: string[] = $state([]) 
    const toggleRow = (i: string) => {
        if(openRow.includes(i)){
            openRow = openRow.filter((item) => item !== i)
        } else {
            openRow.push(i)
        }
    }

    // user
    const fieldUser = $state([
        { type:"text", name:"payroll", title:"Payroll", required:true},
        { type:"text", name:"profile_id", title:"Profile ID", required:true},
        { type:"text", name:"card_no", title:"Card No", required:true},
        { type:"text", name:"name", title:"Nama Lengkap", required:true},
        { type:"password", name:"password", title:"Password", required:true, password:true},
        { type:"text", name:"jabatan", title:"Jabatan", required:true},
        { type:"text", name:"department", title:"Dept", required:true},
        { type:"text", name:"location", title:"Location", required:true},
        { type:"text", name:"phone", title:"Phone", required:true},
        { type:"email", name:"email", title:"Email", required:true},
        { type:"text", name:"signature", title:"Signature"},
    ])

    const formUserState = $state({
        answer: fieldUser.map(val => ({[val.name]:""})).reduce((acc, obj) => {
            return { ...acc, ...obj };
        }, {}),
        success:"",
        error: "",
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
            formUserState.error = ""
            formUserState.success = res.message
        } catch (error: any) {
            formUserState.error = error.response.data.message
        }
    }
</script>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-4">
    <Tabs class='bg-white'>
        <TabItem open title="Profile">
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
                            <!-- {#each fieldProfile as form}
                                <MyInput {...form} bind:value={formProfileState.answer[form.name]} className=""/>
                            {/each} -->

                            <MyInput type='hidden' rows={4} name="profile_id" bind:value={formProfileState.answer.profile_id}/>
                            <div class="flex gap-4">
                                <div class="flex flex-col gap-4 flex-1">
                                    <MyInput type='text' title='Nama' name="name" bind:value={formProfileState.answer.name}/>
                                    <Checkbox bind:checked={formProfileState.answer.user_hrd as unknown as boolean}>User HRD</Checkbox>
                                    <Checkbox bind:checked={formProfileState.answer.delegation as unknown as boolean}>Delegation</Checkbox>
                                </div>
                                <MyInput type='textarea' title='Description' rows={4} name="description" bind:value={formProfileState.answer.description}/>
                            </div>
                            
                            <div class="flex flex-col gap-2">
                                <Label for='level'>Level</Label>
                                <Select name='level' items={listProfileLevel} bind:value={formProfileState.answer.level} />
                            </div>
                            
                            
                            <div class="flex flex-col gap-2">
                                <Label>Access SPPD</Label>
                                <MultiSelect size="md" items={listProfileAccess} bind:value={formProfileState.answer.access_sppd} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access SKPD</Label>
                                <MultiSelect size="md" items={listProfileAccess} bind:value={formProfileState.answer.access_skpd} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access Attendance</Label>
                                <MultiSelect size="md" items={listProfileAccess} bind:value={formProfileState.answer.access_attendance} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access SPL</Label>
                                <MultiSelect size="md" items={listProfileAccess} bind:value={formProfileState.answer.access_spl} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access SRL</Label>
                                <MultiSelect size="md" items={listProfileAccess} bind:value={formProfileState.answer.access_srl} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access Cuti</Label>
                                <MultiSelect size="md" items={listProfileAccess} bind:value={formProfileState.answer.access_cuti} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access Calendar</Label>
                                <MultiSelect size="md" items={listProfileAccess} bind:value={formProfileState.answer.access_calendar} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access User</Label>
                                <MultiSelect size="md" items={listProfileAccess} bind:value={formProfileState.answer.access_user} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access User</Label>
                                <MultiSelect size="md" items={listProfileAccess} bind:value={formProfileState.answer.access_user} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access Profile</Label>
                                <MultiSelect size="md" items={listProfileAccess} bind:value={formProfileState.answer.access_profile} />
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
                    <!-- <button onclick={search} color="blue">Cari</button> -->
                    <!-- <button onclick={resetSearch} color="gray">Reset</button> -->
                </div>
                
                <TableSearch class="rounded-lg" hoverable={true}>
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
                    {/await}
                </TableSearch>
            </div>
        </TabItem>
        <TabItem title="User">
            <div class="flex flex-col gap-2">                
                {#if formUserState.error}
                    <Toast color="red">
                        <ExclamationCircleOutline slot="icon" class="w-6 h-6 text-primary-500 bg-primary-100 dark:bg-primary-800 dark:text-primary-200" />
                        {formUserState.error}
                    </Toast>
                {/if}

                <div class="flex gap-2 my-2">
                    <MyButton onclick={()=> formUserState.refresh = true}><RefreshCw size={16}/></MyButton>
                    <MyButton onclick={()=> formUserState.add = true}><Plus size={16}/></MyButton>
                </div>

                {#if formUserState.add}
                    <form transition:fade={{duration:500}} method="POST" onsubmit={formUserSubmit} class='flex flex-col gap-2 p-4 border border-slate-300 rounded-lg bg-white'>
                        <div class="flex flex-col gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {#each fieldUser as form}
                                <MyInput {...form} bind:value={formUserState.answer[form.name]} className=""/>
                            {/each}
                        </div>
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
                        {#if val.data}
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
                        {:else}
                            <TableBody tableBodyClass="divide-y">
                                <TableBodyRow>
                                    <TableBodyCell colspan={5}>
                                        <span>Tidak ada data</span>
                                    </TableBodyCell>
                                </TableBodyRow>
                            </TableBody>
                        {/if}
                    {/await}
                </Table>
            </div>
        </TabItem>
    </Tabs>
</main>