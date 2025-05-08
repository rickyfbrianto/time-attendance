<script lang="ts">
	import '../../app.css';
	import '../../style.css';
    import Header from '@/Header.svelte'
    import Sidebar from '@/Sidebar.svelte'
    import {appstore } from '@lib/store/appstore'
	import type { LayoutProps } from './$types';
    import '@event-calendar/core/index.css';
    import bg from '@lib/assets/stm.png'
    import { Footer, FooterCopyright, FooterLinkGroup, FooterBrand, FooterLink } from "flowbite-svelte";

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

<link rel="stylesheet"  href="https://unpkg.com/svelecte-element/dist/svelecte.css">

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
        <Footer footerType="logo" class='bg-slate-50 dark:bg-neutral-900 mt-4 p-4 md:p-6 rounded-t-lg'>
            <div class="sm:flex sm:items-center sm:justify-between">
                <div class="flex items-center">
                    <FooterBrand href="https://flowbite.com" src={bg} alt="Time Attendance" />
                    <FooterCopyright class='text-[1.4rem]' href="/" year={new Date().getFullYear()} />
                </div>
                <FooterLinkGroup class="flex flex-wrap items-center text-sm text-gray-500 sm:mb-0 dark:text-gray-200">
                    <FooterLink href="/">Dashboard</FooterLink>
                </FooterLinkGroup>
            </div>
            <!-- <hr class="my-6 border-gray-200 sm:mx-auto lg:my-8 dark:border-gray-700" /> -->
            <!-- <FooterCopyright href="/" by="Flowbite™" /> -->
        </Footer>
    </div>
</div>

<!-- <style>
    :global(p, span, a, input, button, label){
        font-family: "Poppins", sans-serif;
    }
</style> -->