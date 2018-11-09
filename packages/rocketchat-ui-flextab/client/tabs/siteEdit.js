import toastr from 'toastr';
import s from 'underscore.string';
import {getActions} from "./userActions";

Template.siteEdit.helpers({

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

Template.siteEdit.events({
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
		t.save(e.currentTarget);

	},

});

Template.siteEdit.onCreated(function() {
	this.site = this.data != null ? this.data : undefined;
	this.roles = this.user ? new ReactiveVar(this.user.roles) : new ReactiveVar([]);

	this.save = (form) => {
		// if (!this.validate()) {
		// 	return;
		// }
		const siteData = this.getSiteData();
		//check invite and status

        if(siteData.invite == false && siteData.status == true) {
            toastr.error(t('Site manager is not invited yet!'));
            siteData.status = false;
        }

		Meteor.call('updateSite', siteData, (error,data) => {
			if (error) {
				return handleError(error);
			}
			if(data == "exist") {
                toastr.error(t('Same siteurl is alreay exist!'));
                return;
            }else
				toastr.success(t('Site_updated_successfully'));
			this.cancel(form, '');
		});
	};

	this.getSiteData = () => {
		const siteData = { _id: (this.site != null ? this.site._id : undefined) };
		siteData.changed_id = s.trim(this.$('#site_url').val());
		siteData.email = s.trim(this.$('#email').val());
		siteData.status = this.$('#status:checked').length > 0;
		siteData.invite = this.site.invite;
		return siteData;
	};

	const { tabBar } = Template.currentData();

	this.cancel = (form, username) => {
		// form.reset();
		// this.$('input[type=checkbox]').prop('checked', true);
		// if (this.site) {
		// 	return this.data.back(username);
		// } else {
			return tabBar.close();
		// }
	};

	this.autorun(() => {
		const data = Template.currentData();
		if (data.clear != null) {
			return this.clear = data.clear;
		}
	});

	return this.autorun(() => {
		const data = Template.currentData();
		this.site = data != null ? data : undefined;
		// return this.site.set(user);
	});
});
