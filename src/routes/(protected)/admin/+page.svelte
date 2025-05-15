<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Tabs, TabItem, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Label, MultiSelect, Select, Checkbox, Badge, Alert, Modal, Button } from 'flowbite-svelte';
    import MyInput from '@lib/components/MyInput.svelte'
    import MyButton from '@lib/components/MyButton.svelte'
    import axios from 'axios'
    import {Plus, RefreshCw, Save, Ban, Pencil, Trash, Search, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Check, KeyRound } from '@lucide/svelte'
    import {formatTanggal, getParams, pecahArray} from '@lib/utils'
	import MyLoading from '@/MyLoading.svelte';
	import { Datatable, TableHandler, type State, ThSort } from '@vincjo/datatables/server';
    import bgadmin from '@lib/assets/bg-admin.jpg'
    import { page } from '$app/stores';
	import { getYear } from 'date-fns';
	import { z } from 'zod';
    import Svelecte from 'svelecte';
	import { fromZodError } from 'zod-validation-error';
	import { invalidateAll } from '$app/navigation';
	import { ProfileSchema, UserSchema, type TCalendarSchema, type TDeptSchema, type TProfileSchema, type TUserSchema } from '@lib/type.js';
    
    let {data} = $props()
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)

    const urlTab = $page.url.searchParams.get('tab')
    const urlMessage = $page.url.searchParams.get('message')

    const rowsPerPage = 10
    const listLevel = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => ({value : v, name : v}))
    
    const ListAccess = [
        {value:"C", name:"Create"},
        {value:"R", name:"Read"},
        {value:"U", name:"Update"},
        {value:"D", name:"Delete"},
    ]
    
    // Table Profile
    let tableProfile = $state(new TableHandler<TProfileSchema>([], {rowsPerPage}))
    let tableProfileSearch = tableProfile.createSearch()
    
    const formProfilAnswer = {
        answer:{
            profile_id: "id",
            name: "",
            description: "",
            level: "",
            user_hrd: false,
            access_sppd: [],
            access_skpd: [],
            access_spl: [],
            access_srl: [],
            access_cuti: [],
            access_ijin: [],
            access_attendance: [],
            access_calendar: [],
            access_user: [],
            access_profile: [],
            access_dept: [],
            access_setting: [],
            status:"",
        },
        success:"",
        error:"",
        modal:false,
        modalDelete:false,
        loading:false,
        add:false,
        edit:false,
    }
    
    let formProfileState = $state({...formProfilAnswer})
        
    const formProfileEdit = async (id:string) =>{
        try {
            formProfileState.edit = true
            formProfileState.success = ""
            formProfileState.error = ""
            const req = await axios.get(`/api/admin/profile/${id}`)
            const res = await req.data
            formProfileState.answer = {...res}
            Object.entries(res).map(([key, value]) => {
                if(key.startsWith("access_")) formProfileState.answer[key] = value.split("")
            })
            formProfileState.add = false
        } catch (error) {
        } finally {
        }
    }

    const formProfileSubmit = async () =>{
        try {
            formProfileState.loading = true
            Object.entries(formProfileState.answer).forEach(val=>{
                if(typeof val[1] === 'object'){
                    formProfileState.answer[val[0]] = val[1].join("")
                }
            })
            
            const isValid = ProfileSchema.safeParse(formProfileState.answer)
            if(isValid.success){
                formProfileState.loading = true
                const req = await axios.post('/api/admin/profile', formProfileState.answer)
                const res = await req.data
                await invalidateAll()
                formProfileBatal()
                tableProfile.invalidate()
                formProfileState.success = res.message
            }else{
                const err = fromZodError(isValid.error)
                formProfileState.success = ""
                formProfileState.error = err.message
            }
        } catch (error: any) {
            formProfileState.error = error.response.data.message
            formProfileState.success = ""
        } finally {
            formProfileState.loading = false
        }
    }

    const formProfileBatal = () => formProfileState = {...formProfilAnswer}
    
    const formProfileDelete = async (id: string) =>{
        try {
            formProfileState.loading = true
            const req = await axios.delete(`/api/admin/profile/${id}`)
            const res = await req.data
            tableProfile.invalidate()
            formProfileState.success = res.message
        } catch (error: any) {
            formProfileState.error = error.response.data.message
            formProfileState.success = ""
        }finally{
            formProfileState.loading = false
        }
    }
    
    // user
    let tableUser = $state(new TableHandler<TUserSchema>([], {rowsPerPage}))
    let tableUserSearch = tableUser.createSearch()
    
    const formUserAnswer = {
        answer:{
            payroll:"",
            profile_id:"",
            user_id_machine:"",
            name:"",
            password:"",
            position:"",
            department:"",
            location:"",
            phone:"",
            workhour: 8,
            overtime: false,
            start_work: "",
            email:"",
            approver: "",
            substitute: "",
            join_date: "",
            signature: [],
            status:"",
        },
        success:"",
        error:"",
        modalDelete:false,
        modalChangePassword:false,
        loading:false,
        add:false,
        edit:false,
    }
    
    let formUserState = $state({...formUserAnswer})

    const formUserEdit = async (id:string) =>{
        try {
            formUserState.loading = true
            formUserState.success = ""
            formUserState.error = ""
            const req = await axios.get(`/api/admin/user/${id}`)
            formUserState.answer = {...await req.data}
            setTimeout(()=>{
                formUserState.answer.start_work = formatTanggal(req.data.start_work, "time")
                formUserState.answer.join_date = formatTanggal(req.data.join_date, "date")
            }, 100)
            formUserState.edit = true
            formUserState.add = false
            formUserState.loading = false
        } catch (error) {
            formUserState.loading = false 
        }
    }
    
    const formUserSubmit = async () =>{
        try {        
            formUserState.loading = true
            const valid = UserSchema.omit({
                password: true,
            })
            if(formUserState.add){
                valid.extend({ password: z.string().trim().min(1) })
            }

            const formData = new FormData()
            Object.entries(formUserState.answer).forEach(val=>{
                formData.append(val[0], val[1])
            })  
            
            const isValid = valid.safeParse(formUserState.answer)
            if(isValid.success){
                const req = await axios.post('/api/admin/user', formData)
                const res = await req.data
                await invalidateAll()
                formUserBatal()
                tableUser.invalidate()
                formUserState.success = res.message
            }else{
                const err = fromZodError(isValid.error)
                formUserState.success = ""
                formUserState.error = err.message
            }
        } catch (error: any) {
            formUserState.error = error.response.data.message
            formUserState.success = ""
        } finally {
            formUserState.loading = false
        }
    }

    const formUserBatal = () => formUserState = {...formUserAnswer}

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

    const formUserChangePassword = async (id:string) =>{
        try {
            formUserState.error = ""
            formUserState.loading = true
            const req = await axios.post(`/api/admin/user/${id}/password`, {
                payroll: formUserState.answer.payroll,
                password: formUserState.answer.password,
            })
            const res = await req.data
            formUserBatal()
            formUserState.success = res.message
        } catch (error) {
            formUserState.error = ""
            formUserState.success = ""
        }finally{
            tableUser.invalidate()
            formUserState.loading = false
        }
    }

    // Dept
    let tableDept = $state(new TableHandler<TDeptSchema>([], {rowsPerPage}))
    let tableDeptSearch = tableDept.createSearch()
    
    const formDeptAnswer = {
        answer:{
            dept_id:"id",
            dept_code:"",
            name:"",
            initial:"",
            status:"",
        },
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    }
    
    let formDeptState = $state({...formDeptAnswer})

    const formDeptEdit = async (id:string) =>{
        try {
            formDeptState.loading = true
            formDeptState.success = ""
            formDeptState.error = ""
            const req = await axios.get(`/api/admin/dept/${id}`)
            formDeptState.answer = {...await req.data}
            formDeptState.edit = true
            formDeptState.add = false
            formDeptState.loading = false
        } catch (error) {
            formDeptState.loading = false 
        }
    }
    
    const formDeptSubmit = async () =>{
        try {
            formDeptState.loading = true
            const valid = z.object({               
                name: z.string().trim().min(1),
                dept_code: z.string().trim().length(4),
                initial: z.string().trim().min(1).max(10),
                status: z.string().trim().min(1),
            })
            
            const isValid = valid.safeParse(formDeptState.answer)
            if(isValid.success){
                const req = await axios.post('/api/admin/dept', formDeptState.answer)
                const res = await req.data
                formDeptBatal()
                tableDept.invalidate()
                formDeptState.success = res.message
            } else {
                const err = fromZodError(isValid.error)
                formDeptState.success = ""
                formDeptState.error = err.message
            }
        } catch (error: any) {
            formDeptState.error = error.response.data.message
            formDeptState.success = ""
        } finally {
            formDeptState.loading = false
        }
    }

    const formDeptBatal = () => formDeptState = {...formDeptAnswer}

    // setting    
    const formSettingState = $state({
        answer:{
            setting_id:"id",
            start_periode: 1,
            end_periode: 1,
        },
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    })

    const getSetting = async () =>{
        const req = await fetch('/api/admin/setting')
        const res = await req.json()
        if(res){
            formSettingState.answer.start_periode = res.start_periode
            formSettingState.answer.end_periode = res.end_periode
            return res
        }
    }

    const formSettingSubmit = async () =>{
        try {
            formSettingState.loading = true

            const valid = z.object({               
                start_periode: z.number().min(1).max(31),
                end_periode: z.number().min(1).max(31),
            })
            
            const isValid = valid.safeParse(formSettingState.answer)
            if(isValid.success){
                const req = await axios.post('/api/admin/setting', formSettingState.answer)
                const res = await req.data
                formSettingState.error = ""
                formSettingState.success = res.message
            } else {
                const err = fromZodError(isValid.error)
                formSettingState.success = ""
                formSettingState.error = err.message
            }
        } catch (error: any) {
            formSettingState.error = error.message
            formSettingState.success = ""
        } finally {
            formSettingState.loading = false
        }
    }

    // Calendar
    let tableCalendar = $state(new TableHandler<TCalendarSchema>([], {rowsPerPage}))
    let tableCalendarSearch = tableCalendar.createSearch()

    const formCalendarAnswer = {
        answer:{
            calendar_id:"id",
            description:"",
            type:"",
            date:"",
            get createdBy() {return user?.payroll}
        },
        year: getYear(new Date()),
        success:"",
        error:"",
        modalDelete:false,
        loading:false,
        add:false,
        edit:false,
    }
    
    let formCalendar = $state({...formCalendarAnswer})
    
    const formCalendarSubmit = async () =>{
        try {
            formCalendar.loading = true
            const valid = z.object({               
                description: z.string().trim().min(1).max(255),
                type: z.string().trim().min(1),
                date: z.string().trim().length(10),
            })
            const isValid = valid.safeParse(formCalendar.answer)
            if(isValid.success){
                const req = await axios.post('/api/admin/calendar', formCalendar.answer)
                const res = await req.data
                formCalendarBatal()
                tableCalendar.invalidate()
                formCalendar.success = res.message
            } else {
                const err = fromZodError(isValid.error)
                formCalendar.success = ""
                formCalendar.error = err.message
            }
        } catch (error: any) {
            formCalendar.error = error.response.data.message
            formCalendar.success = ""
        } finally {
            formCalendar.loading = false
        }
    }

    const formCalendarEdit = async (id:string) =>{
        try {
            formCalendar.loading = true
            formCalendar.success = ""
            formCalendar.error = ""
            const req = await fetch(`/api/admin/calendar/${id}`)
            const res = await req.json()
            formCalendar.answer = {...res}

            formCalendar.answer.type = res.type.replace('_',' ')
            setTimeout(()=>{
                formCalendar.answer.date = formatTanggal(res.date, "date")
            }, 100)
            formCalendar.edit = true
            formCalendar.add = false
            formCalendar.loading = false
        } catch (error) {
            formCalendar.loading = false 
        }
    }

    const formCalendarDelete = async (id: string) => {
        try {
            formCalendar.error = ""
            formCalendar.loading = true
            const req = await axios.delete(`/api/admin/calendar/${id}`)
            const res = await req.data
            formCalendar.success = res.message
            tableCalendar.invalidate()
        } catch (error) {
            formCalendar.error = ""
            formCalendar.success = ""
        }finally{
            formCalendar.loading = false
        }
    }
    
    const formCalendarBatal = () => formCalendar = {...formCalendarAnswer}

    const getUser = async (val: string = "") =>{
        const req = await fetch(`/api/data?type=user_by_dept&val=${val || ""}`)
        return await req.json()
    }
    
    const getDept = async () =>{
        const req = await fetch('/api/data?type=dept')
        const res = await req.json()
        return res
    }

    const getProfile = async () =>{
        const req = await fetch('/api/data?type=profile')
        const res = await req.json()
        return res
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

        tableDept.load(async(state: State) => {
            try {
                const req = await fetch(`/api/admin/dept?${getParams(state)}`);
                if (!req.ok) throw new Error('Gagal mengambil data');
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        tableCalendar.load(async(state: State) => {
            try {
                const req = await fetch(`/api/admin/calendar?${getParams(state)}&year=${formCalendar.year}`);
                if (!req.ok) throw new Error('Gagal mengambil data');
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })
    })
    
    setTimeout(()=>{
        if (pecahArray(userProfile?.access_profile, "R"))tableProfile.invalidate()
        if (pecahArray(userProfile?.access_user, "R")) tableUser.invalidate()
        if (pecahArray(userProfile?.access_dept, "R")) tableDept.invalidate()
        if (pecahArray(userProfile?.access_calendar, "R")) tableCalendar.invalidate()
    }, 1000)
</script>

<svelte:head>
    <title>Admin</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    {#if urlTab}
        <Alert class='my-2'>
            <span>{urlMessage}</span>
        </Alert>
    {/if}

    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="Dashboard">
            <div class="relative flex items-center justify-center min-h-[70vh]" style={`background-image: url(${bgadmin}); background-size: cover; background-position:bottom`}>
                <span class='text-white bg-slate-600/[.7] p-3 rounded-lg'>Hallo admin</span>
            </div>
        </TabItem>
        {#if pecahArray(userProfile?.access_profile, "R")}
            <TabItem title="Profile">
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                    {#if formProfileState.error}
                        {#each formProfileState.error.split(';') as v}
                            <Alert dismissable>
                                <span>{v}</span>
                            </Alert>
                        {/each}
                    {:else if formProfileState.success}
                        <Alert border color="green" dismissable>
                            <span>{formProfileState.success}</span>
                        </Alert>
                    {/if}

                    {#if pecahArray(userProfile?.access_profile, "C") || pecahArray(userProfile?.access_profile, "U")}
                        <div class="flex gap-2">                        
                            {#if formProfileState.add || formProfileState.edit}
                                <MyButton onclick={formProfileBatal}><Ban size={16} /></MyButton>
                                <MyButton disabled={formProfileState.loading} onclick={formProfileSubmit}><Save size={16}/></MyButton>
                            {:else}
                                <MyButton onclick={()=> formProfileState.add = true}><Plus size={16}/></MyButton>
                            {/if}
                        </div>
                    {/if}

                    {#if formProfileState.loading}
                        <MyLoading message="Load data"/>
                    {/if}
                    {#if formProfileState.add || formProfileState.edit}
                        <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                            <input type='hidden' name="profile_id" disabled={formProfileState.edit} bind:value={formProfileState.answer.profile_id}/>
                            <div class="flex flex-col md:flex-row gap-4">
                                <div class="flex flex-col gap-2 flex-1">
                                    <MyInput type='text'  title='Nama' name="name" bind:value={formProfileState.answer.name}/>
                                    <Checkbox class='' bind:checked={formProfileState.answer.user_hrd as unknown as boolean}>User HRD</Checkbox>
                                </div>
                                <MyInput type='textarea' title='Description' rows={4} name="description" bind:value={formProfileState.answer.description}/>
                            </div>
                            
                            <div class="flex flex-col gap-2">
                                <Label for='level'>Level</Label>
                                <Select name='level' items={listLevel} bind:value={formProfileState.answer.level} />
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
                                    <Label>Access Ijin</Label>
                                    <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_ijin} />
                                </div>
                                <div class="flex flex-col gap-2">
                                    <Label>Access Attendance</Label>
                                    <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_attendance} />
                                </div>
                                <div class="flex flex-col gap-2">
                                    <Label>Access Calendar (Admin)</Label>
                                    <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_calendar} />
                                </div>
                                <div class="flex flex-col gap-2">
                                    <Label>Access User (Admin)</Label>
                                    <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_user} />
                                </div>
                                <div class="flex flex-col gap-2">
                                    <Label>Access Profile (Admin)</Label>
                                    <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_profile} />
                                </div>
                                <div class="flex flex-col gap-2">
                                    <Label>Access Department (Admin)</Label>
                                    <MultiSelect size="md" items={ListAccess} bind:value={formProfileState.answer.access_dept} />
                                </div>
                                <div class="flex flex-col gap-2">
                                    <Label>Access Setting (Admin)</Label>
                                    <MultiSelect items={ListAccess} bind:value={formProfileState.answer.access_setting} />
                                </div>

                                <div class="flex flex-col gap-2">
                                    <Label for='level'>Status</Label>
                                    <Select name='level' items={[
                                        {value:"Aktif", name:"Aktif"},
                                        {value:"Nonaktif", name:"Nonaktif"},
                                    ]} bind:value={formProfileState.answer.status} />
                                </div>
                            </div>
                        </form>
                    {/if}
                    
                    <div class="flex gap-2">
                        <select bind:value={tableProfile.rowsPerPage} onchange={() => tableProfile.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                        <MyInput type='text' bind:value={tableProfileSearch.value}/>
                        <MyButton onclick={()=>tableProfileSearch.set()}><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableProfile.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                    
                    <Datatable table={tableProfile}>
                        <Table >
                            <TableHead>
                                <ThSort table={tableProfile} field="name">Name</ThSort>
                                <ThSort table={tableProfile} field="description">Description</ThSort>
                                <ThSort table={tableProfile} field="user_hrd">User HRD</ThSort>
                                <ThSort table={tableProfile} field="level">Level</ThSort>
                                <ThSort table={tableProfile} field="">#</ThSort>
                            </TableHead>

                            {#if tableProfile.isLoading}
                                <div class="flex p-4 items-center">
                                    <MyLoading message="Loading data"/>
                                </div>
                            {:else}
                                <TableBody tableBodyClass="divide-y">
                                    {#if tableProfile.rows.length > 0}
                                        {#each tableProfile.rows as row}
                                            <TableBodyRow class='h-10'>
                                                <TableBodyCell class='bg-bgdark text-textdark'>{row.name}</TableBodyCell>
                                                <TableBodyCell>{row.description}</TableBodyCell>
                                                <TableBodyCell>{row.user_hrd ? "Yes": "No"}</TableBodyCell>
                                                <TableBodyCell>{row.level}</TableBodyCell>
                                                <TableBodyCell>
                                                    {#if !formProfileState.edit}
                                                        {#if pecahArray(userProfile.access_profile, "U")}
                                                            <MyButton onclick={()=> formProfileEdit(row.profile_id)}><Pencil size={12} /></MyButton>
                                                        {/if}
                                                        {#if pecahArray(userProfile.access_profile, "D")}
                                                            <MyButton onclick={()=> {
                                                                formProfileState.answer.profile_id = row.profile_id
                                                                formProfileState.modalDelete = true
                                                            }}><Trash size={12} /></MyButton>
                                                        {/if}
                                                    {/if}
                                                </TableBodyCell>
                                            </TableBodyRow>
                                        {/each}
                                    {:else}
                                        <TableBodyRow class='h-10'>
                                            <TableBodyCell colspan={10}>No data available</TableBodyCell>
                                        </TableBodyRow>
                                    {/if}
                                </TableBody>
                            {/if}
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
                                        <MyButton className={`text-muted text-[.9rem] px-3 ${tableProfile.currentPage == page ? "bg-bgactive" :""}`} onclick={()=> tableProfile.setPage(page)} type="button">{page}</MyButton>
                                    {/each}
                                    <MyButton onclick={()=> tableProfile.setPage('next')}><ChevronRight size={16} /></MyButton>
                                    <MyButton onclick={()=> tableProfile.setPage('last')}><ChevronLast size={16} /></MyButton>
                                </div>
                            </div>
                        {/if}
                    </Datatable>
                </div>

                <Modal title={'Delete Profile'} bind:open={formProfileState.modalDelete} autoclose>
                    <Button color='green' onclick={()=> formProfileDelete(formProfileState.answer.profile_id)}>Yes</Button>
                    <Button color='red' onclick={()=> formProfileState.modalDelete = false}>No</Button>
                </Modal>
            </TabItem>
        {/if}
        {#if pecahArray(userProfile?.access_user, "R")}
            <TabItem title="User">
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                    {#if formUserState.error}
                        {#each formUserState.error.split(';') as v}
                            <Alert dismissable>
                                <span>{v}</span>
                            </Alert>
                        {/each}
                    {:else if formUserState.success}
                        <Alert border color="green" dismissable>
                            <span>{formUserState.success}</span>
                        </Alert>
                    {/if}
                    
                    {#if pecahArray(userProfile?.access_user, "C") || pecahArray(userProfile.access_user, "U")}
                        <div class="flex gap-2">                        
                            {#if formUserState.add || formUserState.edit}
                                <MyButton onclick={formUserBatal}><Ban size={16} /></MyButton>
                                <MyButton onclick={formUserSubmit}><Save size={16}/></MyButton>
                            {:else}
                                <MyButton onclick={()=> formUserState.add = true}><Plus size={16}/></MyButton>
                            {/if}
                        </div>
                    {/if}

                    {#if formUserState.loading}
                        <MyLoading message="Load data"/>
                    {/if}
                    {#if formUserState.add || formUserState.edit}
                        <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg' enctype="multipart/form-data">
                            <span class="border-b-[1px] border-slate-300 pb-2">Basic</span>
                            <div class="grid grid-cols-2 gap-4 p-4 border-[1px] border-slate-300">
                                <!-- <hr> -->
                                <MyInput type='text' title='Payroll' disabled={formUserState.edit} name="payroll" bind:value={formUserState.answer.payroll}/>

                                {#await getProfile() then val}
                                    <div class="flex flex-col gap-2">
                                        <Label>Profile ID</Label>
                                        <Svelecte class='border-none' optionClass='p-2' name='profile_id' required searchable selectOnTab multiple={false} bind:value={formUserState.answer.profile_id} 
                                            options={val.map((v:any) => ({value: v.profile_id, text:v.name }))}/>
                                    </div>
                                {/await}
                                <MyInput type='text' title='Name' name="name" bind:value={formUserState.answer.name}/>

                                {#if formUserState.add}
                                    <MyInput type='password' password={true} title='Password' name="password" bind:value={formUserState.answer.password}/>
                                {/if}

                                <MyInput type='text' title='Email' name="email" bind:value={formUserState.answer.email}/>
                                <MyInput type='text' title='Position' name="position" bind:value={formUserState.answer.position}/>

                                {#await getDept() then val}
                                    <div class="flex flex-col gap-2">
                                        <Label>Department</Label>
                                        <Svelecte class='border-none' optionClass='p-2' name='department' required searchable selectOnTab multiple={false} bind:value={formUserState.answer.department} 
                                        options={val.map((v:any) => ({value: v.dept_code, text:v.name }))}/>
                                    </div>
                                {/await}
                                
                                <MyInput type='text' title='Location' name="location" bind:value={formUserState.answer.location}/>
                                <MyInput type='text' title='Phone' name="phone" bind:value={formUserState.answer.phone}/>
                                <MyInput type='date' title='Join Date' name="join_date" bind:value={formUserState.answer.join_date}/>
                            </div>

                            <span class="border-b-[1px] border-slate-300 pb-2">Basic</span>
                            <div class="grid grid-cols-2 gap-4 p-4 border-[1px] border-slate-200">
                                <MyInput type='time' title='Start Work' name="start_work" bind:value={formUserState.answer.start_work}/>
                                <MyInput type='number' title='Workhour' name="workhour" bind:value={formUserState.answer.workhour}/>
                                <Checkbox bind:checked={formUserState.answer.overtime as unknown as boolean}>Overtime</Checkbox>
                                <MyInput type='text' title='Card Number' name="user_id_machine" bind:value={formUserState.answer.user_id_machine}/>
    
                                {#await getUser()}
                                    <MyLoading message="Loading data"/>
                                {:then val}
                                    <div class="flex flex-1 flex-col gap-2">
                                        <Label>Approver</Label>
                                        <Svelecte class='border-none' optionClass='p-2' name='approver' required searchable selectOnTab multiple={false} bind:value={formUserState.answer.approver} 
                                        options={val.map((v:any) => ({value: v.payroll, text: v.payroll + " - " + v.name }))}/>
                                    </div>
                                    <div class="flex flex-1 flex-col gap-2">
                                        <Label>Substitute</Label>
                                        <Svelecte class='border-none' optionClass='p-2' name='substitute' required searchable selectOnTab multiple={false} bind:value={formUserState.answer.substitute} 
                                        options={val.map((v:any) => ({value: v.payroll, text: v.payroll + " - " + v.name }))}/>
                                    </div>
                                {/await}
    
                                <div class="flex flex-col gap-2">
                                    <Label>Signature</Label>
                                    <input class="border" type="file" accept=".jpg" onchange={e => formUserState.answer.signature = e.target.files[0]}/>
                                </div>
                                
                                <div class="flex flex-col gap-2">
                                    <Label for='level'>Status</Label>
                                    <Select name='level' items={[
                                        {value:"Aktif", name:"Aktif"},
                                        {value:"Nonaktif", name:"Nonaktif"},
                                    ]} bind:value={formUserState.answer.status} />
                                </div>
                            </div>
                            
                        </form>
                    {/if}

                    <div class="flex gap-2">
                        <select bind:value={tableUser.rowsPerPage} onchange={() => tableUser.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                        <MyInput type='text' bind:value={tableUserSearch.value}/>
                        <MyButton onclick={()=>tableUserSearch.set()}><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableUser.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>

                    <Datatable table={tableUser}>
                        <Table>
                            <TableHead>
                                <ThSort table={tableUser} field="payroll"><TableHeadCell>Payroll</TableHeadCell></ThSort>
                                <ThSort table={tableUser} field="name"><TableHeadCell>Name</TableHeadCell></ThSort>
                                <ThSort table={tableUser} field="position"><TableHeadCell>Position</TableHeadCell></ThSort>
                                <ThSort table={tableUser} field="department"><TableHeadCell>Department</TableHeadCell></ThSort>
                                <ThSort table={tableUser} field="location"><TableHeadCell>Location</TableHeadCell></ThSort>
                                <ThSort table={tableUser} field="email"><TableHeadCell>Email</TableHeadCell></ThSort>
                                <ThSort table={tableUser} field=""><TableHeadCell>#</TableHeadCell></ThSort>
                            </TableHead>

                            {#if tableUser.isLoading}
                                <div class="flex p-4 items-center">
                                    <MyLoading message="Loading data"/>
                                </div>
                            {:else}
                                <TableBody tableBodyClass="divide-y">
                                    {#if tableUser.rows.length > 0}
                                        {#each tableUser.rows as row}
                                            <TableBodyRow class='h-10'>
                                                <TableBodyCell>{row.payroll}</TableBodyCell>
                                                <TableBodyCell>{row.name}</TableBodyCell>
                                                <TableBodyCell>{row.position}</TableBodyCell>
                                                <TableBodyCell>{row.dept}</TableBodyCell>
                                                <TableBodyCell>{row.location}</TableBodyCell>
                                                <TableBodyCell>{row.email}</TableBodyCell>
                                                <TableBodyCell>
                                                    {#if !formUserState.edit}
                                                        {#if pecahArray(userProfile.access_user, "U")}
                                                            <MyButton onclick={()=> formUserEdit(row.payroll)}><Pencil size={12} /></MyButton>
                                                        {/if}
                                                        {#if pecahArray(userProfile.access_user, "D")}
                                                            <MyButton onclick={()=> {
                                                                formUserState.answer.payroll = row.payroll
                                                                formUserState.modalDelete = true
                                                            }}><Trash size={12} /></MyButton>
                                                        {/if}
                                                        <MyButton onclick={()=> {
                                                            formUserState.answer.payroll = row.payroll
                                                            formUserState.modalChangePassword = true
                                                        }}><KeyRound size={12} /></MyButton>
                                                    {/if}
                                                </TableBodyCell>
                                            </TableBodyRow>
                                        {/each}
                                    {:else}
                                        <TableBodyRow class='h-10'>
                                            <TableBodyCell colspan={10}>No data available</TableBodyCell>
                                        </TableBodyRow>
                                    {/if}
                                </TableBody>
                            {/if}
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
                                        <MyButton className={`text-muted text-[.9rem] px-3 ${tableUser.currentPage == page ? "bg-bgactive" :""}`} onclick={()=> tableUser.setPage(page)} type="button">{page}</MyButton>
                                    {/each}
                                    <MyButton onclick={()=> tableUser.setPage('next')}><ChevronRight size={16} /></MyButton>
                                    <MyButton onclick={()=> tableUser.setPage('last')}><ChevronLast size={16} /></MyButton>
                                </div>
                            </div>
                        {/if}
                    </Datatable>
                </div>

                <Modal title={`Delete User ${formUserState.answer.payroll}`} bind:open={formUserState.modalDelete} autoclose>
                    <Button color='green' onclick={()=> formUserDelete(formUserState.answer.payroll)}>Yes</Button>
                    <Button color='red' onclick={()=> formUserState.modalDelete = false}>No</Button>
                </Modal>                
                
                <Modal title={`Change password ${formUserState.answer.payroll}`} bind:open={formUserState.modalChangePassword} autoclose>
                    <div class="flex flex-col gap-6">
                        <MyInput type='password' title='New Password' name="password" bind:value={formUserState.answer.password}/>
                    </div>
                    <svelte:fragment slot="footer">
                        <Button color='green' onclick={()=> formUserChangePassword(formUserState.answer.payroll)}>Change Password</Button>
                        <Button color='red' onclick={()=> formUserState.modalDelete = false}>No</Button>
                    </svelte:fragment>
                </Modal>
            </TabItem>
        {/if}
        {#if pecahArray(userProfile?.access_dept, "R")}
            <TabItem title="Department">
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                    {#if formDeptState.error}
                        {#each formDeptState.error.split(';') as v}
                            <Alert dismissable>
                                <span>{v}</span>
                            </Alert>
                        {/each}
                    {:else if formDeptState.success}
                        <Alert border color="green" dismissable>
                            <span>{formDeptState.success}</span>
                        </Alert>
                    {/if}

                    {#if pecahArray(userProfile?.access_dept, "C") || pecahArray(userProfile?.access_dept, "U")}
                        <div class="flex gap-2">                        
                            {#if formDeptState.add || formDeptState.edit}
                                <MyButton onclick={formDeptBatal}><Ban size={16} /></MyButton>
                                <MyButton onclick={formDeptSubmit}><Save size={16}/></MyButton>
                            {:else}
                                <MyButton onclick={()=> formDeptState.add = true}><Plus size={16}/></MyButton>
                            {/if}
                        </div>
                    {/if}

                    {#if formDeptState.loading}
                        <MyLoading message="Load data"/>
                    {/if}
                    {#if formDeptState.add || formDeptState.edit}
                        <form transition:fade={{duration:500}} class='grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border border-slate-300 rounded-lg'>
                            <input type='hidden' name="Dept ID" disabled={formDeptState.edit} bind:value={formDeptState.answer.dept_id}/>
                            <MyInput type='text' title='Dept Code' name="dept_code" bind:value={formDeptState.answer.dept_code}/>
                            <MyInput type='text' title='Name' name="name" bind:value={formDeptState.answer.name}/>
                            <div class="flex flex-col">
                                <MyInput type='text' title='Initial' name="initial" bind:value={formDeptState.answer.initial}/>
                                <span class="italic text-[.8rem]">For document purpose</span>
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label>Status</Label>
                                <select bind:value={formDeptState.answer.status}>
                                    {#each ['Aktif', 'Nonaktif'] as option}
                                        <option value={option}>{option}</option>
                                    {/each}
                                </select>
                            </div>
                        </form>
                    {/if}
                    
                    <div class="flex gap-2">
                        <select bind:value={tableDept.rowsPerPage} onchange={() => tableDept.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                        <MyInput type='text' bind:value={tableDeptSearch.value}/>
                        <MyButton onclick={()=>tableDeptSearch.set()}><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableDept.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                    
                    <Datatable table={tableDept}>
                        <Table>
                            <TableHead>
                                <ThSort table={tableDept} field="dept_code"><TableHeadCell>Dept Code</TableHeadCell></ThSort>
                                <ThSort table={tableDept} field="name"><TableHeadCell>Name</TableHeadCell></ThSort>
                                <ThSort table={tableDept} field="initial"><TableHeadCell>Initial</TableHeadCell></ThSort>
                                <ThSort table={tableDept} field="status"><TableHeadCell>Status</TableHeadCell></ThSort>
                                <ThSort table={tableDept} field=""><TableHeadCell>#</TableHeadCell></ThSort>
                            </TableHead>

                            {#if tableDept.isLoading}
                                <div class="flex p-4 items-center">
                                    <MyLoading message="Loading data"/>
                                </div>
                            {:else}
                                <TableBody tableBodyClass="divide-y">
                                    {#if tableDept.rows.length > 0}
                                        {#each tableDept.rows as row}
                                            <TableBodyRow class='h-10'>
                                                <TableBodyCell>{row.dept_code}</TableBodyCell>
                                                <TableBodyCell>{row.name}</TableBodyCell>
                                                <TableBodyCell>{row.initial}</TableBodyCell>
                                                <TableBodyCell>{row.status}</TableBodyCell>
                                                <TableBodyCell>
                                                    {#if !formDeptState.edit}
                                                        {#if pecahArray(userProfile?.access_dept, "U")}
                                                            <MyButton onclick={()=> formDeptEdit(row.dept_id)}><Pencil size={12} /></MyButton>
                                                        {/if}
                                                    {/if}
                                                </TableBodyCell>
                                            </TableBodyRow>
                                        {/each}
                                    {:else}
                                        <TableBodyRow class='h-10'>
                                            <TableBodyCell colspan={10}>No data available</TableBodyCell>
                                        </TableBodyRow>
                                    {/if}
                                </TableBody>
                            {/if}
                        </Table>
                        {#if tableDept.rows.length > 0}
                            <div class="flex justify-between items-center gap-2 mt-3">
                                <p class='text-muted self-end text-[.9rem]'>
                                    Showing {tableDept.rowCount.start} to {tableDept.rowCount.end} of {tableDept.rowCount.total} rows
                                    <Badge color="dark" border>Page {tableDept.currentPage}</Badge>
                                </p>
                                <div class="flex gap-2">
                                    <MyButton onclick={()=> tableDept.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                    <MyButton onclick={()=> tableDept.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                    {#each tableDept.pages as page}
                                        <MyButton className={`text-muted text-[.9rem] px-3`} onclick={()=> tableDept.setPage(page)} type="button">{page}</MyButton>
                                    {/each}
                                    <MyButton onclick={()=> tableDept.setPage('next')}><ChevronRight size={16} /></MyButton>
                                    <MyButton onclick={()=> tableDept.setPage('last')}><ChevronLast size={16} /></MyButton>
                                </div>
                            </div>
                        {/if}
                    </Datatable>
                </div>
            </TabItem>
        {/if}
        {#if pecahArray(userProfile?.access_setting, "R")}
            <TabItem title="Setting" open={urlTab == 'setting'}>
                <div class="flex flex-col gap-4">                
                    {#if formSettingState.error}
                        {#each formSettingState.error.split(';') as v}
                            <Alert dismissable>
                                <span>{v}</span>
                            </Alert>
                        {/each}
                    {:else if formSettingState.success}
                        <Alert border color="green" dismissable>
                            <span>{formSettingState.success}</span>
                        </Alert>
                    {/if}

                    {#await getSetting()}
                        <MyLoading message="Loading setting data"/>
                    {:then v}
                        {#if pecahArray(userProfile?.access_setting, "C") || pecahArray(userProfile?.access_setting, "U")}
                            <div class="flex flex-col gap-2 rounded-lg p-4 border-[2px] border-slate-300">
                                <div class="flex justify-between gap-2">
                                    <MyButton onclick={formSettingSubmit}><Save size={16}/></MyButton>
                                    <MyButton onclick={getSetting}><RefreshCw size={16}/></MyButton>
                                </div>
                            </div>

                            <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border-[2px] border-slate-300 rounded-lg'>
                                <MyInput type='number' title='Start Periode' name="start_periode" bind:value={formSettingState.answer.start_periode}/>
                                <MyInput type='number' title='End Periode' name="end_periode" bind:value={formSettingState.answer.end_periode}/>
                            </form>
                        {/if}
                    {/await}
                </div>
            </TabItem>
        {/if}
        {#if pecahArray(userProfile?.access_calendar, "R")}
            <TabItem title="Calendar">
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                    <div class="flex flex-col gap-4">                
                        {#if formCalendar.error}
                            {#each formCalendar.error.split(';') as v}
                                <Alert dismissable>
                                    <span>{v}</span>
                                </Alert>
                            {/each}
                        {:else if formCalendar.success}
                            <Alert border color="green" dismissable>
                                <span>{formCalendar.success}</span>
                            </Alert>
                        {/if}
                        
                        {#if pecahArray(userProfile?.access_calendar, "C") || pecahArray(userProfile?.access_calendar, "U")}
                            <div class="flex gap-2">                        
                                {#if formCalendar.add || formCalendar.edit}
                                    <MyButton onclick={formCalendarBatal}><Ban size={16} /></MyButton>
                                    <MyButton onclick={formCalendarSubmit}><Save size={16}/></MyButton>
                                {:else}
                                    <MyButton onclick={()=> formCalendar.add = true}><Plus size={16}/></MyButton>
                                {/if}
                            </div>
                        {/if}

                        {#if formCalendar.loading}
                            <MyLoading message="Load data"/>
                        {/if}
                        {#if formCalendar.add || formCalendar.edit}
                            <form transition:fade={{duration:500}} class='grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border border-slate-300 rounded-lg'>
                                <MyInput type='date' title='Date' name="date" bind:value={formCalendar.answer.date}/>
                                <div class="flex flex-col gap-2">
                                    <Label>Type</Label>
                                    <select bind:value={formCalendar.answer.type}>
                                        {#each ['Hari Libur', 'Cuti Bersama', 'Event Kantor'] as option}
                                        <option value={option}>{option}</option>
                                        {/each}
                                    </select>
                                </div>
                                <MyInput type='textarea' title='Description' name="description" bind:value={formCalendar.answer.description}/>
                            </form>
                        {/if}
                        
                        <div class="flex gap-2">
                            <select bind:value={tableCalendar.rowsPerPage} onchange={() => tableCalendar.setPage(1)}>
                                {#each [10, 20, 50, 100] as option}
                                    <option value={option}>{option}</option>
                                {/each}
                            </select>
                            <select bind:value={formCalendar.year} onchange={()=>tableCalendar.invalidate()}>
                                {#each [2024,2025] as option}
                                    <option value={option}>{option}</option>
                                {/each}
                            </select>
                            <MyInput type='text' bind:value={tableCalendarSearch.value}/>
                            <MyButton onclick={()=>tableCalendarSearch.set()}><Search size={16} /></MyButton>
                            <MyButton onclick={()=>tableCalendar.invalidate()}><RefreshCw size={16}/></MyButton>
                        </div>

                        <Datatable table={tableCalendar}>
                            <Table>
                                <TableHead>
                                    <ThSort table={tableCalendar} field="type">Type</ThSort>
                                    <ThSort table={tableCalendar} field="description">Description</ThSort>
                                    <ThSort table={tableCalendar} field="date">Date</ThSort>
                                    <ThSort table={tableCalendar} field="calendar_id">#</ThSort>
                                </TableHead>

                                {#if tableCalendar.isLoading}
                                    <div class="flex p-4 items-center">
                                        <MyLoading message="Loading data"/>
                                    </div>
                                {:else}
                                    <TableBody tableBodyClass="divide-y">
                                        {#if tableCalendar.rows.length > 0}
                                            {#each tableCalendar.rows as row}
                                                <TableBodyRow class='h-10'>
                                                    <TableBodyCell>{row.type}</TableBodyCell>
                                                    <TableBodyCell>{row.description}</TableBodyCell>
                                                    <TableBodyCell>{formatTanggal(row.date, 'date')}</TableBodyCell>
                                                    <TableBodyCell>
                                                        {#if !formCalendar.edit}
                                                            {#if pecahArray(userProfile?.access_calendar, "U")}
                                                                <MyButton onclick={()=> formCalendarEdit(row.calendar_id)}><Pencil size={12} /></MyButton>
                                                            {/if}
                                                            {#if pecahArray(userProfile?.access_calendar, "D")}
                                                                <MyButton onclick={()=> {
                                                                    formCalendar.answer.calendar_id = row.calendar_id
                                                                    formCalendar.modalDelete = true
                                                                }}><Trash size={12} /></MyButton>
                                                            {/if}
                                                        {/if}
                                                        <!-- <MyButton onclick={()=> formCalendarDelete(row.calendar_id)}><Trash size={12} /></MyButton> -->
                                                    </TableBodyCell>
                                                </TableBodyRow>
                                            {/each}
                                        {:else}
                                            <TableBodyRow class='h-10'>
                                                <TableBodyCell colspan={10}>No data available</TableBodyCell>
                                            </TableBodyRow>
                                        {/if}
                                    </TableBody>
                                {/if}
                            </Table>
                            {#if tableCalendar.rows.length > 0}
                            <div class="flex justify-between items-center gap-2 mt-3">
                                <p class='text-muted self-end text-[.9rem]'>
                                    Showing {tableCalendar.rowCount.start} to {tableCalendar.rowCount.end} of {tableCalendar.rowCount.total} rows
                                    <Badge color="dark" border>Page {tableCalendar.currentPage}</Badge>
                                </p>
                                <div class="flex gap-2">
                                    <MyButton onclick={()=> tableCalendar.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                    <MyButton onclick={()=> tableCalendar.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                    {#each tableCalendar.pages as page}
                                        <MyButton className={`text-muted text-[.9rem] px-3`} onclick={()=> tableCalendar.setPage(page)} type="button">{page}</MyButton>
                                    {/each}
                                    <MyButton onclick={()=> tableCalendar.setPage('next')}><ChevronRight size={16} /></MyButton>
                                    <MyButton onclick={()=> tableCalendar.setPage('last')}><ChevronLast size={16} /></MyButton>
                                </div>
                            </div>
                            {/if}
                        </Datatable>
                    </div>
                </div>

                <Modal title={'Delete Calendar'} bind:open={formCalendar.modalDelete} autoclose>
                    <Button color='green' onclick={()=> formCalendarDelete(formCalendar.answer.calendar_id)}>Yes</Button>
                    <Button color='red' onclick={()=> formCalendar.modalDelete = false}>No</Button>
                </Modal>
            </TabItem>
        {/if}
    </Tabs>
</main>