<script lang="ts">
	import MyInput from '@/MyInput.svelte';
	import MyButton from '@/MyButton.svelte';
    import {fade} from 'svelte/transition'
	import axios from 'axios';
	import { Alert, Spinner  } from 'flowbite-svelte';
    import {CircleAlert, Check} from '@lucide/svelte'
    import { goto } from '$app/navigation';

    import { page } from '$app/stores'
	import MyLoading from '@/MyLoading.svelte';
    const redirectTo = $page.url.searchParams.get('redirectTo')
    const message = $page.url.searchParams.get('message')
    
    const fieldLogin = [
        {type:"text", name:"payroll", title:"Payrol", placeholder:"", required: true},
        {type:"password", name:"password", title:"Password", placeholder:"", required: true, password:true},
    ]

    let formLoginState = $state({
        answer: fieldLogin.map((item) => ({[item.name]:""})).reduce((acc, item) => ({...acc, ...item}), {}),
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
            // const req = await fetch('/signin', {
            //     method:"POST",
            //     body:JSON.stringify(formLoginState.answer)
            // })
            // const res = await req.json()
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

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg container border border-slate-300 rounded-lg">
    <div class="flex p-6 bg-slate-800 rounded-t-lg">
        <span class='text-white'>Login</span>
    </div>
    
    <form method="POST" onsubmit={formLoginSubmit} class='flex flex-col mx-auto p-6 self-start gap-2 w-[25rem]'>
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
            {#each fieldLogin as field}
                <MyInput {...field} bind:value={formLoginState.answer[field.name]}/>
            {/each}
            <MyButton disabled={formLoginState.loading} className='font-poppins self-start' type={'submit'}>Signin</MyButton>
        </div>
    </form>        
</main>