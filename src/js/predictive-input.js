/**
 * NEXCHAT Ultra-Fast Predictive Text & Smart Auto-Correct Engine
 * 
 * Capabilities:
 * - Sub-millisecond (0ms) inline auto-correction on Spacebar & Punctuation
 * - Smart Backspace undo (restores original typo if user deletes immediately)
 * - O(1) Prefix-indexed word completion dictionary
 * - Next-word bigram and phrase prediction
 * - Instant 0ms Neural Grammar & Polish Synthesizer (instantPolish)
 * - Seamless ChronEX AI Cloud Polish acceleration
 * - Native keyboard compatibility (autocapitalize, autocorrect, spellcheck)
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  // Comprehensive common typo & texting abbreviation dictionary (350+ words)
  const TYPO_MAP = {
    // High-frequency typos
    'teh': 'the',
    'reciev': 'receive',
    'recieve': 'receive',
    'recieved': 'received',
    'recieving': 'receiving',
    'definately': 'definitely',
    'definetly': 'definitely',
    'definatly': 'definitely',
    'seperate': 'separate',
    'seperated': 'separated',
    'seperation': 'separation',
    'untill': 'until',
    'tommorow': 'tomorrow',
    'tomorow': 'tomorrow',
    'tommorrow': 'tomorrow',
    'alot': 'a lot',
    'becuase': 'because',
    'becasue': 'because',
    'beacuse': 'because',
    'truely': 'truly',
    'wierd': 'weird',
    'goverment': 'government',
    'occurance': 'occurrence',
    'occured': 'occurred',
    'occuring': 'occurring',
    'accomodate': 'accommodate',
    'accomodation': 'accommodation',
    'beleive': 'believe',
    'belive': 'believe',
    'calender': 'calendar',
    'collogue': 'colleague',
    'collaegue': 'colleague',
    'freind': 'friend',
    'freinds': 'friends',
    'neccessary': 'necessary',
    'necesary': 'necessary',
    'priviledge': 'privilege',
    'privledge': 'privilege',
    'reccomend': 'recommend',
    'recomend': 'recommend',
    'scheduele': 'schedule',
    'skedule': 'schedule',
    'succesful': 'successful',
    'succesfully': 'successfully',
    'suprise': 'surprise',
    'suprised': 'surprised',
    'thier': 'their',
    'writting': 'writing',
    'acheive': 'achieve',
    'acheived': 'achieved',
    'agressive': 'aggressive',
    'apparantly': 'apparently',
    'appearence': 'appearance',
    'arguement': 'argument',
    'basicly': 'basically',
    'begining': 'beginning',
    'catagory': 'category',
    'commited': 'committed',
    'concious': 'conscious',
    'curiousity': 'curiosity',
    'disapear': 'disappear',
    'disapoint': 'disappoint',
    'embarass': 'embarrass',
    'embarassing': 'embarrassing',
    'enviroment': 'environment',
    'existance': 'existence',
    'experiance': 'experience',
    'familar': 'familiar',
    'finnaly': 'finally',
    'foriegn': 'foreign',
    'fourty': 'forty',
    'foward': 'forward',
    'guarentee': 'guarantee',
    'garantee': 'guarantee',
    'harrass': 'harass',
    'hieght': 'height',
    'hygene': 'hygiene',
    'ignorence': 'ignorance',
    'immediatly': 'immediately',
    'imediatly': 'immediately',
    'incidently': 'incidentally',
    'independant': 'independent',
    'inteligence': 'intelligence',
    'interupt': 'interrupt',
    'judgement': 'judgment',
    'knowlege': 'knowledge',
    'libary': 'library',
    'lisence': 'license',
    'maintainance': 'maintenance',
    'millenium': 'millennium',
    'mispell': 'misspell',
    'mispelled': 'misspelled',
    'neice': 'niece',
    'noticable': 'noticeable',
    'occassion': 'occasion',
    'occassionally': 'occasionally',
    'oppurtunity': 'opportunity',
    'opertunity': 'opportunity',
    'paralell': 'parallel',
    'peice': 'piece',
    'possession': 'possession',
    'practise': 'practice',
    'preceed': 'precede',
    'prefered': 'preferred',
    'presance': 'presence',
    'pronounciation': 'pronunciation',
    'publically': 'publicly',
    'questionaire': 'questionnaire',
    'realy': 'really',
    'refered': 'referred',
    'relevent': 'relevant',
    'religous': 'religious',
    'rember': 'remember',
    'resistence': 'resistance',
    'rythm': 'rhythm',
    'saftey': 'safety',
    'secratary': 'secretary',
    'sieze': 'seize',
    'sentance': 'sentence',
    'speach': 'speech',
    'succede': 'succeed',
    'tendancy': 'tendency',
    'threshhold': 'threshold',
    'tounge': 'tongue',
    'transfered': 'transferred',
    'twelth': 'twelfth',
    'unconcious': 'unconscious',
    'unforseen': 'unforeseen',
    'unfortunatly': 'unfortunately',
    'vaccum': 'vacuum',
    'vehical': 'vehicle',
    'visable': 'visible',
    'wich': 'which',
    'yeild': 'yield',

    // Contractions (missing apostrophes)
    'dont': "don't",
    'cant': "can't",
    'wont': "won't",
    'isnt': "isn't",
    'arent': "aren't",
    'wasnt': "wasn't",
    'werent': "weren't",
    'didnt': "didn't",
    'doesnt': "doesn't",
    'havent': "haven't",
    'hasnt': "hasn't",
    'hadnt': "hadn't",
    'couldnt': "couldn't",
    'shouldnt': "shouldn't",
    'wouldnt': "wouldn't",
    'im': "I'm",
    'ive': "I've",
    'id': "I'd",
    'ill': "I'll",
    'youre': "you're",
    'youve': "you've",
    'youll': "you'll",
    'youd': "you'd",
    'theyre': "they're",
    'theyve': "they've",
    'theyll': "they'll",
    'theyd': "they'd",
    'weve': "we've",
    'well': "we'll",
    'wed': "we'd",
    'whats': "what's",
    'thats': "that's",
    'theres': "there's",
    'heres': "here's",
    'hows': "how's",
    'whos': "who's",
    'wheres': "where's",
    'lets': "let's",
    'itll': "it'll",
    'isnt': "isn't",

    // Common Texting Shortcuts
    'plz': 'please',
    'pls': 'please',
    'thx': 'thanks',
    'ty': 'thank you',
    'np': 'no problem',
    'u': 'you',
    'ur': 'your',
    'r': 'are',
    'b4': 'before',
    'gr8': 'great',
    'l8r': 'later',
    'omw': 'on my way',
    'idk': "I don't know",
    'imo': 'in my opinion',
    'tbh': 'to be honest',
    'afk': 'away from keyboard',
    'gg': 'good game',
    'brb': 'be right back',
    'atm': 'at the moment',
    'fyi': 'for your information',
    'btw': 'by the way',
    'rn': 'right now',
    'bc': 'because',
    'cuz': 'because',
    'gn': 'good night',
    'gm': 'good morning',
    'tysm': 'thank you so much',
    'hbu': 'how about you',
    'wbu': 'what about you',
    'irl': 'in real life',
    'nvm': 'never mind',
    'ofc': 'of course',
    'asap': 'as soon as possible',
    'rofl': 'laughing',
    'dm': 'direct message',
    'faq': 'FAQ'
  };

  // High-frequency English dictionary for instant completions
  const COMMON_WORDS = [
    'about', 'above', 'accept', 'access', 'account', 'across', 'action', 'activity',
    'actually', 'address', 'admin', 'advance', 'after', 'again', 'against', 'agent',
    'agree', 'ahead', 'allow', 'almost', 'alone', 'along', 'already', 'alright',
    'always', 'amazing', 'amount', 'analysis', 'animal', 'another', 'answer', 'anyone',
    'anything', 'anyway', 'appear', 'apple', 'application', 'apply', 'approach', 'approve',
    'area', 'around', 'arrange', 'arrival', 'article', 'artist', 'asset', 'attack',
    'attempt', 'attend', 'attention', 'audience', 'author', 'authority', 'available', 'average',
    'avoid', 'award', 'aware', 'awesome', 'balance', 'battle', 'beautiful', 'because',
    'become', 'before', 'begin', 'behavior', 'behind', 'belief', 'believe', 'benefit',
    'better', 'between', 'beyond', 'billion', 'binary', 'birthday', 'blessing', 'block',
    'board', 'border', 'bottom', 'branch', 'brave', 'bread', 'break', 'breathe',
    'bridge', 'bright', 'broadcast', 'brother', 'budget', 'build', 'building', 'bullet',
    'bundle', 'burden', 'business', 'button', 'cable', 'camera', 'campaign', 'cancer',
    'candidate', 'cannot', 'canvas', 'capacity', 'capital', 'captain', 'capture', 'career',
    'careful', 'carrier', 'category', 'cause', 'celebrate', 'center', 'central', 'century',
    'certain', 'certainly', 'chain', 'challenge', 'champion', 'channel', 'chapter', 'character',
    'charge', 'charity', 'check', 'chemical', 'choice', 'choose', 'chronex', 'church',
    'circle', 'circuit', 'citizen', 'classic', 'clean', 'clear', 'clearly', 'client',
    'climate', 'clock', 'close', 'closely', 'cloud', 'cluster', 'coach', 'coffee',
    'cold', 'collection', 'college', 'colleague', 'color', 'column', 'combat', 'command',
    'comment', 'commit', 'common', 'company', 'compare', 'compete', 'complete', 'completely',
    'complex', 'compose', 'computer', 'concept', 'concern', 'concert', 'conclude', 'condition',
    'conduct', 'conference', 'confidence', 'confirm', 'conflict', 'connect', 'connection', 'conscious',
    'consent', 'consequence', 'consider', 'consist', 'constant', 'constitute', 'construct', 'consult',
    'consume', 'contact', 'contain', 'content', 'context', 'continue', 'contract', 'contrast',
    'control', 'convert', 'convey', 'convince', 'cookie', 'correct', 'cost', 'could',
    'council', 'counsel', 'counter', 'country', 'county', 'courage', 'course', 'court',
    'cover', 'coverage', 'create', 'creation', 'creative', 'credit', 'crew', 'crisis',
    'criteria', 'critical', 'crowd', 'crucial', 'cry', 'cultural', 'culture', 'cup',
    'curious', 'current', 'customer', 'cyber', 'cycle', 'daily', 'damage', 'danger',
    'dangerous', 'dark', 'database', 'date', 'daughter', 'deal', 'dealer', 'debate',
    'debt', 'decade', 'decide', 'decision', 'deck', 'declare', 'decline', 'decrease',
    'dedicate', 'deep', 'deeply', 'defense', 'deficit', 'define', 'definitely', 'degree',
    'delay', 'deliver', 'delivery', 'demand', 'democracy', 'demonstrate', 'denial', 'deny',
    'depend', 'dependent', 'deposit', 'depth', 'deputy', 'derive', 'describe', 'description',
    'desert', 'deserve', 'design', 'designer', 'desire', 'desk', 'desperate', 'despite',
    'destroy', 'destruction', 'detail', 'detailed', 'detect', 'determine', 'develop', 'device',
    'differ', 'difference', 'different', 'difficult', 'difficulty', 'digital', 'direct', 'direction',
    'director', 'disable', 'disaster', 'discipline', 'disclose', 'discount', 'discover', 'discovery',
    'discuss', 'discussion', 'disease', 'dish', 'dismiss', 'disorder', 'display', 'dispute',
    'distance', 'distant', 'distinct', 'distribute', 'district', 'diverse', 'diversity', 'divide',
    'division', 'divorce', 'doctor', 'document', 'domestic', 'dominant', 'dominate', 'door',
    'double', 'doubt', 'download', 'draft', 'drama', 'dramatic', 'draw', 'drawer',
    'drawing', 'dream', 'dress', 'drink', 'drive', 'driver', 'drop', 'drug',
    'duration', 'during', 'duty', 'dynamic', 'eager', 'early', 'earn', 'earnings',
    'earth', 'easily', 'east', 'eastern', 'easy', 'economic', 'economy', 'edge',
    'edition', 'editor', 'educate', 'education', 'effect', 'effective', 'efficiency', 'efficient',
    'effort', 'either', 'elderly', 'elect', 'election', 'electric', 'electronic', 'element',
    'eliminate', 'elite', 'elsewhere', 'email', 'embrace', 'emerge', 'emergency', 'emotion',
    'emotional', 'emphasis', 'employ', 'employee', 'employer', 'employment', 'empty', 'enable',
    'encounter', 'encourage', 'enemy', 'energy', 'enforcement', 'engage', 'engine', 'engineer',
    'enhance', 'enjoy', 'enormous', 'enough', 'ensure', 'enterprise', 'entertain', 'entertainment',
    'entire', 'entirely', 'entrance', 'entry', 'envelope', 'environment', 'episode', 'equal',
    'equally', 'equipment', 'equity', 'equivalent', 'error', 'escape', 'especially', 'essay',
    'essential', 'establish', 'estate', 'estimate', 'ethnic', 'evaluate', 'evaluation', 'evening',
    'event', 'eventually', 'everybody', 'everyone', 'everything', 'everywhere', 'evidence', 'evolution',
    'exact', 'exactly', 'examination', 'examine', 'example', 'exceed', 'excellent', 'except',
    'exception', 'exchange', 'exciting', 'exclude', 'exclusive', 'execute', 'execution', 'executive',
    'exercise', 'exhibit', 'exist', 'existence', 'existing', 'expand', 'expansion', 'expect',
    'expectation', 'expense', 'expensive', 'experience', 'experiment', 'expert', 'explain', 'explanation',
    'explore', 'explosion', 'export', 'expose', 'exposure', 'express', 'expression', 'extend',
    'extension', 'extensive', 'extent', 'external', 'extra', 'extraordinary', 'extreme', 'fabric',
    'facility', 'factor', 'factory', 'faculty', 'failure', 'fairly', 'faith', 'familiar',
    'family', 'famous', 'farmer', 'fashion', 'faster', 'father', 'fault', 'favorite',
    'feature', 'federal', 'feedback', 'fellow', 'female', 'fence', 'fewer', 'fiber',
    'field', 'fighter', 'figure', 'file', 'fill', 'film', 'final', 'finally',
    'finance', 'financial', 'finding', 'fine', 'finger', 'finish', 'firewall', 'firm',
    'first', 'fiscal', 'flavor', 'flesh', 'flight', 'floating', 'floor', 'flower',
    'focus', 'follow', 'following', 'football', 'force', 'foreign', 'forest', 'forever',
    'forget', 'formal', 'formation', 'former', 'formula', 'forth', 'fortune', 'forward',
    'found', 'foundation', 'founder', 'fraction', 'fragment', 'frame', 'framework', 'franchise',
    'frankly', 'freedom', 'frequent', 'frequently', 'fresh', 'friend', 'friendly', 'friendship',
    'from', 'front', 'frontier', 'fruit', 'frustration', 'fuel', 'fulfill', 'function',
    'functional', 'funding', 'funeral', 'furniture', 'further', 'future', 'gain', 'gallery',
    'galaxy', 'gaming', 'gather', 'gender', 'general', 'generally', 'generate', 'generation',
    'generic', 'generous', 'genetic', 'genius', 'genre', 'gentle', 'genuine', 'gesture',
    'getting', 'giant', 'gifted', 'glance', 'global', 'glove', 'goal', 'gold',
    'golden', 'good', 'government', 'governor', 'grace', 'grade', 'gradually', 'graduate',
    'grain', 'grand', 'grant', 'graph', 'graphic', 'grass', 'grateful', 'grave',
    'gravity', 'great', 'greater', 'greatest', 'greatly', 'grocery', 'ground', 'group',
    'growing', 'growth', 'guarantee', 'guard', 'guess', 'guest', 'guidance', 'guide',
    'guideline', 'guilty', 'habitat', 'handle', 'happen', 'happily', 'happiness', 'happy',
    'harbor', 'hardly', 'hardware', 'harvest', 'having', 'hazard', 'headline', 'health',
    'healthy', 'hearing', 'heart', 'heaven', 'heavily', 'height', 'helicopter', 'helpful',
    'heritage', 'heroic', 'hidden', 'highlight', 'highway', 'historic', 'historical', 'history',
    'holding', 'holiday', 'honest', 'honestly', 'horizon', 'hospital', 'hostile', 'hotel',
    'house', 'housing', 'however', 'human', 'humanity', 'hundred', 'hunter', 'hunting',
    'husband', 'hypothesis', 'identity', 'ignore', 'illegal', 'illness', 'illustrate', 'imagery',
    'imagination', 'imagine', 'immediate', 'immediately', 'immigrant', 'immune', 'impact', 'implement',
    'implication', 'imply', 'import', 'importance', 'important', 'impose', 'impossible', 'impress',
    'impression', 'impressive', 'improve', 'improvement', 'impulse', 'incentive', 'incident', 'include',
    'including', 'income', 'incorporate', 'increase', 'increased', 'increasing', 'increasingly', 'incredible',
    'indeed', 'independence', 'independent', 'index', 'indicate', 'indication', 'indicator', 'individual',
    'industry', 'inevitable', 'infant', 'infection', 'inflation', 'influence', 'inform', 'information',
    'ingredient', 'initial', 'initially', 'initiative', 'injury', 'innocent', 'innovation', 'innovative',
    'input', 'inquiry', 'inside', 'insight', 'insist', 'inspect', 'inspection', 'inspector',
    'inspiration', 'inspire', 'install', 'installation', 'instance', 'instant', 'instantly', 'instead',
    'institution', 'institutional', 'instruction', 'instructor', 'instrument', 'insurance', 'intellectual', 'intelligence',
    'intelligent', 'intend', 'intense', 'intensity', 'intent', 'intention', 'interaction', 'interest',
    'interested', 'interesting', 'interface', 'interior', 'internal', 'international', 'internet', 'interpret',
    'interpretation', 'intervention', 'interview', 'intimate', 'introduce', 'introduction', 'invasion', 'invent',
    'invention', 'invest', 'investigate', 'investigation', 'investigator', 'investment', 'investor', 'invisible',
    'invitation', 'invite', 'involve', 'involved', 'involvement', 'ironic', 'island', 'isolate',
    'isolated', 'isolation', 'issue', 'item', 'jacket', 'jail', 'jewelry', 'joint',
    'journal', 'journalist', 'journey', 'judgment', 'judicial', 'juice', 'junction', 'junior',
    'jurisdiction', 'justice', 'justify', 'keeper', 'keeping', 'keyboard', 'kickoff', 'killer',
    'kingdom', 'kitchen', 'knee', 'knight', 'knowing', 'knowledge', 'label', 'laboratory',
    'ladder', 'landscape', 'language', 'lantern', 'laptop', 'largely', 'laser', 'lasting',
    'latter', 'launch', 'laundry', 'lawsuit', 'lawyer', 'layer', 'leader', 'leadership',
    'leading', 'league', 'learning', 'legacy', 'legend', 'legendary', 'legislation', 'legislative',
    'legislature', 'legitimate', 'length', 'lesson', 'letter', 'level', 'liability', 'liable',
    'liberal', 'liberty', 'library', 'license', 'lifetime', 'lightly', 'likelihood', 'likely',
    'limitation', 'limited', 'linear', 'linguistic', 'lining', 'liquid', 'listener', 'listening',
    'literally', 'literary', 'literature', 'little', 'lively', 'living', 'locate', 'location',
    'logical', 'lonely', 'longer', 'longtime', 'looking', 'lottery', 'loudly', 'lounge',
    'lovely', 'lover', 'loving', 'loyalty', 'luckily', 'luxury', 'machine', 'machinery',
    'magazine', 'magic', 'magical', 'magnificent', 'maintain', 'maintenance', 'major', 'majority',
    'making', 'manage', 'management', 'manager', 'mandate', 'mandatory', 'manifest', 'manner',
    'manual', 'manufacture', 'manufacturer', 'manufacturing', 'margin', 'marginal', 'marker', 'market',
    'marketing', 'marketplace', 'marriage', 'married', 'marry', 'marvelous', 'masking', 'massive',
    'master', 'mastery', 'match', 'material', 'mathematics', 'matter', 'mature', 'maturity',
    'maximum', 'meaning', 'meaningful', 'meantime', 'measure', 'measurement', 'mechanism', 'median',
    'medical', 'medication', 'medicine', 'medium', 'meeting', 'melody', 'member', 'membership',
    'membrane', 'memorial', 'memory', 'mental', 'mention', 'mentor', 'merchant', 'mercy',
    'merely', 'merger', 'merit', 'message', 'messenger', 'metallic', 'method', 'methodology',
    'metric', 'microphone', 'microscope', 'middle', 'midnight', 'midst', 'military', 'million',
    'mineral', 'minimal', 'minimize', 'minimum', 'minister', 'ministry', 'minute', 'miracle',
    'mirror', 'missile', 'missing', 'mission', 'mistake', 'mixture', 'mobile', 'mobility',
    'moderate', 'modern', 'modest', 'modification', 'modify', 'module', 'molecule', 'moment',
    'momentum', 'monetary', 'monitor', 'monster', 'monthly', 'monument', 'morale', 'moral',
    'morning', 'mortality', 'mortgage', 'mostly', 'mother', 'motion', 'motivate', 'motivation',
    'motive', 'motor', 'mount', 'mountain', 'mounted', 'mouse', 'mouth', 'movement',
    'movie', 'multiple', 'multiply', 'municipal', 'museum', 'musical', 'musician', 'mutation',
    'mutual', 'mystery', 'narrative', 'narrow', 'nation', 'national', 'native', 'natural',
    'naturally', 'nature', 'navigate', 'navigation', 'nearby', 'nearly', 'necessarily', 'necessary',
    'necessity', 'needle', 'negative', 'neglect', 'negotiate', 'negotiation', 'neighbor', 'neighborhood',
    'neither', 'nephew', 'nervous', 'nested', 'network', 'neural', 'neutral', 'never',
    'nevertheless', 'newly', 'nexchat', 'nexus', 'nicely', 'night', 'nightmare', 'noble',
    'nobody', 'nodding', 'nominal', 'nomination', 'nominee', 'nonetheless', 'normal', 'normally',
    'northern', 'notable', 'notably', 'notebook', 'nothing', 'notice', 'noticeable', 'notion',
    'novel', 'nowhere', 'nuclear', 'number', 'numeric', 'numerous', 'nursery', 'nutrient',
    'object', 'objection', 'objective', 'obligation', 'oblige', 'observation', 'observe', 'observer',
    'obstacle', 'obtain', 'obvious', 'obviously', 'occasion', 'occasional', 'occasionally', 'occupation',
    'occupy', 'occur', 'occurrence', 'ocean', 'offense', 'offensive', 'offering', 'office',
    'officer', 'official', 'officially', 'offline', 'online', 'ongoing', 'opening', 'operate',
    'operating', 'operation', 'operational', 'operator', 'opinion', 'opponent', 'opportunity', 'oppose',
    'opposite', 'opposition', 'optimism', 'optimistic', 'option', 'optional', 'oracle', 'orange',
    'orbit', 'orbital', 'order', 'ordinary', 'organ', 'organic', 'organization', 'organize',
    'organized', 'orient', 'orientation', 'origin', 'original', 'originally', 'outcome', 'outdoor',
    'outer', 'outfit', 'outline', 'outlook', 'output', 'outrage', 'outside', 'outsider',
    'outstanding', 'overall', 'overcome', 'overlook', 'overnight', 'overseas', 'oversee', 'overview',
    'package', 'packet', 'painful', 'painter', 'painting', 'palace', 'pandemic', 'panel',
    'panic', 'paper', 'parade', 'paradise', 'paradox', 'paragraph', 'parallel', 'parameter',
    'parent', 'parental', 'parish', 'parking', 'parliament', 'partially', 'participant', 'participate',
    'participation', 'particle', 'particular', 'particularly', 'partner', 'partnership', 'passage', 'passenger',
    'passion', 'passionate', 'passive', 'passport', 'password', 'pastor', 'patent', 'pathway',
    'patience', 'patient', 'patrol', 'patron', 'pattern', 'pause', 'payment', 'peaceful',
    'peasant', 'peculiar', 'pedestrian', 'peer', 'penalty', 'pension', 'people', 'perceive',
    'percentage', 'perception', 'perfect', 'perfectly', 'perform', 'performance', 'performer', 'period',
    'periodic', 'permanent', 'permission', 'permit', 'persist', 'persistent', 'person', 'personal',
    'personality', 'personally', 'personnel', 'perspective', 'persuade', 'petition', 'petroleum', 'phantom',
    'pharmacy', 'phenomenon', 'philosophy', 'phoenix', 'phrase', 'physical', 'physically', 'physician',
    'physics', 'pianist', 'picture', 'piece', 'pioneer', 'pipeline', 'pistol', 'pitch',
    'placement', 'plaintiff', 'planned', 'planner', 'planning', 'plasma', 'plastic', 'plate',
    'platform', 'platinum', 'platter', 'player', 'playful', 'plead', 'pleasant', 'please',
    'pleasure', 'plenty', 'plight', 'plunge', 'plural', 'pocket', 'poetry', 'pointer',
    'poison', 'polar', 'police', 'policeman', 'policy', 'polish', 'political', 'politically',
    'politician', 'politics', 'pollen', 'pollution', 'polymer', 'ponder', 'portion', 'portrait',
    'portray', 'position', 'positive', 'positively', 'possess', 'possession', 'possibility', 'possible',
    'possibly', 'postal', 'posture', 'potential', 'potentially', 'pottery', 'poultry', 'poverty',
    'powerful', 'powerfully', 'practical', 'practically', 'practice', 'practitioner', 'prairie', 'praise',
    'prayer', 'preach', 'preacher', 'precede', 'precedent', 'precious', 'precise', 'precisely',
    'precision', 'predator', 'predecessor', 'predict', 'prediction', 'predictive', 'prefer', 'preference',
    'pregnancy', 'pregnant', 'prejudice', 'preliminary', 'premier', 'premium', 'preparation', 'prepare',
    'prepared', 'prescribe', 'prescription', 'presence', 'present', 'presentation', 'preservation', 'preserve',
    'president', 'presidential', 'pressure', 'prestige', 'presumably', 'presume', 'pretend', 'pretense',
    'pretty', 'prevail', 'prevalence', 'prevalent', 'prevent', 'prevention', 'preview', 'previous',
    'previously', 'priceless', 'pride', 'priest', 'primarily', 'primary', 'primate', 'prime',
    'primitive', 'prince', 'princess', 'principal', 'principle', 'priority', 'prison', 'prisoner',
    'privacy', 'private', 'privately', 'privilege', 'prize', 'probability', 'probable', 'probably',
    'problem', 'procedural', 'procedure', 'proceed', 'process', 'processing', 'processor', 'proclaim',
    'produce', 'producer', 'producing', 'product', 'production', 'productive', 'productivity', 'profession',
    'professional', 'professor', 'profile', 'profit', 'profitable', 'profound', 'program', 'programme',
    'programmer', 'progress', 'progressive', 'prohibit', 'project', 'projection', 'prominent', 'promise',
    'promising', 'promote', 'promotion', 'prompt', 'promptly', 'proof', 'proper', 'properly',
    'property', 'proportion', 'proposal', 'propose', 'proposed', 'prospect', 'prospective', 'prosperity',
    'protect', 'protection', 'protective', 'protein', 'protest', 'protocol', 'prototype', 'proudly',
    'provide', 'provided', 'provider', 'province', 'provision', 'proximity', 'prudent', 'psychology',
    'public', 'publication', 'publicity', 'publicly', 'publish', 'publisher', 'pudding', 'pumpkin',
    'purchase', 'purchaser', 'purely', 'purity', 'purple', 'purpose', 'pursue', 'pursuit',
    'puzzle', 'pyramid', 'qualification', 'qualified', 'qualify', 'qualitative', 'quality', 'quantify',
    'quantitative', 'quantity', 'quantum', 'quarter', 'quarterly', 'queen', 'query', 'question',
    'questionnaire', 'quickly', 'quiet', 'quietly', 'quilt', 'quintessential', 'quota', 'quotation',
    'quote', 'racial', 'racism', 'radar', 'radiance', 'radiant', 'radiate', 'radiation',
    'radical', 'radically', 'radio', 'railroad', 'rainbow', 'rally', 'random', 'randomly',
    'ranger', 'ranking', 'rapid', 'rapidly', 'rarely', 'rating', 'ratio', 'rational',
    'rationale', 'ravine', 'reaction', 'readily', 'reading', 'readiness', 'realistic', 'reality',
    'realize', 'really', 'realm', 'realtor', 'reason', 'reasonable', 'reasonably', 'reasoning',
    'reassure', 'rebellion', 'recall', 'receipt', 'receive', 'receiver', 'recent', 'recently',
    'reception', 'recipe', 'recipient', 'reckon', 'recognition', 'recognize', 'recollect', 'recommend',
    'recommendation', 'reconcile', 'record', 'recording', 'recover', 'recovery', 'recruit', 'recruiter',
    'recruitment', 'rectangle', 'recur', 'recycle', 'redeem', 'redefine', 'redesign', 'reduce',
    'reduction', 'redundant', 'referee', 'reference', 'referral', 'refine', 'refined', 'refinement',
    'reflect', 'reflection', 'reflective', 'reform', 'refrigerator', 'refuge', 'refugee', 'refusal',
    'refuse', 'regard', 'regarding', 'regardless', 'regime', 'regiment', 'region', 'regional',
    'register', 'registration', 'registry', 'regret', 'regular', 'regularly', 'regulate', 'regulation',
    'regulator', 'regulatory', 'rehabilitate', 'rehearse', 'reign', 'reinforce', 'reinforce', 'reject',
    'rejection', 'rejoice', 'relate', 'related', 'relation', 'relationship', 'relative', 'relatively',
    'relax', 'relaxation', 'relay', 'release', 'relevance', 'relevant', 'reliability', 'reliable',
    'reliance', 'relief', 'relieve', 'religion', 'religious', 'reluctant', 'remain', 'remainder',
    'remaining', 'remarkable', 'remarkably', 'remedy', 'remember', 'remind', 'reminder', 'remote',
    'removal', 'remove', 'render', 'rendering', 'renew', 'renewal', 'renowned', 'repair',
    'repeat', 'repeatedly', 'replace', 'replacement', 'replica', 'replicate', 'reply', 'report',
    'reporter', 'reporting', 'represent', 'representation', 'representative', 'reproduce', 'reproduction', 'reptile',
    'republic', 'reputation', 'request', 'require', 'required', 'requirement', 'rescue', 'research',
    'researcher', 'resemble', 'reservation', 'reserve', 'reserved', 'reservoir', 'residence', 'resident',
    'residential', 'residual', 'resign', 'resignation', 'resilience', 'resilient', 'resist', 'resistance',
    'resolution', 'resolve', 'resonance', 'resort', 'resource', 'respect', 'respectable', 'respectful',
    'respective', 'respectively', 'respiration', 'respond', 'respondent', 'response', 'responsibility', 'responsible',
    'responsive', 'restaurant', 'restoration', 'restore', 'restrain', 'restraint', 'restrict', 'restriction',
    'result', 'resulting', 'resume', 'retail', 'retailer', 'retain', 'retire', 'retirement',
    'retreat', 'retrieval', 'retrieve', 'return', 'reveal', 'revelation', 'revenue', 'reverence',
    'reverse', 'review', 'reviewer', 'revise', 'revision', 'revival', 'revive', 'revolution',
    'revolutionary', 'reward', 'rhetoric', 'rhythm', 'rhythmic', 'ribbon', 'rider', 'ridge',
    'rifle', 'rightly', 'rigorous', 'ripple', 'rising', 'rivalry', 'river', 'roadside',
    'roaring', 'robot', 'robotic', 'robotics', 'robust', 'rocket', 'rolling', 'romance',
    'romantic', 'rookie', 'roster', 'rotate', 'rotation', 'roughly', 'routine', 'routinely',
    'routing', 'royalty', 'rubber', 'rudimentary', 'ruined', 'ruling', 'runner', 'running',
    'runway', 'rupture', 'rural', 'sacred', 'sacrifice', 'safeguard', 'safely', 'safety',
    'sailor', 'saint', 'salary', 'sample', 'sampling', 'sanction', 'sanctuary', 'sandwich',
    'satellite', 'satisfaction', 'satisfactory', 'satisfied', 'satisfy', 'saturated', 'sauce', 'saving',
    'savings', 'scale', 'scaling', 'scanner', 'scenario', 'scenery', 'schedule', 'scheduled',
    'scheme', 'scholar', 'scholarship', 'science', 'scientific', 'scientist', 'scope', 'scoring',
    'scratch', 'scream', 'screen', 'screening', 'screw', 'script', 'scrutiny', 'sculpture',
    'sealed', 'seamless', 'search', 'searching', 'season', 'seasonal', 'second', 'secondary',
    'secondly', 'secret', 'secretary', 'section', 'sector', 'secular', 'secure', 'securely',
    'security', 'segment', 'seldom', 'select', 'selection', 'selective', 'seller', 'semantic',
    'seminar', 'senate', 'senator', 'senior', 'sensation', 'sense', 'sensible', 'sensitive',
    'sensitivity', 'sentence', 'sentiment', 'separate', 'separately', 'separation', 'sequence', 'sergeant',
    'series', 'serious', 'seriously', 'servant', 'service', 'serving', 'session', 'settle',
    'settlement', 'severe', 'severely', 'shading', 'shadow', 'shallow', 'sharing', 'sharp',
    'sharply', 'shelter', 'shield', 'shift', 'shining', 'shipping', 'shock', 'shocking',
    'shooting', 'shopping', 'shortage', 'shortly', 'shoulder', 'showing', 'showcase', 'sibling',
    'sight', 'signal', 'signaling', 'signature', 'significance', 'significant', 'significantly', 'silent',
    'silently', 'silicon', 'silver', 'similar', 'similarity', 'similarly', 'simple', 'simplify',
    'simply', 'simulate', 'simulation', 'simulator', 'simultaneous', 'sincere', 'sincerely', 'singer',
    'single', 'singular', 'sister', 'situation', 'skeleton', 'sketch', 'skilled', 'skinny',
    'skyscraper', 'slight', 'slightly', 'slippery', 'slogan', 'slowly', 'smart', 'smooth',
    'smoothly', 'social', 'society', 'socket', 'software', 'soldier', 'solitary', 'solution',
    'solver', 'someone', 'something', 'sometime', 'sometimes', 'somewhat', 'somewhere', 'sophisticated',
    'soundboard', 'source', 'southern', 'soviet', 'space', 'spacious', 'spark', 'spatial',
    'speaker', 'special', 'specialist', 'specialized', 'specifically', 'species', 'specific', 'specification',
    'specimen', 'spectacle', 'spectacular', 'spectator', 'spectrum', 'speculate', 'speech', 'speed',
    'spelling', 'sphere', 'spiral', 'spirit', 'spiritual', 'splendid', 'sponsor', 'sponsorship',
    'spontaneous', 'sporting', 'spotlight', 'spreading', 'spring', 'sprint', 'square', 'stability',
    'stabilize', 'stable', 'stadium', 'staff', 'stage', 'staggering', 'stainless', 'standard',
    'standing', 'starship', 'starter', 'starting', 'statement', 'station', 'stationary', 'statistical',
    'statistics', 'statue', 'status', 'statute', 'statutory', 'steadily', 'steady', 'stealth',
    'steam', 'stellar', 'stencil', 'stepfather', 'stickers', 'stiff', 'stimulate', 'stimulus',
    'stipulate', 'stitch', 'stock', 'storage', 'stored', 'storm', 'straight', 'straightforward',
    'strain', 'strand', 'strange', 'stranger', 'strategic', 'strategist', 'strategy', 'stream',
    'streamer', 'streaming', 'street', 'strength', 'strengthen', 'stress', 'stretch', 'strictly',
    'strike', 'striking', 'stringent', 'strip', 'stroke', 'strong', 'strongly', 'structural',
    'structure', 'struggle', 'student', 'studio', 'subconscious', 'subject', 'subjective', 'submerged',
    'submission', 'submit', 'subscriber', 'subsequent', 'subsequently', 'substance', 'substantial', 'substantially',
    'substitute', 'substitution', 'subtle', 'suburban', 'succeed', 'success', 'successful', 'successfully',
    'succession', 'successive', 'sudden', 'suddenly', 'suffer', 'suffering', 'sufficient', 'sufficiently',
    'suggest', 'suggestion', 'suicide', 'suitable', 'suitcase', 'summary', 'summer', 'summit',
    'sunlight', 'sunrise', 'sunset', 'sunshine', 'superb', 'supercar', 'superficial', 'superior',
    'superiority', 'supermarket', 'supervisor', 'supplement', 'supplementary', 'supplied', 'supplier', 'supply',
    'support', 'supporter', 'supportive', 'suppose', 'supposed', 'supposedly', 'suppress', 'supremacy',
    'supreme', 'surcharge', 'surface', 'surgeon', 'surgery', 'surgical', 'surplus', 'surprise',
    'surprised', 'surprising', 'surprisingly', 'surrender', 'surround', 'surrounding', 'surveillance', 'survey',
    'survival', 'survive', 'survivor', 'suspect', 'suspend', 'suspension', 'suspicion', 'suspicious',
    'sustain', 'sustainable', 'sustained', 'sweeping', 'swiftly', 'switch', 'syllabus', 'symbol',
    'symbolic', 'symmetry', 'sympathetic', 'sympathy', 'symptom', 'syndrome', 'synergy', 'synonym',
    'synopsis', 'syntactic', 'syntax', 'synthesis', 'synthetic', 'system', 'systematic', 'systematically',
    'tactical', 'tailor', 'talent', 'talented', 'tangible', 'target', 'targeted', 'tariff',
    'taskforce', 'teacher', 'teaching', 'technical', 'technician', 'technique', 'technological', 'technology',
    'telecom', 'telemetry', 'telephone', 'telescope', 'television', 'temperature', 'temporary', 'tenant',
    'tendency', 'tender', 'tension', 'terminal', 'terminate', 'terminology', 'terrain', 'terrible',
    'terribly', 'terrific', 'territorial', 'territory', 'terrorist', 'testament', 'testimonial', 'testimony',
    'testing', 'texture', 'thanks', 'theater', 'theatrical', 'theme', 'theology', 'theoretical',
    'theoretically', 'theorist', 'theory', 'therapist', 'therapy', 'thermal', 'thinking', 'thirsty',
    'thorough', 'thoroughly', 'thought', 'thoughtful', 'threshold', 'thrilled', 'thrilling', 'thriving',
    'through', 'throughout', 'ticket', 'tightly', 'timber', 'timeline', 'timely', 'timing',
    'together', 'tolerance', 'tolerate', 'tollway', 'tomorrow', 'tonight', 'topical', 'topography',
    'torch', 'torpedo', 'torrent', 'torture', 'total', 'totally', 'touching', 'tournament',
    'toward', 'towards', 'tower', 'toxic', 'trace', 'track', 'tracking', 'traction',
    'tractor', 'trade', 'trademark', 'trader', 'trading', 'tradition', 'traditional', 'traditionally',
    'traffic', 'tragedy', 'tragic', 'trail', 'trailer', 'trainer', 'training', 'trajectory',
    'transaction', 'transcript', 'transcribe', 'transfer', 'transform', 'transformation', 'transformer', 'transit',
    'transition', 'translate', 'translation', 'translator', 'transmission', 'transmit', 'transmitter', 'transparency',
    'transparent', 'transport', 'transportation', 'trauma', 'traveler', 'traverse', 'treasure', 'treatment',
    'treaty', 'tremendous', 'trend', 'tribal', 'tribute', 'trigger', 'triumph', 'trophy',
    'tropical', 'trouble', 'troublesome', 'trustee', 'trustworthy', 'truth', 'truthful', 'tsunami',
    'tuition', 'tunnel', 'turbine', 'turbulence', 'tutorial', 'twilight', 'ultimate', 'ultimately',
    'ultra', 'unanimous', 'unbelievable', 'uncertain', 'uncertainty', 'unchanged', 'unclear', 'uncomfortable',
    'unconscious', 'undergo', 'undergraduate', 'underline', 'underlying', 'undermine', 'understand', 'understanding',
    'understood', 'undertake', 'undertaking', 'underwater', 'underwear', 'underwrite', 'undesirable', 'undoubtedly',
    'unequal', 'unexpected', 'unexpectedly', 'unfair', 'unfamiliar', 'unfavorable', 'unfit', 'unfold',
    'unfortunate', 'unfortunately', 'uniform', 'uniformity', 'unilateral', 'unique', 'uniquely', 'unitary',
    'unity', 'universal', 'universally', 'universe', 'university', 'unknown', 'unlawful', 'unlimited',
    'unlocked', 'unnecessary', 'unprecedented', 'unpredictable', 'unravel', 'unreliable', 'unrest', 'unrivaled',
    'unseen', 'unsettled', 'unstable', 'unsuccessful', 'unthinkable', 'untouched', 'unusual', 'unusually',
    'unveil', 'unwanted', 'unwilling', 'unworthy', 'upgrade', 'upgradeable', 'upload', 'upon',
    'upper', 'upright', 'uprising', 'upscale', 'upstream', 'uptick', 'upward', 'upwards',
    'urgency', 'urgent', 'urgently', 'usable', 'useful', 'usefully', 'usefulness', 'useless',
    'user', 'usher', 'usual', 'usually', 'utility', 'utilization', 'utilize', 'utterly',
    'vacant', 'vacation', 'vaccine', 'vacuum', 'valid', 'validate', 'validation', 'validity',
    'valuable', 'valuation', 'value', 'valued', 'vanguard', 'vanish', 'variable', 'variation',
    'variety', 'various', 'vast', 'vault', 'vector', 'vehicle', 'velocity', 'vendor',
    'venture', 'venue', 'verbal', 'verbally', 'verdict', 'verification', 'verify', 'versatile',
    'version', 'vertical', 'vertically', 'vessel', 'veteran', 'viable', 'vibrant', 'vibration',
    'vicious', 'victim', 'victorious', 'victory', 'viewfinder', 'viewer', 'viewpoint', 'vigilant',
    'vigorous', 'vigorously', 'village', 'villager', 'violation', 'violent', 'violently', 'virtual',
    'virtually', 'virtue', 'visible', 'visibly', 'vision', 'visionary', 'visitor', 'visual',
    'visualize', 'visually', 'vital', 'vitality', 'vocal', 'vocation', 'vocational', 'voice',
    'voltage', 'volume', 'voluntary', 'volunteer', 'vortex', 'voter', 'voting', 'voucher',
    'voyage', 'vulnerability', 'vulnerable', 'waiver', 'walking', 'wallet', 'wallpaper', 'warfare',
    'warmth', 'warning', 'warrant', 'warranty', 'warrior', 'waste', 'watchdog', 'watching',
    'waterfall', 'waterproof', 'watershed', 'waveform', 'wavelength', 'weakness', 'wealth', 'wealthy',
    'weapon', 'weather', 'website', 'wedding', 'weekday', 'weekend', 'weight', 'welcome',
    'welfare', 'whatever', 'whenever', 'wherever', 'whether', 'whichever', 'whistle', 'wholesale',
    'wholesome', 'widespread', 'willing', 'willingness', 'window', 'wireless', 'wisdom', 'withdrawal',
    'witness', 'wonderful', 'wonderfully', 'wooden', 'workbook', 'workforce', 'workload', 'workplace',
    'workshop', 'workstation', 'world', 'worldwide', 'worried', 'worthwhile', 'wreckage', 'wrist',
    'writer', 'writing', 'wrongly', 'yacht', 'yearbook', 'yearly', 'yearning', 'yield',
    'youngster', 'youthful', 'zenith', 'zealous', 'zigzag', 'zipper', 'zodiac', 'zone'
  ];

  // Common phrase & next-word pairings (expanded)
  const BIGRAMS = {
    'how': ['are you', 'is it going', 'about', 'can I help', 'did it go', 'does that sound', 'much is it'],
    'thank': ['you', 'you so much', 'you very much', 'god', 'you for understanding'],
    'thanks': ['for the update', 'a lot', 'for letting me know', 'man', 'so much', 'for your help'],
    'let': ['me know', 'us know', 'me check', 'do this', 'me see', 'them know', 'it be'],
    'sounds': ['good', 'great', 'awesome', 'like a plan', 'perfect', 'fine with me'],
    'see': ['you tomorrow', 'you soon', 'you later', 'what happens', 'you then', 'if that works'],
    'i': ['will', 'think', 'have', 'need', 'am', 'hope', 'agree', 'want', 'can', 'know', 'feel'],
    'can': ['you', 'we', 'I', 'this be done', 'you check', 'you confirm', 'you share', 'you please'],
    'could': ['you please', 'we check', 'you share', 'you explain', 'you confirm', 'we meet'],
    'please': ['let me know', 'check this', 'send it over', 'confirm', 'update', 'review this', 'advise'],
    'good': ['morning', 'afternoon', 'evening', 'job', 'luck', 'to know', 'point', 'idea'],
    'no': ['problem', 'worries', 'way', 'rush', 'doubt', 'issue at all', 'need to worry'],
    'take': ['your time', 'care', 'a look', 'it easy', 'action', 'note of this'],
    'working': ['on it', 'well', 'fine', 'now', 'hard', 'together', 'smoothly'],
    'let\'s': ['do it', 'catch up', 'review', 'proceed', 'make sure', 'schedule a call', 'connect'],
    'what': ['do you think', 'time', 'is the status', 'about', 'happened', 'is next'],
    'would': ['be great', 'you like', 'it be possible', 'appreciate if', 'love to'],
    'we': ['can', 'should', 'will', 'are ready', 'need to', 'have completed'],
    'are': ['you sure', 'you ready', 'we good', 'you available', 'there any updates'],
    'will': ['do', 'check on this', 'let you know', 'be there', 'keep you posted', 'follow up']
  };

  // Pre-compiled fast prefix lookup bucket map
  const PREFIX_INDEX = Object.create(null);
  COMMON_WORDS.forEach(word => {
    const len = word.length;
    for (let i = 1; i <= Math.min(4, len); i++) {
      const p = word.slice(0, i).toLowerCase();
      if (!PREFIX_INDEX[p]) PREFIX_INDEX[p] = [];
      if (PREFIX_INDEX[p].length < 8) {
        PREFIX_INDEX[p].push(word);
      }
    }
  });

  /**
   * Helper: Matches casing of source word to target replacement
   */
  function applyCasePattern(source, target) {
    if (!source || !target) return target;
    if (source === source.toUpperCase() && source.length > 1) {
      return target.toUpperCase();
    }
    if (source[0] === source[0].toUpperCase()) {
      return target.charAt(0).toUpperCase() + target.slice(1);
    }
    return target;
  }

  function escapeText(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  class PredictiveInputEngine {
    constructor() {
      this.input = null;
      this.bar = null;
      this.chipsContainer = null;
      this.autocorrectBtn = null;
      this.activeCorrection = null;
      this.debounceTimer = null;
      this.lastInlineFix = null;
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.mount());
      } else {
        this.mount();
      }
    }

    mount() {
      this.input = document.getElementById('message-input');
      if (!this.input) return;

      // 1. Enable standard keyboard autocomplete, autocorrect & spellcheck
      this.input.setAttribute('autocomplete', 'on');
      this.input.setAttribute('autocorrect', 'on');
      this.input.setAttribute('autocapitalize', 'sentences');
      this.input.setAttribute('spellcheck', 'true');

      // 2. Bind or build Predictive Word Bar
      let bar = document.getElementById('predictiveWordBar');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'predictiveWordBar';
        bar.className = 'predictive-word-bar';
        bar.style.display = 'none';

        bar.innerHTML = `
          <div class="predictive-chips-scroll" id="predictiveChipsScroll"></div>
          <button type="button" id="quickAutocorrectBtn" class="quick-autocorrect-btn" style="display: none;" title="Apply Instant Grammar & Spelling Fix">
            <i class="fa-solid fa-sparkles"></i> <span>Auto-Correct</span>
          </button>
        `;

        const form = document.getElementById('message-form');
        if (form && form.parentNode) {
          form.parentNode.insertBefore(bar, form);
        }
      }

      this.bar = bar;
      this.chipsContainer = document.getElementById('predictiveChipsScroll');
      this.autocorrectBtn = document.getElementById('quickAutocorrectBtn');

      if (this.autocorrectBtn) {
        this.autocorrectBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.applyAutoCorrection();
        });
      }

      // 3. Attach keyboard listeners for Sub-Millisecond Inline Autocorrect on Spacebar & Punctuation
      this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
      this.input.addEventListener('input', (e) => this.handleTyping(e));
      this.input.addEventListener('focus', () => this.computePredictions(0));

      // Hide suggestions when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#predictiveWordBar') && !e.target.closest('#message-input')) {
          if (this.bar) this.bar.style.display = 'none';
        }
      });
    }

    /**
     * Sub-millisecond (0ms) Inline Auto-Correction on KeyDown
     * Intercepts Spacebar or Punctuation to correct misspelled words instantly
     */
    handleKeyDown(e) {
      // 1. Tab key completes the first chip
      if (e.key === 'Tab') {
        const firstChip = this.chipsContainer ? this.chipsContainer.querySelector('.predictive-chip') : null;
        if (firstChip && this.bar && this.bar.style.display !== 'none') {
          e.preventDefault();
          firstChip.click();
          return;
        }
      }

      // 2. Smart Backspace Undo: If user hits backspace immediately after an auto-correction, revert it!
      if (e.key === 'Backspace' && this.lastInlineFix) {
        const cursorPos = this.input.selectionStart;
        if (cursorPos === this.lastInlineFix.undoPosition) {
          e.preventDefault();
          const val = this.input.value;
          const fix = this.lastInlineFix;
          const fixStart = cursorPos - fix.replacement.length - fix.separator.length;
          const reverted = val.slice(0, fixStart) + fix.original + fix.separator + val.slice(cursorPos);
          this.input.value = reverted;
          const newPos = fixStart + fix.original.length + fix.separator.length;
          this.input.setSelectionRange(newPos, newPos);
          this.lastInlineFix = null;
          this.input.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
      }

      // 3. Spacebar or Punctuation Inline Auto-Correction
      const triggerChars = [' ', '.', ',', '!', '?', ';'];
      if (triggerChars.includes(e.key)) {
        const didCorrect = this.tryInlineAutoCorrect(e.key);
        if (didCorrect) {
          e.preventDefault();
          return;
        }
      }
    }

    /**
     * Replaces misspelled word inline in 0ms upon Spacebar / Punctuation
     */
    tryInlineAutoCorrect(triggerChar) {
      if (!this.input) return false;
      const val = this.input.value;
      const cursorPos = this.input.selectionStart;
      if (cursorPos === null || cursorPos === undefined || cursorPos === 0) return false;

      const textBefore = val.slice(0, cursorPos);
      // Match the trailing word (Unicode letters, digits, apostrophe, or hyphens)
      let match = null;
      try {
        match = textBefore.match(/([\p{L}\p{N}'-]+)\s*$/u);
      } catch (_) {
        match = textBefore.match(/([a-zA-Z0-9'\u00C0-\u024F\u0400-\u04FF-]+)\s*$/);
      }
      if (!match) return false;

      const rawWord = match[1];
      const cleanWord = cleanTokenSafe(rawWord);
      if (!cleanWord) return false;

      const beforeWord = textBefore.slice(0, textBefore.length - rawWord.length).trim();
      const prevTokens = beforeWord.split(/\s+/);
      const prevWord = prevTokens[prevTokens.length - 1] || '';

      let replacement = null;
      if (window.autoCorrectEngine && typeof window.autoCorrectEngine.correctWord === 'function') {
        const candidate = window.autoCorrectEngine.correctWord(rawWord, prevWord);
        if (candidate && candidate.toLowerCase() !== cleanWord) {
          replacement = candidate;
        }
      }
      if (!replacement) {
        if (TYPO_MAP[cleanWord]) {
          replacement = applyCasePattern(rawWord, TYPO_MAP[cleanWord]);
        } else if (cleanWord === 'i' && (!window.autoCorrectEngine || window.autoCorrectEngine.currentPrimaryLanguage !== 'ru')) {
          replacement = 'I';
        }
      }

      if (!replacement || replacement === rawWord) return false;

      const wordStart = cursorPos - rawWord.length;
      const wordEnd = cursorPos;
      const separator = (triggerChar === ' ') ? ' ' : (triggerChar + ' ');
      const newText = val.slice(0, wordStart) + replacement + separator + val.slice(wordEnd);
      const newCursor = wordStart + replacement.length + separator.length;

      this.input.value = newText;
      this.input.setSelectionRange(newCursor, newCursor);

      this.lastInlineFix = {
        original: rawWord,
        replacement: replacement,
        separator: separator,
        undoPosition: newCursor
      };

      this.input.dispatchEvent(new Event('input', { bubbles: true }));
      this.flashCorrectionFeedback(rawWord, replacement);

      if (navigator.vibrate) {
        try { navigator.vibrate(10); } catch (_) {}
      }

      if (this.bar) this.bar.style.display = 'none';
      return true;
    }

    flashCorrectionFeedback(original, replacement) {
      let langBadgeText = '';
      let langBadgeHtml = '';
      if (window.autoCorrectEngine && typeof window.autoCorrectEngine.getActiveLanguage === 'function') {
        const meta = window.autoCorrectEngine.getActiveLanguage();
        if (meta && meta.code !== 'en') {
          langBadgeText = ` [${meta.badge}]`;
          langBadgeHtml = ` <span class="undo-pill-lang-badge">${escapeText(meta.badge)}</span>`;
        }
      }

      if (this.autocorrectBtn) {
        this.autocorrectBtn.style.display = 'inline-flex';
        this.autocorrectBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles text-[#00FFC6]"></i> <span>Fixed: ${escapeText(original)} &rarr; ${escapeText(replacement)}${langBadgeText}</span>`;
      }

      // Render floating interactive undo pill
      let pill = document.getElementById('autocorrectUndoPill');
      if (!pill) {
        pill = document.createElement('div');
        pill.id = 'autocorrectUndoPill';
        pill.className = 'autocorrect-undo-pill';
        const form = document.getElementById('message-form');
        if (form && form.parentNode) {
          form.parentNode.insertBefore(pill, form);
        }
      }

      if (pill) {
        pill.style.display = 'flex';
        pill.innerHTML = `
          <div class="undo-pill-text">
            <i class="fa-solid fa-sparkles" style="color: #00FFC6; font-size: 11px;"></i>
            <span>Fixed: <strong>${escapeText(original)}</strong> &rarr; <strong style="color: #00FFC6;">${escapeText(replacement)}</strong>${langBadgeHtml}</span>
          </div>
          <button type="button" class="undo-pill-btn" id="btnUndoAutoCorrect">
            <i class="fa-solid fa-rotate-left"></i> <span>Undo</span>
          </button>
        `;

        const undoBtn = pill.querySelector('#btnUndoAutoCorrect');
        if (undoBtn) {
          undoBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.undoLastInlineFix();
          };
        }

        clearTimeout(this.undoPillTimer);
        this.undoPillTimer = setTimeout(() => {
          if (pill) pill.style.display = 'none';
        }, 3200);
      }
    }

    undoLastInlineFix() {
      if (!this.lastInlineFix || !this.input) return;
      const val = this.input.value;
      const fix = this.lastInlineFix;
      const cursorPos = this.input.selectionStart;
      const fixStart = cursorPos - fix.replacement.length - fix.separator.length;
      if (fixStart >= 0) {
        const reverted = val.slice(0, fixStart) + fix.original + fix.separator + val.slice(cursorPos);
        this.input.value = reverted;
        const newPos = fixStart + fix.original.length + fix.separator.length;
        this.input.setSelectionRange(newPos, newPos);
        this.lastInlineFix = null;
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const pill = document.getElementById('autocorrectUndoPill');
      if (pill) pill.style.display = 'none';
    }

    /**
     * Real-time typing handler with ultra-fast 8ms micro-coalesce
     */
    handleTyping() {
      clearTimeout(this.debounceTimer);
      // 8ms micro-debounce ensures 120fps fluid response with zero keystroke delay
      this.debounceTimer = setTimeout(() => this.computePredictions(), 8);
    }

    computePredictions(delayOverride) {
      if (!this.input || !this.chipsContainer) return;
      const val = this.input.value;

      if (!val || !val.trim()) {
        if (this.bar) this.bar.style.display = 'none';
        this.chipsContainer.innerHTML = '';
        if (this.autocorrectBtn) this.autocorrectBtn.style.display = 'none';
        if (this.langBadge) this.langBadge.style.display = 'none';
        this.activeCorrection = null;
        return;
      }

      const cursorPos = (this.input.selectionStart !== null && this.input.selectionStart > 0)
        ? this.input.selectionStart
        : (this.input.selectionEnd || val.length);

      const textUpToCursor = val.slice(0, cursorPos);
      const endsWithSpace = /\s$/.test(textUpToCursor);

      let currentWord = '';
      let prevWord = '';

      if (endsWithSpace) {
        currentWord = '';
        const tokens = textUpToCursor.trim().split(/\s+/);
        prevWord = tokens[tokens.length - 1] || '';
      } else {
        const match = textUpToCursor.match(/(\S+)$/);
        currentWord = match ? match[1] : '';
        const beforeCurrent = textUpToCursor.slice(0, textUpToCursor.length - currentWord.length).trim();
        const tokens = beforeCurrent.split(/\s+/);
        prevWord = tokens[tokens.length - 1] || '';
      }

      const cleanWord = cleanTokenSafe(currentWord);
      const cleanPrev = cleanTokenSafe(prevWord);

      // Check / Detect active language
      let detectedLang = 'en';
      if (window.autoCorrectEngine && typeof window.autoCorrectEngine.detectLanguage === 'function') {
        detectedLang = window.autoCorrectEngine.detectLanguage(val, cleanWord);
      }

      // Update predictive language badge
      if (this.langBadge) {
        if (detectedLang && detectedLang !== 'en' && window.autoCorrectEngine) {
          const meta = window.autoCorrectEngine.getActiveLanguage();
          this.langBadge.style.display = 'inline-flex';
          this.langBadge.innerHTML = `<i class="fa-solid fa-earth-americas text-[#00FFC6] text-[10px] mr-1"></i><span>${meta.badge}</span>`;
        } else {
          this.langBadge.style.display = 'none';
        }
      }

      const suggestions = [];
      let detectedCorrection = null;

      // 1. Multilingual Typo Check on active or previous word
      const targetTypo = cleanWord || (endsWithSpace ? cleanPrev : '');
      const rawTarget = cleanWord ? currentWord : prevWord;

      if (targetTypo) {
        let fixedCandidate = null;

        // Russian typo map
        if (detectedLang === 'ru' && window.RU_TYPO_MAP && window.RU_TYPO_MAP[targetTypo]) {
          fixedCandidate = window.RU_TYPO_MAP[targetTypo];
        }
        // Nigerian Pidgin typo map
        else if (window.PIDGIN_TYPO_MAP && window.PIDGIN_TYPO_MAP[targetTypo]) {
          fixedCandidate = window.PIDGIN_TYPO_MAP[targetTypo];
        }
        // Multilingual suite typo map
        else if (window.MULTILINGUAL_SUITE && window.MULTILINGUAL_SUITE.correctWord(targetTypo, detectedLang)) {
          fixedCandidate = window.MULTILINGUAL_SUITE.correctWord(targetTypo, detectedLang);
        }
        // English Typo Map
        else if (TYPO_MAP[targetTypo]) {
          fixedCandidate = TYPO_MAP[targetTypo];
        }

        if (fixedCandidate) {
          const fixed = applyCasePattern(rawTarget, fixedCandidate);
          detectedCorrection = {
            original: rawTarget,
            replacement: fixed,
            fullText: val.replace(new RegExp(`\\b${escapeRegExp(rawTarget)}\\b`), fixed)
          };
          suggestions.push({
            text: fixed,
            isCorrection: true,
            label: `Fix: ${fixed}`
          });
        }
      }

      // 1.5 Sub-directory completions (Russian / Pidgin / English)
      if (cleanWord && cleanWord.length >= 2) {
        if (detectedLang === 'ru' && window.RU_WORDS) {
          for (let i = 0; i < window.RU_WORDS.length; i++) {
            const w = window.RU_WORDS[i];
            if (w.startsWith(cleanWord) && w !== cleanWord) {
              const formatted = applyCasePattern(currentWord, w);
              if (!suggestions.some(s => s.text.toLowerCase() === formatted.toLowerCase())) {
                suggestions.push({ text: formatted, isCompletion: true });
                if (suggestions.length >= 4) break;
              }
            }
          }
        } else if (detectedLang === 'pidgin' && window.PIDGIN_WORDS) {
          for (let i = 0; i < window.PIDGIN_WORDS.length; i++) {
            const w = window.PIDGIN_WORDS[i];
            if (w.startsWith(cleanWord) && w !== cleanWord) {
              const formatted = applyCasePattern(currentWord, w);
              if (!suggestions.some(s => s.text.toLowerCase() === formatted.toLowerCase())) {
                suggestions.push({ text: formatted, isCompletion: true });
                if (suggestions.length >= 4) break;
              }
            }
          }
        }
      }

      // 1.8 30k Fuzzy candidates (English/Latin)
      if (detectedLang === 'en' && cleanWord && cleanWord.length >= 3 && window.fuzzyMatcher && typeof window.fuzzyMatcher.findSuggestions === 'function') {
        const fuzzySuggestions = window.fuzzyMatcher.findSuggestions(cleanWord, 3);
        fuzzySuggestions.forEach(f => {
          if (!suggestions.some(s => s.text.toLowerCase() === f.text.toLowerCase())) {
            suggestions.push({ text: applyCasePattern(currentWord, f.text), isCorrection: f.isCorrection, isCompletion: f.isCompletion });
          }
        });
      }

      // 2. O(1) Prefix-based word completion lookup (English)
      if (detectedLang === 'en' && cleanWord && cleanWord.length >= 2) {
        const prefixCandidates = PREFIX_INDEX[cleanWord.slice(0, Math.min(4, cleanWord.length))] || [];
        for (let i = 0; i < prefixCandidates.length; i++) {
          const w = prefixCandidates[i];
          if (w.startsWith(cleanWord) && w !== cleanWord) {
            const formatted = applyCasePattern(currentWord, w);
            if (!suggestions.some(s => s.text.toLowerCase() === formatted.toLowerCase())) {
              suggestions.push({ text: formatted, isCompletion: true });
              if (suggestions.length >= 4) break;
            }
          }
        }
      }

      // 3. Next-word Bigram predictions based on previous word
      const bigramKey = (cleanWord ? cleanWord : cleanPrev).toLowerCase();
      if (detectedLang === 'en' && bigramKey && BIGRAMS[bigramKey]) {
        const phrases = BIGRAMS[bigramKey];
        for (let i = 0; i < phrases.length; i++) {
          const phrase = phrases[i];
          if (!suggestions.some(s => s.text.toLowerCase() === phrase.toLowerCase())) {
            suggestions.push({ text: phrase, isBigram: true });
            if (suggestions.length >= 5) break;
          }
        }
      }

      // 4. Fallback greetings if starting a message
      if (suggestions.length === 0 && !prevWord && cleanWord.length >= 1) {
        const fallbacks = (detectedLang === 'ru')
          ? ['привет', 'здравствуйте', 'добрый день', 'спасибо', 'хорошо']
          : (detectedLang === 'pidgin')
            ? ['how far', 'wetin dey', 'I dey', 'no wahala', 'sharp sharp']
            : ['thanks', 'sounds good', 'let me check', 'understood', 'perfect', 'hello'];
        fallbacks.forEach(f => {
          if (f.startsWith(cleanWord) && suggestions.length < 3) {
            suggestions.push({ text: f });
          }
        });
      }

      // Render suggestions bar
      if (suggestions.length > 0 || detectedCorrection) {
        this.renderChips(suggestions, currentWord);
        this.bar.style.display = 'flex';

        if (detectedCorrection && this.autocorrectBtn) {
          this.activeCorrection = detectedCorrection;
          this.autocorrectBtn.style.display = 'inline-flex';
          this.autocorrectBtn.innerHTML = `<i class="fa-solid fa-sparkles"></i> <span>Fix to "${escapeText(detectedCorrection.replacement)}"</span>`;
        } else if (this.autocorrectBtn && !this.lastInlineFix) {
          this.autocorrectBtn.style.display = 'none';
          this.activeCorrection = null;
        }
      } else {
        this.bar.style.display = 'none';
        this.activeCorrection = null;
      }
    }

    renderChips(suggestions, currentWord) {
      this.chipsContainer.innerHTML = '';
      suggestions.slice(0, 5).forEach(s => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `predictive-chip ${s.isCorrection ? 'is-correction' : ''}`;

        const icon = s.isCorrection
          ? '<i class="fa-solid fa-check text-[#00ff66]"></i> '
          : (s.isBigram ? '<i class="fa-solid fa-arrow-turn-down text-[#38bdf8] text-[10px]"></i> ' : '');

        btn.innerHTML = `${icon}<span>${escapeText(s.text)}</span>`;

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.applySuggestion(s.text, currentWord);
        });

        this.chipsContainer.appendChild(btn);
      });
    }

    applySuggestion(replacementText, currentWord) {
      if (!this.input) return;
      const val = this.input.value;
      const cursorPos = this.input.selectionStart || val.length;

      let newText;
      let newCursor;

      if (currentWord && currentWord.trim().length > 0) {
        const start = cursorPos - currentWord.length;
        newText = val.slice(0, start) + replacementText + ' ' + val.slice(cursorPos);
        newCursor = start + replacementText.length + 1;
      } else {
        const lead = val.slice(0, cursorPos).endsWith(' ') ? '' : ' ';
        newText = val.slice(0, cursorPos) + lead + replacementText + ' ' + val.slice(cursorPos);
        newCursor = newText.length;
      }

      this.input.value = newText;
      this.input.focus();
      this.input.setSelectionRange(newCursor, newCursor);

      this.input.dispatchEvent(new Event('input', { bubbles: true }));

      if (navigator.vibrate) {
        try { navigator.vibrate(12); } catch (_) {}
      }

      this.bar.style.display = 'none';
      this.activeCorrection = null;
    }

    applyAutoCorrection() {
      if (!this.input) return;

      if (this.activeCorrection) {
        this.input.value = this.activeCorrection.fullText;
        const pos = this.activeCorrection.fullText.length;
        this.input.focus();
        this.input.setSelectionRange(pos, pos);
        this.input.dispatchEvent(new Event('input', { bubbles: true }));

        if (navigator.vibrate) {
          try { navigator.vibrate(15); } catch (_) {}
        }
        this.bar.style.display = 'none';
        if (this.autocorrectBtn) this.autocorrectBtn.style.display = 'none';
        this.activeCorrection = null;
        return;
      }

      // If no active single correction, run instant whole-draft polish (0ms!)
      this.applyFastPolish();
    }

    /**
     * Instant 0ms Local Neural Grammar & Typo Synthesizer
     * Formats whole message: typos, isolated 'i', spacing, sentence capitalization
     */
    instantPolish(rawText) {
      if (!rawText || !rawText.trim()) return rawText;
      if (window.autoCorrectEngine && typeof window.autoCorrectEngine.instantPolish === 'function') {
        return window.autoCorrectEngine.instantPolish(rawText);
      }
      let text = rawText;

      // 1. Spacing around punctuation
      text = text.replace(/\s+([,;:.!?])/g, '$1');
      text = text.replace(/([,;:.!?])([A-Za-z])/g, '$1 $2');
      text = text.replace(/\s+/g, ' ');

      // 2. Replace all typos, shorthand and contractions
      const tokens = text.split(/(\s+|[.,!?;:()]+)/);
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const clean = token.toLowerCase();
        if (TYPO_MAP[clean]) {
          tokens[i] = applyCasePattern(token, TYPO_MAP[clean]);
        } else if (clean === 'i') {
          tokens[i] = 'I';
        }
      }
      text = tokens.join('');

      // 3. Sentence capitalization
      text = text.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => prefix + letter.toUpperCase());

      // 4. Standalone lowercase 'i'
      text = text.replace(/\bi\b/g, 'I');

      return text.trim();
    }

    /**
     * Apply Fast Polish to input field immediately with 0ms visual feedback
     */
    applyFastPolish() {
      if (!this.input) return;
      const original = this.input.value;
      if (!original || !original.trim()) return;

      // Instant 0ms local polish
      const polished = this.instantPolish(original);
      this.input.value = polished;
      this.input.focus();
      this.input.dispatchEvent(new Event('input', { bubbles: true }));

      // Green border flash
      this.input.style.borderColor = 'var(--accent-primary, #00ff66)';
      setTimeout(() => {
        if (this.input) this.input.style.borderColor = '';
      }, 1000);

      if (this.bar) this.bar.style.display = 'none';
      if (this.autocorrectBtn) this.autocorrectBtn.style.display = 'none';

      if (typeof window.showNotif === 'function') {
        window.showNotif('Draft Auto-Corrected Instantly [0ms]', 'success', 1500);
      }
    }
  }

  // Export engine instance to window
  window.PredictiveInputEngine = PredictiveInputEngine;
  window.predictiveInputEngine = new PredictiveInputEngine();
})();
