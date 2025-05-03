<link rel="stylesheet" href="https://unpkg.com/svelecte-element/dist/svelecte.css">

<script lang="ts">
	import '../../app.css';
	import '../../style.css';
    import Header from '@/Header.svelte'
    import Sidebar from '@/Sidebar.svelte'
    import {appstore } from '@lib/store/appstore'
	import type { LayoutProps } from './$types';
    import '@event-calendar/core/index.css';

    let {children, data} :LayoutProps = $props()

    $effect(()=>{
        if(localStorage.getItem('appstore')){
            const temp = JSON.parse(localStorage.getItem('appstore') || "")
            appstore.update(state => ({...state, ...temp}))
            if(temp.darkMode)
                document.documentElement.classList.add('dark')
            else
                document.documentElement.classList.remove('dark');
        } else {
            localStorage.setItem('appstore', JSON.stringify($appstore))
        }
    })
</script>

<svelte:window bind:innerWidth={$appstore.appWidth}/>

<div class="relative flex h-screen bg-bgdark">
    <Sidebar {data}/>
    <div class="flex flex-col flex-1">
        <Header/>
        <div style="scrollbar-width: none;" class="relative flex flex-col flex-1 overflow-scroll bg-bgdark text-textdark">
            <div style="scrollbar-width: none;" class="overflow-scroll h-full">
                {@render children()}
            </div>
        </div>
    </div>
</div>

<!-- <style>
    :global(p, span, a, input, button, label){
        font-family: "Poppins", sans-serif;
    }
</style> -->