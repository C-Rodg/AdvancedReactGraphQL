const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeANiceEmail } = require('../mail');

const Mutations = {
	async createItem(parent, args, ctx, info) {
		if (!ctx.request.userId) {
			throw new Error('You must be logged in to do that!');
		}

		const item = await ctx.db.mutation.createItem(
			{
				data: {
					// This is how to create a relationship
					// between the item and the user
					user: {
						connect: {
							id: ctx.request.userId
						}
					},
					...args
				}
			},
			info
		);

		return item;
	},
	updateItem(parent, args, ctx, info) {
		// take copy of updates
		const updates = { ...args };
		// remove id from updates
		delete updates.id;
		// run the update method
		return ctx.db.mutation.updateItem(
			{
				data: updates,
				where: args.id
			},
			info
		);
	},
	async deleteItem(parent, args, ctx, info) {
		const where = { id: args.id };
		// find item
		const item = await ctx.db.query.item({ where }, `{ id title }`);
		// check if they own the item or have permissions
		// TODO:
		// delete it
		return ctx.db.mutation.deleteItem({ where }, info);
	},
	async signup(parent, args, ctx, info) {
		args.email = args.email.toLowerCase();
		// hash password
		const password = await bcrypt.hash(args.password, 10);

		// create user in db
		const user = await ctx.db.mutation.createUser(
			{
				data: {
					...args,
					password,
					permissions: { set: ['USER'] }
				}
			},
			info
		);

		// create the JWT token
		const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

		// Set the jwt as a cookie on response
		ctx.response.cookie('token', token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year
		});

		// return the user to the browser
		return user;
	},
	signout(parent, args, ctx, info) {
		ctx.response.clearCookie('token');
		return { message: 'Goodbye!' };
	},
	async signin(parent, { email, password }, ctx, info) {
		// 1.) check if there is a user with that email
		const user = await ctx.db.query.user({ where: { email } });
		if (!user) {
			throw new Error(`No such user found for email ${email}`);
		}
		// 2.) check if their password is correct
		const valid = await bcrypt.compare(password, user.password);
		if (!valid) {
			throw new Error('Invalid password');
		}
		// 3.) generate the JWT token
		const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
		// 4.) set the cookie with the token
		ctx.response.cookie('token', token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year
		});
		// 5.) return the user
		return user;
	},
	async requestReset(parent, args, ctx, info) {
		// 1.) check if this is real user
		const user = await ctx.db.query.user({ where: { email: args.email } });
		if (!user) {
			throw new Error(`No such user found for email ${args.email}`);
		}
		// 2.) set reset token and expiry on that user
		const resetToken = (await promisify(randomBytes)(20)).toString('hex');
		const resetTokenExpiry = Date.now() + 3600000; // expire 1 hour from now
		const res = ctx.db.mutation.updateUser({
			where: { email: args.email },
			data: {
				resetToken,
				resetTokenExpiry
			}
		});
		// 3.) email them that reset token
		const mailRes = await transport.sendMail({
			from: 'test@sender.com',
			to: user.email,
			subject: 'Your password reset token',
			html: makeANiceEmail(
				`Your password reset token is here! \n\n<a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click Here to Reset</a>`
			)
		});
		// 4.) return the message
		return { message: 'Thanks' };
	},
	async resetPassword(parent, args, ctx, info) {
		// 1.) Check if passwords match
		if (args.password !== args.confirmPassword) {
			throw new Error("Your passwords don't match");
		}
		// 2.) Check if it's legit reset token
		// 3.) Check if it's expired
		const [user] = ctx.db.query.users({
			where: {
				resetToken: args.resetToken,
				resetTokenExpiry_gte: Date.now() - 3600000
			}
		});
		if (!user) {
			throw new Error(`This token is either expired or invalid.`);
		}
		// 4.) Hash their new password
		const password = await bcrypt.hash(args.password, 10);
		// 5.) Save the new password to the user and remove old resetToken fields
		const updatedUser = await ctx.db.mutation.updateUser({
			where: { email: user.email },
			data: {
				password,
				resetToken: null,
				resetTokenExpiry: null
			}
		});
		// 6.) Generate JWT
		const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
		// 7.) Set the JWT cookie
		ctx.response.cookie('token', token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year
		});
		// 8.) return the new user
		return updatedUser;
	}
};

module.exports = Mutations;
