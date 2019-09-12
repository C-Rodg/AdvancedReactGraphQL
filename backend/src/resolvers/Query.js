const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

const Query = {
	items: forwardTo('db'),
	item: forwardTo('db'),
	itemsConnection: forwardTo('db'),
	me(parent, args, ctx, info) {
		if (!ctx.request.userId) {
			return null;
		}
		return ctx.db.query.user(
			{
				where: { id: ctx.request.userId }
			},
			info
		);
	},
	// async items(parent, args, ctx, info) {
	// 	const items = await ctx.db.query.item();
	// 	return items;
	// }
	async users(parent, args, ctx, info) {
		// Check logged in
		if (!ctx.request.userId) {
			throw new Error('You must be logged in!');
		}
		// 1.) check if the user has permissions to query all the users
		hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE']);

		// 2.) if they do, query all the users
		return ctx.db.users({}, info);
	}
};

module.exports = Query;
