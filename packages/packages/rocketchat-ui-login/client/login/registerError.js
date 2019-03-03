/* globals CustomOAuth */
import s from 'underscore.string';
import toastr from 'toastr';
import _ from "underscore";

Meteor.startup(function() {
	return ServiceConfiguration.configurations.find({
		custom: true,
	}).observe({
		added(record) {
			return new CustomOAuth(record.service, {
				serverURL: record.serverURL,
				authorizePath: record.authorizePath,
				scope: record.scope,
			});
		},
	});
});

Template.registerErrorPage.helpers({
	loginService() {
		const services = [];
		const authServices = ServiceConfiguration.configurations.find({}, {
			sort: {
				service: 1,
			},
		}).fetch();
		authServices.forEach(function(service) {
			let icon;
			let serviceName;
			switch (service.service) {
				case 'meteor-developer':
					serviceName = 'Meteor';
					icon = 'meteor';
					break;
				case 'github':
					serviceName = 'GitHub';
					icon = 'github-circled';
					break;
				case 'gitlab':
					serviceName = 'GitLab';
					icon = service.service;
					break;
				case 'wordpress':
					serviceName = 'WordPress';
					icon = service.service;
					break;
				default:
					serviceName = s.capitalize(service.service);
					icon = service.service;
			}
			return services.push({
				service,
				displayName: serviceName,
				icon,
			});
		});
		return services;
	},
});

const longinMethods = {
	'meteor-developer': 'MeteorDeveloperAccount',
	linkedin: 'LinkedIn',
};

Template.registerErrorPage.events({
	'click .external-login'(e) {
		if (this.service == null || this.service.service == null) {
			return;
		}
		const loadingIcon = $(e.currentTarget).find('.loading-icon');
		const serviceIcon = $(e.currentTarget).find('.service-icon');
		loadingIcon.removeClass('hidden');
		serviceIcon.addClass('hidden');
		if (Meteor.isCordova && this.service.service === 'facebook') {
			return Meteor.loginWithFacebookCordova({}, function(error) {
				loadingIcon.addClass('hidden');
				serviceIcon.removeClass('hidden');
				if (error) {
					console.log(JSON.stringify(error));
					if (error.reason) {
						toastr.error(error.reason);
					} else {
						toastr.error(error.message);
					}
				}
			});
		} else {
			const loginWithService = `loginWith${ longinMethods[this.service.service] || s.capitalize(this.service.service) }`;
			const serviceConfig = this.service.clientConfig || {};
			return Meteor[loginWithService](serviceConfig, function(error) {
				loadingIcon.addClass('hidden');
				serviceIcon.removeClass('hidden');
				if (error) {
					console.log(JSON.stringify(error));
					if (error.reason) {
						toastr.error(error.reason);
					} else {
						toastr.error(error.message);
					}
				}
			});
		}
	},
});

Template.registerErrorPage.onCreated(function() {
    const instance = this;
    this.customFields = new ReactiveVar;
    this.loading = new ReactiveVar(false);
    this.IsSite = false;
    //Is site registered already?
    var siteUrlTemp = null;
    this.IsDirectOrIframeCall = null;// true :  iframe / false : direct

    if(parent !== window) {
        this.IsDirectOrIframeCall = false;
        siteUrlTemp = document.referrer;
    }else {
        this.IsDirectOrIframeCall = true;
        siteUrlTemp = window.location.href;
    }

    this.ParentSiteUrl = null;

    if(siteUrlTemp)
        this.ParentSiteUrl = siteUrlTemp.split("//")[1].split("/")[0].split(":")[0];

    console.log("==========123==========:",siteUrlTemp);

    // Meteor.subscribe('getOneSite','localhost');
    // this.registeredSites = new Mongo.Collection('rocketchat_registered_sites');

    Tracker.autorun(() => {
        const Accounts_CustomFields = RocketChat.settings.get('Accounts_CustomFields');
        if (typeof Accounts_CustomFields === 'string' && Accounts_CustomFields.trim() !== '') {
            try {
                return this.customFields.set(JSON.parse(RocketChat.settings.get('Accounts_CustomFields')));
            } catch (error1) {
                return console.error('Invalid JSON for Accounts_CustomFields');
            }
        } else {
            return this.customFields.set(null);
        }
    });
    if (Meteor.settings.public.sandstorm) {
        this.state = new ReactiveVar('sandstorm');
    } else if (Session.get('loginDefaultState')) {
        this.state = new ReactiveVar(Session.get('loginDefaultState'));
    } else {
        this.state = new ReactiveVar('login');
    }
    this.validSecretURL = new ReactiveVar(false);

    const validateCustomFields = function(formObj, validationObj) {
        const customFields = instance.customFields.get();
        if (!customFields) {
            return;
        }

        for (const field in formObj) {
            if (formObj.hasOwnProperty(field)) {
                const value = formObj[field];
                if (customFields[field] == null) {
                    continue;
                }
                const customField = customFields[field];
                if (customField.required === true && !value) {
                    return validationObj[field] = t('Field_required');
                }
                if ((customField.maxLength != null) && value.length > customField.maxLength) {
                    return validationObj[field] = t('Max_length_is', customField.maxLength);
                }
                if ((customField.minLength != null) && value.length < customField.minLength) {
                    return validationObj[field] = t('Min_length_is', customField.minLength);
                }
            }
        }
    };
    this.validate = function() {
        const formData = $('#login-card').serializeArray();
        const formObj = {};
        const validationObj = {};
        formData.forEach((field) => {
            formObj[field.name] = field.value;
        });
        const state = instance.state.get();
        // if(Template.IsSite) {
        // 	if (!formObj.SiteURL) {
        // 		validationObj.SiteURL = t('Invalid_SiteURL');
        // 	}
        // }
        if (state !== 'login') {
            if (!(formObj.email && /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+\b/i.test(formObj.email))) {
                validationObj.email = t('Invalid_email');
            }
        }

        if (state === 'login') {
            if (!formObj.emailOrUsername) {
                validationObj.emailOrUsername = t('Invalid_email');
            }
        }
        if (state !== 'forgot-password') {
            if (!formObj.pass) {
                validationObj.pass = t('Invalid_pass');
            }
        }
        if (state === 'register') {
            if (RocketChat.settings.get('Accounts_RequireNameForSignUp') && !formObj.name) {
                validationObj.name = t('Invalid_name');
            }
            if (RocketChat.settings.get('Accounts_RequirePasswordConfirmation') && formObj['confirm-pass'] !== formObj.pass) {
                validationObj['confirm-pass'] = t('Invalid_confirm_pass');
            }

            if (RocketChat.settings.get('Accounts_ManuallyApproveNewUsers') && !formObj.reason) {
                validationObj.reason = t('Invalid_reason');
            }
            validateCustomFields(formObj, validationObj);
        }
        $('#login-card h2').removeClass('error');
        $('#login-card input.error, #login-card select.error').removeClass('error');
        $('#login-card .input-error').text('');
        if (!_.isEmpty(validationObj)) {
            $('#login-card h2').addClass('error');

            Object.keys(validationObj).forEach((key) => {
                const value = validationObj[key];
                $(`#login-card input[name=${ key }], #login-card select[name=${ key }]`).addClass('error');
                $(`#login-card input[name=${ key }]~.input-error, #login-card select[name=${ key }]~.input-error`).text(value);
            });
            instance.loading.set(false);
            return false;
        }
        return formObj;
    };
    if (FlowRouter.getParam('hash')) {
        return Meteor.call('checkRegistrationSecretURL', FlowRouter.getParam('hash'), () => this.validSecretURL.set(true));
    }
});

Template.registerErrorPage.onRendered(function() {
    Session.set('loginDefaultState');
    return Tracker.autorun(() => {
        RocketChat.callbacks.run('loginPageStateChange', this.state.get());
        switch (this.state.get()) {
            case 'login':
            case 'forgot-password':
            case 'email-verification':
                return Meteor.defer(function() {
                    return $('input[name=email]').select().focus();
                });
            case 'register':
                return Meteor.defer(function() {
                    if(Template.IsSite)
                        return $('input[name=site_url]').select().focus();
                    else
                        return $('input[name=name]').select().focus();
                });
        }
    });
});
