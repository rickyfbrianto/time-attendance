<script lang='ts'>
    let {src, className = "", title = "Preview Image"} = $props()
    import { Alert } from "flowbite-svelte";
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
        <img src={'/reaction.gif'} class='w-full rounded-xl shadow-xl' alt={title} {title}/>
        <Alert class='flex flex-col absolute left-[50%] translate-x-[-50%] top-[50%] translate-y-[-50%] p-4 bg-slate-200/[.8] text-slate-800 rounded-lg'>
            <span>Gambar tidak ada</span>
            <span class='text-ellipsis text-wrap'>Cek service <a class="text-blue-600" href={src} target="_blank">File</a></span>
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