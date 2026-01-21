<script lang='ts'>
    import { Table, TableBody, TableHeadCell, TableBodyCell, TableBodyRow, TableHead, Timeline, TimelineItem, Button, Modal, Checkbox } from 'flowbite-svelte';
	import { dataBulan, dataTahun, namaBulan } from '@lib/utils';
	import Svelecte from 'svelecte';
    import { fade, fly } from 'svelte/transition'
	import { endOfDay, endOfMonth, format, set, startOfDay, startOfMonth } from 'date-fns';
	import MyLoading from '@/MyLoading.svelte';
	import MyChart from '@/MyChart.svelte';
	import { Box, Boxes, CalendarClock, CalendarDays, CalendarRange, Sheet } from '@lucide/svelte';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import MyEmpty from '@/MyEmpty.svelte';
	import MyInput from '@/MyInput.svelte';
	import MyButton from '@/MyButton.svelte';
    import * as xlsx from 'xlsx'
	import { useDept } from '@lib/fetch.js';
	import { goto } from '$app/navigation';

    let { data } = $props()
    let user = $derived(data.user)
    let setting = $derived(data.periode)
    const queryClient = useQueryClient()
    
    let modeReport = $state({
        dept: (()=> user?.department)(),
        payroll: (()=> user?.payroll)(),
        type: "",
        start_date:"",
        end_date:"",
        typeChart: "pie",
    })

    let formAttendance = $state({
        dept: (()=> user?.department)(),
        payroll: (()=> user?.payroll)(),
        year: new Date().getFullYear(),
        month: new Date().getMonth(),
        tabNo: 1,
        summary: {
            input_absen_full: Array.from({length:12}, () => setting?.absensi_full),
            absen_full: Array.from({length:12}, () => setting?.absensi_full),
            allDept:{
                monthGroup: 3,
                month: new Date().getMonth(),
                shuffle: false
            },
            detailDept: {
                monthGroup: 3,
                month: new Date().getMonth(),
                shuffle: false
            }
        },
        detailSummary: {
            modal: false,
            year: new Date().getFullYear(),
            month: new Date().getMonth(),
            type: 0,
            dept_code: '',
            dept_name: ''
        }
    })

    const onClickReportDetailSummary = async (dept_code: string, dept_name: string, month: number, typeRep: number) =>{
        try {
            const year = formAttendance.year
            formAttendance.detailSummary = {
                modal: true,
                dept_name,
                dept_code,
                year,
                month,
                type: typeRep,
            }

            queryClient.invalidateQueries({queryKey: ['getReportDetailSummary', formAttendance.detailSummary.dept_code, formAttendance.detailSummary.year, formAttendance.detailSummary.month]})
        } catch (error) {
            return "gagal"
        }
    }

    const type = ['Absensi Ok','Tidak Pernah Absen','C/In & C/Out Tidak Continue','C/In Tidak Continue','C/In Tidak Pernah','C/Out Tidak Continue','C/Out Tidak Pernah','Total']

    const useReportAttendance = createQuery(()=> ({
        queryKey: ['getReportAttendance'],
        queryFn: async () => {
            return await fetch(`/api/data?type=get_report_attendance_dept&dept=${formAttendance.dept}&year=${formAttendance.year}&month=${formAttendance.month + 1}`)
            .then(r => r.json())
        },
    }))
    
    const useReportDisiplin = createQuery(()=> ({
        queryKey: ['getReportDisiplin'],
        queryFn: async () => {
            return await fetch(`/api/data?type=get_report_disiplin_dept&dept=${formAttendance.dept}&year=${formAttendance.year}&month=${formAttendance.month + 1}`)
            .then(r => r.json())
        },
    }))

    const useReportLembur = createQuery(()=> ({
        queryKey: ['getReportLembur'],
        queryFn: async () => {
            return await fetch(`/api/data?type=get_report_lembur_dept&dept=${formAttendance.dept}&year=${formAttendance.year}&month=${formAttendance.month + 1}`)
            .then(r => r.json())
        },
    }))
    
    const useReportSummary = createQuery(()=> ({
        queryKey: ['getReportSummary', formAttendance.year, formAttendance.summary.absen_full.join(',')],
        queryFn: async () => {
            const temp = await fetch(`/api/data?type=get_report_summary&year=${formAttendance.year}&val=${formAttendance.summary.absen_full.join(',')}`)
            .then(r => r.json())
            return temp
        },
    }))

    const useReportDetailSummary = createQuery(()=> ({
        queryKey: ['getReportDetailSummary', formAttendance.detailSummary.dept_code, formAttendance.detailSummary.year, formAttendance.detailSummary.month],
        queryFn: async() => {
            const req = await fetch(`/api/data?type=get_report_detail_summary&dept=${formAttendance.detailSummary.dept_code}&year=${formAttendance.detailSummary.year}&month=${formAttendance.detailSummary.month + 1}`)
            const res = await req.json()
            
            const temp = res.map(val => {
                const {cin_ada: cin, cout_ada: cout} = val
                return {
                    departemen: val.dept_name,
                    nama: val.employee_name,
                    [type[formAttendance.detailSummary.type]]: 
                        formAttendance.detailSummary.type == 0 && cin >= setting.absensi_full && cout >= setting.absensi_full ? 1 : 
                        formAttendance.detailSummary.type == 1 && cin == 0 && cout == 0 ? 1 :
                        formAttendance.detailSummary.type == 2 && (cin < setting.absensi_full && cout < setting.absensi_full) && (cin > 0 && cout > 0) && cin == cout ? 1 : 
                        formAttendance.detailSummary.type == 3 && cin < cout ? 1 : 
                        formAttendance.detailSummary.type == 4 && cin == 0 && cout > 0 ? 1 : 
                        formAttendance.detailSummary.type == 5 && cin > cout ? 1 : 
                        formAttendance.detailSummary.type == 6 && cin > 0 && cout == 0 ? 1 : 0
                    ,
                }
            })            
            return {
                data: temp,
                total: temp.reduce((acc, cur) => acc + cur[type[formAttendance.detailSummary.type]], 0)
            }
        },
        enabled: !!formAttendance.detailSummary.dept_code && !!formAttendance.detailSummary.year && !!formAttendance.detailSummary.month
    }))

    const handleFilterChart = (val: any[], type: string, title: string = "") => {
        try {
            if(!type) throw new Error ("Type wajib diisi")
            const warnaList = ["#1E352F", "#CBDFBD","#7EBDC2","#FFADC6","#F4D35E", 
            "#FF7F11","#AF3B6E", "#CE4760" , "#4ECDC4", "#1C5D99"]
            let temp = Object.entries(val).map(([key, data]) => {
                return {data: data[type], colors: warnaList[Math.floor(Math.random() * warnaList.length)], label: data.name}
            })

            const chartData = {
                labels: temp.map(item => item.label),
                datasets: [{
                    data: temp.map(item => item.data),
                    backgroundColor: temp.map(item => item.colors),
                    label: title
                }]
            };

            let chartOptions =  {
                responsive: true,
                plugins: {
                    legend: {
                        display: false,
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'start',
                        color: '#FFF',
                        formatter: (value: number | string) => (value > 0) ? value : null
                    },
                    title: {
                        display: true,
                        text: title ? title : `Chart ${formAttendance.dept}`
                    }
                },
                animations: {
                    x: {
                        easing: 'easeInOutElastic',
                        from: (ctx) => {
                            if (ctx.type === 'data') {
                                if (ctx.mode === 'default' && !ctx.dropped) {
                                ctx.dropped = true;
                                return 0;
                                }
                            }
                        }
                    },
                    radius: {
                        duration: 5000,
                        easing: 'linear',
                        loop: (context) => context.active
                    }
                }
            }
            return {data: chartData, option: chartOptions }
        } catch (error) {
            console.error(error.message)
        }
    }

    const onCloseDetailSummary = () => {
        formAttendance.detailSummary.modal = false
    }

    const onChangeYear = async () => {
        if ([1,2,3, 4].includes(formAttendance.tabNo)) {
            if (formAttendance.tabNo == 1) useReportAttendance.refetch()
            if (formAttendance.tabNo == 2) useReportDisiplin.refetch()
            if (formAttendance.tabNo == 3) useReportLembur.refetch()
            if (formAttendance.tabNo == 4) useReportSummary.refetch()
        }
    }

    const onChangeMonth = async () => {
        if ([1,2,3,4].includes(formAttendance.tabNo)) {
            if (formAttendance.tabNo == 1) useReportAttendance.refetch()
            if (formAttendance.tabNo == 2) useReportDisiplin.refetch()
            if (formAttendance.tabNo == 3) useReportLembur.refetch()
        }
    }

    const onClickBack = () => goto('/attendance')

    let dataSummary = $derived.by(() => {
        if(useReportSummary?.data){
            const result = useReportSummary.data?.map(row => {
                return {
                    [row.dept_name]: Object.entries(row).filter(([key]) => !['dept_name','dept_code'].includes(key)).map(([, value]) => value.split(',').map(Number)),
                    dept_code: row.dept_code
                }
            })
            
            if(result.length == 0){
                return {
                    detailDept: null,
                    chartDetailDept: null,
                    allDept: null,
                    chartAllDept: null
                }
            }

            const detailDept =  Array.from({length: 7}, (_,i)=> i).map((_, i) => 
                result.map(obj => {
                    const key = Object.keys(obj)[0]
                    const arr = obj[key].map(inner => inner[i])
                    return { dept_name: key, dept_code: obj.dept_code, value: arr };
                })
            )

            const chartDetailDept = detailDept.map((item, iItem) => {
                const temp = {
                    labels: Object.values(item).map(v => v.dept_name),
                    datasets: Array.from({length: 12}, (_, i) => i).slice(formAttendance.summary.detailDept.month, formAttendance.summary.detailDept.monthGroup + formAttendance.summary.detailDept.month).map((sub, iSub) => {
                        return {
                            label: namaBulan[iSub + formAttendance.summary.detailDept.month],
                            data: detailDept[iItem].map(v => v.value[iSub + formAttendance.summary.detailDept.month])
                        }
                    })
                }
                return temp
            })

            const allDept = detailDept.map(group => 
                group.reduce((acc, obj) => 
                    acc.map((val, i) => val + obj.value[i]),
                    Array(group[0].value.length).fill(0)
                )
            )
            const sumArray = Array.from({length: 12}, (_,i)=> i).map((_, i) => allDept.reduce((acc, row) => acc + row[i], 0));
            allDept.push(sumArray)
            
            const chartAllDept = {
                labels: [...type].filter((_, i) => i < 7),
                datasets: Array.from({length: 12}, (_, i) => i).slice(formAttendance.summary.allDept.month, formAttendance.summary.allDept.monthGroup + formAttendance.summary.allDept.month).map((_, i) => {
                    return {
                        label: namaBulan[i + formAttendance.summary.allDept.month],
                        data: allDept.map(sub => sub[i + formAttendance.summary.allDept.month]),
                    }
                })
            };
            
            const configChart = (text: string = "Grafik Absensi Karyawan") => ({
                responsive: true,
                plugins: {
                    title: { display: true, text }
                },
            })

            return {
                detailDept,
                configChart,
                chartAllDept,
                allDept,
                chartDetailDept
            }
        }
    })

    const onFilterSummary = () => {
        formAttendance.summary.absen_full = [...formAttendance.summary.input_absen_full]
        queryClient.invalidateQueries({queryKey: ['getReportSummary', formAttendance.year, formAttendance.summary.absen_full.join(',')],})
    }

    const onExportExcel = () => {
        const workbook = xlsx.utils.book_new()

        const dataAllDept = dataSummary?.allDept.map((item, iItem) => {
            return {
                no: iItem + 1, 
                keterangan: type[iItem], 
                [namaBulan[0]]: item[0],
                [namaBulan[1]]: item[1],
                [namaBulan[2]]: item[2],
                [namaBulan[3]]: item[3],
                [namaBulan[4]]: item[4],
                [namaBulan[5]]: item[5],
                [namaBulan[6]]: item[6],
                [namaBulan[7]]: item[7],
                [namaBulan[8]]: item[8],
                [namaBulan[9]]: item[9],
                [namaBulan[10]]: item[10],
                [namaBulan[11]]: item[11],
            }
        })
        
        const dataDetailDept = dataSummary?.detailDept.map((sub, iSub) => {
            return dataSummary?.detailDept[iSub].map((item, iItem) => {
                return {
                    no: iItem + 1, 
                    departemen: item.dept_name, 
                    [namaBulan[0]]: item.value[0],
                    [namaBulan[1]]: item.value[1],
                    [namaBulan[2]]: item.value[2],
                    [namaBulan[3]]: item.value[3],
                    [namaBulan[4]]: item.value[4],
                    [namaBulan[5]]: item.value[5],
                    [namaBulan[6]]: item.value[6],
                    [namaBulan[7]]: item.value[7],
                    [namaBulan[8]]: item.value[8],
                    [namaBulan[9]]: item.value[9],
                    [namaBulan[10]]: item.value[10],
                    [namaBulan[11]]: item.value[11],
                }
            })
        })
        
        xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(dataAllDept), "Summary Karyawan")

        dataDetailDept?.map((val, iVal) => { 
            xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(val), type[iVal].replace(/\//g, '_'))
        }) 
        xlsx.writeFile(workbook, `Summary Report ${formAttendance.year}.xlsx`)
    }

    const getDept = useDept()
</script>

<svelte:head>
    <title>Report</title>
</svelte:head>

<main in:fade={{delay:500 }} out:fade class="flex flex-col p-4 gap-4 h-full w-full">
    <div class="relative flex flex-1 flex-col border-[var(--color-bgside)] border-[2px] rounded-lg p-3 gap-3">        
        <Button class='self-start' onclick={onClickBack}>Back to attendance</Button>
        
        <div class={`${[1,2,3].includes(formAttendance.tabNo) ? "h-[8rem]":"h-[5rem]"} sticky top-[0] bg-bgdark flex items-center gap-2 border-[var(--color-bgside)] border rounded-lg px-4 z-10 shadow-lg`}>
            {#if getDept.isPending || getDept.isFetching}
                <MyLoading message="Loading data"/>
            {/if}
            {#if getDept.data}
                <div class="flex items-center gap-2">
                    <CalendarRange class='self-center' size={16} />
                    <div class="flex flex-col gap-2">
                        <select bind:value={formAttendance.year} onchange={onChangeYear}>
                            {#each dataTahun as {title, value}}
                                <option value={value}>
                                    {title}
                                </option>
                            {/each}
                        </select>
                        {#if [1,2,3].includes(formAttendance.tabNo)}
                            <select transition:fade bind:value={formAttendance.month} onchange={onChangeMonth}>
                                {#each dataBulan as {title, value}}
                                    <option value={value}>
                                        {title}
                                    </option>
                                {/each}
                            </select> 
                        {/if}
                    </div>
                </div>

                <div class="flex flex-col gap-2 w-full justify-center">
                    {#if [1,2,3].includes(formAttendance.tabNo)}
                        <div transition:fade class="flex flex-1">
                            <div class="flex flex-1 items-center gap-2 p-2 ">
                                <Box size={16} />
                                <Svelecte clearable searchable selectOnTab multiple={false} bind:value={formAttendance.dept} onChange={onChangeMonth}
                                options={getDept.data.map((v:any) => ({value: v.dept_code, text:v.dept_code + " - " + v.name}))}
                                />
                            </div>
                        </div>
                    {/if}
                    <div class="flex gap-1">
                        {#each ["Attendance","Kedisiplinan Department","Lembur Department", "Summary"] as item, i}
                            <button class={`p-2 px-4 rounded-t-[12px] text-black ${(formAttendance.tabNo == (i + 1)) ? "bg-bgside/[.75] shadow-xl border-b-[4px]":"bg-bgside"}`} onclick={()=> formAttendance.tabNo = i + 1}>{item}</button>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
        
        {#if formAttendance.tabNo == 1}
            {#if useReportAttendance.isFetching}
                <MyLoading message={"Mengambil data..."}/>
            {:else}
                <div in:fly={{delay:600, x: -500}} out:fly={{x:500, duration: 500}}>
                    {#if useReportAttendance.data?.length > 0}
                        <div class="flex flex-col gap-4 mt-2">
                            <Table class='border border-bgside'>
                                <TableHead>
                                    {#each Object.entries(useReportAttendance.data[0]) as value, i}
                                        <TableHeadCell class='py-2'>{value[0]}</TableHeadCell>
                                    {/each}
                                </TableHead>
                                <TableBody>
                                    {#each useReportAttendance.data, i}
                                        <TableBodyRow>
                                            {#each Object.entries(useReportAttendance.data[i]) as value, i (value[0])}
                                                <TableBodyCell class={`py-2 ${i == 0 ? "":"text-center"}`}>{value[1]}</TableBodyCell>
                                            {/each}
                                        </TableBodyRow>
                                    {/each}
                                </TableBody>
                            </Table>
                            <div class="flex flex-col gap-4">
                                <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                                    <MyChart chartData={handleFilterChart(useReportAttendance.data, "Attendance")?.data} chartOptions={handleFilterChart(useReportAttendance.data, "Attendance", "Attendance (Days)")?.option} type={"bar"} chartClass='max-h-[25rem]' />
                                </div>
                                <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                                    <MyChart chartData={handleFilterChart(useReportAttendance.data, "Mangkir")?.data} chartOptions={handleFilterChart(useReportAttendance.data, "Mangkir", "Tidak Masuk Kantor (Days)")?.option} type={"bar"} chartClass='max-h-[25rem]' />
                                </div>  
                            </div>
                        </div>
                    {:else}
                        <MyEmpty/>
                    {/if}
                </div>
            {/if}
        {/if}

        {#if formAttendance.tabNo == 2}
            {#if useReportDisiplin.isFetching}
                <MyLoading message={"Mengambil data..."}/>
            {:else}
                <div in:fly={{delay:600, x: -500}} out:fly={{x:500, duration: 500}}>
                    {#if useReportDisiplin.data?.length > 0}
                        <div class="flex flex-col gap-4 mt-2">
                            <Table class='border border-bgside'>
                                <TableHead>
                                    {#each Object.entries(useReportDisiplin.data[0]) as value, i}
                                        <TableHeadCell class='py-2'>{value[0]}</TableHeadCell>
                                    {/each}
                                </TableHead>
                                <TableBody>
                                    {#each useReportDisiplin.data, i}
                                        <TableBodyRow>
                                            {#each Object.entries(useReportDisiplin.data[i]) as value, i (value[0])}
                                                <TableBodyCell class={`py-2 ${i == 0 ? "":"text-center"}`}>{value[1]}</TableBodyCell>
                                            {/each}
                                        </TableBodyRow>
                                    {/each}
                                </TableBody>
                            </Table>
                            <div class="flex flex-col gap-4">
                                <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                                    <MyChart chartData={handleFilterChart(useReportDisiplin.data, "Late", "Late")?.data} chartOptions={handleFilterChart(useReportDisiplin.data, "Late", "Late (Days)")?.option} type={"bar"} chartClass='max-h-[25rem]' />
                                </div>
                                <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                                    <MyChart chartData={handleFilterChart(useReportDisiplin.data, "Avg Telat (Menit)", "Avg Minutes Telat")?.data} chartOptions={handleFilterChart(useReportDisiplin.data, "Avg Telat", "Avg Minutes Telat (Minutes)")?.option} type={"bar"} chartClass='max-h-[25rem]' />
                                </div>  
                            </div>
                        </div>
                    {:else}
                        <MyEmpty/>
                    {/if}
                </div>
            {/if}
        {/if}
        
        {#if formAttendance.tabNo == 3}
            {#if useReportLembur.isFetching}
                <MyLoading message={"Mengambil data..."}/>
            {:else}
                <div in:fly={{delay:600, x: -500}} out:fly={{x:500, duration: 500}}>
                    {#if useReportLembur.data?.length > 0}
                        <div class="flex flex-col gap-4">
                            <Table class='border border-bgside'>
                                <TableHead>
                                    {#each Object.entries(useReportLembur.data[0]) as value, i}
                                        <TableHeadCell class='py-2'>{value[0]}</TableHeadCell>
                                    {/each}
                                </TableHead>
                                <TableBody>
                                    {#each useReportLembur.data, i}
                                        <TableBodyRow>
                                            {#each Object.entries(useReportLembur.data[i]) as value, i (value[0])}
                                                <TableBodyCell class={`py-2 ${i == 0 ? "":"text-center"}`}>{value[1]}</TableBodyCell>
                                            {/each}
                                        </TableBodyRow>
                                    {/each}
                                </TableBody>
                            </Table>
                            <div class="flex flex-col gap-4">
                                <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                                    <MyChart chartData={handleFilterChart(useReportLembur.data, "Lembur", "Lembur")?.data} chartOptions={handleFilterChart(useReportLembur.data, "Lembur", "Lembur (Days)")?.option} type={"bar"} chartClass='max-h-[25rem]' />
                                </div>
                                <div class="flex flex-1 border-[var(--color-bgside)] border rounded-lg p-4">
                                    <MyChart chartData={handleFilterChart(useReportLembur.data, "Jam Lembur", "Total Lembur")?.data} chartOptions={handleFilterChart(useReportLembur.data, "Jam Lembur", "Total Lembur (Hour)")?.option} type={"bar"} chartClass='max-h-[25rem]' />
                                </div>  
                            </div>
                        </div>
                    {:else}
                        <MyEmpty/>
                    {/if}
                </div>
            {/if}
        {/if}
        
        {#if formAttendance.tabNo == 4}
            <div class="flex flex-col gap-4">
                {#if useReportSummary.isFetching}
                    <MyLoading message={"Mengambil data summary"}/>
                {:else}
                    {#if dataSummary?.allDept && dataSummary?.detailDept}
                        <div class="flex flex-col bg-white border-[2px] border-bgside rounded-lg p-4 gap-2">
                            <span class="font-bold text-[1.6rem] italic">Filter absen full/bulan</span>
                            <div class="grid xl:grid-cols-6 lg:grid-cols-4 md:grid-cols-3 items-center gap-x-4 gap-y-2">
                                {#each formAttendance.summary.input_absen_full as _, i}
                                    <div class="flex flex-col">
                                        <span>{namaBulan[i]}</span>
                                        <MyInput type='number' bind:value={formAttendance.summary.input_absen_full[i]} />
                                    </div>
                                {/each}    
                            </div>
                            <div class="flex items-center justify-between gap-4 border border-bgside rounded-lg p-2">
                                <MyButton onclick={onFilterSummary}>
                                    Filter
                                </MyButton>
                                <div class="flex items-center gap-2">
                                    <span class='font-bold italic'>Export</span>
                                    <button onclick={onExportExcel} class='flex items-center justify-center border-slate-200 border rounded-lg w-[2rem] h-[2rem]'>
                                        <Sheet size={14} color='green'/>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="flex py-6 px-10 rounded-lg bg-bgside">
                            <span class="font-bold text-[1.6rem] italic">Summary semua departemen</span>
                        </div>
                        <div class="sticky top-[5rem] px-4 h-[4rem] flex items-center gap-4 bg-white z-10 border-[2px] border-bgside rounded-lg">
                            <div class="flex items-center gap-2">
                                <CalendarDays />
                                <select bind:value={formAttendance.summary.allDept.month}>
                                    {#each Array.from({length: 12}, (_, i) => i) as i}
                                    <option value={i}>{namaBulan[i]}</option>
                                    {/each}
                                </select>
                            </div>
                            <div class="flex items-center gap-2">
                                <Boxes />
                                <select bind:value={formAttendance.summary.allDept.monthGroup}>
                                    {#each [1,3,6,12] as i}
                                    <option value={i}>{i}</option>
                                    {/each}
                                </select>
                            </div>
                            <Checkbox bind:checked={formAttendance.summary.allDept.shuffle}>Shuffle</Checkbox>
                        </div>
                        <div class={`flex gap-4 ${formAttendance.summary.allDept.shuffle ? "flex-col":"flex-col-reverse"}`}>
                            <Table>
                                <TableHead theadClass='!bg-bgside'>
                                    <TableHeadCell>#</TableHeadCell>
                                    <TableHeadCell>Keterangan</TableHeadCell>
                                    {#each Array.from({length: 12}, (_,i) => i) as _,i }
                                        <TableHeadCell>{namaBulan[i]}</TableHeadCell>
                                    {/each}
                                </TableHead>
                                <TableBody>
                                    {#each dataSummary?.allDept as dataSub, idxDataSub}
                                        <TableBodyRow class={`${dataSummary?.allDept.length - 1 == idxDataSub ? "!bg-bgside":""}`}>
                                            {#if dataSummary?.allDept.length - 1 == idxDataSub}
                                                <TableBodyCell colspan={2} class='text-center font-bold'>Total</TableBodyCell>
                                            {:else}
                                                <TableBodyCell>{idxDataSub + 1}</TableBodyCell>
                                                <TableBodyCell>{type[idxDataSub]}</TableBodyCell>
                                            {/if}
                                            {#each dataSub as item}
                                                <TableBodyCell tdClass={`text-center ${item > 0 ? "font-bold":""}`}>
                                                    <span>{item}</span>
                                                </TableBodyCell>
                                            {/each}
                                        </TableBodyRow>
                                    {/each}
                                </TableBody>
                            </Table>
                            {#if dataSummary?.chartAllDept}
                                <MyChart chartOptions={dataSummary.configChart()} chartData={dataSummary.chartAllDept} chartClass='max-h-[24rem]'/>
                            {/if}
                        </div>

                        <div class="flex py-6 px-10 rounded-lg bg-bgside">
                            <span class="font-bold text-[1.6rem] italic">Summary setiap departemen</span>
                        </div>
                        <div class="sticky top-[5rem] px-4 h-[4rem] flex items-center gap-4 bg-white z-10 border-[2px] border-bgside rounded-lg">
                            <div class="flex items-center gap-2">
                                <CalendarDays />
                                <select bind:value={formAttendance.summary.detailDept.month}>
                                    {#each Array.from({length: 12}, (_, i) => i) as i}
                                    <option value={i}>{namaBulan[i]}</option>
                                    {/each}
                                </select>
                            </div>
                            <div class="flex items-center gap-2">
                                <Boxes />
                                <select bind:value={formAttendance.summary.detailDept.monthGroup}>
                                    {#each [1,3,6,12] as i}
                                    <option value={i}>{i}</option>
                                    {/each}
                                </select>
                            </div>
                            <Checkbox bind:checked={formAttendance.summary.detailDept.shuffle}>Shuffle</Checkbox>
                        </div>
                        
                        <Timeline>
                            {#each dataSummary.detailDept as dataSub, iSub}
                                <TimelineItem title={type[iSub]} class='sticky top-[9rem]' classH3='sticky top-[9rem] bg-white'> 
                                    <div class={`flex gap-4 ${formAttendance.summary.detailDept.shuffle ? "flex-col":"flex-col-reverse"}`}>
                                        <Table divClass='mt-[1rem] rounded-lg border-[2px] border-slate-100' id={type[iSub]}>
                                            <TableHead theadClass='!bg-bgside'>
                                                <TableHeadCell>#</TableHeadCell>
                                                <TableHeadCell>Keterangan</TableHeadCell>
                                                {#each Array.from({length: 12}) as _ , i}
                                                    <TableHeadCell>{namaBulan[i]}</TableHeadCell>
                                                {/each}
                                            </TableHead>
                                            <TableBody>
                                                {#each dataSub as {dept_name, dept_code, value}, i}
                                                    <TableBodyRow>
                                                        <TableBodyCell>{i + 1}</TableBodyCell>
                                                        <TableBodyCell>{dept_name}</TableBodyCell>
                                                        {#each value as item, iItem}
                                                            <TableBodyCell aria-label={item > 0 ? `Klik ${item} untuk lihat detail`: undefined} data-balloon-pos="up" tdClass={`text-center ${item > 0 ? "font-bold":""}`} onclick={()=>{
                                                                if(item > 0) onClickReportDetailSummary(dept_code, dept_name, iItem, iSub)
                                                            }}>{item}</TableBodyCell>
                                                        {/each}
                                                    </TableBodyRow>
                                                {/each}
                                            </TableBody>
                                        </Table>
                                        <MyChart chartOptions={dataSummary.configChart(`Grafik ${type[iSub]}`)} chartData={dataSummary.chartDetailDept[iSub]} chartClass='max-h-[24rem]'/>
                                    </div>
                                </TimelineItem>
                            {/each}
                        </Timeline>
                        
                        <Modal title={`Detail ${type[formAttendance.detailSummary.type]} ${formAttendance.detailSummary.dept_name} ${namaBulan[formAttendance.detailSummary.month]} ${formAttendance.detailSummary.year}`} 
                            size={'xl'} bind:open={formAttendance.detailSummary.modal} on:close={onCloseDetailSummary} class='pb-4'>
                            {#if useReportDetailSummary.data?.total > 0}
                                <Table divClass='relative max-h-[75vh] overflow-auto'>
                                    <TableHead theadClass='sticky top-0 !bg-bgside'>
                                        <TableHeadCell>#</TableHeadCell>
                                        {#each Object.entries(useReportDetailSummary.data?.data[0]) as [key] }
                                            <TableHeadCell class='capitalize'>{key}</TableHeadCell>
                                        {/each}
                                    </TableHead>
                                    <TableBody class='relative'>
                                        {#each useReportDetailSummary.data?.data as data, idxData}
                                            <TableBodyRow class={`${Object.values(data)[2] as number > 0 ? "!bg-zinc-100":""}`}>
                                                <TableBodyCell>{idxData + 1}</TableBodyCell>
                                                {#each Object.values(data) as value}
                                                    <TableBodyCell>{value}</TableBodyCell>
                                                {/each}
                                            </TableBodyRow>
                                        {/each}
                                        <TableBodyRow class='sticky bottom-0 z-10 !bg-bgside'>
                                            <TableBodyCell colspan={3} tdClass='text-center'>Total</TableBodyCell>
                                            <TableBodyCell>{useReportDetailSummary.data?.total}</TableBodyCell>
                                        </TableBodyRow>
                                    </TableBody>
                                </Table>
                            {:else}
                                <MyLoading message={`Mengambil data ${type[formAttendance.detailSummary.type]} ${formAttendance.detailSummary.dept_name} ${namaBulan[formAttendance.detailSummary.month]} ${formAttendance.detailSummary.year}`}/>
                            {/if}
                        </Modal>
                    {:else}
                        <MyEmpty/>
                    {/if}
                {/if}
            </div>
        {/if}
    </div>
</main>