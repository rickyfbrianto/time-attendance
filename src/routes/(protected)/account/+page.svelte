<script lang='ts'>
	import axios from 'axios';
    import {fade} from 'svelte/transition'
    import {Alert, Label, Spinner} from 'flowbite-svelte'
	import MyInput from '@/MyInput.svelte';
	import MyButton from '@/MyButton.svelte';
    import {Check, CircleAlert, Save} from '@lucide/svelte'

    const formUser = {
        answer:{
            payroll:"",
            profile_id:"",
            card_no:"",
            name:"",
            position:"",
            department:"",
            location:"",
            phone:"",
            email:"",
            signature:"",
        },
        success:"",
        error:"",
        loading:false
    }

    const handleSubmit = async () =>{
        try {
            formUser.loading = true
            formUser.error = ""
            const req = await axios.put('account', formUser.answer)
            formUser.success = req.data
            formUser.loading = false
        } catch (error: any) {
            formUser.loading = false
            formUser.success = ""
            formUser.error = error.message
        }
    }

</script>

<main in:fade={{delay:500}} out:fade class="flex flex-col bg-white rounded-lg p-5 border border-slate-300">
    <form onsubmit={handleSubmit} transition:fade={{duration:500}} class='flex flex-col gap-2 rounded-lg'>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">            
            <input type='hidden' bind:value={formUser.answer.payroll}/>            
            <div class="flex flex-col gap-2">
                <Label for='profile_id'>Profile</Label>
                <MyInput type="text" bind:value={formUser.answer.profile_id}/>
            </div>
            <div class="flex flex-col gap-2">
                <Label for='card_no'>Card No</Label>
                <MyInput type="text" bind:value={formUser.answer.card_no}/>
            </div>
            <div class="flex flex-col gap-2">
                <Label for='name'>Name</Label>
                <MyInput type="text" bind:value={formUser.answer.name}/>
            </div>
            <div class="flex flex-col gap-2">
                <Label for='position'>Position</Label>
                <MyInput type="text" bind:value={formUser.answer.position}/>
            </div>
            <div class="flex flex-col gap-2">
                <Label for='department'>Department</Label>
                <MyInput type="text" bind:value={formUser.answer.department}/>
            </div>
            <div class="flex flex-col gap-2">
                <Label for='location'>Location</Label>
                <MyInput type="text" bind:value={formUser.answer.location}/>
            </div>
            <div class="flex flex-col gap-2">
                <Label for='phone'>Phone</Label>
                <MyInput type="text" bind:value={formUser.answer.phone}/>
            </div>
            <div class="flex flex-col gap-2">
                <Label for='email' class='capitalize'>email</Label>
                <MyInput type="email" bind:value={formUser.answer.email}/>
            </div>
            <div class="flex flex-col gap-2">
                <Label for='signature' class='capitalize'>signature</Label>
                <MyInput type="text" bind:value={formUser.answer.signature}/>
            </div>            
        </div>
        
        <div class="flex flex-col self-start gap-2">
            <MyButton type={'submit'}><Save /></MyButton>
            {#if formUser.loading}
            <div class="flex gap-2 items-center p-2 bg-slate-100 rounded-lg">
                <Spinner color="gray" size={5}/>
                <span class='text-muted text-[.9rem]'>Sedang verifikasi login</span>
            </div>
            {/if}
            {#if formUser.error}
                <Alert border color="red" class='flex gap-2 items-center'>
                    <CircleAlert size={16}/>
                    {formUser.error}
                </Alert>
            {/if}
            {#if formUser.success}
                <Alert border color="green" class='flex gap-2 items-center'>
                    <Check size={16}/>
                    {formUser.success}
                </Alert>
            {/if}
        </div>
    </form>
</main>