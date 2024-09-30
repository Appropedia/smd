const SMD = {

	init: function () {

		// Fetch the data and finish the main page
		Promise.all( [
			SMD.fetchTissues(),
			SMD.fetchMaterials(),
			SMD.fetchSimulations()
		] ).then( SMD.finishMainPage );

		// Get the bookmarks from the cookies and update the button
		const bookmarks = SMD.getCookie( 'smd-bookmarks' );
		if ( bookmarks ) {
			SMD.bookmarks = JSON.parse( bookmarks );
		}
		SMD.updateBookmarksButton();

		// Bind events
		const tissuesTab = document.getElementById( 'smd-tissues-tab' );
		tissuesTab.onclick = SMD.switchTab;
		const materialsTab = document.getElementById( 'smd-materials-tab' );
		materialsTab.onclick = SMD.switchTab;
		const simulationsTab = document.getElementById( 'smd-simulations-tab' );
		simulationsTab.onclick = SMD.switchTab;
		const bookmarksButton = document.getElementById( 'smd-bookmarks-button' );
		bookmarksButton.onclick = SMD.openBookmarksDialog;

		// Close modal dialogs when clicking outside or on the close button
		const bookmarksDialog = document.getElementById( 'smd-bookmarks-dialog' );
		bookmarksDialog.onclick = bookmarksDialog.close;
		const bookmarksDialogContent = document.getElementById( 'smd-bookmarks-dialog-content' );
		bookmarksDialogContent.onclick = ( event ) => event.stopPropagation();
		const bookmarksDialogCloseButton = document.getElementById( 'smd-bookmarks-dialog-close-button' );
		bookmarksDialogCloseButton.onclick = () => bookmarksDialog.close();
		const tissueDialog = document.getElementById( 'smd-tissue-dialog' );
		tissueDialog.onclick = tissueDialog.close;
		const tissueDialogContent = document.getElementById( 'smd-tissue-dialog-content' );
		tissueDialogContent.onclick = ( event ) => event.stopPropagation();
	},

	finishMainPage: function () {
		const tissuesList = document.getElementById( 'smd-tissues-list' );
		tissuesList.innerHTML = '';
		for ( const tissue of SMD.tissues ) {
			const template = document.getElementById( 'smd-explore-list-item' );
			const item = template.content.cloneNode( true ).children[0];
			const link = item.querySelector( 'a' );
			link.textContent = tissue.text;
			link.onclick = SMD.openTissueDialog;
			SMD.finishStar( item, tissue );
			tissuesList.append( item );
		}

		const materialsList = document.getElementById( 'smd-materials-list' );
		for ( const material of SMD.materials ) {
			const template = document.getElementById( 'smd-explore-list-item' );
			const item = template.content.cloneNode( true ).children[0];
			const link = item.querySelector( 'a' );
			link.textContent = material.text;
			link.href = material.href;
			SMD.finishStar( item, material );
			materialsList.append( item );
		}

		const simulationsTable = document.getElementById( 'smd-simulations-table' );
		const simulationsTableBody = simulationsTable.querySelector( 'tbody' );
		for ( const simulation of SMD.simulations ) {
			const template = document.getElementById( 'smd-simulations-row' );
			const row = template.content.cloneNode( true ).children[0];
			row.children[0].innerHTML = simulation.tissue.join( '<br>' );
			row.children[1].innerHTML = simulation.material.join( '<br>' );
			row.children[2].innerHTML = simulation.developer.join( '<br>' );
			row.children[3].querySelector( 'a' ).href = simulation.href;
			SMD.finishStar( row, simulation );
			simulationsTableBody.append( row );
		}
	},

	finishStar: function ( element, data ) {
		const star = element.querySelector( '.smd-star' );
		const index = SMD.bookmarks.findIndex( bookmark => bookmark.href === data.href );
		star.innerHTML = index === -1 ? '&#9734;' : '&#9733;';
		star.title = index === -1 ? 'Click to bookmark this ' + data.type : 'Click to remove this bookmark';
		star.dataset.href = data.href;
		star.dataset.text = data.text;
		star.dataset.type = data.type;
		star.onclick = SMD.toggleBookmark;
	},

	switchTab: function ( event ) {
		const tab = event.target;

		const tissuesTab = document.getElementById( 'smd-tissues-tab' );
		tissuesTab.className = tab.id === 'smd-tissues-tab' ? 'active' : '';
		const materialsTab = document.getElementById( 'smd-materials-tab' );
		materialsTab.className = tab.id === 'smd-materials-tab' ? 'active' : '';
		const simulationsTab = document.getElementById( 'smd-simulations-tab' );
		simulationsTab.className = tab.id === 'smd-simulations-tab' ? 'active' : '';

		const tissuesList = document.getElementById( 'smd-tissues-list' );
		tissuesList.style.display = tab.id === 'smd-tissues-tab' ? 'block' : 'none';
		const materialsList = document.getElementById( 'smd-materials-list' );
		materialsList.style.display = tab.id === 'smd-materials-tab' ? 'block' : 'none';
		const simulationsTable = document.getElementById( 'smd-simulations-table' );
		simulationsTable.style.display = tab.id === 'smd-simulations-tab' ? 'block' : 'none';
	},

	toggleBookmark: function ( event ) {

		// Toggle the star
		const star = event.target;
		const index = SMD.bookmarks.findIndex( bookmark => bookmark.href === star.dataset.href );
		if ( index === -1 ) {
			const bookmark = {
				type: star.dataset.type,
				text: star.dataset.text,
				href: star.dataset.href
			};
			SMD.bookmarks.push( bookmark );
			star.innerHTML = '&#9733;';
			star.title = 'Click to remove this bookmark';
		} else {
			SMD.bookmarks.splice( index, 1 );
			star.innerHTML = '&#9734;';
			star.title = 'Click to bookmark this ' + star.dataset.type;
		}

		// Update the cookie
		const bookmarks = JSON.stringify( SMD.bookmarks );
		document.cookie = 'smd-bookmarks=' + bookmarks + '; path=/';

		// Update the button
		SMD.updateBookmarksButton();
	},

	updateBookmarksButton: function () {
		const count = SMD.bookmarks.length;
		const text = document.getElementById( 'smd-bookmarks-button-text' );
		text.textContent = count + ' bookmark' + ( count === 1 ? '' : 's' );
	},

	openBookmarksDialog: function () {

		// Show the dialog
		const dialog = document.getElementById( 'smd-bookmarks-dialog' );
		dialog.showModal();

		// First make sure the lists are empty
		const tissuesList = document.getElementById( 'smd-bookmarks-dialog-tissues-list' );
		const materialsList = document.getElementById( 'smd-bookmarks-dialog-materials-list' );
		const simulationsList = document.getElementById( 'smd-bookmarks-dialog-simulations-list' );
		tissuesList.textContent = '';
		materialsList.textContent = '';
		simulationsList.textContent = '';

		// Then populate them
		for ( const bookmark of SMD.bookmarks ) {
			const template = document.getElementById( 'smd-explore-list-item' );
			const item = template.content.cloneNode( true ).children[0];
			const link = item.querySelector( 'a' );
			link.textContent = bookmark.text;
			link.href = bookmark.href;
			SMD.finishStar( item, bookmark );
			if ( bookmark.type === 'tissue' ) {
				tissuesList.append( item );
			}
			if ( bookmark.type === 'material' ) {
				materialsList.append( item );
			}
			if ( bookmark.type === 'simulation' ) {
				simulationsList.append( item );
			}
		}

		if ( tissuesList.childElementCount === 0 ) {
			tissuesList.textContent = 'No tissues bookmarked yet.';
		}
		if ( materialsList.childElementCount === 0 ) {
			materialsList.textContent = 'No materials bookmarked yet.';
		}
		if ( simulationsList.childElementCount === 0 ) {
			simulationsList.textContent = 'No simulations bookmarked yet.';
		}
	},

	openTissueDialog: function ( event ) {
		const tissueName = event.target.textContent;

		// Show the dialog
		const dialog = document.getElementById( 'smd-tissue-dialog' );
		dialog.showModal();

		// Remove any previous content
		const content = document.getElementById( 'smd-tissue-dialog-content' );
		content.textContent = 'Loading...';

		// Fetch the rest of the data and then finish the dialog
		Promise.all( [
			SMD.fetchTissue( tissueName ),
			SMD.fetchTissueSimulations( tissueName )
		] ).then( function ( data ) {
			const tissue = data[0];
			const simulations = data[1];

			// Clone the template and add it to the dialog
			const template = document.getElementById( 'smd-tissue-dialog-template' );
			const templateContent = template.content.cloneNode( true );
			content.textContent = '';
			content.append( templateContent );

			// Bind the close button
			const button = dialog.querySelector( 'button' );
			button.onclick = () => dialog.close();

			// Finish the main heading
			const heading = dialog.querySelector( 'h2' );
			heading.textContent = 'Tissue: ' + tissue.name;

			// Finish the image
			const image = dialog.querySelector( 'img' );
			if ( tissue.image ) {
				image.src = tissue.image.source;
				image.width = tissue.image.width;
				image.height = tissue.image.height;
			} else {
				image.remove();
			}

			// Finish the about section
			const about = dialog.querySelector( 'p' );
			if ( tissue.about ) {
				about.textContent = tissue.about;
			} else {
				about.remove();
			}

			// Finish the simulations section
			const list = dialog.querySelector( 'ul' );
			if ( simulations.length > 0 ) {
				list.textContent = ''; // Empty the list
				for ( const simulation of simulations ) {
					const template = document.getElementById( 'smd-explore-list-item' );
					const item = template.content.cloneNode( true ).children[0];
					const link = item.querySelector( 'a' );
					link.textContent = simulation.printouts['SMD material'].join( ' + ' );
					link.href = simulation.href;
					SMD.finishStar( item, simulation );
					list.append( item );
				}
				const radar = dialog.querySelector( 'canvas' );
				SMD.updateTissueRadar( radar, simulations );
			} else {
				list.textContent = 'No simulations for this tissue yet.';
			}
		} );
	},

	updateTissueRadar: function ( radar, simulations ) {
		let visual = 0;
		let tactile = 0;
		let manipulation = 0;
		let auditory = 0;
		let olfactory = 0;
		for ( const simulation of simulations ) {
			if ( simulation.printouts['SMD visual'][0] ) {
				visual++;
			}
			if ( simulation.printouts['SMD tactile'][0] ) {
				tactile++;
			}
			if ( simulation.printouts['SMD manipulation'][0] ) {
				manipulation++;
			}
			if ( simulation.printouts['SMD auditory'][0] ) {
				auditory++;
			}
			if ( simulation.printouts['SMD olfactory'][0] ) {
				olfactory++;
			}
		}
		if ( visual + tactile + manipulation + auditory + olfactory > 0 ) {
			new Chart( radar, {
				type: 'radar',
				data: {
					labels: [ 'Visual', 'Tactile', 'Manipulation', 'Auditory', 'Olfactory' ],
					datasets: [ {
						data: [ visual, tactile, manipulation, auditory, olfactory ]
					} ],
				},
				options: {
					responsive: false,
					scales: {
						r: {
							ticks: {
								stepSize: 1
							}
						}
					},
					plugins: {
						legend: {
							display: false
						}
					}
				}
			} );
		} else {
			radar.remove();
		}
	},

	fetchTissues: function () {
		const params = new URLSearchParams( {
			origin: '*',
			format: 'json',
			formatversion: 2,
			action: 'query',
			generator: 'categorymembers',
			gcmtitle: 'Category:SMD tissues',
			gcmlimit: 'max',
			prop: 'info',
			inprop: 'url'
		} );
		const url = 'https://www.appropedia.org/w/api.php?' + params.toString();
		return fetch( url ).then( response => response.json() ).then( function ( response ) {
			const results = response.query.pages;
			const tissues = [];
			for ( const result of results ) {
				const tissue = {
					type: 'tissue',
					href: result.fullurl,
					text: result.title.replace( 'SMD/Tissues/', '' )
				}
				tissues.push( tissue );
			}
			// Sort alphabetically by text
			tissues.sort( function ( a, b ) {
				return ( a.text < b.text ) ? -1 : ( a.text > b.text ) ? 1 : 0;
			} );
			SMD.tissues = tissues;
		} );
	},
	
	fetchMaterials: function () {
		const params = new URLSearchParams( {
			origin: '*',
			format: 'json',
			formatversion: 2,
			action: 'query',
			generator: 'categorymembers',
			gcmtitle: 'Category:SMD materials',
			gcmlimit: 'max',
			prop: 'info',
			inprop: 'url'
		} );
		const url = 'https://www.appropedia.org/w/api.php?' + params.toString();
		return fetch( url ).then( response => response.json() ).then( function ( response ) {
			const results = response.query.pages;
			const materials = [];
			for ( const result of results ) {
				const material = {
					type: 'material',
					href: result.fullurl,
					text: result.title.replace( 'SMD/Materials/', '' )
				};
				materials.push( material );
			}
			// Sort alphabetically by text
			materials.sort( function ( a, b ) {
				return ( a.text < b.text ) ? -1 : ( a.text > b.text ) ? 1 : 0;
			} );
			SMD.materials = materials;
		} );
	},

	fetchSimulations: function () {
		const conditions = [
			'Category:SMD simulations',
			'SMD reviewed::true'
		];
		const printouts = [
			'SMD tissue',
			'SMD material',
			'SMD developer'
		];
		const params = new URLSearchParams( {
			origin: '*',
			format: 'json',
			action: 'askargs',
			conditions: conditions.join( '|' ),
			printouts: printouts.join( '|' )
		} );
		const url = 'https://www.appropedia.org/w/api.php?' + params.toString();
		return fetch( url ).then( response => response.json() ).then( function ( response ) {
			const results = response.query.results;
			const simulations = [];
			for ( const [ key, result ] of Object.entries( results ) ) {
				const simulation = {
					type: 'simulation',
					href: result.fullurl,
					text: result.displaytitle,
					tissue: result.printouts['SMD tissue'],
					material: result.printouts['SMD material'],
					developer: result.printouts['SMD developer']
				}
				simulations.push( simulation );
			}
			// Sort alphabetically by tissue
			simulations.sort( function ( a, b ) {
				return ( a.tissue < b.tissue ) ? -1 : ( a.tissue > b.tissue ) ? 1 : 0;
			} );
			SMD.simulations = simulations;
		} );
	},

	fetchTissue: function ( tissueName ) {
		const params = new URLSearchParams( {
			origin: '*',
			format: 'json',
			formatversion: 2,
			action: 'query',
			titles: 'SMD/Tissues/' + tissueName,
			prop: 'info|pageimages|extracts',
			inprop: 'url',
			pithumbsize: 300,
			explaintext: true,
			exintro: true
		} );
		const url = 'https://www.appropedia.org/w/api.php?' + params.toString();
		return fetch( url ).then( response => response.json() ).then( function ( response ) {
			const page = response.query.pages[0];
			const tissue = {
				name: tissueName,
				href: page.fullurl,
				title: page.title,
				image: page.thumbnail,
				about: page.extract
			};
			return tissue;
		} );
	},

	fetchTissueSimulations: function ( tissue ) {
		const conditions = [
			'Category:SMD simulations',
			'SMD tissue::' + tissue,
			'SMD reviewed::true'
		];
		const printouts = [
			'SMD material',
			'SMD visual',
			'SMD tactile',
			'SMD manipulation',
			'SMD auditory',
			'SMD olfactory'
		];
		const params = new URLSearchParams( {
			origin: '*',
			format: 'json',
			action: 'askargs',
			conditions: conditions.join( '|' ),
			printouts: printouts.join( '|' )
		} ).toString();
		return fetch( 'https://www.appropedia.org/w/api.php?' + params ).then( response => response.json() ).then( function ( response ) {
			const results = response.query.results;
			const simulations = [];
			for ( const [ key, result ] of Object.entries( results ) ) {
				const simulation = {
					type: 'simulation',
					text: result.displaytitle,
					href: result.fullurl,
					printouts: result.printouts
				};
				simulations.push( simulation );
			}
			return simulations;
		} );
	},

	/**
	 * Helper method to get a cookie
	 */
	getCookie: function ( name ) {
		const regex = new RegExp( '(^| )' + name + '=([^;]+)' );
		const match = document.cookie.match( regex );
		if ( match ) {
			return match[2];
		}
	}
}

window.onload = SMD.init;