<script>
    import MyDatePicker from '@/MyDatePicker.svelte';

    let tesInput = $state({
        tgl: ""
    })
</script>

<div class='ps-3'>
    {JSON.stringify(tesInput.tgl)}
    <MyDatePicker bind:value={tesInput.tgl} time mode="range"/>
</div>