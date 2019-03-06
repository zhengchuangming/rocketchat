import _ from 'underscore';
import s from 'underscore.string';

import { RocketChatTabBar } from 'meteor/rocketchat:lib';
import toastr from "toastr";
// var Allsites = new Mongo.Collection('rocketchat_registered_sites');
Template.adminKpi.helpers({
    isSuperAdmin(){
        if(Accounts.user().roles.toString().indexOf('admin') > -1)
            return true;
        else
            return false;
    },
	isReady() {
		const instance = Template.instance();
		return instance.ready && instance.ready.get();
	},
	siteKeys() {
		return Template.instance().siteKeys();
	},
	isLoading() {
		const instance = Template.instance();
		if (!(instance.ready && instance.ready.get())) {
			return 'btn-loading';
		}
	},
	hasMore() {
		const instance = Template.instance();
		const users = instance.users();
		if (instance.limit && instance.limit.get() && users && users.length) {
			return instance.limit.get() === users.length;
		}
	},
	emailAddress() {
		return _.map(this.emails, function(e) { return e.address; }).join(', ');
	},
	flexData() {
		return {
			tabBar: Template.instance().tabBar,
			data: Template.instance().tabBarData.get(),
		};
	},
	getUserCount(){
    	return Template.instance().kpiData.get().userCount;
	},
    getUserOnlineCount(){
        return Template.instance().kpiData.get().userOnlineCount;
    },
    getRoomCount(){
        return Template.instance().kpiData.get().roomCount;
    },
    getMessageCount(){
        return Template.instance().kpiData.get().messageCount;
    },
    getSiteCount(){
        return Template.instance().kpiData.get().siteCount;
    },
    getSiteKeyCount(){
        return Template.instance().kpiData.get().siteKeyCount;
    },
    getBanCount(){
        return Template.instance().kpiData.get().banCount;
    },
    getKpiData(){
        return Template.instance().kpiData.get().kpiTimelineData;
	}
});

Template.adminKpi.onCreated(function() {

	const instance = this;

	// Declare a collection to hold the count object.

    this.kpiData = new ReactiveVar;
    return this.autorun(() => {
        Meteor.call('getKpi', '' , (error,result) => {
            if (error) {
                return toastr.error(t(error.error));
            }

            this.kpiData.set(result);

            window.ShowKpiTimeline(result.kpiTimelineData);

            if(Accounts.user().roles.toString().indexOf('admin') > -1 == false)
            	window.ShowUserCountBySiteKey(result.userCountBySiteKey);

        });
	});
});

Template.adminKpi.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

Template.adminKpi.events({
	'keydown #users-filter'(e) {
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},
	'keyup #siteKeys-filter'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	},
    'click #delete_siteKey'(e, instance) {
        e.preventDefault();
        modal.open({
            title: t('Are_you_sure'),
            text: t('Are_you_sure_wish_to_remove_this_siteKey?'),
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: t('Yes'),
            cancelButtonText: t('Cancel'),
            closeOnConfirm: true,
            html: false,
        }, () => {
            Meteor.call('deleteSiteKey', this.key , (error) => {
                if (error) {
                    return toastr.error(t(error.error));
                }
                toastr.success(t("Successfully removed"));
            });
        });
    },
	'click .siteKeyInfo_td'(e, instance) {
		e.preventDefault();
        if(Accounts.user().roles.toString().indexOf('admin') > -1 != true){
			instance.tabBarData.set(RocketChat.models.SiteKeys.findOne({'key':this.key}));
			instance.tabBar.open('edit-siteKey');
        }
	},
	'click .info-tabs button'(e) {
		e.preventDefault();
		$('.info-tabs button').removeClass('active');
		$(e.currentTarget).addClass('active');
		$('.user-info-content').hide();
		$($(e.currentTarget).attr('href')).show();
	},
	'click .load-more'(e, t) {
		e.preventDefault();
		e.stopPropagation();
		t.limit.set(t.limit.get() + 50);
	},
});
