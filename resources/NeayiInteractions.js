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

var neayiinteractions_controller = (function () {
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
			this.baseUrl = window.location.href.split(/[?#]/)[0];
			this.imagepath = mw.config.get('wgExtensionAssetsPath') +
				'/NeayiInteractions/images/';
			if (window.location.hash) {
				var hash = window.location.hash.substring(1);
				var queryIndex = hash.indexOf('?');
				if (queryIndex !== -1) {
					hash = hash.substring(0, queryIndex);
				}
				this.targetComment = hash;
			}
			this.isLoggedIn = mw.config.get('wgUserName') !== null;
			var config = mw.config.get('NeayiInteractions');

			mw.config.set('mwFollowedStatus', mw.config.get('NeayiInteractions').wgInitialFollowedStatus);

			this.setupDivs();

			this.getInitialCounts();

			this.loadStats();
			this.loadCommunity('');
		},
		scrollToAnchor: function (id) {
			var element = $('#' + id);
			if (element.length) {
				$('html,body').animate({ scrollTop: element.offset().top - 50 }, 'slow');
			}
		},
		setupDivs: function () {
			var self = this;
			var pageTitle = mw.config.get('wgTitle');
			var relevantPageName = mw.config.get('wgRelevantPageName');

			$("#interaction-title").text(pageTitle);

			// Copy the page menu in the new interaction bloc on the right
			$("#p-contentnavigation").clone(true).appendTo("#neayi-interaction-desktop-menu").removeAttr('id');

			// Move the original menu in the mobile version of the interaction bloc. Since we now have a copy of this
			// menu, we will remove all the IDs from the children divs, in order to avoir dupplicate IDs.
			// The clone (in the interaction block on the right) will keep its IDs.
			var chameleonMenu = $("#p-contentnavigation").parent();
			$("#p-contentnavigation").appendTo("#neayi-interaction-mobile-menu");
			$("#p-contentnavigation > div").removeAttr('id');
			chameleonMenu.remove();

			// Fix the login/create account links
			$('a.login-links').attr('href', '/index.php?title=Special:Login&returnto=' + relevantPageName);

			// Check if comments are enabled on the page. If not, we disable all interactions.
			var CSConfig = mw.config.get('CommentStreams');
			if (!CSConfig) {
				$('.comments-link').text('').prop('disabled', true);
				$('.interaction-buttons').hide();
				$('.interaction-links').hide();
			}
			else {
				// Enable the popover on the question marks in the modals
				$('.popover-neayi-help').popover()

				// Create the dropdown list in the "Je l'ai fait" modal
				const theYear = new Date();
				for (let year = theYear.getFullYear(); year > 2004; year--) {
					$('#sinceInputId').append($('<option>', {
						value: year,
						text: year
					}));
				}

				// Add events on the buttons to trigger the modals and API calls
				this.setupFollowButton($(" .neayi-interaction-suivre "));
				this.setupApplauseButton($(" .neayi-interaction-applause "));
				this.setupDoneButton($(" .neayi-interaction-doneit "));

				this.setupCommentsButton();
			}

			$( "#load-more-community").on('click', function (e) {

				e.preventDefault();
				$( "#load-more-community").prop("disabled", true);

				self.loadCommunity($( "#load-more-community").attr('href'));
			});

			$("#communityModal").scroll(function(){
				var scrollMoreButton = $('#load-more-community');

				if (!scrollMoreButton.is(":visible") || scrollMoreButton.prop("disabled"))
					return;

				if (scrollMoreButton.offset().top < window.innerHeight)
				{
					// Load another page
					$( "#load-more-community").prop("disabled", true);
					self.loadCommunity($( "#load-more-community").attr('href'));
				}
			});

			$('select.community-select').on('change', function() {
				self.loadCommunity();
			  });

			$('#community-doneit-only').on('change', function() {
				self.loadCommunity();
			  });

		},

		/**
		 * Get the initial counts from insights
		 */
		getInitialCounts: function () {
			var self = this;
			var sessionId = mw.config.get('NeayiInteractions').wgUserSessionId;
			var pageId = mw.config.get('wgArticleId');
			var insightsURL = mw.config.get('NeayiInteractions').wgInsightsRootURL;

			var apiToken = mw.config.get('NeayiInteractions').wgUserApiToken;
			var headers = {};
			if (apiToken != '')
				headers.Authorization = 'Bearer ' + apiToken;

			$.ajax({
				url: insightsURL + "api/user/page/" + pageId + "?wiki_session_id=" + sessionId,
				dataType: 'json',
				method: "GET",
				headers: headers
			}).done(function (data) {
				mw.config.set('mwInteractions', data);

				self.setApplauseLabels();
				self.setFollowersLabels();
				self.setDoneItLabels();
			});
		},

		/**
		 * Load the community from insights
		 */
		loadCommunity: function (url = '') {
			var self = this;
			var pageId = mw.config.get('wgArticleId');
			var insightsURL = mw.config.get('NeayiInteractions').wgInsightsRootURL;

			// https://insights.dev.tripleperformance.fr/api/page/4282/followers?type=do
			// Parameters: type: do | follow, cp, farming_id, cropping_id
			var rootURL = url;
			var bReset = false;

			if (rootURL == '')
			{
				bReset = true;

				var typeOfFollowers = 'follow';
				if ($('#community-doneit-only').prop('checked'))
					typeOfFollowers = "do";

				var dept = '';
				if ($('#departments-select').val())
					dept = '&dept=' + $('#departments-select').val();

				var farming_id = '';
				if ($('#famings-select').val())
					farming_id = '&farming_id=' + $('#famings-select').val();

				var cropping_id = '';
				if ($('#cropping-systems-select').val())
					cropping_id = '&cropping_id=' + $('#cropping-systems-select').val();

				rootURL = insightsURL + "api/page/" + pageId + "/followers?type=" + typeOfFollowers + dept + farming_id + cropping_id;
			}

			$.ajax({
				url: rootURL,
				dataType: 'json',
				method: "GET"
			}).done(function (data) {
				self.addCommunityPage(data.data, bReset);

				if (data.current_page != data.last_page)
				{
					rootURL = rootURL.replace(/&page=[0-9]+/, '') + '&page=' + (parseInt(data.current_page, 10) + 1);
					$( "#load-more-community").prop("disabled", false).show().attr('href', rootURL);
				}
				else
				{
					$( "#load-more-community").hide().attr('href', '');
				}
			});
		},

		/**
		 * Load the stats from insights
		 */
		 loadStats: function () {
			var self = this;
			var pageId = mw.config.get('wgArticleId');
			var insightsURL = mw.config.get('NeayiInteractions').wgInsightsRootURL;

			// https://insights.dev.tripleperformance.fr/api/page/4282/stats

			$.ajax({
				url: insightsURL + "api/page/" + pageId + "/stats",
				dataType: 'json',
				method: "GET"
			}).done(function (data) {
				self.setStats(data);
			});
		},

		hasApplaused: function () {
			var interactions = mw.config.get('mwInteractions');

			if (interactions && interactions.state.applause)
				return true;

			return false;
		},

		hasFollowed: function () {
			var followedStatus = mw.config.get('mwFollowedStatus');

			return followedStatus == true;
		},

		hasDone: function () {
			var interactions = mw.config.get('mwInteractions');

			if (interactions && interactions.state.done)
				return true;

			return false;
		},

		ajaxInsights: function (actions, done_value = []) {
			var self = this;

			var insightsURL = mw.config.get('NeayiInteractions').wgInsightsRootURL;

			var sessionId = mw.user.sessionId();
			var pageId = mw.config.get('wgArticleId');

			var headers = {};
			var apiToken = mw.config.get('NeayiInteractions').wgUserApiToken;
			if (apiToken != '')
				headers.Authorization = 'Bearer ' + apiToken;

			$.ajax({
				url: insightsURL + "api/page/" + pageId + "?wiki_session_id=" + sessionId,
				dataType: 'json',
				method: "POST",
				data: {
					interactions: actions,
					done_value: done_value
				},
				headers: headers
			}).done(function (data) {
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
		setupApplauseButton: function (buttons) {
			var self = this;

			buttons.on('click', function (e) {

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
			});

		},


		/**
		 * Sets the watch status on the buttons, and prepare the click event that'll trigger the watch API
		 * 
		 * @param jQuery buttons list buttons 
		 */
		setupFollowButton: function (buttons) {
			var self = this;

			buttons.on('click', function (e) {
				if (mw.user.isAnon()) {
					$('#requiresLoginModal').modal('show')
					return;
				}

				var mwTitle = mw.config.get('wgRelevantPageName');

				self.disableButton(buttons);

				if (self.hasFollowed()) {
					new mw.Api().unwatch(mwTitle)
						.done(function () {
							mw.config.set('mwFollowedStatus', false);
						})
						.fail(function () {
						});

					self.ajaxInsights(['unfollow']);
				}
				else {
					new mw.Api().watch(mwTitle)
						.done(function () {
							mw.config.set('mwFollowedStatus', true);
						})
						.fail(function () {
						});

					self.ajaxInsights(['follow']);
				}

				e.preventDefault();
			});

		},

		/**
		 * Prepare the click event that'll trigger the Done API
		 * 
		 * @param jQuery buttons list buttons 
		 */
		setupDoneButton: function (buttons) {
			var self = this;

			buttons.on('click', function (e) {

				if (mw.user.isAnon()) {
					$('#requiresLoginModal').modal('show')
					return;
				}

				self.disableButton(buttons);

				if (self.hasDone()) {
					mw.config.set('mwDoneItStatus', false);
					buttons.prop("disabled", false);

					self.ajaxInsights(['undone']);
				}
				else {
					mw.config.set('mwDoneItStatus', true);
					buttons.prop("disabled", false);

					$('#tellUsMoreModalSubmit').on('click', function (e) {
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
			});

		},

		/**
		 * Enable and add an event on the comments button, if the comments are enabled on the page
		 * Set the label with the number of existing comments
		 */
		setupCommentsButton: function () {
			var CSConfig = mw.config.get('CommentStreams');

			if (!CSConfig) {
				$('.comments-link').text('').prop('disabled', true);
				return;
			}

			if (CSConfig.comments && CSConfig.comments.length > 0) {
				// When we click on the "N questions" link, we scroll down the page to the comments.
				// Todo: if comments are disabled on the page, we should remove this interaction!
				$('.comments-link').on('click', function () {
					self.scrollToAnchor('cs-comments');
					window.location.hash = '#cs-comments';
				});

				// Now change the label
				var nbQuestionsAvecReponses = 0;
				var parentIndex;

				for (parentIndex in CSConfig.comments) {
					var parentComment = CSConfig.comments[parentIndex];
					if (parentComment.children)
						nbQuestionsAvecReponses++;
				}

				var label = $(".questions-text");

				if (nbQuestionsAvecReponses == 1)
					label.text("1 question avec réponses");
				else if (nbQuestionsAvecReponses > 0)
					label.text(nbQuestionsAvecReponses + " questions avec réponses");
				else if (CSConfig.comments.length == 1)
					label.text("1 question");
				else
					label.text(CSConfig.comments.length + " questions");
			}
		},

		setApplauseLabels: function () {
			var self = this;

			var applauses = 0;
			var interactions = mw.config.get('mwInteractions');

			if (interactions && interactions.counts.applause)
				applauses = interactions.counts.applause;

			if (applauses >= 1000)
				applauses = String(Math.round(applauses / 100) / 10) + " k";

			$('.neayi-interaction-applause').html(`<img src="${self.imagepath}clap.svg" width="28">`).prop("disabled", false);
			$('.neayi-interaction-applause-label').text(applauses);
		},

		setFollowersLabels: function () {
			var followers = 0;
			var interactions = mw.config.get('mwInteractions');

			if (interactions && interactions.counts.follow)
				followers = interactions.counts.follow;

			$(".neayi-interaction-suivre-label").text(followers + " interessés");

			if (this.hasFollowed())
				$(".neayi-interaction-suivre").html(`<span style="vertical-align: middle;">Suivi</span> <span style="vertical-align: middle;" class="material-icons" aria-hidden="true">check</span>`).prop("disabled", false);
			else
				$(".neayi-interaction-suivre").text("Suivre").prop("disabled", false);
		},

		setDoneItLabels: function () {
			var doers = 0;
			var interactions = mw.config.get('mwInteractions');
			if (interactions && interactions.counts.done)
				doers = interactions.counts.done;

			if (doers < 2)
				doers = doers + " exploitation";
			else if (doers >= 1000)
				doers = String(Math.round(doers / 100) / 10) + " k exploitations";
			else
				doers = doers + " exploitations";

			$(".neayi-interaction-doneit-label").text(doers);

			if (this.hasDone())
				$(".neayi-interaction-doneit").html(`<span style="vertical-align: middle;">Fait !</span> <span style="vertical-align: middle;" class="material-icons" aria-hidden="true">beenhere</span>`).prop("disabled", false);
			else
				$(".neayi-interaction-doneit").text("Je le fais").prop("disabled", false);
		},

		disableButton: function (buttons) {
			buttons.html(`<div class="spinner-border spinner-border-sm" role="status">
							<span class="sr-only">Loading...</span>
						 </div>`);
			buttons.prop("disabled", true);
		},

		/**
		 * Parses the result of the ajax call and display the result
		 * @param {*} data
		 */
		 setStats: function (data) {

			var self = this;

			data.department.forEach(item => {

				if (!item.departmentData)
					return;

				self.addOptionToSelect('departments-select', item.departmentData.pretty_page_label + ' (' + item.count + ')', item.department);
			});

			// Add the productions
			data.characteristics.farming.forEach(item => {
				self.addOptionToSelect('famings-select', item.pretty_page_label + ' (' + item.count + ')', item.uuid);
			});
			data.characteristics.croppingSystem.forEach(item => {
				self.addOptionToSelect('cropping-systems-select', item.pretty_page_label + ' (' + item.count + ')', item.uuid);
			});

			self.setupDepartmentsStats(data.department);
			self.setupMap(data.department);
			self.setupCharacteristicsStats('#famings-stats', data.characteristics.farming);
			self.setupCharacteristicsStats('#cropping-systems-stats', data.characteristics.croppingSystem);

			$('#communityModal').modal('handleUpdate');
		},

		addOptionToSelect: function (selectId, label, value) {
			$('#'+selectId).append($("<option>").attr("value", value).text(label));
		},

		/**
		 * Parses the result of the ajax call and display the result
		 * @param {*} data
		 */
		addCommunityPage: function (data, bReset) {

			var self = this;

			if (bReset)
				$('#community-items').html('');

			var connectedUserGUID = mw.config.get('NeayiInteractions').wgUserGuid;

			data.forEach(user => {

				if (user['structure'] != '')
					user['structure'] = ' (<a href="/wiki/Structure:'+user['structure']+'">'+user['structure']+'</a>)';

				if (user['hasDone'] == 0)
					user['hasDone'] = '<span class="status">Le suit</span>';
				else if (user['hasDone'] == 1)
					user['hasDone'] = '<span class="status">Le fait</span>';
				else
					user['hasDone'] = '<span class="status">Le fait depuis ' + user['hasDone'].substring(0, 4) + '</span>';

				var insightsURL = mw.config.get('NeayiInteractions').wgInsightsRootURL;

				var profileURL = insightsURL + 'tp/' + encodeURI(user['fullname']) +'/' + user['userGuid'];
				if (connectedUserGUID == user['userGuid'])
					profileURL = insightsURL + 'profile';

				var userdiv = $(`<div class="follower-item d-flex flex-wrap">
								<div class="follower-item-avatar"><img
										src="` + insightsURL + `api/user/avatar/` + user['userGuid'] + `/100">
								</div>
								<div class="follower-item-user">
									<div class="follower-item-username"><a
											href="` + profileURL + `">` + user['fullname'] + `</a> ` + user['hasDone'] + `</div>
									<div class="follower-item-usertitle">` + user['sector'] + user['structure'] + `</div>
								</div>
								<div class="follower-item-features flex-fill">
									<div class="d-flex flex-wrap justify-content-start caracteristiques-exploitation"></div>
								</div>
							</div>`);

				var features = userdiv.find( "div.caracteristiques-exploitation" );

				// Add the department
				var depName = user['characteristicsDepartement'][0].page;
				var depIcon = user['characteristicsDepartement'][0].icon;
				features.append(self.makeFeature(depName, 'Département ' + user['department'], depIcon));

				// Add the productions
				user['productions'].forEach(element => {
					features.append(self.makeFeature(element['caption'], element['page'], element['icon']));
				});

				user['characteristics'].forEach(element => {
					features.append(self.makeFeature(element['caption'], element['page'], element['icon']));
				});

				$( "#community-items" ).append(userdiv);
			});

			$('#communityModal').modal('handleUpdate');
		},

		makeFeature: function(caption, page, imageURL = '') {

			if (imageURL != '')
			{
				// Make sure the Icon URL ends with /60 for the right width
				if (!imageURL.match(/\/60/))
					imageURL = imageURL + '/60';

				return $( `<div class="caracteristique-exploitation"><p>
											<a href="/wiki/` + page + `" title="` + page + `"><img alt="` + page + `" src="` + imageURL + `" width="60" height="60"></a>
											<span><a href="/wiki/` + page + `" title="` + page + `">` + caption + `</a></span>
										</p></div>`);
			}
			else
				return $( `<div class="caracteristique-exploitation"><p>
										<span><a href="/wiki/` + page + `" title="` + page + `">` + caption + `</a></span>
									</p></div>`);
		},

		setupDepartmentsStats: function(deptStats) {
			deptStats.sort(function(a, b) {
				return b.count - a.count;
			  });

			deptStats.slice(0, 5).forEach(function (e, i) {
				$( "#departments-stats" )
					.append( $(`<div class="dept-stat"><a href="#" data-dept="`+e.department+`"><span class="count">x ` + e.count + `</span><span class="dept-name">` + e.departmentData.pretty_page_label + `</span></a></div>`) );
			});

			$( "#departments-stats a" ).on('click', function (e) {
				e.preventDefault();

				$('#commununity-tab').tab('show');

				var dept = $(this).data('dept');
				$("#departments-select").val(dept).change();
			});
		},

		setupCharacteristicsStats: function(divId, characteristicsStats) {

			characteristicsStats.sort(function(a, b) {
				return b.count - a.count;
			  });

			var insightsURL = mw.config.get('NeayiInteractions').wgInsightsRootURL;

			characteristicsStats.slice(0, 5).forEach(function (e, i) {
				$( divId + " .stats-icons" )
					.append( $(`<div class="caracteristique-exploitation">
									<div>
										<div><a href="#" data-guid="` + e.uuid + `" data-type="` + e.type + `" title="` + e.page_label + `"><img alt="` + e.page_label + `" src="`+insightsURL + 'api/icon/' + e.uuid+`/90"></a></div>
										<div class="label"><a href="#" data-guid="` + e.uuid + `" data-type="` + e.type + `" title="` + e.page_label + `">` + e.pretty_page_label + `</a></div>
									</div>
									<div class="caracteristique-stat">x ` + e.count + `</div>
								</div>`) );
			});

			$( ".stats-icons a" ).on('click', function (e) {
				e.preventDefault();

				$('#commununity-tab').tab('show');

				var guid = $(this).data('guid');
				var type = $(this).data('type');

				switch (type) {
					case 'croppingSystem':
						$("#cropping-systems-select").val(guid).change();
						break;

					case 'farming':
						$("#famings-select").val(guid).change();
						break;

					default:
						break;
				}
			});
		},

		/**
		 * Setup the d3js map as inspired from https://www.datavis.fr/index.php?page=map-population
		 * @param {*} deptStats
		 */
		setupMap: function(deptStats) {

			const width = 300, height = 270;
			const path = d3.geoPath();
			const projection = d3.geoConicConformal() // Lambert-93
				.center([2.454071, 46.279229]) // Center on France
				.scale(1500)
				.translate([width / 2, height / 2]);
			path.projection(projection);

			const svg = d3.select('#map').append("svg")
				.attr("id", "svg")
				.attr("width", width)
				.attr("height", height)
				.attr("class", "Greens");

			const deps = svg.append("g");

			var promises = [];
			promises.push(d3.json('/extensions/NeayiInteractions/resources/departments.json'));

			Promise.all(promises).then(function (values) {
				const geojson = values[0]; // Récupération de la première promesse : le contenu du fichier JSON

				var features = deps
					.selectAll("path")
					.data(geojson.features)
					.enter()
					.append("path")
					.attr('id', d => "d" + d.properties.CODE_DEPT)
					.attr("d", path);

				// On calcule le max de la population pour adapter les couleurs
				var quantile = d3.scaleQuantile()
					.domain([0, d3.max(deptStats, e => +e.count)])
					.range(d3.range(9));

				deptStats.forEach(function (e, i) {

					d3.select("#d" + e.department)
						.attr("class", d => "department q" + quantile(+e.count) + "-9")
						.on("mouseover", function (d) {
							div.transition()
								.duration(200)
								.style("opacity", 1);
							div.html("<b>Département : </b>" + e.departmentData.pretty_page_label + "<br>"
								+ "<b>Population : </b>" + e.count + "<br>")
								.style("left", (d3.event.pageX + 30) + "px")
								.style("top", (d3.event.pageY - 30) + "px");
						})
						.on("mouseout", function (d) {
							div.style("opacity", 0);
							div.html("")
								.style("left", "-500px")
								.style("top", "-500px");
						})
						.on('click', function (d) {
							$('#commununity-tab').tab('show');
							$("#departments-select").val(e.department).change();
						});
				});
			});

			var div = d3.select("body").append("div")
				.attr("class", "tooltip")
				.style("opacity", 0);
		}

	};
}());

window.NeayiInteractionsController = neayiinteractions_controller;

(function () {
	$(document)
		.ready(function () {
			if (mw.config.exists('NeayiInteractions')) {
				window.NeayiInteractionsController.initialize();
			}
		});
}());

