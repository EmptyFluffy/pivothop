#!/usr/bin/env python3
"""Benefit extraction from posting text.

The mirror image of the skill miner. `normalize/skills.js` deliberately DROPS
benefits, perks, and about-us blocks before it reads a posting, because a
company describing its own generosity is not stating a job requirement. This
reads exactly the blocks that one throws away.

Three precision layers, because a benefits lexicon is far more collision-prone
than a skills one (every posting contains the words "equity", "vision" and
"bonus" in senses that are not benefits):

  1. Zoning. Two confidence tiers. `strong` aliases are phrases that only ever
     mean a benefit ("401k match", "unlimited pto", "tuition reimbursement") and
     count anywhere in the posting. `weak` aliases are ordinary nouns ("dental",
     "gym", "pension", "bonus") and count ONLY inside a detected benefits block.
     A posting with no benefits block therefore yields only strong matches,
     which is the honest answer rather than a generous one.

  2. Negation. 76% of postings mentioning visa sponsorship are declining it
     (the lesson already learned in build-jobs). The same holds for benefits:
     "no health insurance provided", "relocation is not available". Both sides
     of every match are checked, and the window is clipped at sentence
     boundaries so a "not" belonging to the previous sentence cannot veto a
     real benefit.

  3. Per-benefit vetoes. `unless_near` kills a match on collision context:
     "equity" near "diversity", "vision" near "computer vision", "commission"
     near "planning commission", insurance near "licence" (an insurance job
     sells the thing rather than offering it).

Legal, EEO and how-to-apply blocks are cut before any of this runs: an equal
opportunity statement names disability and family status without offering
either.
"""
import json
import os
import re
import sys

TAXONOMY = os.path.join(os.path.dirname(__file__), '..', '..', '..',
                        'packages', 'data', 'taxonomy', 'benefits.json')

# A benefits block: the same heading set the skill miner skips.
_BENEFIT_HEAD = re.compile(
    r'^(benefits?|perks?|what we offer|we offer|what.s in it for you|why (join|work|us)|'
    r'why you.?ll love|compensation( (and|&) benefits)?|pay (and|&) benefits|'
    r'(total )?rewards?|package|our (benefits|perks|offer)|additional benefits|'
    r'was wir (bieten|dir bieten)|deine vorteile|wir bieten|benefits (and|&) perks|'
    r'perks (and|&) benefits|life at|working (here|with us)|the (offer|package))', re.I)

# Blocks that name benefit vocabulary without offering anything.
_LEGAL_HEAD = re.compile(
    r'^(equal (employment )?opportunity|eeo|diversity, equity|dei\b|'
    r'how to apply|application process|interview process|privacy|data protection|'
    r'legal|disclaimer|accessibility|accommodations?)', re.I)

_NEG_BEFORE = re.compile(
    r"\b(no|not|without|non|never|cannot|can't|won't|don't|doesn't|didn't|unable|"
    r"ineligible|excluded?|excluding|lack|lacks|lacking|unpaid|unfortunately|"
    r"do not|does not|is not|are not|will not|neither|nor|instead of|rather than)\b", re.I)
_NEG_AFTER = re.compile(
    r"^[\s:,.\-]*(?:is|are|will be|can be|would be|may be|cannot be)?\s*"
    r"(?:not|no\b|un(?:available|paid)|isn'?t|aren'?t|excluded|omitted)", re.I)

# Sentence boundaries, so a negation window never reads the neighbouring clause.
_BOUND = re.compile(r'[.!?;\n·•]')

# Sources ship HTML in description_text. Tags have to go before zoning, or every
# heading hides inside a <p> and the whole posting reads as one unzoned block,
# which silently costs the weak tier entirely.
_BR = re.compile(r'(?i)<(?:br|/p|/div|/li|/h[1-6]|/tr)\s*/?>')
_LI = re.compile(r'(?i)<li[^>]*>')
_HEAD_TAG = re.compile(r'(?i)<h[1-6][^>]*>')
_TAG = re.compile(r'<[^>]+>')
_ENT = {'&amp;': '&', '&nbsp;': ' ', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&rsquo;': "'"}


def clean(text):
    """Markup to lines: block ends and list items become newlines, headings keep
    their own line, everything else collapses. Mirrors build-jobs' clean_desc."""
    t = str(text or '')
    if '<' in t:
        t = _BR.sub('\n', t)
        t = _LI.sub('\n· ', t)
        t = _HEAD_TAG.sub('\n', t)
        t = _TAG.sub(' ', t)
    for k, v in _ENT.items():
        t = t.replace(k, v)
    t = re.sub(r'[•●▪‣∙]\s*', '\n· ', t)
    t = re.sub(r'(?m)^\s*[-–]\s+', '· ', t)
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r' *\n *', '\n', t)
    return re.sub(r'\n{3,}', '\n\n', t).strip()


_cache = None


def load(path=TAXONOMY):
    """Compile the lexicon once: two alias regexes per benefit plus its veto."""
    global _cache
    if _cache is not None:
        return _cache
    with open(path, encoding='utf-8') as fh:
        data = json.load(fh)

    def compile_tier(aliases):
        if not aliases:
            return None
        parts = []
        for a in aliases:
            # An alias is either a written-out regex (it carries \b or a group)
            # or a literal phrase, which gets hard word boundaries so "pto" does
            # not fire inside "adoption" and "sip" not inside "gossip".
            if any(t in a for t in ('\\b', '(', '[', '?', '+', '|')):
                parts.append(a)
            else:
                parts.append(r'(?<![a-z0-9])' + re.escape(a) + r'(?![a-z0-9])')
        return re.compile('|'.join(parts), re.I)

    out = []
    for b in data['benefits']:
        out.append({
            'id': b['id'], 'name': b['name'], 'cat': b['cat'],
            'glyph': b.get('glyph'), 'def': b.get('def', ''),
            'strong': compile_tier(b.get('strong')),
            'weak': compile_tier(b.get('weak')),
            'unless': re.compile(b['unless_near'], re.I) if b.get('unless_near') else None,
        })
    _cache = out
    return out


def _is_heading(line):
    s = line.strip()
    if not s or len(s) > 64 or s.startswith('·'):
        return False
    return s.endswith(':') or not re.search(r'[.!?]$', s)


def split_zones(text):
    """-> (benefit_text, body_text). Legal and how-to-apply blocks are dropped
    from both: they name benefit words without offering anything."""
    benefit, body = [], []
    zone = 'body'
    for raw in str(text or '').split('\n'):
        s = raw.strip().rstrip(':').strip()
        if _is_heading(raw):
            if _LEGAL_HEAD.search(s):
                zone = 'legal'
            elif _BENEFIT_HEAD.search(s):
                zone = 'benefit'
            else:
                zone = 'body'
            # The heading itself is not evidence; "Benefits" alone offers nothing.
            continue
        if zone == 'benefit':
            benefit.append(raw)
        elif zone == 'body':
            body.append(raw)
    return '\n'.join(benefit), '\n'.join(body)


def _negated(hay, start, end):
    """True when the match is declined on either side, within its own sentence."""
    before = hay[max(0, start - 70):start]
    cut = list(_BOUND.finditer(before))
    if cut:
        before = before[cut[-1].end():]
    if _NEG_BEFORE.search(before):
        return True
    after = hay[end:end + 45]
    cut = _BOUND.search(after)
    if cut:
        after = after[:cut.start()]
    return bool(_NEG_AFTER.match(after))


def _hit(rx, hay, veto):
    """First non-negated, non-vetoed match of rx in hay; returns its span or None."""
    if not rx:
        return None
    for m in rx.finditer(hay):
        if _negated(hay, m.start(), m.end()):
            continue
        if veto:
            window = hay[max(0, m.start() - 100):m.end() + 110]
            if veto.search(window):
                continue
        return m.span()
    return None


def extract(text, with_evidence=False):
    """-> sorted benefit ids found in the posting.

    with_evidence returns {id: sentence} instead, for auditing."""
    if not text:
        return {} if with_evidence else []
    zone_text, body_text = split_zones(clean(text))
    zl, bl = zone_text.lower(), body_text.lower()
    found = {}
    for b in load():
        # strong: anywhere in the posting (benefits block or body)
        span, hay = None, None
        for candidate in (zl, bl):
            span = _hit(b['strong'], candidate, b['unless'])
            if span:
                hay = candidate
                break
        # weak: benefits block only
        if not span:
            span = _hit(b['weak'], zl, b['unless'])
            hay = zl
        if not span:
            continue
        if with_evidence:
            s, e = span
            lo = hay.rfind('\n', 0, s) + 1
            hi = hay.find('\n', e)
            found[b['id']] = ' '.join(hay[lo:hi if hi > 0 else e + 90].split())[:160]
        else:
            found[b['id']] = True
    return found if with_evidence else sorted(found)


def names():
    return {b['id']: b['name'] for b in load()}


if __name__ == '__main__':
    # Audit mode: mine a sample of the raw corpus and report per-benefit counts
    # with one matched line each, so false positives are visible before the
    # lexicon ships. Usage: python3 benefits.py [limit]
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 4000
    here = os.path.dirname(__file__)
    raw = os.path.join(here, '..', 'data', 'postings_raw.ndjson')
    if not os.path.exists(raw):  # the worktree keeps no data; read the main checkout
        raw = os.path.expanduser('~/PivotHop/apps/scraper/data/postings_raw.ndjson')
    counts, samples, n, hits = {}, {}, 0, 0
    with open(raw, encoding='utf-8') as fh:
        for line in fh:
            if n >= limit:
                break
            try:
                d = json.loads(line)
            except Exception:
                continue
            desc = d.get('description_text') or ''
            if len(desc) < 200:
                continue
            n += 1
            ev = extract(desc, with_evidence=True)
            if ev:
                hits += 1
            for bid, sentence in ev.items():
                counts[bid] = counts.get(bid, 0) + 1
                samples.setdefault(bid, []).append(sentence)
    nm = names()
    print(f'{n} postings read, {hits} with at least one benefit '
          f'({100 * hits / max(1, n):.0f}%), {len(counts)} of {len(nm)} benefits seen\n')
    for bid, c in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f'{c:6d}  {bid:22s} {nm.get(bid, "?")}')
        for s in samples[bid][:2]:
            print(f'          | {s}')
