#!/usr/bin/env python3
"""Build the skill glossary from the skill bank + occupation profiles.

For every skill that appears in at least one occupation's skill profile, emit:
  - a display term and the field cluster it sits in
  - a definition (curated for the common/iconic skills; otherwise a data-derived
    line that is honest about what we actually know)
  - the roles it "unlocks": the occupations that weight it most heavily AND have
    live listings on the board, each with its open-role count, for clickable
    links into /jobs/<slug>

Writes apps/web/public/data/skills-glossary.json (read at build time by the
glossary page). Regenerable; run after the scrape's export step.

  python3 apps/scraper/scripts/build-skill-glossary.py   # from repo root
"""
import json

NAMES = json.load(open('apps/web/public/data/skills-meta.json'))['names']
PROFS = json.load(open('apps/web/public/data/skill-profiles.json'))['profiles']
ORIGINS = {o['slug']: o for o in json.load(open('apps/web/public/data/origins.json'))['origins']}
IDX = json.load(open('apps/web/public/data/jobs-index.json'))
UNLOCK_CAP = 8

def title(slug):
    return ORIGINS.get(slug, {}).get('title', slug.replace('-', ' ').title())
def field(slug):
    return ORIGINS.get(slug, {}).get('field', '')

# Curated definitions, keyed by the skill's display name (exact, lowercased).
# Real one-to-two sentence definitions in the house voice for the skills a
# reader is most likely to click; everything else gets the data-derived line.
CURATED = {
    'python': 'A general-purpose programming language and the default tool for data work, scripting, and machine learning. The most transferable technical skill in our data: it turns up well outside software, in finance, science, and operations.',
    'sql': 'The query language for relational databases — how you pull, filter, and join data that lives in tables. The baseline data skill; analysts, engineers, and scientists all assume it.',
    'excel': 'The spreadsheet, still the most widely required analytical tool in the market. It spans finance, operations, marketing, and research — the shared language of business numbers.',
    'data analysis': 'Turning raw numbers into decisions: cleaning data, finding patterns, and reporting what they mean. One of the most cross-cutting skills we track, required far beyond dedicated analyst roles.',
    'data visualization': 'Turning data into charts and dashboards people can read at a glance. The bridge between analysis and communication.',
    'project management': 'Planning work, sequencing it, and getting it delivered across a team. A general-purpose skill that transfers into almost every field, and often the bridge that carries a specialist into leadership.',
    'product management': 'Deciding what to build and why — owning the problem, the priorities, and the outcome rather than the code. A common pivot target for analysts, designers, and engineers.',
    'communication': 'Explaining clearly, in writing and in person. The most universal requirement in the market, and the one most often undervalued on a resume.',
    'aws': "Amazon's cloud platform — where a large share of modern software is deployed and run. Core infrastructure skill for engineering, and increasingly for data and security work.",
    'azure': "Microsoft's cloud platform, dominant in enterprise. A core deployment and infrastructure skill alongside AWS.",
    'machine learning': 'Building systems that learn patterns from data rather than following hand-written rules. The engine behind modern AI products, concentrated in data and ML-engineering roles.',
    'llms / generative ai': 'Large language models and the products built on them — the current wave of AI. A fast-growing cluster; most of the roles that ask for it barely existed two years ago.',
    'langchain / agents': 'Frameworks for chaining language-model calls into multi-step agents. One of the newest skills in our data, concentrated in AI engineering.',
    'revit': "Autodesk's building-information-modeling tool, the standard for architectural and building-systems design. The skill that most defines a modern architecture role.",
    'autocad': 'The long-standing 2D/3D drafting standard across architecture, engineering, and construction.',
    'rhino': 'A surface-modeling tool of choice for complex geometry, iconic in computational and industrial design. Its visual-scripting layer, Grasshopper, drives parametric work.',
    'grasshopper': "The visual-scripting layer for Rhino, used to build parametric geometry by wiring components rather than modeling by hand. A signature computational-design skill.",
    'lean / six sigma': 'A pair of process-improvement methodologies for removing waste and variation. Standard in manufacturing and operations, and increasingly asked for in healthcare and services.',
    'agile': 'Running projects in short iterations with frequent feedback. The default operating model for software teams, and spreading into other fields.',
    'rest apis': 'The standard way software systems talk to each other over the web. Foundational for backend and integration work.',
    'observability': 'Instrumenting software so you can see what it is doing in production — metrics, logs, and traces. A core reliability skill for engineering and DevOps.',
    'salesforce': 'The dominant customer-relationship-management platform. A durable, transferable skill across sales, support, and operations.',
    'cybersecurity': 'Protecting systems and data from attack. A high-demand specialization with clear entry points from IT and engineering.',
    'accounting': 'Recording and reporting what a business has earned and spent. The foundation under bookkeeping, audit, and financial analysis.',
    'teaching': 'Explaining a subject so others can learn it. Transfers widely — into corporate training, instructional design, and customer education.',
    'training & facilitation': 'Designing and running the sessions where people learn a skill. The most broadly required soft skill in our data, and a common bridge out of teaching and support roles.',
    'supply chain': 'Planning the flow of goods from supplier to customer. Central to operations, logistics, and manufacturing roles.',
    'customer service': 'Helping customers directly and resolving their problems. A common on-ramp that transfers into success, operations, and sales roles.',
    'prototyping': 'Building a rough, testable version of a product before committing to the full build. Core to design and hardware roles.',
    'patient care': 'Direct clinical care of patients. The foundation across nursing, allied-health, and medical-assistant roles.',
    'clinical research': 'Running studies that test treatments under regulated protocols. A specialized skill at the intersection of health and data.',
    'spark': 'A distributed engine for processing large datasets. A heavy data-engineering skill.',
    'writing & editing': 'Producing and polishing clear prose. Transfers across content, marketing, documentation, and communications roles.',
    'sustainability': 'Designing and operating to reduce environmental impact — energy, materials, and carbon. Increasingly required across the built-environment and operations fields.',
    'procurement': 'Sourcing and buying what an organization needs, on terms that hold up. Central to supply-chain and operations roles.',
    'scheduling': 'Coordinating people, appointments, and resources against time. A backbone skill in healthcare, operations, and field services.',
    'stakeholder management': 'Keeping the people with a stake in a project aligned and informed. A leadership skill that separates senior roles from junior ones.',
    'machine learning ': 'Building systems that learn from data. Concentrated in data and ML-engineering roles.',
}

def describe(term, tops, n, fld):
    key = term.lower()
    if key in CURATED:
        return CURATED[key]
    lead = ', '.join(tops[:2]) if tops else 'several roles'
    if len(tops) >= 3:
        lead += f', and {tops[2]}'
    fam = f' It sits in the {fld} family of work.' if fld else ''
    return (f'A skill our data associates most with {lead}. '
            f'It appears in {n} occupation profile{"s" if n != 1 else ""} we track.{fam}')

def main():
    inv = {}
    for occ, p in PROFS.items():
        for sk, w in p.get('s', {}).items():
            inv.setdefault(sk, []).append((occ, w))

    entries, used_curated = [], set()
    for sk, occs in inv.items():
        occs.sort(key=lambda x: -x[1])
        top_titles = [title(o) for o, _ in occs[:3]]
        # field: most common field among the top five occupations
        fields = [field(o) for o, _ in occs[:5] if field(o)]
        fld = max(set(fields), key=fields.count) if fields else ''
        unlocks = [{'slug': o, 'title': title(o), 'count': IDX[o]}
                   for o, _ in occs if o in IDX][:UNLOCK_CAP]
        term = NAMES.get(sk, sk.replace('-', ' ').title())
        if term.lower() in CURATED:
            used_curated.add(term.lower())
        entries.append({
            'slug': sk,
            'term': term,
            'field': fld,
            'def': describe(term, top_titles, len(occs), fld),
            'unlocks': unlocks,
        })

    # Every lexicon skill gets an entry — job-detail chips link here, so no
    # skill may dangle. Un-profiled ones (below the top-20 share floor, or in
    # occupations the profile export skips) get the curated def when one exists,
    # else an honest below-the-floor line. No unlock list without data.
    for sk, term in NAMES.items():
        if sk in inv:
            continue
        key = term.lower()
        if key in CURATED:
            used_curated.add(key)
        d = CURATED.get(key) or (
            f'Tracked in the PivotHop skill bank and extracted from live postings when named. '
            f'It currently sits below the share floor where any occupation\'s top-20 profile weights it, so no unlock list yet.')
        entries.append({'slug': sk, 'term': term, 'field': '', 'def': d, 'unlocks': []})

    entries.sort(key=lambda e: e['term'].lower())
    out = 'apps/web/public/data/skills-glossary.json'
    json.dump(entries, open(out, 'w'), ensure_ascii=False)
    linked = sum(1 for e in entries if e['unlocks'])
    print(f'wrote {len(entries)} skills to {out} ({linked} link to >=1 board occupation)')
    missing = set(CURATED) - used_curated - {'machine learning '}
    if missing:
        print(f'curated defs not matched to a bank skill (check names): {sorted(missing)}')

if __name__ == '__main__':
    main()
