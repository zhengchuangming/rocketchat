import toastr from 'toastr';
import s from 'underscore.string';
import {getActions} from "./userActions";

Template.siteKeyEdit.helpers({

	disabled(cursor) {
		return cursor.count() === 0 ? 'disabled' : '';
	},
	canEditOrAdd() {
		return (Template.instance().user && RocketChat.authz.hasAtLeastOnePermission('edit-other-user-info')) || (!Template.instance().user && RocketChat.authz.hasAtLeastOnePermission('create-user'));
	},
    getAccountUser(){
        return Accounts.user();
    },
	siteKey() {
		return Template.instance().siteKey;
	},
	name() {
		return this.description || this._id;
	},
});

Template.siteKeyEdit.events({
	'click .cancel'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.cancel(t.find('form'));
	},

	'submit form'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.save(e.currentTarget);

	},

});

Template.siteKeyEdit.onCreated(function() {
	// this.siteKey = this.data != null ? this.data : undefined;
	this.save = (form) => {
		// if (!this.validate()) {
		// 	return;
		// }
		const siteKeyData = this.getSiteKeyData();

		Meteor.call('updateSiteKey', siteKeyData, (error,data) => {
			if (error) {
				return handleError(error);
			}
			if(data == "-1") {
                toastr.error(t('Save fail!'));
                return;
            }else if(data == "duplicated"){
                toastr.error(t('KeyName duplicated!'));
                return;
			}else
				toastr.success(t('Updated successfully'));
			this.cancel(form, '');
		});
	};

	this.getSiteKeyData = () => {
        const siteKeyData = {'key':s.trim(this.$('#key').val())};
        siteKeyData.site_id = s.trim(this.$('#site_url').val());
        siteKeyData.memo = s.trim(this.$('#memo').val());
        siteKeyData.status = this.$('#status:checked').length > 0;
        return siteKeyData;
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

	return this.autorun(() => {
		const data = Template.currentData();
		this.siteKey = data != null ? data : undefined;
	});
});
