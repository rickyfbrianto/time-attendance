<script>
    import { ShieldUser, Clock8, GalleryHorizontalEnd, TicketsPlane, Hourglass, Plane, LayoutDashboard} from 'lucide-svelte'
    import usercowo from '@lib/assets/user-man.svg'
    import usercewe from '@lib/assets/user-woman.svg'
    import {fly} from 'svelte/transition'
	import { quadIn, quintOut } from 'svelte/easing';
	import { Avatar, Modal, Tooltip } from 'flowbite-svelte';
	import MyButton from '@lib/components/MyButton.svelte'
    import {appstore, userStore} from '@lib/store/appstore'
    
    const linkSidebar = [
        {id:1, link:"/dashboard", title:"Dashboard", icon: LayoutDashboard},
        {id:2, link:"/absen", title:"Check In/Out", icon: Clock8},
        {id:3, link:"/attendance", title:"Attendance", icon: GalleryHorizontalEnd},
        {id:4, link:"/lembur", title:"Lembur", icon: Hourglass},
        {id:5, link:"/cuti", title:"Cuti", icon: TicketsPlane},
        {id:6, link:"/dinas", title:"Dinas", icon: Plane},
        {id:0, link:"/admin", title:"Admin", icon: ShieldUser},
    ]
    let defaultModal = $state(false)
</script>

{#if $appstore.showSidebar}
<div transition:fly={{x: "-200px", easing: quadIn}} class="flex flex-col bg-[var(--warna-base)] px-3 min-w-[16rem]">
    <a class="flex items-center justify-center gap-3 mt-[1rem]" href="/">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 37.9166C29.8951 37.9166 37.9166 29.8951 37.9166 20C37.9166 10.1049 29.8951 2.08331 20 2.08331C10.1049 2.08331 2.08331 10.1049 2.08331 20C2.08331 29.8951 10.1049 37.9166 20 37.9166Z" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20 17.9166V5.83331C23.4471 5.83324 26.776 7.09002 29.363 9.36821C31.95 11.6464 33.6176 14.7897 34.0533 18.2091M36.25 20H22.0833" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20 22.0834C21.1506 22.0834 22.0834 21.1506 22.0834 20C22.0834 18.8494 21.1506 17.9167 20 17.9167C18.8494 17.9167 17.9167 18.8494 17.9167 20C17.9167 21.1506 18.8494 22.0834 20 22.0834Z" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        
        <div class="flex flex-col">
            <span class="text-[1.4rem] text-[24px] font-[700]">Time</span>
            <span class="text-[1.4rem]">Attendance</span>
        </div>
    </a>

    <div class="flex flex-col flex-1 gap-y-2 mt-8">
        {#each linkSidebar as {link, title, icon}}
            <a href={link} class="flex items-center bg-white py-2 px-3 rounded-lg gap-2">
                <svelte:component this={icon} size=14 />
                <span class="text-[.9rem]">{title}</span>
            </a>
        {/each}
    </div>

    <div class="flex flex-col mb-10 px-4">
        <Avatar onclick={()=> defaultModal=true} src={usercowo} border class="ring-slate-600 w-[8rem] h-[8rem] self-center mb-4"/>
        <Tooltip>{$userStore?.name || ""}</Tooltip>
        <span class="text-[16px] text-[#112D4E] font-[900] ">{$userStore?.name || ""}</span>
        <span class="text-[12px] text-[#1D2D44] self-start">{$userStore?.payroll ||""}</span>
        <span class="text-[12px] text-[#1D2D44]">{$userStore?.jabatan ||""}</span>
        <span class="text-[12px] text-[#1D2D44]">{$userStore?.email ||""}</span>
    </div>

    <Modal title="My Account" bind:open={defaultModal} autoclose>
        <div class="relative flex flex-col gap-3 items-center">
            <MyButton className='absolute top-[.1rem] left-[.1rem]' onclick={()=>defaultModal = false}><a href='/account'>My Profile</a></MyButton>
            <Avatar src={usercowo} border class="ring-slate-600 w-[8rem] h-[8rem] self-center mb-4"/>

            <span class="text-[16px] text-[#112D4E] font-[900] ">{$userStore?.name || ""}</span>
            <span class="text-[12px] text-[#1D2D44]">{$userStore?.payroll ||""}</span>
            <span class="text-[12px] text-[#1D2D44]">{$userStore?.jabatan ||""}</span>
            <span class="text-[12px] text-[#1D2D44]">{$userStore?.email ||""}</span>
        </div>
    </Modal>
</div>
{/if}