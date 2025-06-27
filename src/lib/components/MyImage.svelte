<script lang='ts'>
    let {src, className = "", title = "Preview Image"} = $props()
    import { Spinner, Alert } from "flowbite-svelte";
	import MyLoading from "./MyLoading.svelte";

    let image = $state({
        isError: false,
        isLoading: true,
    })
</script>

{#if image.isLoading}
    <MyLoading message="Loading images" />
{/if}

{#if image.isError}
    <div class={`relative w-full h-full`}>
        <img src={'./reaction.gif'} class='w-full rounded-xl shadow-xl' alt={title} {title}/>
        <Alert class='flex flex-col absolute left-[50%] translate-x-[-50%] top-[50%] translate-y-[-50%] p-4 bg-white/[.5] text-slate-800 rounded-lg'>
            <span>Error load image</span>
            <span class='text-ellipsis text-wrap'>Check your <a href={src}>Source</a></span>
        </Alert>
    </div>
{:else}
    <img {src} class={`shadow-xl ${className}`} alt={title} {title} 
        onerror={()=> {
            image.isError = true
            image.isLoading = false
        }} 
        onload={()=> image.isLoading = false}>
{/if}