import _ from 'underscore';
import s from 'underscore.string';

class ModelRooms extends RocketChat.models._Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ name: 1 }, { unique: 1, sparse: 1 });
		this.tryEnsureIndex({ default: 1 });
		this.tryEnsureIndex({ t: 1 });
		this.tryEnsureIndex({ 'u._id': 1 });
	}

	findOneByIdOrName(_idOrName, options) {
		const query = {
			$or: [{
				_id: _idOrName,
			}, {
				name: _idOrName,
			}],
		};

		return this.findOne(query, options);
	}

	findOneByImportId(_id, options) {
		const query = { importIds: _id };

		return this.findOne(query, options);
	}

	findOneByName(name, options) {
		const query = { name };

		return this.findOne(query, options);
	}

	findOneByNameAndNotId(name, rid) {
		const query = {
			_id: { $ne: rid },
			name,
		};

		return this.findOne(query);
	}

	findOneByDisplayName(fname, options) {
		const query = { fname };

		return this.findOne(query, options);
	}

	findOneByNameAndType(name, type, options) {
		const query = {
			name,
			t: type,
		};

		return this.findOne(query, options);
	}

	// FIND

	findWithUsername(username, options) {console.log("findWithUsername");
		return this.find({ usernames: username }, options);
	}

	findById(roomId, options) {
		return this.find({ _id: roomId }, options);
	}

	findByIds(roomIds, options) {console.log("findByIds");
		return this.find({ _id: { $in: [].concat(roomIds) } }, options);
	}

	findByType(type, options) {
		// console.log("findByType");
		const query = { t: type };

		return this.find(query, options);
	}

	findByTypeInIds(type, ids, options) {console.log("findByTypeInIds");
		const query = {
			_id: {
				$in: ids,
			},
			t: type,
		};

		return this.find(query, options);
	}

	findByTypes(types, options) {
		console.log("findByTypes");

		const query = {
			t: {
				$in: types,
			},
		};
		return this.find(query, options);
	}

	findByTypesAndSiteId(siteId, types, options) {console.log("findByTypesAndSiteId");

		var query = {
			t: {
				$in: types,
			},
		};
		// console.log("123qwe123qwe/ Room separete model");
		var rooms = this.find(query, options).fetch();
		var roomIds = [];
		var ReadUser,userId;

		rooms.forEach(function (item) {
			if(item._id != "GENERAL") {
				const subscriptions = RocketChat.models.Subscriptions.findByRoomIdWhenUsernameExists(item._id, {fields: {'u._id': 1}}).fetch();

				if(subscriptions) {

					userId = subscriptions[0].u._id; // TODO: CACHE: expensive
					ReadUser = RocketChat.models.Users.findOneById(userId);
					if (ReadUser && ReadUser.site_id == siteId)
						roomIds.push(item._id);
				}
			}else
				roomIds.push(item._id);
		});

		query = {
			t: {
				$in: types,
			},
			_id:{
				$in: roomIds,
			}
		};

		return this.find(query, options);
	}

	findByUserId(userId, options) {
		const query = { 'u._id': userId };

		return this.find(query, options);
	}

	findBySubscriptionUserId(userId, options) {console.log("findBySubscriptionUserId");
		const data = RocketChat.models.Subscriptions.findByUserId(userId, { fields: { rid: 1 } }).fetch()
			.map((item) => item.rid);

		const query = {
			_id: {
				$in: data,
			},
		};

		return this.find(query, options);
	}

	findBySubscriptionTypeAndUserId(type, userId, options) {console.log("findBySubscriptionTypeAndUserId");
		const data = RocketChat.models.Subscriptions.findByUserIdAndType(userId, type, { fields: { rid: 1 } }).fetch()
			.map((item) => item.rid);

		const query = {
			t: type,
			_id: {
				$in: data,
			},
		};

		return this.find(query, options);
	}

	findBySubscriptionUserIdUpdatedAfter(userId, _updatedAt, options) {console.log("findBySubscriptionUserIdUpdatedAfter");
		const ids = RocketChat.models.Subscriptions.findByUserId(userId, { fields: { rid: 1 } }).fetch()
			.map((item) => item.rid);

		const query = {
			_id: {
				$in: ids,
			},
			_updatedAt: {
				$gt: _updatedAt,
			},
		};

		return this.find(query, options);
	}

	findByNameContaining(name, options) {console.log("findByNameContaining");
		const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');

		const query = {
			$or: [
				{ name: nameRegex },
				{
					t: 'd',
					usernames: nameRegex,
				},
			],
		};

		return this.find(query, options);
	}

	findByNameContainingAndTypes(name, types, options) {console.log("findByNameContainingAndTypes");
		const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');

		const query = {
			t: {
				$in: types,
			},
			$or: [
				{ name: nameRegex },
				{
					t: 'd',
					usernames: nameRegex,
				},
			],
		};

		return this.find(query, options);
	}

    findByName(name){

		console.log("name======:",name);
        const query = {
            $or: [
                { name: name },
                {
                    t: 'd',
                    usernames: name,
                },
            ],
        };

        return this.find(query);
	}
	findByNameAndTypeAndSiteId(siteId, name, type, options) {console.log("findByNameAndTypeAndSiteId");
		const query = {
			t: type,
			name,
		};
		var  returnValue = this._db.model.aggregate([
			{
				$lookup:
					{
						from: "users",
						localField: "u._id",
						foreignField: "_id",
						as: "rooms"
					}
			},
			{
				$match:{
					"rooms.site_id":siteId,
					"name":name,
				}
			}
		]);


		// var rooms = this._db.find(query, options);
	// 	var returnRooms = [];
	// 	// do not use cache
	//
	// 	rooms.forEach(function (room) {
	//
	// 			var roomSiteId = RocketChat.models.Users.find({_id: room.u._id}).site_id;
	//
	// 			if(roomSiteId == siteId)
	// 				returnRooms.push(room);
	// 		});
	//
	// var cursor = new Iterator();
	// cursor.createCursor(returnRooms);

		return returnValue;
	}

	findByNameAndTypeNotDefault(name, type, options) {console.log("findByNameAndTypeNotDefault");
		const query = {
			t: type,
			name,
			default: {
				$ne: true,
			},
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findByNameAndTypesNotInIds(name, types, ids, options) {console.log("findByNameAndTypesNotInIds");
		const query = {
			_id: {
				$ne: ids,
			},
			t: {
				$in: types,
			},
			name,
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findChannelAndPrivateByNameStarting(name, options) {console.log("findChannelAndPrivateByNameStarting");
		const nameRegex = new RegExp(`^${ s.trim(s.escapeRegExp(name)) }`, 'i');

		const query = {
			t: {
				$in: ['c', 'p'],
			},
			name: nameRegex,
		};

		return this.find(query, options);
	}

	findByDefaultAndTypes(defaultValue, types, options) {console.log("findByDefaultAndTypes");
		const query = {
			default: defaultValue,
			t: {
				$in: types,
			},
		};

		return this.find(query, options);
	}

	findDirectRoomContainingUsername(username, options) {console.log("findDirectRoomContainingUsername");
		console.log("findDirectRoomContainingUsername");
		const query = {
			t: 'd',
			usernames: username,
		};

		return this.find(query, options);
	}

	findByTypeAndName(type, name, options) {console.log("findByTypeAndName");
		const query = {
			name,
			t: type,
		};

		return this.find(query, options);
	}

	findByTypeAndNameContaining(type, name, options) {console.log("findByTypeAndNameContaining");
		const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');

		const query = {
			name: nameRegex,
			t: type,
		};

		return this.find(query, options);
	}

	findByTypeInIdsAndNameContaining(type, ids, name, options) {console.log("findByTypeInIdsAndNameContaining");
		const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');

		const query = {
			_id: {
				$in: ids,
			},
			name: nameRegex,
			t: type,
		};

		return this.find(query, options);
	}

	findByTypeAndArchivationState(type, archivationstate, options) {console.log("findByTypeAndArchivationState");
		const query = { t: type };

		if (archivationstate) {
			query.archived = true;
		} else {
			query.archived = { $ne: true };
		}

		return this.find(query, options);
	}

	// UPDATE
	addImportIds(_id, importIds) {
		importIds = [].concat(importIds);
		const query = { _id };

		const update = {
			$addToSet: {
				importIds: {
					$each: importIds,
				},
			},
		};

		return this.update(query, update);
	}

	archiveById(_id) {
		const query = { _id };

		const update = {
			$set: {
				archived: true,
			},
		};

		return this.update(query, update);
	}

	unarchiveById(_id) {
		const query = { _id };

		const update = {
			$set: {
				archived: false,
			},
		};

		return this.update(query, update);
	}

	setNameById(_id, name, fname) {
		const query = { _id };

		const update = {
			$set: {
				name,
				fname,
			},
		};

		return this.update(query, update);
	}

	setFnameById(_id, fname) {
		const query = { _id };

		const update = {
			$set: {
				fname,
			},
		};

		return this.update(query, update);
	}

	incMsgCountById(_id, inc) {
		if (inc == null) { inc = 1; }
		const query = { _id };

		const update = {
			$inc: {
				msgs: inc,
			},
		};

		return this.update(query, update);
	}

	incMsgCountAndSetLastMessageById(_id, inc, lastMessageTimestamp, lastMessage) {
		if (inc == null) { inc = 1; }
		const query = { _id };

		const update = {
			$set: {
				lm: lastMessageTimestamp,
			},
			$inc: {
				msgs: inc,
			},
		};

		if (lastMessage) {
			update.$set.lastMessage = lastMessage;
		}

		return this.update(query, update);
	}

	incUsersCountById(_id, inc = 1) {
		const query = { _id };

		const update = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.update(query, update);
	}

	incUsersCountByIds(ids, inc = 1) {
		const query = {
			_id: {
				$in: ids,
			},
		};

		const update = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.update(query, update, { multi: true });
	}

	setLastMessageById(_id, lastMessage) {
		const query = { _id };

		const update = {
			$set: {
				lastMessage,
			},
		};

		return this.update(query, update);
	}

	resetLastMessageById(_id) {
		const query = { _id };
		const lastMessage = RocketChat.models.Messages.getLastVisibleMessageSentWithNoTypeByRoomId(_id);

		const update = lastMessage ? {
			$set: {
				lastMessage,
			},
		} : {
			$unset: {
				lastMessage: 1,
			},
		};

		return this.update(query, update);
	}

	replaceUsername(previousUsername, username) {
		const query = { usernames: previousUsername };

		const update = {
			$set: {
				'usernames.$': username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	replaceMutedUsername(previousUsername, username) {
		const query = { muted: previousUsername };

		const update = {
			$set: {
				'muted.$': username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	replaceUsernameOfUserByUserId(userId, username) {
		const query = { 'u._id': userId };

		const update = {
			$set: {
				'u.username': username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	setJoinCodeById(_id, joinCode) {
		let update;
		const query = { _id };

		if ((joinCode != null ? joinCode.trim() : undefined) !== '') {
			update = {
				$set: {
					joinCodeRequired: true,
					joinCode,
				},
			};
		} else {
			update = {
				$set: {
					joinCodeRequired: false,
				},
				$unset: {
					joinCode: 1,
				},
			};
		}

		return this.update(query, update);
	}

	setUserById(_id, user) {
		const query = { _id };

		const update = {
			$set: {
				u: {
					_id: user._id,
					username: user.username,
				},
			},
		};

		return this.update(query, update);
	}

	setTypeById(_id, type) {
		const query = { _id };
		const update = {
			$set: {
				t: type,
			},
		};
		if (type === 'p') {
			update.$unset = { default: '' };
		}

		return this.update(query, update);
	}

	setTopicById(_id, topic) {
		const query = { _id };

		const update = {
			$set: {
				topic,
			},
		};

		return this.update(query, update);
	}

	setAnnouncementById(_id, announcement, announcementDetails) {
		const query = { _id };

		const update = {
			$set: {
				announcement,
				announcementDetails,
			},
		};

		return this.update(query, update);
	}

	setCustomFieldsById(_id, customFields) {
		const query = { _id };

		const update = {
			$set: {
				customFields,
			},
		};

		return this.update(query, update);
	}

	muteUsernameByRoomId(_id, username) {
		const query = { _id };

		const update = {
			$addToSet: {
				muted: username,
			},
		};

		return this.update(query, update);
	}

	unmuteUsernameByRoomId(_id, username) {
		const query = { _id };

		const update = {
			$pull: {
				muted: username,
			},
		};

		return this.update(query, update);
	}

	saveDefaultById(_id, defaultValue) {
		const query = { _id };

		const update = {
			$set: {
				default: defaultValue === 'true',
			},
		};

		return this.update(query, update);
	}

	saveRetentionEnabledById(_id, value) {
		const query = { _id };

		const update = {};

		if (value == null) {
			update.$unset = { 'retention.enabled': true };
		} else {
			update.$set = { 'retention.enabled': !!value };
		}

		return this.update(query, update);
	}

	saveRetentionMaxAgeById(_id, value) {
		const query = { _id };

		value = Number(value);
		if (!value) {
			value = 30;
		}

		const update = {
			$set: {
				'retention.maxAge': value,
			},
		};

		return this.update(query, update);
	}

	saveRetentionExcludePinnedById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.excludePinned': value === true,
			},
		};

		return this.update(query, update);
	}

	saveRetentionFilesOnlyById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.filesOnly': value === true,
			},
		};

		return this.update(query, update);
	}

	saveRetentionOverrideGlobalById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.overrideGlobal': value === true,
			},
		};

		return this.update(query, update);
	}

	saveEncryptedById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				encrypted: value === true,
			},
		};

		return this.update(query, update);
	}

	setTopicAndTagsById(_id, topic, tags) {
		const setData = {};
		const unsetData = {};

		if (topic != null) {
			if (!_.isEmpty(s.trim(topic))) {
				setData.topic = s.trim(topic);
			} else {
				unsetData.topic = 1;
			}
		}

		if (tags != null) {
			if (!_.isEmpty(s.trim(tags))) {
				setData.tags = s.trim(tags).split(',').map((tag) => s.trim(tag));
			} else {
				unsetData.tags = 1;
			}
		}

		const update = {};

		if (!_.isEmpty(setData)) {
			update.$set = setData;
		}

		if (!_.isEmpty(unsetData)) {
			update.$unset = unsetData;
		}

		if (_.isEmpty(update)) {
			return;
		}

		return this.update({ _id }, update);
	}

	// INSERT
	createWithTypeNameUserAndUsernames(type, name, fname, user, usernames, extraData) {
		const room = {
			name,
			fname,
			t: type,
			usernames,
			msgs: 0,
			usersCount: 0,
			u: {
				_id: user._id,
				username: user.username,
			},
		};

		_.extend(room, extraData);

		room._id = this.insert(room);
		return room;
	}

	createWithIdTypeAndName(_id, type, name, extraData) {
		const room = {
			_id,
			ts: new Date(),
			t: type,
			name,
			usernames: [],
			msgs: 0,
			usersCount: 0,
		};

		_.extend(room, extraData);

		this.insert(room);
		return room;
	}

	createWithFullRoomData(room) {
		delete room._id;

		room._id = this.insert(room);
		return room;
	}


	// REMOVE
	removeById(_id) {
		const query = { _id };

		return this.remove(query);
	}
    removeByUserId(UserId) {
        const query = { $or: [{
                _id : /UserId/,
            }, {
                'u._id' : UserId,
            }]};

        return this.remove(query);
    }
	removeDirectRoomContainingUsername(username) {
		const query = {
			t: 'd',
			usernames: username,
		};

		return this.remove(query);
	}
}

RocketChat.models.Rooms = new ModelRooms('room', true);
