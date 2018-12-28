Meteor.publish('reportMessages', function(filter,limit) {
	if (!this.userId) {
		return this.ready();
	}

	return RocketChat.models.ReportMessages.findFullReportMessages(filter,limit);
});
