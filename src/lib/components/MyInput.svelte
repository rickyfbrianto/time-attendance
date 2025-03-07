<script lang="ts">
    import {Eye, EyeClosed} from 'lucide-svelte'
    import classNames from 'classnames'
    import {fade} from 'svelte/transition'
	import { Label } from 'flowbite-svelte';
    let {type, title = '', name = "", className = "", rows=2,
        required = false, value = $bindable(), password = false, placeholder = ``} = $props()
    const myClass = classNames(`flex rounded-lg outline-none gap-2 border-[1px] border-slate-300 bg-white px-3`, className)

    let showText = $state(false)
    const sizeIcon = 18
</script>

<div class="flex flex-col flex-1 gap-2">
    <Label for={name}>{title}</Label>
    <div class={myClass}>
        {#if type == "textarea"}
            <textarea class='w-full border-0 outline-none ring-0 px-0 py-[.5rem]' {rows} id={name} {name} {required} {placeholder} bind:value={value}></textarea>
        {:else}
            <input class="w-full border-0 outline-none ring-0 px-0 py-[.5rem]" id={name} {name} {required} {placeholder} bind:value={value} type={password && type === "password" && showText ? "text" : (type ?? "text")}/>
        {/if}
        {#if password}
            <button type="button" transition:fade onclick={()=> showText = !showText}>
                {#if showText} <EyeClosed size={sizeIcon} /> {:else} <Eye size={sizeIcon}/>{/if}
            </button>
        {/if}
    </div>
</div>