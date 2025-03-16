<script lang="ts">
    import bglogin from '@lib/assets/bg-login.jpg'
    import bg1 from '@lib/assets/bg1.jpg'
	import '../../app.css';
    let {children} = $props()
</script>

<main class='relative flex h-screen w-screen bg-slate-200'>
    <div class="w-full flex flex-col">
        <div class="bg-slate-200 h-full"></div>
        <div style={`background-image: url(${bg1}); background-position:center; background-size: cover;`} class="bg-slate-200 h-full"></div>
    </div>
    <div style={`background-image: url(${bglogin}); background-position:bottom; background-size: cover;`} class="min-w-[50vw]">
        
    </div>
    <div class="absolute top-[50%] translate-y-[-50%] left-[50%] translate-x-[-50%]">
        {@render children()}
    </div>
</main>