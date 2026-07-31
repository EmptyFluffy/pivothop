#!/usr/bin/env python3
"""Build the skill glossary from the skill bank + occupation profiles.

For every skill in the lexicon, emit:
  - a display term and the field cluster it sits in
  - a real definition (curated for every skill not covered by a profile-derived
    line; no skill ships with a placeholder)
  - the roles it "unlocks": occupations that weight it most heavily AND have
    live listings on the board, each with its open-role count, for clickable
    links into /jobs/<slug>

Unlock evidence comes from two layers, strongest first:
  1. occupation top-20 skill profiles (the same data the graph ranks with)
  2. the full normalized posting corpus (data/postings.ndjson) — skills below
     any top-20 share floor still unlock the occupations whose postings
     actually name them (>= EVIDENCE_FLOOR mentions)
A small hand-map covers tools with no corpus mentions yet; it is evidence of
last resort and is replaced by corpus data as soon as postings name the tool.

Writes apps/web/public/data/skills-glossary.json (read at build time by the
glossary page). Regenerable; run after the scrape's export step.

  python3 apps/scraper/scripts/build-skill-glossary.py   # from repo root
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from skill_definitions import DEFS  # slug-keyed definitions

NAMES = json.load(open('apps/web/public/data/skills-meta.json'))['names']
# Marks from build-skill-icons.mjs (run it first). The client instrument reads
# them out of this file so its skill sheet needs no second fetch.
try:
    MARKS = json.load(open('apps/web/public/data/skill-marks.json'))
except FileNotFoundError:
    MARKS = {}
PROFS = json.load(open('apps/web/public/data/skill-profiles.json'))['profiles']
ORIGINS = {o['slug']: o for o in json.load(open('apps/web/public/data/origins.json'))['origins']}
IDX = json.load(open('apps/web/public/data/jobs-index.json'))
POSTINGS = 'apps/scraper/data/postings.ndjson'
UNLOCK_CAP = 8
EVIDENCE_FLOOR = 3   # corpus mentions required before an occupation unlocks

def title(slug):
    return ORIGINS.get(slug, {}).get('title', slug.replace('-', ' ').title())
def field(slug):
    return ORIGINS.get(slug, {}).get('field', '')

# Corpus evidence of last resort: tools no posting has named yet, mapped to the
# occupations that use them. Superseded by posting counts the moment they exist.
HAND_MAP = {
    'chief-architect': ['architect', 'architectural-drafter', 'interior-designer'],
    # Opera PMS used to unlock `auditor`, and only because Night Auditor — a hotel
    # front-desk role — was mis-mapped to the financial occupation. Refusing that
    # title (docs/31) correctly took the evidence away; this is where it belongs.
    'opera-pms': ['hotel-manager'],
    'marvelous-designer': ['game-designer', 'industrial-designer', 'motion-designer'],
    'nuke': ['video-editor', 'motion-designer'],
    'sketch-app': ['ux-designer', 'product-designer', 'graphic-designer'],
    'solibri': ['bim-manager', 'architect'],
    'touchdesigner': ['creative-technologist', 'design-technologist', 'motion-designer'],
    'twinmotion': ['architect', 'interior-designer', 'architectural-drafter'],
    # Tools whose corpus mentions sit below the noise floor (single stray hits,
    # or name collisions like Dynamo/DynamoDB) — mapped by what the tool is for.
    '3ds-max': ['visualization-artist', 'architect', 'interior-designer', 'game-designer'],
    'ableton': ['sound-designer', 'video-editor', 'motion-designer', 'creative-technologist'],
    'dynamo': ['bim-manager', 'design-technologist', 'architect', 'computational-designer'],
    'factset': ['financial-analyst', 'investment-analyst', 'accountant'],
    'grasshopper': ['computational-designer', 'architect', 'industrial-designer', 'design-technologist'],
    'houdini': ['technical-artist', 'motion-designer', 'game-developer', 'video-editor'],
    'lumion': ['architect', 'interior-designer', 'landscape-architect', 'architectural-drafter'],
    'maya': ['motion-designer', 'game-developer', 'technical-artist', 'video-editor'],
    'pro-tools': ['sound-designer', 'video-editor', 'motion-designer'],
    'procore': ['construction-manager', 'project-manager', 'construction-estimator'],
    'spec-writing': ['architect', 'construction-estimator', 'interior-designer', 'structural-engineer'],
    'substance': ['technical-artist', 'game-developer', 'game-designer'],
    'tekla': ['structural-engineer', 'architectural-drafter', 'bim-manager'],
    'vray': ['visualization-artist', 'architect', 'interior-designer', 'industrial-designer'],
    'zbrush': ['game-designer', 'game-developer', 'industrial-designer', 'motion-designer'],
    # Domain vocabulary added 2026-07-28. Their strongest occupations
    # (technical-artist, computational-designer) are off-board, so these point
    # at the nearest on-board work the skill actually reaches.
    'character-rigging': ['game-developer', 'motion-designer', 'game-designer'],
    'texturing': ['game-developer', 'game-designer', 'motion-designer'],
    'lookdev': ['motion-designer', 'game-developer', 'video-editor'],
    'generative-design': ['architect', 'industrial-designer', 'design-technologist'],
    'differentiated-instruction': ['teacher', 'teaching-assistant', 'instructional-designer'],
    'real-estate-listing': ['real-estate-agent', 'real-estate-developer'],
}

# Curated definitions, keyed by the skill's display name (exact, lowercased).
# House voice: deadpan, one to two sentences, the transfer angle stated plainly.
CURATED = {
    'python': 'A general-purpose programming language and the default tool for data work, scripting, and machine learning. The most transferable technical skill in our data: it turns up well outside software, in finance, science, and operations.',
    'sql': 'The query language for relational databases — how you pull, filter, and join data that lives in tables. The baseline data skill; analysts, engineers, and scientists all assume it.',
    'excel': 'The spreadsheet, still the most widely required analytical tool in the market. It spans finance, operations, marketing, and research — the shared language of business numbers.',
    'data analysis': 'Turning raw numbers into decisions: cleaning data, finding patterns, and reporting what they mean. One of the most cross-cutting skills we track, required far beyond dedicated analyst roles.',
    'data visualization': 'Turning data into charts and dashboards people can read at a glance. The bridge between analysis and communication.',
    'project management': 'Planning work, sequencing it, and getting it delivered across a team. A general-purpose skill that transfers into almost every field, and often the bridge that carries a specialist into leadership.',
    'product management': 'Deciding what to build and why — owning the problem, the priorities, and the outcome rather than the code. A common pivot target for analysts, designers, and engineers.',
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

    # ── The tool and specialty bank: every lexicon skill reads as a definition,
    #    never a placeholder. ──
    '3ds max': "Autodesk's 3D modeling, animation, and rendering package, a mainstay of architectural visualization and game-asset pipelines. Often the render-side counterpart to CAD skills an architect already holds.",
    'ableton / logic': 'The two digital audio workstations most named in music-production work: Ableton Live for electronic and live performance, Logic Pro on the Mac studio side. The production half of audio and sound-design roles.',
    'adobe xd': "Adobe's interface-design and prototyping tool. Adobe has wound it down in favor of Figma, so it now reads as legacy UI-design experience — the underlying craft transfers to Figma directly.",
    'archicad': "Graphisoft's building-information-modeling tool, Revit's main rival and strong in European practices. Fluency in one BIM platform substantially discounts the learning curve of the other.",
    'autodesk inventor': "Autodesk's parametric mechanical CAD for parts, assemblies, and machine design. The product-engineering counterpart to AutoCAD drafting, and a bridge from drafting roles toward mechanical design.",
    'blender': 'The open-source 3D suite spanning modeling, sculpting, animation, and rendering. Free tooling made it the on-ramp into 3D work, and studio adoption has made it a hireable skill in its own right.',
    'bluebeam': 'Bluebeam Revu, the PDF markup and measurement standard for construction documents — drawing review, punch lists, and quantity takeoffs. Ubiquitous in architecture, engineering, and construction offices.',
    'bridge design': 'The structural design of bridges: load rating, girder and deck design, and the AASHTO code family. A civil-structural specialty concentrated in transportation and infrastructure work.',
    'chief architect': 'Residential design software used by home builders and remodelers for plans, framing, and 3D walkthroughs. Sits closer to the residential and interiors market than the commercial BIM stack.',
    'cinema 4d': "Maxon's 3D package, the standard beside After Effects in motion graphics. The 3D skill most likely to appear in motion-design and broadcast postings.",
    'clio / relativity': 'The two legal-software names that anchor law-office tooling: Clio for practice management and billing, Relativity for e-discovery review. Software fluency is the fastest-growing screen in paralegal postings.',
    'concrete design': 'Designing reinforced-concrete structures — sizing members, detailing rebar, and working the ACI 318 code. A core structural-engineering specialty.',
    'detailing': 'Producing the close-up construction details that make a design buildable: connections, flashings, junctions. The drawing skill that separates documentation from concept work in architecture and structures.',
    'dynamo': "The visual-scripting layer for Revit — automating modeling and data tasks by wiring nodes instead of writing code. Revit's counterpart to Grasshopper, and a computational-design signal in BIM roles.",
    'enscape': 'A real-time rendering plugin that turns Revit, SketchUp, Rhino, and ArchiCAD models into walkable visualizations with no export step. Standard in design-presentation workflows.',
    'epic ehr': 'The dominant US electronic health record system. Epic fluency is a named requirement across nursing, medical-assistant, and health-informatics postings, and certified Epic analysts are a career path of their own.',
    'etabs / sap2000': "CSI's structural analysis and design packages: ETABS for building systems, SAP2000 for general structures. The analysis toolset behind many structural-engineering seats.",
    'factset / capiq': 'The financial data terminals of equity research and investment banking — FactSet and S&P Capital IQ. Fluency signals hands-on modeling and comps work in analyst postings.',
    'food service': 'Preparing and serving food at volume: kitchen stations, food safety, and front-of-house coordination. The operational core of cook, chef, and hospitality roles.',
    'gd&t': 'Geometric Dimensioning and Tolerancing, the symbolic language that specifies allowable variation on manufactured parts. Standard on mechanical drawings, and the boundary marker between building CAD and product engineering.',
    'go': "Google's compiled language for services and infrastructure — Docker and Kubernetes are written in it. Concentrated in backend, platform, and DevOps postings.",
    'grant writing': 'Researching funders and writing the proposals that bring in nonprofit and research money. A writing specialty with a measurable outcome attached, and a common bridge from teaching, journalism, and program roles.',
    'houdini': "SideFX's procedural 3D package, the film-VFX standard for simulation — fire, water, destruction — and increasingly for game-asset pipelines. Node-based work that rewards a technical mind.",
    'substance': "Adobe's Substance 3D suite — Painter and Designer — the texturing standard for game and film assets. The material half of the 3D art pipeline.",
    'hugging face':'The open-source hub for machine-learning models and the transformers library around it. Shorthand in postings for hands-on experience with modern model fine-tuning and deployment.',
    'illustrator': "Adobe's vector-graphics tool — logos, icons, illustration, and print. A foundation skill across graphic design and brand work.",
    'iso 19650': 'The international standard for managing information across a built asset\'s lifecycle using BIM — naming, exchange, and responsibility conventions. The process credential of BIM-manager roles, especially in UK and EU work.',
    'iv therapy': 'Placing and managing intravenous lines and infusions. A core clinical nursing skill, and a named requirement in acute-care and infusion-clinic postings.',
    'journalism': 'Reporting: finding the story, interviewing, verifying, and writing to deadline. The craft transfers into content strategy, UX writing, communications, and research roles.',
    'keyshot': 'A rendering tool that turns CAD models into product visuals with minimal setup. An industrial-design staple for concept presentation and marketing imagery.',
    'lumion': 'A real-time architectural rendering tool built for speed over configuration — models in, walkthroughs out. Common in architecture and landscape visualization workflows.',
    'marvelous designer': 'The 3D garment-simulation tool used to model realistic clothing for games, film, and digital fashion. A niche modeling specialty that reads as character-art depth.',
    'mastercam / cam': 'Computer-aided-manufacturing programming — turning CAD geometry into CNC toolpaths, with Mastercam the most installed package. The bridge between design intent and the machine shop.',
    'materials': 'Working knowledge of what things are made of and why it matters: properties, selection, and specification. Load-bearing in industrial design, mechanical engineering, and architecture alike.',
    'matlab': 'The numeric-computing environment of engineering and research — simulation, signal processing, and control systems. Academic roots, but still named in aerospace, automotive, and research postings.',
    'maya': "Autodesk's animation and VFX package, the studio standard for film and game character work — modeling, rigging, and animation.",
    'medical coding': 'Translating clinical care into the ICD-10 and CPT codes that billing and records run on. A certifiable, largely remote-friendly skill that bridges clinical experience toward health-information roles.',
    'microstation': "Bentley's CAD platform, the standard in civil infrastructure and transportation-agency work where AutoCAD is not. Common in drafting and civil-engineering postings tied to DOT projects.",
    'nuke': "Foundry's node-based compositing tool, the film-VFX standard for assembling shots from rendered and live-action layers.",
    'opera pms': "Oracle's hotel property-management system — reservations, front desk, and billing. The software backbone named in hotel-operations postings.",
    'pandas/numpy': "Python's data-analysis stack: NumPy for fast arrays, pandas for tables. The working vocabulary of data analysis in Python, assumed wherever Python data work is done.",
    'parametric design': 'Driving geometry by rules and parameters rather than drawing it directly — the Grasshopper and Dynamo way of working. The signature skill of computational design.',
    'phlebotomy': 'Drawing blood safely and correctly. A certifiable clinical skill and a common entry point into allied-health careers.',
    'php': 'The server-side language that still runs a large share of the web, WordPress and Laravel included. Unfashionable and durable — a steady signal in web-development postings.',
    'plangrid / acc': "Construction field software — drawings, RFIs, and punch lists on site — with PlanGrid now folded into Autodesk Construction Cloud. The digital layer of construction management.",
    'pos systems': 'Point-of-sale platforms — Toast, Square, and kin — that run orders, payments, and inventory in restaurants and retail. Operational fluency with them is a named requirement in service management.',
    'pro tools': "Avid's digital audio workstation, the standard of recording studios and audio post-production. The credential skill of sound-engineering work.",
    'procore': 'The construction project-management platform — budgets, RFIs, submittals, and field coordination. The most-named construction software in our corpus.',
    'quickbooks': "Intuit's small-business accounting software. The tool that defines bookkeeping practice in the US small-business market.",
    'r': 'The statistical programming language of academia, biostatistics, and research analytics. Where the analysis is the product — clinical trials, epidemiology, social science — R is still the default.',
    'ruby': 'A dynamic language best known for Rails, the framework behind a generation of web startups. Less fashionable now, still well paid where large Rails codebases live.',
    'rust': 'A systems language that delivers memory safety without garbage collection. Growing in infrastructure, blockchain, and security work; a strong engineering signal in postings.',
    'sage': 'The accounting and ERP software family strong in UK and mid-market finance offices. The Sage-vs-QuickBooks split roughly tracks company size and geography.',
    'seismic design': 'Designing structures to survive earthquakes — lateral systems, ductility, and the seismic provisions of the building code. A structural specialty concentrated where the ground moves.',
    'siemens nx': "Siemens' high-end CAD/CAM/CAE platform, standard in aerospace and automotive product development. The top tier of mechanical design tooling.",
    'sketch': 'The Mac interface-design tool that defined modern UI workflows before Figma. Now reads as legacy toolchain experience; the design craft underneath transfers directly.',
    'solibri': 'Model-checking software for BIM — rule-based quality and clash checks on building models before they hit site. A BIM-coordination specialty.',
    'spec writing': 'Writing construction specifications — the CSI MasterFormat documents that dictate materials and workmanship alongside the drawings. The text half of architectural documentation.',
    'tekla': 'Structural BIM software for steel and concrete detailing, from Trimble. Where structural design becomes fabrication-ready models.',
    'timber design': 'Structural design in wood, from light framing to mass timber. A growing specialty as tall-timber construction expands.',
    'touchdesigner': 'A node-based visual programming environment for real-time installations, projection, and live visuals. The tool of choice in interactive-media and creative-technology work.',
    'twinmotion': "Epic Games' real-time architectural visualization tool, built on Unreal Engine. A fast path from BIM model to walkable presentation.",
    'v-ray': "Chaos' ray-traced renderer, the photorealism standard across architectural visualization and product rendering.",
    'vba': 'The macro language inside Excel and the rest of Office. Unglamorous and everywhere — it automates the spreadsheets that businesses actually run on, and often marks the analyst who can.',
    'vectorworks': 'A CAD and BIM platform with deep roots in architecture, landscape, and entertainment design — the standard in theatrical lighting and event production.',
    'westlaw / lexis': 'The two legal research databases — Westlaw and LexisNexis — that case law practice runs on. Baseline tooling in paralegal and attorney postings.',
    'wound care': 'Assessing and treating wounds: dressings, debridement, and healing protocols. A certifiable nursing specialty with dedicated clinic and home-health demand.',
    'zbrush': 'The digital-sculpting standard for organic, high-detail 3D models — characters, creatures, and collectibles. The sculpting half of character art in games and film.',
}

def corpus_counts():
    """skill -> occupation -> mention count, from the full normalized corpus."""
    counts = {}
    if not os.path.exists(POSTINGS):
        return counts
    for line in open(POSTINGS):
        r = json.loads(line)
        rid = r.get('role_id')
        if not rid:
            continue
        sks = r.get('skills') or []
        if isinstance(sks, str):
            sks = json.loads(sks)
        for sk in sks:
            counts.setdefault(sk, {})
            counts[sk][rid] = counts[sk].get(rid, 0) + 1
    return counts

def describe(term, tops, n, fld, slug=None):
    if slug and DEFS.get(slug):
        return DEFS[slug]
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
    corpus = corpus_counts()

    def unlock_list(occs):
        return [{'slug': o, 'title': title(o), 'count': IDX[o]}
                for o in occs if o in IDX][:UNLOCK_CAP]

    def evidence_occs(sk):
        """Occupations ranked by corpus mentions (floor applied); if none of
        those are on the board, the hand-map so no skill dangles."""
        ranked = sorted(corpus.get(sk, {}).items(), key=lambda x: -x[1])
        occs = [o for o, n in ranked if n >= EVIDENCE_FLOOR]
        if not unlock_list(occs):
            occs = HAND_MAP.get(sk, occs)
        return occs

    entries, used_curated = [], set()
    for sk, occs in inv.items():
        occs.sort(key=lambda x: -x[1])
        ordered = [o for o, _ in occs]
        top_titles = [title(o) for o in ordered[:3]]
        fields = [field(o) for o in ordered[:5] if field(o)]
        fld = max(set(fields), key=fields.count) if fields else ''
        unlocks = unlock_list(ordered)
        if not unlocks:
            unlocks = unlock_list(evidence_occs(sk))
        term = NAMES.get(sk, sk.replace('-', ' ').title())
        if term.lower() in CURATED:
            used_curated.add(term.lower())
        entries.append({
            'slug': sk,
            'term': term,
            'field': fld,
            'def': describe(term, top_titles, len(occs), fld, sk),
            'unlocks': unlocks,
        })

    # Every lexicon skill gets an entry — job-detail chips link here, so no
    # skill may dangle. Skills below any top-20 profile floor still get a real
    # definition and unlock the occupations whose postings actually name them.
    for sk, term in NAMES.items():
        if sk in inv:
            continue
        key = term.lower()
        occs = evidence_occs(sk)
        fields = [field(o) for o in occs[:5] if field(o)]
        fld = max(set(fields), key=fields.count) if fields else ''
        if key in CURATED:
            used_curated.add(key)
        d = describe(term, [title(o) for o in occs[:3]], len(occs), fld, sk)
        entries.append({'slug': sk, 'term': term, 'field': fld, 'def': d,
                        'unlocks': unlock_list(occs)})

    for e in entries:
        if MARKS.get(e['slug']):
            e['mark'] = MARKS[e['slug']]
    entries.sort(key=lambda e: e['term'].lower())
    out = 'apps/web/public/data/skills-glossary.json'
    json.dump(entries, open(out, 'w'), ensure_ascii=False)
    linked = sum(1 for e in entries if e['unlocks'])
    bare = [e['term'] for e in entries if not e['unlocks']]
    print(f'wrote {len(entries)} skills to {out} ({linked} link to >=1 board occupation)')
    if bare:
        print(f'{len(bare)} skills with no unlock list: {bare}')
    missing = set(CURATED) - used_curated - {'machine learning '}
    if missing:
        print(f'curated defs not matched to a bank skill (check names): {sorted(missing)}')

if __name__ == '__main__':
    main()
