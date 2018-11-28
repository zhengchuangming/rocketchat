import s from 'underscore.string';

Meteor.methods({
	registerUser(formData) {
		console.log("ResigerUser?serverside");
		const AllowAnonymousRead = RocketChat.settings.get('Accounts_AllowAnonymousRead');
		const AllowAnonymousWrite = RocketChat.settings.get('Accounts_AllowAnonymousWrite');
		const manuallyApproveNewUsers = RocketChat.settings.get('Accounts_ManuallyApproveNewUsers');
		if (AllowAnonymousRead === true && AllowAnonymousWrite === true && formData.email == null) {
			const userId = Accounts.insertUserDoc({}, {
				globalRoles: [
					'anonymous',
				],
			});

			const { id, token } = Accounts._loginUser(this, userId);

			return { id, token };
		} else {
			check(formData, Match.ObjectIncluding({
				email: String,
				pass: String,
				name: String,
				site_id: String,
				secretURL: Match.Optional(String),
				reason: Match.Optional(String),
			}));
		}

		if (RocketChat.settings.get('Accounts_RegistrationForm') === 'Disabled') {
			throw new Meteor.Error('error-user-registration-disabled', 'User registration is disabled', { method: 'registerUser' });
		} else if (RocketChat.settings.get('Accounts_RegistrationForm') === 'Secret URL' && (!formData.secretURL || formData.secretURL !== RocketChat.settings.get('Accounts_RegistrationForm_SecretURL'))) {
			throw new Meteor.Error ('error-user-registration-secret', 'User registration is only allowed via Secret URL', { method: 'registerUser' });
		}

		RocketChat.passwordPolicy.validate(formData.pass);

		RocketChat.validateEmailDomain(formData.email);

		const userData = {
			email: s.trim(formData.email.toLowerCase()),
			password: formData.pass,
			name: formData.name,
			reason: formData.reason,
		};
		console.log(formData.site_url);
		// Check if user has already been imported and never logged in. If so, set password and let it through
		const importedUser = RocketChat.models.Users.findOneByEmailAddress(s.trim(formData.email.toLowerCase()));
		let userId;
		if (importedUser && importedUser.importIds && importedUser.importIds.length && !importedUser.lastLogin) {
			Accounts.setPassword(importedUser._id, userData.password);
			userId = importedUser._id;
		} else {
			console.log("userId = Accounts.createUser(userData);");
			userId = Accounts.createUser(userData);
		}

		RocketChat.models.Users.setName(userId, s.trim(formData.name));

		const reason = s.trim(formData.reason);
		if (manuallyApproveNewUsers && reason) {
			RocketChat.models.Users.setReason(userId, reason);
		}

		RocketChat.saveCustomFields(userId, formData);
	    //Update UserInfo(SiteId value change)
		// RocketChat.models.Users.setSiteId(userId, formData['site_url']);

		//register site
		// RocketChat.models.Sites.createSite(formData['site_url'], 'true');


		try {
			if (RocketChat.settings.get('Verification_Customized')) {
				const subject = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email_Subject') || '');
				const html = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email') || '');
				Accounts.emailTemplates.verifyEmail.subject = () => subject;
				Accounts.emailTemplates.verifyEmail.html = (userModel, url) => html.replace(/\[Verification_Url]/g, url);
			}

			Accounts.sendVerificationEmail(userId, userData.email);
		} catch (error) {
			// throw new Meteor.Error 'error-email-send-failed', 'Error trying to send email: ' + error.message, { method: 'registerUser', message: error.message }
		}

		return userId;
	},
	registerSiteManager(formData) {
	//register new siteManager
		console.log("ResigerSite?serverside");
		const AllowAnonymousRead = RocketChat.settings.get('Accounts_AllowAnonymousRead');
		const AllowAnonymousWrite = RocketChat.settings.get('Accounts_AllowAnonymousWrite');
		const manuallyApproveNewUsers = RocketChat.settings.get('Accounts_ManuallyApproveNewUsers');
		if (AllowAnonymousRead === true && AllowAnonymousWrite === true && formData.email == null) {
			const userId = Accounts.insertUserDoc({}, {
				globalRoles: [
					'anonymous',
				],
			});

			const { id, token } = Accounts._loginUser(this, userId);

			return { id, token };
		} else {
			check(formData, Match.ObjectIncluding({
				email: String,
				pass: String,
				name: String,
				site_id: String,
				secretURL: Match.Optional(String),
				reason: Match.Optional(String),
			}));
		}

		if (RocketChat.settings.get('Accounts_RegistrationForm') === 'Disabled') {
			throw new Meteor.Error('error-user-registration-disabled', 'User registration is disabled', { method: 'registerUser' });
		} else if (RocketChat.settings.get('Accounts_RegistrationForm') === 'Secret URL' && (!formData.secretURL || formData.secretURL !== RocketChat.settings.get('Accounts_RegistrationForm_SecretURL'))) {
			throw new Meteor.Error ('error-user-registration-secret', 'User registration is only allowed via Secret URL', { method: 'registerUser' });
		}

		RocketChat.passwordPolicy.validate(formData.pass);

		RocketChat.validateEmailDomain(formData.email);

		const userData = {
			email: s.trim(formData.email.toLowerCase()),
			password: formData.pass,
			name: formData.name,
			reason: formData.reason,
		};
		console.log(formData.site_id);
		// Check if user has already been imported and never logged in. If so, set password and let it through
		const importedUser = RocketChat.models.Users.findOneByEmailAddress(s.trim(formData.email.toLowerCase()));
		let userId;
		if (importedUser && importedUser.importIds && importedUser.importIds.length && !importedUser.lastLogin) {
			Accounts.setPassword(importedUser._id, userData.password);
			userId = importedUser._id;
		} else {
			console.log("userId = Accounts.createUser(userData);");
			userId = Accounts.createUser(userData);
		}

		RocketChat.models.Users.setName(userId, s.trim(formData.name));

		const reason = s.trim(formData.reason);
		if (manuallyApproveNewUsers && reason) {
			RocketChat.models.Users.setReason(userId, reason);
		}

		RocketChat.saveCustomFields(userId, formData);
		//Update UserInfo(SiteId value change)
		// RocketChat.models.Users.setSiteId(userId, formData['site_url']);
		RocketChat.models.Users.setRole(userId, "SiteManager");
		//setRole
		//register site
		// RocketChat.models.Sites.createSite(formData['site_url'], 'true');


		try {
			if (RocketChat.settings.get('Verification_Customized')) {
				const subject = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email_Subject') || '');
				const html = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email') || '');
				Accounts.emailTemplates.verifyEmail.subject = () => subject;
				Accounts.emailTemplates.verifyEmail.html = (userModel, url) => html.replace(/\[Verification_Url]/g, url);
			}

			Accounts.sendVerificationEmail(userId, userData.email);
		} catch (error) {
			// throw new Meteor.Error 'error-email-send-failed', 'Error trying to send email: ' + error.message, { method: 'registerUser', message: error.message }
		}
	//After register new siteManager successfullly, set the site enable!
        const ret = RocketChat.models.Sites.enableOneSite(formData.site_id);
		console.log("enableOneSiteResult : ",ret);
		return userId;
	},
	validUserInSite(formData){
		console.log("SitehostNameOfUser:",formData.site_id);
		return RocketChat.models.Users.validUserInSite(formData.site_id,formData.emailOrUsername);
	},
	IsExistSite(Url){
		// function asyncCall(){
			return RocketChat.models.Sites.IsExistSite(Url);
		// }
		// var syncCall = Meteor.wrapAsync(asyncCall);
		// var res = syncCall();
		// // now you can return the result to client.
		// return res;
	},
    IsEnableSite(Url){
        return RocketChat.models.Sites.IsEnableSite(Url);
    },
});
