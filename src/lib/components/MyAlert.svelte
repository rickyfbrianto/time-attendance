<script>
	import { CircleX } from '@lucide/svelte';
    import { Alert } from 'flowbite-svelte';
	import { fade } from 'svelte/transition';

    let {pesan, close = true, color = 'green', func = () => {}} = $props()

    let state = $state({
        pesan: (()=> pesan)(),
        open: true
    })

    const handleClose = () => {
        state.open = false
        func()
    }
</script>

{#if state.open}
    <div in:fade={{delay: 500}} out:fade={{delay: 500}}>
        <Alert color={color} class='flex items-center justify-between'>
            <span class="italic font-bold">{pesan}</span>
            {#if close}
                <button class='cursor-pointer' onclick={handleClose}><CircleX /></button>
            {/if}
        </Alert>
    </div>
{/if}