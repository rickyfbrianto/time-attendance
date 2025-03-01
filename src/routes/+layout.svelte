<script lang="ts">
	import { browser } from '$app/environment';
	import '../app.css';
    import Header from '@/Header.svelte'
    import Sidebar from '@/Sidebar.svelte'
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
    
	let { children } = $props();

    const queryClient = new QueryClient({
        defaultOptions:{
            queries:{
                enabled:browser,
                refetchOnWindowFocus:false
            }
        }
    })
</script>

<QueryClientProvider client={queryClient}>
    <div class="flex h-screen bg-gray-100">
        <Sidebar/>
        <div class="flex flex-col h-full w-full">
            <Header/>
            <div class="p-4 overflow-y-scroll overflow-x-hidden">
                {@render children()}
            </div>
        </div>
    </div>
</QueryClientProvider>

<style>
    :global(p, span, a){
        font-family: "Poppins", sans-serif;
    }
</style>