<script>
  export let src = "";
  export let alt = "";
  export let text = "";
  export let width = "128px";
</script>

{#if src !== ""}
  <main>
    <img src={src} alt={alt} style="width: {width}">
    {#if text !== ""}
      <div>{text}</div>
    {/if}
  </main>
{/if}

<style>
  main{
    width: 100%;
    height: fit-content;
  }

  main *{
    user-select: none;
  }

  img{
    display: block;
    margin: 0 auto;
  }

  div{
    width: 100%;
    text-align: center;
    font-family: 'Beth Ellen', cursive;
  }

  @media print {
	  main {
	    display: none;
	  }
	}
</style>
