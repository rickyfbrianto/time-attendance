<script lang="ts">
    import {fade} from 'svelte/transition'
    import { DotsVerticalOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
    import { Tabs, TabItem, Toast, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, TableSearch, Label, ImagePlaceholder, Dropdown, DropdownItem, MultiSelect, Select, Checkbox, Span } from 'flowbite-svelte';
    import MyInput from '@lib/components/MyInput.svelte'
    import MyButton from '@lib/components/MyButton.svelte'
    import axios from 'axios'
    import {Plus, RefreshCw, Save, Ban, Pencil, Trash, Search } from 'lucide-svelte'
    import {ListAccess, ListLevel} from '@lib/utils'
	import MyLoading from '@/MyLoading.svelte';
	import { Datatable, TableHandler, type State, ThSort } from '@vincjo/datatables/server';
	import { getParams } from '@lib/data/api';

    let formProfileState = $state({
        answer: {
            profile_id: "id",
            name: "",
            description: "",
            level: "",
            user_hrd: false,
            delegation: false,
            access_sppd: "",
            access_skpd: "",
            access_attendance: "",
            access_spl: "",
            access_srl: "",
            access_cuti: "",
            access_calendar: "",
            access_user: "",
            access_profile: "",
        },
        success:"",
        error:"",
        search:"",
        loading:false,
        refresh:false,
        add:false,
        edit:false,
    })

    async function fetchData(state: State| string) {
        try {
            const req = await fetch(`/admin/profile?${getParams(state)}`);
            if (!req.ok) throw new Error('Gagal mengambil data');
            const res = await req.json()
            return res
        } catch (err:any) {
            console.log(err.message)
        }
    }

    $effect(()=>{
        // fetchData("")
    })

    let tableProfile = new TableHandler([], {rowsPerPage: 5})
    tableProfile.load(async(state: State)=>{
        console.log(state.sort)
        const tes = await fetchData(state)
        return tes
    })
    const tableSearch = tableProfile.createSearch()
    tableProfile.invalidate()

    const formProfileEdit = async (id:string) =>{
        try {
            formProfileState.loading = true
            const req = await axios.get(`/admin/profile/${id}`)
            formProfileState.answer = {...await req.data}
            formProfileState.edit = true
            formProfileState.add = false
            formProfileState.loading = false
        } catch (error) {
            formProfileState.loading = false
        
        }
    }

    const formProfileSubmit = async () =>{
        try {
            Object.entries(formProfileState.answer).forEach(val=>{
                if(typeof val[1] === 'object'){
                    formProfileState.answer[val[0]] = val[1].join("")
                }
            })
            const req = await axios.post('/admin/profile', formProfileState.answer)
            const res = await req.data
        } catch (error) {
            
        }
    }

    const formProfileBatal = () =>{
        Object.entries(formProfileState.answer).forEach(val=>{
            formProfileState.answer[val[0]] = (typeof val[1] == "boolean" ? false : "")
        })
        formProfileState.add = false
        formProfileState.edit = false
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
    const formUserState = $state({
        answer:{
            payroll:"",
            profile_id:"",
            card_no:"",
            name:"",
            password:"",
            jabatan:"",
            department:"",
            location:"",
            phone:"",
            email:"",
            signature:"",
        },
        success:"",
        error:"",
        search:"",
        loading:false,
        refresh:false,
        add:false,
        edit:false,
    })

    let getDataUser = $derived(async(ref:boolean)=>{
        formUserState.refresh = false
        const req = await fetch('/admin/user')
        return await req.json()
    })

    const formUserEdit = async (id:string) =>{
        try {
            formUserState.loading = true
            const req = await axios.get(`/admin/user/${id}`)
            formUserState.answer = {...await req.data}
            formUserState.edit = true
            formUserState.add = false
            formUserState.loading = false
        } catch (error) {
            formUserState.loading = false
        
        }
    }
    
    const formUserSubmit = async () =>{
        try {    
            const req = await axios.post('/admin/user', formUserState.answer)
            const res = await req.data
            formUserState.error = ""
            formUserState.success = res.message
        } catch (error: any) {
            formUserState.error = error.response.data.message
            formUserState.success = ""
        }
    }

    const formUserBatal = () =>{
        Object.entries(formUserState.answer).forEach(val=>{
            formUserState.answer[val[0]] = (typeof val[1] == "string" ? "" : "")
        })
        formUserState.add = false
        formUserState.edit = false
    }
</script>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-4">
    <Tabs class='bg-white'>
        <TabItem open title="Dashboard">
            <!-- <span>Admin Page</span>
            <Table>
                <TableHead class="bg-slate-200" >
                    {#each profileTable.getHeaderGroups() as headerGroup}
                        <tr>
                            {#each headerGroup.headers as header}
                                <th>
                                    {#if !header.isPlaceholder}
                                        <button onclick={()=>{header.column.getToggleSortingHandler()}}>
                                            <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
                                            <span>
                                                {getSortSymbol(header.column.getIsSorted())}
                                            </span>
                                        </button>
                                    {/if}
                                </th>
                            {/each}
                        </tr>
                    {/each}
                </TableHead>
                <tbody>
                    {#each profileTable.getRowModel().rows as row}
                        <tr>
                            {#each row.getVisibleCells() as cell}
                                <td>
                                    <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
                                </td>
                            {/each}
                        </tr>
                    {/each}
                </tbody>                
            </Table> -->
        </TabItem>
        <TabItem title="Profile">
            <div class="flex flex-col gap-4">
                {#if formProfileState.error}
                    <Toast color="red">
                        <ExclamationCircleOutline slot="icon" class="w-6 h-6 text-primary-500 bg-primary-100 dark:bg-primary-800 dark:text-primary-200" />
                        {formProfileState.error}
                    </Toast>
                {/if}

                <div class="flex flex-col gap-2">
                    <div class="flex justify-between">
                        <div class="flex gap-2">
                            <MyButton onclick={()=>tableProfile.invalidate()}><RefreshCw size={16}/></MyButton>
                            {#if formProfileState.add || formProfileState.edit}
                                <MyButton onclick={formProfileBatal}><Ban size={16} /></MyButton>
                                <MyButton onclick={formProfileSubmit}><Save size={16}/></MyButton>
                            {:else}
                                <MyButton onclick={()=> formProfileState.add = true}><Plus size={16}/></MyButton>
                            {/if}
                        </div>
                        <select class='self-end border-slate-300 rounded-lg ring-0' bind:value={tableProfile.rowsPerPage} onchange={() => tableProfile.setPage(1)}>
                            {#each [5, 10, 20, 50] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <input class='flex-1 rounded-lg border border-slate-300 ring-0' bind:value={tableSearch.value}/>
                        <MyButton onclick={()=>tableSearch.set()} className='bg-white'><Search size={16} /></MyButton>
                    </div>
                </div>

                {#if formProfileState.loading}
                    <MyLoading message="Get user data"/>
                {/if}
                {#if formProfileState.add || formProfileState.edit}
                    <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg bg-white'>                       
                        <input type='hidden' name="profile_id" disabled={formProfileState.edit} bind:value={formProfileState.answer.profile_id}/>
                        <div class="flex flex-col md:flex-row gap-4">
                            <div class="flex flex-col gap-4 flex-1">
                                <MyInput type='text' title='Nama' name="name" bind:value={formProfileState.answer.name}/>
                                <Checkbox bind:checked={formProfileState.answer.user_hrd as unknown as boolean}>User HRD</Checkbox>
                                <Checkbox bind:checked={formProfileState.answer.delegation as unknown as boolean}>Delegation</Checkbox>
                            </div>
                            <MyInput type='textarea' title='Description' rows={4} name="description" bind:value={formProfileState.answer.description}/>
                        </div>
                        
                        <div class="flex flex-col gap-2">
                            <Label for='level'>Level</Label>
                            <Select name='level' items={ListLevel} bind:value={formProfileState.answer.level} />
                        </div>
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div class="flex flex-col gap-2">
                                <Label>Access SPPD</Label>
                                <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_sppd} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access SKPD</Label>
                                <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_skpd} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access Attendance</Label>
                                <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_attendance} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access SPL</Label>
                                <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_spl} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access SRL</Label>
                                <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_srl} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access Cuti</Label>
                                <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_cuti} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access Calendar</Label>
                                <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_calendar} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access User</Label>
                                <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_user} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Access Profile</Label>
                                <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_profile} />
                            </div>
                        </div>
                    </form>
                {/if}
                
                <!-- <div class="flex flex-1 bg-white"> -->
                    <Datatable table={tableProfile}>
                        <Table hoverable={true} striped={true}>
                            <TableHead class="bg-slate-500" >
                                <ThSort table={tableProfile} field="profile_id"><TableHeadCell>Profile ID</TableHeadCell></ThSort>
                                <ThSort table={tableProfile} field="name"><TableHeadCell>Name</TableHeadCell></ThSort>
                                <ThSort table={tableProfile} field="description"><TableHeadCell>Description</TableHeadCell></ThSort>
                                <ThSort table={tableProfile} field=""><TableHeadCell>#</TableHeadCell></ThSort>
                            </TableHead>

                            <TableBody tableBodyClass="divide-y">
                                {#each tableProfile.rows as row}
                                    <TableBodyRow>
                                        <TableBodyCell>{row.profile_id}</TableBodyCell>
                                        <TableBodyCell>{row.name}</TableBodyCell>
                                        <TableBodyCell>{row.description}</TableBodyCell>
                                        <TableBodyCell>
                                            <MyButton onclick={()=> formProfileEdit(row.profile_id)}><Pencil size={12} /></MyButton>
                                            <MyButton onclick={()=> formProfileEdit(row.profile_id)}><Trash size={12} /></MyButton>
                                        </TableBodyCell>
                                    </TableBodyRow>
                                {/each}
                            </TableBody>
                        </Table>
                    </Datatable>
                <!-- </div> -->
            </div>
        </TabItem>
        <TabItem title="User">
            <div class="flex flex-col gap-4">                
                {#if formUserState.error}
                    <Toast color="red">
                        <ExclamationCircleOutline slot="icon" class="w-6 h-6 text-primary-500 bg-primary-100 dark:bg-primary-800 dark:text-primary-200" />
                        {formUserState.error}
                    </Toast>
                {/if}

                <div class="flex gap-2">
                    <MyButton onclick={()=> formUserState.refresh = true}><RefreshCw size={16}/></MyButton>
                    {#if formUserState.add || formUserState.edit}
                        <MyButton onclick={formUserBatal}><Ban size={16}/></MyButton>
                        <MyButton onclick={formUserSubmit}><Save size={16}/></MyButton>
                    {:else}
                        <MyButton onclick={()=> formUserState.add = true}><Plus size={16}/></MyButton>
                    {/if}
                </div>

                {#if formUserState.loading}
                    <MyLoading message="Get user data"/>
                {/if}
                {#if formUserState.add || formUserState.edit}
                    <form transition:fade={{duration:500}} class='grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border border-slate-300 rounded-lg bg-white'>
                        <MyInput type='text' title='Payroll' disabled={formUserState.edit} name="payroll" bind:value={formUserState.answer.payroll}/>
                        <MyInput type='text' title='Profile ID' name="profile_id" bind:value={formUserState.answer.profile_id}/>
                        <MyInput type='text' title='Card Number' name="card_no" bind:value={formUserState.answer.card_no}/>
                        <MyInput type='text' title='Name' name="name" bind:value={formUserState.answer.name}/>
                        <MyInput type='password' password={true} title='Password' name="password" bind:value={formUserState.answer.password}/>
                        <MyInput type='text' title='Jabatan' name="jabatan" bind:value={formUserState.answer.jabatan}/>
                        <MyInput type='text' title='Department' name="department" bind:value={formUserState.answer.department}/>
                        <MyInput type='text' title='Location' name="location" bind:value={formUserState.answer.location}/>
                        <MyInput type='text' title='Phone' name="phone" bind:value={formUserState.answer.phone}/>
                        <MyInput type='text' title='Email' name="email" bind:value={formUserState.answer.email}/>
                        <MyInput type='text' title='Signature' name="signature" bind:value={formUserState.answer.signature}/>
                    </form>
                {/if}

                <Table class="rounded-lg" hoverable={true}>
                    <TableHead class="bg-slate-200" >                        
                        <TableHeadCell>Payroll</TableHeadCell>
                        <TableHeadCell>Nama</TableHeadCell>
                        <TableHeadCell>Jabatan</TableHeadCell>
                        <TableHeadCell>Department</TableHeadCell>
                        <TableHeadCell>Location</TableHeadCell>
                        <TableHeadCell>Email</TableHeadCell>
                        <TableHeadCell>#</TableHeadCell>
                    </TableHead>

                    {#await getDataUser(formUserState.refresh)}
                        <TableBody tableBodyClass="divide-y">
                            <TableBodyRow>
                                <TableBodyCell colspan={7}>Loading data</TableBodyCell>
                            </TableBodyRow>
                        </TableBody>
                    {:then val: any}
                        {#if val}
                            <TableBody tableBodyClass="divide-y">
                                {#each val as itemdata}
                                    <TableBodyRow>
                                        <TableBodyCell>{itemdata.payroll}</TableBodyCell>
                                        <TableBodyCell>{itemdata.name}</TableBodyCell>
                                        <TableBodyCell>{itemdata.jabatan}</TableBodyCell>
                                        <TableBodyCell>{itemdata.department}</TableBodyCell>
                                        <TableBodyCell>{itemdata.location}</TableBodyCell>
                                        <TableBodyCell>{itemdata.email}</TableBodyCell>
                                        <TableBodyCell>
                                            <MyButton onclick={()=> formUserEdit(itemdata.payroll)}><Pencil size={12} /></MyButton>
                                            <MyButton onclick={()=> formUserEdit(itemdata.payroll)}><Trash size={12} /></MyButton>
                                        </TableBodyCell>
                                    </TableBodyRow>
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