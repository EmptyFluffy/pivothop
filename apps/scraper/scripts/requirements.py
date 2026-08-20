#!/usr/bin/env python3
"""The gates: experience, education, language.

Benefits answer "is this worth taking". These answer the prior question a career
changer actually asks first, which is "can I get it at all". They are the three
statements that most often disqualify someone arriving from another profession,
and all three sit in the requirements block that the benefit miner ignores.

Zoning is the mirror of benefits.py: that one reads the perks block, this one
prefers the requirements block. Cleaning, sentence-clipped negation and the
heading rules are imported from it rather than reimplemented, so the awkward
parts have one home.

Each extractor returns None when the posting does not state the thing. Nothing
is inferred, defaulted, or averaged: a listing that says nothing about a degree
gets no education line, because the alternative is telling someone a degree is
required when the employer never said so.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import benefits as B  # clean(), split_zones(), _negated(), _is_heading()

# Requirement blocks. A posting leads with its headline gate, so the first match
# inside one of these blocks beats anything later in the body.
_REQ_HEAD = re.compile(
    r'^(requirements?|qualifications?|what (you|we).{0,12}(bring|need|looking|expect)|'
    r'who you are|about you|your profile|must[- ]haves?|essential|minimum|skills? (and|&) experience|'
    r'your experience|experience required|education|dein profil|ihr profil|das bringst du|'
    r'anforderungen|voraussetzungen|profil)', re.I)

# ---------------------------------------------------------------- experience

# "5+ years", "3-5 years", "minimum of seven years", "mindestens 3 Jahre".
_WORD_NUM = {'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7,
             'eight': 8, 'nine': 9, 'ten': 10, 'twelve': 12, 'zwei': 2, 'drei': 3,
             'vier': 4, 'fünf': 5, 'sechs': 6, 'sieben': 7, 'acht': 8, 'zehn': 10}
_EXP = re.compile(
    r'(?:(?P<lo>\d{1,2})\s*(?:\+|plus)?\s*(?:-|–|to|bis)?\s*(?P<hi>\d{1,2})?\s*|'
    r'(?P<word>' + '|'.join(_WORD_NUM) + r')\s+)'
    r'(?:\+\s*)?(?:years?|yrs?|jahre[n]?)\b'
    r'(?P<tail>[^.\n]{0,60})', re.I)
# The number has to be about the candidate's experience, not the company's age,
# the contract length, or how long the product has existed.
_EXP_OK = re.compile(r'(experience|erfahrung|working|worked|background|track record|'
                     r'praxis|berufserfahrung|in (?:a |the )?(?:similar|related|relevant))', re.I)
_EXP_VETO = re.compile(r'(founded|in business|history|anniversary|over the (?:last|past)|'
                       r'contract|visa|permit|guarantee|warranty|age of|older than|'
                       r'every \d|per year|annually|salary|revenue|users?|customers?)', re.I)


def experience(text):
    """-> minimum years of experience the posting asks for, or None.

    The first statement inside a requirements block wins, because postings lead
    with the headline gate and qualify it later ("5+ years overall, 2+ with
    SQL"). Ranges report their floor: 3-5 years means the door opens at 3."""
    return _experience(*_zones(text))


def _experience(zone, body):
    for hay in (zone, body):
        for m in _EXP.finditer(hay):
            tail = m.group('tail') or ''
            head = hay[max(0, m.start() - 70):m.start()]
            if not _EXP_OK.search(tail) and not _EXP_OK.search(head):
                continue
            if _EXP_VETO.search(head + ' ' + tail):
                continue
            if B._negated(hay, m.start(), m.end()):
                continue
            n = int(m.group('lo')) if m.group('lo') else _WORD_NUM.get((m.group('word') or '').lower(), 0)
            if 1 <= n <= 20:
                return n
    return None


# ----------------------------------------------------------------- education

# Ordered low to high: the gate is the LOWEST level the posting will accept.
_DEGREES = [
    ('apprenticeship', re.compile(r'\b(apprenticeship|ausbildung|lehre\b|vocational (?:training|qualification)|berufsausbildung)\b', re.I)),
    ('associate', re.compile(r"\b(associate'?s? degree|associate degree|hnd\b|foundation degree)\b", re.I)),
    ('bachelor', re.compile(r"\b(bachelor'?s?(?: degree)?|b\.?sc\b|b\.?a\.?\b|undergraduate degree|bachelorabschluss|licence\b)\b", re.I)),
    ('master', re.compile(r"\b(master'?s?(?: degree)?|m\.?sc\b|m\.?a\.?\b|mba\b|diplom\b|masterabschluss)\b", re.I)),
    ('doctorate', re.compile(r'\b(ph\.?d\.?|doctorate|doctoral)\b', re.I)),
]
_DEGREE_ANY = re.compile(r"\b(degree|abschluss|studium|diplom)\b", re.I)
# "or equivalent experience" is the door left open, and it is the single most
# useful thing this miner can tell a career changer.
_WAIVED = re.compile(
    r'(no degree|degree (?:is )?not (?:required|necessary|needed)|without a degree|'
    r'or equivalent (?:practical )?(?:experience|work experience|qualification)|'
    r'equivalent experience (?:is )?(?:accepted|considered)|in lieu of a degree|'
    r'degree or equivalent|we do not require a degree|kein (?:studium|abschluss) )', re.I)
_PREFERRED = re.compile(r'\b(preferred|a plus|nice to have|desirable|advantage|ideal(?:ly)?|von vorteil|wünschenswert)\b', re.I)


def education(text):
    """-> {'level': str, 'state': 'required'|'preferred'|'waived'} or None."""
    return _education(*_zones(text))


def _education(zone, body):
    for hay in (zone, body):
        if not _DEGREE_ANY.search(hay) and not any(rx.search(hay) for _, rx in _DEGREES):
            continue
        for level, rx in _DEGREES:
            m = rx.search(hay)
            if not m:
                continue
            window = hay[max(0, m.start() - 120):m.end() + 160]
            if _WAIVED.search(window):
                return {'level': level, 'state': 'waived'}
            if B._negated(hay, m.start(), m.end()):
                return {'level': level, 'state': 'waived'}
            return {'level': level, 'state': 'preferred' if _PREFERRED.search(window) else 'required'}
        # "No degree required" names no level, and it is the single most useful
        # thing this miner can tell a career changer, so it is not dropped.
        m = _DEGREE_ANY.search(hay)
        if m and _WAIVED.search(hay[max(0, m.start() - 120):m.end() + 160]):
            return {'level': 'any', 'state': 'waived'}
    return None


# ------------------------------------------------------------------ language

_LANGS = {
    'english': 'English', 'englisch': 'English', 'anglais': 'English',
    'german': 'German', 'deutsch': 'German', 'allemand': 'German',
    'french': 'French', 'französisch': 'French', 'français': 'French',
    'spanish': 'Spanish', 'spanisch': 'Spanish', 'español': 'Spanish',
    'italian': 'Italian', 'italienisch': 'Italian',
    'dutch': 'Dutch', 'portuguese': 'Portuguese', 'polish': 'Polish',
    'mandarin': 'Mandarin', 'japanese': 'Japanese', 'arabic': 'Arabic',
}
_LANG_RX = re.compile(r'\b(' + '|'.join(_LANGS) + r')\b', re.I)
# A language name alone is noise (every posting names the language it is written
# in). It counts only next to a proficiency or a requirement word.
_PROOF = re.compile(
    r'\b(fluen(?:t|cy)|native|proficien(?:t|cy)|business[- ]level|conversational|'
    r'required|mandatory|essential|must|verhandlungssicher|fließend|muttersprach|'
    r'kenntnisse|sprachkenntnisse|[abc][12]\b|level [abc][12])', re.I)
_CEFR = re.compile(r'\b([abc][12])\b', re.I)


def languages(text):
    """-> ['German (C1)', 'English'] or None. Conservative: a language counts
    only when a proficiency or requirement word sits beside it."""
    return _languages(*_zones(text))


def _languages(zone, body):
    out = {}
    for hay in (zone, body):
        for m in _LANG_RX.finditer(hay):
            name = _LANGS[m.group(1).lower()]
            if name in out:
                continue
            window = hay[max(0, m.start() - 60):m.end() + 70]
            if not _PROOF.search(window):
                continue
            if B._negated(hay, m.start(), m.end()):
                continue
            lvl = _CEFR.search(window)
            out[name] = f'{name} ({lvl.group(1).upper()})' if lvl else name
        if out:
            break
    return list(out.values())[:3] or None


# ------------------------------------------------------------------- helpers

def _split_req(cleaned):
    """-> (requirements_text, rest). Same heading rules as the benefit zoner,
    with the requirement heading set instead of the perks one."""
    req, rest = [], []
    zone = 'body'
    for raw in cleaned.split('\n'):
        s = raw.strip().rstrip(':').strip()
        if B._is_heading(raw):
            zone = 'req' if _REQ_HEAD.search(s) else 'body'
            continue
        (req if zone == 'req' else rest).append(raw)
    return '\n'.join(req), '\n'.join(rest)


def _zones(text):
    return _split_req(B.clean(text))


def extract(text):
    """-> {'exp': int, 'edu': {...}, 'lang': [...]} with absent keys omitted.

    Cleans and zones once, then runs all three gates over the same pass: the
    markup strip is the expensive part and this runs on every posting twice a
    day."""
    if not text:
        return {}
    zone, body = _zones(text)
    out = {}
    e = _experience(zone, body)
    if e:
        out['exp'] = e
    d = _education(zone, body)
    if d:
        out['edu'] = d
    ls = _languages(zone, body)
    if ls:
        out['lang'] = ls
    return out


if __name__ == '__main__':
    import json
    import collections
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    here = os.path.dirname(__file__)
    raw = os.path.join(here, '..', 'data', 'postings_raw.ndjson')
    if not os.path.exists(raw):
        raw = os.path.expanduser('~/PivotHop/apps/scraper/data/postings_raw.ndjson')
    n = 0
    exp = collections.Counter()
    edu = collections.Counter()
    lang = collections.Counter()
    samples = collections.defaultdict(list)
    with open(raw, encoding='utf-8') as fh:
        for line in fh:
            if n >= limit:
                break
            try:
                d = json.loads(line)
            except Exception:
                continue
            t = d.get('description_text') or ''
            if len(t) < 200:
                continue
            n += 1
            r = extract(t)
            if 'exp' in r:
                exp[r['exp']] += 1
            if 'edu' in r:
                edu[(r['edu']['level'], r['edu']['state'])] += 1
                if len(samples['edu']) < 6:
                    samples['edu'].append((r['edu'], (d.get('title') or '')[:50]))
            for l in r.get('lang') or []:
                lang[l] += 1
    print(f'{n} postings\n')
    print(f'experience stated: {sum(exp.values())} ({100 * sum(exp.values()) / n:.0f}%)')
    print('   ', dict(sorted(exp.items())))
    print(f'\neducation stated: {sum(edu.values())} ({100 * sum(edu.values()) / n:.0f}%)')
    for k, c in edu.most_common(10):
        print(f'    {c:5d}  {k[0]} / {k[1]}')
    print(f'\nlanguage stated: {sum(lang.values())}')
    for k, c in lang.most_common(8):
        print(f'    {c:5d}  {k}')
