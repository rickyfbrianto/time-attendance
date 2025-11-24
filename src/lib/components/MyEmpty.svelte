<script>
    let {message = 'Tidak ada data'} = $props()
</script>

<div class="flex flex-col items-center justify-center gap-4 p-5">
    <img src={'/empty.svg'} class='h-[60%] w-[60%]' alt="">
    <span class='text-[1.5rem] text-center font-bold italic'>{message}</span>
</div>