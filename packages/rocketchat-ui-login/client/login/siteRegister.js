/* globals OnePassword, device */
import _ from 'underscore';
import s from 'underscore.string';
import toastr from 'toastr';

Template.siteRegisterForm.helpers({
    RegisterSite(){
        return "サイトを登録する";
    },
    IsDirectOrIframeCall(){
        // if(Template.instance().registeredSites.find().count() == 0)
        // 	return 	true;	// not exist
        // else
        // 	return false;  //exist
        console.log("IsDirectOrIframeCall:",Template.instance().IsDirectOrIframeCall);
        return Template.instance().IsDirectOrIframeCall;
    },
    IsRegisterSite(){
        return Template.IsSite;
    },
    userName() {
        const user = Meteor.user();
        return user && user.username;
    },
    namePlaceholder() {
        if (RocketChat.settings.get('Accounts_RequireNameForSignUp')) {
            return t('Name');
        } else {
            return t('Name_optional');
        }
    },
    showFormLogin() {
        return RocketChat.settings.get('Accounts_ShowFormLogin');
    },
    state(...state) {
        return state.indexOf(Template.instance().state.get()) > -1;
    },
    btnLoginSave() {
        if (Template.instance().loading.get()) {
            return `${ t('Please_wait') }...`;
        }
        switch (Template.instance().state.get()) {
            case 'register':
                if(Template.IsSite)
                    return t('Register_a_site');
                else
                    return t('Register');
            case 'login':
                return t('Login');
            case 'email-verification':
                return t('Send_confirmation_email');
            case 'forgot-password':
                return t('Reset_password');
        }
    },
    loginTerms() {
        return RocketChat.settings.get('Layout_Login_Terms');
    },
    registrationAllowed() {
        const validSecretUrl = Template.instance().validSecretURL;
        return RocketChat.settings.get('Accounts_RegistrationForm') === 'Public' || (validSecretUrl && validSecretUrl.get());
    },
    linkReplacementText() {
        return RocketChat.settings.get('Accounts_RegistrationForm_LinkReplacementText');
    },
    passwordResetAllowed() {
        return RocketChat.settings.get('Accounts_PasswordReset');
    },
    requirePasswordConfirmation() {
        return RocketChat.settings.get('Accounts_RequirePasswordConfirmation');
    },
    emailOrUsernamePlaceholder() {
        return RocketChat.settings.get('Accounts_EmailOrUsernamePlaceholder') || t('Email_or_username');
    },
    passwordPlaceholder() {
        return RocketChat.settings.get('Accounts_PasswordPlaceholder') || t('Password');
    },
    confirmPasswordPlaceholder() {
        return RocketChat.settings.get('Accounts_ConfirmPasswordPlaceholder') || t('Confirm_password');
    },
    hasOnePassword() {
        return typeof OnePassword !== 'undefined' && OnePassword.findLoginForUrl && typeof device !== 'undefined' && device.platform && device.platform.toLocaleLowerCase() === 'ios';
    },
    manuallyApproveNewUsers() {
        return RocketChat.settings.get('Accounts_ManuallyApproveNewUsers');
    },
});

Template.siteRegisterForm.events({
    'submit #login-card'(event, instance) {
        event.preventDefault();
        $(event.target).find('button.login').focus();
        instance.loading.set(true);
        var formData = instance.validate();

        formData = {
            name: $('[name = name]').val(),
            email: $('[name = email]').val(),
            pass: $('[name = pass]').val(),
            site_id: $('[name = site_url]').val()
        };

        if (formData) {
            formData.secretURL = FlowRouter.getParam('hash');
            // toastr.error(t('siteRegisterForm is display!!!'));

            return Meteor.call('registerSiteManager', formData, function(error) {
                    instance.loading.set(false);
                    if (error != null) {
                        if (error.reason === 'Email already exists.') {
                            toastr.error(t('Email_already_exists'));
                        } else {
                            handleError(error);
                        }
                        return;
                    }
                    RocketChat.callbacks.run('userRegistered');
                    return Meteor.loginWithPassword(s.trim(formData.email), formData.pass, function(error) {

                        if (error && error.error === 'error-invalid-email') {

                            toastr.success(t('We_have_sent_registration_email'));
                            return instance.state.set('login');
                        } else if (error && error.error === 'error-user-is-not-activated') {

                            return instance.state.set('wait-activation');
                        } else {

                            Session.set('forceLogin', false);
                            FlowRouter.go('home');
                        }
                    });
                });

        }
    },
    'click .register'() {
        Template.IsSite = false;
        Template.instance().state.set('register');
        // return RocketChat.callbacks.run('loginPageStateChange', Template.instance().state.get());
    },
    'click #RegisterSite'() {
        Template.instance().state.set('register');
        Template.IsSite = true;
        console.log("siteregister!");
    },
    'click .back-to-login'() {
        Template.IsSite = false;
        Template.instance().state.set('login');
        return RocketChat.callbacks.run('loginPageStateChange', Template.instance().state.get());
    },
    'click .forgot-password'() {
        Template.instance().state.set('forgot-password');
        return RocketChat.callbacks.run('loginPageStateChange', Template.instance().state.get());
    },
    'click .one-passsword'() {
        if (typeof OnePassword === 'undefined' || OnePassword.findLoginForUrl == null) {
            return;
        }
        const succesCallback = function(credentials) {
            $('input[name=emailOrUsername]').val(credentials.username);
            return $('input[name=pass]').val(credentials.password);
        };
        const errorCallback = function(...args) {
            return console.log('OnePassword errorCallback', ...args);
        };
        return OnePassword.findLoginForUrl(succesCallback, errorCallback, Meteor.absoluteUrl());
    },
});

Template.siteRegisterForm.onCreated(function() {
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
            if (!(formObj.email && /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+\b/i.test(formObj.email))) {
                validationObj.email = t('Invalid_email');
            }

            if (!formObj.pass) {
                validationObj.pass = t('Invalid_pass');
            }
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

Template.siteRegisterForm.onRendered(function() {
    Session.set('loginDefaultState');
    return Tracker.autorun(() => {
        RocketChat.callbacks.run('loginPageStateChange', this.state.get());

                return Meteor.defer(function() {
                        return $('input[name=name]').select().focus();
                });
    });
});
