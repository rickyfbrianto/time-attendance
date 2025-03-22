<script lang="ts">
	import '../../app.css';
	import '../../style.css';
    import Header from '@/Header.svelte'
    import Sidebar from '@/Sidebar.svelte'
    import {appstore } from '@lib/store/appstore'
	import type { LayoutProps } from './$types';

    let {children, data} :LayoutProps = $props()
    
    $effect(()=>{
        // if($appstore.appWidth < 768 && $appstore.showSidebar == true){
        //     appstore.update(state => ({...state, showSidebar:false}))
        // }
    })
</script>

<svelte:window bind:innerWidth={$appstore.appWidth}/>

<div class="relative flex h-screen bg-slate-200">
    <Sidebar {data}/>
    <div class="flex flex-col flex-1">
        <Header/>
        <div style="scrollbar-width: none;" class="relative flex flex-col flex-1 overflow-scroll ">
            <div style="scrollbar-width: none;" class="overflow-scroll h-full bg-bgdark text-textdark">
                {@render children()}
            </div>
            <div class="sticky bottom-0 left-0 flex items-center w-full h-[var(--ukuran5)] px-5 shadow-lg bg-bgdark text-textdark border-slate-300 border-t-[2px]">
                Hai footer
            </div>
        </div>
    </div>
</div>

<!-- <style>
    :global(p, span, a, input, button, label){
        font-family: "Poppins", sans-serif;
    }
</style> -->