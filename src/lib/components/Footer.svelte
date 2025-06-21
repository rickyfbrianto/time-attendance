<script lang='ts'>
    import { Footer, FooterCopyright, FooterLinkGroup, FooterBrand, FooterLink } from "flowbite-svelte";
	import { Moon, Sun } from '@lucide/svelte';
    import { appstore } from "$/lib/store/appstore";
    import { Toggle } from 'flowbite-svelte';
    import bg from '$/lib/assets/stm.png'
    
    const handleDarkMode = (val: boolean)=>{
        const temp = JSON.parse(localStorage.getItem('appstore') || "")
        if(val)
            document.documentElement.classList.add('dark')
        else
            document.documentElement.classList.remove('dark');
        localStorage.setItem('appstore', JSON.stringify({...temp, darkMode: val}))
    }
</script>

<Footer footerType="logo" class='bg-zinc-50 dark:bg-neutral-900 mt-4 px-4 py-2 md:px-6 md:py-4 border-t-[1px] border-slate-200'>
    <div class="sm:flex sm:items-center sm:justify-between">
        <div class="flex items-center">
            <FooterBrand href="https://flowbite.com" src={bg} alt="Time Attendance" />
            <FooterCopyright class='text-[1.4rem]' href="/" year={new Date().getFullYear()} />
        </div>
        <Toggle bind:checked={$appstore.darkMode} onchange={e => handleDarkMode(e.target.checked)} class='ring-0 border-none outline-none'>
            {#if $appstore.darkMode}
                <Sun size={16} />
            {:else}
                <Moon size={16} />
            {/if}
        </Toggle>
        <!-- <FooterLinkGroup class="flex flex-wrap items-center text-sm text-gray-500 sm:mb-0 dark:text-gray-200">
            <FooterLink href="/">Dashboard</FooterLink>
        </FooterLinkGroup> -->
    </div>
</Footer>