<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let title = "Hello world!";
  export let date = new Date().toLocaleDateString();
  export let id = -1;
  export let background = "#0097a7";
  export let color = "#fff";
  export let texture = "";
  let opacity = 1;
  let interval;
  let isClick = true;

  window.oncontextmenu = function (e){
    if(e.target.classList.contains("card-element") || e.target.classList.contains("contextmenu-element"))
      e.preventDefault();
  }

  function click() {
    dispatch("click", {
      id: id
    });
  }

  function startClicking(event){
    //event.preventDefault();
    opacity = 0.6;
    interval = setTimeout(function () {
      isClick = false;
      opacity = 1;
      setTimeout(() => {
        isClick = true;
      }, 1000);
      dispatch("longpress",{
        id: id,
        title: title
      });
    }, 500);
  }

  function stopClicking(event) {
    //event.preventDefault();
    opacity = 1;
    clearTimeout(interval);
    if(isClick){
      if(isRightClick(event)) dispatch("contextmenu", {id:id, title: title});
      else click();
    }
    isClick = true;
  }

  function isRightClick(e) {
    e = e || window.event;
    if ("which" in e)
        return (e.which == 3);
    else if ("button" in e)
        return (e.button == 2);
  }

</script>

<main class="card-element" on:touchend={stopClicking} on:touchstart={startClicking} on:mouseup={stopClicking} on:mousedown={startClicking} style="background-color: {background}; background-image: url('{texture}'); color: {color}; opacity: {opacity}">
  <div class="card-element content">
    <div class="title card-element">{title}</div>
    <div class="date card-element">{date}</div>
  </div>
</main>

<style>

  main{
    display: flex;
    width: 100% !important;
    height: 100%;
    border-radius: 6px;

    align-items:flex-end;
    cursor: pointer;
    box-shadow: 0 3px 6px #bdbdbd;
    transition: 0.3s opacity !important;
  }

  :global(body.dark) main{
    box-shadow: 0 3px 6px #000;
  }

  main div{
    margin-left: 6px;
    margin-right: 6px;
    width: 100%;
  }

  .title{
    width: auto;
    word-wrap: break-word;
    font-size: 20px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .date{
    margin-bottom: 16px;
    font-size: 10px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
</style>
