import s from 'underscore.string';

Meteor.methods({
	insertSite(siteData) {

		// check(siteData, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'insertOrUpdateSite' });
		}

		return RocketChat.models.Sites.insertOneSite(siteData);
	},
	updateSite(siteData) {

		// check(siteData, Object);
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'insertOrUpdateSite' });
		}

		return RocketChat.models.Sites.updateOneSite(siteData);
	},
});
