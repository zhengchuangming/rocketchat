import _ from 'underscore';
// ========= collections in client side /123qwe123qwe=========
this.ChatMessage = new Mongo.Collection(null);
this.CachedChatRoom = new RocketChat.CachedCollection({ name: 'rooms' });
this.ChatRoom = this.CachedChatRoom.collection;

this.CachedChatSubscription = new RocketChat.CachedCollection({ name: 'subscriptions' });
this.ChatSubscription = this.CachedChatSubscription.collection;
this.UserRoles = new Mongo.Collection(null);
this.RoomRoles = new Mongo.Collection(null);
this.AllSites = new Mongo.Collection(null);
this.UserAndRoom = new Mongo.Collection(null);
this.CachedChannelList = new Mongo.Collection(null);
this.CachedUserList = new Mongo.Collection(null);

RocketChat.models.Users = _.extend({}, RocketChat.models.Users, Meteor.users);
RocketChat.models.Subscriptions = _.extend({}, RocketChat.models.Subscriptions, this.ChatSubscription);
RocketChat.models.Rooms = _.extend({}, RocketChat.models.Rooms, this.ChatRoom);
// RocketChat.models.Sites = _.extend({}, RocketChat.models.Sites, this.AllSites);
RocketChat.models.Messages = _.extend({}, RocketChat.models.Messages, this.ChatMessage);

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId() && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
			this.CachedChatRoom.init();
			this.CachedChatSubscription.ready.set(true);
		}
	});
});
