<script>

  import {createEventDispatcher} from 'svelte';
  const dispatch = createEventDispatcher();

  export let title = "Hello world";
  export let background = "#4a148c";

  function click() {
    dispatch("click", {});
  }
</script>

<main on:click={click} style="background-color: {background}">
  <span>{title}</span>
</main>

<style>

*{
  -webkit-tap-highlight-color: transparent;
}

main{
  width: fit-content;
  height: fit-content;
  border-radius: 6px;

  cursor: pointer;
  text-align: center;
  box-shadow: 0 3px 6px #bdbdbd;
  transition: 0.3s opacity !important;
  padding: 8px;
  color: #fff;
  user-select: none;
}

:global(body.dark) main{
  box-shadow: 0 3px 6px #000;
}

main:active{
  opacity: 0.6;
  transition: 0.3s opacity !important;
}

main span{
  margin: 8px;
}

@media print {
  main {
    display: none;
  }
}
</style>
