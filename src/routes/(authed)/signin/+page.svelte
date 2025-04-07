<script lang="ts">
	import MyInput from '@/MyInput.svelte';
	import MyButton from '@/MyButton.svelte';
    import {fade} from 'svelte/transition'
	import axios from 'axios';
	import { Alert, Checkbox } from 'flowbite-svelte';
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
            formLoginState.loading = false
            formLoginState.error = ""
            formLoginState.success = res.message
            setTimeout(()=>{
                goto(redirectTo ? `${redirectTo}` : '/')
            }, 1000)
        } catch (error: any) {
            formLoginState.loading = false
            formLoginState.error = error.response.data.message
            formLoginState.success = ""
        }
    }
</script>

<svelte:head>
    <title>Signin</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-bgdark text-textdark rounded-lg container border-[2px] border-slate-200">
    <div class="flex p-6 bg-bgdark2 rounded-t-lg">
        <span class=''>Login</span>
    </div>
    
    <form method="POST" onsubmit={formLoginSubmit} class='flex flex-col mx-auto p-6 self-start gap-2 min-w-[30rem]'>
        {#if formLoginState.error}
            <Alert border color="red" class='flex gap-2 items-center'>
                <CircleAlert size={16}/>
                {formLoginState.error}
            </Alert>
        {/if}
        {#if formLoginState.success}
            <Alert border color="green" class='flex gap-2 items-center'>
                <Check size={16}/>
                {formLoginState.success}
            </Alert>
        {/if}
        {#if formLoginState.loading}
            <MyLoading message="Login verification"/>
        {/if}
        <div class="flex flex-col gap-4">
            <MyInput type='text' title="Payroll" name='payroll' bind:value={formLoginState.answer.payroll}></MyInput>
            <MyInput type='password' title="Password" name='password' password={true} bind:value={formLoginState.answer.password}></MyInput>
            <Checkbox bind:checked={formLoginState.answer.remember_me as unknown as boolean}>Remember Me</Checkbox>
            <MyButton disabled={formLoginState.loading} className='font-poppins self-start' type={'submit'}>Signin</MyButton>
        </div>
    </form>        
</main>