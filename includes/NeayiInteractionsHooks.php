<?php
/*
 * Copyright (c) 2023 Neayi SAS
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

use OutputPage;
use Parser;
use PPFrame;
use Skin;

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



	/**
	 * Implements ParserFirstCallInit hook.
	 * See https://www.mediawiki.org/wiki/Manual:Hooks/ParserFirstCallInit
	 * Adds <no-neayi-interactions /> magic words.
	 *
	 * @param Parser $parser the parser
	 * @return bool continue checking hooks
	 */
	public static function onParserSetup( Parser $parser ) {

		$parser->setHook( 'no-neayi-interactions',
			'MediaWiki\Extension\NeayiInteractions\NeayiInteractionsHooks::disableNeayiInteractions' );

		return true;
	}

	/**
	 * Implements tag function, <no-comment-streams/>, which disables
	 * NeayiInteractions on a page.
	 *
	 * @param string $input input between the tags (ignored)
	 * @param array $args tag arguments
	 * @param Parser $parser the parser
	 * @param PPFrame $frame the parent frame
	 * @return string to replace tag with
	 */
	public static function disableNeayiInteractions( $input, array $args, Parser $parser, PPFrame $frame ) {
		$parser->getOutput()->updateCacheExpiry( 0 );
		$ni = NeayiInteractions::singleton();
		$ni->disableInteractionsOnPage();
		return "";
	}

}
