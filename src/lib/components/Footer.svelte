<script lang='ts'>
    import { FooterBrand } from "flowbite-svelte";
    import bg from '$/lib/assets/stm.png'
    
    // const handleDarkMode = (val: boolean)=>{
    //     const temp = JSON.parse(localStorage.getItem('appstore') || "")
    //     if(val)
    //         document.documentElement.classList.add('dark')
    //     else
    //         document.documentElement.classList.remove('dark');
    //     localStorage.setItem('appstore', JSON.stringify({...temp, darkMode: val}))
    // }
</script>

<div class='bg-bgdark2 px-4 py-2 md:px-6 md:py-3 border-slate-300 rounded-t-lg border-t font-quicksand'>
    <div class="sm:flex sm:items-center sm:justify-between">
        <div class="flex items-center">
            <FooterBrand src={bg} alt="Time Attendance" class='font-bold'/>
            <span class='text-textdark text-[.8rem]'>© {new Date().getFullYear()} All Rights Reserved</span>
        </div>
    </div>
</div>