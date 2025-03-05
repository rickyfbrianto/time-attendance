<script lang="ts">
	import '../../app.css';
    import Header from '@/Header.svelte'
    import Sidebar from '@/Sidebar.svelte'
    import {appstore} from '@lib/store/appstore'
    // import {} from '@better-auth'
    
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

<div class="flex h-screen bg-gray-100">
    <Sidebar/>
    <div class="flex flex-col h-full w-full">
        <Header/>
        <div class="p-4 overflow-y-scroll overflow-x-hidden">
            {@render children()}
        </div>
    </div>
</div>

<style>
    :global(p, span, a, input, button, label){
        font-family: "Poppins", sans-serif;
    }
</style>