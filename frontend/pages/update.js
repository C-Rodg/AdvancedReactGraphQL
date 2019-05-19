import UpdateItem from '../components/UpdateItem';
import { Query } from 'react-apollo';

const Update = ({ query }) => {
	return (
		<div>
			<UpdateItem id={query.id} />
		</div>
	);
};

export default Update;
