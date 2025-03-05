<script>
    import {AlignJustify} from 'lucide-svelte'
    import { appstore } from "@lib/store/appstore";
	import axios from 'axios';
	import { Alert } from 'flowbite-svelte';
	import { redirect } from '@sveltejs/kit';
	import { goto } from '$app/navigation';

    let logoutState = $state("")
    const handleLogout = async () => {
        const req = await axios.post('/auth/signout')
        const res = await req.data
        logoutState = res.message
        setTimeout(()=>{
            goto('/auth/signin')
        }, 1000)
    }
</script>

<div class="flex justify-between items-center min-h-[var(--ukuran5)] w-full border-b-[1px] border-b-[#A0B3C1] px-4 bg-[--warna-base2] bg-white">
    <div class="flex gap-x-4">
        <button onclick={()=> appstore.update(state => ({...state, showSidebar : !state.showSidebar}))}>
            <AlignJustify class='cursor-pointer'/>
        </button>
        <a href="/">Home</a>
    </div>
    <button onclick={handleLogout}>Logout</button>
    {#if logoutState}
        <Alert>
            {logoutState}
        </Alert>
    {/if}
	<!-- <a href="/auth/signin">Login</a> -->
</div>
