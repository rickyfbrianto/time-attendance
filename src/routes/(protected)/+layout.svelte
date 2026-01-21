<script lang="ts">
    import 'balloon-css';
	import '$/app.css';
	import '$/style.css';
    import Header from '@/Header.svelte'
    import Sidebar from '@/Sidebar.svelte'
    import {appstore, dataStore } from '@lib/store/appstore'
	import type { LayoutProps } from './$types';
    import '@event-calendar/core/index.css';
    import { Calendar } from '@lucide/svelte'
    import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query'
	import { browser } from '$app/environment';

    let {children, data } :LayoutProps = $props()
    const queryClient = new QueryClient({
        // defaultOptions: {
        //     queries:{
        //         enabled: browser,
        //         refetchOnWindowFocus: false,
        //         // refetchOnMount: false,
        //         // refetchOnReconnect: false,
        //         // refetchInterval: 10000
        //     }
        // }

        defaultOptions: {
            queries: {
                enabled: browser,
                refetchOnWindowFocus: false,
                refetchOnMount: false,
                retry: false
            }
        }
    })
    
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
        
        dataStore.update(prev => ({...prev, 
            dashboardIjinCuti: Object.entries(data.dashboardIjinCuti).map(([title, value]) => ({ title, value: value as string, icon: Calendar }))
        }))
    })
</script>

<svelte:window bind:innerWidth={$appstore.appWidth}/>

<QueryClientProvider client={queryClient}>
    <div class="relative flex h-screen bg-bgdark">
        <Sidebar {data}/>
        <div class="flex flex-col flex-1">
            <Header {data} notif={data.notif}/>
            <div style="scrollbar-width: none;" class="relative flex flex-col flex-1 overflow-scroll bg-bgdark text-textdark">
                <div style="scrollbar-width: none;" class="overflow-scroll h-full">
                    {@render children()}
                </div>
            </div>
            <!-- <Footer/> -->
        </div>
    </div>
</QueryClientProvider>

<!-- <style>
    :global(p, span, a, input, button, label){
        font-family: "Poppins", sans-serif;
    }
</style> -->