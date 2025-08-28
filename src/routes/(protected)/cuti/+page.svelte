<script lang="ts">
    import {fade, slide} from 'svelte/transition'
    import { Tabs, TabItem, Badge, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, Label, Tooltip, Modal, Timeline, TimelineItem, Alert, Button } from 'flowbite-svelte';
	import {Calendar, Ban, Check, Search, RefreshCw, Pencil, Trash, Plus, Save, X, Paperclip, Highlighter, Printer } from '@lucide/svelte'
    import { Datatable, TableHandler, ThSort, type State } from '@vincjo/datatables/server';
    import MyButton from '$/lib/components/MyButton.svelte';
	import MyLoading from '$/lib/components/MyLoading.svelte';
	import MyInput from '$/lib/components/MyInput.svelte';
    import axios from 'axios';
	import { formatTanggal, pecahArray, generatePeriode, getParams, dataTahun, dataBulan, namaHari, capitalEachWord } from '$/lib/utils.js';
	import { format, getYear, getMonth, differenceInDays, set, getDay } from 'date-fns';
    import { CalendarWeekSolid } from 'flowbite-svelte-icons';
    import {z} from 'zod'
    import {fromZodError} from 'zod-validation-error'
    import Svelecte from 'svelecte';
    import MyPagination from '@/MyPagination.svelte';
    import MyImage from '@/MyImage.svelte';
    import MyAlert from '@/MyAlert.svelte';
    import MyDatePicker from '@/MyDatePicker.svelte';
    import stm from '$/lib/assets/stm.png'
	import jsPDF from 'jspdf';
    import { applyPlugin } from 'jspdf-autotable'
	import { goto, invalidate } from '$app/navigation';
	import { dataStore } from '@lib/store/appstore.js';

    const rowsPerPage = 10
    let {data} = $props()
    let user = $derived(data.user) 
    let userProfile = $derived(data.userProfile)
    let setting = $derived(data.periode)
    let periode = $derived(generatePeriode(new Date().toString(), Number(setting?.start_periode), Number(setting?.end_periode)))
    
    const typeList = $derived.by(()=> {
        const temp = [
            {value: 'Cuti Tahunan', hari: 1},
            {value: 'Cuti Hamil & Melahirkan', hari: 1},
            {value: 'Cuti Keguguran', hari: 1},
            {value: 'Cuti Haid', hari: 1}             
        ]
        return temp
    })

    let headerData: {title:string, value:string, icon: any }[] = $state([])
    let modalHeader = $state({
        modal:false,
        val:""
    })

    const handleDetailHeader = (title: string) => {
        modalHeader.modal = true
        modalHeader.val = title
    }

    let modeCuti = $state({
        modalAttachment: false,
        attachment: "",
        periode: {
            start: (()=> generatePeriode(new Date().toString(), Number(setting?.start_periode), Number(setting?.end_periode)).start)(),
            end: (()=> generatePeriode(new Date().toString(), Number(setting?.start_periode), Number(setting?.end_periode)).end)(),
        },
        tabNo: 1
    })

    // Table Cuti
    let tableCuti = $state(new TableHandler([], {rowsPerPage}))
    let tableCutiSearch = tableCuti.createSearch()
    
    let formCutiAnswer = {
        answer: {
            cuti_id: "id",
            payroll: (() => user?.payroll)(),
            name: (() => user?.name)(),
            type: "",
            description: "",
            date:"",
            status: "Waiting",
            attachment: "",
            dept: (()=> user?.department)(),
            user_hrd: (()=> user.user_type == 'HR')(),
            approval: (() => user?.employee_employee_approverToemployee?.payroll || null)(),
            user_approval_name: "",
            user_delegate: (()=> user?.employee_employee_substituteToemployee?.payroll || null)(),
            user_delegate_name: ""
        },
        dept: (()=> user.user_type == 'HR' ? "" : user?.department)(),
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
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
                // date: z.union([z.string().trim().min(1), z.tuple([z.string(), z.string()], {message: "Date is not valid"})]),
                date: z.union([z.string().trim().min(1), 
                
                    z.tuple([z.union([z.string(), z.date()]), z.union([z.string(), z.date()])], {message: "Date is not valid"})
                ]),
                type: z.string().trim().min(1),
                description: z.string().trim().min(5),
                approval: z.string().trim().min(1),
                user_delegate: z.string().trim().min(1),
            })

            const formData = new FormData()
            Object.entries(formCuti.answer).forEach(val=>{
                formData.append(val[0], val[1])
            })  
            
            const isValid = valid.safeParse(formCuti.answer)
            if(isValid.success){
                const req = await axios.post('/api/cuti', formData)
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

    const showCutiAttachment = (id:string) =>{
        modeCuti.modalAttachment = true
        modeCuti.attachment = id
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
            if(user.user_type == 'HR') tableListCuti.invalidate()
            tableApprovalCuti.invalidate()
            formApprovalCuti.error = ""
            formApprovalCuti.success = res.message
        } catch (error: any) {
            formApprovalCuti.error = error.response.data.message
            formApprovalCuti.success = ""
        }
    }

    const handleCetakCuti = async (id:string) =>{
        try {
            applyPlugin(jsPDF)

            const req = await axios.get(`/api/cuti/${id}/print`)
            const res = await req.data[0]

            if(!res.cuti_signature) throw new Error('There is no signature for Applicant')
            if(!res.approval_signature) throw new Error('There is no signature for Approval')

            const doc = new jsPDF({
                orientation:"l",
                unit:"mm",
                format:"A4"
            })

            const colData = [12, 150, 172]
            let rowInc = 0
            let row1 = 4
            let row2 = 6
            let row3 = 8
            let row4 = 10

            rowInc += row2
            doc.setFont('times', 'normal', '')
            doc.addImage(stm, colData[0], rowInc, 20, 20)
            rowInc += row4
            doc.setFontSize(24)
            doc.text("P T. SAGATRADE MURNI", colData[0] + 75, rowInc).setFont(undefined, 'bold');
            rowInc += row3
            doc.setFontSize(18)
            doc.text("SURAT PERMOHONAN CUTI", colData[0] + 80, rowInc).setFont(undefined, 'bold');
            rowInc += row2
            doc.line(colData[0] , rowInc, 280, rowInc)
            
            doc.setFontSize(13)
            rowInc += row3
            let spasi = [44, 34]
            doc.text("NAMA", colData[0], rowInc)
            doc.text(": " + res.cuti_name, colData[0] + spasi[0], rowInc)
            doc.text("TGL", colData[2], rowInc)
            doc.text(": " + format(new Date().toString(), "d MMMM yyyy"), colData[2] + spasi[1], rowInc)
            rowInc += row3
            doc.text("NO. PEGAWAI", colData[0], rowInc)
            doc.text(": " + res.cuti_payroll, colData[0] + spasi[0], rowInc)
            doc.text("BAGIAN", colData[2], rowInc)
            doc.text(": " + res.cuti_dept, colData[2] + spasi[1], rowInc)
            rowInc += row3
            doc.text("TGL MULAI CUTI", colData[0], rowInc)
            doc.text(": " + format(res.start_date, "d MMMM yyyy"), colData[0] + spasi[0], rowInc)
            doc.text("SAMPAI TGL.", colData[2], rowInc)
            doc.text(": " + format(res.end_date, "d MMMM yyyy"), colData[2] + spasi[1], rowInc)
            
            doc.setFontSize(12)
            spasi = [70, 68]
            rowInc += row2
            doc.line(colData[0] , rowInc, 280, rowInc)
            doc.line(colData[1] - 5, rowInc, colData[1] - 5, rowInc + 38)
            const spasiHari = 50
            rowInc += row3
            doc.text("JUMLAH HARI CUTI YANG AKAN DIAMBIL", colData[0], rowInc)
            // doc.text("= ", colData[0] + spasi[0], rowInc)
            doc.text("JUMLAH HAK CUTI TAHUN INI", colData[1], rowInc)
            doc.text("= ", colData[1] + spasi[1], rowInc)
            doc.text("Hari", colData[1] + spasi[1] + spasiHari, rowInc)
            const indent = 8
            rowInc += row3
            doc.text("Hari kerja biasa", colData[0] + indent, rowInc)
            doc.text("= ", colData[0] + spasi[0], rowInc)
            doc.text("Hari", colData[0] + spasi[0] + spasiHari, rowInc)
            doc.text("Sudah diambil", colData[1] + indent, rowInc)
            doc.text("= ", colData[1] + spasi[1], rowInc)
            doc.text("Hari", colData[1] + spasi[1] + spasiHari, rowInc)
            rowInc += row3
            doc.text("Bukan hari kerja biasa/hr Libur", colData[0] + indent, rowInc)
            doc.text("= ", colData[0] + spasi[0], rowInc)
            doc.text("Hari", colData[0] + spasi[0] + spasiHari, rowInc)
            doc.text("Akan diambil/Hari kerja biasa", colData[1] + indent, rowInc)
            doc.text("= ", colData[1] + spasi[1], rowInc)
            doc.text("Hari", colData[1] + spasi[1] + spasiHari, rowInc)
            rowInc += row3
            doc.text("J U M L A H", colData[0] + indent, rowInc)
            doc.text("= " + res.approve_cuti, colData[0] + spasi[0], rowInc)
            doc.text("Hari", colData[0] + spasi[0] + spasiHari, rowInc)
            doc.text("SISA YANG BELUM DIAMBIL", colData[1], rowInc)
            doc.text("= ", colData[1] + spasi[1], rowInc)
            doc.text("Hari", colData[1] + spasi[1] + spasiHari, rowInc)
            rowInc += row2
            doc.line(colData[0] , rowInc, 280, rowInc)

            rowInc += row2
            doc.text("Tanda Tangan Pemohon :", colData[1] - 30, rowInc)
            
            rowInc += row1
            doc.addImage(import.meta.env.VITE_VIEW_SIGNATURE + res.cuti_signature, colData[1] - 20, rowInc, 18, 18)
            
            rowInc += row4 * 2.4
            doc.text(res.cuti_name, colData[1] - 30, rowInc)
            rowInc += row2
            doc.line(colData[0] , rowInc, 280, rowInc)
            doc.line(colData[1] - 5, rowInc, colData[1] - 5, rowInc + 44)
            
            rowInc += row3
            doc.text("Diketahui/Diperiksa oleh :", colData[0], rowInc)
            doc.text("Direkomendasi oleh :", colData[0] + 80, rowInc)
            doc.text("Disetujui oleh :", colData[1] + 5, rowInc)
            doc.text("BAG. PERSONALIA :", colData[1] + 80, rowInc)
            doc.line(colData[1] + 70, rowInc - row3, colData[1] + 70, rowInc + 36) //Vertical
            doc.line(colData[1] + 70, rowInc + 6, colData[1] + 130, rowInc + 6) //Horizontal
            
            rowInc += row2
            doc.text("BAG. PERSONALIA", colData[0], rowInc)

            rowInc += 2
            doc.addImage(import.meta.env.VITE_VIEW_SIGNATURE + res.approval_signature, colData[1] + 5, rowInc, 20, 20)
            rowInc += row4 * 2.4
            doc.text("HRD", colData[0], rowInc)
            doc.text("", colData[0] + 80, rowInc)
            doc.text(res.approval_name, colData[1] + 5, rowInc)
            rowInc += row1
            doc.line(colData[0] , rowInc, 280, rowInc)

            const blob = doc.output('blob')
            const url = URL.createObjectURL(blob);

            window.open(url); // buka tab baru
        } catch (err) {
            goto(`/api/handleError?msg=${err.message}`)
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
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        success:"",
        error:"",
        loading:false,
        add:false,
        edit:false,
    }

    let formListCuti = $state({...formListCutiAnswer})
    
    const getCutiUser = async () => await invalidate(() => true)
    
    const getCutiCalendar = async (v: string) =>{
        const year = getYear(new Date())
        const month = 12
        const req = await fetch(`/api/data?type=get_cuti_dashboard&payroll=${user.payroll}&val=${v}&year=${year}&month=${month}`)
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
            formCuti.answer.name = capitalEachWord(res.name)

            formCuti.answer.approval = res.employee_employee_approverToemployee ? res.employee_employee_approverToemployee?.payroll : ""
            formCuti.answer.user_approval_name = res.employee_employee_approverToemployee ? capitalEachWord(res.employee_employee_approverToemployee?.name) : ""

            formCuti.answer.user_delegate = res.employee_employee_substituteToemployee?.payroll || ""
            formCuti.answer.user_delegate_name = capitalEachWord(res.employee_employee_substituteToemployee?.name) || ""
        }
        return await res
    }
    
    $effect(()=>{
        tableCuti.load(async (state:State) =>{
            try {
                const req = await fetch(`/api/cuti?${getParams(state)}&payroll=${user.payroll}&start_date=${modeCuti.periode.start}&end_date=${modeCuti.periode.end}`)
                if(!req.ok) throw new Error('Gagal mengambil data')
                const {items, totalItems} = await req.json()
                state.setTotalRows(totalItems)
                return items
            } catch (err:any) {
                console.log(err.message)
            }
        })

        if (user.level > 1){
            tableApprovalCuti.load(async (state:State) =>{
                try {
                    const req = await fetch(`/api/cuti/approve?${getParams(state)}&payroll=${user.payroll}&dept=${user?.department}`)
                    if(!req.ok) throw new Error('Gagal mengambil data')
                    const {items, totalItems} = await req.json()
                    state.setTotalRows(totalItems)
                    return items
                } catch (err:any) {
                    console.log(err.message)
                }
            })
        }

        if (user.user_type == 'HR'){
            tableListCuti.load(async (state:State) =>{
                try {
                    const req = await fetch(`/api/cuti/list?${getParams(state)}&start_date=${modeCuti.periode.start}&end_date=${modeCuti.periode.end}`)
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
        const temp = modeCuti.tabNo == 1 
            ? set(new Date(), {year: formCuti.year, month: formCuti.month, date: setting?.end_periode})
            : set(new Date(), {year: formListCuti.year, month: formListCuti.month, date: setting?.end_periode})
        modeCuti.periode = {
            start: generatePeriode(temp.toString(), Number(setting?.start_periode), Number(setting?.end_periode)).start,
            end: generatePeriode(temp.toString(), Number(setting?.start_periode), Number(setting?.end_periode)).end,
        }

        if(formCuti.answer.type == 'Cuti Haid'){
            formCuti.answer.date = [new Date(), new Date()]
        }
    })
    
    setTimeout(()=>{
        tableCuti.invalidate()
        if (user.level > 1) tableApprovalCuti.invalidate()
        if (user.user_type == 'HR') tableListCuti.invalidate()
    }, 1000)
</script>

<svelte:head>
    <title>Cuti</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full">
    <div class={`flex rounded-lg p-4 gap-4 border-[2px] border-slate-200 text-textdark`}>
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
                <div class="flex flex-col items-start gap-2">
                    <Badge color='indigo'>{formatTanggal(modeCuti.periode.start, "date", "app")}</Badge>
                    <Badge color='indigo'>{formatTanggal(modeCuti.periode.end, "date", "app")}</Badge>
                </div>
            </div>
            <MyButton className='' onclick={()=> getCutiUser()}>Refresh</MyButton>
        </div>

        <div class="flex flex-wrap w-full items-start gap-4">
            {#each $dataStore.dashboardIjinCuti as {title, value, icon: Icon}}
                <button class={`flex-1 flex flex-col min-w-[8rem] items-start border-[2px] border-slate-200 p-2 px-4 rounded-lg overflow-hidden overflow-ellipsis whitespace-nowrap cursor-pointer`}
                    onclick={() => {
                        if(parseInt(value) > 0 && !['Hak Cuti', 'Sisa Cuti'].includes(title) ) handleDetailHeader(title)}}>
                    <span class="text-[.9rem] font-semibold">{title}</span>
                    <div class="flex justify-between items-center gap-2">
                        <Icon size={16}/>
                        <span class='text-[1.1rem] font-bold'>{value}</span>
                    </div>
                </button>
            {/each}
        </div>
    </div>

    <Modal title={modalHeader.val} size={'sm'} bind:open={modalHeader.modal}>
        {#await getCutiCalendar(modalHeader.val)}
            <MyLoading message={`Loading ${modalHeader.val} data`}/>
        {:then val}
            {#if val.length > 0}
                <div class="ps-4">
                    <p class='-ms-3 mb-5'>Ada {val.length} hari '{modalHeader.val}'</p>
                    <Timeline order="vertical">
                        {#each val as {description, date}}
                            {#if differenceInDays(date, new Date()) > 0}
                                <Badge color='green' class='ms-2 mb-2'>Yang akan datang</Badge>
                            {:else if differenceInDays(date, new Date()) < 0}
                                <Badge color='red' class='ms-2 mb-2'>Sudah Lewat</Badge>
                            {:else if differenceInDays(date, new Date()) == 0}
                                <Badge class='ms-2 mb-2' color="green">Hari ini</Badge>
                            {/if}
                            <TimelineItem  title={`${namaHari[getDay(date)]}, ${formatTanggal(date, "date")}`} date={description}>
                                <svelte:fragment slot="icon">
                                    <span class="flex absolute -start-3 justify-center items-center w-6 h-6 bg-primary-200 rounded-full ring-8 ring-white dark:ring-gray-900 dark:bg-primary-900">
                                        <CalendarWeekSolid class="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                    </span>
                                </svelte:fragment>
                            </TimelineItem>
                        {/each}
                    </Timeline>
                </div>
            {:else}
                <span class='text-center'>Tidak ada data</span>
            {/if}
        {/await}
    </Modal>

    <Modal bind:open={formCuti.modalDelete} autoclose>
        <div class="flex flex-col gap-6">
            <h3>Hapus Cuti ?</h3>
        </div>
        <svelte:fragment slot="footer">
            <Button color='green' disabled={formCuti.loading} onclick={() => formCutiDelete(formCuti.answer.cuti_id)}>Ya, hapus cuti ini</Button>
            <Button color='red' onclick={() => formCuti.modalDelete = false}>No</Button>
        </svelte:fragment>
    </Modal>

    <Modal bind:open={modeCuti.modalAttachment} autoclose>
        <div class="flex flex-col gap-6 overflow-hidden max-h-[80vh]">
            <h3>Attachment</h3>
            <MyImage src={import.meta.env.VITE_VIEW_CUTI+modeCuti.attachment}/>
        </div>
        <svelte:fragment slot="footer">
            <Button color='red' onclick={() => modeCuti.modalAttachment = false}>Tutup</Button>
        </svelte:fragment>
    </Modal>
    
    <Tabs contentClass='bg-bgdark' tabStyle="underline">
        <TabItem open title="Cuti Saya" onclick={()=> modeCuti.tabNo = 1}>
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
                    <form method="POST" transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg' enctype="multipart/form-data">                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <input type='hidden' name="cuti_id" disabled={formCuti.edit} bind:value={formCuti.answer.cuti_id}/>

                            {#if formCuti.add}
                                {#await getUser(formCuti.dept)}
                                    <MyLoading message="Loading data"/>
                                {:then val}
                                    <div class="flex flex-col justify-start gap-2">
                                        <Label>Payroll</Label>
                                        <Svelecte class='border-none' disabled={user.level == 1} optionClass='p-2' name='payroll' required searchable selectOnTab multiple={false} bind:value={formCuti.answer.payroll} 
                                        options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " - " + v.name + (v.user_hrd ? " (HRD)":"")}))}
                                        onChange={(e) => fillCuti(e.value)}/>
                                    </div>
                                {/await}
                            {:else if formCuti.edit}
                                <MyInput type='text' title='Payroll' disabled value={formCuti.answer.payroll}/>
                            {/if}
                            
                            <MyInput type='text' title='Name' disabled value={formCuti.answer.name}/>
                            <MyInput type='text' title='Approval' disabled value={formCuti.answer.user_approval_name}/>
                            <MyInput type='text' title='Substitute' disabled value={formCuti.answer.user_delegate_name}/>
                            
                            <div class="flex flex-col gap-2">
                                <div class="flex flex-col gap-2">
                                    <Label>Type</Label>
                                    <Svelecte class='border-none' optionClass='p-2' name='payroll' required selectOnTab multiple={false} bind:value={formCuti.answer.type} 
                                        options={typeList.map((v) => ({value: v.value, text: v.value + " - " + v.hari + " days"}))}/>
                                </div>
                                {#if formCuti.answer.type}
                                    <div in:slide out:slide={{duration:1000}}>
                                        {#if formCuti.add}
                                            <div class="flex flex-col gap-2 flex-1">
                                                <Label>Date</Label>
                                                <MyDatePicker bind:value={formCuti.answer.date} mode={['Cuti Haid'].includes(formCuti.answer.type) ? "single" : "range"}
                                                disabled={['Cuti Haid'].includes(formCuti.answer.type)}/>
                                            </div>                     
                                        {:else if formCuti.edit}
                                            <div class="flex flex-col gap-2 flex-1">
                                                <Label>Date</Label>
                                                <MyDatePicker bind:value={formCuti.answer.date} disabled={formCuti.answer.type != "Cuti Tahunan"} />
                                            </div>                 
                                        {/if}
                                    </div>
                                {/if}
                                <div class="flex flex-col gap-2">
                                    <Label>Attachment</Label>
                                    <input class="border" type="file" accept=".jpg" onchange={e => formCuti.answer.attachment = e.target.files[0]}/>
                                </div>
                            </div>
                            <div class="flex flex-col self-start">
                                <MyInput type='textarea' title='Description' rows={4} name="description" bind:value={formCuti.answer.description}/>
                                <span class='text-[.9rem] italic'>Description min 5 character</span>
                            </div>
                        </div>
                        <div class="flex flex-col gap-1">
                            <span class='text-[.7rem] italic'>*Cuti dapat diajukan jika tidak ada pengajuan ditanggal yang sama dan statusnya bukan "Waiting" atau "Approved"</span>
                            <span class='text-[.7rem] italic'>*Jika pengajuan cuti ditolak, harap hitung sisa cuti anda karena cuti dengan status "Waiting" akan tetap dihitung sampai statusnya menjadi "Reject" atau "declined"</span>
                        </div>
                    </form>
                {/if}
                
                <div class="flex gap-2 items-start">
                    <select bind:value={tableCuti.rowsPerPage} onchange={() => tableCuti.setPage(1)}>
                        {#each [10, 20, 50, 100] as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                    <select bind:value={formCuti.year} onchange={()=> tableCuti.setPage(1)}>
                        {#each dataTahun as {title, value}}
                            <option value={value}>
                                {title} {value.toString() == format(modeCuti.periode.start, "yyyy") ? "(Select)" : null}
                            </option>
                        {/each}
                    </select>
                    <select bind:value={formCuti.month} onchange={()=> tableCuti.setPage(1)}>
                        {#each dataBulan as {title, value}}
                            <option value={value}>
                                {title} {value == Number(format(modeCuti.periode.end, "M")) - 1 ? "(Select)" : null}
                            </option>
                        {/each}
                    </select>
                    <div class="flex w-full flex-col">
                        <MyInput type='text' bind:value={tableCutiSearch.value} onkeydown={e => {
                            if(e.key.toLowerCase() === 'enter') tableCutiSearch.set()
                        }}/>
                        <span class="italic text-[.8rem]">Pencarian tanggal mengikuti format "2025-12-30"</span>
                    </div>
                    <MyButton onclick={()=>tableCutiSearch.set()}><Search size={16} /></MyButton>
                    <MyButton onclick={()=> {tableCuti.invalidate(); getCutiUser()}}><RefreshCw size={16}/></MyButton>
                </div>
                
                <Datatable table={tableCuti}>
                    <Table>
                        <TableHead>
                            <ThSort table={tableCuti} field="name">Nama</ThSort>
                            <ThSort table={tableCuti} field="date">Tanggal</ThSort>
                            <ThSort table={tableCuti} field="type">Tipe</ThSort>
                            <ThSort table={tableCuti} field="description">Alasan</ThSort>
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
                                            <TableBodyCell tdClass='break-all font-medium'>{capitalEachWord(row.name)}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{namaHari[Number(format(row.date, "c")) - 1] + ", " + formatTanggal(row.date, "date", "app") || ""}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{row.type ?? "-"}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{row.description ?? "-"}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>{row.status}</TableBodyCell>
                                            <TableBodyCell tdClass='break-all font-medium'>
                                                <div class="flex flex-col">
                                                    {#if row.is_delegate}
                                                        <Badge class='self-start' color='indigo'>Delegate to</Badge>
                                                    {/if}
                                                    {row.approval_name}
                                                </div>
                                            </TableBodyCell>
                                            <TableBodyCell>
                                                {#if !formCuti.edit}
                                                    {#if pecahArray(userProfile.access_cuti, "U") && row.status == "Waiting"}
                                                        <MyButton onclick={()=> formCutiEdit(row.cuti_id)}><Pencil size={12} /></MyButton>
                                                        <Tooltip type="auto">Edit</Tooltip>
                                                    {/if}
                                                    {#if pecahArray(userProfile.access_cuti, "D") && row.status == "Waiting"}
                                                        <MyButton onclick={()=> {
                                                            formCuti.modalDelete = true
                                                            formCuti.answer.cuti_id = row.cuti_id
                                                        }}><Trash size={12} /></MyButton>
                                                        <Tooltip type="auto">Hapus</Tooltip>
                                                    {/if}
                                                    {#if row.status == "Waiting" && !row.is_delegate}
                                                        <MyButton onclick={()=> handleDelegateCuti(row.cuti_id, row.approval)}><Highlighter size={12}/> </MyButton>
                                                        <Tooltip type="auto">Delegate</Tooltip>
                                                    {/if}
                                                {/if}
                                                {#if row.status}
                                                    <MyButton onclick={()=> handleCetakCuti(row.cuti_group_id)} color='dark' class='p-2' pill><Printer size={12} /></MyButton>
                                                    <Tooltip type="auto">Print</Tooltip>
                                                {/if}
                                                {#if row.attachment}
                                                    <MyButton onclick={()=> showCutiAttachment(row.attachment)} color='dark' class='p-2' pill><Paperclip size={12} /></MyButton>
                                                    <Tooltip type="auto">Attachment</Tooltip>
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
        {#if user.level > 1}
            <TabItem title="Approval Cuti" onclick={()=> modeCuti.tabNo = 2}>
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
                                                <TableBodyCell tdClass='break-all font-medium'>{capitalEachWord(row.name)}</TableBodyCell>
                                                <TableBodyCell tdClass='break-all font-medium'>{namaHari[Number(format(row.date, "c")) - 1] + ", " + formatTanggal(row.date, "date", "app") || ""}</TableBodyCell>
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
        {#if user.user_type == 'HR'}
            <TabItem title="Daftar Cuti" onclick={()=> modeCuti.tabNo = 3}>
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

                    <div class="flex gap-2 items-start">
                        <select bind:value={tableListCuti.rowsPerPage} onchange={() => tableListCuti.setPage(1)}>
                            {#each [10, 20, 50, 100] as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                        <select bind:value={formListCuti.year} onchange={()=> tableListCuti.setPage(1)}>
                            {#each dataTahun as {title, value}}
                                <option value={value}>
                                    {title} {value.toString() == format(modeCuti.periode.start, "yyyy") ? "(Select)" : null}
                                </option>
                            {/each}
                        </select>
                        <select bind:value={formListCuti.month} onchange={()=> tableListCuti.setPage(1)}>
                            {#each dataBulan as {title, value}}
                                <option value={value}>
                                    {title} {value == Number(format(modeCuti.periode.end, "M")) - 1? "(Select)" : null}
                                </option>
                            {/each}
                        </select>
                        <div class="flex w-full flex-col">
                            <MyInput type='text' bind:value={tableListCutiSearch.value} onkeydown={e => {
                                if(e.key.toLowerCase() === 'enter') tableListCutiSearch.set()
                            }}/>
                            <span class="italic text-[.8rem]">Pencarian tanggal mengikuti format "2025-12-30"</span>
                        </div>
                        <MyButton onclick={()=>tableListCutiSearch.set()}><Search size={16} /></MyButton>
                        <MyButton onclick={()=>tableListCuti.invalidate()}><RefreshCw size={16}/></MyButton>
                    </div>
                    
                    <Datatable table={tableListCuti}>
                        <Table>
                            <TableHead>
                                <ThSort table={tableListCuti} field="name">Payroll</ThSort>
                                <ThSort table={tableListCuti} field="name">Nama</ThSort>
                                <ThSort table={tableListCuti} field="date">Tanggal</ThSort>
                                <ThSort table={tableListCuti} field="type">Tipe</ThSort>
                                <ThSort table={tableListCuti} field="approval_name">Approval</ThSort>
                                <ThSort table={tableListCuti} field="description">Alasan</ThSort>
                                <ThSort table={tableListCuti} field="status">Status</ThSort>
                                <ThSort table={tableListCuti} field="">#</ThSort>
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
                                                <TableBodyCell>{row.payroll}</TableBodyCell>
                                                <TableBodyCell>{capitalEachWord(row.name)}</TableBodyCell>
                                                <TableBodyCell>{namaHari[Number(format(row.date, "c")) - 1] + ", " + formatTanggal(row.date, "date", "app") || ""}</TableBodyCell>
                                                <TableBodyCell>{row.type}</TableBodyCell>
                                                <TableBodyCell>{capitalEachWord(row.approval_name)}</TableBodyCell>
                                                <TableBodyCell>{row.description}</TableBodyCell>
                                                <TableBodyCell>{row.status}</TableBodyCell>
                                                <TableBodyCell>
                                                    {#if row.attachment}
                                                        <MyButton onclick={()=> showCutiAttachment(row.attachment)} color='dark' class='p-2' pill><Paperclip size={12} /></MyButton>
                                                        <Tooltip class='z-10'>View Attachment</Tooltip>
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
                        <MyPagination table={tableListCuti} />
                    </Datatable>
                </div>
            </TabItem>
        {/if}
    </Tabs>
</main>