#!/usr/bin/env python3
"""Regression cases for the benefit miner (scripts/benefits.py).

Every case here is a defect the real corpus produced during the first pass, or
a rule the lexicon depends on. Run:

    python3 apps/scraper/test/test_benefits.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'scripts'))
import benefits as B  # noqa: E402

CASES = [
    ("weak terms count inside a benefits block",
     "Responsibilities\nBuild things.\n\nBenefits\n· Dental and vision\n· Gym membership\n· Free snacks",
     {'dental', 'vision', 'wellness-stipend', 'free-drinks'}, {'meals'}),
    ("the same words outside a block are the job, not a perk",
     "About the role\nYou will design dental implants and gym equipment for clients.",
     set(), {'dental', 'wellness-stipend'}),
    ("a declined benefit is not a benefit",
     "Benefits\n· We do not offer relocation assistance\n· Visa sponsorship is not available\n· 401k match of 5%",
     {'retirement-match'}, {'relocation', 'visa-sponsorship'}),
    ("a negation in the previous sentence must not veto",
     "Benefits\nThis is not a junior role. Health insurance is fully covered.",
     {'health-insurance'}, set()),
    ("administering a benefit is not receiving it",
     "Responsibilities\nOwn payroll accounting for equity compensation programs including RSUs and ESPP reconciliation.",
     set(), {'equity', 'share-purchase'}),
    ("mentorship offered to you",
     "Perks\n· Intra-departmental mentor and buddy program\n· Learning budget of $1,500",
     {'mentorship', 'learning-budget'}, set()),
    ("mentoring others is the job",
     "What you'll do\nYou will mentor juniors and provide coaching to team members daily.",
     set(), {'mentorship'}),
    ("markup still zones, and an unlimited policy claims one pill",
     "<h3>Benefits</h3><ul><li>Unlimited PTO</li><li>Paid parental leave, 16 weeks</li></ul>",
     {'unlimited-pto', 'parental-leave'}, {'generous-pto'}),
    ("EEO boilerplate offers nothing",
     "Equal Employment Opportunity\nWe consider applicants regardless of disability, family status or pregnancy.",
     set(), {'disability-cover', 'carer-leave', 'parental-leave'}),
    ("unambiguous phrases count anywhere",
     "The role pays $120k plus a 401(k) match and tuition reimbursement after one year.",
     {'retirement-match', 'tuition'}, set()),
]


def main():
    failed = 0
    for name, text, must, must_not in CASES:
        got = set(B.extract(text))
        missing, wrong = must - got, got & must_not
        if missing or wrong:
            failed += 1
            print(f'FAIL  {name}\n      missing={sorted(missing)} wrong={sorted(wrong)} got={sorted(got)}')
        else:
            print(f'ok    {name}')
    print(f'\n{len(CASES) - failed}/{len(CASES)} passed')
    return 1 if failed else 0


if __name__ == '__main__':
    raise SystemExit(main())
