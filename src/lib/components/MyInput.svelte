<script lang="ts">
    import {Eye, EyeClosed} from '@lucide/svelte'
    import classNames from 'classnames'
    import {fade} from 'svelte/transition'
	import { Label } from 'flowbite-svelte';
    import SveltyPicker from 'svelty-picker'
    let {type, title = '', name = "", className = "", rows=2, disabled = false,
        required = false, value = $bindable(), password = false, placeholder = ``} = $props()
    const myClass = classNames(`flex rounded-lg outline-none gap-2 border-[2px] border-slate-300 bg-bgdark`, className)

    let showText = $state(false)
    const sizeIcon = 18
</script>

<div class="flex flex-col flex-1 gap-2">
    {#if title}
    <Label for={name}>{title}</Label>
    {/if}
    <div class={myClass}>
        {#if type == "textarea"}
            <textarea class='w-full rounded-lg border-0 outline-none ring-0 ps-3 bg-bgdark text-textdark' {rows} id={name} {name} {required} {placeholder} bind:value={value}></textarea>
        {:else if type == 'daterange'}
            <SveltyPicker bind:value={value} isRange inputClasses="w-full rounded-lg border-0 ring-0 ps-3 bg-bgdark text-textdark" format="yyyy-mm-dd hh:i:s"/>
        {:else if type == 'datetime'}
            <SveltyPicker bind:value={value} mode={'datetime'} inputClasses="w-full rounded-lg border-0 ring-0 ps-3 bg-bgdark text-textdark" format="yyyy-mm-dd hh:ii:ss"/>
        {:else}
            <input class="w-full rounded-lg border-0 outline-none ring-0 ps-3 bg-bgdark text-textdark" id={name} {name} {disabled} {required} 
            {placeholder} bind:value={value} type={password && type === "password" && showText ? "text" : (type ?? "text")}/>
        {/if}
        {#if password}
            <button class='pe-3' type="button" transition:fade onclick={()=> showText = !showText}>
                {#if showText} <EyeClosed size={sizeIcon} /> {:else} <Eye size={sizeIcon}/>{/if}
            </button>
        {/if}
    </div>
</div>