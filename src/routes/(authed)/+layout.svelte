<script lang="ts">
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import '../../app.css';
    import { browser } from '$app/environment';
    
    let {children} = $props()

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                enabled: browser,
                refetchOnWindowFocus: false,
                refetchOnMount: false,
                retry: false
            }
        }
    })
</script>

<QueryClientProvider client={queryClient}>
    {@render children()}
</QueryClientProvider>