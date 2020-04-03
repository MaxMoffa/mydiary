<script>
  import ImageElement from '../Components/ImageElement.svelte';
  import {createEventDispatcher, onDestroy} from 'svelte';
  import Fab from '../Components/Fab.svelte';
  import Snackbar from '../Components/Snackbar.svelte';

  const dispatch = createEventDispatcher();

  document.body.style.overflow = "hidden";

  export let id = null;
  export let db = null;
  export let context = null;

  let title = "";
  let date = "";
  let body = "";
  let status = 0;
  let width_content = "600px";

  if(localStorage.getItem("content-width-diary"))
    width_content = localStorage.getItem("content-width-diary");

  if(window.history && window.history.pushState)
    window.history.pushState(null, null, './#viewer');

  onDestroy(() => {
    document.body.style.overflow = "auto";
  });

  if(db !== null){
    let objectStore = db.transaction(["pages"], "readwrite").objectStore("pages");
    let request = objectStore.get(id);
    request.onerror = function(event) {
      console.log(event);
      alertUser("Ops! There is a problem");
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
        alertUser("Ops! There is nothing about it");
      }
    };
  }else{
    status = 1;
    alertUser("Ops! There is a problem");
  }

  function closePage() {
    if(window.history && window.history.pushState) window.history.back();
    else context.$destroy();
  }

  function modify() {
    dispatch("modify", {
      id: id
    });
    if(context) context.$destroy();
  }

  function deleteThis() {
    dispatch("delete", {
      id: id,
    })
  }

  function alertUser(text) {
    let snackbar = new Snackbar({
      target: document.body,
      props: {
        duration: 2000,
        text: text,
      }
    });
    snackbar.$set({
      context: snackbar
    });
  }
</script>

<main>
  {#if window.document.body.classList.contains('dark')}
    <Fab on:click={closePage} fontSize="32px" margin="16px" color="#fff" background="#212121" shadow="#212121" icon="arrow_back" position="top-left" />
    <Fab on:click={deleteThis} fontSize="32px" margin="16px" color="#fff" background="#212121" shadow="#212121" icon="delete" position="top-right" />
    <Fab positionType="fixed" on:click={modify} fontSize="32px" color="#000" background="#fff8e1" shadow="#000" icon="edit" />
  {:else}
    <Fab on:click={closePage} fontSize="32px" margin="16px" color="#000" background="#fff8e1" shadow="#fff8e1" icon="arrow_back" position="top-left" />
    <Fab on:click={deleteThis} fontSize="32px" margin="16px" color="#000" background="#fff8e1" shadow="#fff8e1" icon="delete" position="top-right" />
    <Fab positionType="fixed" on:click={modify} fontSize="32px" icon="edit" />
  {/if}
  <div class="body">
    <div class="content" style="max-width: {width_content};">
      {#if status === 2}
        <div class="title">{title}</div>
        <div class="date">{date}</div>
        <div class="text ql-editor">{@html body}</div>
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
    height: 30px;
    margin: 0 auto;
  }

  .content *{
    display: block;
    margin: 0 16px 16px 16px;
  }

  .title{
    word-wrap: break-word;
    font-size: 40px;
  }

  .text{
    height: auto;
    margin-top: 22px !important;
    padding-top: 10px !important;
    margin-bottom: 100px;
    font-size: 20px;
    font-family: Arial;
    line-height: 28.4px;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
  }

  :global(.ql-editor p img){
    display: block;
    max-width: 800px !important;
    margin: 0 auto;
  }

  :global(.ql-syntax){
    background-color: #23241f;
    color: #f8f8f2;
    overflow: visible;
    white-space: pre-wrap;
    margin-bottom: 5px;
    margin-top: 5px;
    padding: 5px 10px;
    border: 1px solid grey;
    border-radius: 3px;
  }
</style>
