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


			mw.config.set('mwWatchedStatus', mw.config.get( 'NeayiInteractions' ).wgInitialWatchedStatus);
			mw.config.set('mwWatchedCount', mw.config.get( 'NeayiInteractions' ).wgInitialWatchedCount);

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

			// Desktop bloc is added at the top/right of the page, in the margin
			$(`<div class="interaction-bloc">
					<div class="interaction-top">
						${pageTitle}
				
						<div class="container px-0 interaction-buttons">
							<div class="row mx-n1">
								<div class="col-auto px-1">
									<button class="btn btn-dark-green text-white neayi-interaction-applause" type="button">
										<img src="${this.imagepath}clap.svg" width="28">
									</button>
									<br><span class="neayi-interaction-applause-label">1,2 k</span>
								</div>
								<div class="col px-1"><button class="w-100 btn btn-dark-green text-white neayi-interaction-suivre" type="button">Suivre -</button><br><span class="neayi-interaction-suivre-label">350 intéressés</span></div>
								<div class="col px-1"><button class="w-100 btn btn-dark-green text-white neayi-interaction-doneit" type="button">Je le fais</button><br><span class="neayi-interaction-doneit-label">25 exploitations</span></div>
				
							</div>
						</div>
					</div>
					<div class="container px-0 interaction-links">
						<div class="row mx-n1">
							<div class="col px-1"><a class="w-100 btn btn-dark-green button comments-link" href="#cs-comments">
									<span class="material-icons mr-1 align-middle" aria-hidden="true">arrow_downward</span>
									<span class="questions-text">Poser une question</span></a></div>
							<div class="col-auto pr-1 pl-0 dropdown" id="neayi-interaction-desktop-menu">
								<button class="menu btn btn-dark-green" type="button" data-toggle="dropdown" data-boundary="viewport" aria-haspopup="true" aria-expanded="false">
									<span class="material-icons" aria-hidden="true">more_vert</span>
								</button>
							</div>
				
						</div>
					</div>
				</div>`).appendTo( '.rightSide' );
			
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

				$(`<div class="modal fade" id="requiresLoginModal" tabindex="-1" aria-labelledby="requiresLoginModal" aria-hidden="true">
					<div class="modal-dialog">
						<div class="modal-content">
							<div class="modal-header">
							<img width="200" src="/skins/skin-neayi/favicon/logo-triple-performance.svg" alt="Wiki Triple Performance">
							<button type="button" class="close" data-dismiss="modal" aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
							</div>
							<div class="modal-body">
								<p>Pour pouvoir suivre la page et recevoir des notifications quand elle est mise à jour ou lors de nouvelles questions,
								vous devez vous connecter ou créer un compte.</p>

								<p>Cette opération ne prend qu'une minute !</p>
							</div>
							<div class="modal-footer">
								<a class="btn btn-success" href="/index.php?title=Special:Login&returnto=${relevantPageName}">Créer un compte ou se connecter <span style="vertical-align: middle;" class="material-icons" aria-hidden="true">arrow_forward</span></a>
							</div>
						</div>
					</div>
				</div>`).appendTo( 'body' );

				var chameleonMenu = $( "#p-contentnavigation" ).parent();
				$( "#p-contentnavigation" ).appendTo( "#neayi-interaction-mobile-menu" );
				$( ".p-contentnavigation > div" ).removeAttr('id');
				$( "#p-contentnavigation" ).removeAttr('id');
				chameleonMenu.remove();

				$( '.comments-link' ).on( 'click', function () {
					self.scrollToAnchor( 'cs-comments' );
					window.location.hash = '#cs-comments';
				} );
				
				this.setWatch( $(" .neayi-interaction-suivre ") );
				this.setWatchedLabels();

				this.setApplause( $(" .neayi-interaction-applause ") );
				this.setApplauseLabels();

				this.setDoneIt( $(" .neayi-interaction-doneit ") );
				this.setDoneItLabels();

				var CSConfig = mw.config.get( 'CommentStreams' );
				if (CSConfig.comments && CSConfig.comments.length > 0)
				{
					var nbQuestionsAvecReponses = 0;
					var parentIndex;

					for ( parentIndex in CSConfig.comments ) {
						var parentComment = CSConfig.comments[ parentIndex ];
						if (parentComment.children)
							nbQuestionsAvecReponses++;
					}
					
					if (nbQuestionsAvecReponses == 1)
						$( ".questions-text" ).text( "1 question avec réponses");
					else if (nbQuestionsAvecReponses > 0)
						$( ".questions-text" ).text( nbQuestionsAvecReponses + " questions avec réponses");
					else if (CSConfig.comments.length == 1)
						$( ".questions-text" ).text( "1 question");
					else
						$( ".questions-text" ).text( CSConfig.comments.length + " questions");
				}
		},

		/**
		 * Sets the watch status on the buttons, and prepare the click event that'll trigger the watch API
		 * 
		 * @param jQuery buttons list buttons 
		 */
		setWatch: function( buttons ) {
			var self = this;

			var bWatched = mw.config.get( 'mwWatchedStatus' );
			if (bWatched)
			{
				buttons.html(`<span style="vertical-align: middle;">Suivi</span> <span style="vertical-align: middle;" class="material-icons" aria-hidden="true">check</span>`);
			}
			else
			{
				buttons.text("Suivre");
			}

			buttons.on( 'click', function ( e ) {

				if (mw.user.isAnon()) {
					$('#requiresLoginModal').modal('show')
					return;
				}

				var bWatched = mw.config.get( 'mwWatchedStatus' );
				var mwTitle = mw.config.get( 'wgRelevantPageName' );

				buttons.html(`<div class="spinner-border spinner-border-sm" role="status">
								<span class="sr-only">Loading...</span>
							</div>`);
				buttons.prop("disabled", true);

				if (bWatched)
				{
					new mw.Api().unwatch( mwTitle )
						.done( function () {
							buttons.text("Suivre");
							mw.config.set('mwWatchedStatus', false);
							buttons.prop("disabled", false);

							var watchers = mw.config.get( 'mwWatchedCount' );
							mw.config.set('mwWatchedCount', watchers - 1);

							self.setWatchedLabels();
						} )
						.fail( function () {
							buttons.html(`<span style="vertical-align: middle;">Suivi</span> <span style="vertical-align: middle;" class="material-icons" aria-hidden="true">check</span>`);
							buttons.prop("disabled", false);
						} );
				}
				else
				{
					new mw.Api().watch( mwTitle )
						.done( function () {
							buttons.html(`<span style="vertical-align: middle;">Suivi</span> <span style="vertical-align: middle;" class="material-icons" aria-hidden="true">check</span>`);
							mw.config.set('mwWatchedStatus', true);
							buttons.prop("disabled", false);

							var watchers = mw.config.get( 'mwWatchedCount' );
							mw.config.set('mwWatchedCount', watchers + 1);	
							
							self.setWatchedLabels();
						} )
						.fail( function () {
							buttons.text("Suivre");
							buttons.prop("disabled", false);
						} );					
				}

				e.preventDefault();
			} );
		
		},

		setWatchedLabels: function( ) {
			var watchers = mw.config.get( 'mwWatchedCount' );

			$(" .neayi-interaction-suivre-label ").text(watchers + " interessés");
		},


		/**
		 * Prepare the click event that'll trigger the applause API
		 * 
		 * @param jQuery buttons list buttons 
		 */
		setApplause: function( buttons ) {
			var self = this;

			buttons.on( 'click', function ( e ) {

				buttons.html(`<div class="spinner-border spinner-border-sm" role="status">
								<span class="sr-only">Loading...</span>
							</div>`);
				buttons.prop("disabled", true);

				// API Success
				buttons.html(`<img src="${self.imagepath}clap.svg" width="28">`);
				buttons.prop("disabled", false);

				var applauses = mw.config.get( 'mwApplauseCount' );
				mw.config.set('mwApplauseCount', applauses + 1);

				self.setApplauseLabels();
				// End API Success

				e.preventDefault();
			} );
		
		},
		

		setApplauseLabels: function( ) {
			var applauses = mw.config.get( 'mwApplauseCount' );

			if (applauses >= 1000)
				applauses = String(Math.round(applauses / 100) / 10) + " k";

			$(" .neayi-interaction-applause-label ").text(applauses);
		},



		/**
		 * Prepare the click event that'll trigger the Done API
		 * 
		 * @param jQuery buttons list buttons 
		 */
		 setDoneIt: function( buttons ) {
			var self = this;

			buttons.on( 'click', function ( e ) {

				var bDoneIt = mw.config.get( 'mwDoneItStatus' );
				var mwTitle = mw.config.get( 'wgRelevantPageName' );

				buttons.html(`<div class="spinner-border spinner-border-sm" role="status">
								<span class="sr-only">Loading...</span>
							</div>`);
				buttons.prop("disabled", true);

				if (bDoneIt)
				{
					buttons.text("Je le fais");
					mw.config.set('mwDoneItStatus', false);
					buttons.prop("disabled", false);

					var doers = mw.config.get( 'mwDoneItCount' );
					mw.config.set('mwDoneItCount', doers - 1);

					self.setDoneItLabels();
				}
				else
				{
					buttons.html(`<span style="vertical-align: middle;">Fait !</span> <span style="vertical-align: middle;" class="material-icons" aria-hidden="true">beenhere</span>`);
					mw.config.set('mwDoneItStatus', true);
					buttons.prop("disabled", false);

					var doers = mw.config.get( 'mwDoneItCount' );
					mw.config.set('mwDoneItCount', doers + 1);	
					
					self.setDoneItLabels();
				}

				e.preventDefault();
			} );
		
		},

		setDoneItLabels: function( ) {
			var doers = mw.config.get( 'mwDoneItCount' );

			if (doers < 2)
				doers = doers + " exploitation";
			else if (doers >= 1000)
				doers = String(Math.round(doers / 100) / 10) + " k exploitations";
			else
				doers = doers + " exploitations";

			$(" .neayi-interaction-doneit-label ").text(doers);
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

