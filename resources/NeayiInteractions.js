/*
 * Copyright (c) 2016 The MITRE Corporation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

var neayiinteractions_controller = ( function () {
	'use strict';

	return {
		baseUrl: null,
		imagepath: null,
		isLoggedIn: false,
		spinnerOptions: {
			lines: 11, // The number of lines to draw
			length: 8, // The length of each line
			width: 4, // The line thickness
			radius: 8, // The radius of the inner circle
			corners: 1, // Corner roundness (0..1)
			rotate: 0, // The rotation offset
			direction: 1, // 1: clockwise, -1: counterclockwise
			color: '#000', // #rgb or #rrggbb or array of colors
			speed: 1, // Rounds per second
			trail: 60, // ƒfterglow percentage
			shadow: false, // Whether to render a shadow
			hwaccel: false, // Whether to use hardware acceleration
			className: 'spinner', // The CSS class to assign to the spinner
			zIndex: 2e9, // The z-index (defaults to 2000000000)
			top: '50%', // Top position relative to parent
			left: '50%' // Left position relative to parent
		},
		initialize: function () {
			this.baseUrl = window.location.href.split( /[?#]/ )[ 0 ];
			this.imagepath = mw.config.get( 'wgExtensionAssetsPath' ) +
				'/NeayiInteractions/images/';
			if ( window.location.hash ) {
				var hash = window.location.hash.substring( 1 );
				var queryIndex = hash.indexOf( '?' );
				if ( queryIndex !== -1 ) {
					hash = hash.substring( 0, queryIndex );
				}
				this.targetComment = hash;
			}
			this.isLoggedIn = mw.config.get( 'wgUserName' ) !== null;
			var config = mw.config.get( 'NeayiInteractions' );

			mw.config.set('mwFollowedStatus', mw.config.get( 'NeayiInteractions' ).wgInitialFollowedStatus);

			this.setupDivs();
		},
		scrollToAnchor: function ( id ) {
			var element = $( '#' + id );
			if ( element.length ) {
				$( 'html,body' ).animate( { scrollTop: element.offset().top - 50 }, 'slow' );
			}
		},
		setupDivs: function () {
			var self = this;
			var pageTitle = mw.config.get('wgTitle');
			var relevantPageName = mw.config.get( 'wgRelevantPageName' );
			
			$( "#interaction-title" ).text(pageTitle);

			$( "#p-contentnavigation" ).clone( true ).appendTo( "#neayi-interaction-desktop-menu" );

			// Mobile bloc is added at the top of the page
			//$(``).prependTo( '.contentHeader' );
			
			$( 'a.login-links' ).attr('href', '/index.php?title=Special:Login&returnto=' + relevantPageName);
			
			$(function () {
				$('.popover-neayi-help').popover()
			})

			const theYear = new Date();
			for (let year = theYear.getFullYear(); year > 2004; year--) {
				$( '#sinceInputId' ).append($('<option>', { 
					value: year,
					text : year 
				}));
			}

			var chameleonMenu = $( "#p-contentnavigation" ).parent();
			$( "#p-contentnavigation" ).appendTo( "#neayi-interaction-mobile-menu" );
			$( ".p-contentnavigation > div" ).removeAttr('id');
			$( "#p-contentnavigation" ).removeAttr('id');
			chameleonMenu.remove();

			$( '.comments-link' ).on( 'click', function () {
				self.scrollToAnchor( 'cs-comments' );
				window.location.hash = '#cs-comments';
			} );
			
			this.setupFollowButton( $(" .neayi-interaction-suivre ") );
			this.setupApplauseButton( $(" .neayi-interaction-applause ") );
			this.setupDoneButton( $(" .neayi-interaction-doneit ") );

			this.setupCommentsCountLabel( $( ".questions-text" ) );

			this.getInitialCounts();
		},

		/**
		 * Get the initial counts from insights
		 */
		getInitialCounts: function() {
			var self = this;
			var sessionId = mw.config.get( 'NeayiInteractions' ).wgUserSessionId;
			var pageId = mw.config.get( 'wgArticleId' );
			var apiToken = mw.config.get( 'NeayiInteractions' ).wgUserApiToken;
			var headers = {};

			if (apiToken != '')
				headers.Authorization = 'Bearer ' + apiToken;

			$.ajax({
				url: "https://insights.dev.tripleperformance.fr/api/user/page/"+pageId+"?wiki_session_id=" + sessionId,
				dataType: 'json',
				method: "GET",				
				headers: headers
			  }).done(function(data) {
				mw.config.set('mwInteractions', data);

				self.setApplauseLabels();
				self.setFollowersLabels();
				self.setDoneItLabels();	
		    });
		},

		hasApplaused: function() {
			var interactions = mw.config.get( 'mwInteractions' );

			if (interactions && interactions.state.applause)
				return true;

			return false;
		},

		hasFollowed: function() {
			var followedStatus = mw.config.get( 'mwFollowedStatus' );

			return followedStatus == true;
		},

		hasDone: function() {
			var interactions = mw.config.get( 'mwInteractions' );

			if (interactions && interactions.state.done)
				return true;

			return false;
		},

		ajaxInsights: function( actions, done_value = [] ) {
			var self = this;

			var insightsURL = mw.config.get( 'NeayiInteractions' ).wgInsightsRootURL;

			var sessionId = mw.user.sessionId();
			var pageId = mw.config.get( 'wgArticleId' );

			var headers = {};
			var apiToken = mw.config.get( 'NeayiInteractions' ).wgUserApiToken;
			if (apiToken != '')
				headers.Authorization = 'Bearer ' + apiToken;

			$.ajax({
				url: insightsURL + "api/page/"+pageId+"?wiki_session_id=" + sessionId,
				dataType: 'json',
				method: "POST",
				data: {
					interactions: actions,
					done_value: done_value
				},
				headers: headers
			}).done(function(data) {
				mw.config.set('mwInteractions', data);

				self.setApplauseLabels();
				self.setFollowersLabels();
				self.setDoneItLabels();	
			});
		},

		/**
		 * Prepare the click event that'll trigger the applause API
		 * 
		 * @param jQuery buttons list buttons 
		 */
		setupApplauseButton: function( buttons ) {
			var self = this;

			buttons.on( 'click', function ( e ) {

				self.disableButton(buttons);

				if (self.hasApplaused())
					self.ajaxInsights(['unapplause']);
				else
					self.ajaxInsights(['applause']);

				e.preventDefault();

				if (mw.user.isAnon()) {
					$('#inviteLoginModal').modal('show')
					return;
				}				
			} );
		
		},


		/**
		 * Sets the watch status on the buttons, and prepare the click event that'll trigger the watch API
		 * 
		 * @param jQuery buttons list buttons 
		 */
		 setupFollowButton: function( buttons ) {
			var self = this;

			buttons.on( 'click', function ( e ) {
				if (mw.user.isAnon()) {
					$('#requiresLoginModal').modal('show')
					return;
				}

				var mwTitle = mw.config.get( 'wgRelevantPageName' );
				
				self.disableButton(buttons);

				if (self.hasFollowed())
				{
					new mw.Api().unwatch( mwTitle )
						.done( function () {
							mw.config.set('mwFollowedStatus', false);
						} )
						.fail( function () {
						} );

					self.ajaxInsights(['unfollow']);
				}
				else
				{
					new mw.Api().watch( mwTitle )
						.done( function () {
							mw.config.set('mwFollowedStatus', true);
						} )
						.fail( function () {
						} );

					self.ajaxInsights(['follow']);
				}

				e.preventDefault();
			} );
		
		},

		/**
		 * Prepare the click event that'll trigger the Done API
		 * 
		 * @param jQuery buttons list buttons 
		 */
		 setupDoneButton: function( buttons ) {
			var self = this;

			buttons.on( 'click', function ( e ) {
				
				if (mw.user.isAnon()) {
					$('#requiresLoginModal').modal('show')
					return;
				}

				self.disableButton(buttons);

				if (self.hasDone())
				{
					mw.config.set('mwDoneItStatus', false);
					buttons.prop("disabled", false);

					self.ajaxInsights(['undone']);
				}
				else
				{
					mw.config.set('mwDoneItStatus', true);
					buttons.prop("disabled", false);

					$('#tellUsMoreModalSubmit').on('click', function(e) {
						var actions = ['done'];
						if ($('#followwheck').val() == "follow")
							actions = ['done', 'follow'];

						var otherparams = {};
						otherparams.start_at = $('#sinceInputId').val() + "-01-01";

						self.ajaxInsights(actions, otherparams);

						e.preventDefault();
						$('#tellUsMoreModal').modal('hide');
					});

					self.ajaxInsights(['done']);
					$('#tellUsMoreModal').modal('show');
				}

				e.preventDefault();
			} );
		
		},

		setupCommentsCountLabel: function(label) {

			var CSConfig = mw.config.get( 'CommentStreams' );
			if (CSConfig && CSConfig.comments && CSConfig.comments.length > 0)
			{
				var nbQuestionsAvecReponses = 0;
				var parentIndex;

				for ( parentIndex in CSConfig.comments ) {
					var parentComment = CSConfig.comments[ parentIndex ];
					if (parentComment.children)
						nbQuestionsAvecReponses++;
				}
				
				if (nbQuestionsAvecReponses == 1)
					label.text( "1 question avec réponses");
				else if (nbQuestionsAvecReponses > 0)
					label.text( nbQuestionsAvecReponses + " questions avec réponses");
				else if (CSConfig.comments.length == 1)
					label.text( "1 question");
				else
					label.text( CSConfig.comments.length + " questions");
			}
		},

		setApplauseLabels: function( ) {
			var self = this;
			
			var applauses = 0;
			var interactions = mw.config.get( 'mwInteractions' );

			if (interactions && interactions.counts.applause)
				applauses = interactions.counts.applause;

			if (applauses >= 1000)
				applauses = String(Math.round(applauses / 100) / 10) + " k";

			$( '.neayi-interaction-applause' ).html(`<img src="${self.imagepath}clap.svg" width="28">`).prop("disabled", false);
			$( '.neayi-interaction-applause-label' ).text(applauses);
		},

		setFollowersLabels: function( ) {
			var followers = 0;
			var interactions = mw.config.get( 'mwInteractions' );

			if (interactions && interactions.counts.follow)
				followers = interactions.counts.applause;

			$( ".neayi-interaction-suivre-label" ).text(followers + " interessés");

			if (this.hasFollowed())
				$( ".neayi-interaction-suivre" ).html(`<span style="vertical-align: middle;">Suivi</span> <span style="vertical-align: middle;" class="material-icons" aria-hidden="true">check</span>`).prop("disabled", false);
			else
				$( ".neayi-interaction-suivre" ).text("Suivre").prop("disabled", false);
		},

		setDoneItLabels: function( ) {
			var doers = 0;
			var interactions = mw.config.get( 'mwInteractions' );
			if (interactions && interactions.counts.done)
				doers = interactions.counts.done;

			if (doers < 2)
				doers = doers + " exploitation";
			else if (doers >= 1000)
				doers = String(Math.round(doers / 100) / 10) + " k exploitations";
			else
				doers = doers + " exploitations";

			$( ".neayi-interaction-doneit-label" ).text(doers);

			if (this.hasDone())
				$( ".neayi-interaction-doneit" ).html(`<span style="vertical-align: middle;">Fait !</span> <span style="vertical-align: middle;" class="material-icons" aria-hidden="true">beenhere</span>`).prop("disabled", false);
			else
				$( ".neayi-interaction-doneit" ).text("Je le fais").prop("disabled", false);
		},
		
		disableButton: function(buttons) {
			buttons.html(`<div class="spinner-border spinner-border-sm" role="status">
							<span class="sr-only">Loading...</span>
						 </div>`);
			buttons.prop("disabled", true);			
		}

		
	};
}() );

window.NeayiInteractionsController = neayiinteractions_controller;

( function () {
	$( document )
		.ready( function () {
			if ( mw.config.exists( 'NeayiInteractions' ) ) {
				window.NeayiInteractionsController.initialize();
			}

			// Also add a scrollspy on the TOC
			$('body').scrollspy({ target: '#toc', 'offset': 0});
		} );
}() );

