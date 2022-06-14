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

import { LinkifyIt, Match } from 'linkify-it';

export interface Rule {
    prefix: string
    tail?: string
    url?: string
    text?: string
}

const matchPlaceHolder = "%MATCH%";
const prefixPlaceHolder = "%PREFIX%";
const tailPlaceHolder = "%TAIL%";

export class LinkifyItExtender {
    linkify: LinkifyIt;
    static re: { [key: string]: RegExp } = {};
    constructor(linkify: LinkifyIt) {
        this.linkify = linkify;
        this.cacheRe();
    }

    private cacheRe() {
        let cls = LinkifyItExtender;
        if (!cls.re.src_rel_path) {
            // Adapted from https://github.com/markdown-it/linkify-it/blob/9482bfec2532cfccb8d7a55f1b89facf54760b48/lib/re.js#L49
            cls.re.src_rel_path = new RegExp(
                '^(?:' +
                ('(?:' +
                    // Allow non-special & non-space characters
                    '(?!' + this.linkify.re.src_ZCc + '|' + '[><\uff5c]' + '|' + '[()[\\]{}.,"\'?!\\-;]' + ').|' +
                    // Allow matching brackets/parentheses/braces/quotes with no spaces inside
                    '\\[(?:(?!' + this.linkify.re.src_ZCc + '|\\]).)*\\]|' +
                    '\\((?:(?!' + this.linkify.re.src_ZCc + '|[)]).)*\\)|' +
                    '\\{(?:(?!' + this.linkify.re.src_ZCc + '|[}]).)*\\}|' +
                    '\\"(?:(?!' + this.linkify.re.src_ZCc + '|["]).)+\\"|' +
                    "\\'(?:(?!" + this.linkify.re.src_ZCc + "|[']).)+\\'|" +
                    // Allow unmatched single quote / apostrophe
                    "\\'(?=" + this.linkify.re.src_pseudo_letter + '|[-])|' +
                    // Allow dots when followed by letters, numbers, percent-encoded characters, slash, or params separator
                    '\\.{2,}[a-zA-Z0-9%/&]|' +
                    // Allow dot that's not followed by space or another dot
                    '\\.(?!' + this.linkify.re.src_ZCc + '|[.]|$)|' +
                    // For simplicity, always allow dashes
                    '\\-+|' +
                    // Allow ',' and ';' if not followed by space
                    '[,;](?!' + this.linkify.re.src_ZCc + '|$)|' +
                    // Allow multiple '!' if not at the end
                    '\\!+(?!' + this.linkify.re.src_ZCc + '|[!]|$)|' +
                    // Allow a single '?' if not at the end
                    '\\?(?!' + this.linkify.re.src_ZCc + '|[?]|$)' +
                    ')+') +
                '|\\/' +
                ')');
        }
        if (!cls.re.custom_uri_scheme) {
            cls.re.custom_uri_scheme = /^[a-z][a-z0-9+\.\-]*:/i;
        }
        if (!cls.re.match_end) {
            cls.re.match_end = new RegExp("(?=$|" + this.linkify.re.src_ZPCc + ")");
        }
    }

    private createNormalizer(tailRule: RegExp, urlRule: string | undefined, textRule: string | undefined) {
        let customUriScheme = LinkifyItExtender.re.custom_uri_scheme;
        return (match: Match) => {
            let tail = match.raw.slice(match.schema.length);
            let fromTail = (rule: string) =>
                tail.replace(tailRule, rule)
                    .replace(matchPlaceHolder, match.raw)
                    .replace(prefixPlaceHolder, match.schema)
                    .replace(tailPlaceHolder, tail);

            if (!!urlRule) {
                match.url = fromTail(urlRule);
            } else {
                // If the schema doesn't look like a URI scheme, override to http:
                if (!customUriScheme.test(match.schema)) {
                    match.schema = "";
                    match.url = "http://" + match.url;
                }
            }

            if (!!textRule) {
                match.text = fromTail(textRule);
            }
        };
    };

    addRule(rule: Rule) {
        let re = LinkifyItExtender.re;
        let tailRule = rule.tail ?
            new RegExp("^" + rule.tail + re.match_end.source) :
            re.src_rel_path;
        this.linkify.add(rule.prefix, {
            validate: tailRule,
            normalize: this.createNormalizer(tailRule, rule.url, rule.text),
        });
    }
}
