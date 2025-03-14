<script lang="ts">
    import { ShieldUser, Clock8, GalleryHorizontalEnd, TicketsPlane, Hourglass, Plane, LayoutDashboard} from '@lucide/svelte'
    import usercowo from '@lib/assets/user-man.svg'
    import usercewe from '@lib/assets/user-woman.svg'
    import { fly } from 'svelte/transition'
	import { quadIn } from 'svelte/easing';
	import { Avatar, Modal, Timeline, TimelineItem, Tooltip } from 'flowbite-svelte';
    import {appstore } from '@lib/store/appstore'
    import { page } from '$app/state';
	
    let {data} = $props()
    let pathname:string[] = $state([])

    $effect(()=>{
        pathname = page.url.pathname.split('/').filter(v => v)
    })
        
    const linkSidebar = [
        {type:"separator", title:"Core"},
        {link:"/dashboard", title:"Dashboard", icon: LayoutDashboard},
        {link:"/attendance", title:"Attendance", icon: GalleryHorizontalEnd},
        {type:"separator", title:"Main"},
        {link:"/absen", title:"Check In/Out", icon: Clock8},
        {link:"/lembur", title:"Lembur", icon: Hourglass},
        {link:"/cuti", title:"Cuti", icon: TicketsPlane},
        {link:"/dinas", title:"Dinas", icon: Plane},
        {type:"separator", title:"Admin"},
        {link:"/admin", title:"Admin", icon: ShieldUser},
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
            <span class="text-[1.4rem] font-[700]">Time</span>
            <span class="text-[1.4rem]">Attendance</span>
        </div>
    </a>

    <div class="flex flex-col flex-1 gap-y-2">
        {#each linkSidebar as {link, title, icon: Icon, type}}
            {#if type == "separator"}
                <div class="flex bg-slate-800 text-white px-3 py-1 rounded-lg mt-4 shadow-lg">
                    <span class='text-muted font-bold text-[.7rem]'>{title}</span>
                </div>
            {:else}
                <a href={link} class={`flex items-center ${link == "/"+pathname[0] ? "bg-slate-800 text-white":"bg-white"} py-2 px-3 rounded-lg gap-2`}>
                    <Icon size=14/>
                    <span class="text-[.9rem]">{title}</span>
                </a>
            {/if}
        {/each}
    </div>

    <div class="flex flex-col mb-10 px-4">
        <Avatar onclick={()=> defaultModal=true} src={usercowo} border class="ring-slate-600 w-[8rem] h-[8rem] self-center mb-4"/>
        <Tooltip>{data.user.name}</Tooltip>
        <span class="text-[16px] text-[#112D4E] font-[900] ">{data.user.name}</span>
        <span class="text-[12px] text-[#1D2D44] self-start">{data.user.payroll}</span>
        <span class="text-[12px] text-[#1D2D44]">{data.user.position}</span>
        <span class="text-[12px] text-[#1D2D44]">{data.user.email}</span>
    </div>

    <Modal title="My Account" bind:open={defaultModal} autoclose>
        <div class="relative grid grid-cols-2 gap-3 items-center justify-center">
            <!-- <MyButton className='absolute top-[.1rem] left-[.1rem]' onclick={()=>defaultModal = false}><a href='/account'>My Profile</a></MyButton> -->
             <div class="flex flex-col items-center justify-center">
                <Avatar src={usercowo} border class="self-center ring-slate-600 w-[8rem] h-[8rem] self-center mb-4"/>
                <span>{data.user.name}</span>
            </div>
            <div class="flex flex-col">
                <Timeline>
                    <TimelineItem title={data.user.payroll} date="Payroll"/>
                    <TimelineItem title={data.user.position} date="Position"/>
                    <TimelineItem title={data.user.email} date="Email"/>
                </Timeline>
            </div>
        </div>
    </Modal>
</div>
{/if}