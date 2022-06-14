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

import * as vscode from 'vscode';
import * as MarkdownIt from 'markdown-it';
import { LinkifyItExtender, Rule } from './lib';

const configurationSection = "markdown-linkify";

export function activate(context: vscode.ExtensionContext) {
	vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration(configurationSection)) {
			vscode.commands.executeCommand('markdown.api.reloadPlugins');
		}
	}, undefined, context.subscriptions);

	return {
		extendMarkdownIt(md: MarkdownIt) {
			let rules;
			try {
				rules = vscode.workspace
					.getConfiguration(configurationSection)
					.get<Rule[]>("rules");
			} catch (err) {
				vscode.window.showErrorMessage(
					"Failed to read rules from configuration " +
					" due to error: " + err);
				return md;
			}

			let extender = new LinkifyItExtender(md.linkify);
			for (let rule of rules || []) {
				try {
					extender.addRule(rule);
				} catch (err) {
					vscode.window.showErrorMessage(
						"Failed to add rule " + JSON.stringify(rule) +
						" due to error: " + err);
				}
			}
			return md;
		}
	};
}
