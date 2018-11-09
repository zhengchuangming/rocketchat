Meteor.publish('sites', function(filter,limit,status) {
	if (!this.userId) {
		return this.ready();
	}

	return RocketChat.models.Sites.findFullSiteData(filter,limit,status);
});
