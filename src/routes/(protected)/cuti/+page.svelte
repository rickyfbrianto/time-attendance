<script lang="ts">
    import {fade} from 'svelte/transition'
    import { Tabs, TabItem, Toast, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Label, Select, Modal, Timeline, TimelineItem, Hr } from 'flowbite-svelte';
	import {Calendar, Ban, Check, Search, RefreshCw, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Pencil, Trash, Plus, Save, Badge, RotateCw } from '@lucide/svelte'
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
    import MyButton from '@lib/components/MyButton.svelte';
	import MyLoading from '@lib/components/MyLoading.svelte';
	import MyInput from '@lib/components/MyInput.svelte';
    import axios from 'axios';
	import { formatTanggal, pecahArray } from '@lib/utils.js';
	import { eachDayOfInterval, format, getDay, getMonth, getYear } from 'date-fns';
    import { CalendarWeekSolid } from 'flowbite-svelte-icons';

    const rowsPerPage = 10
    const eventCuti = ['Cuti Bersama','Event Kantor','Hari Libur']

    let headerData: {title:string, value:string, icon: any }[] = $state([])

    let {data} = $props()
    let user = $derived(data.user) 
    let userProfile = $derived(data.userProfile)
    
    let tableCuti = $state(new TableHandler([], {rowsPerPage}))
    let tableCutiSearch = tableCuti.createSearch()

    let modalHeader = $state({
        modal:false,
        val:""
    })
    
    const formCutiAnswer = {
        cuti_id: "id",
        payroll: user?.payroll,
        type: "",
        description: "",
        date:"",
        status: "Waiting"
    }
    
    let formCuti = $state({
        answer: {...formCutiAnswer},
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    })
    
    const formCutiSubmit = async () =>{
        try {
            formCuti.error = ""
            formCuti.loading = true
            const req = await axios.post('/api/cuti', formCuti.answer)
            const res = await req.data
            formCuti.success = res.message
            formCutiBatal()
        } catch (error: any) {
            formCuti.error = error.message
            formCuti.success = ""
        } finally {
            formCuti.loading = false
            tableCuti.invalidate()
        }
    }

    const formCutiBatal = () =>{
        formCuti.answer = {...formCutiAnswer}
        formCuti.add = false
        formCuti.edit = false
    }
    
    const formCutiEdit = async (id:string) =>{
        try {
            formCuti.loading = true
            const req = await axios.get(`/api/cuti/${id}`)
            const res = await req.data
            
            formCuti.answer = {...res}
            
            formCuti.edit = true
            formCuti.add = false
            formCuti.loading = false
        } catch (error) {
            formCuti.loading = false
        }
    }

    const formCutiDelete = async (id:string) =>{
        try {
            formCuti.loading = true
            const req = await axios.delete(`/api/cuti/${id}`)
            const res = await req.data
            tableCuti.invalidate()
        } catch (error) {
        } finally {
            formCuti.loading = false
        }
    }

    const typeList =[
        ['Pernikahan Saya', 3],
        ['Pernikahan Keluarga', 4], 
        ['Kelahiran', 5],
        ['Kematian', 6],
        ['Bencana Alam', 7],
        ['Keluarga Rawat Inap', 8],
        ['Cuti Khitanan/Baptis',2],
        ['Ibadah Haji',10]
    ]
    
    const getCutiUser = async () =>{
        const year = getYear(new Date())
        // const month = getMonth(new Date()) + 1
        const month = 12
        const req = await fetch(`/api/data?type=get_cuti_user&val=${user.payroll}&year=${year}&month=${month}`)
        const res = await req.json()
        headerData = Object.entries(res).map(val => ({title:val[0], value:val[1] as string, icon:Calendar}))
    }

    let cutiBersamaCalendar = $state([])
    
    const getCutiCalendar = async (v: string) =>{
        const year = getYear(new Date())
        // const month = getMonth(new Date()) + 1
        const month = 12
        const req = await fetch(`/api/data?type=get_cuti_calendar&val=${v}&year=${year}&month=${month}`)
        const res = await req.json()
        cutiBersamaCalendar = res.map((v:any) => v.date)
        return res
    }
    
    $effect(()=>{
        tableCuti.load(async (state:State) =>{
            try {
                const req = await fetch(`/api/cuti?payroll=${user?.payroll}`)
                if(!req.ok) throw new Error('Gagal mengambil data')
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })
    })
    
    setTimeout(()=>{
        tableCuti.invalidate()
    }, 1000)
    
    const handleDetailHeader = (title: string) => {
        if(eventCuti.includes(title)){
            modalHeader.modal = true
            modalHeader.val = title
        }
    }
</script>

<svelte:head>   
    <title>Cuti</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">    
    {#await getCutiUser()}
        <MyLoading message={`Loading users data`}/>
    {:then val}
        <div class="relative grid grid-cols-1 justify-between rounded-lg p-6 gap-4 border-[2px] border-slate-200">
            <MyButton onclick={getCutiUser} className='absolute left-[-1rem] top-[-1rem] bg-bgdark'><RotateCw size={14} /></MyButton>
            <div class="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 items-center gap-4">
                {#each headerData as {title, value, icon: Icon}}
                    <button onclick={() => handleDetailHeader(title)} class={`flex flex-col items-start border-[2px] border-slate-200 px-4 py-2 rounded-lg overflow-hidden overflow-ellipsis whitespace-nowrap
                    ${eventCuti.includes(title) ? "cursor-pointer":""}
                    `}>
                        <span class="text-[.9rem] font-semibold">{title}</span>
                        <div class="flex justify-between items-center gap-2">
                            <Icon size={16}/>
                            <span class='text-[1.1rem] font-bold'>{value}</span>
                        </div>
                    </button>
                {/each}
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
                            <TimelineItem title={formatTanggal(date, false)} date={format(date, "EEEE")}>
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
    
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="Cuti">
            <div class="flex flex-col p-4 gap-4 border border-slate-400 rounded-lg">
                {#if formCuti.error || formCuti.success}
                    <Toast color="red">
                        {#if formCuti.error}
                            <Ban size={16} color="#d41c08" />
                        {:else}
                            <Check size={16} color="#08d42a" />
                        {/if}
                        {formCuti.error || formCuti.success}
                    </Toast>
                {/if}

                <div class="flex gap-2">
                    {#if formCuti.add || formCuti.edit}
                        {#if pecahArray(userProfile?.access_attendance, "C") || pecahArray(userProfile.access_attendance, "U")}
                            <MyButton onclick={formCutiBatal}><Ban size={16} /></MyButton>
                            <MyButton disabled={formCuti.loading} onclick={formCutiSubmit}><Save size={16}/></MyButton>
                        {/if}
                    {:else}
                        {#if pecahArray(userProfile?.access_attendance, "C")}
                            <MyButton onclick={()=> formCuti.add = true}><Plus size={16}/></MyButton>
                        {/if}
                    {/if}
                </div>

                {#if formCuti.loading}
                    <MyLoading message="Get cuti data"/>
                {/if}

                {#if formCuti.add || formCuti.edit}
                    <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg'>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <input type='hidden' name="ijin_id" disabled={formCuti.edit} bind:value={formCuti.answer.cuti_id}/>
                            <div class="flex flex-col gap-2">
                                <MyInput type='daterange' title='Date' name="date" bind:value={formCuti.answer.date}/>
                                <div class="flex flex-col gap-2">
                                    <Label>Type</Label>
                                    <Select bind:value={formCuti.answer.type}>
                                        {#each typeList as [item], i}
                                            <option value={item}>{item}</option>
                                        {/each}
                                    </Select>
                                </div>
                            </div>
                            <div class="flex flex-col self-start">
                                <MyInput type='textarea' title='Description' rows={4} name="description" bind:value={formCuti.answer.description}/>
                                <span class='text-[.9rem] italic'>Description min 5 character</span>
                            </div>
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
                            <ThSort table={tableCuti} field="cuti_id">Cuti ID</ThSort>
                            <ThSort table={tableCuti} field="name">Name</ThSort>
                            <ThSort table={tableCuti} field="date">Date</ThSort>
                            <ThSort table={tableCuti} field="type">Type</ThSort>
                            <ThSort table={tableCuti} field="description">Description</ThSort>
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
                                        <TableBodyRow>
                                            <TableBodyCell>{row.cuti_id}</TableBodyCell>
                                            <TableBodyCell>{row.name}</TableBodyCell>
                                            <TableBodyCell>{formatTanggal(row.date, false) || ""}</TableBodyCell>
                                            <TableBodyCell>{row.type ?? "-"}</TableBodyCell>
                                            <TableBodyCell>{row.description ?? "-"}</TableBodyCell>
                                            <TableBodyCell>
                                                {#if pecahArray(userProfile.access_attendance, "U") && !["HKC"].includes(row.type)}
                                                    <MyButton onclick={()=> formCutiEdit(row.cuti_id)}><Pencil size={12} /></MyButton>
                                                {/if}
                                                <MyButton onclick={()=> formCutiDelete(row.cuti_id)}><Trash size={12} /></MyButton>
                                            </TableBodyCell>
                                        </TableBodyRow>
                                    {/each}
                                {:else}
                                    <TableBodyRow>
                                        <TableBodyCell><span>No data available</span></TableBodyCell>
                                    </TableBodyRow>
                                {/if}
                            </TableBody>
                        {/if}
                    </Table>
                    {#if tableCuti.rows.length > 0}
                        <div class="flex justify-between items-center gap-2 mt-3">
                            <p class='text-textdark self-end text-[.9rem]'>
                                Showing {tableCuti.rowCount.start} to {tableCuti.rowCount.end} of {tableCuti.rowCount.total} rows
                                <Badge color="dark">Page {tableCuti.currentPage}</Badge>
                            </p>
                            <div class="flex gap-2">
                                <MyButton onclick={()=> tableCuti.setPage(1)}><ChevronFirst size={16} /></MyButton>
                                <MyButton onclick={()=> tableCuti.setPage('previous')}><ChevronLeft size={16} /></MyButton>
                                {#each tableCuti.pages as page}
                                    <MyButton className={`text-textdark text-[.9rem] px-3`} onclick={()=> tableCuti.setPage(page)} type="button">{page}</MyButton>
                                {/each}
                                <MyButton onclick={()=> tableCuti.setPage('next')}><ChevronRight size={16} /></MyButton>
                                <MyButton onclick={()=> tableCuti.setPage('last')}><ChevronLast size={16} /></MyButton>
                            </div>
                        </div>
                    {/if}
                </Datatable>
            </div>
        </TabItem>
    </Tabs>
</main>

