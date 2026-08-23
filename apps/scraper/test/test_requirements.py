#!/usr/bin/env python3
"""Regression cases for the gate miners (scripts/requirements.py).

Run: python3 apps/scraper/test/test_requirements.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'scripts'))
import requirements as R  # noqa: E402

CASES = [
    ("a plain experience gate",
     "Requirements\n· 5+ years of experience in product management",
     {'exp': 5}),
    ("a range reports its floor",
     "Requirements\n· 3-5 years of relevant experience with SQL",
     {'exp': 3}),
    ("the headline gate wins over the qualifier that follows",
     "Requirements\n· 8 years of experience leading teams\n· 2 years of experience with Figma",
     {'exp': 8}),
    ("company age is not candidate experience",
     "About us\nFounded 12 years ago, we have grown every year since.",
     {}),
    ("a written number counts",
     "Requirements\nMinimum of seven years experience in a similar role.",
     {'exp': 7}),
    ("a required degree",
     "Qualifications\nBachelor's degree in Computer Science required.",
     {'edu': {'level': 'bachelor', 'state': 'required'}}),
    ("the door left open is the useful case",
     "Qualifications\nBachelor's degree or equivalent practical experience.",
     {'edu': {'level': 'bachelor', 'state': 'waived'}}),
    ("preferred is not required",
     "Qualifications\nMaster's degree preferred.",
     {'edu': {'level': 'master', 'state': 'preferred'}}),
    ("an explicit no-degree posting names no level and must still count",
     "Requirements\nNo degree required. We care about what you can do.",
     {'edu': {'level': 'any', 'state': 'waived'}}),
    ("a language with its level",
     "Requirements\nVerhandlungssicheres Deutsch (C1) und gutes Englisch.",
     {'lang': ['German (C1)']}),
    ("a language named without a requirement is not a gate",
     "About us\nWe are a German company with offices across Europe.",
     {}),
    ("a posting that states none of it gets none of it",
     "We are hiring a designer. You will work on our product with a small team.",
     {}),
]


def main():
    failed = 0
    for name, text, want in CASES:
        got = R.extract(text)
        ok = all(got.get(k) == v for k, v in want.items()) and (want or not got)
        if want.get('lang'):
            ok = got.get('lang', [])[:1] == want['lang'][:1] and all(
                got.get(k) == v for k, v in want.items() if k != 'lang')
        if not ok:
            failed += 1
            print(f'FAIL  {name}\n      want={want} got={got}')
        else:
            print(f'ok    {name}')
    print(f'\n{len(CASES) - failed}/{len(CASES)} passed')
    return 1 if failed else 0


if __name__ == '__main__':
    raise SystemExit(main())
