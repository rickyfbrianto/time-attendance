<script lang="ts">
	import '../../app.css';
    import Header from '@/Header.svelte'
    import Sidebar from '@/Sidebar.svelte'
    import {appstore} from '@lib/store/appstore'
    
	let { children } = $props()

    $effect(()=>{
        if($appstore.appWidth < 768 && $appstore.showSidebar == true){
            appstore.update(state => ({...state, showSidebar:false}))
        // }else if($appstore.appWidth >= 768 && $appstore.showSidebar == false){
        //     appstore.update(state => ({...state, showSidebar:true}))
        }
    })
</script>

<svelte:window bind:innerWidth={$appstore.appWidth}/>

<div class="relative flex h-screen bg-gray-100">
    <Sidebar/>
    <div class="flex flex-col flex-1">
        <Header/>
        <div style="scrollbar-width: none;" class="relative flex flex-col flex-1 overflow-scroll">
            <div style="scrollbar-width: none;" class="p-4 overflow-scroll">
                {@render children()}
            </div>
            <div class="absolute bottom-0 left-0 flex items-center w-full h-[var(--ukuran5)] bg-[var(--warna-base)] px-5 shadow-lg border-slate-300 border-t-[2px]">
                Hai footer
            </div>
        </div>

    </div>
</div>

<style>
    :global(p, span, a, input, button, label){
        font-family: "Poppins", sans-serif;
    }
    :global(#MyButton){
        font-size: .9rem;
        font-family: "Poppins", sans-serif;
    }
</style>