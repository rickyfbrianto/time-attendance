<script>
	import { fade, slide } from "svelte/transition";
	import { Clock, Hourglass, ListTodo, Plane, PlaneTakeoff, TentTree, TreePalm } from "@lucide/svelte";
	import { formatTanggal, formatTanggalISO, formatWaktuHari, selisihWaktuHari } from "@lib/utils.js";

    let { data } = $props()
    let user = $derived(data.user)

    const icons = [
        {name:"sppd", value: Plane, link: "dinas"},
        {name:"skpd", value: PlaneTakeoff, link: "dinas"},
        {name:"spl", value: Hourglass, link: "lembur"},
        {name:"srl", value: ListTodo, link: "lembur"},
        {name:"cuti", value: TentTree, link: "cuti"},
        {name:"ijin", value: TreePalm, link: "ijin"},
    ]
</script>

<svelte:head>
    <title>{data.notif.length} Pemberitahuan {user.name}</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full w-full">
    <div class="flex flex-col border border-slate-200 rounded-lg">
        <div in:slide={{duration:500, delay:100}} out:slide={{duration:500, delay:100}} class="flex flex-col">
            <div class="flex items-center p-4 gap-2">
                <span class="block font-bold text-[1.4rem]">Kamu mempunyai {data.notif.length} pemberitahuan</span>
            </div>
            <div class="flex flex-col max-h-[25rem] overflow-auto">
                {#each data.notif as {waktu, link, deskripsi}}
                    {@const Icon = icons.find(v => v.name == link)?.value}
                    <a href={`/${icons.find(v => v.name == link)?.link}`} class="flex flex-col gap-2 px-6 py-4 bg-bgdark hover:bg-bgdark2 border-t border-slate-200">
                        <div class="flex items-center gap-4">
                            <Icon size={18}/>
                            <div class="flex flex-col gap-2">
                                <span class="text-[.85rem] font-bold">{deskripsi}</span>
                                <div class="flex items-center gap-1">
                                    <Clock size={14} class='w-[1rem]'/>
                                    <span aria-label={formatTanggal(waktu)} data-balloon-pos="up" class="text-[.7rem] italic">{formatWaktuHari(selisihWaktuHari(waktu, formatTanggalISO(new Date())))} yang lalu</span>
                                </div>
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    </div>
</main>