<script lang="ts">
	import MyInput from '@/MyInput.svelte';
    import {fade} from 'svelte/transition'
	import axios from 'axios';
	import { Alert, Button, Checkbox } from 'flowbite-svelte';
    import {CircleAlert, Check} from '@lucide/svelte'
    import { goto } from '$app/navigation';
    import { page } from '$app/stores'
	import MyLoading from '@/MyLoading.svelte';

    const redirectTo = $page.url.searchParams.get('redirectTo')
    const message = $page.url.searchParams.get('message')

    let formLoginState = $state({
        answer: {
            payroll:"",
            password:"",
            remember_me:false
        },
        error: message,
        success:"",
        loading:false
    })
    
    const formLoginSubmit = async (e:SubmitEvent) =>{
        e.preventDefault()
        try {    
            formLoginState.loading = true
            const req = await axios.post('/signin', formLoginState.answer)
            const res = await req.data
            formLoginState.error = ""
            formLoginState.success = res.message
            setTimeout(()=>{
                goto(redirectTo ? `${redirectTo}` : '/')
            }, 1000)
        } catch (error: any) {
            formLoginState.error = error.response.data.message
            formLoginState.success = ""
            formLoginState.loading = false
        }
    }
</script>

<svelte:head>
    <title>Signin</title>
</svelte:head>

<div class="flex items-center h-screen w-screen bg-bgside2">
    <div in:fade={{delay:500}} out:fade class="container mx-auto grid md:grid-cols-[20rem_1fr] lg:grid-cols-[26rem_1fr] items-center bg-stone-100 dark:bg-bgside/[.7] text-textdark rounded-xl divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-x-0">
        <form method="POST" onsubmit={formLoginSubmit} class='flex flex-col justify-center h-full p-10 gap-2 font-quicksand'>
            <span class='text-[2.2rem] font-bold'>Hello Guest,</span>
            <span class='text-[1.2rem] font-bold'>Welcome to Time Attendance </span>
            <hr class="border-zinc-200 my-4">
            <div class="flex flex-col gap-4">
                <MyInput type='text' title="Payroll" name='payroll' bind:value={formLoginState.answer.payroll}></MyInput>
                <MyInput type='password' title="Password" name='password' password={true} bind:value={formLoginState.answer.password}></MyInput>
                <Checkbox class='text-textdark' bind:checked={formLoginState.answer.remember_me as unknown as boolean}>Ingat Login</Checkbox>
                {#if !formLoginState.loading}
                    <Button disabled={formLoginState.loading} class="self-start" type={"submit"}>Ya</Button>
                {:else}
                <MyLoading message="Verifikasi Masuk"/>
                {/if}
                {#if formLoginState.error}
                    <Alert border color="red" class='flex gap-2 items-center text-[1.2rem] font-bold'>
                        <CircleAlert size={16}/>
                        {formLoginState.error}
                    </Alert>
                {/if}
                {#if formLoginState.success}
                    <Alert border color="green" class='flex gap-2 items-center text-[1.2rem] font-bold'>
                        <Check size={16}/>
                        {formLoginState.success}
                    </Alert>
                {/if}
            </div>
        </form>
        <div class="flex">
            <img src="/login.svg" class="w-[75vw] h-[75vh] object-contain" alt="">
        </div>
    </div>
    <!-- <div class="container mx-auto">
    </div> -->
</div>