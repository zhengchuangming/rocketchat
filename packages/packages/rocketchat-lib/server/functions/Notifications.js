import s from "underscore.string";

RocketChat.Notifications = new class {
	constructor() {

		this.debug = false;
		this.streamAll = new Meteor.Streamer('notify-all');
		this.streamLogged = new Meteor.Streamer('notify-logged');
		this.streamRoom = new Meteor.Streamer('notify-room');
		this.streamRoomUsers = new Meteor.Streamer('notify-room-users');
		this.streamUser = new Meteor.Streamer('notify-user');
		this.streamAll.allowWrite('none');
		this.streamLogged.allowWrite('none');
		this.streamRoom.allowWrite('none');
		this.streamRoomUsers.allowWrite(function(eventName, ...args) {
			console.log("allowWrite");
			const [roomId, e] = eventName.split('/');
			// const user = Meteor.users.findOne(this.userId, {
			// 	fields: {
			// 		username: 1
			// 	}
			// });
			if (RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId) != null) {
				const subscriptions = RocketChat.models.Subscriptions.findByRoomIdAndNotUserId(roomId, this.userId).fetch();
				subscriptions.forEach((subscription) => RocketChat.Notifications.notifyUser(subscription.u._id, e, ...args));
			}
			return false;
		});
		// console.log("NOtification contruct");
		this.streamUser.allowWrite('logged');
		this.streamAll.allowRead('all');
		this.streamLogged.allowRead('logged');
		this.streamRoom.allowRead(function(eventName, extraData) {

			// console.log("allowRead");
			const [roomId] = eventName.split('/');
			const room = RocketChat.models.Rooms.findOneById(roomId);
			if (!room) {
				console.warn(`Invalid streamRoom eventName: "${ eventName }"`);
				return false;
			}
			if (room.t === 'l' && extraData && extraData.token && room.v.token === extraData.token) {
				return true;
			}
			if (this.userId == null) {
				return false;
			}
			const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId, { fields: { _id: 1 } });
			return subscription != null;
		});
		this.streamRoom.allowEmit(function(eventName, username, typing, extraData) {
			try {
				console.log("123qwe123qwe/StreamRoom is emitting (allowEmit)/someone is typing!",eventName);
				const [roomId] = eventName.split('/');
				/*if(roomId == "GENERAL"){

					var ReadUserSiteId = RocketChat.models.Users.findOneById(this.userId).site_id;
					var WriteUserSiteId = RocketChat.models.Users.findOneByUsername(username).site_id;

					if(ReadUserSiteId != WriteUserSiteId) {
						return false;
					}
				}*/

				return true;
			} catch (error) {
				console.log("Emit Error!");
			// 	/* error*/
				return false;
			}
		});
		this.streamRoomUsers.allowRead('none');
		this.streamUser.allowRead(function(eventName) {

            const [userId] = eventName.split('/');
			return (this.userId != null) && this.userId === userId;
		});
	}

	notifyAll(eventName, ...args) {
		console.log("notifyAll");
		if (this.debug === true) {
			console.log('notifyAll', [eventName, ...args]);
		}
		args.unshift(eventName);
		return this.streamAll.emit.apply(this.streamAll, args);
	}

	notifyLogged(eventName, ...args) {
		if (this.debug === true) {
			console.log('notifyLogged', [eventName, ...args]);
		}
		args.unshift(eventName);
		return this.streamLogged.emit.apply(this.streamLogged, args);
	}

	notifyRoom(room, eventName, ...args) {
		console.log("notifyRoom");
		if (this.debug === true) {
			console.log('notifyRoom', [room, eventName, ...args]);
		}
		args.unshift(`${ room }/${ eventName }`);
		return this.streamRoom.emit.apply(this.streamRoom, args);
	}

	notifyUser(userId, eventName, ...args) {
		console.log("notifyUser");
		if (this.debug === true) {
			console.log('notifyUser', [userId, eventName, ...args]);
		}
		args.unshift(`${ userId }/${ eventName }`);
		return this.streamUser.emit.apply(this.streamUser, args);
	}

	notifyAllInThisInstance(eventName, ...args) {
		// console.log("123qwe123qwe / notifyAllInThisInstance");
		if (this.debug === true) {
			console.log('notifyAll', [eventName, ...args]);
		}
		args.unshift(eventName);
		return this.streamAll.emitWithoutBroadcast.apply(this.streamAll, args);
	}

	notifyLoggedInThisInstance(eventName, ...args) {
		if (this.debug === true) {
			console.log('notifyLogged', [eventName, ...args]);
		}
		args.unshift(eventName);
		return this.streamLogged.emitWithoutBroadcast.apply(this.streamLogged, args);
	}

	notifyRoomInThisInstance(room, eventName, ...args) {
		console.log("notifyRoomInThisInstance");
		if (this.debug === true) {
			console.log('notifyRoomAndBroadcast', [room, eventName, ...args]);
		}
		args.unshift(`${ room }/${ eventName }`);
		return this.streamRoom.emitWithoutBroadcast.apply(this.streamRoom, args);
	}

	notifyUserInThisInstance(userId, eventName, ...args) {

		console.log("=============== notifyUserInThisInstance ===============",userId);

		if (this.debug === true) {
			console.log('notifyUserAndBroadcast', [userId, eventName, ...args]);
		}
		args.unshift(`${ userId }/${ eventName }`);
		return this.streamUser.emitWithoutBroadcast.apply(this.streamUser, args);
	}
};

RocketChat.Notifications.streamRoom.allowWrite(function(eventName, username, typing, extraData) {
	console.log("Notifications.streamRoom.allowWrite");
	const [roomId, e] = eventName.split('/');

	if (e === 'webrtc') {
		return true;
	}
	if (e === 'typing') {
		const key = RocketChat.settings.get('UI_Use_Real_Name') ? 'name' : 'username';
		// typing from livechat widget
		if (extraData && extraData.token) {
			const room = RocketChat.models.Rooms.findOneById(roomId);
			if (room && room.t === 'l' && room.v.token === extraData.token) {
				return true;
			}
		}

		const user = Meteor.users.findOne(this.userId, {
			fields: {
				[key]: 1,
			},
		});

		if (!user) {
			return false;
		}

		return user[key] === username;
	}
	return false;
});
