/* Portraits dessinés des champions (SVG généré, sans aucune photo).
   Chaque portrait est fait de quelques traits caractéristiques : forme du visage, coiffure, barbe ou moustache,
   lunettes, tenue de l'époque. Les champions du XIXe siècle sont teintés sépia, comme une vieille photo.
   Portraits.svg(cle) renvoie le dessin ; Portraits.CHAMPIONS donne le nom et la description. */
(function () {
  // peau, cheveux, yeux
  const PEAU = { claire: '#F1C9A5', rose: '#EDBB98', mate: '#D9A47A', olive: '#CF9A6E' };
  const CHEVEUX = { noir: '#24201E', brun: '#4A3326', chatain: '#6E4B32', clair: '#A9825A', blond: '#C9A36A', roux: '#8A4A2A', gris: '#9A9690', blanc: '#D6D3CE', poivre: '#5E5A56' };

  // Description de chaque champion (traits connus, dessinés librement)
  const CHAMPIONS = {
    morphy: { formeYeux: 'ronds', formeSourcils: 'arque', sourcils: .8,  nom: 'Paul Morphy', pays: 'États-Unis', epoque: '1837–1884', sepia: true, peau: 'claire', cheveux: 'brun', coiffure: 'raie', visage: 0.95, menton: 0.72, tenue: 'noeud', yeux: '#4A3A2A' },
    steinitz: { formeYeux: 'etroits', formeSourcils: 'droit', touffus: 1, sourcils: 1.5,  nez: 'fort',  nom: 'Wilhelm Steinitz', pays: 'Autriche', epoque: '1836–1900', monde: true, sepia: true, peau: 'rose', cheveux: 'roux', coiffure: 'degarni', barbe: 'pleine', moustache: 'epaisse', visage: 1.16, menton: 0.85, tenue: 'noeud', age: 2 },
    tchigorine: { formeYeux: 'amande', formeSourcils: 'droit', sourcils: 1.4, ecart: .4,  nom: 'Mikhaïl Tchigorine', pays: 'Russie', epoque: '1850–1908', sepia: true, peau: 'claire', cheveux: 'noir', coiffure: 'arriere', barbe: 'pleine', moustache: 'epaisse', visage: 1.0, menton: 0.8, tenue: 'noeud', age: 1 },
    tarrasch: { formeYeux: 'etroits', tailleYeux: .9, formeSourcils: 'fronce',  nom: 'Siegbert Tarrasch', pays: 'Allemagne', epoque: '1862–1934', sepia: true, peau: 'rose', cheveux: 'brun', coiffure: 'chauve', barbe: 'bouc', moustache: 'epaisse', lunettes: 'pincenez', visage: 1.0, menton: 0.75, tenue: 'noeud', age: 1 },
    lasker: { formeYeux: 'tombants', formeSourcils: 'arque', touffus: 1,  accessoire: 'cigare', sourcils: 1.6,  nom: 'Emanuel Lasker', pays: 'Allemagne', epoque: '1868–1941', monde: true, sepia: true, peau: 'rose', cheveux: 'poivre', coiffure: 'couronne', moustache: 'epaisse', visage: 1.02, menton: 0.8, tenue: 'costume', age: 2 },
    schlechter: { formeYeux: 'amande', formeSourcils: 'arque', sourcils: .9, ecart: -.3,  nom: 'Carl Schlechter', pays: 'Autriche', epoque: '1874–1918', sepia: true, peau: 'claire', cheveux: 'brun', coiffure: 'raie', moustache: 'guidon', visage: 0.9, menton: 0.68, tenue: 'noeud' },
    rubinstein: { formeYeux: 'enfonces', formeSourcils: 'droit', sourcils: 1.5,  regard: 'intense',  nom: 'Akiba Rubinstein', pays: 'Pologne', epoque: '1880–1961', sepia: true, peau: 'claire', cheveux: 'noir', coiffure: 'arriere', visage: 0.95, menton: 0.75, tenue: 'costume', yeux: '#2E2622' },
    nimzowitsch: { formeYeux: 'ronds', tailleYeux: 1.1, formeSourcils: 'arque', sourcils: 1.1, regardX: .5,  nez: 'fort', long: 2,  nom: 'Aron Nimzowitsch', pays: 'Lettonie, Danemark', epoque: '1886–1935', sepia: true, peau: 'claire', cheveux: 'brun', coiffure: 'boucles', visage: 0.84, menton: 0.62, tenue: 'costume' },
    capablanca: { formeYeux: 'amande', formeSourcils: 'arque', sourcils: 1.1, regardX: -.4,  nez: 'fin',  nom: 'José Raúl Capablanca', pays: 'Cuba', epoque: '1888–1942', monde: true, peau: 'mate', cheveux: 'noir', coiffure: 'plaque', visage: 0.98, menton: 0.78, tenue: 'costume', cravate: '#7A2E2E', yeux: '#2E2622', sourire: 1 },
    reti: { formeYeux: 'ronds', formeSourcils: 'droit', sourcils: 1.2,  nom: 'Richard Réti', pays: 'Tchécoslovaquie', epoque: '1889–1929', peau: 'claire', cheveux: 'noir', coiffure: 'plaque', visage: 1.02, menton: 0.8, tenue: 'costume', cravate: '#3A4660' },
    alekhine: { formeYeux: 'etroits', formeSourcils: 'droit', sourcils: .8,  accessoire: 'chat',  nom: 'Alexandre Alekhine', pays: 'Russie, France', epoque: '1892–1946', monde: true, peau: 'claire', cheveux: 'clair', coiffure: 'arriere', visage: 0.98, menton: 0.82, tenue: 'costume', cravate: '#2F3E5C', yeux: '#5D7186' },
    euwe: { formeYeux: 'ronds', formeSourcils: 'arque',  nom: 'Max Euwe', pays: 'Pays-Bas', epoque: '1901–1981', monde: true, peau: 'rose', cheveux: 'chatain', coiffure: 'degarni', lunettes: 'rondes', visage: 0.95, menton: 0.75, tenue: 'costume', cravate: '#B5651D', sourire: 1, age: 1 },
    botvinnik: { formeYeux: 'etroits', formeSourcils: 'fronce', sourcils: 1.3,  nez: 'long', long: 1,  nom: 'Mikhaïl Botvinnik', pays: 'URSS', epoque: '1911–1995', monde: true, peau: 'claire', cheveux: 'brun', coiffure: 'degarni', lunettes: 'carrees', visage: 1.0, menton: 0.82, tenue: 'costume', cravate: '#5A2A2A', age: 1 },
    keres: { formeYeux: 'amande', formeSourcils: 'arque', sourcils: 1.2, ecart: .3,  nom: 'Paul Keres', pays: 'Estonie', epoque: '1916–1975', peau: 'claire', cheveux: 'chatain', coiffure: 'arriere', visage: 0.96, menton: 0.8, tenue: 'costume', cravate: '#2C5A7A', sourire: 1 },
    smyslov: { formeYeux: 'tombants', formeSourcils: 'arque', touffus: 1, sourcils: 1.3,  nez: 'fort',  nom: 'Vassily Smyslov', pays: 'URSS', epoque: '1921–2010', monde: true, peau: 'rose', cheveux: 'gris', coiffure: 'ondule', visage: 1.06, menton: 0.84, tenue: 'costume', cravate: '#4A3A6A', age: 1, sourire: 1 },
    boleslavski: { formeYeux: 'ronds', formeSourcils: 'droit',  nom: 'Isaac Boleslavski', pays: 'URSS', epoque: '1919–1977', peau: 'claire', cheveux: 'brun', coiffure: 'degarni', lunettes: 'carrees', visage: 1.06, menton: 0.86, tenue: 'costume', cravate: '#2A4A3A' },
    bronstein: { formeYeux: 'ronds', tailleYeux: 1.1, formeSourcils: 'arque', touffus: 1,  oreilles: 1.25, nez: 'fort',  nom: 'David Bronstein', pays: 'URSS', epoque: '1924–2006', peau: 'claire', cheveux: 'noir', coiffure: 'chauve', lunettes: 'carrees', sourcils: 1.6, visage: 1.0, menton: 0.78, tenue: 'costume', cravate: '#6A2A2A', age: 1 },
    najdorf: { formeYeux: 'etroits', formeSourcils: 'arque', sourcils: 1.2,  nom: 'Miguel Najdorf', pays: 'Pologne, Argentine', epoque: '1910–1997', peau: 'mate', cheveux: 'gris', coiffure: 'degarni', visage: 1.08, menton: 0.88, tenue: 'costume', cravate: '#7A5A1A', sourire: 2, age: 2 },
    gligoric: { formeYeux: 'amande', formeSourcils: 'droit', sourcils: 1.3, regardX: .4,  nom: 'Svetozar Gligorić', pays: 'Yougoslavie', epoque: '1923–2012', peau: 'mate', cheveux: 'noir', coiffure: 'ondule', visage: 0.9, menton: 0.72, tenue: 'costume', cravate: '#2A3A6A' },
    petrossian: { formeYeux: 'tombants', formeSourcils: 'tombant', touffus: 1,  nez: 'fort',  nom: 'Tigran Petrossian', pays: 'URSS (Arménie)', epoque: '1929–1984', monde: true, peau: 'olive', cheveux: 'noir', coiffure: 'degarni', sourcils: 1.5, visage: 1.08, menton: 0.86, tenue: 'costume', cravate: '#3A3A3A', yeux: '#2E2622', sourire: 1 },
    tal: { formeYeux: 'enfonces', tailleYeux: 1.1, formeSourcils: 'fronce',  regard: 'intense', nez: 'fort',  nom: 'Mikhaïl Tal', pays: 'URSS (Lettonie)', epoque: '1936–1992', monde: true, peau: 'claire', cheveux: 'noir', coiffure: 'hirsute', sourcils: 1.3, visage: 0.9, menton: 0.7, tenue: 'costume', cravate: '#1E2A44', yeux: '#2A2220' },
    stein: { formeYeux: 'amande', formeSourcils: 'droit', sourcils: 1.5,  nom: 'Leonid Stein', pays: 'URSS (Ukraine)', epoque: '1934–1973', peau: 'claire', cheveux: 'noir', coiffure: 'plaque', visage: 1.04, menton: 0.84, tenue: 'costume', cravate: '#5A3A2A' },
    polougaievski: { formeYeux: 'ronds', formeSourcils: 'arque', sourcils: 1.1,  nom: 'Lev Polougaïevski', pays: 'URSS', epoque: '1934–1995', peau: 'claire', cheveux: 'chatain', coiffure: 'degarni', lunettes: 'carrees', visage: 1.02, menton: 0.84, tenue: 'costume', cravate: '#3A5A7A' },
    spassky: { formeYeux: 'etroits', formeSourcils: 'arque', sourcils: 1.1, ecart: .4,  nez: 'fin',  nom: 'Boris Spassky', pays: 'URSS, France', epoque: '1937–2025', monde: true, peau: 'claire', cheveux: 'blond', coiffure: 'ondule', visage: 1.04, menton: 0.84, tenue: 'costume', cravate: '#2A4A6A', yeux: '#5D7186', sourire: 1 },
    larsen: { formeYeux: 'amande', formeSourcils: 'droit', sourcils: .9,  long: 2, nez: 'long',  nom: 'Bent Larsen', pays: 'Danemark', epoque: '1935–2010', peau: 'rose', cheveux: 'blond', coiffure: 'frange', visage: 0.96, menton: 0.76, tenue: 'col', yeux: '#5D7186' },
    fischer: { formeYeux: 'amande', formeSourcils: 'droit', sourcils: 1.2, regardX: .5, ecart: -.4,  long: 3, nez: 'long',  nom: 'Bobby Fischer', pays: 'États-Unis', epoque: '1943–2008', monde: true, peau: 'claire', cheveux: 'chatain', coiffure: 'meche', visage: 0.92, menton: 0.7, tenue: 'costume', cravate: '#24324E', yeux: '#4E5E4A' },
    andersson: { formeYeux: 'ronds', formeSourcils: 'droit', sourcils: 1.2,  nom: 'Ulf Andersson', pays: 'Suède', epoque: 'né en 1951', peau: 'rose', cheveux: 'chatain', coiffure: 'long', barbe: 'pleine', moustache: 'epaisse', visage: 0.95, menton: 0.78, tenue: 'pull' },
    karpov: { formeYeux: 'etroits', formeSourcils: 'droit', sourcils: .9, ecart: -.3,  long: 2, nez: 'fin',  nom: 'Anatoli Karpov', pays: 'URSS, Russie', epoque: 'né en 1951', monde: true, peau: 'claire', cheveux: 'chatain', coiffure: 'meche', visage: 0.86, menton: 0.66, tenue: 'costume', cravate: '#6A2A3A', yeux: '#4E5E6A' },
    kasparov: { formeYeux: 'enfonces', formeSourcils: 'fronce',  regard: 'intense', nez: 'fort',  nom: 'Garry Kasparov', pays: 'URSS, Russie', epoque: 'né en 1963', monde: true, peau: 'mate', cheveux: 'noir', coiffure: 'courts', sourcils: 1.5, visage: 1.02, menton: 0.86, tenue: 'costume', cravate: '#7A1E1E', yeux: '#3A2A22' },

    // ---------- champions d'aujourd'hui ----------
    carlsen: { nom: 'Magnus Carlsen', pays: 'Norvège', epoque: 'né en 1990', monde: true, peau: 'rose', cheveux: 'chatain', coiffure: 'raie', visage: 0.98, menton: 0.8, tenue: 'costume', cravate: '#2A3A5A', yeux: '#5D7186', formeYeux: 'amande', formeSourcils: 'droit', sourire: 1 },
    gukesh: { nom: 'Gukesh Dommaraju', pays: 'Inde', epoque: 'né en 2006', monde: true, peau: 'olive', cheveux: 'noir', coiffure: 'courts', visage: 0.92, menton: 0.76, tenue: 'col', yeux: '#2E2622', formeYeux: 'ronds', formeSourcils: 'arque', sourcils: 1.2 },
    ding: { nom: 'Ding Liren', pays: 'Chine', epoque: 'né en 1992', monde: true, peau: 'claire', cheveux: 'noir', coiffure: 'courts', lunettes: 'carrees', visage: 1.02, menton: 0.84, tenue: 'costume', cravate: '#3A3A4A', yeux: '#2E2622', formeYeux: 'etroits', formeSourcils: 'droit' },
    nepo: { nom: 'Ian Nepomniachtchi', pays: 'Russie', epoque: 'né en 1990', peau: 'rose', cheveux: 'roux', coiffure: 'ondule', barbe: 'courte', moustache: 'fine', visage: 1.0, menton: 0.82, tenue: 'col', formeYeux: 'amande', formeSourcils: 'arque' },
    caruana: { nom: 'Fabiano Caruana', pays: 'États-Unis, Italie', epoque: 'né en 1992', peau: 'claire', cheveux: 'brun', coiffure: 'courts', visage: 0.9, menton: 0.72, tenue: 'costume', cravate: '#2A4A6A', formeYeux: 'enfonces', formeSourcils: 'droit', nez: 'long', long: 1 },
    nakamura: { nom: 'Hikaru Nakamura', pays: 'États-Unis', epoque: 'né en 1987', peau: 'claire', cheveux: 'noir', coiffure: 'meche', visage: 1.0, menton: 0.84, tenue: 'col', yeux: '#2E2622', formeYeux: 'etroits', formeSourcils: 'droit', sourire: 1 },
    pragg: { nom: 'Rameshbabu Praggnanandhaa', pays: 'Inde', epoque: 'né en 2005', peau: 'olive', cheveux: 'noir', coiffure: 'raie', visage: 0.94, menton: 0.74, tenue: 'col', yeux: '#2E2622', formeYeux: 'ronds', formeSourcils: 'arque', sourire: 1 },
    firouzja: { nom: 'Alireza Firouzja', pays: 'France (né en Iran)', epoque: 'né en 2003', peau: 'mate', cheveux: 'noir', coiffure: 'ondule', visage: 0.88, menton: 0.72, tenue: 'costume', cravate: '#1E2A44', yeux: '#2E2622', formeYeux: 'amande', formeSourcils: 'fronce', sourcils: 1.4 },
    arjun: { nom: 'Arjun Erigaisi', pays: 'Inde', epoque: 'né en 2003', peau: 'olive', cheveux: 'noir', coiffure: 'meche', visage: 1.02, menton: 0.84, tenue: 'col', yeux: '#2E2622', formeYeux: 'amande', formeSourcils: 'droit', sourcils: 1.3 },
    abdusattorov: { nom: 'Nodirbek Abdusattorov', pays: 'Ouzbékistan', epoque: 'né en 2004', peau: 'mate', cheveux: 'noir', coiffure: 'courts', visage: 0.96, menton: 0.8, tenue: 'costume', cravate: '#3A2A4A', yeux: '#2E2622', formeYeux: 'etroits', formeSourcils: 'arque' },
    // ---------- championnes ----------
    polgar: { nom: 'Judit Polgar', pays: 'Hongrie', epoque: 'née en 1976', femme: true, peau: 'claire', cheveux: 'roux', coiffure: 'boucles-longues', visage: 0.9, menton: 0.68, tenue: 'chemisier', haut: '#2E4A6A', formeYeux: 'amande', formeSourcils: 'arque', sourcils: .8, cils: 1, levres: '#C0605A', sourire: 1 },
    krush: { nom: 'Irina Krush', pays: 'États-Unis', epoque: 'née en 1983', femme: true, peau: 'claire', cheveux: 'chatain', coiffure: 'longs', visage: 0.88, menton: 0.66, tenue: 'veste-f', haut: '#D8D2C8', formeYeux: 'amande', formeSourcils: 'arque', sourcils: .8, cils: 1, levres: '#BE6A64' },
    kosteniuk: { nom: 'Alexandra Kosteniuk', pays: 'Russie, Suisse', epoque: 'née en 1984', monde: true, femme: true, peau: 'claire', cheveux: 'blond', coiffure: 'longs', visage: 0.88, menton: 0.66, tenue: 'chemisier', haut: '#6A2A3A', formeYeux: 'amande', formeSourcils: 'arque', sourcils: .7, cils: 1, levres: '#C45A5E', yeux: '#5D7186', sourire: 1 },
    humpy: { nom: 'Koneru Humpy', pays: 'Inde', epoque: 'née en 1987', femme: true, peau: 'olive', cheveux: 'noir', coiffure: 'queue', visage: 0.9, menton: 0.7, tenue: 'chemisier', haut: '#2E6A5A', formeYeux: 'ronds', formeSourcils: 'arque', sourcils: .9, cils: 1, levres: '#A85A50', yeux: '#2E2622' },
    dzagnidze: { nom: 'Nana Dzagnidze', pays: 'Géorgie', epoque: 'née en 1987', femme: true, peau: 'claire', cheveux: 'noir', coiffure: 'longs', visage: 0.9, menton: 0.68, tenue: 'veste-f', haut: '#E8E2D6', formeYeux: 'amande', formeSourcils: 'arque', cils: 1, levres: '#B85A5A', yeux: '#3A2A22' },
    lagno: { nom: 'Kateryna Lagno', pays: 'Ukraine, Russie', epoque: 'née en 1989', femme: true, peau: 'claire', cheveux: 'blond', coiffure: 'chignon', visage: 0.9, menton: 0.7, tenue: 'veste-f', haut: '#F0ECE4', formeYeux: 'amande', formeSourcils: 'arque', sourcils: .8, cils: 1, levres: '#C06064', yeux: '#5D7186', boucles: '#E8D9A0' },
    amuzychuk: { nom: 'Anna Muzychuk', pays: 'Ukraine', epoque: 'née en 1990', femme: true, peau: 'claire', cheveux: 'blond', coiffure: 'longs', visage: 0.9, menton: 0.68, tenue: 'chemisier', haut: '#2E4A7A', formeYeux: 'tombants', formeSourcils: 'arque', sourcils: .8, cils: 1, levres: '#BE6264', yeux: '#4E6A7A' },
    ju: { nom: 'Ju Wenjun', pays: 'Chine', epoque: 'née en 1991', monde: true, femme: true, peau: 'claire', cheveux: 'noir', coiffure: 'longs', visage: 0.94, menton: 0.72, tenue: 'veste-f', haut: '#B8323A', formeYeux: 'etroits', formeSourcils: 'droit', sourcils: .8, cils: 1, levres: '#B85A5A', yeux: '#2E2622', sourire: 1 },
    tan: { nom: 'Tan Zhongyi', pays: 'Chine', epoque: 'née en 1991', monde: true, femme: true, peau: 'claire', cheveux: 'noir', coiffure: 'carre', visage: 0.94, menton: 0.74, tenue: 'chemisier', haut: '#3A5A8A', formeYeux: 'etroits', formeSourcils: 'arque', sourcils: .8, cils: 1, levres: '#B4625E', yeux: '#2E2622' },
    mmuzychuk: { nom: 'Mariya Muzychuk', pays: 'Ukraine', epoque: 'née en 1992', monde: true, femme: true, peau: 'claire', cheveux: 'chatain', coiffure: 'queue', visage: 0.9, menton: 0.7, tenue: 'chemisier', haut: '#E4C04A', formeYeux: 'tombants', formeSourcils: 'arque', sourcils: .8, cils: 1, levres: '#BE6264', yeux: '#4E6A7A' },
    lei: { nom: 'Lei Tingjie', pays: 'Chine', epoque: 'née en 1997', femme: true, peau: 'claire', cheveux: 'noir', coiffure: 'carre', visage: 0.96, menton: 0.76, tenue: 'chemisier', haut: '#8A3A6A', formeYeux: 'ronds', formeSourcils: 'droit', sourcils: .8, cils: 1, levres: '#BA5E62', yeux: '#2E2622', sourire: 2 },
    goryachkina: { nom: 'Aleksandra Goryachkina', pays: 'Russie', epoque: 'née en 1998', femme: true, peau: 'claire', cheveux: 'chatain', coiffure: 'longs', visage: 0.94, menton: 0.72, tenue: 'chemisier', haut: '#4A4A6A', formeYeux: 'amande', formeSourcils: 'droit', sourcils: .8, cils: 1, levres: '#BC6A66', yeux: '#5A6A5A' },
    vaishali: { nom: 'Vaishali Rameshbabu', pays: 'Inde', epoque: 'née en 2001', femme: true, peau: 'olive', cheveux: 'noir', coiffure: 'queue', visage: 0.92, menton: 0.72, tenue: 'chemisier', haut: '#C4683A', formeYeux: 'ronds', formeSourcils: 'arque', sourcils: .9, cils: 1, levres: '#A85A50', yeux: '#2E2622', sourire: 1 },
    zhu: { nom: 'Zhu Jiner', pays: 'Chine', epoque: 'née en 2002', femme: true, peau: 'claire', cheveux: 'noir', coiffure: 'carre', visage: 0.92, menton: 0.72, tenue: 'chemisier', haut: '#5A8AB8', formeYeux: 'ronds', formeSourcils: 'droit', sourcils: .8, cils: 1, levres: '#C06A6A', yeux: '#2E2622' },
    assaubayeva: { nom: 'Bibisara Assaubayeva', pays: 'Kazakhstan', epoque: 'née en 2004', femme: true, peau: 'claire', cheveux: 'brun', coiffure: 'longs', visage: 0.92, menton: 0.7, tenue: 'veste-f', haut: '#E8E4DC', formeYeux: 'amande', formeSourcils: 'arque', sourcils: .9, cils: 1, levres: '#BC5E62', yeux: '#3A2A22' },
    divya: { nom: 'Divya Deshmukh', pays: 'Inde', epoque: 'née en 2005', femme: true, peau: 'olive', cheveux: 'noir', coiffure: 'longs', visage: 0.92, menton: 0.72, tenue: 'chemisier', haut: '#2E5A8A', formeYeux: 'ronds', formeSourcils: 'arque', sourcils: .9, cils: 1, levres: '#A85A50', yeux: '#2E2622', sourire: 1 },
  };

  let compteur = 0;
  const f = n => +n.toFixed(1);

  function svg(cle, { titre = false } = {}) {
    const c = CHAMPIONS[cle];
    if (!c) return autres();
    const id = 'pt' + (++compteur);
    const peau = PEAU[c.peau] || PEAU.claire;
    const ch = CHEVEUX[c.cheveux] || CHEVEUX.brun;
    const w = 18.5 * (c.visage || 1);          // demi-largeur du visage
    const menton = c.menton || 0.78;           // 0,6 menton pointu … 0,9 mâchoire carrée
    const cx = 50, haut = 19, yeux = 45, bas = 70 + (c.long || 0);
    const sourcils = c.sourcils || 1;
    const age = c.age || 0;
    const sombre = ombre(peau, 0.78), tresSombre = ombre(peau, 0.6);

    // forme du visage
    const tete = `M${cx} ${haut}C${f(cx + w * 1.08)} ${haut} ${f(cx + w)} ${yeux - 12} ${f(cx + w)} ${yeux}` +
      `C${f(cx + w)} ${yeux + 12} ${f(cx + w * menton)} ${bas - 4} ${cx} ${bas}` +
      `C${f(cx - w * menton)} ${bas - 4} ${f(cx - w)} ${yeux + 12} ${f(cx - w)} ${yeux}` +
      `C${f(cx - w)} ${yeux - 12} ${f(cx - w * 1.08)} ${haut} ${cx} ${haut}Z`;

    let s = `<svg viewBox="11 7 78 78" xmlns="http://www.w3.org/2000/svg" class="portrait" role="img" aria-label="Portrait dessiné de ${c.nom}">`;
    if (titre) s += `<title>${c.nom}</title>`;
    s += `<defs>
      <radialGradient id="${id}f" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="${c.sepia ? '#F3E6CF' : '#E7EEF3'}"/><stop offset="1" stop-color="${c.sepia ? '#C9B08A' : '#AFC2CF'}"/></radialGradient>
      <radialGradient id="${id}p" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="${eclair(peau, 1.07)}"/><stop offset=".65" stop-color="${peau}"/><stop offset="1" stop-color="${sombre}"/></radialGradient>
      <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${eclair(ch, 1.35)}"/><stop offset="1" stop-color="${ch}"/></linearGradient>
      <linearGradient id="${id}v" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.tenue === 'pull' ? '#7A5A44' : '#4A5060'}"/><stop offset="1" stop-color="${c.tenue === 'pull' ? '#4E3626' : '#22262E'}"/></linearGradient>
      <clipPath id="${id}t"><path d="${tete}"/></clipPath>
      ${c.sepia ? `<filter id="${id}s" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".33 .62 .15 0 0 .28 .55 .13 0 0 .21 .42 .10 0 0 0 0 0 1 0"/></filter>` : ''}
    </defs>`;
    s += `<rect width="100" height="100" fill="url(#${id}f)"/><ellipse cx="50" cy="104" rx="60" ry="30" fill="#000" opacity=".08"/>`;
    s += `<g${c.sepia ? ` filter="url(#${id}s)"` : ''}>`;

    // cheveux longs derrière la tête
    if (c.coiffure === 'long') s += `<path d="M${f(cx - w - 4)} 40C${f(cx - w - 8)} 60 ${f(cx - w - 6)} 76 ${f(cx - w + 2)} 82H${f(cx + w - 2)}C${f(cx + w + 6)} 76 ${f(cx + w + 8)} 60 ${f(cx + w + 4)} 40Z" fill="${ombre(ch, 0.8)}"/>`;
    if (c.coiffure === 'longs') s += `<path d="M${f(cx - w - 3)} 34C${f(cx - w - 7)} 58 ${f(cx - w - 7)} 80 ${f(cx - w - 2)} 88H${f(cx + w + 2)}C${f(cx + w + 7)} 80 ${f(cx + w + 7)} 58 ${f(cx + w + 3)} 34Z" fill="${ombre(ch, 0.78)}"/>`;
    if (c.coiffure === 'carre') s += `<path d="M${f(cx - w - 3)} 34C${f(cx - w - 6)} 52 ${f(cx - w - 5)} 64 ${f(cx - w)} 68H${f(cx + w)}C${f(cx + w + 5)} 64 ${f(cx + w + 6)} 52 ${f(cx + w + 3)} 34Z" fill="${ombre(ch, 0.78)}"/>`;
    if (c.coiffure === 'boucles-longues') {
      let d = `M${f(cx - w - 4)} 30`;
      for (let k = 0; k < 6; k++) d += `q-4 3 -1 7`;
      d += `L${f(cx + w + 4)} 72`; for (let k = 0; k < 6; k++) d += `q3 -4 1 -7`;
      s += `<path d="${d}Z" fill="${ombre(ch, 0.8)}"/><path d="M${f(cx - w - 6)} 62Q${cx} 92 ${f(cx + w + 6)} 62L${f(cx + w + 4)} 84H${f(cx - w - 4)}Z" fill="${ombre(ch, 0.75)}"/>`;
    }
    if (c.coiffure === 'queue') s += `<path d="M${f(cx + w + 1)} 40C${f(cx + w + 8)} 46 ${f(cx + w + 7)} 66 ${f(cx + w + 3)} 76C${f(cx + w + 1)} 66 ${f(cx + w + 2)} 52 ${f(cx + w - 2)} 44Z" fill="${ombre(ch, 0.8)}"/>`;

    // épaules et tenue
    s += `<path d="M2 100C4 86 16 79 33 76L50 83L67 76C84 79 96 86 98 100Z" fill="url(#${id}v)"/>`;
    s += `<path d="M42 60V77Q50 83 58 77V60Z" fill="${sombre}"/>`;
    s += `<path d="M42 66Q50 73 58 66V62H42Z" fill="${tresSombre}" opacity=".35"/>`;
    if (c.tenue === 'chemisier' || c.tenue === 'veste-f') {
      // encolure arrondie, haut de couleur ; la veste ajoute des revers
      s += `<path d="M38 75Q50 88 62 75L67 76C76 78 86 84 90 100H10C14 84 24 78 33 76Z" fill="${c.haut || '#7A4A6A'}"/>`;
      s += `<path d="M38 75Q50 88 62 75" fill="none" stroke="${ombre(c.haut || '#7A4A6A', .7)}" stroke-width="1.2"/>`;
      if (c.tenue === 'veste-f') s += `<path d="M2 100C4 86 16 79 33 76L44 96L36 100Z" fill="url(#${id}v)"/><path d="M98 100C96 86 84 79 67 76L56 96L64 100Z" fill="url(#${id}v)"/>`;
      if (c.collier) s += `<path d="M42 74Q50 83 58 74" fill="none" stroke="#F3EFE6" stroke-width="1.1" stroke-dasharray=".1 1.8" stroke-linecap="round"/>`;
    } else if (c.tenue === 'pull') {
      s += `<path d="M36 76Q50 86 64 76L62 74Q50 82 38 74Z" fill="#5E4232"/>`;
    } else if (c.tenue === 'col') {
      s += `<path d="M38 75L50 90L62 75L57 73L50 81L43 73Z" fill="#F4F1EA"/><path d="M43 73L50 81L46 86L39 76Z" fill="#E2DED4"/>`;
    } else {
      s += `<path d="M39 75L50 95L61 75L57 73L50 81L43 73Z" fill="#F7F5F0"/>`;
      if (c.tenue === 'noeud') s += `<path d="M50 81L43 77.5V84.5ZM50 81L57 77.5V84.5Z" fill="#1E1E22"/><circle cx="50" cy="81" r="1.6" fill="#2A2A30"/>`;
      else s += `<path d="M48 80.5H52L53.2 84L51.4 97L50 99L48.6 97L46.8 84Z" fill="${c.cravate || '#5A2A2A'}"/><path d="M48 80.5H52L51.2 83.5H48.8Z" fill="${ombre(c.cravate || '#5A2A2A', .75)}"/>`;
      // revers de la veste
      s += `<path d="M33 76L39 75L50 99L41 92Z" fill="#000" opacity=".22"/><path d="M67 76L61 75L50 99L59 92Z" fill="#000" opacity=".22"/>`;
    }

    // oreilles
    const ro = c.oreilles || 1;
    for (const sx of [-1, 1]) s += `<ellipse cx="${f(cx + sx * (w - 0.5 + ro))}" cy="${yeux + 3}" rx="${f(3.4 * ro)}" ry="${f(6 * ro)}" fill="${sombre}"/><ellipse cx="${f(cx + sx * (w - 0.2))}" cy="${yeux + 3}" rx="1.6" ry="3.6" fill="${tresSombre}" opacity=".45"/>`;

    if (c.boucles) for (const sx of [-1, 1]) s += `<circle cx="${f(cx + sx * (w + .3))}" cy="${yeux + 9.5}" r="1.3" fill="${c.boucles}"/>`;
    // visage
    s += `<path d="${tete}" fill="url(#${id}p)"/>`;
    s += `<g clip-path="url(#${id}t)">`;
    // modelé : joues et ombre sous les pommettes
    s += `<ellipse cx="${f(cx - w * .55)}" cy="${yeux + 9}" rx="5" ry="3.2" fill="#E07A6A" opacity=".16"/><ellipse cx="${f(cx + w * .55)}" cy="${yeux + 9}" rx="5" ry="3.2" fill="#E07A6A" opacity=".16"/>`;
    s += `<path d="M${f(cx + w - 3)} ${yeux - 6}Q${f(cx + w + 2)} ${yeux + 10} ${f(cx + w * .55)} ${bas - 4}L${f(cx + w + 3)} ${bas}V${yeux - 8}Z" fill="${tresSombre}" opacity=".18"/>`;
    // orbites, ombre sous le nez, sous la lèvre, lumière sur le nez et le menton
    s += `<ellipse cx="${cx - 7.6}" cy="${yeux - 1.5}" rx="5.5" ry="3.6" fill="${tresSombre}" opacity=".16"/><ellipse cx="${cx + 7.6}" cy="${yeux - 1.5}" rx="5.5" ry="3.6" fill="${tresSombre}" opacity=".2"/>`;
    s += `<ellipse cx="${cx}" cy="${yeux + 12.6}" rx="3.6" ry="1.1" fill="${tresSombre}" opacity=".25"/><ellipse cx="${cx}" cy="${yeux + 20.4}" rx="3.4" ry="1.2" fill="${tresSombre}" opacity=".22"/>`;
    s += `<path d="M${cx - .2} ${yeux + 3}L${cx - .8} ${yeux + 9}" stroke="#FFF" stroke-width="1.1" stroke-linecap="round" opacity=".28"/><ellipse cx="${cx}" cy="${bas - 3.5}" rx="4" ry="2" fill="#FFF" opacity=".14"/>`;
    s += `<path d="M${f(cx - w)} ${haut + 6}Q${cx} ${haut - 4} ${f(cx + w)} ${haut + 6}V${haut - 6}H${f(cx - w)}Z" fill="${tresSombre}" opacity=".0"/>`;
    // rides de l'âge
    if (age) {
      s += `<path d="M${cx - 8} ${haut + 9}Q${cx} ${haut + 7.5} ${cx + 8} ${haut + 9}" fill="none" stroke="${tresSombre}" stroke-width=".6" opacity=".5"/>`;
      if (age > 1) s += `<path d="M${cx - 6} ${haut + 12}Q${cx} ${haut + 11} ${cx + 6} ${haut + 12}" fill="none" stroke="${tresSombre}" stroke-width=".5" opacity=".45"/>`;
      s += `<path d="M${cx - 6.5} 55Q${cx - 8.5} 60 ${cx - 7} 63M${cx + 6.5} 55Q${cx + 8.5} 60 ${cx + 7} 63" fill="none" stroke="${tresSombre}" stroke-width=".6" opacity=".45"/>`;
    }
    s += `</g>`;

    // yeux : forme (amande, ronds, étroits, tombants, enfoncés), taille, écart, direction du regard
    const FORMES = { amande: [2.9, 2.2, 0, 3.8], ronds: [3.4, 2.8, 0, 3.4], etroits: [1.9, 1.5, 0, 4], tombants: [2.6, 2, 1.3, 3.8], enfonces: [2.3, 1.9, .2, 3.7] };
    const [hautOeil, basOeil, chute, largeOeil] = FORMES[c.formeYeux || 'amande'];
    const ty = c.tailleYeux || 1, intense = c.regard === 'intense' || c.formeYeux === 'enfonces';
    for (const sx of [-1, 1]) {
      const x = cx + sx * (7.6 + (c.ecart || 0));
      const ew = largeOeil * ty, xi = x - sx * ew, xo = x + sx * ew, yi = yeux - (chute ? .3 : 0), yo = yeux + chute;
      const contour = `M${f(xi)} ${f(yi)}Q${f(x - sx * .4)} ${f(yeux - hautOeil * ty * 1.3)} ${f(xo)} ${f(yo)}Q${f(x)} ${f(yeux + basOeil * ty * 1.2)} ${f(xi)} ${f(yi)}Z`;
      // orbite plus creuse pour les yeux enfoncés
      if (c.formeYeux === 'enfonces') s += `<ellipse cx="${f(x)}" cy="${yeux - 1.8}" rx="${f(ew + 1.6)}" ry="3.8" fill="${tresSombre}" opacity=".28"/>`;
      s += `<clipPath id="${id}o${sx + 1}"><path d="${contour}"/></clipPath><path d="${contour}" fill="#FBFAF7"/>`;
      const ix = x + (c.regardX || 0) + sx * .15, iy = yeux - .15 + (chute ? .3 : 0), ri = 1.75 * ty * (c.formeYeux === 'ronds' ? 1.05 : 1);
      s += `<g clip-path="url(#${id}o${sx + 1})"><circle cx="${f(ix)}" cy="${f(iy)}" r="${f(ri)}" fill="${c.yeux || '#5A4632'}"/><circle cx="${f(ix)}" cy="${f(iy)}" r="${f(ri * .78)}" fill="none" stroke="#000" stroke-width=".35" opacity=".25"/>` +
        `<circle cx="${f(ix)}" cy="${f(iy)}" r="${f(ri * .46)}" fill="#141210"/><circle cx="${f(ix + .55)}" cy="${f(iy - .6)}" r=".45" fill="#FFF"/>` +
        `<path d="M${f(xi)} ${f(yi - 3)}H${f(xo)}V${f(yeux - hautOeil * .45)}H${f(xi)}Z" fill="${tresSombre}" opacity=".18"/></g>`;
      // paupière (trait épais en haut), pli au-dessus, cerne léger en bas
      s += `<path d="M${f(xi - sx * .2)} ${f(yi + .1)}Q${f(x - sx * .4)} ${f(yeux - hautOeil * ty * 1.3 - .3)} ${f(xo + sx * .3)} ${f(yo + .1)}" fill="none" stroke="#24180F" stroke-width="${intense ? 1.5 : 1}" stroke-linecap="round"/>`;
      s += `<path d="M${f(xi + sx * .4)} ${f(yi - 1.6)}Q${f(x)} ${f(yeux - hautOeil * ty * 1.3 - 2.4)} ${f(xo - sx * .2)} ${f(yo - 1.4)}" fill="none" stroke="${tresSombre}" stroke-width=".55" opacity="${intense ? .9 : .5}"/>`;
      s += `<path d="M${f(xi + sx * .8)} ${f(yi + basOeil + .9)}Q${f(x)} ${f(yeux + basOeil * ty * 1.2 + 1.3)} ${f(xo - sx * .6)} ${f(yo + 1.1)}" fill="none" stroke="${tresSombre}" stroke-width=".5" opacity="${c.age ? .7 : .4}"/>`;
      if (c.cils) s += `<path d="M${f(xo)} ${f(yo)}l${f(sx * 1.4)} -1.1M${f(xo - sx * 1.2)} ${f(yo - 1.2)}l${f(sx * 1)} -1.3" stroke="#24180F" stroke-width=".7" stroke-linecap="round"/>`;
      // sourcils : arqué, droit, tombant, froncé ; touffus ou fins
      const ep = 1.2 * sourcils, forme = c.formeSourcils || 'arque';
      const SOURCILS = { arque: [-4.6, -7.4, -5.2, .4], droit: [-5, -5.9, -5.3, .5], tombant: [-5.8, -6.8, -3.9, .3], fronce: [-3.8, -5.6, -5.8, .5] };
      const [yIn, yPic, yOut, posPic] = SOURCILS[forme].map((v, k) => (k < 3 ? yeux + v - (chute && k === 2 ? -.4 : 0) : v));
      const bi = x - sx * 4.6, bo = x + sx * 4.9, bp = bi + (bo - bi) * posPic;
      const sc = c.cheveux === 'blanc' || c.cheveux === 'gris' ? ombre(ch, .7) : ombre(ch, .85);
      // forme effilée : épaisse côté nez, fine vers l'extérieur
      s += `<path d="M${f(bi)} ${f(yIn - ep * .6)}Q${f(bp)} ${f(yPic - ep * .7)} ${f(bo)} ${f(yOut - ep * .2)}Q${f(bp)} ${f(yPic + ep * .45)} ${f(bi)} ${f(yIn + ep * .55)}Z" fill="${sc}"/>`;
      // touffus : un second sourcil plus large et plus clair, au bord irrégulier
      if (c.touffus) s += `<path d="M${f(bi - sx * .6)} ${f(yIn - ep)}Q${f(bp)} ${f(yPic - ep * 1.25)} ${f(bo + sx * .6)} ${f(yOut - ep * .5)}L${f(bo)} ${f(yOut + ep * .3)}Q${f(bp)} ${f(yPic + ep * .9)} ${f(bi)} ${f(yIn + ep * .9)}Z" fill="${sc}" opacity=".45"/>`;
    }
    // nez (fin, normal, fort, long)
    const nz = { fin: .85, fort: 1.3, long: 1.05 }[c.nez] || 1, nl = c.nez === 'long' ? 1.5 : c.nez === 'fort' ? 1 : 0;
    s += `<path d="M${cx - .6} ${yeux + 1}C${cx - 1.2} ${yeux + 6 + nl} ${f(cx - 3.4 * nz)} ${yeux + 9 + nl} ${f(cx - 2.6 * nz)} ${yeux + 10.8 + nl}C${f(cx - 1.6 * nz)} ${yeux + 12.2 + nl} ${f(cx + 1.6 * nz)} ${yeux + 12.2 + nl} ${f(cx + 2.8 * nz)} ${yeux + 10.8 + nl}" fill="none" stroke="${tresSombre}" stroke-width=".7" stroke-linecap="round" opacity=".5"/>`;
    s += `<ellipse cx="${f(cx - 1.8 * nz)}" cy="${yeux + 11.2 + nl}" rx="${f(.9 * nz)}" ry=".55" fill="${tresSombre}" opacity=".55"/><ellipse cx="${f(cx + 1.8 * nz)}" cy="${yeux + 11.2 + nl}" rx="${f(.9 * nz)}" ry=".55" fill="${tresSombre}" opacity=".55"/>`;
    if (nz > 1) s += `<path d="M${cx - 2.2} ${yeux + 3}C${cx - 2.6} ${yeux + 7} ${cx - 4.6} ${yeux + 9 + nl} ${cx - 3.6} ${yeux + 11 + nl}" fill="none" stroke="${tresSombre}" stroke-width="1.2" opacity=".18"/>`;
    s += `<path d="M${cx + 1} ${yeux + 2}C${cx + 1.8} ${yeux + 6} ${cx + 3.2} ${yeux + 8} ${cx + 3.2} ${yeux + 10}" fill="none" stroke="${tresSombre}" stroke-width="1.6" opacity=".18"/>`;
    // bouche
    const sr = c.sourire || 0;
    const yb = yeux + 16.2 + (c.long || 0) * .4;
    s += `<path d="M${cx - 5} ${f(yb - sr * .4)}Q${cx - 2.5} ${f(yb - 1.6)} ${cx} ${f(yb - .9)}Q${cx + 2.5} ${f(yb - 1.6)} ${cx + 5} ${f(yb - sr * .4)}Q${cx} ${f(yb + .6 + sr * .9)} ${cx - 5} ${f(yb - sr * .4)}Z" fill="${c.levres || '#B0645A'}" opacity="${c.levres ? .8 : .55}"/>`;
    s += `<path d="M${cx - 5} ${f(yb - sr * .4)}Q${cx} ${f(yb + 1.4 + sr * .9)} ${cx + 5} ${f(yb - sr * .4)}" fill="none" stroke="#8A4038" stroke-width="1" stroke-linecap="round"/>`;
    s += `<path d="M${cx - 3.2} ${yeux + 18.4}Q${cx} ${yeux + 19.8} ${cx + 3.2} ${yeux + 18.4}" fill="none" stroke="#B86A5E" stroke-width=".9" stroke-linecap="round" opacity=".55"/>`;

    // barbe, moustache
    if (c.barbe) s += barbe(c.barbe, cx, w, yeux, bas, ch, id);
    if (c.moustache) s += moustache(c.moustache, cx, yeux, ch);

    // coiffure
    s += coiffure(c.coiffure, cx, w, haut, yeux, ch, id);

    // lunettes
    if (c.lunettes) s += lunettes(c.lunettes, cx, w, yeux);
    // accessoires : le cigare de Lasker, le chat d'Alekhine
    if (c.accessoire === 'cigare') s += `<g transform="rotate(12 ${cx + 4} ${yeux + 17})"><rect x="${cx + 3}" y="${yeux + 15.8}" width="17" height="3.2" rx="1.4" fill="#6B4226"/><rect x="${cx + 7}" y="${yeux + 15.8}" width="2.4" height="3.2" fill="#C9A24A"/><rect x="${cx + 18.6}" y="${yeux + 15.8}" width="2.4" height="3.2" rx="1" fill="#B8B2A8"/></g><path d="M${cx + 23} ${yeux + 18}c2-3-1-5 1-8s-1-5 1-7" fill="none" stroke="#FFF" stroke-width="1" opacity=".55" stroke-linecap="round"/>`;
    if (c.accessoire === 'chat') s += chat();
    s += `</g></svg>`;
    return s;
  }

  function coiffure(type, cx, w, haut, yeux, ch, id) {
    const g = `url(#${id}c)`, fonce = ombre(ch, .7);
    const L = f(cx - w - 1.5), R = f(cx + w + 1.5);
    const meches = (d, n = 1) => `<path d="${d}" fill="none" stroke="${fonce}" stroke-width="${n * .5}" opacity=".55" stroke-linecap="round"/>`;
    switch (type) {
      case 'raie': // raie sur le côté, cheveux plats
        return `<path d="M${L} ${yeux - 1}C${f(L - 1)} 24 ${cx - 12} 13.5 ${cx + 2} 13.5C${cx + 15} 13.5 ${R + 1} 24 ${R} ${yeux - 1}C${R - 1.5} 33 ${cx + 12} 26 ${cx + 2} 25C${cx - 6} 24.5 ${cx - 9} 27 ${cx - 11} 30C${cx - 13} 33 ${L + 2} 36 ${L} ${yeux - 1}Z" fill="${g}"/>` +
          meches(`M${cx - 9} 18Q${cx - 2} 16 ${cx + 6} 19M${cx - 13} 23Q${cx - 5} 20 ${cx + 4} 22`);
      case 'plaque': // gominés en arrière, raie
        return `<path d="M${L} ${yeux - 2}C${f(L - .5)} 25 ${cx - 11} 14 ${cx} 14C${cx + 12} 14 ${R + .5} 25 ${R} ${yeux - 2}C${R - 1} 33 ${cx + 10} 24.5 ${cx} 24C${cx - 10} 24.5 ${L + 1} 33 ${L} ${yeux - 2}Z" fill="${g}"/>` +
          `<path d="M${cx - 6} 15.2Q${cx - 6.5} 19 ${cx - 7.5} 24.3" fill="none" stroke="${eclair(ch, 1.8)}" stroke-width=".7" opacity=".7"/>` +
          meches(`M${cx - 2} 16Q${cx + 6} 17 ${cx + 13} 24M${cx - 3} 19Q${cx + 5} 20 ${cx + 12} 28M${cx - 11} 18Q${cx - 13} 22 ${cx - 15} 28`);
      case 'arriere': // coiffés vers l'arrière, front dégagé
        return `<path d="M${L} ${yeux - 3}C${f(L - 1)} 24 ${cx - 12} 12 ${cx} 12C${cx + 12} 12 ${R + 1} 24 ${R} ${yeux - 3}C${R - 1.2} 31 ${cx + 11} 23 ${cx} 22.5C${cx - 11} 23 ${L + 1.2} 31 ${L} ${yeux - 3}Z" fill="${g}"/>` +
          meches(`M${cx - 8} 22Q${cx - 6} 16 ${cx - 2} 13M${cx} 22Q${cx + 1} 16 ${cx + 4} 12.6M${cx + 8} 23Q${cx + 9} 17 ${cx + 11} 14.5`);
      case 'degarni': // front très dégarni, cheveux sur les côtés
        return `<path d="M${L} ${yeux - 1}C${f(L - 1)} 30 ${cx - 13} 16 ${cx - 6} 15C${cx - 9} 19 ${L + 3} 26 ${L + 2.5} ${yeux - 4}Z" fill="${g}"/>` +
          `<path d="M${R} ${yeux - 1}C${R + 1} 30 ${cx + 13} 16 ${cx + 6} 15C${cx + 9} 19 ${R - 3} 26 ${R - 2.5} ${yeux - 4}Z" fill="${g}"/>` +
          `<path d="M${cx - 6} 15C${cx - 3} 14 ${cx + 3} 14 ${cx + 6} 15C${cx + 3} 16.5 ${cx - 3} 16.5 ${cx - 6} 15Z" fill="${g}" opacity=".55"/>`;
      case 'chauve': // crâne chauve, couronne de cheveux au-dessus des oreilles
        return `<path d="M${L - .5} ${yeux + 1}C${L - 1} 34 ${L + 1} 30 ${L + 3.5} 28C${L + 2.5} 33 ${L + 2.5} 37 ${L + 3} ${yeux - 2}Z" fill="${g}"/>` +
          `<path d="M${R + .5} ${yeux + 1}C${R + 1} 34 ${R - 1} 30 ${R - 3.5} 28C${R - 2.5} 33 ${R - 2.5} 37 ${R - 3} ${yeux - 2}Z" fill="${g}"/>` +
          `<ellipse cx="${cx - 5}" cy="23" rx="6" ry="3" fill="#FFF" opacity=".22"/>`;
      case 'couronne': // dégarni sur le dessus, cheveux bouffants sur les côtés (Lasker)
        return `<path d="M${L - 2} ${yeux}C${L - 4} 32 ${L - 1} 22 ${cx - 9} 17.5C${cx - 10} 22 ${L + 3} 27 ${L + 2.5} ${yeux - 4}Z" fill="${g}"/>` +
          `<path d="M${R + 2} ${yeux}C${R + 4} 32 ${R + 1} 22 ${cx + 9} 17.5C${cx + 10} 22 ${R - 3} 27 ${R - 2.5} ${yeux - 4}Z" fill="${g}"/>` +
          meches(`M${L} 30Q${L + 1} 24 ${cx - 10} 20M${R} 30Q${R - 1} 24 ${cx + 10} 20`, 1.2);
      case 'boucles': { // cheveux bouclés en volume : contour festonné et petites boucles
        const n = 12, pt = i => { const a = Math.PI * (1.08 - i / n * 1.16); return [cx + Math.cos(a) * (w + 2.6), 31 - Math.sin(a) * 18]; };
        let d = `M${L - 1} ${yeux - 1}L${f(pt(0)[0])} ${f(pt(0)[1])}`;
        for (let i = 1; i <= n; i++) {
          const [x, y] = pt(i);
          d += `A2.6 2.6 0 0 1 ${f(x)} ${f(y)}`;
        }
        d += `L${R + 1} ${yeux - 1}C${R - 1} 31 ${cx + 10} 25 ${cx + 3} 25.5C${cx - 1} 23 ${cx - 6} 26 ${cx - 9} 25C${cx - 13} 26 ${L + 1} 31 ${L - 1} ${yeux - 1}Z`;
        let b = `<path d="${d}" fill="${g}"/>`;
        const pts = [[-13, 26], [-9, 19], [-3, 15.5], [4, 15], [10, 18], [14, 24], [-6, 22], [1, 20], [8, 22.5]];
        for (const [dx, y] of pts) b += `<path d="M${f(cx + dx - 2)} ${y + 1}a2.2 2.2 0 1 1 3.6 1.4" fill="none" stroke="${fonce}" stroke-width=".6" opacity=".7"/>`;
        return b;
      }
      case 'ondule': // cheveux ondulés coiffés en arrière, volume
        return `<path d="M${L - .5} ${yeux - 2}C${L - 2} 22 ${cx - 13} 10.5 ${cx + 1} 10.5C${cx + 14} 10.5 ${R + 2} 22 ${R + .5} ${yeux - 2}C${R - 1} 31 ${cx + 12} 23 ${cx + 4} 22C${cx} 25 ${cx - 5} 21.5 ${cx - 8} 24C${cx - 12} 25 ${L + 1} 31 ${L - .5} ${yeux - 2}Z" fill="${g}"/>` +
          meches(`M${cx - 12} 22Q${cx - 9} 15 ${cx - 2} 13M${cx - 4} 21Q${cx} 15 ${cx + 7} 13.5M${cx + 5} 21Q${cx + 9} 16 ${cx + 14} 17`, 1.2);
      case 'meche': // raie sur le côté, mèche qui tombe sur le front (Fischer, Karpov)
        return `<path d="M${L} ${yeux - 1}C${L - 1} 23 ${cx - 11} 12.5 ${cx + 1} 12.5C${cx + 14} 12.5 ${R + 1.5} 23 ${R} ${yeux - 1}C${R - 1} 32 ${cx + 13} 26 ${cx + 7} 27C${cx + 2} 28 ${cx - 6} 26 ${cx - 11} 30C${cx - 14} 32 ${L + 1.5} 36 ${L} ${yeux - 1}Z" fill="${g}"/>` +
          `<path d="M${cx - 9} 15.5Q${cx - 9.5} 19 ${cx - 10.5} 23" fill="none" stroke="${eclair(ch, 1.6)}" stroke-width=".7" opacity=".7"/>` +
          meches(`M${cx - 8} 16Q${cx + 3} 17 ${cx + 12} 26M${cx - 6} 20Q${cx + 2} 21 ${cx + 9} 26.5`, 1.1);
      case 'hirsute': // cheveux en bataille (Tal)
        return `<path d="M${L - 1} ${yeux - 1}L${L - 3} 33L${L - 1} 30L${L - 2} 23L${cx - 12} 19L${cx - 12} 13L${cx - 6} 14L${cx - 3} 9.5L${cx + 2} 12.5L${cx + 7} 10L${cx + 9} 14L${cx + 15} 14L${R} 21L${R + 2.5} 27L${R + 1} 31L${R + 2} 36L${R} ${yeux - 1}C${R - 2} 31 ${cx + 10} 27 ${cx + 6} 26L${cx + 4} 29L${cx} 26L${cx - 4} 29L${cx - 7} 26C${cx - 12} 27 ${L + 2} 32 ${L - 1} ${yeux - 1}Z" fill="${g}"/>` +
          meches(`M${cx - 10} 24L${cx - 7} 17M${cx - 2} 24L${cx} 15M${cx + 6} 24L${cx + 9} 17`, 1.2);
      case 'courts': // cheveux courts et drus (Kasparov)
        return `<path d="M${L} ${yeux - 3}C${L - 1} 23 ${cx - 12} 12 ${cx} 12C${cx + 12} 12 ${R + 1} 23 ${R} ${yeux - 3}C${R - 1} 32 ${cx + 12} 25 ${cx + 6} 25.5C${cx + 2} 23.5 ${cx - 3} 25.5 ${cx - 7} 24.5C${cx - 12} 25 ${L + 1} 32 ${L} ${yeux - 3}Z" fill="${g}"/>` +
          `<path d="M${cx - 12} 22q1.5-2 3 0q1.5-2 3 0q1.5-2 3 0q1.5-2 3 0q1.5-2 3 0q1.5-2 3 0q1.5-2 3 0q1.5-2 3 0" fill="none" stroke="${fonce}" stroke-width=".6" opacity=".6"/>`;
      case 'frange': // grosse chevelure avec frange (Larsen)
        return `<path d="M${L - 2} ${yeux + 2}C${L - 4} 22 ${cx - 13} 10 ${cx} 10C${cx + 13} 10 ${R + 4} 22 ${R + 2} ${yeux + 2}L${R - 1} ${yeux - 4}C${R - 2} 33 ${cx + 12} 30 ${cx + 8} 31C${cx + 4} 30 ${cx} 32 ${cx - 4} 30.5C${cx - 9} 32 ${cx - 13} 29 ${L + 2} 33L${L + 1} ${yeux - 4}Z" fill="${g}"/>` +
          meches(`M${cx - 10} 29L${cx - 9} 22M${cx - 4} 29.5L${cx - 3} 21M${cx + 2} 30L${cx + 3} 21M${cx + 8} 29.5L${cx + 8} 22`, 1.1);
      case 'long': // cheveux mi-longs, raie au milieu (Andersson)
        return `<path d="M${L - 1.5} ${yeux + 4}C${L - 3} 22 ${cx - 12} 11.5 ${cx} 11.5C${cx + 12} 11.5 ${R + 3} 22 ${R + 1.5} ${yeux + 4}L${R - 1.5} ${yeux - 5}C${R - 3} 30 ${cx + 8} 22 ${cx} 19C${cx - 8} 22 ${L + 3} 30 ${L + 1.5} ${yeux - 5}Z" fill="${g}"/>` +
          meches(`M${cx} 13V19M${cx - 3} 14Q${cx - 10} 20 ${L + 1} 34M${cx + 3} 14Q${cx + 10} 20 ${R - 1} 34`, 1.1);
      case 'longs': // cheveux longs, raie sur le côté, qui encadrent le visage
        return `<path d="M${L - 2} ${yeux + 14}C${L - 4} 22 ${cx - 12} 11 ${cx + 1} 11C${cx + 14} 11 ${R + 4} 22 ${R + 2} ${yeux + 14}L${R - 1.5} ${yeux - 2}C${R - 2} 30 ${cx + 11} 23 ${cx + 5} 22C${cx} 21 ${cx - 7} 24 ${cx - 11} 29C${cx - 14} 32 ${L + 2} 36 ${L + 1.5} ${yeux - 2}Z" fill="${g}"/>` +
          meches(`M${cx + 5} 12.5Q${cx - 4} 15 ${cx - 11} 28M${cx + 7} 13Q${cx + 12} 18 ${R - 1} 34M${L + 1} 34Q${L - 1} 44 ${L} ${yeux + 12}M${R - 1} 36Q${R + 1} 46 ${R} ${yeux + 12}`, 1.1);
      case 'chignon': // cheveux tirés en arrière, chignon sur le haut
        return `<circle cx="${cx}" cy="10.5" r="6.5" fill="${g}"/>` + meches(`M${cx - 4} 9Q${cx} 6 ${cx + 4} 10`, 1) +
          `<path d="M${L} ${yeux - 2}C${L - 1} 24 ${cx - 12} 13 ${cx} 13C${cx + 12} 13 ${R + 1} 24 ${R} ${yeux - 2}C${R - 1} 31 ${cx + 11} 23.5 ${cx} 23C${cx - 11} 23.5 ${L + 1} 31 ${L} ${yeux - 2}Z" fill="${g}"/>` +
          meches(`M${cx - 9} 22Q${cx - 6} 16 ${cx - 1} 14M${cx + 9} 22Q${cx + 6} 16 ${cx + 1} 14`);
      case 'queue': // cheveux tirés, raie au milieu (queue de cheval derrière)
        return `<path d="M${L} ${yeux - 1}C${L - 1} 24 ${cx - 12} 13 ${cx} 13C${cx + 12} 13 ${R + 1} 24 ${R} ${yeux - 1}C${R - 1} 30 ${cx + 9} 22.5 ${cx} 21.5C${cx - 9} 22.5 ${L + 1} 30 ${L} ${yeux - 1}Z" fill="${g}"/>` +
          meches(`M${cx} 14V21M${cx - 2} 14.5Q${cx - 9} 18 ${L + 1} 32M${cx + 2} 14.5Q${cx + 9} 18 ${R - 1} 32`);
      case 'carre': // carré avec frange
        return `<path d="M${L - 2} ${yeux + 18}C${L - 4} 22 ${cx - 12} 11 ${cx} 11C${cx + 12} 11 ${R + 4} 22 ${R + 2} ${yeux + 18}L${R - 1.5} ${yeux + 2}C${R - 1} 36 ${R - 3} 33 ${cx + 9} 33.5C${cx + 4} 32.5 ${cx - 4} 34 ${cx - 9} 33.5C${L + 3} 33 ${L + 1} 36 ${L + 1.5} ${yeux + 2}Z" fill="${g}"/>` +
          meches(`M${cx - 9} 33L${cx - 8} 24M${cx - 3} 33.5L${cx - 2} 23M${cx + 3} 33.5L${cx + 3} 23M${cx + 9} 33L${cx + 8} 24`, 1);
      case 'boucles-longues': { // grande chevelure ondulée (Judit Polgar)
        let d = `M${L - 3} ${yeux + 10}`;
        const n = 12, pt = i => { const a = Math.PI * (1.12 - i / n * 1.24); return [cx + Math.cos(a) * (w + 4.5), 32 - Math.sin(a) * 21]; };
        d += `L${f(pt(0)[0])} ${f(pt(0)[1])}`;
        for (let i = 1; i <= n; i++) { const [x, y] = pt(i); d += `A3.2 3.2 0 0 1 ${f(x)} ${f(y)}`; }
        d += `L${R + 3} ${yeux + 10}L${R - 1.5} ${yeux - 3}C${R - 2} 30 ${cx + 10} 25 ${cx + 4} 24C${cx} 26.5 ${cx - 5} 23 ${cx - 9} 26C${cx - 13} 28 ${L + 2} 33 ${L + 1.5} ${yeux - 3}Z`;
        return `<path d="${d}" fill="${g}"/>` + meches(`M${cx - 12} 26a2.5 2.5 0 1 1 4 1M${cx - 3} 20a2.5 2.5 0 1 1 4 1M${cx + 7} 22a2.5 2.5 0 1 1 4 1M${L} 38a2.5 2.5 0 1 1 3 2M${R - 3} 38a2.5 2.5 0 1 1 3 2`, 1.1);
      }
      default: return '';
    }
  }

  function barbe(type, cx, w, yeux, bas, ch, id) {
    const g = `url(#${id}c)`, fonce = ombre(ch, .7);
    if (type === 'bouc') return `<path d="M${cx - 6} ${yeux + 19}C${cx - 6} ${bas + 3} ${cx - 3} ${bas + 7} ${cx} ${bas + 7.5}C${cx + 3} ${bas + 7} ${cx + 6} ${bas + 3} ${cx + 6} ${yeux + 19}C${cx + 3} ${yeux + 20.5} ${cx - 3} ${yeux + 20.5} ${cx - 6} ${yeux + 19}Z" fill="${g}"/>`;
    // pleine : des oreilles au menton, la bouche reste visible
    const longue = type === 'pleine' ? 9 : 4;
    return `<path d="M${f(cx - w)} ${yeux + 2}C${f(cx - w)} ${yeux + 18} ${cx - 12} ${bas + longue} ${cx} ${bas + longue + 1}C${cx + 12} ${bas + longue} ${f(cx + w)} ${yeux + 18} ${f(cx + w)} ${yeux + 2}C${f(cx + w - 2)} ${yeux + 9} ${cx + 9} ${yeux + 12} ${cx + 6} ${yeux + 15.5}C${cx + 4} ${yeux + 20} ${cx - 4} ${yeux + 20} ${cx - 6} ${yeux + 15.5}C${cx - 9} ${yeux + 12} ${f(cx - w + 2)} ${yeux + 9} ${f(cx - w)} ${yeux + 2}Z" fill="${g}"/>` +
      `<path d="M${cx - 9} ${bas - 2}q1 4 2 6M${cx - 3} ${bas + 1}q.5 4 1 6M${cx + 3} ${bas + 1}q-.5 4-1 6M${cx + 9} ${bas - 2}q-1 4-2 6" fill="none" stroke="${fonce}" stroke-width=".6" opacity=".6"/>`;
  }

  function moustache(type, cx, yeux, ch) {
    const y = yeux + 14;
    if (type === 'fine') return `<path d="M${cx - 5} ${y + 1}Q${cx} ${y - 1.4} ${cx + 5} ${y + 1}Q${cx} ${y + .2} ${cx - 5} ${y + 1}Z" fill="${ch}"/>`;
    if (type === 'guidon') return `<path d="M${cx} ${y - .6}C${cx - 4} ${y - 1.8} ${cx - 7} ${y} ${cx - 9.5} ${y - 2.5}C${cx - 8} ${y + 1.5} ${cx - 4} ${y + 2} ${cx} ${y + .8}C${cx + 4} ${y + 2} ${cx + 8} ${y + 1.5} ${cx + 9.5} ${y - 2.5}C${cx + 7} ${y} ${cx + 4} ${y - 1.8} ${cx} ${y - .6}Z" fill="${ch}"/>`;
    return `<path d="M${cx} ${y - 1.4}C${cx - 4} ${y - 2.4} ${cx - 7.5} ${y - .5} ${cx - 8} ${y + 3}C${cx - 5} ${y + 2} ${cx - 2} ${y + 2.2} ${cx} ${y + 1.4}C${cx + 2} ${y + 2.2} ${cx + 5} ${y + 2} ${cx + 8} ${y + 3}C${cx + 7.5} ${y - .5} ${cx + 4} ${y - 2.4} ${cx} ${y - 1.4}Z" fill="${ch}"/>`;
  }

  function lunettes(type, cx, w, yeux) {
    const tr = 'fill="rgba(255,255,255,.12)" stroke="#1E1A18" stroke-width="1"';
    if (type === 'pincenez') return `<ellipse cx="${cx - 7.6}" cy="${yeux}" rx="4.4" ry="3.6" ${tr}/><ellipse cx="${cx + 7.6}" cy="${yeux}" rx="4.4" ry="3.6" ${tr}/><path d="M${cx - 3.2} ${yeux - .6}Q${cx} ${yeux - 2.5} ${cx + 3.2} ${yeux - .6}" fill="none" stroke="#1E1A18" stroke-width=".8"/><path d="M${cx + 12} ${yeux}q3 6 1 14" fill="none" stroke="#1E1A18" stroke-width=".35"/>`;
    const branches = `<path d="M${cx - 12.6} ${yeux - 1}L${f(cx - w)} ${yeux - 2}M${cx + 12.6} ${yeux - 1}L${f(cx + w)} ${yeux - 2}" stroke="#1E1A18" stroke-width="1"/>`;
    const pont = `<path d="M${cx - 3} ${yeux - .8}Q${cx} ${yeux - 2.4} ${cx + 3} ${yeux - .8}" fill="none" stroke="#1E1A18" stroke-width="1"/>`;
    if (type === 'rondes') return `<circle cx="${cx - 7.6}" cy="${yeux}" r="4.8" ${tr}/><circle cx="${cx + 7.6}" cy="${yeux}" r="4.8" ${tr}/>${pont}${branches}`;
    return `<rect x="${cx - 13}" y="${yeux - 4.2}" width="10" height="7.8" rx="2.4" ${tr} stroke-width="1.3"/><rect x="${cx + 3}" y="${yeux - 4.2}" width="10" height="7.8" rx="2.4" ${tr} stroke-width="1.3"/>${pont}${branches}`;
  }

  // un petit chat posé sur l'épaule (Alekhine aimait les chats)
  function chat() {
    return `<g transform="translate(17 61) scale(1.25)"><path d="M0 18C0 8 4 3 9 3S18 8 18 18Z" fill="#E8E2D6"/><path d="M2 6L1 -2 7 3ZM16 6L17 -2 11 3Z" fill="#E8E2D6"/><path d="M2.5 3L2 .5 5 2.6ZM15.5 3L16 .5 13 2.6Z" fill="#E7A9A0"/>` +
      `<circle cx="9" cy="9" r="7.2" fill="#F1ECE2"/><path d="M4 4.5Q9 2 14 4.5" fill="none" stroke="#B9A890" stroke-width="1.2"/><ellipse cx="6.3" cy="8.6" rx="1.2" ry="1.6" fill="#5C7A3A"/><ellipse cx="11.7" cy="8.6" rx="1.2" ry="1.6" fill="#5C7A3A"/>` +
      `<ellipse cx="6.3" cy="8.6" rx=".4" ry="1.2" fill="#111"/><ellipse cx="11.7" cy="8.6" rx=".4" ry="1.2" fill="#111"/><path d="M8.2 11h1.6L9 12Z" fill="#D88A84"/>` +
      `<path d="M9 12v1M9 13q-1.4 1-2.4 0M9 13q1.4 1 2.4 0M3 11.5l-3-.8M3 12.6l-3 .6M15 11.5l3-.8M15 12.6l3 .6" fill="none" stroke="#8A7A68" stroke-width=".4"/></g>`;
  }

  // la carte « autres maîtres » : un pion et un point d'interrogation
  function autres() {
    const id = 'pt' + (++compteur);
    return `<svg viewBox="0 0 100 100" class="portrait" role="img" aria-label="Autres maîtres"><defs><radialGradient id="${id}f" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="#EEF0E6"/><stop offset="1" stop-color="#B9C4A8"/></radialGradient></defs>` +
      `<rect width="100" height="100" fill="url(#${id}f)"/><use href="#piece-pion-noir" x="10" y="26" width="46" height="62" opacity=".85"/><use href="#piece-pion-blanc" x="44" y="26" width="46" height="62"/>` +
      `<text x="50" y="27" text-anchor="middle" font-family="Lexend, sans-serif" font-size="24" font-weight="700" fill="#3A4A2E">?</text></svg>`;
  }

  // couleurs : éclaircir / assombrir un #RRGGBB
  function ombre(hex, k) { return melange(hex, k); }
  function eclair(hex, k) { return melange(hex, k); }
  function melange(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }

  window.Portraits = { svg, CHAMPIONS };
})();
