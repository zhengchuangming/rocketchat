import toastr from 'toastr';
import s from 'underscore.string';
import {getActions} from "./userActions";

Template.siteKeyAdd.helpers({
	disabled(cursor) {
		return cursor.count() === 0 ? 'disabled' : '';
	},
    getAccountUser(){
        return Accounts.user();
    },
	canEditOrAdd() {
		return (Template.instance().user && RocketChat.authz.hasAtLeastOnePermission('edit-other-user-info')) || (!Template.instance().user && RocketChat.authz.hasAtLeastOnePermission('create-user'));
	},

	site() {
		return Template.instance().site;
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

Template.siteKeyAdd.events({
	'click .cancel'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.roles.set([]);
		t.cancel(t.find('form'));
	},
    'click .generate_key'(e, t) {
        e.stopPropagation();
        e.preventDefault();
        var key = Random.id();
        Meteor.call('isExistSiteKey', key, (result) => {
		//if duplicated key exist, try generating again
            if (result == "true")
                key = Random.id();
            $('#key').val(key);
        });
    },
	'submit form'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.add(e.currentTarget);

	},

});

Template.siteKeyAdd.onCreated(function() {
	this.site = null;
	this.roles = this.user ? new ReactiveVar(this.user.roles) : new ReactiveVar([]);
    this.add = (form) => {
		// if (!this.validate()) {
		// 	return;
		// }
        if (this.$('#key').val() == '') {
            toastr.error(t('Key_was_not_generated'));
            return;
        }
		const siteKeyData = this.getSiteKeyData();

		Meteor.call('insertSiteKey', siteKeyData, (error,data) => {
			if (error) {
                return handleError(error);
			}
			if(data == "duplicated"){
                toastr.error(t('duplicated_Key_or_KeyName_exists'));
                return;
			}
			toastr.success(t('added_siteKey_successfully'));
			this.cancel(form, '');
		});
	};

	this.getSiteKeyData = () => {
		const siteKeyData = {site_id : s.trim(this.$('#site_url').val())};
        siteKeyData.key = s.trim(this.$('#key').val());
        siteKeyData.memo = s.trim(this.$('#memo').val());
        siteKeyData.status = this.$('#status:checked').length > 0;
		return siteKeyData;
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
