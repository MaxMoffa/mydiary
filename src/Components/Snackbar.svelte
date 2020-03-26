<script context="module">
	const element = new Set();
</script>

<script>
  export let text = "Hello world!";
  export let actionText = "Action";
  export let duration = 2000;
  export let click = null;
  export let context = null;

  function buttonClick(){
    click();
    document.querySelector(".snackbar-element").style.display = "none";
    context.$destroy();
  }

  setTimeout(() => {
    document.querySelector(".snackbar-element").style.display = "none";
    if(context) context.$destroy();
  }, duration);
</script>

<main class="snackbar-element">
  <div>
    <span>
      <span>{text}</span>
      {#if click}
        <span class="click" on:click={buttonClick}>{actionText.toUpperCase()}</span>
      {/if}
    </span>
  </div>
</main>

<style>
  main{
    position: fixed;
    width: 100%;
    height: auto;
    bottom: 0;
    left: 0;

    z-index: 3;
  }

  main div{
    position: absolute;
    display: inline-block;
    width: fit-content;
    height: fit-content;
    bottom: 0;
    margin: 8px;

    background-color: rgba(33, 33, 33, 0.96);
    border-radius: 6px;
    color: #fff;
    font-size: 14px;
  }

  main div span{
    display: inline-block;
    margin: 4px 8px;
    user-select: none;
  }

  .click{
    color: #fff8e1;
    cursor: pointer;
  }
	
	@media print {
	  main {
	    display: none;
	  }
	}
</style>
