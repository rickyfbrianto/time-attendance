<script>
	import { formatTanggal } from "$/lib/utils";
    import { Badge, Tooltip } from 'flowbite-svelte';
    
    let {check_in, check_in2} = $props()
</script>

<div class="flex flex-col items-center justify-start gap-2">
    {#if formatTanggal(check_in, "time").slice(0,2) != "00"}
        <Badge color="dark">{formatTanggal(check_in, "time")}</Badge>
        <Tooltip class='z-10'>{formatTanggal(check_in)}</Tooltip>
    {/if}
    {#if formatTanggal(check_in2, "time")}
        <Badge color="yellow">{formatTanggal(check_in2, "time")}</Badge>
        <Tooltip class='z-10'>{formatTanggal(check_in2)}</Tooltip>
    {/if}
</div>