<script lang="ts">
	import MyInput from '@/MyInput.svelte';
	import MyButton from '@/MyButton.svelte';
    import {fade} from 'svelte/transition'
	import axios from 'axios';
	import { decryptData, encryptData } from '@lib/utils';
	import { Alert, Toast } from 'flowbite-svelte';
    import {CircleAlert} from 'lucide-svelte'
    import { goto } from '$app/navigation';

    import { page } from '$app/stores'
    const redirectTo = $page.url.searchParams.get('redirectTo')
    console.log(redirectTo)
    
    const fieldLogin = [
        {type:"text", name:"payroll", title:"Payrol", placeholder:"", required: true},
        {type:"password", name:"password", title:"Password", placeholder:"", required: true, password:true},
    ]

    let formLoginState = $state({
        answer: fieldLogin.map((item) => ({[item.name]:""})).reduce((acc, item) => ({...acc, ...item}), {}),
        error:"",
        success:"",
        loading:false
    })
    
    const formLoginSubmit = async (e:SubmitEvent) =>{
        e.preventDefault()
        try {    
            formLoginState.loading = true
            const req = await axios.post('/auth/signin', formLoginState.answer)
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

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-4 container">
    <div class="flex flex-col">
        <form method="POST" onsubmit={formLoginSubmit} class='flex flex-col mx-auto self-start gap-2 p-4 border border-slate-300 rounded-lg bg-white w-[25rem]'>
            <div class="flex flex-col gap-4">
                {#each fieldLogin as field}
                <MyInput {...field} bind:value={formLoginState.answer[field.name]}/>
                {/each}
                <MyButton className='font-poppins self-start' type={'submit'}>Signin</MyButton>
                {#if formLoginState.error || formLoginState.success}
                    <Alert border color="red" class='flex gap-2 items-center'>
                        <CircleAlert size={16}/>
                        {formLoginState.error || formLoginState.success}
                    </Alert>
                {/if}
                {#if formLoginState.loading}
                <span>Sedang memverifikasi login</span>
                {/if}
            </div>
        </form>
    </div>
        
</main>