<script>
  import {createEventDispatcher} from 'svelte';
  import ImageElement from '../Components/ImageElement.svelte';
  import Fab from '../Components/Fab.svelte';
  import Button from '../Components/Button.svelte';

  const dispatch = createEventDispatcher();

  document.body.style.overflow = "hidden";

  export let context = null;
  let theme = localStorage.getItem("theme-mode-diary");
  let width_content = "600px";
  if(localStorage.getItem("content-width-diary"))
    width_content = localStorage.getItem("content-width-diary");
  let version = "...";
  if ('serviceWorker' in navigator) {
    if(navigator.serviceWorker.controller){
      navigator.serviceWorker.addEventListener('message', event => {
        version = event.data.version;
      });
      navigator.serviceWorker.controller.postMessage({
        action: "getVersion"
      });
    }
  }

  if(window.history && window.history.pushState) window.history.pushState(null, null, './#option');

  function closePage() {
    if(window.history && window.history.pushState) window.history.back();
    else context.$destroy();
    document.body.style.overflow = "auto";
  }

  function changeTheme(e) {
		window.document.body.classList.toggle("dark");
    theme = e.target.value;
    dispatch("changeTheme", {
      theme: theme
    })
    localStorage.setItem("theme-mode-diary", theme);
  }

  function changeWidth(e) {
    width_content = e.target.value;
    localStorage.setItem("content-width-diary", e.target.value);
  }

  function openGithub() {
    window.open("https://github.com/MaxMoffa/MyDiary");
  }

  function openAuthor() {
    window.open("https://dev.to/maxmoffa");
  }

  function openDonation() {
    window.open("https://www.buymeacoffee.com/ABxD3lK");
  }
</script>

<main>
  {#if theme === "dark"}
    <Fab on:click={closePage} fontSize="32px" margin="16px" color="#fff" background="#212121" shadow="#212121" icon="arrow_back" position="top-left" />
  {:else}
    <Fab on:click={closePage} fontSize="32px" margin="16px" color="#000" background="#fff8e1" shadow="#fff8e1" icon="arrow_back" position="top-left" />
  {/if}
  <div class="body">
    <div class="content">
      <ImageElement src="./media/icons-web-app/ms-icon-310x310.png" text="Settings" />
      <div class="options">
        <div class="option">
          <label for="theme-selector">Theme</label>
          <select on:change={changeTheme} bind:value={theme}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        {#if window.innerWidth > 600}
        <div class="option">
          <label for="width-selector">Content width (only for large screens)</label>
          <select on:change={changeWidth} bind:value={width_content}>
            <option value="100%">Large</option>
            <option value="800px">Medium</option>
            <option value="600px">Small</option>
          </select>
        </div>
        {/if}
        <div class="option">
          <label for="theme-selector">Version</label>
          <div>{version}</div>
        </div>
        <div class="option">
          <label for="theme-selector">Author</label>
          <div>
            <Button title="@maxmoffa" background="#4a148c" on:click={openAuthor} />
          </div>
        </div>
        <div class="option">
          <label for="theme-selector">Github page</label>
          <div>
            <Button title="Open on Github" background="#1b5e20" on:click={openGithub} />
          </div>
        </div>
        <div class="option">
          <label for="theme-selector">Donations</label>
          <div>
            <Button title="Buy me a coffee ☕" background="#ff813f" on:click={openDonation} />
          </div>
        </div>
      </div>
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
    margin-bottom: 64px;
  }

  .option{
    width: 100%;
    height: auto;
    margin-top: 32px;
  }

  label{
    font-weight: 700;
  }

  select{
    cursor: pointer;
    background: transparent;
  }

  :global(body.dark) select{
    color: #fff;
  }

  option{
    background-color: #fff8e1;
  }

  :global(body.dark) option{
    background-color: #212121;
  }
</style>
