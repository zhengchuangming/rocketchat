Meteor.publish('siteKeys', function(filter,limit,status) {
	if (!this.userId) {
		return this.ready();
	}

	return RocketChat.models.SiteKeys.findFullSiteKeyData(filter,limit,status);
});
