import toastr from 'toastr';
import s from 'underscore.string';
import {getActions} from "./userActions";

Template.siteAdd.helpers({

	disabled(cursor) {
		return cursor.count() === 0 ? 'disabled' : '';
	},
	canEditOrAdd() {
		return (Template.instance().user && RocketChat.authz.hasAtLeastOnePermission('edit-other-user-info')) || (!Template.instance().user && RocketChat.authz.hasAtLeastOnePermission('create-user'));
	},

	site() {
		return Template.instance().site;
	},

	requirePasswordChange() {
		return !Template.instance().user || Template.instance().user.requirePasswordChange;
	},

	role() {
		const roles = Template.instance().roles.get();
		return RocketChat.models.Roles.find({ _id: { $nin:roles }, scope: 'Users' }, { sort: { description: 1, _id: 1 } });
	},

	userRoles() {
		return Template.instance().roles.get();
	},

	name() {
		return this.description || this._id;
	},
});

Template.siteAdd.events({
	'click .cancel'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.roles.set([]);
		t.cancel(t.find('form'));
	},

	'click .remove-role'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		let roles = t.roles.get();
		roles = roles.filter((el) => el !== this.valueOf());
		t.roles.set(roles);
		$(`[title=${ this }]`).remove();
	},

	'click #randomPassword'(e) {
		e.stopPropagation();
		e.preventDefault();
		e.target.classList.add('loading');
		$('#password').val('');
		setTimeout(() => {
			$('#password').val(Random.id());
			e.target.classList.remove('loading');
		}, 1000);
	},

	'mouseover #password'(e) {
		e.target.type = 'text';
	},

	'mouseout #password'(e) {
		e.target.type = 'password';
	},

	'click #addRole'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		if ($('#roleSelect').find(':selected').is(':disabled')) {
			return;
		}
		const userRoles = [...instance.roles.get()];
		userRoles.push($('#roleSelect').val());
		instance.roles.set(userRoles);
		$('#roleSelect').val('placeholder');
	},

	'submit form'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.add(e.currentTarget);

	},

});

Template.siteAdd.onCreated(function() {
	this.site = null;
	this.roles = this.user ? new ReactiveVar(this.user.roles) : new ReactiveVar([]);

	this.add = (form) => {
		// if (!this.validate()) {
		// 	return;
		// }
		const siteData = this.getSiteData();
		console.log("changed_id",siteData.changed_id);
		console.log("email",siteData.email);
		console.log("status",siteData.status);
		console.log("invite",siteData.invite);
		//
		Meteor.call('insertSite', siteData, (error) => {
			if (error == "duplicated") {
				toastr.error(t('duplicated url exist'));
				return;
			}
			toastr.success(t('add site successfully'));
			this.cancel(form, '');
		});
	};

	this.getSiteData = () => {
		const siteData = {_id : s.trim(this.$('#site_url').val())};
		siteData.email = s.trim(this.$('#email').val());
		siteData.status = this.$('#status:checked').length > 0;
		siteData.invite = false;
		return siteData;
	};

	const { tabBar } = Template.currentData();

	this.cancel = (form, site) => {
		// form.reset();
		// this.$('input[type=checkbox]').prop('checked', true);
		// if (this.site) {
		// 	return this.data.back(username);
		// } else {
		return tabBar.close();
		// }
	};

});
