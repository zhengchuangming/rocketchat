import _ from 'underscore';
import s from 'underscore.string';

import { RocketChatTabBar } from 'meteor/rocketchat:lib';
import toastr from "toastr";
// var Allsites = new Mongo.Collection('rocketchat_registered_sites');
Template.adminReports.helpers({
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
	Reports() {
		return Template.instance().Reports();
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
});

Template.adminReports.onCreated(function() {
	const instance = this;
	// Declare a collection to hold the count object.

	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.ready = new ReactiveVar(true);
	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	this.tabBarData = new ReactiveVar;
	//
	RocketChat.TabBar.addButton({
		groups: ['admin-reports'],
        id: 'admin-reportInfo',
        i18nTitle: 'Report_Info',
        icon: 'user',
        template: 'reportInfo',
        order: 3,
	});

	this.autorun(function() {

		const filter = instance.filter.get();
		const limit = instance.limit.get();
        const subscription = Meteor.subscribe('reportMessages',filter,limit);
        const subscriptionUser = instance.subscribe('fullUserData', '', limit);
        instance.ready.set(subscription.ready());
	});

	this.Reports = function() {
		return RocketChat.models.ReportMessages.find();
	};
});

Template.adminReports.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

Template.adminReports.events({
	'keydown #users-filter'(e) {
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},
	'keyup #Reports-filter'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	},
    'click #delete_reportMessage'(e, instance) {
        e.preventDefault();
        modal.open({
            title: t('Are_you_sure'),
            text: t('Are_you_sure_wish_to_remove_this_reportMessage'),
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: t('Yes'),
            cancelButtonText: t('Cancel'),
            closeOnConfirm: true,
            html: false,
        }, () => {
            Meteor.call('deleteReportMessage', this._id , (error) => {
                if (error) {
                    return toastr.error(t(error.error));
                }
                toastr.success(t("Successfully removed"));
            });
        });
    },
	'click .reportInfo_td'(e, instance) {
		e.preventDefault();
        instance.tabBarData.set(RocketChat.models.ReportMessages.findOne(this._id));
		instance.tabBar.open('admin-reportInfo');
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
