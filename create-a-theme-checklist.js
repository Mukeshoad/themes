const theme = process.argv[ 2 ];

if ( ! theme ) {
	console.error( '\x1b[41m', 'You must specify a theme!' );
	return;
}

/**
 * We need a Github personal access token to continue.
 *
 * The most robust way is to add an environment variable to your ~/.bashrc or ~/.zshrc depending on the shell you're using. To check which shell you're using, run `echo $SHELL` in a terminal.
 *
 * The environment variable in your shell rc should look like this:
 * export THEME_GITHUB_TOKEN=<insert your token>
 *
 * Alternatively, you can replace `PUT YOUR ACCESS TOKEN HERE` with the actual access token value.
 */
const authToken =
	process.env.THEME_GITHUB_TOKEN || `PUT YOUR ACCESS TOKEN HERE`;

if ( authToken === 'PUT YOUR ACCESS TOKEN HERE' ) {
	console.error(
		'\x1b[41m',
		'You must set THEME_GITHUB_TOKEN before running this script.'
	);
	process.exitCode = 1;
	return;
}

async function githubRequest( path, options = {} ) {
	const response = await fetch( `https://api.github.com${ path }`, {
		...options,
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${ authToken }`,
			'Content-Type': 'application/json',
			'User-Agent': 'themes-checklist-script',
			...options.headers,
		},
	} );

	if ( ! response.ok ) {
		const errorBody = await response.text();
		throw new Error(
			`GitHub request failed (${ response.status }): ${ errorBody }`
		);
	}

	return {
		data: await response.json(),
	};
}

function sleep( ms ) {
	return new Promise( ( resolve ) => {
		setTimeout( resolve, ms );
	} );
}

async function createLabel() {
	try {
		await sleep( 1000 );
		return await githubRequest( '/repos/Automattic/themes/labels', {
			method: 'POST',
			body: JSON.stringify( {
				name: '[Theme] ' + theme,
				color: 'c1f4a1',
				description: 'Automatically generated label for ' + theme + '.',
			} ),
		} );
	} catch ( error ) {
		console.log( error );
	}
}

async function createMilestone() {
	try {
		await sleep( 1000 );
		return await githubRequest( '/repos/Automattic/themes/milestones', {
			method: 'POST',
			body: JSON.stringify( {
				title: theme,
				description:
					'Automatically generated milestone for ' + theme + '.',
			} ),
		} );
	} catch ( error ) {
		console.error( '\x1b[41m', 'Milestone already created.' );
	}
}

async function createIssues( milestoneNumber ) {
	const issues = [
		'Block Patterns',
		'Create Base Theme',
		'Styles: Colors',
		'Styles: Typography — Fonts & Weights',
		'Styles: Typography — Sizes & Line Height',
		'Styles: Links',
		'Styles: Buttons',
		'Styles: Layout',
		'Styles: Comments',
		'Styles: Navigation',
		'Styles: Quote',
		'Styles: Variations',
		'Templates: Search, Category, Tag',
		'Templates: 404',
		'Templates: Single',
		'Templates: Page',
		'Templates: Index',
		'Templates: Header template part',
		'Templates: Footer template part',
		'Pre-launch: Screenshot, readme.txt & description',
		'Pre-launch: Demo Site',
		'Pre-launch: Showcase Entry',
		'Pre-launch: Headstart Annotation',
	];
	issues.forEach( async ( issue ) => {
		try {
			await sleep( 1000 );
			return await githubRequest( '/repos/Automattic/themes/issues', {
				method: 'POST',
				body: JSON.stringify( {
					title: theme + ': ' + issue,
					labels: [ '[Theme] ' + theme ],
					milestone: milestoneNumber,
				} ),
			} );
			// If you want to automatically add this to the Theme Dev Board, uncomment this.
			// .then( ( issueData ) => {
			// 	addIssueToProject( issueData );
			// } );
		} catch ( error ) {
			console.log( error );
		}
	} );
}

async function addIssueToProject( issueData ) {
	try {
		await sleep( 1000 );
		return await githubRequest( '/projects/columns/11021541/cards', {
			method: 'POST',
			headers: {
				Accept: 'application/vnd.github.inertia-preview+json',
			},
			body: JSON.stringify( {
				note: null,
				content_id: issueData.data.id,
				content_url: issueData.data.url,
				content_type: 'Issue',
			} ),
		} );
	} catch ( error ) {
		console.log( error );
	}
}

createLabel().then( () => {
	createMilestone().then( ( milestoneData ) => {
		if ( ! milestoneData?.data?.number ) {
			process.exitCode = 1;
			return;
		}

		const milestoneNumber = milestoneData.data.number;
		createIssues( milestoneNumber );
	} );
} );
