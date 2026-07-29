// Non-English title mapping, phase 1: Spanish and Portuguese.
//
// WHY THIS EXISTS. Title mapping is the miner's biggest single loss. Of the raw
// corpus, ~64% of postings map to an occupation; the rest are logged unmapped and
// never reach the board or the graph. A slice of that loss is not vocabulary at
// all — it is language. Measured 2026-07-29 against the live corpus: 1,217
// unmapped postings carry a Spanish or Portuguese title (938 distinct), mostly
// from Adzuna's ES/MX/CO/BR markets and GetOnBoard's LatAm feed. GetOnBoard alone
// ingests ~1,015 postings and only ~402 survive normalize; the gap is titles like
// "Ingeniero/a DevOps Senior" that the English matcher cannot see.
//
// WHY NOT SYNONYMS IN occupations.json. The obvious fix — paste Spanish strings
// into each occupation's synonyms[] — needs one entry per gender × number ×
// qualifier combination ("ingeniero de datos", "ingeniera de datos", "ingeniero/a
// de datos", "ingenieros de datos"…) and buys nothing for the next language. This
// layer translates instead, then hands a plain English title to the existing
// matcher. One table per language; the occupation taxonomy stays monolingual.
//
// THE HARD PART IS WORD ORDER, NOT WORDS. Romance job titles are head-initial:
// "ingeniero de software" is engineer-of-software. English is head-final: software
// engineer. A word-for-word swap yields "engineer of software", which matches
// nothing. So translation is followed by a reordering pass that moves the head
// noun to the end — the rule that makes the whole layer work.
//
// SAFETY. This runs ONLY after English matching has already failed, and only
// fires when a Romance head noun was actually recognised. An English title can
// therefore never be routed through it, so the ~64% that map today cannot regress.

/** Strip combining marks: diseñador -> disenador, médico -> medico.
 *
 *  Also used by the main cleaner. The character filter there maps anything
 *  non-ASCII to a SPACE, which silently split accented words in half ("médico" ->
 *  "m dico") and — worse — meant the accented and unaccented spellings of the same
 *  word never matched each other, though the corpus contains both ("diseñador
 *  gráfico" 6, "diseñador grafico" 3, same job). Folding first merges them. */
export function foldAccents(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Multiword compounds, applied before the word table because their parts
// translate wrong in isolation ("medico radiologo" is a radiologist, not a
// physician; "recursos humanos" is not "resources human"). Longest first.
const PHRASES = [
  ['inteligencia artificial', 'artificial intelligence'],
  ['aprendizaje automatico', 'machine learning'],
  ['aprendizado de maquina', 'machine learning'],
  ['cadena de suministro', 'supply chain'],
  ['atencion al cliente', 'customer support'],
  ['atendimento ao cliente', 'customer support'],
  ['recursos humanos', 'human resources'],
  ['base de datos', 'database'],
  ['banco de dados', 'database'],
  ['representante medico', 'sales representative'],
  ['visitador medico', 'sales representative'],
  ['medico radiologo', 'radiologist physician'],
  ['medico cardiologo', 'cardiologist physician'],
  ['medico pediatra', 'pediatrician physician'],
  ['medico general', 'general practitioner physician'],
  ['medico veterinario', 'veterinarian'],
  ['jefe de obra', 'construction manager'],
  ['jefe de proyecto', 'project manager'],
  ['director de obra', 'construction manager'],
  ['maestro de obra', 'construction manager'],
  ['ejecutivo de cuentas', 'account executive'],
  ['ejecutivo de ventas', 'sales representative'],
  ['representante de ventas', 'sales representative'],
  ['asesor comercial', 'sales representative'],
  ['agente inmobiliario', 'real estate agent'],
  ['corredor inmobiliario', 'real estate agent'],
  ['trabajador social', 'social worker'],
  ['asistente social', 'social worker'],
  ['auxiliar administrativo', 'administrative assistant'],
  ['auxiliar contable', 'bookkeeper'],
  ['auxiliar de enfermeria', 'nursing assistant'],
  ['tecnico de mantenimiento', 'maintenance technician'],
  ['tecnico en sistemas', 'it support technician'],
  ['soporte tecnico', 'it support'],
  ['mesa de ayuda', 'it support'],
  ['analista de sistemas', 'systems analyst'],
  ['analista funcional', 'business analyst'],
  ['analista de negocio', 'business analyst'],
  ['analista de negocios', 'business analyst'],
  ['analista de negocios', 'business analyst'],
  ['cientifico de datos', 'data scientist'],
  ['cientista de dados', 'data scientist'],
  ['ingeniero de datos', 'data engineer'],
  ['engenheiro de dados', 'data engineer'],
  ['desarrollador full stack', 'full stack developer'],
  ['desenvolvedor full stack', 'full stack developer'],
  ['control de calidad', 'quality assurance'],
  ['controle de qualidade', 'quality assurance'],
  ['seguridad informatica', 'information security'],
  ['seguranca da informacao', 'information security'],
  ['redes y telecomunicaciones', 'network'],
  ['disenador industrial', 'industrial designer'],
  ['disenador de interiores', 'interior designer'],
  ['diseno de interiores', 'interior design'],
  ['disenador grafico', 'graphic designer'],
  ['designer grafico', 'graphic designer'],
  ['diseno grafico', 'graphic design'],
  ['arquitecto de soluciones', 'solutions architect'],
  ['arquiteto de solucoes', 'solutions architect'],
  ['arquitecto de software', 'software architect'],
  ['gerente de proyecto', 'project manager'],
  ['gerente de proyectos', 'project manager'],
  ['gerente de projetos', 'project manager'],
  ['gerente de producto', 'product manager'],
  ['gerente de produto', 'product manager'],
  ['tecnico mecanico', 'mechanical technician'],
  ['consultor de vendas', 'sales representative'],
  ['consultor de ventas', 'sales representative'],
  ['analista de qualidade de software', 'qa engineer'],
  ['analista de calidad de software', 'qa engineer'],
  ['analista de qa', 'qa engineer'],
  ['auxiliar de enfermagem', 'nursing assistant'],
  ['tecnico de enfermagem', 'nursing assistant'],
  ['jefe de cocina', 'chef'],
  ['chef de cocina', 'chef'],
  ['ayudante de cocina', 'cook'],
  ['auxiliar de cocina', 'cook'],
  ['personal de cocina', 'cook'],
  ['segundo de cocina', 'cook'],
];

// Token table. '' drops the token (articles, prepositions, market noise).
// Gendered and plural forms are listed explicitly rather than stemmed — Spanish
// stemming misfires on exactly the words that matter ("operario"/"operación").
const WORDS = {
  // ── heads: the occupation itself ──────────────────────────────────────────
  ingeniero: 'engineer', ingeniera: 'engineer', ingenieros: 'engineer',
  ingenieria: 'engineering', engenheiro: 'engineer', engenharia: 'engineering',
  desarrollador: 'developer', desarrolladora: 'developer', desarrolladores: 'developer',
  desenvolvedor: 'developer', desenvolvedora: 'developer', programador: 'programmer',
  programadora: 'programmer', analista: 'analyst', analistas: 'analyst',
  gerente: 'manager', gerentes: 'manager', jefe: 'head', jefa: 'head',
  encargado: 'supervisor', encargada: 'supervisor', supervisora: 'supervisor',
  coordinador: 'coordinator', coordinadora: 'coordinator', coordenador: 'coordinator',
  especialista: 'specialist', consultor: 'consultant', consultora: 'consultant',
  asesor: 'advisor', asesora: 'advisor', ejecutivo: 'executive', ejecutiva: 'executive',
  tecnico: 'technician', tecnica: 'technician', tecnicos: 'technician',
  auxiliar: 'assistant', asistente: 'assistant', assistente: 'assistant',
  ayudante: 'assistant', administrador: 'administrator', administradora: 'administrator',
  arquitecto: 'architect', arquitecta: 'architect', arquiteto: 'architect',
  arquitectura: 'architecture', arquitetura: 'architecture',
  disenador: 'designer', disenadora: 'designer', diseno: 'design', desenho: 'design',
  medico: 'physician', medica: 'physician', medicos: 'physician',
  enfermero: 'registered nurse', enfermera: 'registered nurse', enfermeria: 'nursing', enfermagem: 'nursing',
  psicologo: 'psychologist', psicologa: 'psychologist',
  fisioterapeuta: 'physical therapist', nutricionista: 'dietitian',
  farmaceutico: 'pharmacist', veterinario: 'veterinarian',
  abogado: 'lawyer', abogada: 'lawyer', advogado: 'lawyer',
  contador: 'accountant', contadora: 'accountant', contabilidad: 'accounting',
  contabilidade: 'accounting', auditor: 'auditor', auditoria: 'audit',
  docente: 'teacher', profesor: 'teacher', profesora: 'teacher', professor: 'professor',
  maestro: 'teacher', maestra: 'teacher', tutor: 'tutor',
  cocinero: 'cook', cocinera: 'cook', cocineros: 'cook', cocineras: 'cook',
  cozinheiro: 'cook', cozinheira: 'cook', cocina: 'kitchen',
  panadero: 'baker', pastelero: 'pastry chef', carnicero: 'butcher',
  mesero: 'server', mesera: 'server', camarero: 'server', camarera: 'server',
  cajero: 'cashier', cajera: 'cashier', recepcionista: 'receptionist',
  secretaria: 'secretary', secretario: 'secretary',
  vendedor: 'sales representative', vendedora: 'sales representative',
  comercial: 'sales', representante: 'representative',
  conductor: 'driver', chofer: 'driver', motorista: 'driver',
  repartidor: 'delivery driver', mensajero: 'courier',
  electricista: 'electrician', mecanico: 'mechanic', soldador: 'welder',
  carpintero: 'carpenter', fontanero: 'plumber', plomero: 'plumber',
  albanil: 'bricklayer', pintor: 'painter', operario: 'operator', operador: 'operator',
  almacenista: 'warehouse', bodeguero: 'warehouse',
  practicante: 'intern', pasante: 'intern', estagiario: 'intern',
  becario: 'intern', aprendiz: 'apprentice',
  redactor: 'copywriter', periodista: 'journalist', traductor: 'translator',
  fotografo: 'photographer', ilustrador: 'illustrator', editor: 'editor',
  reclutador: 'recruiter', recrutador: 'recruiter',
  investigador: 'researcher', cientifico: 'scientist', cientista: 'scientist',
  estadistico: 'statistician', economista: 'economist', actuario: 'actuary',
  bibliotecario: 'librarian', policia: 'police officer', bombero: 'firefighter',
  piloto: 'pilot', sommelier: 'sommelier', barista: 'barista',
  estilista: 'stylist', peluquero: 'hairdresser',

  // ── domains and qualifiers ────────────────────────────────────────────────
  ia: 'artificial intelligence', datos: 'data', dados: 'data', sistemas: 'systems', sistema: 'system',
  redes: 'network', rede: 'network', nube: 'cloud', nuvem: 'cloud',
  soporte: 'support', suporte: 'support', desarrollo: 'development',
  desenvolvimento: 'development', pruebas: 'testing', calidad: 'quality',
  qualidade: 'quality', seguridad: 'security', seguranca: 'security',
  infraestructura: 'infrastructure', infraestrutura: 'infrastructure',
  ventas: 'sales', vendas: 'sales', compras: 'procurement', logistica: 'logistics',
  almacen: 'warehouse', deposito: 'warehouse', inventario: 'inventory',
  produccion: 'production', producao: 'production', fabricacion: 'manufacturing',
  mantenimiento: 'maintenance', manutencao: 'maintenance',
  proyecto: 'project', proyectos: 'project', projeto: 'project', projetos: 'project',
  producto: 'product', produto: 'product', productos: 'product', produtos: 'product',
  obra: 'construction', obras: 'construction', construccion: 'construction',
  construcao: 'construction', edificaciones: 'building', edificios: 'building',
  interiores: 'interior', paisajismo: 'landscape', urbano: 'urban',
  urbanismo: 'urban planning', estructural: 'structural', estrutural: 'structural',
  civil: 'civil', industrial: 'industrial', ambiental: 'environmental',
  electrico: 'electrical', eletrico: 'electrical', electronica: 'electronics',
  mecanica: 'mechanical', quimico: 'chemical', quimica: 'chemical',
  aeroespacial: 'aerospace', automotriz: 'automotive', naval: 'naval',
  grafico: 'graphic', grafica: 'graphic', visual: 'visual', web: 'web',
  movil: 'mobile', movel: 'mobile', videojuegos: 'game', juegos: 'game',
  animacion: 'animation', modelado: 'modeling', modelagem: 'modeling',
  renderizado: 'rendering', ilustracion: 'illustration',
  financiero: 'financial', financeiro: 'financial', finanzas: 'finance',
  fiscal: 'tax', impuestos: 'tax', nomina: 'payroll', tesoreria: 'treasury',
  legal: 'legal', juridico: 'legal', cumplimiento: 'compliance',
  clinico: 'clinical', clinica: 'clinical', salud: 'health', saude: 'health',
  hospitalario: 'hospital', farmacia: 'pharmacy', laboratorio: 'laboratory',
  educacion: 'education', educacao: 'education', ensenanza: 'teaching',
  formacion: 'training', capacitacion: 'training', treinamento: 'training',
  investigacion: 'research', pesquisa: 'research',
  mercadeo: 'marketing', mercadotecnia: 'marketing', publicidad: 'advertising',
  comunicaciones: 'communications', comunicacao: 'communications',
  contenido: 'content', conteudo: 'content', redaccion: 'copywriting',
  cliente: 'customer', clientes: 'customer', usuario: 'user', usuarios: 'user',
  experiencia: 'experience', interfaz: 'interface',
  operaciones: 'operations', operacoes: 'operations', procesos: 'process',
  planificacion: 'planning', planejamento: 'planning',
  automatizacion: 'automation', automacao: 'automation',
  inteligencia: 'intelligence', artificial: 'artificial',
  aeronautico: 'aeronautical', energia: 'energy', solar: 'solar', eolica: 'wind',
  telecomunicaciones: 'telecommunications', instalacion: 'installation',
  vehiculares: 'vehicle', telematicos: 'telematics',
  hoteleria: 'hospitality', turismo: 'tourism', restaurante: 'restaurant',
  eventos: 'events', inmobiliario: 'real estate', inmobiliaria: 'real estate',
  agricola: 'agricultural', minero: 'mining', petrolero: 'petroleum',

};

// Tokens removed rather than translated: function words, market noise, and the
// seniority vocabulary the English cleaner does not know ("pleno" is Brazilian
// mid-level; "vaga"/"afirmativa"/"pcd" are Brazilian posting furniture;
// "hibrido"/"remoto"/"presencial" are work modes the board tracks structurally).
//
// These live in their own set, NOT in WORDS, and deliberately count as no
// evidence of anything. When "senior" and "junior" sat in WORDS they made every
// English title containing them look translated, and "Senior Forward Deployed
// Engineer - Full stack" came out reordered as a software-engineer.
const DROP = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'para', 'con',
  'sin', 'por', 'sobre', 'desde', 'hasta', 'da', 'dos', 'das', 'em', 'no', 'na',
  'nos', 'nas', 'ao', 'pleno', 'junior', 'senior', 'semi', 'ssr', 'jr', 'sr',
  'remoto', 'remota', 'hibrido', 'hibrida', 'presencial', 'vaga', 'vagas',
  'afirmativa', 'afirmativas', 'pcd', 'exclusiva', 'foco', 'anos', 'ano',
  'tiempo', 'completo', 'parcial', 'temporal', 'indefinido', 'practicas',
  'empresa', 'grupo', 'equipo', 'nuevo', 'nueva', 'urgente', 'inmediata',
]);

// Romance words spelled exactly as their English translation. Translating them is
// correct; treating them as PROOF the title is Romance is not — "Civil Engineer"
// and "Legal Counsel" are English.
const ALSO_ENGLISH = new Set([
  'civil', 'industrial', 'legal', 'fiscal', 'visual', 'web', 'solar', 'naval',
  'editor', 'tutor', 'barista', 'sommelier', 'auditor', 'professor', 'artificial',
]);

// English heads produced by the table above. The reorder pass moves one of these
// to the end of the title; a translation that yields none of them is discarded
// rather than guessed at.
const HEADS = new Set([
  'engineer', 'developer', 'programmer', 'analyst', 'manager', 'head', 'supervisor',
  'coordinator', 'specialist', 'consultant', 'advisor', 'executive', 'technician',
  'assistant', 'administrator', 'architect', 'designer', 'physician', 'nurse',
  'psychologist', 'pharmacist', 'veterinarian', 'lawyer', 'accountant', 'auditor',
  'teacher', 'professor', 'tutor', 'cook', 'baker', 'butcher', 'server', 'cashier',
  'receptionist', 'secretary', 'representative', 'driver', 'courier', 'electrician',
  'mechanic', 'welder', 'carpenter', 'plumber', 'bricklayer', 'painter', 'operator',
  'intern', 'apprentice', 'copywriter', 'journalist', 'translator', 'photographer',
  'illustrator', 'editor', 'recruiter', 'researcher', 'scientist', 'statistician',
  'economist', 'actuary', 'librarian', 'pilot', 'sommelier', 'barista', 'stylist',
  'hairdresser', 'radiologist', 'cardiologist', 'pediatrician', 'chef',
]);

const PHRASE_RE = PHRASES.map(([es, en]) => [new RegExp(`(?:^|\\s)${es}(?=\\s|$)`, 'g'), ` ${en}`]);

// Gender/number markers glued to titles across these markets: "Ingeniero/a",
// "Cocinero/as", "Enfermera M/F", "Analista (a)". Stripped before tokenizing so
// one posting does not fork into four spellings.
const GENDER = [
  [/\b([a-z]{3,})\/[ao]s?\b/g, '$1'],       // ingeniero/a, cocinero/as
  [/\b[mfh]\s*\/\s*[mfhd](\s*\/\s*[mfhd])?\b/g, ' '],  // m/f, h/f, f/m/d
  [/\s*\(\s*[ao]s?\s*\)/g, ''],             // analista (a), tecnico(as)
];

/** Translate a Spanish or Portuguese job title into English word order.
 *
 *  @returns {string|null} an English title, or null when the input showed no
 *  recognisable Romance occupation — the caller must not guess from a null. */
export function translateRomance(rawTitle) {
  let t = foldAccents(String(rawTitle).toLowerCase());
  for (const [re, rep] of GENDER) t = t.replace(re, rep);
  t = t.replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9+#\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return null;

  let phraseHit = false;
  for (const [re, en] of PHRASE_RE) {
    const after = t.replace(re, en);
    if (after !== t) { phraseHit = true; t = after; }
  }

  // Each output word carries whether it came from a Romance source word. That
  // provenance — not a token count — is what licenses the reorder below.
  let evidence = phraseHit;
  const out = [];
  for (const tok of t.split(/\s+/)) {
    if (!tok || DROP.has(tok)) continue;
    if (Object.hasOwn(WORDS, tok)) {
      const en = WORDS[tok];
      const romance = Boolean(en) && en !== tok && !ALSO_ENGLISH.has(tok);
      if (romance) evidence = true;
      for (const w of en.split(' ')) if (w) out.push({ w, romance });
    } else {
      out.push({ w: tok, romance: false });   // English, a brand, or unknown
    }
  }
  if (!evidence || !out.length) return null;

  // THE GUARD. The head noun must itself be Romance-derived (or the whole title
  // must have resolved through a curated phrase). Without this, any English title
  // holding an English head noun — "Senior Forward Deployed Engineer", "Junior
  // Designer - Growth and Marketing" — got reordered into a false match, because
  // a single incidental token elsewhere was enough to look like a translation.
  // The FIRST head, not the last. Romance is head-initial, so the leading noun is
  // the job and everything after it qualifies: "consultora de medicos" is a
  // consultant FOR physicians. Taking the last head made it a physician.
  const hi = out.findIndex((o) => HEADS.has(o.w));
  if (hi === -1) return phraseHit ? out.map((o) => o.w).join(' ').trim() || null : null;
  if (!out[hi].romance && !phraseHit) return null;

  // Reorder: Romance is head-initial, English head-final. Moving the head to the
  // end is what turns "engineer of software" into "software engineer". Titles that
  // are already head-final (a phrase target) survive unchanged.
  const rest = out.filter((_, i) => i !== hi).map((o) => o.w);
  return [...rest, out[hi].w].join(' ').replace(/\s+/g, ' ').trim() || null;
}
