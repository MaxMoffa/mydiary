<script>
  import Quill from 'quill';
  import {onMount, onDestroy, createEventDispatcher} from 'svelte';
  import Fab from '../Components/Fab.svelte';
  import Snackbar from '../Components/Snackbar.svelte';
  import alertBox from '../Components/alertBox.svelte';

  const dispatch = createEventDispatcher();

  document.body.style.overflow = "hidden";

  var toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block'],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'size': ['small', false, 'large', 'huge'] }],
  [{ 'background': [] }],
  [{ 'align': [] }],
  ['clean']
];

  export let db = null;
  export let context = null;
  export let id = null;
  export let date = new Date().toLocaleDateString();

  let editor = null;
  let title = "";
  let changes = false;

  onMount(() => {
    editor = new Quill('#editor-creator', {
      modules: {
        toolbar: toolbarOptions
      },
      placeholder: 'Note',
      theme: 'snow'
    });
    editor.on('text-change', function(delta, oldDelta, source) {
      if (source == 'user') {
        changes = true;
      }
    });

    if(db !== null && id !== null){
      let objectStore = db.transaction(["pages"], "readwrite").objectStore("pages");
      let request = objectStore.get(id);
      request.onerror = function(event) {
        console.log(event);
        alertUser("Ops! There is a problem");
      };
      request.onsuccess = function(event) {
        let data = event.target.result;
        if(data !== undefined){
          title = data.title;
          date = data.date;
          id = data.id;
          document.querySelector(".ql-editor").innerHTML = data.body;
        }
      };
    }
  });

  onDestroy(() => {
    if(id){
      dispatch("destroy", {
        id: id
      });
    }
  });

  function closePage() {
    if(changes){
      let alert = new alertBox({
        target: document.body,
        props: {}
      });
      alert.$set({
        context: alert
      });
      alert.$on("answer", (event) => {
        if(event.detail.response){
          if(context) context.$destroy();
          document.body.style.overflow = "auto";
        }
      });
    }else {
      if(context) context.$destroy();
      document.body.style.overflow = "auto";
    }
  }

  function saveNote() {
    let text = document.querySelector(".ql-editor").innerHTML;
    if(title === "") {
      alertUser("Hey! You need a title...");
      return;
    }
    if(text === "<p><br></p>"){
      alertUser("Hey! You need a body...");
      return;
    }
    if(db === null || editor === null) return;
    let item = {
      title: title,
      body: text,
      date: date,
    };
    if(id !== null) item.id = id;
    let objectStore = db.transaction(["pages"], "readwrite").objectStore("pages");
    let request = objectStore.put(item);
    request.onsuccess = function(event) {
      dispatch("creation", {});
      if(context) context.$destroy();
    };
    request.onerror = function(event) {
      console.log(event);
      alertUser("Ops! There is a problem");
    };
  }

  function scollEvent(event) {
    if(event.target.scrollTop > 180) document.querySelector(".ql-toolbar").style.position = "fixed";
    else document.querySelector(".ql-toolbar").style.position = "static";
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

<main on:scroll={scollEvent}>
  {#if window.document.body.classList.contains('dark')}
    <Fab on:click={closePage} fontSize="32px" margin="16px" color="#fff" background="#212121" shadow="#212121" icon="arrow_back" position="top-left" />
    <Fab on:click={saveNote} fontSize="32px" margin="16px" color="#fff" background="#212121" shadow="#212121" icon="save" position="top-right" />
  {:else}
    <Fab on:click={closePage} fontSize="32px" margin="16px" color="#000" background="#fff8e1" shadow="#fff8e1" icon="arrow_back" position="top-left" />
    <Fab on:click={saveNote} fontSize="32px" margin="16px" color="#000" background="#fff8e1" shadow="#fff8e1" icon="save" position="top-right" />
  {/if}
  <div class="body">
    <div class="content">
      <input bind:value={title} class="title" type="text" placeholder="Title" maxlength="60">
      <div id="editor-creator" class="text"></div>
    </div>
  </div>
</main>

<style>

  *{
      outline: 0;
  }

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
		color: #fff !important;
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
    margin-bottom: 16px;
  }

  .title{
    width: 100%;
    font-size: 40px;

    background-color: transparent;
    border: 0;
  }

  :global(body.dark) .title{
		color: #fff;
	}

  .text{
    margin: 0 16px;
    height: auto;
    min-height: fit-content;
    font-size: 20px;
    border: 0 !important;
  }

  :global(body.dark) .title{
		color: #fff;
	}

  :global(.ql-toolbar){
    top: 5px;
    margin: 8px 16px;
    border-radius: 20px;
    border-color: #fff;
    background-color: #fff8e1 !important;
    z-index: 4 !important;
  }

  :global(body.dark) :global(.ql-toolbar){
    background-color: #212121 !important;
  }

  :global(body.dark) :global(.ql-editor)::before {
    color: grey !important;
  }
</style>
