<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Tabs, TabItem, Badge, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Label, Select, Modal, Timeline, TimelineItem, Alert, Button } from 'flowbite-svelte';
	import {Calendar, Ban, Check, Search, RefreshCw, Pencil, Trash, Plus, Save, X } from '@lucide/svelte'
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
    import MyButton from '$/lib/components/MyButton.svelte';
	import MyLoading from '$/lib/components/MyLoading.svelte';
	import MyInput from '$/lib/components/MyInput.svelte';
    import axios from 'axios';
	import { formatTanggal, pecahArray, generatePeriode, getParams } from '$/lib/utils.js';
	import { format, getYear, differenceInDays } from 'date-fns';
    import { CalendarWeekSolid, FileCloneOutline } from 'flowbite-svelte-icons';
    import {z} from 'zod'
    import {fromZodError} from 'zod-validation-error'
    import Svelecte from 'svelecte';
    import MyPagination from '@/MyPagination.svelte';
    import MyAlert from '@/MyAlert.svelte';

    const rowsPerPage = 10
    let {data} = $props()
    let user = $derived(data.user) 
    let userProfile = $derived(data.userProfile)
    let setting = $derived(data.periode)
    let periode = $derived(generatePeriode(new Date().toString(), Number(setting?.start_periode), Number(setting?.end_periode)))
    
    const eventCuti = ['Cuti Bersama','Event Kantor','Hari Libur', "Ijin"]
    const typeList = $derived.by(()=> {
        return userProfile.user_hrd ? 
            [
                ['Cuti Tahunan', ""],
                ['Cuti Hamil & Melahirkan', 90], 
                ['Cuti Keguguran', 7],
                ['Cuti Haid', 1],
            ] 
            :
            [
                ['Cuti Tahunan', ""],
                ['Cuti Hamil & Melahirkan', 90], 
            ] 
    })

    let openRow: string[] = $state([]) 
    const toggleRow = (i: string) => {
        if(openRow.includes(i)){
            openRow = openRow.filter((item) => item !== i)
        } else {
            openRow.push(i)
        }
    }
        
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

    // Table Cuti
    let tableCuti = $state(new TableHandler([], {rowsPerPage}))
    let tableCutiSearch = tableCuti.createSearch()
    
    let formCutiAnswer = {
        answer: {
            cuti_id: "id",
            name: "",
            type: "",
            description: "",
            date:"",
            status: "Waiting",
            payroll: (()=> (userProfile.user_hrd || userProfile.level > 1) ? "" : user?.payroll)(),
            dept: (()=> user?.department)(),
            user_hrd: (()=> userProfile?.user_hrd)(),
            approval: (() => user?.approver || null)(),
            user_approval: (()=> user?.employee_employee_approverToemployee?.payroll || null)(),
            user_delegate: (()=> user?.employee_employee_approverToemployee?.employee_employee_substituteToemployee?.payroll || null)()
        },
        dept: (()=> userProfile.user_hrd ? "" : user?.department)(),
        success:"",
        error:"",
        modalDelete: false,
        loading:false,
        add:false,
        edit:false,
    }
    
    let formCuti = $state({...formCutiAnswer})
    
    const formCutiSubmit = async () =>{
        try {
            formCuti.loading = true
            const valid = z.object({
                date: z.union([z.string().trim().min(1), z.tuple([z.string(), z.string()], {message: "Date is not valid"})]),
                type: z.string().trim().min(1),
                description: z.string().trim().min(5),
                approval: z.string().trim().min(1),
            })
            const isValid = valid.safeParse(formCuti.answer)
            if(isValid.success){
                const req = await axios.post('/api/cuti', formCuti.answer)
                const res = await req.data
                formCutiBatal()
                tableCuti.invalidate()
                formCuti.success = res.message
            }else{
                const err = fromZodError(isValid.error)
                formCuti.success = ""
                formCuti.error = err.message
            }
        } catch (error: any) {
            formCuti.error = error.response.data.message
            formCuti.success = ""
        } finally {
            formCuti.loading = false
        }
    }

    const formCutiBatal = () => formCuti = {...formCutiAnswer}
    
    const formCutiEdit = async (id:string) =>{
        try {
            formCuti.success = ""
            formCuti.error = ""
            formCuti.loading = true
            const req = await axios.get(`/api/cuti/${id}/edit`)
            const res = await req.data
            
            if(res){
                formCuti.answer = {...res}
                setTimeout(()=>{
                    formCuti.answer.date = formatTanggal(res.date, "date")
                }, 100)

                fillCuti(res.payroll)
                
                formCuti.edit = true
                formCuti.add = false
                formCuti.loading = false
            }else{
                formCuti.error = "Cant edit data"
                formCuti.success = ""
            }
        } catch (error) {
            formCuti.loading = false
        } finally {
            formCuti.loading = false
            tableCuti.invalidate()
        }
    }

    const formCutiDelete = async (id:string) =>{
        try {
            formCuti.loading = true
            const req = await axios.delete(`/api/cuti/${id}/delete`)
            const res = await req.data
            formCuti.error = ""
            formCuti.success = res.message
        } catch (error) {
            formCuti.error = "Cant delete Cuti"
            formCuti.success = ""
        } finally {
            formCuti.loading = false
            tableCuti.invalidate()
        }
    }

    const handleDelegateCuti = async (cuti_id: string, approval: string) => {
        try {
            formCuti.answer.cuti_id = cuti_id
            formCuti.answer.approval = approval
            const req = await axios.post('/api/cuti/delegate', formCuti.answer)
            const res = await req.data
            formCutiBatal()
            tableCuti.invalidate()
            formCuti.error = ""
            formCuti.success = res.message
        } catch (error: any) {
            formCuti.error = error.response.data.message
            formCuti.success = ""
        }
    }

    // Approval Cuti
    let tableApprovalCuti = $state(new TableHandler([], {rowsPerPage}))
    
    const formApprovalCutiAnswer = {
        answer: {
            cuti_id: "id",
            status: "Waiting",
            approval: ""
        },
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    }
    
    let formApprovalCuti = $state({...formApprovalCutiAnswer})

    const handleApproveCuti = async (cuti_id: string, approval: string, status: string) => {
        try {
            formApprovalCuti.answer.cuti_id = cuti_id
            formApprovalCuti.answer.approval = approval
            formApprovalCuti.answer.status = status
            const req = await axios.post('/api/cuti/approve', formApprovalCuti.answer)
            const res = await req.data
            if(userProfile.user_hrd) tableListCuti.invalidate()
            tableApprovalCuti.invalidate()
            formApprovalCuti.error = ""
            formApprovalCuti.success = res.message
        } catch (error: any) {
            formApprovalCuti.error = error.response.data.message
            formApprovalCuti.success = ""
        }
    }
    
    // List Cuti for HRD
    let tableListCuti = $state(new TableHandler([], {rowsPerPage}))
    let tableListCutiSearch = tableListCuti.createSearch()
    
    const formListCutiAnswer = {
        answer: {
            cuti_id: "id",
            status: "Waiting",
        },
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    }

    let formListCuti = $state({...formListCutiAnswer})
    
    const getCutiUser = async () =>{
        const year = getYear(new Date())
        // const month = getMonth(new Date()) + 1
        const month = 12
        const req = await fetch(`/api/data?type=get_cuti_user&val=${user.payroll}&year=${year}&month=${month}`)
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

    const fillCuti = async (val: string) => {
        const req = await fetch(`/api/data?type=user_for_ijin&val=${val || ""}`)
        const res = await req.json()
        if(res){
            formCuti.answer.name = res.name
            formCuti.answer.approval = res.employee_employee_approverToemployee.payroll
            formCuti.answer.user_approval = res.employee_employee_approverToemployee.name
            formCuti.answer.user_delegate = res.employee_employee_approverToemployee.employee_employee_substituteToemployee.name
        }
        return await res
    }
    
    $effect(()=>{
        tableCuti.load(async (state:State) =>{
            try {
                const req = await fetch(`/api/cuti?${getParams(state)}&payroll=${user?.payroll}`)
                if(!req.ok) throw new Error('Gagal mengambil data')
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        if (userProfile.level > 1){
            tableApprovalCuti.load(async (state:State) =>{
                try {
                    const req = await fetch(`/api/cuti/approve?${getParams(state)}&payroll=${user?.payroll}&dept=${user?.department}`)
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
            tableListCuti.load(async (state:State) =>{
                try {
                    const req = await fetch(`/api/cuti/list?${getParams(state)}`)
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
    
    setTimeout(()=>{
        tableCuti.invalidate()
        if (userProfile.level > 1)
            tableApprovalCuti.invalidate()
        if (userProfile.user_hrd)
            tableListCuti.invalidate()
    }, 1000)
</script>

<svelte:head>
    <title>Cuti</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">    
    {#await getCutiUser()}
        <MyLoading message={`Loading users data`}/>
    {:then}
        <div class={`flex rounded-lg p-6 gap-4 border-[2px] border-slate-200 text-textdark`}>
            <div class="flex flex-col gap-2 min-w-fit">
                <div class="flex items-center gap-2">
                    <Calendar size={18}/>
                    <div class="flex gap-2">
                        <span class="font-bold">Today,</span>
                        <span>{format(new Date(), "dd-MM-yyyy")}</span>
                    </div>
                </div>
                <div class="flex gap-2 items-center">
                    <span>Periode</span>
                    <div class="flex flex-col gap-2">
                        <Badge color='indigo'>{periode.start}</Badge>
                        <Badge color='indigo'>{periode.end}</Badge>
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
                <MyButton className='self-start' onclick={getCutiUser}>Refresh</MyButton>
            </div>
        </div>
    {/await}

    <Modal title={modalHeader.val} size={'sm'} bind:open={modalHeader.modal}>
        {#await getCutiCalendar(modalHeader.val)}
            <MyLoading message={`Loading ${modalHeader.val} data`}/>
        {:then val}
            {#if val.length > 0}
                <div class="ps-4">
                    <p class='-ms-3 mb-5'>There {val.length} day{val.length > 1 ? "s":""} on '{modalHeader.val}' events</p>
                    <Timeline order="vertical">
                        {#each val as {description, date}}
                            {#if differenceInDays(date, new Date()) > 0}
                                <Badge class='ms-2 mb-2'>Upcoming</Badge>
                            {:else if differenceInDays(date, new Date()) == 0}
                                <Badge class='ms-2 mb-2' color="green">Today</Badge>
                            {/if}
                            <TimelineItem  title={formatTanggal(date, "date")} date={format(date, "EEEE")}>
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
                <span class='text-center'>There is no events</span>
            {/if}
        {/await}
    </Modal>

    <Modal bind:open={formCuti.modalDelete} autoclose>
        <div class="flex flex-col gap-6">
            <h3>Delete Cuti ?</h3>
        </div>
        <svelte:fragment slot="footer">
            <Button color='green' disabled={formCuti.loading} onclick={() => formCutiDelete(formCuti.answer.cuti_id)}>Yes, delete this data</Button>
            <Button color='red' onclick={() => formCuti.modalDelete = false}>No</Button>
        </svelte:fragment>
    </Modal>
    
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="My Cuti">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                {#if formCuti.error}
                    {#each formCuti.error.split(';') as v}
                        <MyAlert pesan={v} func={()=> formCuti.error = ""} color='red'/>
                    {/each}
                {:else if formCuti.success}
                    <MyAlert pesan={formCuti.success} func={()=> formCuti.success = ""} color='green'/>
                {/if}

                {#if pecahArray(userProfile?.access_cuti, "C")}
                    <div class="flex gap-2">
                        {#if formCuti.add || formCuti.edit}
                            {#if pecahArray(userProfile?.access_cuti, "C") || pecahArray(userProfile.access_cuti, "U")}
                                <MyButton onclick={formCutiBatal}><Ban size={16} /></MyButton>
                                <MyButton disabled={formCuti.loading} onclick={formCutiSubmit}><Save size={16}/></MyButton>
                            {/if}
                        {:else}
                            {#if pecahArray(userProfile?.access_cuti, "C")}
                                <MyButton onclick={()=> {
                                    fillCuti(formCuti.answer.payroll)
                                    formCuti.add = true
                                }}><Plus size={16}/></MyButton>
                            {/if}
                        {/if}
                    </div>
                {/if}

                {#if formCuti.loading}
                    <MyLoading message="Load cuti data"/>
                {/if}

                {#if formCuti.add || formCuti.edit}
                    <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <input type='hidden' name="cuti_id" disabled={formCuti.edit} bind:value={formCuti.answer.cuti_id}/>

                            {#if formCuti.add}
                                {#await getUser(formCuti.dept)}
                                    <MyLoading message="Loading data"/>
                                {:then val}
                                    <div class="flex flex-col justify-start gap-2">
                                        <Label>Payroll</Label>
                                        <Svelecte class='border-none' disabled={userProfile.level == 1} optionClass='p-2' name='payroll' required searchable selectOnTab multiple={false} bind:value={formCuti.answer.payroll} 
                                        options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " - " + v.name}))}
                                        onChange={(e) => fillCuti(e.value)}/>
                                    </div>
                                {/await}
                            {:else if formCuti.edit}
                                <MyInput type='text' title='Payroll' disabled value={formCuti.answer.payroll}/>
                            {/if}
                            
                            <MyInput type='text' title='Name' disabled value={formCuti.answer.name}/>
                            <MyInput type='text' title='Approval' disabled value={formCuti.answer.user_approval}/>
                            <MyInput type='text' title='Substitute' disabled value={formCuti.answer.user_delegate}/>
                            
                            <div class="flex flex-col gap-2">
                                {#if formCuti.add}
                                    <MyInput type='daterange' title='Date' name="date" bind:value={formCuti.answer.date}/>
                                {:else if formCuti.edit}
                                    <MyInput type='date' title='Date' disabled={formCuti.answer.type != "Cuti Tahunan"} name="date" bind:value={formCuti.answer.date}/>
                                {/if}
                                <div class="flex flex-col gap-2">
                                    <Label>Type</Label>
                                    <Svelecte class='border-none' optionClass='p-2' name='payroll' required selectOnTab multiple={false} bind:value={formCuti.answer.type} 
                                        options={typeList.map(([v, duration]) => ({value: v, text: v + " - " + duration}))}/>                                    
                                </div>
                            </div>
                            <div class="flex flex-col self-start">
                                <MyInput type='textarea' title='Description' rows={4} name="description" bind:value={formCuti.answer.description}/>
                                <span class='text-[.9rem] italic'>Description min 5 character</span>
                            </div>
                        </div>

                        <div class="flex flex-col">
                            <span class='text-[.8rem] italic'>*You can insert cuti if there is no applicant with same date and status is not same as "Waiting" and "Approved"</span>
                        </div>
                    </form>
                {/if}
                
                <div class="flex gap-2">
                    <select bind:value={tableCuti.rowsPerPage} onchange={() => tableCuti.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <MyInput type='text' bind:value={tableCutiSearch.value}/>
                    <MyButton onclick={()=>tableCutiSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=>tableCuti.invalidate()}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableCuti}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableCuti} field="name">Name</ThSort>
                            <ThSort table={tableCuti} field="date">Date</ThSort>
                            <ThSort table={tableCuti} field="type">Type</ThSort>
                            <ThSort table={tableCuti} field="description">Description</ThSort>
                            <ThSort table={tableCuti} field="status">Status</ThSort>
                            <ThSort table={tableCuti} field="approval_name">Approval</ThSort>
                            <ThSort table={tableCuti} field="">#</ThSort>
                        </TableHead>

                        {#if tableCuti.isLoading}
                            <div class="flex p-4 items-center">
                                <MyLoading message="Loading data"/>
                            </div>
                        {:else}
                            <TableBody tableBodyClass="divide-y">
                                {#if tableCuti.rows.length > 0}
                                    {#each tableCuti.rows as row}
                                        <TableBodyRow class='h-10'>
                                            <TableBodyCell tdClass='break-all font-medium'>{row.name}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.date, "date") || ""}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{row.type ?? "-"}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{row.description ?? "-"}</TableBodyCell>
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
                                                {#if !formCuti.edit}
                                                    {#if pecahArray(userProfile.access_cuti, "U") && row.status == "Waiting"}
                                                        <MyButton onclick={()=> formCutiEdit(row.cuti_id)}><Pencil size={12} /></MyButton>
                                                    {/if}
                                                    {#if pecahArray(userProfile.access_cuti, "D") && row.status == "Waiting"}
                                                        <MyButton onclick={()=> {
                                                            formCuti.modalDelete = true
                                                            formCuti.answer.cuti_id = row.cuti_id
                                                        }}><Trash size={12} /></MyButton>
                                                    {/if}
                                                    {#if row.status == "Waiting" && !row.is_delegate}
                                                        <MyButton onclick={()=> handleDelegateCuti(row.cuti_id, row.approval)}> <span class="text-[.8rem]">Delegate</span> </MyButton>
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
                    <MyPagination table={tableCuti} />
                </Datatable>
            </div>
        </TabItem>
        {#if userProfile.level > 1}
            <TabItem title="Approval Cuti">
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                    {#if formApprovalCuti.error}
                        {#each formApprovalCuti.error.split(';') as v}
                            <MyAlert pesan={v} func={()=> formApprovalCuti.error = ""} color='red'/>
                        {/each}
                    {:else if formApprovalCuti.success}
                        <MyAlert pesan={formApprovalCuti.success} func={()=> formApprovalCuti.success = ""} color='green'/>
                    {/if}

                    {#if formApprovalCuti.loading}
                        <MyLoading message="Load cuti data"/>
                    {/if}

                    <div class="flex gap-2">
                        <MyButton onclick={()=>tableApprovalCuti.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                    
                    <Datatable table={tableApprovalCuti}>
                        <Table>
                            <TableHead>
                                <ThSort table={tableApprovalCuti} field="name">Payroll</ThSort>
                                <ThSort table={tableApprovalCuti} field="name">Name</ThSort>
                                <ThSort table={tableApprovalCuti} field="date">Date</ThSort>
                                <ThSort table={tableApprovalCuti} field="description">Reason</ThSort>
                                <ThSort table={tableApprovalCuti} field="">#</ThSort>
                            </TableHead>

                            {#if tableApprovalCuti.isLoading}
                                <div class="flex p-4 items-center">
                                    <MyLoading message="Loading data"/>
                                </div>
                            {:else}
                                <TableBody tableBodyClass="divide-y">
                                    {#if tableApprovalCuti.rows.length > 0}
                                        {#each tableApprovalCuti.rows as row}
                                            <TableBodyRow class='h-10'>
                                                <TableBodyCell tdClass='break-all font-medium'>{row.payroll}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{row.name}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{formatTanggal(row.date, "date") || ""}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{row.description ?? "-"}</TableBodyCell>
                                                <TableBodyCell>
                                                    {#if row.status == "Waiting"}
                                                        <Button onclick={()=> handleApproveCuti(row.cuti_id, row.approval, 'Approved')} color='green' class='p-2' pill><Check size={14} /></Button>
                                                        <Button onclick={()=> handleApproveCuti(row.cuti_id, row.approval, 'Reject')} color='red' class='p-2' pill><X size={14} /></Button>
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
                        <MyPagination table={tableApprovalCuti} />
                    </Datatable>
                </div>
            </TabItem>
        {/if}
        {#if userProfile?.user_hrd}
            <TabItem title="List Cuti">
                <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                    {#if formListCuti.error}
                        {#each formListCuti.error.split(';') as v}
                            <MyAlert pesan={v} func={()=> formListCuti.error = ""} color='red'/>
                        {/each}
                    {:else if formListCuti.success}
                        <MyAlert pesan={formListCuti.success} func={()=> formListCuti.success = ""} color='green'/>
                    {/if}

                    {#if formListCuti.loading}
                        <MyLoading message="Load cuti data"/>
                    {/if}

                    <div class="flex gap-2">
                        <select bind:value={tableListCuti.rowsPerPage} onchange={() => tableListCuti.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                        <MyInput type='text' bind:value={tableListCutiSearch.value}/>
                        <MyButton onclick={()=>tableListCutiSearch.set()}><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableListCuti.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                    
                    <Datatable table={tableListCuti}>
                        <Table>
                            <TableHead>
                                <ThSort table={tableListCuti} field="name">Payroll</ThSort>
                                <ThSort table={tableListCuti} field="name">Name</ThSort>
                                <ThSort table={tableListCuti} field="date">Date</ThSort>
                                <ThSort table={tableListCuti} field="approval_name">Approval</ThSort>
                                <ThSort table={tableListCuti} field="description">Reason</ThSort>
                                <ThSort table={tableListCuti} field="status">Status</ThSort>
                                <!-- <ThSort table={tableListCuti} field="">#</ThSort> -->
                            </TableHead>

                            {#if tableListCuti.isLoading}
                                <div class="flex p-4 items-center">
                                    <MyLoading message="Loading data"/>
                                </div>
                            {:else}
                                <TableBody tableBodyClass="divide-y">
                                    {#if tableListCuti.rows.length > 0}
                                        {#each tableListCuti.rows as row}
                                            <TableBodyRow class='h-10'>
                                                <TableBodyCell><section class={`${row.payroll == user.payroll ? "underline":""}`}>{row.payroll}</section></TableBodyCell>
                                                <TableBodyCell>{row.name}</TableBodyCell>
                                                <TableBodyCell>{formatTanggal(row.date, "date") || ""}</TableBodyCell>
                                                <TableBodyCell>{row.approval_name}</TableBodyCell>
                                                <TableBodyCell>{row.description}</TableBodyCell>
                                                <TableBodyCell>{row.status}</TableBodyCell>
                                                <!-- <TableBodyCell>
                                                    {#if row.payroll != user.payroll}
                                                        <Button onclick={()=> handleApproveCuti(row.cuti_id, row.approval, 'Cancelled')} color='dark' class='p-2' pill><Ban size={14} /></Button>
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
                        <MyPagination table={tableListCuti} />
                    </Datatable>
                </div>
            </TabItem>
        {/if}
    </Tabs>
</main>