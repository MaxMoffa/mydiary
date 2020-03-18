<script>
  import ImageElement from '../Components/ImageElement.svelte';
  import {createEventDispatcher} from 'svelte';
  import Fab from '../Components/Fab.svelte';

  const dispatch = createEventDispatcher();

  document.body.style.overflow = "hidden";

  export let id = null;
  export let db = null;
  export let context = null;

  let title = "";
  let date = "";
  let body = "";
  let status = 0;

  if(db !== null){
    let objectStore = db.transaction(["pages"], "readwrite").objectStore("pages");
    let request = objectStore.get(id);
    request.onerror = function(event) {
      console.log(event);
      status = 1;
    };
    request.onsuccess = function(event) {
      let data = event.target.result;
      if(data !== undefined){
        title = data.title;
        date = data.date;
        body = data.body;
        status = 2;
      }else{
        status = 3;
      }
    };
  }else{
    status = 1;
  }

  function closePage() {
    if(context) context.$destroy();
    document.body.style.overflow = "auto";
  }

  function modify() {
    dispatch("modify", {
      id: id
    })
    closePage();
  }
</script>

<main>
  {#if window.document.body.classList.contains('dark')}
    <Fab on:click={closePage} fontSize="32px" margin="16px" color="#fff" background="#212121" shadow="#212121" icon="arrow_back" position="top-left" />
    <Fab on:click={modify} fontSize="32px" margin="16px" color="#fff" background="#212121" shadow="#212121" icon="edit" position="top-right" />
  {:else}
    <Fab on:click={closePage} fontSize="32px" margin="16px" color="#000" background="#fff8e1" shadow="#fff8e1" icon="arrow_back" position="top-left" />
    <Fab on:click={modify} fontSize="32px" margin="16px" color="#000" background="#fff8e1" shadow="#fff8e1" icon="edit" position="top-right" />
  {/if}
  <div class="body">
    <div class="content">
      {#if status === 2}
        <div class="title">{title}</div>
        <div class="date">{date}</div>
        <div class="text">{@html body}</div>
      {:else if status === 0}
        <ImageElement class="loading" src="../media/image/loading.gif" alt="Loading..." />
      {:else if status === 1}
        <ImageElement text="Ops! There is a problem" width="256px" class="loading" src="../media/image/error.gif" alt="Error..." />
      {:else if status === 3}
        <ImageElement class="loading" text="Write down two lines" src="../media/image/empty.gif" alt="No data..." />
      {/if}
    </div>
  </div>
</main>

<style>
  main{
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 2;

    overflow-y: auto;
    background-color: #fff8e1;
		color: #263238;
    scrollbar-width: thin;
    scrollbar-color: #212121 #fff8e1;
  }

  :global(body.dark) main{
		background-color: #212121;
		color: #fff;
    scrollbar-color: #fff8e1 #212121;
	}

  .body{
    position: absolute;
    width: 100%;
    height: auto;
    top: 90px;
  }

  .content{
    width: 100%;
    max-width: 600px;
    height: 30px;
    margin: 0 auto;
  }

  .content *{
    display: block;
    margin: 0 16px 16px 16px;
  }

  .title{
    font-size: 40px;
  }

  .text{
    margin-top: 64px;
    font-size: 20px;
  }

  :global(.ql-size-large){
    font-size: 1.5em;
  }

  :global(.ql-size-huge){
    font-size: 2.5em;
  }

  :global(.ql-size-small){
    font-size: 0.75em;
  }

</style>
