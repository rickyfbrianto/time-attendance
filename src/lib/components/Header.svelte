<script lang='ts'>
    import MyButton from '$/lib/components/MyButton.svelte'
    import {AlignJustify, Check, LogOut } from '@lucide/svelte'
	import { Alert, Modal, Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';
    import { appstore } from "$/lib/store/appstore";
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	
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
    
    // $effect(()=>{
    //     // pathname = page.url.pathname.split('/').filter(v => v && v != 'dashboard')

    //     let urlTemp = page.url.pathname.split('/').filter(v => v && v != 'dashboard')
    //     let path = '';
    //     for (const part of urlTemp) {
    //         path = path ? `${path}/${part}` : part;
    //         pathname.push(path);
    //     }
    // })

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
</script>

<div class="flex justify-between items-center min-h-[var(--ukuran7)] w-full border-b-[2px] border-b-[#A0B3C1] px-4 bg-bgdark text-textdark">
    <div class="flex gap-x-4">
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
    
    <MyButton className='bg-bgdark2 text-textdark' onclick={()=> logoutState.modal = true}><LogOut size={16}/></MyButton>

    <Modal class='bg-bgdark' title="Logout" bind:open={logoutState.modal}>
        <p class="text-base leading-relaxed">Are you sure want logout?</p>
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
