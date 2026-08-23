#!/usr/bin/env python3
"""Backfill the job board from the scrape.

Joins the normalized postings (occupation tag, role_id, USD salary) with the
raw postings (company, location, description), keeps only re-displayable
sources (company-direct ATS boards, remote-job APIs, public-domain USAJOBS),
dedups, sorts freshest-first, and caps per occupation.

Aggregator sources whose terms restrict re-display (Adzuna, Reed) are excluded
here; they feed the salary aggregates only, never the board. Every listing
links back to the original posting to apply.

  python3 apps/scraper/scripts/build-jobs.py    # from repo root

Writes:
  apps/web/public/data/jobs/{role_id}.json         light rows for one occupation
  apps/web/public/data/all-jobs.json               light rows, every occupation (global search)
  apps/web/public/data/jobs-detail/{role_id}.json  id -> {desc} (detail pages, build-time read)
  apps/web/public/data/jobs-index.json             role_id -> count
"""
import json, os, collections, hashlib, html, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import benefits as benefits_miner  # zone-aware perk extraction; see benefits.py
import requirements as req_miner   # experience / education / language gates

# Mojibake repair (mirror of lib/text.js fixMojibake): UTF-8 bytes decoded as
# Latin-1 give "EspaÃ±a" for "España". The tell is two adjacent high-Latin-1
# chars, which real accented text never produces, so clean strings pass through.
_MOJIBAKE = re.compile('[\u00c2-\u00ef][\u0080-\u00bf]')
def fix_mojibake(s):
    if not isinstance(s, str) or not s or not _MOJIBAKE.search(s):
        return s
    out = s
    for _ in range(3):
        if not _MOJIBAKE.search(out):
            break
        try:
            fixed = out.encode('latin-1').decode('utf-8')
        except UnicodeEncodeError:
            break                      # not Latin-1 representable: leave it alone
        except UnicodeDecodeError:
            # A truncated sequence at the end - a lone high byte with nothing to
            # pair with - used to abort the whole repair and leave the entire
            # string corrupted. Drop the undecodable tail, keep the rest.
            fixed = out.encode('latin-1', 'ignore').decode('utf-8', 'ignore')
            if not fixed or _MOJIBAKE.search(fixed):
                break
        if '�' in fixed or fixed == out:
            break
        out = fixed
    # Separator junk left dangling by a dropped tail ("Agent - ").
    return re.sub(r'[\s·|,\-–—]+$', '', out)

RAW = 'apps/scraper/data/postings_raw.ndjson'
NORM = 'apps/scraper/data/postings.ndjson'
OUT = 'apps/web/public/data/jobs'
DETAIL = 'apps/web/public/data/jobs-detail'
ALL = 'apps/web/public/data/all-jobs.json'
INDEX = 'apps/web/public/data/jobs-index.json'
# Sources whose terms allow re-display with attribution + link-back.
OK = {'greenhouse', 'usajobs', 'ashby', 'lever', 'himalayas', 'arbeitnow',
      'themuse', 'smartrecruiters', 'jobicy', 'remoteok', 'remotive',
      'workable', 'recruitee', 'careerjet', 'getonbrd',
      # Employer-direct postings, the same category as the ATS feeds above: the
      # employer publishes them publicly to attract candidates and every card
      # links back to their own posting. workday/personio are hosted-ATS feeds,
      # `direct` is the studio careers pages we render.
      'workday', 'personio', 'direct',
      # CR expansion (2026-08-22): amazon.jobs is the employer's own public
      # board; ANE is Costa Rica's public employment service (statutory
      # dissemination, the CR Job-Room); Jooble's partner API exists for
      # re-display with the redirect link AS the attribution (same contract
      # shape as Careerjet, which has sat in this set since the CH pivot).
      'amazon', 'ane', 'jooble',
      # Job-Room is SECO's public federal portal (docs/32). Ads are employer
      # vacancy notices, many mandated by the Stellenmeldepflicht, and every
      # card links back to job-room.ch or the employer's own externalUrl. This
      # is NOT the Adzuna/Reed case: those are contractually barred from
      # re-display, Job-Room carries no such term. Posture unchanged — if SECO
      # says stop, we stop, and this line is where we stop it.
      'jobroom'}
# getonbrd: re-display granted by GetOnBoard 2026-07-29, conditional on linking
# back to their listing. Every card and the sheet's apply button already point at
# j.url, which for these rows is the getonbrd.com posting, so the condition is
# met by the board's existing behaviour — do not route these through a rewritten
# or intermediary URL.
# Two caps, because the two outputs have different costs. The per-occupation
# board is fetched only when someone is on that occupation, and the client
# paginates at 60 anyway, so depth there is nearly free — a single CAP of 60 was
# suppressing 12,307 listings we already hold and are licensed to display
# (account-executive had 1,858 available and showed 60). The global aggregate is
# downloaded by everyone who opens /jobs, so it stays lean.
#
# 250 -> 600 on 2026-08-05. The country fix revealed 8,473 US postings we are
# licensed to display; only 4,441 reached the board because 31 occupations sat
# pegged at 250 and older US rows lost their slots to fresher Swiss ones.
# Measured cost of the raise, gzipped (what actually crosses the wire):
#   CAP=250  14,195 listings  697KB   US 4,441
#   CAP=400  17,422 listings  845KB   US 5,470
#   CAP=600  19,696 listings  942KB   US 6,000+
# +245KB gzipped buys +5,500 listings. Affordable because /data/*.json now
# carries a 1h cache header plus a day of stale-while-revalidate, so a repeat
# visitor and the CDN both fetch it once, not once per page view.
CAP = 600        # freshest N per occupation (per-occupation board + detail)
# The global file must describe the SAME universe as the per-occupation boards,
# or the site quotes two different numbers for one thing: the /jobs dek counted
# the full board (3,066 remote) while the client could only filter the global
# file (1,530). Full board is 2.74MB raw but 430KB gzipped, which is what
# actually crosses the wire, so completeness is affordable and consistency is
# not optional. ALL_CAP exists only as an escape hatch if that stops being true.
ALL_CAP = CAP  # MUST equal CAP: the consistency canary compares index sums against per-role files; a lower value aborts the build
FLOOR = 3        # skip occupations with fewer than this (no board)
DESC_CAP = 7000  # chars of description on the detail page

def num(v):
    try:
        return int(float(v)) if v not in (None, '', 'None') else None
    except (ValueError, TypeError):
        return None

# Brands whose casing simple title-casing gets wrong.
BRAND_CASE = {'openai': 'OpenAI', 'elevenlabs': 'ElevenLabs', 'gitlab': 'GitLab',
              'mongodb': 'MongoDB', 'doordash': 'DoorDash', 'sofi': 'SoFi',
              'clickhouse': 'ClickHouse', 'posthog': 'PostHog', 'duckduckgo': 'DuckDuckGo',
              'hashicorp': 'HashiCorp', 'digitalocean': 'DigitalOcean', 'nerdwallet': 'NerdWallet',
              'betterup': 'BetterUp', 'pagerduty': 'PagerDuty', 'wework': 'WeWork',
              'cockroachlabs': 'Cockroach Labs', 'jobandtalent': 'Job&Talent'}
def display_company(name):
    """ATS slugs often arrive all-lowercase ('coinbase'); title-case those,
    with a map for brands whose casing title-casing gets wrong (OpenAI)."""
    if name.lower() in BRAND_CASE:
        return BRAND_CASE[name.lower()]
    if name == name.lower():
        return ' '.join(w.capitalize() for w in name.split())
    return name

def jid(url):
    return hashlib.sha1(url.encode()).hexdigest()[:10]

_BLOCK_END = re.compile(r'</(p|div|ul|ol|h[1-6]|section|table|tr)>|<br\s*/?>', re.I)
_LI = re.compile(r'<li[^>]*>', re.I)
_TAG = re.compile(r'<[^>]+>')
def clean_desc(text):
    """Some sources (Greenhouse) ship the description as entity-escaped HTML.
    Unescape, turn block ends into newlines and list items into bullets, strip
    the rest of the tags, and tidy the whitespace into readable paragraphs."""
    t = html.unescape(html.unescape(text))          # twice: &amp;nbsp; style double-escapes
    t = _BLOCK_END.sub('\n\n', t)
    t = _LI.sub('\n· ', t)
    t = re.sub(r'[•●▪‣∙]\s*', '\n· ', t)            # inline bullet chars -> list items
    t = re.sub(r'(?m)^\s*[-–]\s+', '· ', t)          # line-start dashes -> list items
    t = _TAG.sub(' ', t)
    t = t.replace(' ', ' ').replace('\r', '')
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r' *\n *', '\n', t)
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t.strip()

# Industry-standard job-description sections (summary / responsibilities /
# qualifications / benefits and their common aliases). A short line matching one
# of these stems, or any short line ending in a colon, is treated as a heading.
_HEAD_STEMS = re.compile(
    r'\b(responsibilit|what you.?ll do|what you will do|your (role|mission|impact|day)|the role\b|'
    r'about (the role|this role|you|us|the (team|position|company|job))|qualification|requirement|'
    r'who you are|what (we.?re|we are) looking|looking for|must have|nice to have|bonus point|'
    r'preferred|what you.?ll bring|what you bring|skills? (and|&) experience|your experience|'
    r'benefit|perk|what we offer|we offer|why (join|you.?ll love|work)|compensation|salary|pay range|'
    r'duties|overview|summary|our (culture|values|mission)|the team\b|interview process|how to apply|'
    r'education|experience required)', re.I)
_SENT = re.compile(r'(?<=[.!?])\s+(?=[A-Z“"(])')
def _breathe(line):
    """A single line over ~500 chars is a wall (flattened sources ship these).
    Split it at sentence boundaries into short paragraphs of ~350 chars."""
    if len(line) <= 500 or line.startswith('·'):
        return [line]
    parts, cur = [], ''
    for sent in _SENT.split(line):
        if cur and len(cur) + len(sent) > 350:
            parts.append(cur.strip()); cur = sent
        else:
            cur = f'{cur} {sent}'.strip()
    if cur:
        parts.append(cur.strip())
    out = []
    for p in parts:
        out.extend([p, ''])
    return out[:-1] if out else [line]

def to_sections(text, cap):
    """Split cleaned text into [{h, t}] sections on detected headings."""
    sections, cur_h, cur = [], None, []
    def flush():
        t = '\n'.join(x for line in cur for x in _breathe(line)).strip()
        t = re.sub(r'\n{3,}', '\n\n', t)
        if t:
            sections.append({'h': cur_h, 't': t})
    used = 0
    for line in text.split('\n'):
        s = line.strip()
        if used >= cap:
            break
        is_head = (0 < len(s) <= 64 and not s.startswith('·')
                   and (_HEAD_STEMS.search(s) or s.endswith(':')
                        or (s.isupper() and any(c.isalpha() for c in s) and len(s) >= 4)))
        if is_head:
            flush()
            cur_h, cur = s.rstrip(':').strip(), []
        else:
            cur.append(line)
            used += len(line)
    flush()
    return sections[:12] if sections else ([{'h': None, 't': text[:cap]}] if text else [])


# Country resolution: normalize's code when present, else inferred from the raw
# location string (country names, ", XX" suffixes, US states, major cities).
_C_NAMES = {'united states':'US','usa':'US','u.s.':'US','america':'US','united kingdom':'GB','uk':'GB','england':'GB','scotland':'GB','germany':'DE','deutschland':'DE','canada':'CA','india':'IN','ireland':'IE','australia':'AU','japan':'JP','singapore':'SG','spain':'ES','españa':'ES','mexico':'MX','méxico':'MX','brazil':'BR','brasil':'BR','france':'FR','poland':'PL','polska':'PL','netherlands':'NL','portugal':'PT','italy':'IT','italia':'IT','sweden':'SE','switzerland':'CH','austria':'AT','belgium':'BE','denmark':'DK','norway':'NO','finland':'FI','estonia':'EE','lithuania':'LT','latvia':'LV','czech':'CZ','czechia':'CZ','romania':'RO','hungary':'HU','greece':'GR','israel':'IL','united arab emirates':'AE','uae':'AE','dubai':'AE','saudi':'SA','turkey':'TR','türkiye':'TR','argentina':'AR','colombia':'CO','chile':'CL','peru':'PE','philippines':'PH','indonesia':'ID','malaysia':'MY','thailand':'TH','vietnam':'VN','south korea':'KR','korea':'KR','china':'CN','hong kong':'HK','taiwan':'TW','new zealand':'NZ','south africa':'ZA','nigeria':'NG','kenya':'KE','egypt':'EG','ukraine':'UA','serbia':'RS','croatia':'HR','bulgaria':'BG','slovakia':'SK','slovenia':'SI','luxembourg':'LU','iceland':'IS','costa rica':'CR','uruguay':'UY','ecuador':'EC','panama':'PA','guatemala':'GT','dominican republic':'DO','venezuela':'VE','pakistan':'PK','bangladesh':'BD','sri lanka':'LK','morocco':'MA','ghana':'GH','tunisia':'TN','qatar':'QA','jordan':'JO','uganda':'UG','ethiopia':'ET','tanzania':'TZ'}
_C_CITIES = {'london':'GB','manchester':'GB','edinburgh':'GB','berlin':'DE','munich':'DE','münchen':'DE','hamburg':'DE','frankfurt':'DE','cologne':'DE','paris':'FR','lyon':'FR','amsterdam':'NL','rotterdam':'NL','utrecht':'NL','eindhoven':'NL','dublin':'IE','toronto':'CA','vancouver':'CA','montreal':'CA','ottawa':'CA','calgary':'CA','sydney':'AU','melbourne':'AU','brisbane':'AU','tokyo':'JP','osaka':'JP','bangalore':'IN','bengaluru':'IN','mumbai':'IN','hyderabad':'IN','pune':'IN','chennai':'IN','delhi':'IN','gurgaon':'IN','gurugram':'IN','noida':'IN','zurich':'CH','zürich':'CH','geneva':'CH','stockholm':'SE','madrid':'ES','barcelona':'ES','warsaw':'PL','krakow':'PL','kraków':'PL','lisbon':'PT','porto':'PT','milan':'IT','rome':'IT','vienna':'AT','brussels':'BE','copenhagen':'DK','oslo':'NO','helsinki':'FI','tallinn':'EE','vilnius':'LT','prague':'CZ','bucharest':'RO','budapest':'HU','athens':'GR','tel aviv':'IL','mexico city':'MX','sao paulo':'BR','são paulo':'BR','buenos aires':'AR','bogota':'CO','bogotá':'CO','santiago':'CL','manila':'PH','jakarta':'ID','kuala lumpur':'MY','cyberjaya':'MY','bangkok':'TH','ho chi minh':'VN','seoul':'KR','shanghai':'CN','beijing':'CN','taipei':'TW','auckland':'NZ','cape town':'ZA','johannesburg':'ZA','nairobi':'KE','cairo':'EG','kyiv':'UA','belgrade':'RS','zagreb':'HR','sofia':'BG','bratislava':'SK','ljubljana':'SI','amman':'JO','riyadh':'SA','doha':'QA','abu dhabi':'AE','stuttgart':'DE','düsseldorf':'DE','dusseldorf':'DE','leipzig':'DE','dortmund':'DE','essen':'DE','bremen':'DE','dresden':'DE','hannover':'DE','hanover':'DE','nuremberg':'DE','nürnberg':'DE','nuernberg':'DE','duisburg':'DE','bochum':'DE','wuppertal':'DE','bielefeld':'DE','bonn':'DE','mannheim':'DE','karlsruhe':'DE','augsburg':'DE','wiesbaden':'DE','münster':'DE','muenster':'DE','aachen':'DE','kassel':'DE','freiburg':'DE','mainz':'DE','heidelberg':'DE','darmstadt':'DE','ulm':'DE','ingolstadt':'DE','regensburg':'DE','erlangen':'DE','potsdam':'DE','basel':'CH','bern':'CH','lausanne':'CH','lugano':'CH','zug':'CH','winterthur':'CH','st. gallen':'CH','antwerp':'BE','antwerpen':'BE','ghent':'BE','gent':'BE','leuven':'BE','liège':'BE','liege':'BE','the hague':'NL','den haag':'NL','groningen':'NL','haarlem':'NL','delft':'NL','tilburg':'NL','breda':'NL','nijmegen':'NL','leiden':'NL','graz':'AT','linz':'AT','salzburg':'AT','innsbruck':'AT','gothenburg':'SE','göteborg':'SE','goteborg':'SE','malmö':'SE','malmo':'SE','uppsala':'SE','aarhus':'DK','odense':'DK','bergen':'NO','trondheim':'NO','stavanger':'NO','tampere':'FI','espoo':'FI','turku':'FI','oulu':'FI','cork':'IE','galway':'IE','limerick':'IE','valencia':'ES','seville':'ES','sevilla':'ES','malaga':'ES','málaga':'ES','bilbao':'ES','zaragoza':'ES','murcia':'ES','alicante':'ES','turin':'IT','torino':'IT','naples':'IT','napoli':'IT','bologna':'IT','florence':'IT','firenze':'IT','genoa':'IT','venice':'IT','verona':'IT','padova':'IT','wroclaw':'PL','wrocław':'PL','poznan':'PL','poznań':'PL','gdansk':'PL','gdańsk':'PL','lodz':'PL','katowice':'PL','szczecin':'PL','braga':'PT','coimbra':'PT','brno':'CZ','ostrava':'CZ','cluj':'RO','cluj-napoca':'RO','timisoara':'RO','iasi':'RO','thessaloniki':'GR','guadalajara':'MX','monterrey':'MX','rio de janeiro':'BR','campinas':'BR','belo horizonte':'BR','curitiba':'BR','porto alegre':'BR','florianopolis':'BR','córdoba':'AR','cordoba':'AR','rosario':'AR','medellin':'CO','medellín':'CO','cali':'CO','montevideo':'UY','lima':'PE','quito':'EC','guayaquil':'EC','san josé':'CR','heredia':'CR','panama city':'PA','shenzhen':'CN','guangzhou':'CN','hangzhou':'CN','chengdu':'CN','busan':'KR','kyoto':'JP','yokohama':'JP','fukuoka':'JP','nagoya':'JP','hanoi':'VN','ho chi minh city':'VN','cebu':'PH','penang':'MY','george town':'MY','hsinchu':'TW','wellington':'NZ','christchurch':'NZ','kolkata':'IN','ahmedabad':'IN','jaipur':'IN','chandigarh':'IN','kochi':'IN','coimbatore':'IN','indore':'IN','nagpur':'IN','jeddah':'SA','mecca':'SA','medina':'SA','dammam':'SA','sharjah':'AE','jerusalem':'IL','haifa':'IL','lagos':'NG','abuja':'NG','accra':'GH','casablanca':'MA','rabat':'MA','tunis':'TN','kampala':'UG','addis ababa':'ET','dar es salaam':'TZ'}
_US_STATES = {'al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia','ks','ky','la','me','md','ma','mi','mn','ms','mo','mt','ne','nv','nh','nj','nm','ny','nc','nd','oh','ok','or','pa','ri','sc','sd','tn','tx','ut','vt','va','wa','wv','wi','wy','dc'}
# Full ISO-3166-1 alpha-2 set, so a trailing ", XX" resolves for every country,
# not only ones we happen to have a city for (this is what fixed "Heredia, CR").
_ISO2 = {'AD','AE','AF','AG','AI','AL','AM','AO','AR','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GT','GU','GW','GY','HK','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW'}
def resolve_country(norm_c, location):
    if norm_c:
        return norm_c
    loc = (location or '').lower()
    if not loc:
        return None
    if 'ã' in loc or 'â' in loc:  # repair UTF-8 mis-decoded as Latin-1 ("MÃ©xico" -> "méxico")
        try:
            loc = (location.encode('latin-1', 'ignore').decode('utf-8', 'ignore').lower()) or loc
        except (UnicodeError, AttributeError):
            pass
    # Word-bounded matching throughout: bare substring checks re-introduced
    # bugs country.js already fixed ("indianapolis" contains "india",
    # "come join us" contains "us"). Longest names first so "south korea"
    # beats "korea" and "ukraine" is not shadowed by a shorter "uk".
    for name in sorted(_C_NAMES, key=len, reverse=True):
        if re.search(r'\b' + re.escape(name) + r'\b', loc):
            return _C_NAMES[name]
    for city in sorted(_C_CITIES, key=len, reverse=True):
        if re.search(r'\b' + re.escape(city) + r'\b', loc):
            return _C_CITIES[city]
    for st in ('alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','wisconsin','wyoming','district of columbia','puerto rico'):
        if re.search(r'\b' + st + r'\b', loc):
            return 'US'
    for city in ('san francisco','new york','seattle','boston','chicago','denver','atlanta','los angeles','san diego','san jose','portland','philadelphia','houston','dallas','miami','austin','nashville','phoenix','minneapolis','salt lake','brooklyn'):
        if re.search(r'\b' + city + r'\b', loc):
            return 'US'
    # 'us' is NOT matched lowercased: "come join us, fully remote" is the
    # pronoun hijack country.js documents. Only the original-case token counts.
    if re.search(r'\bUS\b', location or '') or re.search(r'\b(u\.s\.|usa)\b', loc):
        return 'US'
    m = re.search(r',\s*([a-z]{2})\b\s*$', loc)
    if m:
        suf = m.group(1)
        if suf in _US_STATES:
            return 'US'
        if suf.upper() in _ISO2:
            return suf.upper()
    if re.search(r',\s*(' + '|'.join(_US_STATES) + r')\b', loc):
        return 'US'
    return None

# Derived filter tags — computed from the posting text, never self-reported
# (the documented weakness of tag boards is employers mis-tagging; ours are read
# from the description itself). Short codes keep the browse payload light:
# 4d four-day week · eq equity · vi visa sponsorship. Level from the title.
_F_4DAY = re.compile(r'\b(four|4)[- ]day( work)?[- ]?week|\b4x10\b|9[- ]day fortnight|32[- ]hour( work)?[- ]?week', re.I)
_F_EQUITY = re.compile(r'\bequity\b|stock options?|\brsus?\b|employee stock', re.I)
_F_VISA = re.compile(r'visa sponsorship|sponsor(?:ship)?\s+(?:a |an |your |our |the |work )*visa|h-?1b sponsor|sponsorship (?:is )?available', re.I)
# 76% of postings that say "visa sponsorship" are DECLINING it ("no visa
# sponsorship", "not eligible for", "without visa sponsorship"). The bare phrase
# is not a signal; only flag it when no negation sits in the 45 chars before it.
_VISA_NEG = re.compile(r"\b(?:no|not|without|cannot|can't|won't|don't|doesn't|unable|ineligible|neither|nor|are not|is not|do not|does not)\b", re.I)
# Negation that sits AFTER the phrase, e.g. "visa sponsorship is not available".
_VISA_NEG_AFTER = re.compile(r"^[\s:.-]*(?:is|are|will be|can be|would be|cannot be)?\s*(?:not|no\b|un(?:available|able)|isn'?t|aren'?t)", re.I)
def _visa_positive(desc):
    # Conservative: flag only when the posting mentions visa sponsorship AND never
    # declines it, checking the words both before and after each phrase ("no visa
    # sponsorship", "visa sponsorship is not available"). One decline disqualifies
    # the listing, so we never tell a visa-seeker a job sponsors when it might not.
    clean = False
    for m in _F_VISA.finditer(desc):
        if _VISA_NEG.search(desc[max(0, m.start() - 45):m.start()]):
            return False
        if _VISA_NEG_AFTER.match(desc[m.end():m.end() + 30]):
            return False
        clean = True
    return clean
_L_SENIOR = re.compile(r'\b(senior|staff|principal|lead|sr\.?)\b', re.I)
_L_ENTRY = re.compile(r'\b(junior|entry[- ]level|graduate|intern(ship)?|jr\.?|trainee|apprentice)\b', re.I)
def derive_flags(title, desc):
    fl = []
    if _F_4DAY.search(desc): fl.append('4d')
    if _F_EQUITY.search(desc): fl.append('eq')
    if _visa_positive(desc): fl.append('vi')
    lv = 's' if _L_SENIOR.search(title) else 'e' if _L_ENTRY.search(title) else None
    return fl, lv

# Recognizable employers for the launch featured strip (only those actually in
# the corpus are used; salary-stated and freshest preferred, max two roles each).
FEATURED_COMPANIES = {'coinbase', 'airbnb', 'databricks', 'cloudflare', 'datadog', 'mongodb',
                      'pinterest', 'reddit', 'robinhood', 'vercel', 'stripe', 'figma', 'notion',
                      'webflow', 'airtable', 'gusto', 'anthropic', 'duolingo', 'affirm', 'plaid',
                      'openai', 'palantir', 'spotify', 'canva', 'discord', 'peloton', 'rivian',
                      'instacart', 'doordash', 'lyft', 'elevenlabs', 'linear', 'ramp', 'mercury',
                      'supabase', 'retool', 'grammarly', 'gitlab', 'dropbox', 'asana'}
FEATURED_CAP = 12

benefit_counts = collections.Counter()
# Rows carry benefits as TAXONOMY-ORDER indices ('b': [3,17]) and gates as a
# compact 'g' object — the filter sheet reads them without per-job fetches.
# Taxonomy order is stable across runs (the glossary re-sorts by count, so its
# order is NOT an encoding key; each glossary entry ships its taxonomy index
# 'i' instead). Measured cost on the 2026-08 corpus: +99KB gzipped on ALL.
BEN_IDX = {b['id']: i for i, b in enumerate(benefits_miner.load())}
LANG_CODE = {'german': 'de', 'english': 'en', 'french': 'fr', 'italian': 'it',
             'spanish': 'es', 'portuguese': 'pt', 'dutch': 'nl', 'swedish': 'sv',
             'danish': 'da', 'norwegian': 'no', 'polish': 'pl', 'japanese': 'ja',
             'mandarin': 'zh', 'chinese': 'zh', 'arabic': 'ar', 'russian': 'ru'}


def gate_row(reqs):
    """The row-sized gate encoding: x = years asked, d = education
    level+state initials ('br' bachelor required, 'bw' waived...), l = language
    codes. Absence of a key means the posting text states nothing."""
    g = {}
    if 'exp' in reqs:
        try:
            g['x'] = int(reqs['exp'])
        except (TypeError, ValueError):
            pass
    edu = reqs.get('edu') or {}
    # distinct level codes: apprenticeship and associate both start with 'a'
    _LVL = {'apprenticeship': 'p', 'associate': 'a', 'bachelor': 'b', 'master': 'm', 'doctorate': 'd', 'phd': 'd'}
    if edu.get('level') and edu.get('state'):
        lvl = _LVL.get(edu['level'], edu['level'][0])
        g['d'] = lvl + edu['state'][0]
    langs = []
    for name in (reqs.get('lang') or []):
        code = LANG_CODE.get(str(name).split(' (')[0].split(' ')[0].strip().lower())
        if code and code not in langs:
            langs.append(code)
    if langs:
        g['l'] = langs
    return g
req_counts = collections.Counter()

# 1. Raw index by (source, external_id) for company / location / description.
raw = {}
for line in open(RAW):
    try:
        d = json.loads(line)
    except json.JSONDecodeError:
        continue
    if d.get('source') in OK:
        raw[(d['source'], str(d.get('external_id')))] = d

# 2. Build listings from the normalized rows (they carry role_id + USD salary).
# Company logos, fetched by fetch-logos.mjs into public/data/logos/<slug>.png;
# every listing that has one carries a logo path, the rest fall back to a monogram.
try:
    LOGOS = {f[:-4] for f in os.listdir('apps/web/public/data/logos') if f.endswith('.png')}
except FileNotFoundError:
    LOGOS = set()
byocc = collections.defaultdict(list)
desc_byocc = collections.defaultdict(dict)
seen_url, seen_ct = set(), set()
for line in open(NORM):
    try:
        d = json.loads(line)
    except json.JSONDecodeError:
        continue
    s = d.get('source')
    if s not in OK:
        continue
    role, url = d.get('role_id'), d.get('url')
    if not role or not url or url in seen_url:
        continue
    r = raw.get((s, str(d.get('external_id'))), {})
    company = fix_mojibake((r.get('company') or '')).strip()
    if not company or company.lower() in ('none', 'n/a', 'confidential'):
        continue  # a board card needs a named employer
    title = fix_mojibake((r.get('title') or d.get('title_raw') or '')).strip()
    ct = (company.lower(), title.lower())
    if not title or ct in seen_ct:
        continue
    seen_url.add(url); seen_ct.add(ct)
    remote = str(d.get('remote_flag')) == 'True'
    _id = jid(url)
    desc = clean_desc(fix_mojibake(r.get('description_text') or ''))
    fl, lv = derive_flags(title, desc)
    loc = fix_mojibake((r.get('location') or '')).strip()
    cty = resolve_country(d.get('country'), loc)
    # Belt-and-braces salary guard (normalize already sanitizes; this catches
    # regressions): nothing above $900k ships, degenerate mins are dropped.
    smin, smax = num(d.get('salary_usd_min')), num(d.get('salary_usd_max'))
    if smax and smax > 900000:
        smin = smax = None
    if smin and smax and (smin < 1000 or smax / smin > 5):
        smin = None
    disp_co = display_company(company)[:80]
    logo_slug = re.sub(r'[^a-z0-9]', '', disp_co.lower())
    bens = benefits_miner.extract(desc) if desc else []
    reqs = req_miner.extract(desc) if desc else {}
    grow = gate_row(reqs)
    byocc[role].append({
        'id': _id,
        'occ': role,
        'title': title[:120],
        'company': disp_co,
        'location': loc[:60] or ('Remote' if remote else ''),
        'remote': remote,
        'smin': smin,
        'smax': smax,
        'url': url,
        'source': s,
        'posted': (str(d.get('posted_at') or ''))[:10],
        **({'logo': f'/data/logos/{logo_slug}.png'} if logo_slug in LOGOS else {}),
        **({'fl': fl} if fl else {}),
        **({'lv': lv} if lv else {}),
        **({'c': cty} if cty else {}),
        **({'b': sorted(BEN_IDX[x] for x in bens if x in BEN_IDX)} if bens else {}),
        **({'g': grow} if grow else {}),
    })
    if desc:
        for b in bens:
            benefit_counts[b] += 1
        for k in reqs:
            req_counts[k] += 1
        desc_byocc[role][_id] = {'s': to_sections(desc, DESC_CAP), 'k': list(d.get('skills') or []),
                                 **({'b': bens} if bens else {}),
                                 **({'r': reqs} if reqs else {})}

# 3. Freshest-first, capped, floored.
for d in (OUT, DETAIL):
    os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        if f.endswith('.json'):
            os.remove(os.path.join(d, f))
# Trim and cap first; flag featured on the originals; then write everything,
# so the per-occupation files, the global file, and the strip all agree.
# Per-occupation ceiling on ANY single country while other-country supply
# remains. Born as a US-only ceiling when US crowded out the world; Job-Room
# then made CH the crowding country (CH 47% vs US 25% on 2026-08-09), so the
# rule is now symmetric. Occupations with single-country supply still fill
# to CAP: the ceiling only bites while spill from other countries exists.
COUNTRY_SHARE = 0.65
kept_byocc = {}
for role, jobs in byocc.items():
    jobs.sort(key=lambda j: j['posted'] or '', reverse=True)
    country_cap = int(CAP * COUNTRY_SHARE)
    picked, spill, per_c = [], [], collections.Counter()
    for j in jobs:
        if len(picked) >= CAP:
            break
        c = j.get('c') or 'none'
        if per_c[c] < country_cap:
            picked.append(j); per_c[c] += 1
        else:
            spill.append(j)
    for j in spill:                     # backfill over-ceiling rows only if slots remain
        if len(picked) >= CAP:
            break
        picked.append(j)
    picked.sort(key=lambda j: j['posted'] or '', reverse=True)
    if len(picked) >= FLOOR:
        kept_byocc[role] = picked

# Global CH/US backstop. The per-occupation ceiling rebalances at-cap
# occupations, but Job-Room also fills under-cap trades where no other source
# has supply, and those alone can tip the whole board Swiss. Board-wide rule:
# CH may not exceed BALANCE_RATIO x US. Overflow is trimmed oldest-first from
# the most CH-heavy occupations, never taking an occupation below FLOOR, and
# it relaxes by itself as US supply grows. Display-side only: the corpus and
# the Swiss-filtered pages both shrink with it, deliberately (2026-08-09,
# board was CH 47% / US 25%).
BALANCE_RATIO = 1.25
_c_tot = collections.Counter(j.get('c') or 'none' for jobs in kept_byocc.values() for j in jobs)
_excess = _c_tot['CH'] - int(BALANCE_RATIO * _c_tot['US'])
if _excess > 0:
    # oldest CH rows across the board, grouped so each occupation keeps >= FLOOR
    ch_rows = [(j['posted'] or '', role, j['id']) for role, jobs in kept_byocc.items()
               for j in jobs if j.get('c') == 'CH']
    ch_rows.sort()  # oldest first
    drop = set()
    room = {role: len(jobs) - FLOOR for role, jobs in kept_byocc.items()}
    for posted, role, _id in ch_rows:
        if _excess <= 0:
            break
        if room[role] <= 0:
            continue
        drop.add((role, _id)); room[role] -= 1; _excess -= 1
    for role in list(kept_byocc):
        kept_byocc[role] = [j for j in kept_byocc[role] if (role, j['id']) not in drop]
        if len(kept_byocc[role]) < FLOOR:
            del kept_byocc[role]
    _after = collections.Counter(j.get('c') or 'none' for jobs in kept_byocc.values() for j in jobs)
    print(f"balance: CH {_c_tot['CH']} -> {_after['CH']} (<= {BALANCE_RATIO} x US {_c_tot['US']}), dropped {len(drop)}")

# Featured strip: recognizable employers, salary-stated first, freshest,
# max two per company. Flag the original rows and emit the strip.
featured, per_co = [], collections.Counter()
candidates = [j for jobs in kept_byocc.values() for j in jobs if j['company'].lower() in FEATURED_COMPANIES]
candidates.sort(key=lambda j: (bool(j['smin'] or j['smax']), j['posted'] or ''), reverse=True)
for j in candidates:
    co = j['company'].lower()
    if per_co[co] >= 2 or len(featured) >= FEATURED_CAP:
        continue
    per_co[co] += 1
    j['featured'] = True
    # attach a locally-served company logo when we have one (public/data/logos/<slug>.png)
    slug = re.sub(r'[^a-z0-9]', '', co)
    if os.path.exists(f'apps/web/public/data/logos/{slug}.png'):
        j['logo'] = f'/data/logos/{slug}.png'
    featured.append(j)
json.dump([{k: v for k, v in j.items() if k != 'url'} for j in featured],
          open('apps/web/public/data/featured-jobs.json', 'w'), ensure_ascii=False)

# Purity canary — the dental-hygienist lesson. On boards for licensed professions,
# titles whose FINAL word is a tier noun (assistant, technician, aide...) are a
# different job wearing the profession's name. The matcher's head-noun guard should
# keep them out; this canary fails the build loudly if they ever creep back.
TIER_TAIL = {'assistant', 'aide', 'technician', 'tech', 'orderly', 'liaison',
             'recruiter', 'scheduler', 'biller', 'coder', 'clerk', 'receptionist', 'secretary'}
tax = json.load(open('packages/data/taxonomy/occupations.json'))['occupations']
licensed = {o['slug'] for o in tax if (o.get('license') or {}).get('req') == 'required'}
canary_fail = False
for role, jobs in kept_byocc.items():
    if role not in licensed or any(w in role for w in ('assistant', 'technician', 'aide')):
        continue
    def _tail(t):
        words = re.sub(r'\(.*?\)', ' ', t.lower()).split(' - ')[0].split('/')[-1].split()
        return words[-1] if words else ''
    sus = [j for j in jobs if _tail(j['title']) in TIER_TAIL]
    share = len(sus) / len(jobs) if jobs else 0
    if share >= 0.10:
        lvl = 'FAIL' if share > 0.30 else 'WARN'
        print(f"purity {lvl}: {role} board is {share:.0%} tier-suffix titles "
              f"(e.g. {', '.join(repr(j['title'][:40]) for j in sus[:3])})")
        if share > 0.30:
            canary_fail = True
if canary_fail:
    raise SystemExit('purity canary failed: a licensed board is >30% cross-tier titles')

index, all_rows = {}, []
for role, jobs in kept_byocc.items():
    json.dump(jobs, open(f'{OUT}/{role}.json', 'w'), ensure_ascii=False)
    kept = {j['id'] for j in jobs}
    details = {i: v for i, v in desc_byocc[role].items() if i in kept}
    json.dump(details, open(f'{DETAIL}/{role}.json', 'w'), ensure_ascii=False)
    index[role] = len(jobs)
    # global search rows: the freshest ALL_CAP per occupation, and drop the
    # outbound URL (only detail pages need it; it is the heaviest field) —
    # browse links internally via occ + id.
    all_rows.extend({k: v for k, v in j.items() if k != 'url'} for j in jobs[:ALL_CAP])
all_rows.sort(key=lambda j: j['posted'] or '', reverse=True)

# Mojibake canary: no displayed field may ship the two-high-byte corruption
# signature (fix_mojibake runs on every read; this fails loudly on a regression).
moji = [j for j in all_rows if _MOJIBAKE.search(f"{j['title']} {j['company']} {j['location']}")]
if moji:
    for j in moji[:5]:
        print(f"mojibake canary: {j['company']!r} · {j['location']!r} · {j['title']!r}")
    raise SystemExit(f'mojibake canary failed: {len(moji)} displayed listings still corrupted')

# Consistency canary: every surface counts from one universe, or the build
# fails. The /jobs dek sums the per-occupation files, /jobs/browse and the
# client both read all-jobs.json — they must agree exactly.
board_total_chk = sum(index.values())
if board_total_chk != len(all_rows):
    raise SystemExit(f'consistency canary failed: per-occupation boards hold {board_total_chk} '
                     f'listings but all-jobs.json carries {len(all_rows)} — the site would quote two numbers')
remote_occ = sum(1 for jobs in kept_byocc.values() for j in jobs if j.get('remote'))
remote_all = sum(1 for j in all_rows if j.get('remote'))
if remote_occ != remote_all:
    raise SystemExit(f'consistency canary failed: remote count {remote_occ} across boards '
                     f'vs {remote_all} in all-jobs.json')

json.dump(all_rows, open(ALL, 'w'), ensure_ascii=False)
json.dump(index, open(INDEX, 'w'), ensure_ascii=False)

# Benefits glossary: every mined benefit with its definition and how many of the
# listings that shipped state it. Counts come from this run, so the glossary can
# never quote a number the board does not hold.
shipped = collections.Counter()
for role in index:
    for det in json.load(open(f'{DETAIL}/{role}.json')).values():
        for b in det.get('b') or []:
            shipped[b] += 1
gloss = [{'slug': b['id'], 'term': b['name'], 'cat': b['cat'], 'glyph': b.get('glyph'),
          'def': b.get('def', ''), 'n': shipped.get(b['id'], 0), 'i': BEN_IDX[b['id']]}
         for b in benefits_miner.load()]
gloss.sort(key=lambda e: (-e['n'], e['term']))
json.dump(gloss, open('apps/web/public/data/benefits-glossary.json', 'w'), ensure_ascii=False)
seen_n = sum(1 for e in gloss if e['n'])
print(f"benefits: {sum(shipped.values())} statements across {seen_n} of {len(gloss)} kinds")
gates = collections.Counter()
for role in index:
    for det in json.load(open(f'{DETAIL}/{role}.json')).values():
        for k in (det.get('r') or {}):
            gates[k] += 1
print(f"gates: experience {gates['exp']}, education {gates['edu']}, language {gates['lang']}")
size_kb = os.path.getsize(ALL) // 1024
board_total = sum(index.values())
print(f"emitted {len(index)} occupation boards, {board_total} listings "
      f"(global file carries {len(all_rows)} at ALL_CAP={ALL_CAP}), all-jobs.json {size_kb}KB")
with_desc = sum(1 for role in index for _ in json.load(open(f'{DETAIL}/{role}.json')))
print(f"detail descriptions: {with_desc} of {board_total}")
