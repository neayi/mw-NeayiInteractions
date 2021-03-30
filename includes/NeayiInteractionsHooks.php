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

use Article;
use DatabaseUpdater;
use MediaWiki;
use OutputPage;
use Parser;
use PPFrame;
use SearchResult;
use Skin;
use SMW;
use SMW\DIWikiPage;
use SpecialSearch;
use Status;
use Title;
use User;
use WebRequest;
use WikiPage;

class NeayiInteractionsHooks {

	/**
	 * Implements BeforePageDisplay hook.
	 * See https://www.mediawiki.org/wiki/Manual:Hooks/BeforePageDisplay
	 * Initializes variables to be passed to JavaScript.
	 *
	 * @param OutputPage $output OutputPage object
	 * @param Skin $skin Skin object that will be used to generate the page
	 * @return bool continue checking hooks
	 */
	public static function initializeJS(
		OutputPage $output,
		Skin $skin
	) {
		$cs = NeayiInteractions::singleton();
		$cs->init( $output );
		return true;
	}

}
