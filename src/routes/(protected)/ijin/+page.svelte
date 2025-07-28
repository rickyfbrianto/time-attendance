<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Tabs, TabItem, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Label, Modal, Timeline, TimelineItem, Badge, Button, Tooltip } from 'flowbite-svelte';
	import {Calendar, Ban, Check, Search, RefreshCw, Pencil, Trash, Plus, Save, X, Highlighter } from '@lucide/svelte'
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
    import MyButton from '$/lib/components/MyButton.svelte';
	import MyLoading from '$/lib/components/MyLoading.svelte';
	import MyInput from '$/lib/components/MyInput.svelte';
    import axios from 'axios';
	import { formatTanggal, generatePeriode, pecahArray, getParams, dataTahun, dataBulan, namaHari } from '$/lib/utils.js';
    import { differenceInDays, eachDayOfInterval, format, getDay, getYear, set } from 'date-fns';
    import { z } from 'zod';
	import { fromZodError } from 'zod-validation-error';
	import { CalendarWeekSolid } from 'flowbite-svelte-icons';
	import Svelecte from 'svelecte';
    import MyPagination from '@/MyPagination.svelte';
    import MyAlert from '@/MyAlert.svelte';

    const rowsPerPage = 10
    let {data} = $props()
    let user = $derived(data.user)
    let userProfile = $derived(data.userProfile)
    let setting = $derived(data.periode)
    let periode = $derived(generatePeriode(new Date().toString(), Number(setting?.start_periode), Number(setting?.end_periode)))

    const eventCuti = ['Cuti Bersama','Event Kantor','Hari Libur']
    // (khitan/baptis,haji,nikah

    const typeList = $derived.by(()=> {
        const temp = [
                {value: 'Pernikahan', hari: 1},
                {value: 'Pernikahan Anak/Saudara Kandung', hari: 1},
                {value: 'Kelahiran Anak', hari: 1},
                {value: 'Kematian Anggota Keluarga', hari: 1},
                {value: 'Bencana Alam', hari: 1},
                {value: 'Keluarga Rawat Inap', hari: 1},
                {value: 'Cuti Khitanan/Baptis', hari: 1},
                {value: 'Ibadah Haji', hari: 1},
                {value: 'Other', hari: 1},
            ]
        return userProfile.user_hrd ? temp : temp.filter(v => v.value !== 'Other')
    })

    let headerData: {title:string, value:string, icon: any }[] = $state([])
    
    let modalHeader = $state({
        modal:false,
        val:""
    })
    
    const handleDetailHeader = (title: string) => {
        if(eventCuti.includes(title)){
            modalHeader.modal = true
            modalHeader.val = title
        }
    }
        
    // Table Ijin
    let tableIjin = $state(new TableHandler([], {rowsPerPage}))
    let tableIjinSearch = tableIjin.createSearch()

    let formIjinAnswer = {
        answer:{
            ijin_id: "id",
            name: "",
            type:"",
            description: "",
            date: "",
            status: "Waiting",
            askDuration:0,
            payroll: (() => user?.payroll)(),
            dept: (()=> user?.department)(),
            user_hrd: (()=> userProfile?.user_hrd)(),
            approval: (() => user?.approver || null)(),
            user_approval: (()=> user?.employee_employee_approverToemployee?.payroll || null)(),
            user_delegate: (()=> user?.employee_employee_approverToemployee?.employee_employee_substituteToemployee?.payroll || null)()
        },
        dept: (()=> userProfile.user_hrd ? "" : user?.department)(),
        payroll: (()=> user?.payroll)(),
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        autoWeekend: false,
        success:"",
        error:"",
        modalDelete:false,
        loading:false,
        add:false,
        edit:false,
    }

    let formIjin = $state({...formIjinAnswer})
    
    let modeIjin = $state({
        modalAttachment: false,
        attachment: "",
        payroll: formIjinAnswer.payroll,
        name: "",
        periode: {
            start: (()=> generatePeriode(new Date().toString(), Number(setting?.start_periode), Number(setting?.end_periode)).start)(),
            end: (()=> generatePeriode(new Date().toString(), Number(setting?.start_periode), Number(setting?.end_periode)).end)(),
        },
        tabNo: 1
    })
    
    const formIjinSubmit = async () =>{
        try {
            formIjin.loading = true
            const valid = z.object({
                date: z.union([z.string().trim().min(1), z.tuple([z.string(), z.string()], {message: "Date is not valid"})]),
                type: z.string().trim().min(1),
                description: z.string().trim().min(5),
                approval: z.string().trim().min(1),
            })
            const isValid = valid.safeParse(formIjin.answer)
            if(isValid.success){
                const req = await axios.post('/api/ijin', formIjin.answer)
                const res = await req.data
                formIjinBatal()
                tableIjin.invalidate()
                formIjin.success = res.message
            }else{
                const err = fromZodError(isValid.error)
                formIjin.success = ""
                formIjin.error = err.message
            }
        } catch (error: any) {
            formIjin.error = error.response.data.message
            formIjin.success = ""
        } finally {
            formIjin.loading = false
        }
    }

    const formIjinBatal = () => formIjin = {...formIjinAnswer}
    
    const formIjinEdit = async (id:string) =>{
        try {
            formIjin.loading = true
            formIjin.success = ""
            formIjin.error = ""
            const req = await axios.get(`/api/ijin/${id}/edit`)
            const res = await req.data
            
            if(res){
                formIjin.answer = {...res}
                setTimeout(()=>{
                    formIjin.answer.date = formatTanggal(res.date, "date")
                }, 100)
                
                formIjin.edit = true
                formIjin.add = false
            }else{
                formIjin.error = "Cant edit data"
                formIjin.success = ""
            }
        } catch (error) {
        } finally {
            formIjin.loading = false
            tableIjin.invalidate()
        }
    }

    const formIjinDelete = async (id:string) =>{
        try {
            formIjin.loading = true
            const req = await axios.delete(`/api/ijin/${id}/delete`)
            const res = await req.data
            formIjin.error = ""
            formIjin.success = res.message
        } catch (error) {
            formIjin.error = "Cant delete Ijin"
            formIjin.success = ""
        } finally {
            formIjin.loading = false
            tableIjin.invalidate()
        }
    }

    const handleDelegateIjin = async (ijin_id: string, approval: string) => {
        try {
            formIjin.answer.ijin_id = ijin_id
            formIjin.answer.approval = approval
            const req = await axios.post('/api/ijin/delegate', formIjin.answer)
            const res = await req.data
            formIjinBatal()
            tableIjin.invalidate()
            formIjin.error = ""
            formIjin.success = res.message
        } catch (error: any) {
            formIjin.error = error.response.data.message
            formIjin.success = ""
        }
    }

    // Approval Ijin
    let tableApprovalIjin = $state(new TableHandler([], {rowsPerPage}))
    
    const formApprovalIjinAnswer = {
        answer: {
            ijin_id: "id",
            status: "Waiting",
            approval: ""
        },
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    }
    
    let formApprovalIjin = $state({...formApprovalIjinAnswer})

    const handleApproveIjin = async (cuti_id: string, approval: string, status: string) => {
        try {
            formApprovalIjin.answer.ijin_id = cuti_id
            formApprovalIjin.answer.approval = approval
            formApprovalIjin.answer.status = status
            const req = await axios.post('/api/ijin/approve', formApprovalIjin.answer)
            const res = await req.data
            if(userProfile.user_hrd) tableListIjin.invalidate()
            tableApprovalIjin.invalidate()
            formApprovalIjin.error = ""
            formApprovalIjin.success = res.message
        } catch (error: any) {
            formApprovalIjin.error = error.response.data.message
            formApprovalIjin.success = ""
        }
    }

    // List Ijin for HRD
    let tableListIjin = $state(new TableHandler([], {rowsPerPage}))
    let tableListIjinSearch = tableListIjin.createSearch()
    
    const formListIjinAnswer = {
        answer: {
            cuti_id: "id",
            status: "Waiting",
        },
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    }

    let formListIjin = $state({...formListIjinAnswer})
    
    const getCutiUser = async (payroll: string) =>{
        const year = getYear(new Date())
        // const month = getMonth(new Date()) + 1
        const month = 12
        const req = await fetch(`/api/data?type=get_cuti_user&val=${payroll}&year=${year}&month=${month}`)
        const res = await req.json()
        headerData = Object.entries(res).map(val => ({title:val[0], value:val[1] as string, icon:Calendar}))
    }
    
    const getCutiCalendar = async (v: string) =>{
        const year = getYear(new Date())
        // const month = getMonth(new Date()) + 1
        const month = 12
        const req = await fetch(`/api/data?type=get_calendar&val=${v}&year=${year}&month=${month}`)
        const res = await req.json()
        return res
    }
    
    const getUser = async (val: string = "") =>{
        const req = await fetch(`/api/data?type=user_by_dept&val=${val || ""}`)
        return await req.json()
    }

    const fillIjin = async (val: string) => {
        const req = await fetch(`/api/data?type=user_for_ijin&val=${val || ""}`)
        const res = await req.json()
        if(res){
            formIjin.answer.name = res.name
            formIjin.answer.approval = res.employee_employee_approverToemployee.payroll
            formIjin.answer.user_approval = res.employee_employee_approverToemployee.name
            formIjin.answer.user_delegate = res.employee_employee_approverToemployee.employee_employee_substituteToemployee.name
        }
        // return await res
    }
    
    $effect(()=>{
        if(Array.isArray(formIjin.answer.date) && formIjin.answer.date[0] && formIjin.answer.date[1]){
            const daysInRange = eachDayOfInterval({ start: formIjin.answer.date[0], end: formIjin.answer.date[1] });
            
            const dayNames = daysInRange.map(date => getDay(date));
            const dayFree = user?.workhour == 7 ? [0] : [0, 6]
            let dayCount = 0 
            dayNames.forEach(day => {
                if(!dayFree.includes(day)) dayCount++
            })
            formIjin.answer.askDuration = isNaN(dayCount) ? 0 : dayCount
        }
    })
    
    $effect(()=>{
        tableIjin.load(async (state:State) =>{
            try {
                const req = await fetch(`/api/ijin?${getParams(state)}&payroll=${modeIjin.payroll}&start_date=${modeIjin.periode.start}&end_date=${modeIjin.periode.end}`)
                if(!req.ok) throw new Error('Gagal mengambil data')
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        if (userProfile.level > 1){
            tableApprovalIjin.load(async (state:State) =>{
                try {
                    const req = await fetch(`/api/ijin/approve?${getParams(state)}&payroll=${user?.payroll}&dept=${user?.department}`)
                    if(!req.ok) throw new Error('Gagal mengambil data')
                    const {items, totalItems} = await req.json()
                    state.setTotalRows(totalItems)
                    return items
                } catch (err:any) {
                    console.log(err.message)
                }
            })
        }

        if (userProfile.user_hrd){
            tableListIjin.load(async (state:State) =>{
                try {
                    const req = await fetch(`/api/ijin/list?${getParams(state)}&start_date=${modeIjin.periode.start}&end_date=${modeIjin.periode.end}`)
                    if(!req.ok) throw new Error('Gagal mengambil data')
                    const {items, totalItems} = await req.json()
                    state.setTotalRows(totalItems)
                    return items
                } catch (err:any) {
                    console.log(err.message)
                }
            })
        }
    })
    
    $effect(()=> {
        const temp = modeIjin.tabNo == 1 
            ? set(new Date(), {year: formIjin.year, month: formIjin.month, date: setting?.end_periode})
            : set(new Date(), {year: formListIjin.year, month: formListIjin.month, date: setting?.end_periode})
        modeIjin.periode = {
            start: generatePeriode(temp.toString(), Number(setting?.start_periode), Number(setting?.end_periode)).start,
            end: generatePeriode(temp.toString(), Number(setting?.start_periode), Number(setting?.end_periode)).end,
        }
    })
    
    setTimeout(()=>{
        tableIjin.invalidate()
        if (userProfile.level > 1)
            tableApprovalIjin.invalidate()
        if (userProfile.user_hrd)
            tableListIjin.invalidate()
    }, 1000)
</script>

<svelte:head>
    <title>Ijin</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    {#await getCutiUser(modeIjin.payroll)}
        <MyLoading message={`Loading users data`}/>
    {:then}
        <div class={`flex rounded-lg p-6 gap-4 border-[2px] border-slate-200 text-textdark`}>
            <div class="flex flex-col gap-2 min-w-fit">
                <div class="flex items-center gap-2">
                    <Calendar size={18}/>
                    <div class="flex gap-2">
                        <span class="font-bold">Hari ini,</span>
                        <span>{format(new Date(), "dd-MM-yyyy")}</span>
                    </div>
                </div>
                <div class="flex gap-2 items-center">
                    <span>Periode</span>
                    <div class="flex flex-col gap-2">
                        <Badge color='indigo'>{modeIjin.periode.start}</Badge>
                        <Badge color='indigo'>{modeIjin.periode.end}</Badge>
                    </div>
                </div>
            </div>

            <div class="flex flex-col w-full gap-4">
                <div class="hidden lg:flex flex-wrap items-end w-full items-center gap-4">
                    {#each headerData as {title, value, icon: Icon}}
                        <button class={`flex-1 flex flex-col min-w-[8rem] items-start border-[2px] border-slate-200 p-4 rounded-lg overflow-hidden overflow-ellipsis whitespace-nowrap ${eventCuti.includes(title) ? "cursor-pointer":""}`}
                            onclick={() => handleDetailHeader(title)}>
                            <span class="text-[.9rem] font-semibold">{title}</span>
                            <div class="flex justify-between items-center gap-2">
                                <Icon size={16}/>
                                <span class='text-[1.1rem] font-bold'>{value}</span>
                            </div>
                        </button>
                    {/each}
                </div>
                <MyButton className='self-start' onclick={()=> getCutiUser(modeIjin.payroll)}>Refresh</MyButton>
            </div>
        </div>
    {/await}
    
    <Modal title={modalHeader.val} size={'sm'} bind:open={modalHeader.modal}>
        {#await getCutiCalendar(modalHeader.val)}
            <MyLoading message={`Loading ${modalHeader.val} data`}/>
        {:then val}
            {#if val.length > 0}
                <div class="ps-4">
                    <p class='-ms-3 mb-5'>Ada {val.length} hari pada event '{modalHeader.val}'</p>
                    <Timeline order="vertical">
                        {#each val as {description, date}}
                            {#if differenceInDays(date, new Date()) > 0}
                                <Badge class='ms-2 mb-2'>Yang akan datang</Badge>
                            {:else if differenceInDays(date, new Date()) == 0}
                                <Badge class='ms-2 mb-2' color="green">Hari ini</Badge>
                            {/if}
                            <TimelineItem title={formatTanggal(date, "date")} date={namaHari[getDay(date)]}>
                                <svelte:fragment slot="icon">
                                    <span class="flex absolute -start-3 justify-center items-center w-6 h-6 bg-primary-200 rounded-full ring-8 ring-white dark:ring-gray-900 dark:bg-primary-900">
                                        <CalendarWeekSolid class="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                    </span>
                                </svelte:fragment>
                                <p>{description}</p>
                            </TimelineItem>
                        {/each}
                    </Timeline>
                </div>
            {:else}
                <span class='text-center'>Tidak ada event</span>
            {/if}
        {/await}
    </Modal>

    <Modal bind:open={formIjin.modalDelete} autoclose>
        <div class="flex flex-col gap-6">
            <h3>Delete Cuti ?</h3>
        </div>
        <svelte:fragment slot="footer">
            <Button color='green' disabled={formIjin.loading} onclick={() => formIjinDelete(formIjin.answer.ijin_id)}>Yes, delete this data</Button>
            <Button color='red' onclick={() => formIjin.modalDelete = false}>No</Button>
        </svelte:fragment>
    </Modal>
    
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title={`${modeIjin.payroll == user.payroll ? "Ijin Saya": "Ijin " + modeIjin.name}`} onclick={() => modeIjin.tabNo = 1}>
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                {#if formIjin.modalDelete}
                    <MyLoading message="Deleting data"/>
                {/if}
                {#if formIjin.error}
                    {#each formIjin.error.split(';') as v}
                        <MyAlert pesan={v} func={()=> formIjin.error = ""} color='red'/>
                    {/each}
                {:else if formIjin.success}
                    <MyAlert pesan={formIjin.success} func={()=> formIjin.success = ""} color='green'/>
                {/if}

                <div class="flex gap-2 items-center w-full">
                    {#if formIjin.add || formIjin.edit}
                        {#if pecahArray(userProfile?.access_ijin, "C") || pecahArray(userProfile.access_ijin, "U")}
                            <MyButton onclick={formIjinBatal}><Ban size={16} /></MyButton>
                            <MyButton disabled={formIjin.loading} onclick={formIjinSubmit}><Save size={16}/></MyButton>
                        {/if}
                    {:else}
                        {#if pecahArray(userProfile?.access_ijin, "C")}
                            <MyButton onclick={()=> {
                                fillIjin(formIjin.answer.payroll)
                                formIjin.add = true
                            }}><Plus size={16}/></MyButton>
                        {/if}
                    {/if}

                    {#if (userProfile?.user_hrd || userProfile?.level > 1)}
                        <div class="flex flex-1 gap-2">
                            {#await getUser(formIjin.dept)}
                                <MyLoading message="Loading data"/>
                            {:then val}
                                <Svelecte class='border-none' optionClass='p-2' name='payroll' required searchable selectOnTab multiple={false} bind:value={modeIjin.payroll}
                                    options={val.map((v:any) => ({value: v.payroll, name: v.name, text:v.payroll + " - " + v.name}))}
                                    onChange={(e) => {
                                        modeIjin.name = e.name
                                        tableIjin.invalidate()
                                }}/>
                            {/await}
                        </div>
                    {/if}
                </div>

                {#if formIjin.loading}
                    <MyLoading message="Load ijin data"/>
                {/if}

                {#if formIjin.add || formIjin.edit}
                    <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <input type='hidden' name="ijin_id" disabled={formIjin.edit} bind:value={formIjin.answer.ijin_id}/>

                            {#if formIjin.add}
                                {#await getUser(formIjin.dept)}
                                    <MyLoading message="Loading data"/>
                                {:then val}
                                    <div class="flex flex-col justify-start gap-2">
                                        <Label>Payroll</Label>
                                        <Svelecte class='border-none' disabled={userProfile.level == 1} optionClass='p-2' name='payroll' required searchable selectOnTab multiple={false} bind:value={formIjin.answer.payroll} 
                                        options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " - " + v.name}))}
                                        onChange={(e) => fillIjin(e.value)}/>
                                    </div>
                                {/await}
                            {:else if formIjin.edit}
                                <MyInput type='text' title='Payroll' disabled value={formIjin.answer.payroll}/>
                            {/if}
                            
                            <!-- <MyInput type='text' title='Payroll' disabled value={user.payroll}/> -->
                            <MyInput type='text' title='Name' disabled value={user.name}/>
                            <MyInput type='text' title='Approval' disabled value={user.employee_employee_approverToemployee.name}/>
                            <MyInput type='text' title='Substitute' disabled value={user.employee_employee_approverToemployee.employee_employee_substituteToemployee.name}/>

                            <div class="flex flex-col gap-2">
                                {#if formIjin.add}
                                    <div class="flex flex-col">
                                        <MyInput type='daterange' title='Date' name="date" bind:value={formIjin.answer.date}/>
                                        {#if formIjin.answer.askDuration > 0}
                                            <span class='italic'>Duration {formIjin.answer.askDuration} days</span>
                                        {/if}
                                    </div>
                                {:else if formIjin.edit}
                                    <MyInput type='date' disabled={formIjin.edit} title='Date' name="date" bind:value={formIjin.answer.date}/>
                                {/if}
                                <div class="flex flex-col gap-2">
                                    <Label>Type</Label>
                                    <Svelecte class='border-none' optionClass='p-2' name='payroll' required selectOnTab multiple={false} bind:value={formIjin.answer.type} 
                                        options={typeList.map((v) => ({value: v.value, text: v.value + " - " + v.hari + " days"}))}/>
                                </div>
                            </div>
                            <div class="flex flex-col self-start">
                                <MyInput type='textarea' title='Description' rows={4} name="description" bind:value={formIjin.answer.description}/>
                                <span class='text-[.9rem] italic'>Description min 5 character</span>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            {#if userProfile.user_hrd}
                                <span class='text-[.8rem] italic'>*If you are HRD user then ijin will automatically granted as approved</span>
                            {/if}
                            <span class='text-[.8rem] italic'>*You can insert ijin if there is no applicant with same date and status is not same as "Waiting" and "Approved"</span>
                        </div>
                    </form>
                {/if}
                <div class="flex gap-2">
                    <select bind:value={tableIjin.rowsPerPage} onchange={() => tableIjin.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <select bind:value={formIjin.year} onchange={()=> tableIjin.invalidate()}>
                        {#each dataTahun as {title, value}}
                            <option value={value}>
                                {title} {value.toString() == format(modeIjin.periode.start, "yyyy") ? "(Select)" : null}
                            </option>
                        {/each}
                    </select>
                    <select bind:value={formIjin.month} onchange={()=> tableIjin.invalidate()}>
                        {#each dataBulan as {title, value}}
                            <option value={value}>
                                {title} {value == Number(format(modeIjin.periode.start, "M")) ? "(Select)" : null}
                            </option>
                        {/each}
                    </select>
                    <MyInput type='text' bind:value={tableIjinSearch.value}/>
                    <MyButton onclick={()=>tableIjinSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableIjin.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableIjin}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableIjin} field="name">Nama</ThSort>
                            <ThSort table={tableIjin} field="date">Tanggal</ThSort>
                            <ThSort table={tableIjin} field="type">Tipe</ThSort>
                            <ThSort table={tableIjin} field="description">Deskripsi</ThSort>
                            <ThSort table={tableIjin} field="status">Status</ThSort>
                            <ThSort table={tableIjin} field="approval_name">Approval</ThSort>
                            <ThSort table={tableIjin} field="">#</ThSort>
                        </TableHead>

                        {#if tableIjin.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                            <TableBody tableBodyClass="divide-y">
                                {#if tableIjin.rows.length > 0}
                                    {#each tableIjin.rows as row:any}
                                        <TableBodyRow class='h-10'>
                                            <TableBodyCell tdClass='break-all font-medium'>{row.name}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.date, "date")}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{row.type}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{row.description}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{row.status}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <div class="flex flex-col">
                                                    {row.approval_name}
                                                    {#if row.is_delegate}
                                                        <Badge class='self-start' color='indigo'>Delegate</Badge>
                                                    {/if}
                                                </div>
                                            </TableBodyCell>
                                            <TableBodyCell>
                                                {#if !formIjin.edit}
                                                    {#if pecahArray(userProfile.access_ijin, "U") && row.status == "Waiting"}
                                                        <MyButton onclick={()=> formIjinEdit(row.ijin_id)}><Pencil size={12} /></MyButton>
                                                        <Tooltip class='z-10'>Edit</Tooltip>
                                                    {/if}
                                                    {#if pecahArray(userProfile.access_ijin, "D") && row.status == "Waiting"}
                                                        <MyButton onclick={()=> {
                                                            formIjin.modalDelete = true
                                                            formIjin.answer.ijin_id = row.ijin_id
                                                        }}><Trash size={12} /></MyButton>
                                                        <Tooltip class='z-10'>Hapus</Tooltip>
                                                    {/if}
                                                    {#if row.status == "Waiting" && !row.is_delegate}
                                                        <MyButton onclick={()=> handleDelegateIjin(row.ijin_id, row.approval)}> <Highlighter size={12}/> </MyButton>
                                                        <Tooltip class='z-10'>Delegate</Tooltip>
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
                    <MyPagination table={tableIjin} />
                </Datatable>
            </div>
        </TabItem>
        {#if userProfile.level > 1}
            <TabItem title="Approval Ijin" onclick={() => modeIjin.tabNo = 2}>
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                    {#if formApprovalIjin.error}
                        {#each formApprovalIjin.error.split(';') as v}
                            <MyAlert pesan={v} func={()=> formApprovalIjin.error = ""} color='red'/>
                        {/each}
                    {:else if formApprovalIjin.success}
                        <MyAlert pesan={formApprovalIjin.success} func={()=> formApprovalIjin.success = ""} color='green'/>
                    {/if}

                    {#if formApprovalIjin.loading}
                        <MyLoading message="Load cuti data"/>
                    {/if}

                    <div class="flex gap-2">
                        <MyButton onclick={()=> tableApprovalIjin.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                    
                    <Datatable table={tableApprovalIjin}>
                        <Table>
                            <TableHead>
                                <ThSort table={tableApprovalIjin} field="name">Payroll</ThSort>
                                <ThSort table={tableApprovalIjin} field="name">Nama</ThSort>
                                <ThSort table={tableApprovalIjin} field="date">Tanggal</ThSort>
                                <ThSort table={tableApprovalIjin} field="description">Deskripsi</ThSort>
                                <ThSort table={tableApprovalIjin} field="">#</ThSort>
                            </TableHead>

                            {#if tableApprovalIjin.isLoading}
                                <div class="flex p-4 items-center">
                                    <MyLoading message="Loading data"/>
                                </div>
                            {:else}
                                <TableBody tableBodyClass="divide-y">
                                    {#if tableApprovalIjin.rows.length > 0}
                                        {#each tableApprovalIjin.rows as row}
                                            <TableBodyRow class='h-10'>
                                                <TableBodyCell tdClass='break-all font-medium'>{row.payroll}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{row.name}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.date, "date") || ""}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{row.description ?? "-"}</TableBodyCell>
                                                <TableBodyCell>
                                                    {#if row.status == "Waiting"}
                                                        <Button onclick={()=> handleApproveIjin(row.ijin_id, row.approval, 'Approved')} color='green' class='p-2' pill><Check size={14} /></Button>
                                                        <Button onclick={()=> handleApproveIjin(row.ijin_id, row.approval, 'Reject')} color='red' class='p-2' pill><X size={14} /></Button>
                                                    {/if}
                                                </TableBodyCell>
                                            </TableBodyRow>
                                        {/each}
                                    {:else}
                                        <TableBodyRow class='h-10'>
                                            <TableBodyCell colspan={10}><span>No data available</span></TableBodyCell>
                                        </TableBodyRow>
                                    {/if}
                                </TableBody>
                            {/if}
                        </Table>
                        <MyPagination table={tableApprovalIjin} />
                    </Datatable>
                </div>
            </TabItem>
        {/if}
        {#if userProfile?.user_hrd}
            <TabItem title="Daftar Ijin" onclick={() => modeIjin.tabNo = 3}>
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                    {#if formListIjin.error}
                        {#each formListIjin.error.split(';') as v}
                            <MyAlert pesan={v} func={()=> formListIjin.error = ""} color='red'/>
                        {/each}
                    {:else if formListIjin.success}
                        <MyAlert pesan={formListIjin.success} func={()=> formListIjin.success = ""} color='green'/>
                    {/if}

                    {#if formListIjin.loading}
                        <MyLoading message="Load cuti data"/>
                    {/if}

                    <div class="flex gap-2">
                        <select bind:value={tableListIjin.rowsPerPage} onchange={() => tableListIjin.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                        <select bind:value={formListIjin.year} onchange={()=> tableListIjin.invalidate()}>
                            {#each dataTahun as {title, value}}
                                <option value={value}>
                                    {title} {value.toString() == format(modeIjin.periode.start, "yyyy") ? "(Select)" : null}
                                </option>
                            {/each}
                        </select>
                        <select bind:value={formListIjin.month} onchange={()=> tableListIjin.invalidate()}>
                            {#each dataBulan as {title, value}}
                                <option value={value}>
                                    {title} {value == Number(format(modeIjin.periode.start, "M")) ? "(Select)" : null}
                                </option>
                            {/each}
                        </select>
                        <MyInput type='text' bind:value={tableListIjinSearch.value}/>
                        <MyButton onclick={()=>tableListIjinSearch.set()}><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableListIjin.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                    
                    <Datatable table={tableListIjin}>
                        <Table>
                            <TableHead>
                                <ThSort table={tableListIjin} field="name">Payroll</ThSort>
                                <ThSort table={tableListIjin} field="name">Nama</ThSort>
                                <ThSort table={tableListIjin} field="date">Tanggal</ThSort>
                                <ThSort table={tableListIjin} field="approval_name">Approval</ThSort>
                                <ThSort table={tableListIjin} field="description">Deskripsi</ThSort>
                                <ThSort table={tableListIjin} field="status">Status</ThSort>
                                <!-- <ThSort table={tableListIjin} field="">#</ThSort> -->
                            </TableHead>

                            {#if tableListIjin.isLoading}
                                <div class="flex p-4 items-center">
                                    <MyLoading message="Loading data"/>
                                </div>
                            {:else}
                                <TableBody tableBodyClass="divide-y">
                                    {#if tableListIjin.rows.length > 0}
                                        {#each tableListIjin.rows as row}
                                            <TableBodyRow class='h-10'>
                                                <TableBodyCell tdClass='break-all font-medium'><section class={`${row.payroll == user.payroll ? "underline":""}`}>{row.payroll}</section></TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{row.name}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.date, "date") || ""}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{row.approval_name}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{row.description}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{row.status}</TableBodyCell>
                                                <!-- <TableBodyCell>
                                                    {#if row.payroll != user.payroll}
                                                        <Button onclick={()=> handleApproveIjin(row.ijin_id, row.approval, 'Cancelled')} color='dark' class='p-2' pill><Ban size={14} /></Button>
                                                    {/if}
                                                </TableBodyCell> -->
                                            </TableBodyRow>
                                        {/each}
                                    {:else}
                                        <TableBodyRow class='h-10'>
                                            <TableBodyCell colspan={10}><span>No data available</span></TableBodyCell>
                                        </TableBodyRow>
                                    {/if}
                                </TableBody>
                            {/if}
                        </Table>
                        <MyPagination table={tableListIjin} />
                    </Datatable>
                </div>
            </TabItem>
        {/if}
    </Tabs>
</main>

