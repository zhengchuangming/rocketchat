import _ from 'underscore';
import s from 'underscore.string';

import { RocketChatTabBar } from 'meteor/rocketchat:lib';
import toastr from "toastr";
var Allsites = new Mongo.Collection('rocketchat_registered_sites');
Template.adminSites.helpers({
	isReady() {
		const instance = Template.instance();
		return instance.ready && instance.ready.get();
	},
	sites() {
		return Template.instance().sites();
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

Template.adminSites.onCreated(function() {
	const instance = this;
	// Declare a collection to hold the count object.

	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.ready = new ReactiveVar(true);
	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	this.tabBarData = new ReactiveVar;
	RocketChat.TabBar.addButton({
		groups: ['admin-sites'],
		id: 'add-site',
		i18nTitle: 'Add_Site',
		icon: 'plus',
		template: 'siteAdd',
		order: 2,
	});
	RocketChat.TabBar.addButton({
		groups: ['admin-sites'],
		id: 'edit-site',
		i18nTitle: 'edit-site',
		icon: 'edit',
		template: 'siteEdit',
		order: 3,
	});
	this.autorun(function() {

		// const filter = instance.filter.get();
		// const limit = instance.limit.get();
		Meteor.subscribe('getSites');
		// instance.ready.set(subscription.ready());
	});
	this.sites = function() {
		// let filter;
		// let query;
		//
		// if (instance.filter && instance.filter.get()) {
		// 	filter = s.trim(instance.filter.get());
		// }
		//
		// if (filter) {
		// 	const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
		// 	query = { $or: [{ username: filterReg }, { name: filterReg }, { 'emails.address': filterReg }] };
		// } else {
		// 	query = {};
		// }
		// query.type = {
		// 	$in: ['user', 'bot'],
		// };
		// const limit = instance.limit && instance.limit.get();
		return Allsites.find();
	};
});

Template.adminSites.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

Template.adminSites.events({
	'keydown #users-filter'(e) {
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},
	'keyup #users-filter'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	},
    'click #invite_siteManager'(e, instance) {
        e.preventDefault();
        modal.open({
            title: t('Are_you_sure'),
            text: t('Are you sure wish to invite siteManager of ' + this._id +'?'),
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: t('Yes'),
            cancelButtonText: t('Cancel'),
            closeOnConfirm: true,
            html: false,
        }, () => {
            Meteor.call('inviteSiteManager', this._id , (error) => {
                if (error) {
                    return toastr.error(t(error.error));
                }
                toastr.success("Successfully e-mail was transformed");
            });
        });
        // instance.tabBarData.set(Allsites.findOne(this._id));
        // instance.tabBar.open('edit-site');
    },
    'click #delete_site'(e, instance) {
        e.preventDefault();
        modal.open({
            title: t('Are_you_sure'),
            text: t('Are you sure wish to remove this site?'),
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: t('Yes'),
            cancelButtonText: t('Cancel'),
            closeOnConfirm: true,
            html: false,
        }, () => {
            Meteor.call('deleteSite', this._id , (error) => {
                if (error) {
                    return toastr.error(t(error.error));
                }
                toastr.success("Successfully removed");
            });
        });
        // instance.tabBarData.set(Allsites.findOne(this._id));
        // instance.tabBar.open('edit-site');
    },
	'click .siteInfo_td'(e, instance) {
		e.preventDefault();
		instance.tabBarData.set(Allsites.findOne(this._id));
		instance.tabBar.open('edit-site');
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
