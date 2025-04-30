<script lang="ts">
    import '../app.css';
	import { page } from '$app/state';
    import {Card, Badge, Button, Hr} from 'flowbite-svelte';

    console.log()
</script>

<svelte:head>
    <title>Error {page.error?.message || "500"}</title>
</svelte:head>

 <main class='flex flex-col gap-4 justify-center items-center h-screen w-full'>
    <Card img="/reaction.gif" size="lg" class="">
        <h5 class="mb-2 text-2xl font-bold tracking-tight text-center">Uppss looks like you here for unconditional reason</h5>
        <div class="flex flex-col gap-2">
            <Badge color='red' class='self-center'><kbd class="text-[1rem] p-2 font-normal text-gray-700 dark:text-gray-400 leading-tight">{page.status} | {page.error?.message}</kbd></Badge>
            <div class="flex gap-4 justify-center">
                <a href="/dashboard">Dashboard</a>
                <button onclick={()=> location.reload()}>Refresh</button>
            </div>
            <Hr/>
            <q class="mb-3 font-normal text-center italic ">Please order some coffee and ask your IT or HRD to solve this problem</q>
        </div>
    </Card>
</main>