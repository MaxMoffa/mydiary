<svelte:head>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons"rel="stylesheet">
</svelte:head>

<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let icon = "face";
  export let background = "#000";
  export let shadow = "#bdbdbd";
  export let color = "#fff";
  export let margin = "32px";
  export let fontSize = "24px";
  export let positionType = "absolute";
  export let position = "bottom-right";
  let top = "auto";
  let left = "auto";
  let right = "auto";
  let bottom = "auto";

  switch (position) {
    case "top-left": {
      top = margin;
      left = margin;
      break;
    }
    case "bottom-left": {
      bottom = margin;
      left = margin;
      break;
    }
    case "top-right": {
      top = margin;
      right = margin;
      break;
    }
    default: {
      bottom = margin;
      right = margin;
      break;
    }
  }

  function click() {
    dispatch("click", {});
  }
</script>

<main on:click={click} style="position: {positionType} !important; background-color: {background}; box-shadow: 0 3px 6px {shadow};top: {top};bottom: {bottom};left: {left};right: {right};">
  <i style="color: {color}; font-size: {fontSize}" class="material-icons">{icon}</i>
</main>

<style>

  *{
    -webkit-tap-highlight-color: transparent;
  }

  main{
    width: fit-content;
    height: fit-content;

    border-radius: 50%;
    cursor: pointer;
    transition: 0.1s background;
    z-index: 1;
  }

  main:active{
    background-color: rgba(0, 0, 0, 0.4) !important;
    transition: 0.1s background;
  }

  :global(body.dark) main:active{
    background-color: #424242 !important;
    transition: 0.1s background;
  }

  main i{
    margin: 16px;
    user-select: none;
  }

  @media print {
	  main {
	    display: none;
	  }
	}
</style>
