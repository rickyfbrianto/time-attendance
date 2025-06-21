<script lang="ts">
    import bglogin from '$lib/assets/bg-login.jpg'
	import '../../app.css';
    let {children} = $props()
</script>

<main style={`background-image: url(${bglogin}); background-position:center; background-size: cover;`} 
    class='flex items-center justify-center h-screen w-screen'>
    <div>
        {@render children()}
    </div>
</main>