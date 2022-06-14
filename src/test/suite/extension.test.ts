// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

import * as assert from 'assert';
import LinkifyIt = require('linkify-it');
import { LinkifyItExtender } from '../../lib';

suite('Extension Test Suite', () => {

	test('With only prefix configured (not URI schema)', () => {
		const md = "Here is a short link: goto/abc/123;x=1&y=2?z=3!";
		let linkify = LinkifyIt();
		assert(!linkify.test(md));

		{
			let extender = new LinkifyItExtender(linkify);
			extender.addRule({ prefix: "goto/" });
		}
		assert(linkify.test(md));
		assert.deepStrictEqual(
			JSON.parse(JSON.stringify(linkify.match(md))),
			[{
				index: 22,
				lastIndex: 46,
				raw: 'goto/abc/123;x=1&y=2?z=3',
				schema: '',
				text: 'goto/abc/123;x=1&y=2?z=3',
				url: 'http://goto/abc/123;x=1&y=2?z=3',
			}]);
	});

	test('With only prefix configured (URI schema)', () => {
		const md = "This is a Skype link: skype:echo123?call.";
		let linkify = LinkifyIt();
		assert(!linkify.test(md));

		{
			let extender = new LinkifyItExtender(linkify);
			extender.addRule({ prefix: "skype:" });
		}
		assert(linkify.test(md));
		assert.deepStrictEqual(
			JSON.parse(JSON.stringify(linkify.match(md))),
			[{
				index: 22,
				lastIndex: 40,
				raw: 'skype:echo123?call',
				schema: 'skype:',
				text: 'skype:echo123?call',
				url: 'skype:echo123?call',
			}]);
	});

	test('With tail configured, and url configured with placeholder', () => {
		const md = "This is a Twitter handle @jack. Not to be confused with an Email address jack@twitter.com.";
		const expectedHandleMatch = {
			index: 25,
			lastIndex: 30,
			raw: '@jack',
			schema: '@',
			text: '@jack',
			url: 'https://twitter.com/jack',
		};
		const expectedEmailMatch = {
			index: 73,
			lastIndex: 89,
			raw: 'jack@twitter.com',
			schema: 'mailto:',
			text: 'jack@twitter.com',
			url: 'mailto:jack@twitter.com',
		};

		let linkify = LinkifyIt();
		assert(linkify.test(md));
		assert.deepStrictEqual(
			JSON.parse(JSON.stringify(linkify.match(md))),
			[expectedEmailMatch]
		);

		{
			let extender = new LinkifyItExtender(linkify);
			extender.addRule({
				"prefix": "@",
				"tail": "([a-zA-Z0-9_]){1,15}(?!_)",
				"url": "https://twitter.com/%TAIL%"
			});
		}
		assert(linkify.test(md));
		assert.deepStrictEqual(
			JSON.parse(JSON.stringify(linkify.match(md))),
			[expectedHandleMatch, expectedEmailMatch]);
	});

	test('With tail configured, url configured with backreferences, and text configured with placeholder', () => {
		const md = "This is a GitHub issue gh-issue:tomtung/vscode-markdown-linkify#123.";
		let linkify = LinkifyIt();
		assert(!linkify.test(md));

		{
			let extender = new LinkifyItExtender(linkify);
			extender.addRule({
				"prefix": "gh-issue:",
				"tail": "([a-zA-Z\\d](?:[a-zA-Z\\d]|-(?=[a-zA-Z\\d]))+)\/([a-zA-Z.\\-_]+)(?:#(\\d+))",
				"url": "https://github.com/$1/$2/issues/$3",
				"text": "%TAIL%"
			});
		}
		assert(linkify.test(md));
		assert.deepStrictEqual(
			JSON.parse(JSON.stringify(linkify.match(md))),
			[{
				index: 23,
				lastIndex: 67,
				raw: 'gh-issue:tomtung/vscode-markdown-linkify#123',
				schema: 'gh-issue:',
				text: 'tomtung/vscode-markdown-linkify#123',
				url: 'https://github.com/tomtung/vscode-markdown-linkify/issues/123',
			}]);
	});

});
