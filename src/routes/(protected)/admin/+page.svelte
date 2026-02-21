<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Tabs, TabItem, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Tooltip, Label, MultiSelect, Select, Checkbox, Badge, Alert, Modal, Button, Timeline, TimelineItem } from 'flowbite-svelte';
    import MyInput from '$/lib/components/MyInput.svelte'
    import MyButton from '$/lib/components/MyButton.svelte'
    import axios from 'axios'
    import {Plus, RefreshCw, Save, Ban, Pencil, Trash, Search, Check, KeyRound } from '@lucide/svelte'
    import {formatTanggal, getParams, pecahArray, capitalEachWord} from '$/lib/utils'
	import MyLoading from '@/MyLoading.svelte';
	import { Datatable, TableHandler, type State, ThSort } from '@vincjo/datatables/server';
    import { page } from '$app/stores';
	import { getYear } from 'date-fns';
	import { z } from 'zod';
    import Svelecte from 'svelecte';
	import { fromZodError } from 'zod-validation-error';
	import { invalidateAll } from '$app/navigation';
	import { ProfileSchema, SettingSchema, UserSchema, type TCalendarSchema, type TDeptSchema, type TProfileSchema, type TSettingSchema, type TUserSchema } from '$/lib/type.js';
    import MyPagination from '@/MyPagination.svelte';
    import MyAlert from '@/MyAlert.svelte';
    import MyDatePicker from '@/MyDatePicker.svelte';
	import { useDept, useProfile, useUserByDept } from '@lib/fetch.js';
	import { createMutation } from '@tanstack/svelte-query';
	import { base } from '$app/paths';
    
    let {data} = $props()
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)

    const urlTab = $page.url.searchParams.get('tab')
    const urlMessage = $page.url.searchParams.get('message')

    const rowsPerPage = 20
    const listLevel = [0, 1, 2, 3, 4, 5].map(v => ({value : v, name : v}))
    
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
            access_sppd: [],
            access_skpd: [],
            access_spl: [],
            access_srl: [],
            access_cuti: [],
            access_ijin: [],
            access_attendance: [],
            access_security: [],
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
            const req = await axios.get(`${base}/api/admin/profile/${id}`)
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
                const req = await axios.post(`${base}/api/admin/profile`, formProfileState.answer, {
                    withCredentials: true
                })
                const res = await req.data
                await invalidateAll()
                formProfileBatal()
                tableProfile.invalidate()
                getProfile.refetch()
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
            const req = await axios.delete(`${base}/api/admin/profile/${id}`)
            const res = await req.data
            formProfileBatal()
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
            user_id_machine:"",
            profile_id:"",
            email:"",
            name:"",
            password:"",
            position:"",
            department:"",
            location:"",
            phone:"",
            overtime: false,
            workhour: 8,
            start_work: "",
            approver: "",
            substitute: "",
            join_date: "",
            signature: "",
            level: 0,
            user_type: "",
            user_dept: false,
            user_divisi: false,
            cuti_kunci: false,
            cuti_suspen: false,
            hostname: "",
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
            const req = await axios.get(`${base}/api/admin/user/${id}`)
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
                const req = await axios.post(`${base}/api/admin/user`, formData)
                const res = await req.data
                await invalidateAll()
                formUserBatal()
                tableUser.invalidate()
                getUserByDept.refetch()
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
            const req = await axios.delete(`${base}/api/admin/user/${id}`)
            const res = await req.data
            formUserBatal()
            tableUser.invalidate()
            formUserState.success = res.message
        } catch (error: any) {
            formUserState.error = error.response.data.message
            formUserState.success = ""
        }finally{
            formUserState.loading = false
        }
    }

    const formUserChangePassword = async (id:string) =>{
        try {
            formUserState.error = ""
            formUserState.loading = true
            const req = await axios.post(`${base}/api/admin/user/${id}/password`, {
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
            divisi:"",
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
            const req = await axios.get(`${base}/api/admin/dept/${id}`)
            formDeptState.answer = {...await req.data}
            formDeptState.edit = true
            formDeptState.add = false
            formDeptState.loading = false
        } catch (error) {
            formDeptState.loading = false 
        }
    }
    
    const formDeptSubmit = async () => {
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
                const req = await axios.post(`${base}/api/admin/dept`, formDeptState.answer)
                const res = await req.data
                formDeptBatal()
                tableDept.invalidate()
                getDept.refetch()
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
            late_dispen: 0,
            overtime_allow: 30,
            overtime_round_up: false,
            approval_dinas: "",
            approval_lembur_ob: "",
            approval_lembur_security: "",
            absensi_full: 1
        },
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    })

    const getSetting = async () =>{
        const req = await fetch(`${base}/api/admin/setting`)
        const res: TSettingSchema = await req.json()
        if(res){
            formSettingState.answer = {...res}
            // formSettingState.answer.start_periode = res.start_periode
            // formSettingState.answer.end_periode = res.end_periode
            // formSettingState.answer.late_dispen = res.late_dispen
            // formSettingState.answer.overtime_allow = res.overtime_allow
            // formSettingState.answer.overtime_round_up = res.overtime_round_up
        }
    }

    const formSettingSubmit = async () =>{
        try {
            formSettingState.success = ""
            formSettingState.loading = true
            const isValid = SettingSchema.safeParse(formSettingState.answer)
            if(isValid.success){
                const req = await axios.post(`${base}/api/admin/setting`, formSettingState.answer)
                const res = await req.data
                formSettingState.error = ""
                formSettingState.success = res.message
            } else {
                const err = fromZodError(isValid.error)
                formSettingState.success = ""
                formSettingState.error = err.message
            }
        } catch (error: any) {
            formSettingState.error = error.response.data.message
            formSettingState.success = ""
        } finally {
            formSettingState.loading = false
        }
    }

    // Calendar
    let tableCalendar = $state(new TableHandler<TCalendarSchema>([], {rowsPerPage}))
    let tableCalendarSearch = tableCalendar.createSearch()

    let formCalendarAnswer = {
        answer:{
            calendar_id:"id",
            description:"",
            type:"",
            date:"",
            createdBy: (()=> user?.payroll)(),
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
            formCalendar.success = ""
            formCalendar.loading = true
            const valid = z.object({               
                description: z.string().trim().min(1).max(255),
                type: z.string().trim().min(1),
                date: z.string().trim().length(10),
            })
            const isValid = valid.safeParse(formCalendar.answer)
            if(isValid.success){
                const req = await axios.post(`${base}/api/admin/calendar`, formCalendar.answer)
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

    const onCalendarEdit = createMutation(()=> ({
        mutationFn: async (id: string) => {
            formCalendar.loading = true
            formCalendar.success = ""
            formCalendar.error = ""
            const req = await fetch(`${base}/api/admin/calendar/${id}`)
            const res = await req.json()
            return res
        }, onSuccess: (res) => {
            formCalendar.answer = {...res}
            formCalendar.answer.type = res.type.replace('_',' ')
            setTimeout(()=>{
                formCalendar.answer.date = formatTanggal(res.date, "date")
            }, 100)
            formCalendar.edit = true
            formCalendar.add = false
        }, onSettled: () => {
            formCalendar.loading = false 
        }
    }))

    const formCalendarDelete = async (id: string) => {
        try {
            formCalendar.error = ""
            formCalendar.loading = true
            const req = await axios.delete(`${base}/api/admin/calendar/${id}`)
            const res = await req.data
            formCalendarBatal()
            tableCalendar.invalidate()
            formCalendar.success = res.message
        } catch (error: any) {
            formCalendar.error = error.response.data.message
            formCalendar.success = ""
        }finally{
            formCalendar.loading = false
        }
    }
    
    const formCalendarBatal = () => formCalendar = {...formCalendarAnswer}

    const getUserByDept = useUserByDept()
    
    const getDept = useDept()

    const getProfile = useProfile()
    
    $effect(()=>{
        tableProfile.load(async(state) => {
            try {
                const req = await fetch(`${base}/api/admin/profile?${getParams(state)}`);
                if (!req.ok) throw new Error('Gagal mengambil data');
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })
    
        tableUser.load(async(state) => {
            try {
                const req = await fetch(`${base}/api/admin/user?${getParams(state)}`);
                if (!req.ok) throw new Error('Gagal mengambil data');
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        tableDept.load(async(state) => {
            try {
                const req = await fetch(`${base}/api/admin/dept?${getParams(state)}`);
                if (!req.ok) throw new Error('Gagal mengambil data');
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        tableCalendar.load(async(state) => {
            try {
                const req = await fetch(`${base}/api/admin/calendar?${getParams(state)}&year=${formCalendar.year}`);
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
        <MyAlert pesan={urlMessage} color='red'/>
    {/if}

    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="Dashboard">
            <div class="relative flex items-center justify-center min-h-[80vh] gap-20">
                <span class="font-bold text-[2.2rem] font-quicksand">Welcome admin</span>
                <img src="/admin.svg" alt="Admin" class="max-h-[80vh] object-cover"/>
            </div>
        </TabItem>
        {#if pecahArray(userProfile?.access_profile, "R")}
            <TabItem title="Profil">
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                    {#if formProfileState.error}
                        {#each formProfileState.error.split(';') as v}
                            <MyAlert pesan={v} func={()=> formProfileState.error = ""} color='red'/>
                        {/each}
                    {:else if formProfileState.success}
                        <MyAlert pesan={formProfileState.success} func={()=> formProfileState.success = ""} color='green'/>
                    {/if}

                    {#if pecahArray(userProfile?.access_profile, "C") || pecahArray(userProfile?.access_profile, "U")}
                        <div class="flex gap-2">                        
                            {#if formProfileState.add || formProfileState.edit}
                                <MyButton onclick={formProfileBatal}><Ban size={16} /></MyButton>
                                <MyButton disabled={formProfileState.loading} onclick={formProfileSubmit}><Save size={16}/></MyButton>
                            {:else}
                                {#if pecahArray(userProfile?.access_profile, "C")}
                                    <MyButton onclick={()=> formProfileState.add = true}><Plus size={16}/></MyButton>
                                {/if}
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
                                    <div class="flex flex-col gap-2">
                                        <Label for='status'>Status</Label>
                                        <Select name='status' items={[
                                            {value:"Aktif", name:"Aktif"},
                                            {value:"Nonaktif", name:"Nonaktif"},
                                        ]} bind:value={formProfileState.answer.status} />
                                    </div>
                                </div>
                                <MyInput type='textarea' title='Description' rows={4} name="description" bind:value={formProfileState.answer.description}/>
                            </div>

                            <hr class='text-slate-300'>
                            
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
                                    <Label>Access Security</Label>
                                    <MultiSelect size="md" items={ListAccess.filter(v => v.value == "R")} bind:value={formProfileState.answer.access_security} />
                                    <span class='italic text-[.75rem]'>Khusus security full akses di pengaturan</span>
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

                            </div>
                        </form>
                    {/if}
                    
                    <div class="flex gap-2">
                        <select bind:value={tableProfile.rowsPerPage} onchange={() => tableProfile.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                        <MyInput type='text' bind:value={tableProfileSearch.value} onkeydown={e => {
                            if(e.key.toLowerCase() === 'enter') tableProfileSearch.set()
                        }}/>
                        <MyButton onclick={()=>tableProfileSearch.set()}><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableProfile.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                    
                    <Datatable table={tableProfile}>
                        <Table >
                            <TableHead>
                                <ThSort table={tableProfile} field="name">Nama</ThSort>
                                <ThSort table={tableProfile} field="description">Deskripsi</ThSort>
                                <ThSort table={tableProfile} field="status">Status</ThSort>
                                <ThSort table={tableProfile} field="profile_id">#</ThSort>
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
                                                <TableBodyCell>{row.name}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{row.description}</TableBodyCell>
                                                <TableBodyCell>{row.status}</TableBodyCell>
                                                <TableBodyCell>
                                                    {#if !formProfileState.edit}
                                                        {#if pecahArray(userProfile.access_profile, "U") && row.profile_id !== 'DEFAULT'}
                                                            <MyButton onclick={()=> formProfileEdit(row.profile_id)}><Pencil size={12} /></MyButton>
                                                            <Tooltip>Edit</Tooltip>
                                                        {/if}
                                                        {#if pecahArray(userProfile.access_profile, "D") && row.status == "Aktif" && row.profile_id !== 'DEFAULT'}
                                                            <MyButton onclick={()=> {
                                                                formProfileState.answer.profile_id = row.profile_id
                                                                formProfileState.modalDelete = true
                                                            }}><Trash size={12} /></MyButton>
                                                            <Tooltip>Hapus</Tooltip>
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
                        <MyPagination table={tableProfile} />
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
                            <MyAlert pesan={v} func={()=> formUserState.error = ""} color='red'/>
                        {/each}
                    {:else if formUserState.success}
                        <MyAlert pesan={formUserState.success} func={()=> formUserState.success = ""} color='green'/>
                    {/if}
                    
                    {#if pecahArray(userProfile?.access_user, "C") || pecahArray(userProfile.access_user, "U")}
                        <div class="flex gap-2">                        
                            {#if formUserState.add || formUserState.edit}
                                <MyButton onclick={formUserBatal}><Ban size={16} /></MyButton>
                                <MyButton onclick={formUserSubmit}><Save size={16}/></MyButton>
                            {:else}
                                {#if pecahArray(userProfile?.access_user, "C")}
                                    <MyButton onclick={()=> formUserState.add = true}><Plus size={16}/></MyButton>
                                {/if}
                            {/if}
                        </div>
                    {/if}

                    {#if formUserState.loading}
                        <MyLoading message="Load data"/>
                    {/if}
                    {#if formUserState.add || formUserState.edit}
                        <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg' enctype="multipart/form-data">
                            <span class="border-b-[1px] border-slate-300 pb-2 font-bold text-[1.2rem]">Basic</span>
                            <div class="grid grid-cols-2 gap-4 p-4 border-[1px] border-slate-300">
                                <MyInput type='text' title='Payroll' disabled={formUserState.edit} name="payroll" bind:value={formUserState.answer.payroll}/>

                                {#if getProfile.data}
                                    <div class="flex flex-col gap-2">
                                        <Label>Profile ID</Label>
                                        <Svelecte class='border-none' optionClass='p-2' name='profile_id' required searchable selectOnTab multiple={false} bind:value={formUserState.answer.profile_id} 
                                            options={getProfile.data.map((v:any) => ({value: v.profile_id, text:v.name }))}/>
                                    </div>
                                {/if}
                                <MyInput type='text' title='Name' name="name" bind:value={formUserState.answer.name}/>

                                {#if formUserState.add}
                                    <MyInput type='password' password={true} title='Password' name="password" bind:value={formUserState.answer.password}/>
                                {/if}

                                <MyInput type='text' title='Email' name="email" bind:value={formUserState.answer.email}/>
                                <MyInput type='text' title='Position' name="position" bind:value={formUserState.answer.position}/>

                                {#if getDept.isPending || getDept.isFetching}
                                    <MyLoading message="Loading data"/>
                                {/if}
                                {#if getDept.data}
                                    <div class="flex flex-col gap-2">
                                        <Label>Department</Label>
                                        <Svelecte class='border-none' optionClass='p-2' name='department' required searchable selectOnTab multiple={false} bind:value={formUserState.answer.department} 
                                        options={getDept.data.map((v:any) => ({value: v.dept_code, text: v.dept_code + " - " + v.name }))}/>
                                    </div>
                                {/if}
                                
                                <div class="flex flex-col gap-2">
                                    <Label for='location'>Location</Label>
                                    <Select name='location' items={[
                                        {value:"Jakarta", name:"Jakarta"},
                                        {value:"Samarinda", name:"Samarinda"},
                                        {value:"Other", name:"Other"},
                                    ]} bind:value={formUserState.answer.location} />
                                </div>

                                <MyInput type='text' title='Phone' name="phone" bind:value={formUserState.answer.phone}/>

                                <div class="flex flex-col gap-2 flex-1">
                                    <Label>Join Date</Label>
                                    <MyDatePicker bind:value={formUserState.answer.join_date}/>
                                </div>                 

                                <div class="flex flex-col gap-2">
                                    <Label>Signature</Label>
                                    <input class="rounded-lg border border-slate-300" type="file" accept=".jpg" onchange={e => formUserState.answer.signature = e.target.files[0]}/>
                                </div>

                                {#if getUserByDept.isPending || getUserByDept.isFetching}
                                    <MyLoading message="Loading data"/>
                                {/if}
                                {#if getUserByDept.data}
                                    <div class="flex flex-1 flex-col gap-2">
                                        <Label>Approver</Label>
                                        <Svelecte class='border-none' optionClass='p-2' name='approver' required searchable selectOnTab multiple={false} bind:value={formUserState.answer.approver} 
                                        options={getUserByDept.data.map((v:any) => ({value: v.payroll, text: v.payroll + " - " + v.name }))}/>
                                    </div>
                                    <div class="flex flex-1 flex-col gap-2">
                                        <Label>Substitute</Label>
                                        <Svelecte class='border-none' optionClass='p-2' name='substitute' required searchable selectOnTab multiple={false} bind:value={formUserState.answer.substitute} 
                                        options={getUserByDept.data.map((v:any) => ({value: v.payroll, text: v.payroll + " - " + v.name }))}/>
                                    </div>
                                {/if}
                            </div>

                            <span class="border-b-[1px] border-slate-300 pb-2 font-bold text-[1.2rem]">Attendance</span>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 p-4 border-[1px] border-slate-200">
                                <MyInput type='time' title='Start Work' name="start_work" bind:value={formUserState.answer.start_work}/>

                                <div class="flex flex-col flex-1 gap-2">
                                    <Label for='level'>Level</Label>
                                    <Select name='level' items={Array.from({length: 11}, (_, v) => ({value: v, name: v}))} bind:value={formUserState.answer.level} />
                                </div>
                                <div class="flex items-start gap-4 my-2">
                                    <div class="flex flex-col flex-1">
                                        <Checkbox bind:checked={formUserState.answer.user_dept}>User Dept</Checkbox>
                                        <span class="italic text-[.75rem]">User adalah user kepala departemen</span>
                                    </div>
                                    <div class="flex flex-col flex-1">
                                        <Checkbox bind:checked={formUserState.answer.user_divisi}>User Divisi</Checkbox>
                                        <span class="italic text-[.75rem]">User adalah kepala divisi</span>
                                    </div>
                                </div>
                                <div class="flex items-start gap-4 my-2">
                                    <div class="flex flex-col flex-1">
                                        <Checkbox bind:checked={formUserState.answer.cuti_kunci}>Cuti dikunci</Checkbox>
                                        <span class="italic text-[.75rem]">Permohonan cuti ditolak jika jatah cuti sudah 0</span>
                                    </div>
                                    <div class="flex flex-col flex-1">
                                        <Checkbox bind:checked={formUserState.answer.cuti_suspen}>Cuti ditangguhkan</Checkbox>
                                        <span class="italic text-[.75rem]">Cuti karyawan dapat ditangguhkan</span>
                                    </div>
                                    <div class="flex flex-col flex-1">
                                        <Checkbox bind:checked={formUserState.answer.overtime}>Overtime</Checkbox>
                                        <span class="italic text-[.75rem]">Kehadiran karyawan dianggap lembur jika overtime</span>
                                    </div>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <Label for='user_type'>User Tipe</Label>
                                    <Select name='user_type' items={[
                                        {value:"HR", name:"HR"},
                                        {value:"OB", name:"OB"},
                                        {value:"Security", name:"Security"},
                                        {value:"Messenger", name:"Messenger"},
                                        {value:"Other", name:"Other"},
                                    ]} bind:value={formUserState.answer.user_type} />
                                </div>
                                <div class="flex flex-col gap-2">
                                    <Label for='workhour'>Workhour</Label>
                                    <Select name='workhour' items={[
                                        {value:7, name:"7"},
                                        {value:8, name:"8"},
                                    ]} bind:value={formUserState.answer.workhour} />
                                </div>
                                <MyInput type='text' title='User ID Machine' name="user_id_machine" bind:value={formUserState.answer.user_id_machine}/>
                                <div class="flex flex-col">
                                    <MyInput type='text' title='Hostname' name="hostname" bind:value={formUserState.answer.hostname}/>
                                    <span class='italic text-[.8rem]'>Different name separate with |</span>
                                </div>

                                <div class="flex flex-col gap-2">
                                    <Label for='status'>Status</Label>
                                    <div class="flex flex-col">
                                        <Select name='status' items={[
                                            {value:"Aktif", name:"Aktif"},
                                            {value:"Nonaktif", name:"Nonaktif"},
                                        ]} bind:value={formUserState.answer.status} />
                                        <span class='italic text-[.8rem]'>* While status is 'nonaktif' user cannot login</span>
                                    </div>
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
                        <MyInput type='text' bind:value={tableUserSearch.value} onkeydown={e => {
                            if(e.key.toLowerCase() === 'enter') tableUserSearch.set()
                        }}/>
                        <MyButton onclick={()=>tableUserSearch.set()}><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableUser.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>

                    <Datatable table={tableUser}>
                        <Table>
                            <TableHead>
                                <ThSort table={tableUser} field="payroll">Payroll</ThSort>
                                <ThSort table={tableUser} field="name">Nama</ThSort>
                                <ThSort table={tableUser} field="profile_name">Profil</ThSort>
                                <ThSort table={tableUser} field="position">Posisi</ThSort>
                                <ThSort table={tableUser} field="department">Departemen</ThSort>
                                <ThSort table={tableUser} field="email">Email</ThSort>
                                <ThSort table={tableUser} field="">#</ThSort>
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
                                                <TableBodyCell tdClass='break-all'>{row.payroll}</TableBodyCell>
                                                <TableBodyCell>{capitalEachWord(row.name)}</TableBodyCell>
                                                <TableBodyCell>{row.profile_name}</TableBodyCell>
                                                <TableBodyCell>{capitalEachWord(row.position)}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all'>{row.dept}</TableBodyCell>
                                                <TableBodyCell>{row.email}</TableBodyCell>
                                                <TableBodyCell>
                                                    {#if !formUserState.edit}
                                                        {#if pecahArray(userProfile.access_user, "U")}
                                                            <MyButton onclick={()=> formUserEdit(row.payroll)}><Pencil size={12} /></MyButton>
                                                            <Tooltip>Edit</Tooltip>
                                                        {/if}
                                                        {#if pecahArray(userProfile.access_user, "D") && row.status == "Aktif"}
                                                            <MyButton onclick={()=> {
                                                                formUserState.answer.payroll = row.payroll
                                                                formUserState.modalDelete = true
                                                            }}><Trash size={12} /></MyButton>
                                                            <Tooltip>Hapus</Tooltip>
                                                        {/if}
                                                        {#if pecahArray(userProfile.access_user, "U")}
                                                            <MyButton onclick={()=> {
                                                                formUserState.answer.payroll = row.payroll
                                                                formUserState.modalChangePassword = true
                                                            }}><KeyRound size={12} /></MyButton>
                                                            <Tooltip>Ganti Password</Tooltip>
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
                        <MyPagination table={tableUser} />
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
            <TabItem title="Departemen">
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                    {#if formDeptState.error}
                        {#each formDeptState.error.split(';') as v}
                            <MyAlert pesan={v} func={()=> formDeptState.error = ""} color='red'/>
                        {/each}
                    {:else if formDeptState.success}
                        <MyAlert pesan={formDeptState.success} func={()=> formDeptState.success = ""} color='green'/>
                    {/if}

                    {#if pecahArray(userProfile?.access_dept, "C") || pecahArray(userProfile?.access_dept, "U")}
                        <div class="flex gap-2">                        
                            {#if formDeptState.add || formDeptState.edit}
                                <MyButton onclick={formDeptBatal}><Ban size={16} /></MyButton>
                                <MyButton onclick={formDeptSubmit}><Save size={16}/></MyButton>
                            {:else}
                                {#if pecahArray(userProfile?.access_dept, "C")}
                                    <MyButton onclick={()=> formDeptState.add = true}><Plus size={16}/></MyButton>
                                {/if}
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
                            <MyInput type='text' title='Divisi' name="divisi" bind:value={formDeptState.answer.divisi}/>
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
                        <MyInput type='text' bind:value={tableDeptSearch.value} onkeydown={e => {
                            if(e.key.toLowerCase() === 'enter') tableDeptSearch.set()
                        }}/>
                        <MyButton onclick={()=>tableDeptSearch.set()}><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableDept.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                    
                    <Datatable table={tableDept}>
                        <Table>
                            <TableHead>
                                <ThSort table={tableDept} field="dept_code">Dept Code</ThSort>
                                <ThSort table={tableDept} field="name">Nama</ThSort>
                                <ThSort table={tableDept} field="initial">Inisial</ThSort>
                                <ThSort table={tableDept} field="status">Status</ThSort>
                                <ThSort table={tableDept} field="">#</ThSort>
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
                                                            <Tooltip>Edit</Tooltip>
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
                        <MyPagination table={tableDept} />
                    </Datatable>
                </div>
            </TabItem>
        {/if}
        {#if pecahArray(userProfile?.access_setting, "R")}
            <TabItem title="Pengaturan" open={urlTab == 'setting'}>
                <div class="flex flex-col gap-4">
                    {#if formSettingState.error}
                        {#each formSettingState.error.split(';') as v}
                            <MyAlert pesan={v} func={()=> formSettingState.error = ""} color='red'/>
                        {/each}
                    {:else if formSettingState.success}
                        <MyAlert pesan={formSettingState.success} func={()=> formSettingState.success = ""} color='green'/>
                    {/if}

                    {#await getSetting()}
                        <MyLoading message="Loading setting data"/>
                    {:then}
                        {#if pecahArray(userProfile?.access_setting, "U")}
                            <div class="flex flex-col gap-2 rounded-lg p-4 border-[2px] border-slate-300">
                                <div class="flex justify-between gap-2">
                                    <MyButton onclick={formSettingSubmit}><Save size={16}/></MyButton>
                                    <MyButton onclick={getSetting}><RefreshCw size={16}/></MyButton>
                                </div>
                            </div>

                            <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border-[2px] border-slate-300 rounded-lg'>
                                <Timeline>
                                    <TimelineItem title='Absensi' classLi='mb-2'>
                                        <div class="flex flex-col gap-2">
                                            <div class="flex flex-col">
                                                <div class="flex gap-2">
                                                    <MyInput type='number' title='Periode Awal' name="start_periode" bind:value={formSettingState.answer.start_periode}/>
                                                    <MyInput type='number' title='Periode Akhir' name="end_periode" bind:value={formSettingState.answer.end_periode}/>
                                                </div>
                                                <span class='text-textdark italic'>Set untuk periode awal dan periode akhir</span>
                                            </div>
                                            <div class="flex flex-1 flex-col">
                                                <MyInput type='number' title='Dispensasi Keterlambatan' name="late_dispen" bind:value={formSettingState.answer.late_dispen}/>
                                                <span class='text-textdark italic'>Dispensasi untuk keterlambatan</span>
                                            </div>
                                        </div>
                                    </TimelineItem>
                                    <TimelineItem title='Overtime' classLi='mb-2'>
                                        <div class="flex items-center gap-4">
                                            <div class="flex flex-1 flex-col">
                                                <MyInput type='number' title='Minimal Overtime (Menit)' name="overtime_allow" bind:value={formSettingState.answer.overtime_allow}/>
                                                <span class='text-textdark italic'>Minimum menit untuk dihitung lembur</span>
                                            </div>
                                            <Checkbox class='flex-1' bind:checked={formSettingState.answer.overtime_round_up as unknown as boolean}>Pembulatan Overtime Keatas</Checkbox>
                                        </div>
                                    </TimelineItem>
                                    <TimelineItem title='Approve' classLi='mb-2'>
                                        <div class="flex items-center gap-4">
                                            {#if getUserByDept.isPending || getUserByDept.isFetching}
                                                <MyLoading message="Loading data"/>
                                            {/if}
                                            {#if getUserByDept.data}
                                                <div class="flex flex-1 flex-col gap-2">
                                                    <Label>Approve Dinas</Label>
                                                    <Svelecte class='border-none' optionClass='p-2' searchable selectOnTab multiple={false} bind:value={formSettingState.answer.approval_dinas} 
                                                    options={getUserByDept.data.map((v:any) => ({value: v.payroll, text: v.payroll + " - " + v.name }))}/>
                                                    <span class='text-textdark italic'>User default untuk approve dinas</span>
                                                </div>
                                                <div class="flex flex-1 flex-col gap-2">
                                                    <Label>Approve Lembur OB</Label>
                                                    <Svelecte class='border-none' optionClass='p-2' searchable selectOnTab multiple={false} bind:value={formSettingState.answer.approval_lembur_ob} 
                                                    options={getUserByDept.data.map((v:any) => ({value: v.payroll, text: v.payroll + " - " + v.name }))}/>
                                                    <span class='text-textdark italic'>User default untuk approve lembur OB</span>
                                                </div>
                                                <div class="flex flex-1 flex-col gap-2">
                                                    <Label>Approve Lembur Security</Label>
                                                    <Svelecte class='border-none' optionClass='p-2' searchable selectOnTab multiple={false} bind:value={formSettingState.answer.approval_lembur_security} 
                                                    options={getUserByDept.data.map((v:any) => ({value: v.payroll, text: v.payroll + " - " + v.name }))}/>
                                                    <span class='text-textdark italic'>User default untuk approve lembur Security</span>
                                                </div>
                                            {/if}
                                        </div>
                                    </TimelineItem>
                                    <TimelineItem title='Report' classLi='mb-2'>
                                        <div class="flex flex-1 flex-col">
                                            <MyInput type='number' title='Absensi Full' name="absensi_full" bind:value={formSettingState.answer.absensi_full}/>
                                            <span class='text-textdark italic'>Minimum hari untuk dihitung Absensi Full (OK)</span>
                                        </div>
                                    </TimelineItem>
                                </Timeline>
                            </form>
                        {/if}
                    {/await}
                </div>
            </TabItem>
        {/if}
        {#if pecahArray(userProfile?.access_calendar, "R")}
            <TabItem title="Kalender">
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg ">
                    <div class="flex flex-col gap-4">                
                        {#if formCalendar.error}
                            {#each formCalendar.error.split(';') as v}
                                <MyAlert pesan={v} func={()=> formCalendar.error = ""} color='red'/>
                            {/each}
                        {:else if formCalendar.success}
                            <MyAlert pesan={formCalendar.success} func={()=> formCalendar.success = ""} color='green'/>
                        {/if}

                        {#if pecahArray(userProfile?.access_calendar, "C") || pecahArray(userProfile?.access_calendar, "U")}
                            <div class="flex gap-2">                        
                                {#if formCalendar.add || formCalendar.edit}
                                    <MyButton onclick={formCalendarBatal}><Ban size={16} /></MyButton>
                                    <MyButton onclick={formCalendarSubmit}><Save size={16}/></MyButton>
                                {:else}
                                    {#if pecahArray(userProfile?.access_calendar, "C")}
                                        <MyButton onclick={()=> formCalendar.add = true}><Plus size={16}/></MyButton>
                                    {/if}
                                {/if}
                            </div>
                        {/if}

                        {#if formCalendar.loading}
                            <MyLoading message="Load data"/>
                        {/if}
                        {#if formCalendar.add || formCalendar.edit}
                            <form transition:fade={{duration:500}} class='grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border border-slate-300 rounded-lg'>
                                <div class="flex flex-col gap-2 flex-1">
                                    <Label>Tanggal</Label>
                                    <MyDatePicker bind:value={formCalendar.answer.date}/>
                                </div>                 
                                <div class="flex flex-col gap-2">
                                    <Label>Tipe</Label>
                                    <select bind:value={formCalendar.answer.type}>
                                        {#each ['Hari Libur', 'Cuti Bersama', 'Event Kantor'] as option}
                                        <option value={option}>{option}</option>
                                        {/each}
                                    </select>
                                </div>
                                <MyInput type='textarea' title='Deskripsi' name="description" bind:value={formCalendar.answer.description}/>
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
                            <MyInput type='text' bind:value={tableCalendarSearch.value} onkeydown={e => {
                            if(e.key.toLowerCase() === 'enter') tableCalendarSearch.set()
                        }}/>
                            <MyButton onclick={()=>tableCalendarSearch.set()}><Search size={16} /></MyButton>
                            <MyButton onclick={()=>tableCalendar.invalidate()}><RefreshCw size={16}/></MyButton>
                        </div>

                        <Datatable table={tableCalendar}>
                            <Table>
                                <TableHead>
                                    <ThSort table={tableCalendar} field="type">Tipe</ThSort>
                                    <ThSort table={tableCalendar} field="description">Deskripsi</ThSort>
                                    <ThSort table={tableCalendar} field="date">Tanggal</ThSort>
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
                                                    <TableBodyCell>{formatTanggal(row.date, "date","app")}</TableBodyCell>
                                                    <TableBodyCell>
                                                        {#if !formCalendar.edit}
                                                            {#if pecahArray(userProfile?.access_calendar, "U")}
                                                                <MyButton onclick={()=> onCalendarEdit.mutate(row.calendar_id)}><Pencil size={12} /></MyButton>
                                                                <Tooltip>Edit</Tooltip>
                                                            {/if}
                                                            {#if pecahArray(userProfile?.access_calendar, "D")}
                                                                <MyButton onclick={()=> {
                                                                    formCalendar.answer.calendar_id = row.calendar_id
                                                                    formCalendar.modalDelete = true
                                                                }}><Trash size={12} /></MyButton>
                                                                <Tooltip>Hapus</Tooltip>
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
                            <MyPagination table={tableCalendar} />
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