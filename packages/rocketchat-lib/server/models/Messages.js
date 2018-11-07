import _ from 'underscore';

RocketChat.models.Messages = new class extends RocketChat.models._Base {
	constructor() {
		super('message');

		this.tryEnsureIndex({ rid: 1, ts: 1 });
		this.tryEnsureIndex({ ts: 1 });
		this.tryEnsureIndex({ 'u._id': 1 });
		this.tryEnsureIndex({ editedAt: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'editedBy._id': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ rid: 1, t: 1, 'u._id': 1 });
		this.tryEnsureIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
		this.tryEnsureIndex({ msg: 'text' });
		this.tryEnsureIndex({ 'file._id': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'mentions.username': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ pinned: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ snippeted: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ location: '2dsphere' });
		this.tryEnsureIndex({ slackBotId: 1, slackTs: 1 }, { sparse: 1 });
	}

	countVisibleByRoomIdBetweenTimestampsInclusive(roomId, afterTimestamp, beforeTimestamp, options) {
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				$gte: afterTimestamp,
				$lte: beforeTimestamp,
			},
		};

		return this.find(query, options).count();
	}

	// FIND
	findByMention(username, options) {
		console.log("findByMention");
		const query =	{ 'mentions.username': username };

		return this.find(query, options);
	}

	findFilesByUserId(userId, options = {}) {
		const query = {
			'u._id': userId,
			'file._id': { $exists: true },
		};
		return this.find(query, { fields: { 'file._id': 1 }, ...options });
	}

	findFilesByRoomIdPinnedTimestampAndUsers(rid, excludePinned, ts, users = [], options = {}) {
		const query = {
			rid,
			ts,
			'file._id': { $exists: true },
		};

		if (excludePinned) {
			query.pinned = { $ne: true };
		}

		if (users.length) {
			query['u.username'] = { $in: users };
		}

		return this.find(query, { fields: { 'file._id': 1 }, ...options });
	}
	findVisibleByMentionAndRoomId(username, rid, options) {
		console.log("findVisibleByMentionAndRoomId");
		const query = {
			_hidden: { $ne: true },
			'mentions.username': username,
			rid,
		};

		return this.find(query, options);
	}

	findVisibleByRoomId(roomId, options) {
		console.log("findVisibleByRoomId");
		const query = {
			_hidden: {
				$ne: true,
			},

			rid: roomId,
		};

		return this.find(query, options);
	}

	//fetch messages by site_id in general Channel

	findMessageInGeneral(siteId) {

		return this._db.model.aggregate([
			{
				$lookup:
					{
						from: "users",
						localField: "u._id",
						foreignField: "_id",
						as: "messages"
					}
			},
			{
				$match:{
					"messages.site_id":siteId
				}
			}
		]);

	}
	findVisibleByRoomIdNotContainingTypes(roomId, types, options) {
		const query = {
			_hidden: {
				$ne: true,
			},

			rid: roomId,
		};

		if (Match.test(types, [String]) && (types.length > 0)) {
			query.t =
			{ $nin: types };
		}

		return this.find(query, options);
	}

	findInvisibleByRoomId(roomId, options) {
		console.log("findInvisibleByRoomId");
		const query = {
			_hidden: true,
			rid: roomId,
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdAfterTimestamp(roomId, timestamp, options) {
		console.log("findVisibleByRoomIdAfterTimestamp");
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				$gt: timestamp,
			},
		};

		return this.find(query, options);
	}

	findForUpdates(roomId, timestamp, options) {
		console.log("findForUpdates");
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			_updatedAt: {
				$gt: timestamp,
			},
		};
		return this.find(query, options);
	}

	findVisibleByRoomIdBeforeTimestamp(roomId, timestamp, options) {
		console.log("findVisibleByRoomIdBeforeTimestamp");
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				$lt: timestamp,
			},
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdBeforeTimestampInclusive(roomId, timestamp, options) {
		console.log("findVisibleByRoomIdBeforeTimestampInclusive");
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				$lte: timestamp,
			},
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdBetweenTimestamps(roomId, afterTimestamp, beforeTimestamp, options) {
		console.log("findVisibleByRoomIdBetweenTimestamps");
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				$gt: afterTimestamp,
				$lt: beforeTimestamp,
			},
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdBetweenTimestampsInclusive(roomId, afterTimestamp, beforeTimestamp, options) {
		console.log("findVisibleByRoomIdBetweenTimestampsInclusive");
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				$gte: afterTimestamp,
				$lte: beforeTimestamp,
			},
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdBeforeTimestampNotContainingTypes(roomId, timestamp, types, options) {
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				$lt: timestamp,
			},
		};

		if (Match.test(types, [String]) && (types.length > 0)) {
			query.t =
			{ $nin: types };
		}

		return this.find(query, options);
	}

	findVisibleByRoomIdBetweenTimestampsNotContainingTypes(roomId, afterTimestamp, beforeTimestamp, types, options) {

		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				$gt: afterTimestamp,
				$lt: beforeTimestamp,
			},
		};

		if (Match.test(types, [String]) && (types.length > 0)) {
			query.t =
			{ $nin: types };
		}

		return this.find(query, options);
	}

	findVisibleCreatedOrEditedAfterTimestamp(timestamp, options) {
		console.log("findVisibleCreatedOrEditedAfterTimestamp");
		const query = {
			_hidden: { $ne: true },
			$or: [{
				ts: {
					$gt: timestamp,
				},
			},
			{
				editedAt: {
					$gt: timestamp,
				},
			},
			],
		};

		return this.find(query, options);
	}

	findStarredByUserAtRoom(userId, roomId, options) {
		console.log("findStarredByUserAtRoom");
		const query = {
			_hidden: { $ne: true },
			'starred._id': userId,
			rid: roomId,
		};

		return this.find(query, options);
	}

	findPinnedByRoom(roomId, options) {
		console.log("findPinnedByRoom");
		const query = {
			t: { $ne: 'rm' },
			_hidden: { $ne: true },
			pinned: true,
			rid: roomId,
		};

		return this.find(query, options);
	}

	findSnippetedByRoom(roomId, options) {
		console.log("findSnippetedByRoom");
		const query = {
			_hidden: { $ne: true },
			snippeted: true,
			rid: roomId,
		};

		return this.find(query, options);
	}

	getLastTimestamp(options) {
		// console.log("getLastTimestamp");
		if (options == null) { options = {}; }
		const query = { ts: { $exists: 1 } };
		options.sort = { ts: -1 };
		options.limit = 1;
		const [message] = this.find(query, options).fetch();
		return message && message.ts;
	}

	findByRoomIdAndMessageIds(rid, messageIds, options) {
		console.log("findByRoomIdAndMessageIds");
		const query = {
			rid,
			_id: {
				$in: messageIds,
			},
		};

		return this.find(query, options);
	}

	findOneBySlackBotIdAndSlackTs(slackBotId, slackTs) {
		console.log("findOneBySlackBotIdAndSlackTs");
		const query = {
			slackBotId,
			slackTs,
		};

		return this.findOne(query);
	}

	findOneBySlackTs(slackTs) {
		console.log("findOneBySlackTs");
		const query = { slackTs };

		return this.findOne(query);
	}

	findByRoomIdAndType(roomId, type, options) {
		console.log("findByRoomIdAndType");
		const query = {
			rid: roomId,
			t: type,
		};

		if (options == null) { options = {}; }

		return this.find(query, options);
	}

	findByRoomId(roomId, options) {
		console.log("findByRoomId");
		const query = {
			rid: roomId,
		};

		return this.find(query, options);
	}

	getLastVisibleMessageSentWithNoTypeByRoomId(rid, messageId) {
		console.log("getLastVisibleMessageSentWithNoTypeByRoomId");
		const query = {
			rid,
			_hidden: { $ne: true },
			t: { $exists: false },
		};

		if (messageId) {
			query._id = { $ne: messageId };
		}

		const options = {
			sort: {
				ts: -1,
			},
		};

		return this.findOne(query, options);
	}

	cloneAndSaveAsHistoryById(_id) {
		console.log("cloneAndSaveAsHistoryById");
		const me = RocketChat.models.Users.findOneById(Meteor.userId());
		const record = this.findOneById(_id);
		record._hidden = true;
		record.parent = record._id;
		record.editedAt = new Date;
		record.editedBy = {
			_id: Meteor.userId(),
			username: me.username,
		};
		delete record._id;
		return this.insert(record);
	}

	// UPDATE
	setHiddenById(_id, hidden) {
		console.log("rsetHiddenById(_id, hidden) {");
		if (hidden == null) { hidden = true; }
		const query =	{ _id };

		const update = {
			$set: {
				_hidden: hidden,
			},
		};

		return this.update(query, update);
	}

	setAsDeletedByIdAndUser(_id, user) {
		console.log("setAsDeletedByIdAndUser(_id, user) {");
		const query =	{ _id };

		const update = {
			$set: {
				msg: '',
				t: 'rm',
				urls: [],
				mentions: [],
				attachments: [],
				reactions: [],
				editedAt: new Date(),
				editedBy: {
					_id: user._id,
					username: user.username,
				},
			},
		};

		return this.update(query, update);
	}

	setPinnedByIdAndUserId(_id, pinnedBy, pinned, pinnedAt) {
		console.log("setPinnedByIdAndUserId(_id, pinnedBy, pinned, pinnedAt) {");
		if (pinned == null) { pinned = true; }
		if (pinnedAt == null) { pinnedAt = 0; }
		const query =	{ _id };

		const update = {
			$set: {
				pinned,
				pinnedAt: pinnedAt || new Date,
				pinnedBy,
			},
		};

		return this.update(query, update);
	}

	setSnippetedByIdAndUserId(message, snippetName, snippetedBy, snippeted, snippetedAt) {
		console.log("setSnippetedByIdAndUserId(message, snippetName, snippetedBy, snippeted, snippetedAt) {");
		if (snippeted == null) { snippeted = true; }
		if (snippetedAt == null) { snippetedAt = 0; }
		const query =	{ _id: message._id };

		const msg = `\`\`\`${ message.msg }\`\`\``;

		const update = {
			$set: {
				msg,
				snippeted,
				snippetedAt: snippetedAt || new Date,
				snippetedBy,
				snippetName,
			},
		};

		return this.update(query, update);
	}

	setUrlsById(_id, urls) {
		console.log("setUrlsById(_id, urls) {");
		const query =	{ _id };

		const update = {
			$set: {
				urls,
			},
		};

		return this.update(query, update);
	}

	updateAllUsernamesByUserId(userId, username) {
		console.log("updateAllUsernamesByUserId(userId, username) {");
		const query =	{ 'u._id': userId };

		const update = {
			$set: {
				'u.username': username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	updateUsernameOfEditByUserId(userId, username) {
		console.log("rupdateUsernameOfEditByUserId(userId, username) {");
		const query =	{ 'editedBy._id': userId };

		const update = {
			$set: {
				'editedBy.username': username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	updateUsernameAndMessageOfMentionByIdAndOldUsername(_id, oldUsername, newUsername, newMessage) {
		console.log("rupdateUsernameAndMessageOfMentionByIdAndOldUsername(_id, oldUsername, newUsername, newMessage) {");
		const query = {
			_id,
			'mentions.username': oldUsername,
		};

		const update = {
			$set: {
				'mentions.$.username': newUsername,
				msg: newMessage,
			},
		};

		return this.update(query, update);
	}

	updateUserStarById(_id, userId, starred) {
		console.log("updateUserStarById(_id, userId, starred) {");
		let update;
		const query =	{ _id };

		if (starred) {
			update = {
				$addToSet: {
					starred: { _id: userId },
				},
			};
		} else {
			update = {
				$pull: {
					starred: { _id: Meteor.userId() },
				},
			};
		}

		return this.update(query, update);
	}

	upgradeEtsToEditAt() {
		console.log("11111111111111111");
		const query =	{ ets: { $exists: 1 } };

		const update = {
			$rename: {
				ets: 'editedAt',
			},
		};

		return this.update(query, update, { multi: true });
	}

	setMessageAttachments(_id, attachments) {
		console.log("2222222222222222222");
		const query =	{ _id };

		const update = {
			$set: {
				attachments,
			},
		};

		return this.update(query, update);
	}

	setSlackBotIdAndSlackTs(_id, slackBotId, slackTs) {
		console.log("33333333333333333333333");
		const query =	{ _id };

		const update = {
			$set: {
				slackBotId,
				slackTs,
			},
		};

		return this.update(query, update);
	}

	unlinkUserId(userId, newUserId, newUsername, newNameAlias) {
		console.log("444444444444444444444");
		const query = {
			'u._id': userId,
		};

		const update = {
			$set: {
				alias: newNameAlias,
				'u._id': newUserId,
				'u.username' : newUsername,
				'u.name' : undefined,
			},
		};

		return this.update(query, update, { multi: true });
	}

	// INSERT
	createWithTypeRoomIdMessageAndUser(type, roomId, message, user, extraData) {
		console.log("555555555555555555555555");
		const room = RocketChat.models.Rooms.findOneById(roomId, { fields: { sysMes: 1 } });
		if ((room != null ? room.sysMes : undefined) === false) {
			return;
		}
		const record = {
			t: type,
			rid: roomId,
			ts: new Date,
			msg: message,
			u: {
				_id: user._id,
				username: user.username,
			},
			groupable: false,
		};

		if (RocketChat.settings.get('Message_Read_Receipt_Enabled')) {
			record.unread = true;
		}

		_.extend(record, extraData);

		record._id = this.insertOrUpsert(record);
		RocketChat.models.Rooms.incMsgCountById(room._id, 1);
		return record;
	}

	createNavigationHistoryWithRoomIdMessageAndUser(roomId, message, user, extraData) {
		console.log("666666666666666");
		const type = 'livechat_navigation_history';
		const room = RocketChat.models.Rooms.findOneById(roomId, { fields: { sysMes: 1 } });
		if ((room != null ? room.sysMes : undefined) === false) {
			return;
		}
		const record = {
			t: type,
			rid: roomId,
			ts: new Date,
			msg: message,
			u: {
				_id: user._id,
				username: user.username,
			},
			groupable: false,
		};

		if (RocketChat.settings.get('Message_Read_Receipt_Enabled')) {
			record.unread = true;
		}

		_.extend(record, extraData);

		record._id = this.insertOrUpsert(record);
		return record;
	}

	createUserJoinWithRoomIdAndUser(roomId, user, extraData) {
		console.log("77777777777777777");
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('uj', roomId, message, user, extraData);
	}

	createUserLeaveWithRoomIdAndUser(roomId, user, extraData) {
		console.log("88888888888888888888");
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('ul', roomId, message, user, extraData);
	}

	createUserRemovedWithRoomIdAndUser(roomId, user, extraData) {
		console.log("89999999999999999999999");
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('ru', roomId, message, user, extraData);
	}

	createUserAddedWithRoomIdAndUser(roomId, user, extraData) {
		console.log("100000000000000100000");
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('au', roomId, message, user, extraData);
	}

	createCommandWithRoomIdAndUser(command, roomId, user, extraData) {
		console.log("1212121212121212");
		return this.createWithTypeRoomIdMessageAndUser('command', roomId, command, user, extraData);
	}

	createUserMutedWithRoomIdAndUser(roomId, user, extraData) {
		console.log("131313131313131313");
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('user-muted', roomId, message, user, extraData);
	}

	createUserUnmutedWithRoomIdAndUser(roomId, user, extraData) {
		console.log("1414444444444444444444");
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('user-unmuted', roomId, message, user, extraData);
	}

	createNewModeratorWithRoomIdAndUser(roomId, user, extraData) {
		console.log("155555555555555555555555555");
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('new-moderator', roomId, message, user, extraData);
	}

	createModeratorRemovedWithRoomIdAndUser(roomId, user, extraData) {
		console.log("r16666666666666666");
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('moderator-removed', roomId, message, user, extraData);
	}

	createNewOwnerWithRoomIdAndUser(roomId, user, extraData) {
		console.log("17777777777777777777777777");
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('new-owner', roomId, message, user, extraData);
	}

	createOwnerRemovedWithRoomIdAndUser(roomId, user, extraData) {
		console.log("188888888888888888888");
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('owner-removed', roomId, message, user, extraData);
	}

	createNewLeaderWithRoomIdAndUser(roomId, user, extraData) {
		console.log("19999999999999999999999");
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('new-leader', roomId, message, user, extraData);
	}

	createLeaderRemovedWithRoomIdAndUser(roomId, user, extraData) {
		console.log("rcreateSubscriptionRoleRemovedWithRoomIdAndUser(roomId, user, extraData) {");
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('leader-removed', roomId, message, user, extraData);
	}

	createSubscriptionRoleAddedWithRoomIdAndUser(roomId, user, extraData) {
		console.log("200000000000000000000");
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('subscription-role-added', roomId, message, user, extraData);
	}

	createSubscriptionRoleRemovedWithRoomIdAndUser(roomId, user, extraData) {
		console.log("211111111111111111111111");
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('subscription-role-removed', roomId, message, user, extraData);
	}

    removeByUserId(userId){

        const query =	{ 'u._id': userId };

        return this.remove(query);
    }

	removeById(_id) {
		console.log("removeById(_id) {");
		const query =	{ _id };

		return this.remove(query);
	}

	removeByRoomId(roomId) {
		console.log("removeByRoomId(roomId) {");
		const query =	{ rid: roomId };

		return this.remove(query);
	}

	removeByIdPinnedTimestampAndUsers(rid, pinned, ts, users = []) {
		console.log("removeByIdPinnedTimestampAndUsers(rid, pinned, ts, users = []) {");
		const query = {
			rid,
			ts,
		};

		if (pinned) {
			query.pinned = { $ne: true };
		}

		if (users.length) {
			query['u.username'] = { $in: users };
		}

		return this.remove(query);
	}

	removeByIdPinnedTimestampLimitAndUsers(rid, pinned, ts, limit, users = []) {
		const query = {
			rid,
			ts,
		};

		if (pinned) {
			query.pinned = { $ne: true };
		}

		if (users.length) {
			query['u.username'] = { $in: users };
		}
		console.log("RocketChat.models.Messages.find(query, {");
		const messagesToDelete = RocketChat.models.Messages.find(query, {
			fields: {
				_id: 1,
			},
			limit,
		}).map(({ _id }) => _id);

		return this.remove({
			_id: {
				$in: messagesToDelete,
			},
		});
	}

	removeFilesByRoomId(roomId) {
		console.log("removeFilesByRoomId(roomId) {");
		this.find({
			rid: roomId,
			'file._id': {
				$exists: true,
			},
		}, {
			fields: {
				'file._id': 1,
			},
		}).fetch().forEach((document) => FileUpload.getStore('Uploads').deleteById(document.file._id));
	}

	getMessageByFileId(fileID) {
		console.log("getMessageByFileId(fileID) {");
		return this.findOne({ 'file._id': fileID });
	}

	setAsRead(rid, until) {
		console.log("setAsRead(rid, until) {");
		return this.update({
			rid,
			unread: true,
			ts: { $lt: until },
		}, {
			$unset: {
				unread: 1,
			},
		}, {
			multi: true,
		});
	}

	setAsReadById(_id) {
		console.log("setAsReadById(_id) {");
		return this.update({
			_id,
		}, {
			$unset: {
				unread: 1,
			},
		});
	}

	findUnreadMessagesByRoomAndDate(rid, after) {
		console.log("Message.js/unreadMessage");
		const query = {
			unread: true,
			rid,
		};

		if (after) {
			query.ts = { $gt: after };
		}

		return this.find(query, {
			fields: {
				_id: 1,
			},
		});
	}
};
