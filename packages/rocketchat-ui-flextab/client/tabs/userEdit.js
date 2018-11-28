import toastr from 'toastr';
import s from 'underscore.string';
// var enableSitesModel = new Mongo.Collection('rocketchat_registered_sites');
Template.userEdit.helpers({
    isSuperAdmin(){
        if(Accounts.user().roles.toString().indexOf('admin') > 0)
            return true;
        else
            return false;
    },
    getAccountUser(){
        return Accounts.user();
    },
    isSameSiteUrl: function(siteUrl){
        if(siteUrl == Template.instance().user.site_id)
            return true;
        else
            return false;
    },
    isReady() {
        const instance = Template.instance();
        return instance.ready && instance.ready.get();
    },
	disabled(cursor) {
		return cursor.count() === 0 ? 'disabled' : '';
	},
	canEditOrAdd() {
		return (Template.instance().user && RocketChat.authz.hasAtLeastOnePermission('edit-other-user-info')) || (!Template.instance().user && RocketChat.authz.hasAtLeastOnePermission('create-user'));
	},
    enableSites() {
        return Template.instance().enableSites();
    },
	user() {
		return Template.instance().user;
	},

	requirePasswordChange() {
		return !Template.instance().user || Template.instance().user.requirePasswordChange;
	},

	role() {
		const roles = Template.instance().roles.get();
        if(Accounts.user().roles.toString().indexOf('admin') > 0)
            return RocketChat.models.Roles.find({ _id: { $nin:roles }, scope: 'Users' }, { sort: { description: 1, _id: 1 } });
        else
            return RocketChat.models.Roles.find({ _id: { $nin:roles }, scope: 'Users',description:{$ne:'Admin'}}, { sort: { description: 1, _id: 1 } });

	},

	userRoles() {
		return Template.instance().roles.get();
	},

	name() {
		return this.description || this._id;
	},
});

Template.userEdit.events({
	'click .cancel'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		console.log("userEdit:t:",t);
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

Template.userEdit.onCreated(function() {
	this.user = this.data != null ? this.data.user : undefined;
    // console.log("SiteId of User:",this.user.site_id);
	this.roles = this.user ? new ReactiveVar(this.user.roles) : new ReactiveVar([]);


	const { tabBar } = Template.currentData();

	this.cancel = (form, username) => {
		form.reset();
		this.$('input[type=checkbox]').prop('checked', true);
		if (this.user) {
			return this.data.back(username);
		} else {
			return tabBar.close();
		}
	};

    this.autorun(function() {
    	//123qwe123qwe / subscribe for Site model
        const filter = "";
        const limit = 50;
        const subscription = Meteor.subscribe('sites',filter,limit,'true');
        // const subscription = Meteor.subscribe('getEnableSites',filter,limit);
        // instance.ready.set(subscription.ready());
    });

    this.enableSites = function() {
        return RocketChat.models.Sites.find();
    };

	this.getUserData = () => {
		const userData = { _id: (this.user != null ? this.user._id : undefined) };
		userData.name = s.trim(this.$('#name').val());
		userData.username = s.trim(this.$('#username').val());
		userData.email = s.trim(this.$('#email').val());
		userData.verified = this.$('#verified:checked').length > 0;
		userData.password = s.trim(this.$('#password').val());
		userData.requirePasswordChange = this.$('#changePassword:checked').length > 0;
		userData.joinDefaultChannels = this.$('#joinDefaultChannels:checked').length > 0;
		userData.sendWelcomeEmail = this.$('#sendWelcomeEmail:checked').length > 0;
		userData.site_id = this.$('#urlSelect').val();

		const roleSelect = this.$('.remove-role').toArray();
		if (roleSelect.length > 0) {
			const notSorted = roleSelect.map((role) => role.title);
			// Remove duplicate strings from the array
			userData.roles = notSorted.filter((el, index) => notSorted.indexOf(el) === index);
		}
		return userData;
	};

	this.validate = () => {
		const userData = this.getUserData();

		const errors = [];
		if (!userData.name) {
			errors.push('Name');
		}
		if (!userData.username) {
			errors.push('Username');
		}
		if (!userData.email) {
			errors.push('Email');
		}
        if (!userData.email) {
            errors.push('Email');
        }
		if (!userData.roles) {
			errors.push('Roles');
		}
        if(!userData.site_id){
            errors.push('SiteURL');
		}
		for (const error of Array.from(errors)) {
			toastr.error(TAPi18n.__('error-the-field-is-required', { field: TAPi18n.__(error) }));
		}

		return errors.length === 0;
	};

	this.save = (form) => {
		if (!this.validate()) {
			return;
		}
		const userData = this.getUserData();

		if (this.user != null) {
			for (const key in userData) {
				if (key) {
					const value = userData[key];
					if (!['_id'].includes(key)) {
						if (value === this.user[key]) {
							delete userData[key];
						}
					}
				}
			}
		}

		Meteor.call('insertOrUpdateUser', userData, (error) => {
			if (error) {
				return handleError(error);
			}
			toastr.success(userData._id ? t('User_updated_successfully') : t('User_added_successfully'));
			this.cancel(form, userData.username);
		});
	};
});
