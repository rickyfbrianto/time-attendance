<script lang="ts">
    import '../app.css';
	import { page } from '$app/state';
    import {Card, Badge, Hr} from 'flowbite-svelte';
	import MyButton from '@/MyButton.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
</script>

<svelte:head>
    <title>Error {page.error?.message || "500"}</title>
</svelte:head>

<main class='flex flex-col gap-4 justify-center items-center h-screen w-full'>
    <Card img="/error.svg" size="md">
        <h5 class="mb-2 text-2xl font-bold tracking-tight text-center">Ada error !</h5>
        <div class="flex flex-col gap-4">
            <Badge color='red' class='self-center'><kbd class="text-[1rem] p-2 font-normal text-gray-700 dark:text-gray-400 leading-tight">{page.status} | {page.error?.message}</kbd></Badge>
            <div class="flex gap-4 justify-center">
                <MyButton onclick={()=> goto(`${base}/dashboard`)}>Beranda</MyButton>
                <MyButton onclick={()=> page.url.pathname.startsWith('/api') ? history.back() : location.reload()}>
                    {page.url.pathname.startsWith('/api') ? 'Kembali' : 'Refresh'}
                </MyButton>
            </div>
            <Hr/>
            <q class="font-normal text-center italic ">Hubungi team IT jika ada kendala </q>
        </div>
    </Card>
</main>