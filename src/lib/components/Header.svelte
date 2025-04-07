<script lang='ts'>
    import MyButton from '@lib/components/MyButton.svelte'
    import {AlignJustify, Check, CloudCog, Eclipse, LogOut, Moon, Sun } from '@lucide/svelte'
	import { Alert, Modal, Breadcrumb, BreadcrumbItem, Toggle } from 'flowbite-svelte';
    import { appstore } from "@lib/store/appstore";
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	
    let pathname:string[] = $state([])
    
    $effect(()=>{
        pathname = page.url.pathname.split('/').filter(v => v && v != 'dashboard')
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

    
    $effect(()=>{
        if($appstore.darkMode){
            document.documentElement.classList.add('dark');
        }else{
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('appstore', JSON.stringify($appstore))
    })
</script>

<div class="flex justify-between items-center min-h-[var(--ukuran7)] w-full border-b-[2px] border-b-[#A0B3C1] px-4 bg-bgdark">
    <div class="flex gap-x-4">
        <Breadcrumb aria-label="Solid background breadcrumb example" solid class='text-textdark'>
            <button class='text-textdark' onclick={()=> appstore.update(state => ({...state, showSidebar : !state.showSidebar}))}>
                <AlignJustify class='cursor-pointer'/>
            </button>
            <BreadcrumbItem href="/dashboard" home homeClass='flex items-center text-textdark ms-2 '><span class="text-textdark text-sm">Dashboard</span></BreadcrumbItem>
            {#each pathname as val}
                <BreadcrumbItem class='capitalize' href={val}><span class="text-textdark text-sm">{val}</span></BreadcrumbItem>
            {/each}
        </Breadcrumb>
    </div>
    
    <div class="flex gap-4 items-center text-textdark">
        <Toggle bind:checked={$appstore.darkMode} class='ring-0 border-none outline-none'>
            {#if $appstore.darkMode}
                <Sun size={16} />
            {:else}
                <Moon size={16} />
            {/if}
        </Toggle>
        <MyButton className='bg-bgdark text-textdark' onclick={()=> logoutState.modal = true}><LogOut size={16}/></MyButton>
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
</div>
