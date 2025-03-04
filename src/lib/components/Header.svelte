<script>
    import {AlignJustify} from 'lucide-svelte'
    import { appstore } from "@lib/store/appstore";

</script>

<div class="flex justify-between items-center min-h-[var(--ukuran5)] w-full border-b-[1px] border-b-[#A0B3C1] px-4 bg-[--warna-base2] bg-white">
    <div class="flex gap-x-4">
        <button onclick={()=> appstore.update(state => ({...state, showSidebar : !state.showSidebar}))}>
            <AlignJustify class='cursor-pointer'/>
        </button>
        <a href="/">Home</a>
    </div>
	<a href="/auth/signin">Login</a>
</div>
