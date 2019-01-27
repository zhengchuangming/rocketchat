/* globals KonchatNotification */
import s from 'underscore.string';
import toastr from "toastr";

Blaze.registerHelper('pathFor', function(path, kw) {
	return FlowRouter.path(path, kw.hash);
});

BlazeLayout.setRoot('body');

FlowRouter.subscriptions = function() {
	Tracker.autorun(() => {
		if (Meteor.userId()) {
			this.register('userData', Meteor.subscribe('userData'));
			this.register('activeUsers', Meteor.subscribe('activeUsers'));
		}
	});
};

FlowRouter.route('/', {
	name: 'index',
	action(params,queryParams) {
        // let  keys = Object.keys(localStorage);
	    // let  i = keys.length;
        // while ( i-- ) {
        //     console.log("keyName:",keys[i]);
        //     console.log("item:",localStorage.getItem( keys[i] ));
        // }
        // localStorage.removeItem("Meteor.userId");
        // var result = new Date();
        // result.setDate(result.getDate() + 10);
        // // localStorage.setItem("Meteor.userId", "CaCvHgiyjXtGX7SwR");
        // Object.keys(localStorage).forEach((item) => {
        //     if (item.indexOf('messagebox_') === 0) {
        //         localStorage.removeItem(item);
        //     }
        // });
        // sessionStorage.clear();
 		// Session.clear();
        // Meteor.users.remove('CaCvHgiyjXtGX7SwR');

//******** putting a siteKey into localstorage  ********

        BlazeLayout.render('main', { modal: RocketChat.Layout.isEmbedded(), center: 'loading' });
        Meteor.logout(function() {
            BlazeLayout.render('loginLayout', { center: 'loginForm'});
            // BlazeLayout.render('loginLayout', { center: 'loginForm' ,siteKey : queryParams['key']});
            // FlowRouter.go('/home?key='+queryParams['key']);
        });
        return;

        if (!Meteor.userId()) {
            return FlowRouter.go('home');
        }

        Tracker.autorun(function(c) {
            if (FlowRouter.subsReady() === true) {
                Meteor.defer(function() {
                    if (Meteor.user() && Meteor.user().defaultRoom) {
                        const room = Meteor.user().defaultRoom.split('/');
                        FlowRouter.go(room[0], { name: room[1] }, FlowRouter.current().queryParams);
                    } else {
                        FlowRouter.go('home');
                    }
                });
                c.stop();
            }
        });

	},
});

FlowRouter.route('/login', {
	name: 'login',

	action() {
		FlowRouter.go('home');
	},
});
FlowRouter.route('/site-register', {
    name: 'site-register',
	//123qwe123qwe : site-register
    action(params,queryParams) {

        Meteor.call('validSiteManager', queryParams['key'], (error,data) => {
            if (error) {
                return toastr.error(t(error.error));
            }
            if(data.siteUrl){//if site is registed
            	console.log("Ok");
                BlazeLayout.render('loginLayout', { center: 'siteRegisterForm' ,siteUrl : data.siteUrl,siteManagerEmail:data.email});
			}else if(data.result == '0'){//site manager is already registered
                toastr.error(t("site manager is already registered"));
			}else if(data.result == '1'){//site is not registered
                toastr.error(t("site is not registered"));
			}
        });


        // BlazeLayout.render('registerErrorPage');
    },
});
FlowRouter.route('/home', {
	name: 'home',
	action(params, queryParams) {
		console.log("123qwe123qwe / startPoint!");
		KonchatNotification.getDesktopPermission();
		if (queryParams.saml_idp_credentialToken !== undefined) {
			console.log("permittion here!");
			Accounts.callLoginMethod({
				methodArguments: [{
					saml: true,
					credentialToken: queryParams.saml_idp_credentialToken,
				}],
                // userCallback() { BlazeLayout.render('main', { center: 'home' });}
				userCallback() { BlazeLayout.render('main', { center: 'home' }); FlowRouter.go('/channel/general')}
			});
		} else {
            // let userRole = Accounts.user().roles.toString();
            // setting a flexnav as a Manager Style =============/123qwe123qwe
            // if(userRole.indexOf('admin') > -1 || userRole.indexOf('SiteManager') > -1 ) {
            //     BlazeLayout.render('main', { center: 'home' });
            //     //FlowRouter.go('admin-kpi');
            // }else
				FlowRouter.go('/channel/general');
		}
	},
});

FlowRouter.route('/directory', {
	name: 'directory',

	action() {
		BlazeLayout.render('main', { center: 'directory' });
	},
	triggersExit: [function() {
		$('.main-content').addClass('rc-old');
	}],
});

FlowRouter.route('/account/:group?', {
	name: 'account',

	action(params) {
		if (!params.group) {
			params.group = 'Preferences';
		}
		params.group = s.capitalize(params.group, true);
		BlazeLayout.render('main', { center: `account${ params.group }` });
	},
	triggersExit: [function() {
		$('.main-content').addClass('rc-old');
	}],
});

FlowRouter.route('/terms-of-service', {
	name: 'terms-of-service',

	action() {
		Session.set('cmsPage', 'Layout_Terms_of_Service');
		BlazeLayout.render('cmsPage');
	},
});

FlowRouter.route('/privacy-policy', {
	name: 'privacy-policy',

	action() {
		Session.set('cmsPage', 'Layout_Privacy_Policy');
		BlazeLayout.render('cmsPage');
	},
});

FlowRouter.route('/room-not-found/:type/:name', {
	name: 'room-not-found',

	action(params) {
		Session.set('roomNotFound', { type: params.type, name: params.name });
		BlazeLayout.render('main', { center: 'roomNotFound' });
	},
});

FlowRouter.route('/fxos', {
	name: 'firefox-os-install',

	action() {
		BlazeLayout.render('fxOsInstallPrompt');
	},
});

FlowRouter.route('/register/:hash', {
	name: 'register-secret-url',

	action(/* params*/) {
		BlazeLayout.render('secretURL');

		// if RocketChat.settings.get('Accounts_RegistrationForm') is 'Secret URL'
		// 	Meteor.call 'checkRegistrationSecretURL', params.hash, (err, success) ->
		// 		if success
		// 			Session.set 'loginDefaultState', 'register'
		// 			BlazeLayout.render 'main', {center: 'home'}
		// 			KonchatNotification.getDesktopPermission()
		// 		else
		// 			BlazeLayout.render 'logoLayout', { render: 'invalidSecretURL' }
		// else
		// 	BlazeLayout.render 'logoLayout', { render: 'invalidSecretURL' }
	},
});

FlowRouter.route('/setup-wizard', {
	name: 'setup-wizard',

	action() {
		BlazeLayout.render('setupWizard');
	},
});

FlowRouter.route('/setup-wizard/final', {
	name: 'setup-wizard-final',

	action() {
		BlazeLayout.render('setupWizardFinal');
	},
});

FlowRouter.notFound = {
	action() {
		BlazeLayout.render('pageNotFound');
	},
};

