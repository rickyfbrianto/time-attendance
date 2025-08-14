<script>
	import { formatTanggal } from "$/lib/utils";
    import { Badge } from 'flowbite-svelte'
    
    let {check_in, check_in2} = $props()
</script>

<div class="flex flex-col items-center justify-start gap-2">
    {#if formatTanggal(check_in, "time").slice(0,2) != "00"}
        <Badge color='green' aria-label={formatTanggal(check_in)} data-balloon-pos="up">{formatTanggal(check_in, "time")}</Badge>
    {/if}
    {#if formatTanggal(check_in2, "time")}
        <Badge color='yellow' aria-label={formatTanggal(check_in2)} data-balloon-pos="up">{formatTanggal(check_in2, "time")}</Badge>
    {/if}
</div>