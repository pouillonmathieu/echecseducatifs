/* Comment ça s'appelle ? — les termes à écrire et leurs illustrations.
   Chaque terme : id, niveau ('facile' ou 'difficile' : le niveau difficile ajoute ses termes à ceux du niveau facile),
   illustration, et le mot dans chaque langue : [déterminant, mot] (zh : [déterminant, mot, pinyin]).
   - le déterminant est affiché ; seules les lettres du mot sont à taper (espaces, tirets, « ! », « ¡ »… sont déjà écrits) ;
   - arabe : l'article ال s'écrit collé au mot ; français : l' aussi (apostrophe à la fin du déterminant).
   Illustrations :
   - { piece: 'roi', couleur: 'blanc' } : une pièce en grand ;
   - { camp: 'blanc' } : les pièces d'un camp ;
   - { fen, annot: [['e2e4', 'suite'], ['e4', 'danger'], …], roi: 'e8', badge: '+' } : un échiquier avec flèches
     et cases colorées (couleurs de js/echiquier.js), le roi attaqué entouré de rouge, un badge « + » ou « # ».
   Les termes difficiles en arabe, en hindi et en mandarin sont à faire relire par quelqu'un qui joue dans cette langue. */
window.TERMES_MOTS = [
  // ---------- niveau facile ----------
  {
    id: 'echiquier', niveau: 'facile',
    illus: { fen: '8/8/8/8/8/8/8/8' },
    fr: ["l'", 'échiquier'], en: ['the', 'chessboard'], es: ['el', 'tablero'], pt: ['o', 'tabuleiro'], nl: ['het', 'schaakbord'],
    ru: ['', 'шахматная доска'], ar: ['', 'رقعة الشطرنج'], hi: ['', 'बिसात'], zh: ['', '棋盘', 'qípán'],
  },
  {
    id: 'roi', niveau: 'facile', illus: { piece: 'roi', couleur: 'blanc' },
    fr: ['le', 'roi'], en: ['the', 'king'], es: ['el', 'rey'], pt: ['o', 'rei'], nl: ['de', 'koning'],
    ru: ['', 'король'], ar: ['ال', 'ملك'], hi: ['', 'राजा'], zh: ['', '王', 'wáng'],
  },
  {
    id: 'dame', niveau: 'facile', illus: { piece: 'dame', couleur: 'blanc' },
    fr: ['la', 'dame'], en: ['the', 'queen'], es: ['la', 'dama'], pt: ['a', 'dama'], nl: ['de', 'dame'],
    ru: ['', 'ферзь'], ar: ['ال', 'وزير'], hi: ['', 'रानी'], zh: ['', '后', 'hòu'],
  },
  {
    id: 'fou', niveau: 'facile', illus: { piece: 'fou', couleur: 'noir' },
    fr: ['le', 'fou'], en: ['the', 'bishop'], es: ['el', 'alfil'], pt: ['o', 'bispo'], nl: ['de', 'loper'],
    ru: ['', 'слон'], ar: ['ال', 'فيل'], hi: ['', 'ऊँट'], zh: ['', '象', 'xiàng'],
  },
  {
    id: 'cavalier', niveau: 'facile', illus: { piece: 'cavalier', couleur: 'blanc' },
    fr: ['le', 'cavalier'], en: ['the', 'knight'], es: ['el', 'caballo'], pt: ['o', 'cavalo'], nl: ['het', 'paard'],
    ru: ['', 'конь'], ar: ['ال', 'حصان'], hi: ['', 'घोड़ा'], zh: ['', '马', 'mǎ'],
  },
  {
    id: 'tour', niveau: 'facile', illus: { piece: 'tour', couleur: 'noir' },
    fr: ['la', 'tour'], en: ['the', 'rook'], es: ['la', 'torre'], pt: ['a', 'torre'], nl: ['de', 'toren'],
    ru: ['', 'ладья'], ar: ['ال', 'قلعة'], hi: ['', 'हाथी'], zh: ['', '车', 'chē'],
  },
  {
    id: 'pion', niveau: 'facile', illus: { piece: 'pion', couleur: 'blanc' },
    fr: ['le', 'pion'], en: ['the', 'pawn'], es: ['el', 'peón'], pt: ['o', 'peão'], nl: ['de', 'pion'],
    ru: ['', 'пешка'], ar: ['ال', 'بيدق'], hi: ['', 'प्यादा'], zh: ['', '兵', 'bīng'],
  },
  {
    id: 'case', niveau: 'facile',
    illus: { fen: '8/8/8/8/8/8/8/8', annot: [['e4', 'suite']], cadre: ['e4'] },
    fr: ['la', 'case'], en: ['the', 'square'], es: ['la', 'casilla'], pt: ['a', 'casa'], nl: ['het', 'veld'],
    ru: ['', 'поле'], ar: ['ال', 'مربع'], hi: ['', 'खाना'], zh: ['', '格子', 'gézi'],
  },
  {
    id: 'echec', niveau: 'facile',
    // 1.e4 e5 2.Bc4 Nc6 3.Bxf7+ : le roi noir est attaqué, mais il peut prendre le fou
    illus: { fen: 'r1bqkbnr/pppp1Bpp/2n5/4p3/4P3/8/PPPP1PPP/RNBQK1NR b KQkq - 0 3', annot: [['f7e8', 'danger']], roi: 'e8', badge: '+' },
    fr: ['', 'échec !'], en: ['', 'check!'], es: ['', '¡jaque!'], pt: ['', 'xeque!'], nl: ['', 'schaak!'],
    ru: ['', 'шах!'], ar: ['', 'كش ملك!'], hi: ['', 'शह!'], zh: ['', '将军！', 'jiāngjūn'],
  },
  {
    id: 'mat', niveau: 'facile',
    // le mat du berger : 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#
    illus: { fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4', annot: [['f7e8', 'danger'], ['c4f7', 'menace']], roi: 'e8', badge: '#' },
    fr: ['', 'échec et mat !'], en: ['', 'checkmate!'], es: ['', '¡jaque mate!'], pt: ['', 'xeque-mate!'], nl: ['', 'schaakmat!'],
    ru: ['', 'мат!'], ar: ['', 'كش مات!'], hi: ['', 'शह और मात!'], zh: ['', '将死！', 'jiāngsǐ'],
  },
  {
    id: 'blancs', niveau: 'facile', illus: { camp: 'blanc' },
    fr: ['les', 'blancs'], en: ['', 'White'], es: ['las', 'blancas'], pt: ['as', 'brancas'], nl: ['', 'wit'],
    ru: ['', 'белые'], ar: ['ال', 'أبيض'], hi: ['', 'सफ़ेद'], zh: ['', '白方', 'báifāng'],
  },
  {
    id: 'noirs', niveau: 'facile', illus: { camp: 'noir' },
    fr: ['les', 'noirs'], en: ['', 'Black'], es: ['las', 'negras'], pt: ['as', 'pretas'], nl: ['', 'zwart'],
    ru: ['', 'чёрные'], ar: ['ال', 'أسود'], hi: ['', 'काला'], zh: ['', '黑方', 'hēifāng'],
  },

  // ---------- niveau difficile (un exemple sur un échiquier complet) ----------
  {
    id: 'roque', niveau: 'difficile',
    // le roi va de e1 à g1 et la tour de h1 à f1
    illus: { fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', annot: [['e1g1', 'suite'], ['h1f1', 'suite']] },
    fr: ['le', 'roque'], en: ['', 'castling'], es: ['el', 'enroque'], pt: ['o', 'roque'], nl: ['de', 'rokade'],
    ru: ['', 'рокировка'], ar: ['ال', 'تبييت'], hi: ['', 'कैसलिंग'], zh: ['', '王车易位', 'wáng chē yìwèi'],
  },
  {
    id: 'passant', niveau: 'difficile',
    // les Noirs viennent de jouer d7-d5 : le pion e5 le prend en allant en d6
    illus: { fen: 'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3', annot: [['d7d5', 'adversaire'], ['e5d6', 'suite'], ['d5', 'danger']] },
    fr: ['', 'en passant'], en: ['', 'en passant'], es: ['', 'al paso'], pt: ['', 'en passant'], nl: ['', 'en passant'],
    ru: ['', 'взятие на проходе'], ar: ['', 'الأخذ في المرور'], hi: ['', 'आन पासां'], zh: ['', '吃过路兵', 'chī guòlù bīng'],
  },
  {
    id: 'colonne', niveau: 'difficile',
    illus: { fen: '8/8/8/8/8/8/8/8', annot: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'].map(c => [c, 'suite']) },
    fr: ['la', 'colonne'], en: ['the', 'file'], es: ['la', 'columna'], pt: ['a', 'coluna'], nl: ['de', 'lijn'],
    ru: ['', 'вертикаль'], ar: ['ال', 'عمود'], hi: ['', 'फ़ाइल'], zh: ['', '直线', 'zhíxiàn'],
  },
  {
    id: 'rangee', niveau: 'difficile',
    illus: { fen: '8/8/8/8/8/8/8/8', annot: ['a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3'].map(c => [c, 'suite']) },
    fr: ['la', 'rangée'], en: ['the', 'rank'], es: ['la', 'fila'], pt: ['a', 'fileira'], nl: ['de', 'rij'],
    ru: ['', 'горизонталь'], ar: ['ال', 'صف'], hi: ['', 'रैंक'], zh: ['', '横线', 'héngxiàn'],
  },
  {
    id: 'fourchette', niveau: 'difficile',
    // le cavalier c7 attaque à la fois le roi e8 et la tour a8
    illus: { fen: 'r1b1kbnr/ppN2ppp/2n5/4p3/8/8/PPPP1PPP/R1B1KBNR b KQkq - 0 7', annot: [['c7e8', 'danger'], ['c7a8', 'danger']], roi: 'e8' },
    fr: ['une', 'fourchette'], en: ['a', 'fork'], es: ['una', 'horquilla'], pt: ['um', 'garfo'], nl: ['een', 'vork'],
    ru: ['', 'вилка'], ar: ['', 'شوكة'], hi: ['', 'फ़ोर्क'], zh: ['', '捉双', 'zhuōshuāng'],
  },
  {
    id: 'enfilade', niveau: 'difficile',
    // le fou g4 attaque le roi e6 ; quand le roi s'en va, la dame c8 derrière lui est prise
    illus: { fen: '2q5/pp3ppp/4k3/8/6B1/8/PPP2PPP/6K1 b - - 0 1', annot: [['g4e6', 'danger'], ['e6c8', 'menace']], roi: 'e6' },
    fr: ['une', 'enfilade'], en: ['a', 'skewer'], es: ['una', 'enfilada'], pt: ['um', 'espeto'], nl: ['een', 'spies'],
    ru: ['', 'сквозной удар'], ar: ['', 'سيخ'], hi: ['', 'स्क्यूअर'], zh: ['', '串击', 'chuànjī'],
  },
  {
    id: 'clouage', niveau: 'difficile',
    // le fou b5 cloue le cavalier c6 : s'il bouge, le roi e8 est en échec
    illus: { fen: 'r1bqkbnr/ppp2ppp/2np4/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4', annot: [['b5e8', 'menace'], ['c6', 'danger']] },
    fr: ['un', 'clouage'], en: ['a', 'pin'], es: ['una', 'clavada'], pt: ['uma', 'cravada'], nl: ['een', 'penning'],
    ru: ['', 'связка'], ar: ['', 'تثبيت'], hi: ['', 'पिन'], zh: ['', '牵制', 'qiānzhì'],
  },
  {
    id: 'ouverture', niveau: 'difficile',
    // les premiers coups : on avance un pion du centre et on sort les pièces
    illus: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', annot: [['e2e4', 'suite'], ['g1f3', 'suite'], ['f1c4', 'suite'], ['e7e5', 'adversaire'], ['b8c6', 'adversaire']] },
    fr: ['une', 'ouverture'], en: ['an', 'opening'], es: ['una', 'apertura'], pt: ['uma', 'abertura'], nl: ['een', 'opening'],
    ru: ['', 'дебют'], ar: ['', 'افتتاح'], hi: ['', 'ओपनिंग'], zh: ['', '开局', 'kāijú'],
  },
  {
    id: 'finale', niveau: 'difficile',
    // il ne reste presque plus de pièces : les rois, une tour et quelques pions
    illus: { fen: '8/5pk1/6p1/8/3K4/6P1/1R3P2/2r5 w - - 0 40' },
    fr: ['une', 'finale'], en: ['an', 'endgame'], es: ['un', 'final'], pt: ['um', 'final'], nl: ['een', 'eindspel'],
    ru: ['', 'эндшпиль'], ar: ['', 'نهاية'], hi: ['', 'एंडगेम'], zh: ['', '残局', 'cánjú'],
  },
  {
    id: 'fianchetto', niveau: 'difficile',
    // le fou se place en g2, derrière le pion g3, et vise la grande diagonale
    illus: { fen: 'rnbqkbnr/pppppppp/8/8/8/5NP1/PPPPPPBP/RNBQK2R w KQkq - 2 3', annot: [['g2', 'suite'], ['g2b7', 'menace']] },
    fr: ['un', 'fianchetto'], en: ['a', 'fianchetto'], es: ['un', 'fianchetto'], pt: ['um', 'fianchetto'], nl: ['een', 'fianchetto'],
    ru: ['', 'фианкетто'], ar: ['', 'فيانكيتو'], hi: ['', 'फ़ियानकेटो'], zh: ['', '侧翼出象', 'cèyì chū xiàng'],
  },
  {
    id: 'avantposte', niveau: 'difficile',
    // le cavalier d5 est protégé par des pions, et aucun pion noir ne peut le chasser
    illus: { fen: 'r1bq1rk1/pp2bppp/3p1n2/3Np3/2P1P3/8/PP3PPP/R2QKB1R w KQ - 0 10', annot: [['d5', 'suite'], ['c4d5', 'suite'], ['e4d5', 'suite']] },
    fr: ['un', 'avant-poste'], en: ['an', 'outpost'], es: ['un', 'puesto avanzado'], pt: ['um', 'posto avançado'], nl: ['een', 'voorpost'],
    ru: ['', 'форпост'], ar: ['', 'موقع متقدم'], hi: ['', 'चौकी'], zh: ['', '前哨', 'qiánshào'],
  },
  {
    id: 'opposition', niveau: 'difficile',
    // les deux rois face à face, une case entre eux : celui qui doit jouer recule
    illus: { fen: '8/8/4k3/8/4K3/4P3/8/8 b - - 0 1', annot: [['e5', 'menace'], ['e4', 'suite'], ['e6', 'adversaire']] },
    fr: ["l'", 'opposition'], en: ['the', 'opposition'], es: ['la', 'oposición'], pt: ['a', 'oposição'], nl: ['de', 'oppositie'],
    ru: ['', 'оппозиция'], ar: ['ال', 'معارضة'], hi: ['', 'विरोध'], zh: ['', '对王', 'duìwáng'],
  },
  {
    id: 'decouverte', niveau: 'difficile',
    // le fou part en h7 avec échec et découvre la tour e1, qui attaque la dame e8
    illus: { fen: '4q1k1/5ppp/8/8/4B3/8/5PPP/4R1K1 w - - 0 1', annot: [['e4h7', 'suite'], ['e1e8', 'danger']] },
    fr: ['une', 'découverte'], en: ['a', 'discovered attack'], es: ['un', 'ataque a la descubierta'], pt: ['um', 'ataque descoberto'], nl: ['een', 'aftrekaanval'],
    ru: ['', 'вскрытое нападение'], ar: ['', 'هجوم مكشوف'], hi: ['', 'खुला हमला'], zh: ['', '闪击', 'shǎnjī'],
  },
];

// Les langues : nom affiché, sens d'écriture, clavier (rangées de touches ; mandarin : tuiles de caractères tirées du mot).
window.LANGUES_MOTS = {
  fr: { nom: 'Français', clavier: ['azertyuiop', 'qsdfghjklm', 'wxcvbn', 'éèêàâçîôùû'] },
  en: { nom: 'English', clavier: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] },
  es: { nom: 'Español', clavier: ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm', 'áéíóúü'] },
  pt: { nom: 'Português', clavier: ['qwertyuiop', 'asdfghjklç', 'zxcvbnm', 'áàâãéêíóôõú'] },
  nl: { nom: 'Nederlands', clavier: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'ëéïèö'] },
  ru: { nom: 'Русский', clavier: ['йцукенгшщзхъ', 'фывапролджэ', 'ячсмитьбюё'] },
  ar: { nom: 'العربية', rtl: true, clavier: ['ضصثقفغعهخحج', 'شسيبلاتنمكط', 'ءؤرىةوزظدذ', 'أإآئ'] },
  hi: { nom: 'हिन्दी', clavier: ['अआइईउऊएऐओऔऋ', 'ािीुूृेैोौ', 'ंँः़्', 'कखगघङचछजझञ', 'टठडढणतथदधन', 'पफबभमयरल', 'वशषसह'] },
  zh: { nom: '中文', tuiles: true },
};
