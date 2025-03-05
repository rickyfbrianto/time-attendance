<script lang="ts">
	import MyInput from '@/MyInput.svelte';
	import MyButton from '@/MyButton.svelte';
    import {fade} from 'svelte/transition'
	import axios from 'axios';
	import { decryptData, encryptData } from '@lib/utils';
	import { Alert, Toast } from 'flowbite-svelte';
    import {CircleAlert} from 'lucide-svelte'

    const fieldLogin = [
        {type:"text", name:"payroll", title:"Payrol", placeholder:"", required: true},
        {type:"password", name:"password", title:"Password", placeholder:"", required: true, password:true},
    ]

    let formLoginState = $state({
        answer: fieldLogin.map((item) => ({[item.name]:""})).reduce((acc, item) => ({...acc, ...item}), {}),
        error:"",
        success:""
    })
    
    const formLoginSubmit = async (e:SubmitEvent) =>{
        e.preventDefault()
        try {    
            const req = await axios.post('signin', formLoginState.answer)
            const res = await req.data
            formLoginState.error = ""
            formLoginState.success = res.message
        } catch (error: any) {
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
                {#if formLoginState.error}
                    <Alert border color="red" class='flex gap-2 items-center'>
                        <CircleAlert size={16}/>
                        {formLoginState.error}
                    </Alert>
                {/if}
            </div>
        </form>
    </div>
        
</main>