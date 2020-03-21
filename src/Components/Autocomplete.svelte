<script>
  import {createEventDispatcher} from 'svelte';
  const dispatch = createEventDispatcher();

  export let placeholder = "Search 🔎";
  let query = "";

  function search(text) {
    dispatch("change",{
      query: text.target.value,
    });
  }
</script>

<main>
  <input class="search-bar" on:input={search} bind:value={query} type="text" placeholder={placeholder}>
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
  }

  :global(body.dark) .search-bar{
    color: #fff;
  }

  :global(body.dark) .search-bar::-webkit-input-placeholder { /* Edge */
    color: grey;
  }

  :global(body.dark) .search-bar:-ms-input-placeholder { /* Internet Explorer 10-11 */
    color: grey;
  }

  :global(body.dark) .search-bar::placeholder {
    color: grey;
  }
</style>
