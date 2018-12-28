/* globals AdminChatRoom */
import toastr from 'toastr';
Template.adminRoomInfo.helpers({
	selectedRoom() {
		return Session.get('adminRoomsSelected');
	},
	canEdit() {
		return RocketChat.authz.hasAllPermission('edit-room', this.rid);
	},
	editing(field) {
		return Template.instance().editing.get() === field;
	},
	notDirect() {
		const room = AdminChatRoom.findOne(this.rid, { fields: { t: 1 } });
		return room && room.t !== 'd';
	},
	roomType() {
		const room = AdminChatRoom.findOne(this.rid, { fields: { t: 1 } });
		return room && room.t;
	},
	channelSettings() {
		return RocketChat.ChannelSettings.getOptions(undefined, 'admin-room');
	},
	roomTypeDescription() {
		const room = AdminChatRoom.findOne(this.rid, { fields: { t: 1 } });
		const roomType = room && room.t;
		if (roomType === 'c') {
			return t('Channel');
		} else if (roomType === 'p') {
			return t('Private_Group');
		}
	},
	roomName() {
		const room = AdminChatRoom.findOne(this.rid, { fields: { name: 1 } });
		return room && room.name;
	},
	roomTopic() {
		const room = AdminChatRoom.findOne(this.rid, { fields: { topic: 1 } });
		return room && room.topic;
	},
	archivationState() {
		const room = AdminChatRoom.findOne(this.rid, { fields: { archived: 1 } });
		return room && room.archived;
	},
	archivationStateDescription() {
		const room = AdminChatRoom.findOne(this.rid, { fields: { archived: 1 } });
		const archivationState = room && room.archived;
		if (archivationState === true) {
			return t('Room_archivation_state_true');
		} else {
			return t('Room_archivation_state_false');
		}
	},
	canDeleteRoom() {
		const room = AdminChatRoom.findOne(this.rid, { fields: { t: 1 } });
		const roomType = room && room.t;
		return (roomType != null) && RocketChat.authz.hasAtLeastOnePermission(`delete-${ roomType }`);
	},
	readOnly() {
		const room = AdminChatRoom.findOne(this.rid, { fields: { ro: 1 } });
		return room && room.ro;
	},
	readOnlyDescription() {
		const room = AdminChatRoom.findOne(this.rid, { fields: { ro: 1 } });
		const readOnly = room && room.ro;

		if (readOnly === true) {
			return t('True');
		} else {
			return t('False');
		}
	},
});

Template.adminRoomInfo.events({
    'click .delete'() {
        modal.open({
            title: t('Are_you_sure'),
            text: t('Delete_Room_Warning'),
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: t('Yes_delete_it'),
            cancelButtonText: t('Cancel'),
            closeOnConfirm: false,
            html: false,
        }, () => {
            Meteor.call('eraseRoom', this.rid, function(error) {
                if (error) {
                    handleError(error);
                } else {
                    modal.open({
                        title: t('Deleted'),
                        text: t('Room_has_been_deleted'),
                        type: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                }
            });
        });
    },
    'click .enterRoom'() {
        console.log("chatRoomBefore:",ChatRoom.find().fetch());

		let cacheRoom = ChatRoom.find().fetch();
        let cacheSubscription = RocketChat.models.Subscriptions.find().fetch();

        localStorage.setItem("last_join_roomId", this.rid);

		if(cacheRoom.length > 0){
            let room_id = cacheRoom[0]._id;
            console.log("chatRoom exist!!!",room_id);
            Meteor.call('leaveRoom', room_id, function(err) {
                // RocketChat.models.Subscriptions.remove({_id:cacheSubscription._id});
                // ChatRoom.remove({_id:cacheRoom._id});
                CachedChatRoom.clearCache();
                CachedChatSubscription.clearCache();
                RoomManager.closeAllRooms();
                managerEnterRoom();
            });
			// Meteor.call('removeUserFromRoom', {rid:room_id,username:cacheSubscription[0].u.username}, function(err) {
            //     RocketChat.models.Subscriptions.remove({_id:cacheSubscription._id});
            //     ChatRoom.remove({_id:cacheRoom._id});
            //     managerEnterRoom();
            // });
		}else
            managerEnterRoom();
    },
	'keydown input[type=text]'(e, t) {
		if (e.keyCode === 13) {
			e.preventDefault();
			t.saveSetting(this.rid);
		}
	},
	'click [data-edit]'(e, t) {
		e.preventDefault();
		t.editing.set($(e.currentTarget).data('edit'));
		return setTimeout((function() {
			t.$('input.editing').focus().select();
		}), 100);
	},
	'click .cancel'(e, t) {
		e.preventDefault();
		t.editing.set();
	},
	'click .save'(e, t) {
		e.preventDefault();
		t.saveSetting(this.rid);
	},
});
function managerEnterRoom(){
    let users = [Accounts.user().username];
    let room_id = localStorage.getItem("last_join_roomId");
	// console.log("RoomId_to_open:",room_id);
    Meteor.call('addUsersToRoom', {
        rid: room_id,
        users,
    }, function(err) {

        if (err) {
            return toastr.error(err);
        }
		//after 0.4 second, open room to synchronize
        Meteor.setTimeout(function(){

            // console.log("CurrentCacheRoom:",ChatRoom.find().fetch());
            // console.log("CurrentCacheSubscription:",RocketChat.models.Subscriptions.find().fetch());
            // console.log("findRoom:",room);

            let subscription = RocketChat.models.Subscriptions.findOne({ rid: room_id});
            let room = ChatRoom.findOne({_id : room_id});

            openRoom(room.t, subscription.name);
            room.name = subscription.name;
            RocketChat.roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
        }, 400);
    });
}
Template.adminRoomInfo.onCreated(function() {
	this.editing = new ReactiveVar;
	this.validateRoomType = () => {
		const type = this.$('input[name=roomType]:checked').val();
		if (type !== 'c' && type !== 'p') {
			toastr.error(t('error-invalid-room-type', { type }));
		}
		return true;
	};
	this.validateRoomName = (rid) => {
		const room = AdminChatRoom.findOne(rid);
		let nameValidation;
		if (!RocketChat.authz.hasAllPermission('edit-room', rid) || (room.t !== 'c' && room.t !== 'p')) {
			toastr.error(t('error-not-allowed'));
			return false;
		}
		name = $('input[name=roomName]').val();
		try {
			nameValidation = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
		} catch (_error) {
			nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
		}
		if (!nameValidation.test(name)) {
			toastr.error(t('error-invalid-room-name', {
				room_name: name,
			}));
			return false;
		}
		return true;
	};
	this.validateRoomTopic = () => true;
	this.saveSetting = (rid) => {
		switch (this.editing.get()) {
			case 'roomName':
				if (this.validateRoomName(rid)) {
					RocketChat.callbacks.run('roomNameChanged', AdminChatRoom.findOne(rid));
					Meteor.call('saveRoomSettings', rid, 'roomName', this.$('input[name=roomName]').val(), function(err) {
						if (err) {
							return handleError(err);
						}
						toastr.success(TAPi18n.__('Room_name_changed_successfully'));
					});
				}
				break;
			case 'roomTopic':
				if (this.validateRoomTopic(rid)) {
					Meteor.call('saveRoomSettings', rid, 'roomTopic', this.$('input[name=roomTopic]').val(), function(err) {
						if (err) {
							return handleError(err);
						}
						toastr.success(TAPi18n.__('Room_topic_changed_successfully'));
						RocketChat.callbacks.run('roomTopicChanged', AdminChatRoom.findOne(rid));
					});
				}
				break;
			case 'roomAnnouncement':
				if (this.validateRoomTopic(rid)) {
					Meteor.call('saveRoomSettings', rid, 'roomAnnouncement', this.$('input[name=roomAnnouncement]').val(), function(err) {
						if (err) {
							return handleError(err);
						}
						toastr.success(TAPi18n.__('Room_announcement_changed_successfully'));
						RocketChat.callbacks.run('roomAnnouncementChanged', AdminChatRoom.findOne(rid));
					});
				}
				break;
			case 'roomType':
				const val = this.$('input[name=roomType]:checked').val();
				if (this.validateRoomType(rid)) {
					RocketChat.callbacks.run('roomTypeChanged', AdminChatRoom.findOne(rid));
					const saveRoomSettings = function() {
						Meteor.call('saveRoomSettings', rid, 'roomType', val, function(err) {
							if (err) {
								return handleError(err);
							} else {
								toastr.success(TAPi18n.__('Room_type_changed_successfully'));
							}
						});
					};
					if (!AdminChatRoom.findOne(rid, { fields: { default: 1 } }).default) {
						return saveRoomSettings();
					}
					modal.open({
						title: t('Room_default_change_to_private_will_be_default_no_more'),
						type: 'warning',
						showCancelButton: true,
						confirmButtonColor: '#DD6B55',
						confirmButtonText: t('Yes'),
						cancelButtonText: t('Cancel'),
						closeOnConfirm: true,
						html: false,
					}, function(confirmed) {
						return !confirmed || saveRoomSettings();
					});
				}
				break;
			case 'archivationState':
				const room = AdminChatRoom.findOne(rid);
				if (this.$('input[name=archivationState]:checked').val() === 'true') {
					if (room && room.archived !== true) {
						Meteor.call('archiveRoom', rid, function(err) {
							if (err) {
								return handleError(err);
							}
							toastr.success(TAPi18n.__('Room_archived'));
							RocketChat.callbacks.run('archiveRoom', AdminChatRoom.findOne(rid));
						});
					}
				} else if ((room && room.archived) === true) {
					Meteor.call('unarchiveRoom', rid, function(err) {
						if (err) {
							return handleError(err);
						}
						toastr.success(TAPi18n.__('Room_unarchived'));
						RocketChat.callbacks.run('unarchiveRoom', AdminChatRoom.findOne(rid));
					});
				}
				break;
			case 'readOnly':
				Meteor.call('saveRoomSettings', rid, 'readOnly', this.$('input[name=readOnly]:checked').val() === 'true', function(err) {
					if (err) {
						return handleError(err);
					}
					toastr.success(TAPi18n.__('Read_only_changed_successfully'));
				});
		}
		this.editing.set();
	};
});
