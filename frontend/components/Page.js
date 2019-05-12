// Libs
import React, { Component } from 'react';
import styled from 'styled-components';
// Comps
import Header from './Header';
import Meta from './Meta';

// Styles
const StyledPage = styled.div`
	background: #fff;
	color: #000;
`;

const Inner = styled.div`
	max-width: 1000px;
	margin: 0 auto;
	padding: 2rem;
`;

class Page extends Component {
	render() {
		return (
			<StyledPage>
				<Meta />
				<Header />
				<Inner>{this.props.children}</Inner>
			</StyledPage>
		);
	}
}
export default Page;
