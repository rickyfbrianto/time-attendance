<script lang="ts">
    import {Eye, EyeClosed} from 'lucide-svelte'
    import classNames from 'classnames'
    import {fade} from 'svelte/transition'
	import { Label } from 'flowbite-svelte';
    let {type, name, title, className = "", 
        required = false, value = $bindable(), password = false, placeholder = `Input ${title}`} = $props()
    const myClass = classNames(`flex rounded-lg outline-none gap-2 border-[1px] border-slate-300 bg-white px-3`, className)

    let showText = $state(false)
    const sizeIcon = 18
</script>

<div class="flex flex-col flex-1 gap-2">
    <Label>{title}</Label>
    <div class={myClass}>
        <input class="w-full border-0 outline-none ring-0 px-0 py-[.5rem]" id={name} {name} {required} {placeholder} bind:value={value} type={password && type === "password" && showText ? "text" : (type ?? "text")}/>
        {#if password}
            <button type="button" transition:fade onclick={()=> showText = !showText}>
                {#if showText} <EyeClosed size={sizeIcon} /> {:else} <Eye size={sizeIcon}/>{/if}
            </button>
        {/if}
    </div>
</div>