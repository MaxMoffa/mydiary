<svelte:head>
	<link href="https://fonts.googleapis.com/css2?family=Beth+Ellen&display=swap" rel="stylesheet">
</svelte:head>

<script>
	import { onMount } from 'svelte';
	import Grid from "svelte-grid";
  import gridHelp from "svelte-grid/build/helper/index.mjs";
  import Header from './Components/Header.svelte';
	import Card from './Components/Card.svelte';
	import ImageElement from './Components/ImageElement.svelte';
	import Fab from './Components/Fab.svelte';
	import ContextualMenu from './Components/ContextualMenu.svelte';
	import Creator from './Pages/Creator.svelte';
	import Viewer from './Pages/Viewer.svelte';
	import Option from './Pages/Option.svelte';
	import Snackbar from './Components/Snackbar.svelte';
	import alertBox from './Components/alertBox.svelte';
	import Autocomplete from './Components/Autocomplete.svelte';

	let refreshing;
	let deferredPrompt = null;
	let context_page = null;

	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault();
		deferredPrompt = e;
	});

	window.addEventListener('popstate', (e) => {
		if(context_page !== null) context_page.$destroy();
	});

	if ('serviceWorker' in navigator) {
		window.addEventListener('load', function() {
			navigator.serviceWorker.register('./sw.js').then(function(registration) {
				console.log('ServiceWorker registration successful');
				registration.addEventListener("updatefound", () => {
					let update = registration.installing;
					update.addEventListener("statechange", () => {
						if(update.state === "installed"){
							if(navigator.serviceWorker.controller){
								let snackbar = new Snackbar({
									target: document.body,
									props: {
										duration: 10000,
										text: "Nuova versione disponibile",
										actionText: "Refresh",
										click: function(){
											update.postMessage({
												action: "skipWaiting"
											});
										}
									}
								});
								snackbar.$set({
						      context: snackbar
						    });
							}
						}
					});
				});
			}, function(err) {
				console.log('ServiceWorker registration failed: ', err);
			});
		});
		navigator.serviceWorker.addEventListener('controllerchange', function () {
			if (refreshing) return;
			window.location.reload();
			refreshing = true;
		});
	}else {
		console.log("Ops! Il tuo browser sembra non essere compatibile con i service worker");
	}

function installPwa() {
 deferredPrompt.prompt();
 deferredPrompt.userChoice.then((choiceResult) => {
	 if (choiceResult.outcome === 'accepted') {
		 console.log('PWA installata correttamente!');
		 window.location.reload();
	 } else {
		 console.log('Ops! PWA non installata...');
	 }
	 deferredPrompt = null;
 });

}

	let theme = localStorage.getItem("theme-mode-diary");
	let isFirstStart = false;
	if(!theme){
		theme = "light";
		localStorage.setItem("theme-mode-diary", "light");
		isFirstStart = true;
	}
	if(theme === "dark") setTheme("#212121");
	else setTheme("#3e2723", false);

	const request = window.indexedDB.open("diary", 1);
	const breakpoints = [
		[1000, 2, 3],
	];
	const texture = [
		"./media/cover/inspiration-geometry.png",
		"./media/cover/diagmonds.png",
		"./media/cover/3px-tile.png",
		"./media/cover/60-lines.png",
		"./media/cover/axiom-pattern.png",
		"./media/cover/basketball.png",
		"./media/cover/cartographer.png",
		"./media/cover/cubes.png",
	];
	const colors = [
		"#b71c1c",
		"#880e4f",
		"#4a148c",
		"#311b92",
		"#1a237e",
		"#0d47a1",
		"#01579b",
		"#006064",
		"#004d40",
		"#1b5e20",
		"#33691e",
		"#827717",
		"#e65100",
		"#bf360c",
		"#3e2723",
	];
	let limit = 10;
	let counter = 0;
	let cursor = null;
	let db = null;
	let items_arr = [];
	let status = 0;
	let id = null;
	let isScrolling = false;
	let scrollTimer;
	let loading_timeout;

	onMount(() => {
		request.onsuccess = (event) => {
			db = event.target.result;
			if(isFirstStart){
				let store = db.transaction(["pages"], "readwrite").objectStore("pages");
				let tutorial = store.put({
					title: "Tutorial 🔥",
		      body: '<p>Welcome to <span class="ql-size-large">My Diary! 🤩</span></p><p>Your first virtual diary, here are some <span style="background-color: rgb(102, 185, 102);">tips and tricks</span> for you in order to better use this app:</p><ul><li><strong>Long press</strong> (or <strong>Right click</strong>) on a note will display a contextual menu</li><li><strong>Single click</strong> on a note will open it in reading mode</li><li>You can <strong>modify/delete</strong> a note both with the contextual menu or the options in the viewer mode</li><li>You can set a <strong>dark theme</strong> in the option menu</li><li>In order to <strong>create a note</strong> you have to access the Creator page by clicking on the button in the bottom</li><li>You can <strong>install this app</strong> by clicking on the button at the top left corner of the home (depends on the browser compatibility)</li></ul><p>For any info you can check my <a href="https://dev.to/maxmoffa" target="_blank" style="background-color: rgb(235, 214, 255);">dev profile</a> or the page of the repository on <a href="https://github.com/MaxMoffa/MyDiary" target="_blank" style="background-color: rgb(255, 255, 204);">Github</a></p><p>If you really like this project you can <a href="https://www.buymeacoffee.com/ABxD3lK" target="_blank" style="background-color: rgb(255, 235, 204);">offer me a coffee</a>, every coffee will be used in order to work on projects like this one💪</p>',
		      date: new Date().toLocaleDateString(),
					color: "#1a237e",
					texture: 7,
				});
				tutorial.onsuccess = function(event) {
					console.log("Tutorial generated");
					refreshList();
				};
				tutorial.onerror = function(event) {
					console.log(event);
					console.log("Ops! There is a problem with the tutorial");
					refreshList();
				};
			}else refreshList();
		}

		request.onerror = (event) => {
			status = 1;
		}

		request.onupgradeneeded = function(event) {
			let db = event.target.result;
			if(db.objectStoreNames.contains("pages")) {
				db.deleteObjectStore("pages");
			}
			var store = db.createObjectStore("pages", {keyPath: "id", autoIncrement: true});
			store.createIndex("title", "title", { unique: false });
			store.createIndex("date", "date", { unique: false });
		};
	});

	function refreshList(info) {
		let query = false;
		if(info){
			query = info.detail.query.toLowerCase();
		}
		status = 0;
		items_arr = [];
		let objectStore = db.transaction(["pages"]).objectStore("pages");
		objectStore.openCursor().onsuccess = function(event) {
			cursor = event.target.result;
			if (cursor) {
				if(!query || cursor.value.title.toLowerCase().includes(query)){
					let item = gridHelp.item({
						w: 1,
						h: 2,
						x: 0,
						y: 0,
						id: cursor.key,
						date: cursor.value.date,
						name: cursor.value.title,
						background: (cursor.value.color ? cursor.value.color : colors.val(counter)),
						texture: (cursor.value.texture ? texture.val(cursor.value.texture) : texture.val(counter)),
						static: true,
						resizable: false,
					});
					let findOutPosition = gridHelp.findSpaceForItem(item, items_arr, 2);
					items_arr = [...[{ ...item, ...findOutPosition }], ...items_arr];
					limit--;
					counter++;
				}
				cursor.continue();
				//if(limit > 0) cursor.continue();
			}else {
				counter = 0;
				if(loading_timeout) clearTimeout(loading_timeout);
				loading_timeout = setTimeout(() => {
					if(limit === 10) status = 3;
					else status = 2;
					limit = 10;
				}, 300);
			}
		};
	}

	function createPage(event) {
		if(event.detail.date === undefined) event.detail.date = new Date().toLocaleDateString();
		let creator = new Creator({
			target: document.body,
			props: {
				db: db,
				id: event.detail.id,
			}
		});

		context_page = creator;
		creator.$set({
			context: creator
		});
		creator.$on("creation", () => {
			refreshList();
		});
		creator.$on("destroy", (event) => {
			viewPage(event);
		});
	}

	function viewPage(event) {
		if(!isScrolling){
			let viewer = new Viewer({
				target: document.body,
				props: {
					id: event.detail.id,
					db: db
				}
			});
			context_page = viewer;
			viewer.$set({
				context: viewer
			});
			viewer.$on("modify", (event) => {
				createPage(event);
			});
			viewer.$on("delete", (event) => {
				destroy(event.detail.id, true);
			});
		}
	}

	function destroy(id, fromViewer) {
		let alert = new alertBox({
			target: document.body,
			props: {}
		});
		alert.$set({
			context: alert
		});
		alert.$on("answer", (event) => {
			if(event.detail.response){
				let objectStore = db.transaction(["pages"], "readwrite").objectStore("pages");
				let request = objectStore.delete(id);
				request.onerror = function(event) {
					console.log(event);
				};
				request.onsuccess = function(event) {
					if(window.history && window.history.pushState && fromViewer) window.history.back();
					refreshList();
				};
			}
		});
	}

	function contextualMenu(event) {
		if(!isScrolling){
			event.preventDefault();
			if('vibrate' in window.navigator) window.navigator.vibrate(100);
			let menu = new ContextualMenu({
				target: document.body,
				props: {
					id: event.detail.id,
					title: event.detail.title
				}
			});
			menu.$set({
				context: menu
			});
			menu.$on("open", (event) => {
				viewPage(event);
			});
			menu.$on("modify", (event) => {
				createPage(event);
			});
			menu.$on("destroy", (event) => {
				destroy(event.detail.id);
			});
		}
		return false;
	}

	function openOption() {
		let option = new Option({
			target: document.body,
			props: {
			}
		});

		context_page = option;
		option.$set({
			context: option
		});
		option.$on("changeTheme", (event) => {
			theme = event.detail.theme;
			if(theme === "dark") setTheme("#212121", false);
			else setTheme("#3e2723", false);
		});
	}

	function setTheme(color, changeTheme = true) {
		if(changeTheme) window.document.body.classList.toggle("dark");
		let theme = document.querySelector("meta[name=theme-color]");
		let ms_theme = document.querySelector("meta[name=msapplication-TileColor]");
		theme.setAttribute("content", color);
		ms_theme.setAttribute("content", color);
	}

	document.body.addEventListener('scroll', function ( event ) {
		isScrolling = true;
		window.clearTimeout( scrollTimer );
		scrollTimer = setTimeout(function() {
			isScrolling = false;
			console.log(isScrolling);
		}, 500);
	}, false);

	Array.prototype.val = function (p) {
		if(typeof p === "number"){
			while(p >= this.length) p -= this.length;
			return this[p];
		}
		return undefined;
	};
</script>

<main>
	<Header />
	<Autocomplete on:change={refreshList} />
	{#if status === 2}
		<Grid useTransform {breakpoints} {items_arr} bind:items={items_arr} cols={4} let:item rowHeight={80} gap={5}>
			<Card title={item.name} date={item.date} id={item.id} background={item.background} texture={item.texture} on:click={viewPage} on:longpress={contextualMenu} on:contextmenu={contextualMenu} />
		</Grid>
	{:else if status === 0}
		<ImageElement class="loading" src="./media/image/loading.gif" alt="Loading..." />
	{:else if status === 1}
		<ImageElement text="Ops! There is a problem" width="256px" class="loading" src="./media/image/error.gif" alt="Error..." />
	{:else if status === 3}
		<ImageElement class="loading" text="Write down two lines" src="./media/image/empty.gif" alt="No data..." />
	{/if}
	{#if theme === "dark"}
		{#if deferredPrompt !== null}
			<Fab fontSize="32px" margin="6px" color="#fff" background="#212121" shadow="#212121" icon="get_app" position="top-left" on:click={installPwa} />
		{/if}
    <Fab positionType="fixed" on:click={createPage} fontSize="32px" color="#000" background="#fff8e1" shadow="#000" icon="create" />
    <Fab fontSize="32px" margin="6px" color="#fff" background="#212121" shadow="#212121" icon="settings" position="top-right" on:click={openOption} />
  {:else}
		{#if deferredPrompt !== null}
			<Fab fontSize="32px" margin="6px" color="#000" background="#fff8e1" shadow="#fff8e1" icon="get_app" position="top-left" on:click={installPwa} />
		{/if}
    <Fab positionType="fixed" on:click={createPage} fontSize="32px" icon="create" />
    <Fab fontSize="32px" margin="6px" color="#000" background="#fff8e1" shadow="#fff8e1" icon="settings" position="top-right" on:click={openOption} />
  {/if}
</main>

<style>

	*{
		-webkit-tap-highlight-color: transparent;
	}

	:global(html){
		overflow: hidden;
	}

	:global(body){
		overflow-x: hidden !important;
		overflow-y: auto;
		background-color: #fff8e1;
		color: #263238;
		scrollbar-width: thin;
    scrollbar-color: #212121 #fff8e1;
	}

	:global(::-webkit-scrollbar){
    width: 8px;
  }

  :global(::-webkit-scrollbar-thumb){
    background-color: #212121;
    border-right: 1px solid #fff8e1;
  }

  :global(::-webkit-scrollbar-thumb):hover{
    background-color: grey;
  }

	:global(body.dark) :global(::-webkit-scrollbar-thumb){
		background-color: #fff8e1;
		border-right: 1px solid #212121;
	}

	:global(.svlt-grid-container){
		margin-bottom: 100px;
	}

	:global(.svlt-grid-item){
    touch-action: manipulation !important;
  }

	:global(body.dark){
		background-color: #212121;
		color: #fff;
		scrollbar-color: #fff8e1 #212121;
	}

	main{
		width: 100%;
		max-width: 1000px;
		height: auto;
		margin: 0 auto;
	}

</style>
