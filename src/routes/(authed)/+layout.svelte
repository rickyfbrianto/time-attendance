<script lang="ts">
	import '../../app.css';
    let {children} = $props()
</script>

<main class='relative flex flex-col h-screen w-screen'>
    <div class="h-[50vh] bg-red-200">
        
    </div>
    <div class="absolute top-[50%] translate-y-[-50%] left-[50%] translate-x-[-50%]">
        {@render children()}
    </div>
</main>