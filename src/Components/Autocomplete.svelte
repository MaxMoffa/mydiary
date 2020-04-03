<script>
  import {createEventDispatcher} from 'svelte';
  const dispatch = createEventDispatcher();

  export let placeholder = "Search 🔎";
  export let query = "";
  let input_bar;

  function search(text) {
    dispatch("change",{
      query: text.target.value,
    });
  }

  function focus() {
    input_bar.placeholder = "";
  }

  function blur() {
    input_bar.placeholder = "Search 🔎";
  }

</script>

<main>
  <input bind:this={input_bar} class="search-bar" on:focus={focus} on:blur={blur} on:input={search} bind:value={query} type="text" placeholder={placeholder}>
</main>

<style>

  *{
      outline: 0;
  }

  main{
    display: block;
    max-width: 300px;
    width: 100%;
    height: auto;
    margin: 16px auto;
  }

  main input{
    width: 100%;

    border-radius: 50px;
    background-color: transparent;
    text-align: center;
    user-select: text;
    transition: 1s background;
  }

  main input:focus{
    background-color: #fff;
    color: #000 !important;
    transition: 1s background;
  }

  :global(body.dark) .search-bar{
    color: #fff;
  }

  :global(body.dark) .search-bar::-webkit-input-placeholder {
    color: grey;
  }

  :global(body.dark) .search-bar:-ms-input-placeholder {
    color: grey;
  }

  :global(body.dark) .search-bar::placeholder {
    color: grey;
  }
</style>
