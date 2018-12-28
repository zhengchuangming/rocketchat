Meteor.methods({
	createDirectMessage(username) {
		check(username, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createDirectMessage',
			});
		}

		const me = Meteor.user();

		if (!me.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createDirectMessage',
			});
		}

		if (RocketChat.settings.get('Message_AllowDirectMessagesToYourself') === false && me.username === username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createDirectMessage',
			});
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'create-d')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'createDirectMessage',
			});
		}

		const to = RocketChat.models.Users.findOneByUsername(username);

		if (!to) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createDirectMessage',
			});
		}

		if (!RocketChat.authz.hasPermission(to._id, 'view-d-room')) {
			throw new Meteor.Error('error-not-allowed', 'Target user not allowed to receive messages', {
				method: 'createDirectMessage',
			});
		}
		// const rid1 = [me._id, to._id].sort().join('');

// ======= create direct room ========123qwe123qwe

	// get user siteKey
		let userInfo = RocketChat.models.Users.findOne(me._id);
		let siteKey = userInfo.siteKey;

	//get siteKeyInfo for adding memo of siteKey
        let siteKeyInfo = RocketChat.models.SiteKeys.findOne({'key':siteKey});
        if(!siteKeyInfo) {
            throw new Meteor.Error('siteKey does not exist', 'Not allowed', {
                method: 'createDirectMessage',
            });
        }
		console.log("direct room is created!:",siteKey);
		//Make sure we have a room
		let rid = '';
        const now = new Date();
        const existRoom = RocketChat.models.Rooms.findOne({usernames:[me.username, to.username],siteKey:siteKey});

	// ========= if room is exist, return with rid ==========
		if(existRoom)
            rid = existRoom._id;
        else
        	rid = Random.id();

		RocketChat.models.Rooms.upsert({
			_id: rid,
		}, {
			$set: {
				usernames: [me.username, to.username],
			},
			$setOnInsert: {
				t: 'd',
				msgs: 0,
				ts: now,
				usersCount: 2,
				site_id:siteKeyInfo.site_id,
				siteKey: siteKey,
				siteKeyName:siteKeyInfo.memo,
			},
		});

		const myNotificationPref = RocketChat.getDefaultSubscriptionPref(me);

	//get siteKey onwhich second user is connected
        const secondUser = RocketChat.models.Users.findOne({username:to.username});

		// Make user I have a subcription to this room
		const upsertSubscription = {
			$set: {
				ls: now,
				open: true,
			},
			$setOnInsert: {
				fname: to.name,
				name: to.username,
				t: 'd',
				alert: false,
				unread: 0,
				userMentions: 0,
				groupMentions: 0,
				customFields: me.customFields,
				siteKey:siteKey,
				f_online_siteKey:secondUser.siteKey,
				u: {
					_id: me._id,
					username: me.username,
				},
				ts: now,
				...myNotificationPref,
			},
		};

		if (to.active === false) {
			upsertSubscription.$set.archived = true;
		}

		RocketChat.models.Subscriptions.upsert({
			rid,
			$and: [{ 'u._id': me._id }], // work around to solve problems with upsert and dot
		}, upsertSubscription);

		const toNotificationPref = RocketChat.getDefaultSubscriptionPref(to);

		RocketChat.models.Subscriptions.upsert({
			rid,
			$and: [{ 'u._id': to._id }], // work around to solve problems with upsert and dot
		}, {
			$setOnInsert: {
				fname: me.name,
				name: me.username,
				t: 'd',
				open: false,
				alert: false,
				unread: 0,
				userMentions: 0,
				groupMentions: 0,
				siteKey:siteKey,
				f_online_siteKey:siteKey,
				customFields: to.customFields,
				u: {
					_id: to._id,
					username: to.username,
				},
				ts: now,
				...toNotificationPref,
			},
		});

		return {
			rid,
		};
	},
});

RocketChat.RateLimiter.limitMethod('createDirectMessage', 10, 60000, {
	userId(userId) {
		return !RocketChat.authz.hasPermission(userId, 'send-many-messages');
	},
});
