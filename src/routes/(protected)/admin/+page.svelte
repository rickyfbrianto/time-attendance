<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Tabs, TabItem, Toast, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Label, MultiSelect, Select, Checkbox, Badge } from 'flowbite-svelte';
    import MyInput from '@lib/components/MyInput.svelte'
    import MyButton from '@lib/components/MyButton.svelte'
    import axios from 'axios'
    import {Plus, RefreshCw, Save, Ban, Pencil, Trash, Search, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Check } from 'lucide-svelte'
    import {ListAccess, ListLevel} from '@lib/utils'
	import MyLoading from '@/MyLoading.svelte';
	import { Datatable, TableHandler, type State, ThSort } from '@vincjo/datatables/server';
	import { getParams } from '@lib/data/api';

    const rowsPerPage = 10

    let tableProfile = $state(new TableHandler([], {rowsPerPage}))
    let tableProfileSearch = tableProfile.createSearch()
    
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
        loading:false,
        refresh:false,
        add:false,
        edit:false,
    })
        
    const formProfileEdit = async (id:string) =>{
        try {
            formProfileState.loading = true
            const req = await axios.get(`/api/admin/profile/${id}`)
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
            formProfileState.error = ""
            formProfileState.loading = true
            Object.entries(formProfileState.answer).forEach(val=>{
                if(typeof val[1] === 'object'){
                    formProfileState.answer[val[0]] = val[1].join("")
                }
            })

            if(formProfileState.add){
                const req = await axios.post('/api/admin/profile', formProfileState.answer)
                const res = await req.data
                formProfileState.success = res.message
            }else if(formProfileState.edit){
                const req = await axios.put('/api/admin/profile', formProfileState.answer)
                const res = await req.data
                formProfileState.success = res.message
            }
        } catch (error: any) {
            formProfileState.error = error.message
            formProfileState.success = ""
        } finally {
            formProfileState.loading = false
            tableProfile.invalidate()
            formProfileBatal()
        }
    }

    const formProfileBatal = () =>{
        Object.entries(formProfileState.answer).forEach(val=>{
            formProfileState.answer[val[0]] = (typeof val[1] == "boolean" ? false : "")
        })
        formProfileState.add = false
        formProfileState.edit = false
    }
    
    const formProfileDelete = async (id: string) =>{
        try {
            formProfileState.error = ""
            formProfileState.loading = true
            const req = await axios.delete(`/api/admin/profile/${id}`)
            const res = await req.data
            formProfileState.success = res.message
        } catch (error) {
            formProfileState.error = ""
            formProfileState.success = ""
        }finally{
            tableProfile.invalidate()
            formProfileState.loading = false
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
    let tableUser = $state(new TableHandler([], {rowsPerPage}))
    let tableUserSearch = tableProfile.createSearch()
    
    const formUserState = $state({
        answer:{
            payroll:"",
            profile_id:"",
            user_id_mesin:"",
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
        loading:false,
        refresh:false,
        add:false,
        edit:false,
    })

    const formUserEdit = async (id:string) =>{
        try {
            formUserState.loading = true
            const req = await axios.get(`/api/admin/user/${id}`)
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
            formUserState.error = ""
            formUserState.loading = true
            if(formUserState.add){
                const req = await axios.post('/api/admin/user', formUserState.answer)
                const res = await req.data
                formUserState.success = res.message
            }
            if(formUserState.edit){
                const req = await axios.put('/api/admin/user', formUserState.answer)
                const res = await req.data
                formUserState.success = res.message
            }
        } catch (error: any) {
            formUserState.error = error.message
            formUserState.success = ""
        } finally {
            formUserState.loading = false
            tableUser.invalidate()
            formUserBatal()
        }
    }

    const formUserBatal = () =>{
        Object.entries(formUserState.answer).forEach(val=>{
            formUserState.answer[val[0]] = (typeof val[1] == "string" ? "" : "")
        })
        formUserState.add = false
        formUserState.edit = false
    }

    const formUserDelete = async (id: string) =>{
        try {
            formUserState.error = ""
            formUserState.loading = true
            const req = await axios.delete(`/api/admin/user/${id}`)
            const res = await req.data
            formUserState.success = res.message
        } catch (error) {
            formUserState.error = ""
            formUserState.success = ""
        }finally{
            tableUser.invalidate()
            formUserState.loading = false
        }
    }

    $effect(()=>{
        tableProfile.load(async(state: State) => {
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

        tableUser.load(async(state: State) => {
            try {
                const req = await fetch(`/api/admin/user?${getParams(state)}`);
                if (!req.ok) throw new Error('Gagal mengambil data');
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })
    })
    tableProfile.invalidate()
    tableUser.invalidate()
</script>

<svelte:head>
    <title>Admin Page</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-4">
    <Tabs class='bg-white'>
        <TabItem open title="Dashboard">
            
        </TabItem>
        <TabItem title="Profile">
            <div class="flex flex-col gap-4">                
                {#if formProfileState.error || formProfileState.success}
                    <Toast color="red">
                        {#if formProfileState.error}
                        <Ban size={16} color="#d41c08" />
                        {:else}
                        <Check size={16} color="#08d42a" />
                        {/if}
                        {formProfileState.error || formProfileState.success}
                    </Toast>
                {/if}

                <div class="flex flex-col gap-2 bg-white rounded-lg p-4 border-slate-500">
                    <div class="flex justify-between gap-2">
                        <div class="flex gap-2">                        
                            {#if formProfileState.add || formProfileState.edit}
                                <MyButton onclick={formProfileBatal}><Ban size={16} /></MyButton>
                                <MyButton disabled={formProfileState.loading} onclick={formProfileSubmit}><Save size={16}/></MyButton>
                            {:else}
                                <MyButton onclick={()=> formProfileState.add = true}><Plus size={16}/></MyButton>
                            {/if}
                        </div>
                        <select class='self-end border-slate-300 rounded-lg ring-0' bind:value={tableProfile.rowsPerPage} onchange={() => tableProfile.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <input class='flex-1 rounded-lg border border-slate-300 ring-0' bind:value={tableProfileSearch.value}/>
                        <MyButton onclick={()=>tableProfileSearch.set()} className='bg-white'><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableProfile.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                </div>

                {#if formProfileState.loading}
                    <MyLoading message="Get profile data"/>
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
                
                <Datatable table={tableProfile}>
                    <Table>
                        <TableHead class="bg-slate-500" >
                            <ThSort table={tableProfile} field="name"><TableHeadCell>Name</TableHeadCell></ThSort>
                            <ThSort table={tableProfile} field="description"><TableHeadCell>Description</TableHeadCell></ThSort>
                            <ThSort table={tableProfile} field="level"><TableHeadCell>Level</TableHeadCell></ThSort>
                            <ThSort table={tableProfile} field="delegation"><TableHeadCell>Delegation</TableHeadCell></ThSort>
                            <ThSort table={tableProfile} field=""><TableHeadCell>#</TableHeadCell></ThSort>
                        </TableHead>

                        <TableBody tableBodyClass="divide-y">
                            {#if tableProfile.rows.length > 0}
                                {#each tableProfile.rows as row}
                                    <TableBodyRow>
                                        <TableBodyCell>{row.name}</TableBodyCell>
                                        <TableBodyCell>{row.description}</TableBodyCell>
                                        <TableBodyCell>{row.level}</TableBodyCell>
                                        <TableBodyCell>{row.delegation}</TableBodyCell>
                                        <TableBodyCell>
                                            <MyButton onclick={()=> formProfileEdit(row.profile_id)}><Pencil size={12} /></MyButton>
                                            <MyButton onclick={()=> formProfileDelete(row.profile_id)}><Trash size={12} /></MyButton>
                                        </TableBodyCell>
                                    </TableBodyRow>
                                {/each}
                            {:else}
                                <TableBodyRow>
                                    <TableBodyCell colspan={4}>
                                        {#if tableProfile.isLoading}Loading {:else}No data available{/if}
                                    </TableBodyCell>
                                </TableBodyRow>
                            {/if}
                        </TableBody>
                    </Table>
                    {#if tableProfile.rows.length > 0}
                        <div class="flex justify-between items-center gap-2 mt-3">
                            <p class='text-muted self-end text-[.9rem]'>
                                Showing {tableProfile.rowCount.start} to {tableProfile.rowCount.end} of {tableProfile.rowCount.total} rows
                                <Badge color="dark" border>Page {tableProfile.currentPage}</Badge>
                            </p>
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableProfile.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                <MyButton onclick={()=> tableProfile.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                {#each tableProfile.pages as page}
                                    <MyButton className={`text-muted text-[.9rem] px-3`} onclick={()=> tableProfile.setPage(page)} type="button">{page}</MyButton>
                                {/each}
                                <MyButton onclick={()=> tableProfile.setPage('next')}><ChevronRight size={16} /></MyButton>
                                <MyButton onclick={()=> tableProfile.setPage('last')}><ChevronLast size={16} /></MyButton>
                            </div>
                        </div>
                    {/if}
                </Datatable>
            </div>
        </TabItem>
        <TabItem title="User">
            <div class="flex flex-col gap-4">                
                {#if formUserState.error || formUserState.success}
                    <Toast color="red">
                        {#if formUserState.error}
                        <Ban size={16} color="#d41c08" />
                        {:else}
                        <Check size={16} color="#08d42a" />
                        {/if}
                        {formUserState.error || formUserState.success}
                    </Toast>
                {/if}

                <div class="flex flex-col gap-2 bg-white rounded-lg p-4 border-slate-500">
                    <div class="flex justify-between gap-2">
                        <div class="flex gap-2">                        
                            {#if formUserState.add || formUserState.edit}
                                <MyButton onclick={formUserBatal}><Ban size={16} /></MyButton>
                                <MyButton onclick={formUserSubmit}><Save size={16}/></MyButton>
                            {:else}
                                <MyButton onclick={()=> formUserState.add = true}><Plus size={16}/></MyButton>
                            {/if}
                        </div>
                        <select class='self-end border-slate-300 rounded-lg ring-0' bind:value={tableUser.rowsPerPage} onchange={() => tableUser.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <input class='flex-1 rounded-lg border border-slate-300 ring-0' bind:value={tableUserSearch.value}/>
                        <MyButton onclick={()=>tableUserSearch.set()} className='bg-white'><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableUser.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                </div>

                {#if formUserState.loading}
                    <MyLoading message="Get user data"/>
                {/if}
                {#if formUserState.add || formUserState.edit}
                    <form transition:fade={{duration:500}} class='grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border border-slate-300 rounded-lg bg-white'>
                        <MyInput type='text' title='Payroll' disabled={formUserState.edit} name="payroll" bind:value={formUserState.answer.payroll}/>
                        <MyInput type='text' title='Profile ID' name="profile_id" bind:value={formUserState.answer.profile_id}/>
                        <MyInput type='text' title='Card Number' name="user_id_mesin" bind:value={formUserState.answer.user_id_mesin}/>
                        <MyInput type='text' title='Name' name="name" bind:value={formUserState.answer.name}/>
                        {#if formUserState.add}
                        <MyInput type='password' password={true} title='Password' name="password" bind:value={formUserState.answer.password}/>
                        {/if}
                        <MyInput type='text' title='Jabatan' name="jabatan" bind:value={formUserState.answer.jabatan}/>
                        <MyInput type='text' title='Department' name="department" bind:value={formUserState.answer.department}/>
                        <MyInput type='text' title='Location' name="location" bind:value={formUserState.answer.location}/>
                        <MyInput type='text' title='Phone' name="phone" bind:value={formUserState.answer.phone}/>
                        <MyInput type='text' title='Email' name="email" bind:value={formUserState.answer.email}/>
                        <MyInput type='text' title='Signature' name="signature" bind:value={formUserState.answer.signature}/>
                    </form>
                {/if}

                <Datatable table={tableUser}>
                    <Table>
                        <TableHead class="bg-slate-500" >
                            <ThSort table={tableUser} field="payroll"><TableHeadCell>Profile ID</TableHeadCell></ThSort>
                            <ThSort table={tableUser} field="name"><TableHeadCell>Name</TableHeadCell></ThSort>
                            <ThSort table={tableUser} field="jabatan"><TableHeadCell>Jabatan</TableHeadCell></ThSort>
                            <ThSort table={tableUser} field="department"><TableHeadCell>Department</TableHeadCell></ThSort>
                            <ThSort table={tableUser} field="location"><TableHeadCell>Location</TableHeadCell></ThSort>
                            <ThSort table={tableUser} field="email"><TableHeadCell>Email</TableHeadCell></ThSort>
                            <ThSort table={tableUser} field=""><TableHeadCell>#</TableHeadCell></ThSort>
                        </TableHead>

                        <TableBody tableBodyClass="divide-y">
                            {#if tableUser.rows.length > 0}
                                {#each tableUser.rows as row}
                                    <TableBodyRow>
                                        <TableBodyCell>{row.payroll}</TableBodyCell>
                                        <TableBodyCell>{row.name}</TableBodyCell>
                                        <TableBodyCell>{row.jabatan}</TableBodyCell>
                                        <TableBodyCell>{row.department}</TableBodyCell>
                                        <TableBodyCell>{row.location}</TableBodyCell>
                                        <TableBodyCell>{row.email}</TableBodyCell>
                                        <TableBodyCell>
                                            <MyButton onclick={()=> formUserEdit(row.payroll)}><Pencil size={12} /></MyButton>
                                            <MyButton onclick={()=> formUserDelete(row.payroll)}><Trash size={12} /></MyButton>
                                        </TableBodyCell>
                                    </TableBodyRow>
                                {/each}
                            {:else}
                                <TableBodyRow>
                                    <TableBodyCell colspan={7}>
                                        {#if tableUser.isLoading}Loading {:else}No data available{/if}
                                    </TableBodyCell>
                                </TableBodyRow>
                            {/if}
                        </TableBody>
                    </Table>
                    {#if tableUser.rows.length > 0}
                    <div class="flex justify-between items-center gap-2 mt-3">
                        <p class='text-muted self-end text-[.9rem]'>
                            Showing {tableUser.rowCount.start} to {tableUser.rowCount.end} of {tableUser.rowCount.total} rows
                            <Badge color="dark" border>Page {tableUser.currentPage}</Badge>
                        </p>
                        <div class="flex gap-2">
                            <MyButton onclick={()=> tableUser.setPage(1)}><ChevronFirst size={16} /></MyButton>
                            <MyButton onclick={()=> tableUser.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                            {#each tableUser.pages as page}
                                <MyButton className={`text-muted text-[.9rem] px-3`} onclick={()=> tableUser.setPage(page)} type="button">{page}</MyButton>
                            {/each}
                            <MyButton onclick={()=> tableUser.setPage('next')}><ChevronRight size={16} /></MyButton>
                            <MyButton onclick={()=> tableUser.setPage('last')}><ChevronLast size={16} /></MyButton>
                        </div>
                    </div>
                    {/if}
                </Datatable>
            </div>
        </TabItem>
    </Tabs>
</main>