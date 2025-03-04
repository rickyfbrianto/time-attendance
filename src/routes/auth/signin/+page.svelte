<script lang="ts">
	import MyInput from '@/MyInput.svelte';
	import MyButton from '@/MyButton.svelte';
    import {fade} from 'svelte/transition'
    import {Plus, RefreshCw, Save, Ban} from 'lucide-svelte'

    const fieldLogin = [
        {type:"text", name:"payrol", title:"Payrol", placeholder:"", required: true},
        {type:"password", name:"password", title:"Password", placeholder:"", required: true, password:true},
    ]

    let formLoginState = {
        answer: fieldLogin.map((item) => ({[item.name]:""})).reduce((acc, item) => ({...acc, ...item}), {}),
        error:""
    }

    const formLoginSubmit = (e:SubmitEvent) =>{
        
    }
</script>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-4 container">
    <form method="POST" onsubmit={formLoginSubmit} class='flex flex-col mx-auto self-start gap-2 p-4 border border-slate-300 rounded-lg bg-white'>
        <div class="flex flex-col gap-4">
            {#each fieldLogin as field}
                <MyInput {...field} bind:value={formLoginState.answer[field.name]}/>
            {/each}
            <MyButton className='font-poppins self-start' type={'submit'}>Signin</MyButton>
            {JSON.stringify(formLoginState.answer)}
        </div>
    </form>

</main>