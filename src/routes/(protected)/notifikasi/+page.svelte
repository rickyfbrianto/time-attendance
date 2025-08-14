<script>
	import { fade, slide } from "svelte/transition";
	import { Clock } from "@lucide/svelte";
	import { formatTanggal, formatTanggalISO, formatWaktuHari, selisihWaktuHari } from "@lib/utils.js";

    let { data } = $props()
    let user = $derived(data.user)

    const icon = [
        {name:"dinas", value: 'dinas.png'},
        {name:"cuti", value: 'cuti.png'},
        {name:"ijin", value: 'ijin.png'},
        {name:"lembur", value: 'lembur.png'},
    ]
</script>

<svelte:head>
    <title>{data.notif.length} Pemberitahuan {user.name}</title>
</svelte:head>

<main in:fade={{delay:500}} out:fade class="flex flex-col p-4 gap-4 h-full w-full">
    <div class="flex flex-col border border-slate-200 rounded-lg">
        <div in:slide={{duration:500, delay:100}} out:slide={{duration:500, delay:100}} class="flex flex-col">
            <div>
                <div class="flex items-center p-4 gap-2">
                    <span class="block font-bold text-[1.4rem]">Kamu mempunyai {data.notif.length} pemberitahuan</span>
                </div>
            </div>
            <div class="flex flex-col overflow-auto">
                {#each data.notif as {waktu, link, deskripsi}}
                    <a href={`/${link}`} class="flex flex-col gap-2 p-4 bg-bgdark hover:bg-bgdark2 border-t border-slate-200">
                        <div class="flex items-center gap-2">
                            <img class='w-[1.5rem] h-[1.5rem]' src={icon.find(v => v.name == link)?.value} alt="">
                            <span class="text-[1rem] font-bold">{deskripsi}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Clock size={14} class='w-[1.5rem]'/>
                            <span aria-label={formatTanggal(waktu)} data-balloon-pos="up" class="text-[.75rem] italic">{formatWaktuHari(selisihWaktuHari(waktu, formatTanggalISO(new Date())))} yang lalu</span>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    </div>
</main>