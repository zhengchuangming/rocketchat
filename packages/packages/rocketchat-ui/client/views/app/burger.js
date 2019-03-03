Template.burger.helpers({
	unread() {
		console.log("============= get unread from sesssion /unread123qwe===================");
		return Session.get('unread');
	},
	isMenuOpen() {
		if (Session.equals('isMenuOpen', true)) {
			return 'menu-opened';
		}
	},
	embeddedVersion() {
		return RocketChat.Layout.isEmbedded();
	},
});
