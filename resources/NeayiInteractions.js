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
			$(`<div class="interaction-bloc-mobile d-lg-none d-block">
					<div class="interaction-top">
						<div class="container px-0 interaction-buttons">
							<div class="row mx-n1">
								<div class="col-auto px-1">
									<button class="btn btn-dark-green text-white neayi-interaction-applause" type="button">
										<img src="${this.imagepath}clap.svg" width="28">
									</button>
									<br><span class="neayi-interaction-applause-label">1,2 k</span>
								</div>
								<div class="col px-1"><button class="w-100 btn btn-dark-green text-white neayi-interaction-suivre" type="button">Suivre</button><br><span class="neayi-interaction-suivre-label">350 intéressés</span></div>
								<div class="col px-1"><button class="w-100 btn btn-dark-green text-white neayi-interaction-doneit" type="button">Je le fais</button><br><span class="neayi-interaction-doneit-label">25 exploitations</span></div>

							</div>
						</div>
					</div>
					<div class="container px-0 interaction-links">
						<div class="row mx-n1">
							<div class="col px-1"><a class="w-100 btn btn-dark-green button comments-link" href="#cs-comments"><span class="material-icons mr-1 align-middle" aria-hidden="true">arrow_downward</span>
									<span class="questions-text">Poser une question</span></a></div>
							<div class="col-auto pr-1 pl-0 dropdown" id="neayi-interaction-mobile-menu">
								<button class="menu btn btn-dark-green" type="button" data-toggle="dropdown" data-boundary="viewport" aria-haspopup="true" aria-expanded="false">
									<span class="material-icons" aria-hidden="true">more_vert</span>
								</button>
							</div>
						</div>
					</div>
				</div>`).prependTo( '.contentHeader' );

			// Modale - Connectez-vous
			$(`<div class="modal fade" id="requiresLoginModal" tabindex="-1" aria-labelledby="requiresLoginModal" aria-hidden="true">
				<div class="modal-dialog">
					<div class="modal-content">
						<div class="modal-header border-bottom-0">
						<img width="200" src="/skins/skin-neayi/favicon/logo-triple-performance.svg" alt="Wiki Triple Performance">
						<button type="button" class="close" data-dismiss="modal" aria-label="Close">
							<span aria-hidden="true">&times;</span>
						</button>
						</div>
						<div class="modal-body">
							<p>Connectez-vous ou créez un compte afin de rejoindre la communauté qui s'intéresse à ce sujet en particulier. Recevez
							des notifications lors de nouveaux commentaires sur cette page, partagez votre expérience !</p>

							<p>Cette opération ne prend qu'une minute !</p>
						</div>
						<div class="modal-footer border-top-0">
							<a class="btn btn-success" href="/index.php?title=Special:Login&returnto=${relevantPageName}">Créez un compte ou connectez-vous <span style="vertical-align: middle;" class="material-icons" aria-hidden="true">arrow_forward</span></a>
						</div>
					</div>
				</div>
			</div>`).appendTo( 'body' );
			
			// Modale - Connectez-vous (svp)
			$(`<div class="modal fade" id="inviteLoginModal" tabindex="-1" aria-labelledby="requiresLoginModal" aria-hidden="true">
				<div class="modal-dialog  modal-lg">
					<div class="modal-content">
						<div class="modal-header border-bottom-0">
						<img width="200" src="/skins/skin-neayi/favicon/logo-triple-performance.svg" alt="Wiki Triple Performance">
						<button type="button" class="close" data-dismiss="modal" aria-label="Close">
							<span aria-hidden="true">&times;</span>
						</button>
						</div>
						<div class="modal-body">
							<p>Merci pour vos encouragements, ils sont appréciés par l'ensemble des membres de la communauté !</p>

							<p>Connectez-vous ou créez un compte afin de nous rejoindre, pour pouvoir suivre les pages, commenter ou partager votre expérience !
								(Cette opération ne prend qu'une minute !)</p>
						</div>
						<div class="modal-footer border-top-0">
							<a class="text-primary not-yet-link" data-dismiss="modal" id="tellUsMoreModalDismiss" href="#">Non merci pas encore</a>
							<a class="btn btn-success" href="/index.php?title=Special:Login&returnto=${relevantPageName}">Créez un compte ou connectez-vous <span style="vertical-align: middle;" class="material-icons" aria-hidden="true">arrow_forward</span></a>
						</div>
					</div>
				</div>
			</div>`).appendTo( 'body' );

			// Modale - Merci
			$(`<div class="modal fade" id="tellUsMoreModal" tabindex="-1" data-backdrop="static" aria-labelledby="tellUsMoreModal" aria-hidden="true">
				<div class="modal-dialog">
					<div class="modal-content">
						<form id="tellUsMoreForm">
							<div class="modal-header border-bottom-0">
							<h1 class="border-bottom-0">Merci !</h1>
							<button type="button" class="close" data-dismiss="modal" aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
							</div>
							<div class="modal-body">
								<p>Dites en plus à la commauté pour enrichir vos échanges avec les autres agriculteurs</p>
								<div class="row">
									<div class="col form-group">
										<label for="sinceInputId">Depuis quand ? <a href="#" role="button" class="badge badge-pill badge-light popover-neayi-help" data-toggle="popover" data-trigger="focus" title="Depuis quand ?" data-content="Renseignez l'année où vous avez démarré cette technique, afin d'aider les autres à comprendre votre degré d'expérience sur le sujet !">?</a></label>
										<select class="form-control" id="sinceInputId" name="since"></select>
									</div>
								</div>
								<div class="row">
									<div class="col form-check form-group">
										<input class="" id="followwheck" name="follow" type="checkbox" checked value="follow">
										<label class="form-check-label" for="followwheck">
											Suivre la page ?
										</label>
									</div>
								</div>
							</div>
							<div class="modal-footer border-top-0">
								<a class="text-primary not-yet-link" data-dismiss="modal" id="tellUsMoreModalDismiss" href="#">Non merci pas encore</a>
								<button class="btn btn-primary" id="tellUsMoreModalSubmit">Enregistrer</button>
							</div>
						</form>
					</div>
				</div>
			</div>`).appendTo( 'body' );
			
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

			$.ajax({
				url: "https://insights.dev.tripleperformance.fr/api/user/page/"+pageId+"?wiki_session_id=" + sessionId,
				dataType: 'json',
				method: "GET",				
				headers: {
					'Authorization': 'Bearer ' + apiToken
				}
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
			var apiToken = mw.config.get( 'NeayiInteractions' ).wgUserApiToken;

			var sessionId = mw.user.sessionId();
			var pageId = mw.config.get( 'wgArticleId' );

			console.log("ajaxInsights", actions, done_value);

			$.ajax({
				url: insightsURL + "api/page/"+pageId+"?wiki_session_id=" + sessionId,
				dataType: 'json',
				method: "POST",
				data: {
					interactions: actions,
					done_value: done_value
				},
				headers: {
					'Authorization': 'Bearer ' + apiToken
				}
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

