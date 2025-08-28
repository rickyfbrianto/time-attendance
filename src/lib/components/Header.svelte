<script lang='ts'>
    import MyButton from '$/lib/components/MyButton.svelte'
    import {AlignJustify, Check, DoorOpen, Bell, Map, Clock, Sun, Moon, Database } from '@lucide/svelte'
	import { Alert, Modal, Breadcrumb, BreadcrumbItem, Dropdown, Badge, DropdownHeader } from 'flowbite-svelte';
    import { appstore } from "$/lib/store/appstore";
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';
	import { formatTanggalISO, formatWaktuHari, selisihWaktuHari, formatTanggal } from '@lib/utils';
	
    let { notif } = $props()

    const notifMax = 10
    const notifLength = notif.length
    const notifLengthMax = notifLength > notifMax ? notifMax : notifLength
    const notifLengthShow = notifLength > notifMax ? notifMax + "+" : notifLength
    
    let pathname:{url: string, title:string}[] = $derived.by(()=> {
        let urlTemp = page.url.pathname.split('/').filter(v => v && v != 'dashboard')
        let path = '';
        let result = []
        for (const part of urlTemp) {
            path = path ? `${path}/${part}` : part;
            result.push({url: path, title: part});
        }
        return  result
    })
    
    let logoutState = $state({
        message:"",
        modal:false,
        loading:false
    })

    const handleLogout = async () => {
        logoutState.loading = true
        const req = await fetch('/signout', {method:"POST"})
        const res = await req.json()
        logoutState.message = res.message
        setTimeout(()=> goto('/signin'), 1000)
    }

    const handleShowSidebar = () =>{
        const temp = JSON.parse(localStorage.getItem('appstore') || "")
        appstore.update(state => ({...temp, showSidebar: !state.showSidebar}))
        localStorage.setItem('appstore', JSON.stringify({...temp, showSidebar: !temp.showSidebar}))
    }

    const handleDarkMode = ()=>{
        const temp = JSON.parse(localStorage.getItem('appstore') || "")
        let newValue = temp.darkMode ? false : true

        localStorage.setItem('appstore', JSON.stringify({...temp, darkMode: newValue}))
        if(newValue)
            document.documentElement.classList.add('dark')
        else
            document.documentElement.classList.remove('dark');
        appstore.update(state => ({...state, darkMode: newValue}))
    }

    const icon = [
        {name:"dinas", value: 'dinas.png'},
        {name:"cuti", value: 'cuti.png'},
        {name:"ijin", value: 'ijin.png'},
        {name:"lembur", value: 'lembur.png'},
    ]
</script>

<div class="flex justify-between items-center min-h-[var(--ukuran6)] w-full border-b-[2px] border-b-bgside px-4 gap-4 bg-bgdark2 text-textdark">
    <div in:slide={{delay:500}} out:slide={{delay:500}} class="flex items-center gap-x-4">
        <Breadcrumb aria-label="Solid background breadcrumb example" solid class='text-textdark'>
            <button class='text-textdark' onclick={handleShowSidebar}>
                <AlignJustify class='cursor-pointer'/>
            </button>
            <BreadcrumbItem href="/dashboard" home homeClass='flex items-center text-textdark ms-2 '><span class="text-textdark text-sm">Dashboard</span></BreadcrumbItem>
            {#each pathname as {url, title}}
                <BreadcrumbItem class='capitalize' href={`/${url}`}><span class="text-textdark text-sm">{title}</span></BreadcrumbItem>
            {/each}
        </Breadcrumb>
    </div>
    
    <div class="flex gap-4 items-center">
        <Badge class='flex items-center gap-1'>
            <Database size={10} /> 
            <span class="font-quicksand text-[.65rem] font-bold">{import.meta.env.VITE_INFO_ENV}</span>
        </Badge>
        <div class="flex items-center rounded-lg">
            <div class="flex">
                <button class='relative bg-bgside rounded-l-lg text-textdark p-3 '>
                    <Bell size={14} />
                    {#if notifLength > 0}
                        <span class="flex items-center justify-center font-bold absolute top-[-.75rem] left-[-.75rem] bg-merah text-white min-w-[1.5rem] min-h-[1.5rem] text-[.67rem] rounded-full">{notifLengthShow}</span>
                    {/if}
                </button>
                <Dropdown class='w-[30rem] border-[1px] border-[var(--color-bgside)] rounded-lg'>
                    <div in:slide={{duration:250, delay:100}} out:slide={{duration:250, delay:100}} class="flex flex-col font-quicksand">
                        {#if notifLengthShow > 0}
                            <DropdownHeader>
                                <div class="flex items-center py-2 gap-2">
                                    <Bell size={16} />
                                    <span class="block text-bold text-[1rem] font-bold">Kamu mempunyai {notifLengthShow} pemberitahuan</span>
                                </div>
                            </DropdownHeader>
                            <div class="flex flex-col max-h-[25rem] overflow-auto border-y-[1px] border-slate-300">
                                {#each notif.slice(0, notifLengthMax) as {waktu, link, deskripsi}, i}
                                    <a href={`/${link}`} class="flex flex-col gap-1 p-4 bg-bgdark hover:bg-bgdark2 border-b border-slate-200">
                                        <div class="flex items-center gap-2">
                                            <img class='w-[1.35rem] h-[1.35rem]' src={icon.find(v => v.name == link)?.value} alt="">
                                            <span class="text-[.9rem] font-bold">{deskripsi}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <Clock size={14} class='w-[1.5rem]'/>
                                            <span aria-label={formatTanggal(waktu)} data-balloon-pos="up" class="text-[.7rem] italic">{formatWaktuHari(selisihWaktuHari(waktu, formatTanggalISO(new Date())))} yang lalu</span>
                                        </div>
                                    </a>
                                {/each}
                            </div>
                            {#if page.url.pathname != '/notifikasi'}
                                <a href="/notifikasi" class='p-3 w-full hover:bg-bgside'>Lihat lebih lanjut</a>
                            {:else}
                            <span class='p-3 w-full'>Anda berada di halaman notif</span>
                            {/if}
                        {:else}
                            <span class='text-center font-bold text-[1.4em] p-3 w-full'>Tidak ada pemberitahuan untuk saat ini</span>
                        {/if}
                    </div>
                </Dropdown>
            </div>
            <button class={`bg-bgside p-3 border-slate-400`} onclick={()=> handleDarkMode()}>
                {#if $appstore.darkMode}
                    <Sun size={14} />
                {:else}
                    <Moon size={14} />
                {/if}
            </button>
            <button class='bg-merah rounded-r-lg text-white p-3' onclick={()=> logoutState.modal = true}><DoorOpen size={14}/></button>
        </div>
    </div>

    <Modal class='bg-bgdark' title="Logout" bind:open={logoutState.modal}>
        <p class="text-base leading-relaxed">Apa anda ingin keluar?</p>
        {#if logoutState.message}
            <Alert color="green" class='flex items-center'>
                <Check />
                <span class="font-medium">{logoutState.message}</span>
            </Alert>
        {/if}
        <svelte:fragment slot="footer">
            <MyButton disabled={logoutState.loading} onclick={() => handleLogout()}>Ya</MyButton>
        </svelte:fragment>
    </Modal>
</div>
