<script lang='ts'>
    import MyButton from '@lib/components/MyButton.svelte'
    import {AlignJustify, Check, LogOut } from 'lucide-svelte'
	import { Alert, Modal, Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';
    import { appstore } from "@lib/store/appstore";
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	
    let pathname:string[] = $state([])
    
    $effect(()=>{
        pathname = page.url.pathname.split('/').map(val => val).filter(v => v && v != 'dashboard')
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
        setTimeout(()=>{
            goto('/signin')
        }, 1000)
    }
</script>

<div class="flex justify-between items-center min-h-[var(--ukuran7)] w-full border-b-[2px] border-b-[#A0B3C1] px-4 bg-[--warna-base2] bg-white shadow-md">
    <div class="flex gap-x-4">
        <Breadcrumb aria-label="Solid background breadcrumb example" solid>
            <button class='' onclick={()=> appstore.update(state => ({...state, showSidebar : !state.showSidebar}))}>
                <AlignJustify class='cursor-pointer'/>
            </button>
            <BreadcrumbItem href="/dashboard" home>Dashboard</BreadcrumbItem>
            {#each pathname as val}
                <BreadcrumbItem class='capitalize' href={val}>{val}</BreadcrumbItem>
            {/each}
        </Breadcrumb>
    </div>
    
    <Modal title="Logout" bind:open={logoutState.modal}>
        <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">Are you sure want logout?</p>
        {#if logoutState.message}
            <Alert color="green" class='flex items-center'>
                <Check />
                <span class="font-medium">{logoutState.message}</span>
            </Alert>
        {/if}
        <svelte:fragment slot="footer">
            <MyButton disabled={logoutState.loading} onclick={() => handleLogout()}>Yes, log me out</MyButton>
        </svelte:fragment>
    </Modal>
    
    <MyButton onclick={()=> logoutState.modal = true}><LogOut color={'red'} size={16}/></MyButton>
</div>
