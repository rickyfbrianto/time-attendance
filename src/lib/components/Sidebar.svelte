<script lang="ts">
    import { ShieldUser, Clock8, GalleryHorizontalEnd, TicketsPlane, Hourglass, Plane, LayoutDashboard } from '@lucide/svelte'
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
        {link:"/ijin", title:"Ijin", icon: TicketsPlane},
        {link:"/dinas", title:"Dinas", icon: Plane},
        {type:"separator", title:"Admin"},
        {link:"/admin", title:"Admin", icon: ShieldUser},
    ]
    let defaultModal = $state(false)
</script>

{#if $appstore.showSidebar}
<div transition:fly={{x: "-200px", easing: quadIn}} class="flex flex-col bg-bgside px-3 min-w-[16rem] text-textside">
    <a class="flex items-center justify-center gap-3 mt-[1rem] text-textdark" href="/">
        <Clock8 size={46}/>
        
        <div class="flex flex-col">
            <span class="text-[1.4rem] font-[700]">Time</span>
            <span class="text-[1.4rem]">Attendance</span>
        </div>
    </a>

    <div class="flex flex-col flex-1 gap-y-1">
        {#each linkSidebar as {link, title, icon: Icon, type}}
            {#if type == "separator"}
                <div class="flex bg-bgside2 text-textside px-3 py-2 rounded-lg mb-1 mt-2 shadow-lg">
                    <span class='text-muted font-bold text-[.7rem]'>{title}</span>
                </div>
            {:else}
                <a href={link} class={`relative flex items-center ${link == "/"+pathname[0] ? "bg-gradient-to-r from-slate-800 to-gray-200 text-white":"bg-bgside2 text-textside"} hover:bg-slate-200 dark:hover:bg-slate-800 px-3 py-2 rounded-lg gap-2`}>
                    <Icon size=14/>
                    <span class={`text-[.9rem] text-white"}`}>{title}</span>
                    <!-- {#if link == "/"+pathname[0]}
                        <Locate size={16} class='absolute right-[1em] top-[50%] translate-y-[-50%]'/>
                    {/if} -->
                </a>
            {/if}
        {/each}
    </div>

    <div class="flex flex-col mb-10 px-4">
        <Avatar onclick={()=> defaultModal=true} src={usercowo} border class="ring-slate-600 w-[8rem] h-[8rem] self-center mb-4"/>
        <Tooltip>{data.user.name}</Tooltip>
        <span class="text-[16px] text-textdark font-[900] ">{data.user.name}</span>
        <span class="text-[12px] text-textdark self-start">{data.user.payroll}</span>
        <span class="text-[12px] text-textdark">{data.user.position}</span>
        <span class="text-[12px] text-textdark">{data.user.email}</span>
    </div>

    <Modal title="My Account" bind:open={defaultModal} autoclose>
        <div class="relative grid grid-cols-2 gap-3 items-center justify-center">
            <!-- <MyButton className='absolute top-[.1rem] left-[.1rem]' onclick={()=>defaultModal = false}><a href='/account'>My Profile</a></MyButton> -->
            <div class="flex flex-col items-center justify-center">
                <Avatar src={usercowo} border class="self-center ring-slate-600 w-[8rem] h-[8rem] mb-4"/>
                <span>{data.user.name}</span>
            </div>
            <div class="flex flex-col">
                <Timeline>
                    <TimelineItem title={data.user.payroll} date="Payroll"/>
                    <TimelineItem title={data.user.position} date="Position"/>
                    <TimelineItem title={data.user.location} date="Location"/>
                    <TimelineItem title={data.user.email} date="Email"/>
                </Timeline>
            </div>
        </div>
    </Modal>
</div>
{/if}