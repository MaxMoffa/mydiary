<script>
  import {createEventDispatcher} from 'svelte';
  const dispatch = createEventDispatcher();

  export let context = null;
  export let title = "Choose a color";

  let color = "";

  function close(event) {
    if(context && isMain(event)) context.$destroy();
  }

  function selectColor(e) {
    dispatch("change", {
      color: e.target.style["background-color"],
    });
    if(context) context.$destroy();
  }

  function isMain(e) {
    return e.target.localName === "main";
  }
</script>

<main on:click={close}>
  <div class="dialog">
    <div class="title">{title}</div>
    <div class="option">
      <div on:click={selectColor} style="background-color: #b71c1c"></div>
      <div on:click={selectColor} style="background-color: #880e4f"></div>
      <div on:click={selectColor} style="background-color: #4a148c"></div>
      <div on:click={selectColor} style="background-color: #311b92"></div>
      <div on:click={selectColor} style="background-color: #1a237e"></div>
      <div on:click={selectColor} style="background-color: #0d47a1"></div>
      <div on:click={selectColor} style="background-color: #01579b"></div>
      <div on:click={selectColor} style="background-color: #006064"></div>
      <div on:click={selectColor} style="background-color: #004d40"></div>
      <div on:click={selectColor} style="background-color: #1b5e20"></div>
      <div on:click={selectColor} style="background-color: #33691e"></div>
      <div on:click={selectColor} style="background-color: #827717"></div>
      <div on:click={selectColor} style="background-color: #e65100"></div>
      <div on:click={selectColor} style="background-color: #bf360c"></div>
      <div on:click={selectColor} style="background-color: #3e2723"></div>
    </div>
  </div>
</main>

<style>

  *{
    -webkit-tap-highlight-color: transparent;
  }

  main{
    display: flex;
    position: fixed;
    width: 100vw;
    height: 100vh;
    bottom: 0;
    left: 0;
    z-index: 2;
    background-color: rgba(0,0,0, 0.3);
    align-items: center;
    color: #000;
  }

  .dialog{
    display: block;
    position: relative;
    width: 100%;
    max-width: 300px;
    height: fit-content;
    max-height: 500px;
    margin: 64px auto;

    background-color: #fff;
    border-radius: 6px;
    box-shadow: 0 3px 6px #212121;
    overflow-y: auto;
  }

  .dialog > div {
    margin: 16px;
    user-select: none;
  }

  .option{
    max-height: 300px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #212121 #fff;
  }

  .option::-webkit-scrollbar{
    width: 8px;
  }

  .option::-webkit-scrollbar-thumb{
    background-color: #212121;
    border-right: 1px solid #fff;
  }

  .option::-webkit-scrollbar-thumb:hover{
    background-color: grey;
  }

  .title{
    font-weight: 600;
  }

  .option div{
    width: 100%;
    height: 32px;
    margin-bottom: 8px;
    padding: 12px 0;
    transition: 0.2s background;
    cursor: pointer;
  }

  .option div:active{
    background-color: #bdbdbd !important;
    transition: 0.2s background;
  }

  .option div span{
    margin: 0 8px;
  }

  @media print {
	  main {
	    display: none;
	  }
	}
</style>
