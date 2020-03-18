<script>
  import {createEventDispatcher} from 'svelte';
  const dispatch = createEventDispatcher();

  export let id = null;
  export let context = null;
  export let title = "What's next?";

  function close(event) {
    if(context && isMain(event)) context.$destroy();
  }

  function open() {
    dispatch("open", {
      id: id,
    });
    if(context) context.$destroy();
  }

  function modify() {
    dispatch("modify", {
      id: id,
    });
    if(context) context.$destroy();
  }

  function destroy() {
    dispatch("destroy", {
      id: id,
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
      <div on:click={open}>
        <span>Read this page</span>
      </div>
      <div on:click={modify}>
        <span>Change something</span>
      </div>
      <div on:click={destroy}>
        <span>Destroy this page</span>
      </div>
    </div>
  </div>
</main>

<style>

  *{
    -webkit-tap-highlight-color: transparent;
  }

  main{
    display: flex;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
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
</style>
