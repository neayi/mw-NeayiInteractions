<?php
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

namespace MediaWiki\Extension\NeayiInteractions;

use ExtensionRegistry;
use MWNamespace;
use MediaWiki\MediaWikiServices;

class NeayiInteractions {

	// NeayiInteractions singleton instance
	private static $instance = null;

	const INTERACTIONS_ENABLED = 1;
	const INTERACTIONS_DISABLED = -1;
	const INTERACTIONS_INHERITED = 0;

	// no NeayiInteractions flag
	private $areInteractionsEnabled = self::INTERACTIONS_INHERITED;

	/**
	 * create a NeayiInteractions singleton instance
	 *
	 * @return NeayiInteractions a singleton NeayiInteractions instance
	 */
	public static function singleton() : self {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * disables the display of comments on the current page
	 * 
	 * Called on hook <no-neayi-interactions/> or <no-comment-streams/>
	 */
	public function disableInteractionsOnPage() {
		$this->areInteractionsEnabled = self::INTERACTIONS_DISABLED;
	}

	/**
	 * initializes the display of comments
	 *
	 * @param OutputPage $output OutputPage object
	 */
	public function init( $output ) {
		if ( $this->checkDisplayComments( $output ) ) {
			$this->initJS( $output );
		}
	}

	/**
	 * checks to see if comments should be displayed on this page
	 *
	 * @param OutputPage $output the OutputPage object
	 * @return bool true if comments should be displayed on this page
	 */
	private function checkDisplayComments( $output ) {
		// don't display comments on this page if they are explicitly disabled
		if ( $this->areInteractionsEnabled === self::INTERACTIONS_DISABLED ) {
			return false;
		}

		// don't display comments on any page action other than view action
		if ( \Action::getActionName( $output->getContext() ) !== "view" ) {
			return false;
		}

		$title = $output->getTitle();

		// don't display comments on pages that do not exist
		if ( !$title->exists() ) {
			return false;
		}

		// don't display comments on redirect pages
		if ( $title->isRedirect() ) {
			return false;
		}

		// display comments on this page if they are explicitly enabled
		if ( $this->areInteractionsEnabled === self::INTERACTIONS_ENABLED ) {
			return true;
		}

		// don't display comments in a talk namespace unless:
		if ( $title->isTalkPage() ) {
			return false;
		}

		// if $wgNeayiInteractionsAllowedNamespaces is not set, display comments
		// in all content namespaces and if set to -1, don't display comments
		$config = $output->getConfig();
		$niAllowedNamespaces = $config->get( 'NeayiInteractionsAllowedNamespaces' );
		if ( $niAllowedNamespaces === null ) {
			$niAllowedNamespaces = $config->get( 'ContentNamespaces' );
		} elseif ( $niAllowedNamespaces === self::INTERACTIONS_DISABLED ) {
			return false;
		} elseif ( !is_array( $niAllowedNamespaces ) ) {
			$niAllowedNamespaces = [ $niAllowedNamespaces ];
		}

		// only display comments in subject namespaces in the list of allowed
		// namespaces
		if ( !in_array( $namespace, $niAllowedNamespaces ) ) {
			return false;
		}

		return true;
	}

	/**
	 * initialize JavaScript
	 *
	 * @param OutputPage $output the OutputPage object
	 * @param Comment[] $comments array of comments on the current page
	 */
	private function initJS( $output ) {
		// determine if comments should be initially collapsed or expanded
		// if the namespace is a talk namespace, use state of its subject namespace
		$title = $output->getTitle();
		$namespace = $title->getNamespace();
		if ( $title->isTalkPage() ) {
			$namespace = MWNamespace::getSubject( $namespace );
		}

		$neayiInteractionsParams = [];
		
		$neayiInteractionsParams[ 'wgUserApiToken' ] = '';
		$user = $output->getUser();
		if ( !$user->isAnon() ) {
			$neayiInteractionsParams[ 'wgInitialFollowedStatus' ] = $user->isWatched( $title );
			$neayiInteractionsParams[ 'wgUserApiToken' ] = self::getNeayiApiToken( $user );
		}
		$neayiInteractionsParams[ 'wgUserSessionId' ] = $_COOKIE[$GLOBALS['wgDBname'] . 'mwuser-sessionId'];

		$store = MediaWikiServices::getInstance()->getWatchedItemStore();
		$neayiInteractionsParams[ 'wgInitialFollowedCount' ] = $store->countWatchers( $title );
		$neayiInteractionsParams[ 'wgInsightsRootURL' ] = $GLOBALS['wgInsightsRootURL'];

		$output->addJsConfigVars( 'NeayiInteractions', $neayiInteractionsParams );
		$output->addModules( 'ext.NeayiInteractions' );
	}
	

	/** 
	 * Cache the GUIDs for Users
	 */
	private static function getNeayiApiToken( $user )
	{
		$dbr = wfGetDB(DB_REPLICA);
		$result = $dbr->selectRow(
			'neayiauth_users',
			[
				'neayiauth_external_apitoken'
			],
			[
				'neayiauth_user' => $user->mId
			],
			__METHOD__
		);
		if ( $result )
			return (string)$result->neayiauth_external_apitoken;
			
		return '';
	}	
}
