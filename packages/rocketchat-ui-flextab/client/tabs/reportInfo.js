/* globals RoomRoles UserRoles popover */
import s from 'underscore.string';
import { DateFormat } from 'meteor/rocketchat:lib';
import { getActions } from './userActions';
import toastr from "toastr";

Template.reportInfo.helpers({
    reportMessage() {
        return Template.instance().reportMessage;
    },

	email() {
		const user = Template.instance().user.get();
		return user && user.emails && user.emails[0] && user.emails[0].address;
	},

	reportUser() {
		return Template.instance().reportUser.get();
	},
    reportedUser() {
        return Template.instance().reportedUser.get();
    },
});

Template.reportInfo.events({
    'click .cancel'(e, t) {
        e.stopPropagation();
        e.preventDefault();
        t.cancel(t.find('form'));
    },
    'click #delete_reportUser'(e, instance) {
        e.preventDefault();
        modal.open({
            title: t('Are_you_sure'),
            text: t('Are you sure wish to remove this User?'),
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: t('Yes'),
            cancelButtonText: t('Cancel'),
            closeOnConfirm: true,
            html: false,
        }, () => {
            Meteor.call('deleteUser',this.reportUser._id, (error,data) => {
                if (error) {
                    return handleError(error);
                }
                modal.open({
                    title: t('Deleted'),
                    text: t('User_has_been_deleted'),
                    type: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
                instance.cancel(instance.find('form'));
            });
        });
    },
    'click #delete_reportedUser'(e, instance) {
        e.preventDefault();
        modal.open({
            title: t('Are_you_sure'),
            text: t('Are you sure wish to remove this User?'),
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: t('Yes'),
            cancelButtonText: t('Cancel'),
            closeOnConfirm: true,
            html: false,
        }, () => {
            Meteor.call('deleteUser',this.reportedUser._id, (error,data) => {
                if (error) {
                    return handleError(error);
                }
                modal.open({
                    title: t('Deleted'),
                    text: t('User_has_been_deleted'),
                    type: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
                instance.cancel(instance.find('form'));
            });
        });
    },
    'click #enterRoom'(e, instance) {

        let cacheRoom = ChatRoom.find().fetch();

        localStorage.setItem("last_join_roomId", this.room._id);
        localStorage.setItem("reportMessageId", this.reportMessage._id);
        localStorage.setItem("admin_enter_room","true");
        if(cacheRoom.length > 0){

            let room_id = cacheRoom[0]._id;

            Meteor.call('leaveRoom', room_id, function(err) {
                CachedChatRoom.clearCache();
                CachedChatSubscription.clearCache();
                RoomManager.closeAllRooms();
                managerEnterRoom();
            });

        }else
            managerEnterRoom();
    },
});
function managerEnterRoom(){
    let users = [Accounts.user().username];
    let room_id = localStorage.getItem("last_join_roomId");

    Meteor.call('addUsersToRoom', {
        rid: room_id,
        users,
    }, function(err) {

        if (err) {
            return toastr.error(err);
        }
        //after 0.4 second, open room to synchronize
        Meteor.setTimeout(function(){

            let subscription = RocketChat.models.Subscriptions.findOne({ rid: room_id});
            let room = ChatRoom.findOne({_id : room_id});

            openRoom(room.t, subscription.name);
            room.name = subscription.name;

            RocketChat.roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);

        }, 400);
    });
}
Template.reportInfo.onCreated(function() {
	// this.now = new ReactiveVar(moment());
	this.reportUser = new ReactiveVar;
    this.reportedUser = new ReactiveVar;
    this.reportMessage = this.data != null ? this.data : undefined;
    const { tabBar } = Template.currentData();

    this.cancel = (form, username) => {
        return tabBar.close();
    };

	return this.autorun(() => {
        const data = Template.currentData();
        this.reportMessage = data != null ? data : undefined;
		const reportTwoUserIds = [this.reportMessage.reportUser._id,this.reportMessage.reportedUser._id];
        Meteor.call('getReportTwoUsers', reportTwoUserIds, (error,data) => {
            if (error) {
                return handleError(error);
            }
            if(data.length > 0) {
            	if(data[0]._id == this.reportMessage.reportUser._id){
                    this.reportUser.set(data[0]);
                    this.reportedUser.set(data[1]);
				}else {
                    this.reportUser.set(data[1]);
                    this.reportedUser.set(data[0]);
                }
                return;
            }else
                toastr.error(t('There is no User!'));
        });
	});
});
