/* globals fireGlobalEvent readMessage currentTracker*/
import _ from 'underscore';

currentTracker = undefined;

function openRoom(type, name) {
	Session.set('openedRoom', null);

	// return;
	return Meteor.defer(() =>
		currentTracker = Tracker.autorun(function(c) {
			const user = Meteor.user();
			if ((user && user.username == null) || (user == null && RocketChat.settings.get('Accounts_AllowAnonymousRead') === false)) {
				BlazeLayout.render('main');
				return;
			}

			if (RoomManager.open(type + name).ready() !== true) {
				BlazeLayout.render('main', { modal: RocketChat.Layout.isEmbedded(), center: 'loading' });
				return;
			}
			if (currentTracker) {
				currentTracker = undefined;
			}
			c.stop();
		//^^^^^^^^^^^^^^^^^ open Room in client ^^^^^^^^^^^^^^^/123qwe123qwe
		// 	console.log("beforeFindRoom:",type+":"+name+":"+user);
			const room = RocketChat.roomTypes.findRoom(type, name, user);
			if (room == null) {
				if (type === 'd') {
					// console.log("beforeCreateDirectmessage!");
					Meteor.call('createDirectMessage', name, function(error) {
						if (!error) {
							RoomManager.close(type + name);
							return openRoom('d', name);
						} else {
							Session.set('roomNotFound', { type, name, error });
							BlazeLayout.render('main', { center: 'roomNotFound' });
							return;
						}
					});
				} else {
					// console.log("NoRoom!");
					Meteor.call('getRoomByTypeAndName', type, name, function(error, record) {
						if (error) {
                            // console.log("getRoomByTypeAndName Error!");
							Session.set('roomNotFound', { type, name, error });
							return BlazeLayout.render('main', { center: 'roomNotFound' });
						} else {
							// console.log("getRoomByTypeAndName(record):",record);
							RocketChat.models.Rooms.upsert({ _id: record._id }, _.omit(record, '_id'));
							RoomManager.close(type + name);
							return openRoom(type, name);
						}
					});
				}
				return;
			}

			const mainNode = document.querySelector('.main-content');
			if (mainNode) {
				for (const child of Array.from(mainNode.children)) {
					if (child) { mainNode.removeChild(child); }
				}
				const roomDom = RoomManager.getDomOfRoom(type + name, room._id);
				mainNode.appendChild(roomDom);
				if (roomDom.classList.contains('room-container')) {
					roomDom.querySelector('.messages-box > .wrapper').scrollTop = roomDom.oldScrollTop;
				}
			}
			// console.log("roomOpened:",room);
			Session.set('openedRoom', room._id);
			RocketChat.openedRoom = room._id;

			fireGlobalEvent('room-opened', _.omit(room, 'usernames'));

			Session.set('editRoomTitle', false);
			// console.log("updateMentionMarkOfRoom:",type+name);
			RoomManager.updateMentionsMarksOfRoom(type + name);
			Meteor.setTimeout(() => readMessage.readNow(), 2000);
			// KonchatNotification.removeRoomNotification(params._id)
			// update user's room subscription
			const sub = ChatSubscription.findOne({ rid: room._id });
			// console.log("getRoomForopendRoom:",sub);
			if (sub && sub.open === false) {
				Meteor.call('openRoom', room._id, function(err) {
					if (err) {
						return handleError(err);
					}
				});
			}

			if(localStorage.getItem("reportMessageId")){

				var reportMessageId = localStorage.getItem("reportMessageId");
                localStorage.removeItem("reportMessageId");

                const msg = { _id: reportMessageId, rid: room._id };
                RoomHistoryManager.getSurroundingMessages(msg);

            }else if(FlowRouter.getQueryParam('msg')) {

				const msg = { _id: FlowRouter.getQueryParam('msg'), rid: room._id };
				RoomHistoryManager.getSurroundingMessages(msg);
			}
            // console.log("before enter-room");
			return RocketChat.callbacks.run('enter-room', sub);
		})
	);
}
export { openRoom };
this.openRoom = openRoom;
