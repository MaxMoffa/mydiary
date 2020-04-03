<script>
  import {createEventDispatcher} from 'svelte';
  const dispatch = createEventDispatcher();

  export let id = null;
  export let context = null;
  export let title = "What's next?";

  let isRealClick = false;

  function close(event) {
    if(context && isMain(event) && isRealClick) context.$destroy();
    isRealClick = true;
  }

  function open() {
    if(isRealClick){
      dispatch("open", {
        id: id,
      });
      if(context) context.$destroy();
    }
    isRealClick = true;
  }

  function modify() {
    if(isRealClick){
      dispatch("modify", {
        id: id,
      });
      if(context) context.$destroy();
    }
    isRealClick = true;
  }

  function destroy() {
    if(isRealClick){
      dispatch("destroy", {
        id: id,
      });
      if(context) context.$destroy();
    }
    isRealClick = true;
  }

  function isMain(e) {
    return e.target.localName === "main";
  }

  function stopClicking(){
    isRealClick = true;
  }
</script>

<main class="contextmenu-element" on:touchend={stopClicking} on:mouseup={stopClicking} on:click={close}>
  <div class="dialog contextmenu-element">
    <div class="title contextmenu-element">{title}</div>
    <div class="option contextmenu-element">
      <div class="contextmenu-element" on:click={open}>
        <span class="contextmenu-element">Read this page</span>
      </div>
      <div class="contextmenu-element" on:click={modify}>
        <span class="contextmenu-element">Change something</span>
      </div>
      <div class="contextmenu-element" on:click={destroy}>
        <span class="contextmenu-element">Destroy this page</span>
      </div>
    </div>
  </div>
</main>

<style>

  *{
    -webkit-tap-highlight-color: transparent;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
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

  .title{
    word-wrap: break-word;
    font-weight: 600;
  }

  .option div{
    width: 100%;
    height: fit-content;
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
