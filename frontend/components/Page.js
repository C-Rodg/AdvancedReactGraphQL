// Libs
import React, { Component } from 'react';

// Comps
import Header from './Header';
import Meta from './Meta';

class Page extends Component {
	render() {
		return (
			<div>
				<Meta />
				<Header />
				{this.props.children}
			</div>
		);
	}
}
export default Page;
