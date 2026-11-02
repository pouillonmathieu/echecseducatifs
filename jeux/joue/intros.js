/* Introductions historiques des parties célèbres de « Joue le coup ».
   Textes rédigés pour ce site, à partir de faits historiques connus (lieu, date, contexte, pourquoi la partie est
   célèbre). Une partie est reconnue par ses joueurs et ses premiers coups (notation anglaise).
   lieu et annee complètent les informations quand elles manquent dans les données. */
window.INTROS_PARTIES = [
  {
    blancs: 'Morphy', noirs: 'Isouard', debut: 'e4 e5 Nf3 d6 d4 Bg4', titre: 'La partie de l\'Opéra', lieu: 'Paris', annee: 1858,
    texte: 'Cette partie s\'est jouée à l\'Opéra de Paris, dans une loge, pendant une représentation. Paul Morphy affronte deux adversaires qui réfléchissent ensemble : le duc de Brunswick et le comte Isouard. Elle est restée un modèle : Morphy sort vite toutes ses pièces, attaque, et gagne en 17 coups.',
  },
  {
    blancs: 'Paulsen', noirs: 'Morphy', debut: 'e4 e5 Nf3 Nc6 Nc3 Nf6', titre: 'Le sacrifice de dame de Morphy', lieu: 'New York', annee: 1857,
    texte: 'Partie jouée au premier congrès américain d\'échecs, à New York, un tournoi que Paul Morphy remporte à 20 ans. Elle est célèbre pour un sacrifice de dame au 17e coup, qui ouvre la route vers le roi blanc.',
  },
  {
    blancs: 'Lasker', noirs: 'Bauer', debut: 'f4 d5 e3 Nf6 b3 e6', titre: 'Le double sacrifice de fous', lieu: 'Amsterdam', annee: 1889,
    texte: 'Emanuel Lasker, qui deviendra champion du monde quelques années plus tard, sacrifie ses deux fous l\'un après l\'autre pour mettre à nu le roi adverse. L\'idée est devenue un grand classique : on parle souvent du « double sacrifice de fous de Lasker ».',
  },
  {
    blancs: 'Rotlewi', noirs: 'Rubinstein', debut: 'd4 d5 Nf3 e6 e3 c5', titre: 'L\'Immortelle de Rubinstein', lieu: 'Lodz', annee: 1907,
    texte: 'On l\'appelle souvent « l\'Immortelle de Rubinstein ». Akiba Rubinstein y enchaîne les sacrifices, et ses pièces, placées loin du roi blanc, finissent par converger sur lui.',
  },
  {
    blancs: 'Steinitz', noirs: 'Bardeleben', debut: 'e4 e5 Nf3 Nc6 Bc4 Bc5', titre: 'Le joueur qui a quitté la salle', lieu: 'Hastings', annee: 1895,
    texte: 'Au grand tournoi de Hastings 1895, Wilhelm Steinitz lance une attaque magnifique. Plutôt que d\'abandonner, son adversaire, Curt von Bardeleben, quitte la salle sans rien dire et ne revient pas ! Steinitz montre ensuite aux spectateurs le mat qu\'il avait préparé.',
  },
  {
    blancs: 'Steinitz', noirs: 'Tchigorine', debut: 'e4 e5 Nf3 Nc6 Bb5', titre: 'Un match pour le titre mondial', lieu: 'La Havane', annee: 1892,
    texte: 'Match pour le titre de champion du monde à La Havane, en 1892 : Wilhelm Steinitz défend son titre contre Mikhaïl Tchigorine, et le garde.',
  },
  {
    blancs: 'Lasker', noirs: 'Capablanca', debut: 'e4 e5 Nf3 Nc6 Bb5 a6', titre: 'Saint-Pétersbourg 1914', lieu: 'Saint-Pétersbourg', annee: 1914,
    texte: 'Au grand tournoi de Saint-Pétersbourg 1914, Emanuel Lasker, champion du monde, doit absolument gagner contre le jeune Capablanca. Il choisit une ouverture très calme, l\'échange de la partie espagnole, et l\'emporte. Lasker gagne ensuite le tournoi devant Capablanca.',
  },
  {
    blancs: 'Capablanca', noirs: 'Marshall', debut: 'e4 e5 Nf3 Nc6 Bb5 d6', titre: 'Le match de 1909', lieu: 'États-Unis', annee: 1909,
    texte: 'En 1909, le jeune Capablanca, encore peu connu, affronte le champion des États-Unis, Frank Marshall, dans un match. Il l\'emporte très largement et devient d\'un coup l\'un des meilleurs joueurs du monde.',
  },
  {
    blancs: 'Marshall', noirs: 'Capablanca', debut: 'd4 d5 c4 e6 Nc3 c5', titre: 'Le match de 1909', lieu: 'États-Unis', annee: 1909,
    texte: 'En 1909, le jeune Capablanca, encore peu connu, affronte le champion des États-Unis, Frank Marshall, dans un match. Il l\'emporte très largement et devient d\'un coup l\'un des meilleurs joueurs du monde.',
  },
  {
    blancs: 'Alekhine', noirs: 'Nimzowitsch', debut: 'e4 e6 d4 d5 Nc3 Bb4', titre: 'San Remo 1930', lieu: 'San Remo', annee: 1930,
    texte: 'Alexandre Alekhine, alors champion du monde, gagne le tournoi de San Remo 1930 loin devant tout le monde. Dans cette partie, il enferme peu à peu les pièces noires, jusqu\'à ce qu\'elles ne puissent presque plus bouger.',
  },
  {
    blancs: 'Alekhine', noirs: 'Euwe', debut: 'd4 d5 c4 c6 Nc3 dxc4', titre: 'La revanche de 1937', lieu: 'Pays-Bas', annee: 1937,
    texte: 'Match revanche pour le titre mondial, aux Pays-Bas, en 1937. Alexandre Alekhine avait perdu son titre contre Max Euwe deux ans plus tôt : il le reprend.',
  },
  {
    blancs: 'Botvinnik', noirs: 'Vidmar', debut: 'c4 e6 Nf3 d5 d4 Nf6', titre: 'Nottingham 1936', lieu: 'Nottingham', annee: 1936,
    texte: 'Le tournoi de Nottingham 1936 réunissait des champions du monde d\'hier, d\'aujourd\'hui et de demain : Lasker, Capablanca, Alekhine, Euwe et le jeune Botvinnik. Botvinnik y gagne une partie modèle avec un pion isolé au centre, qui sert d\'appui à son attaque.',
  },
  {
    blancs: 'Botvinnik', noirs: 'Capablanca', debut: 'd4 Nf6 c4 e6 Nc3 Bb4', titre: 'La combinaison du tournoi AVRO', lieu: 'Pays-Bas (tournoi AVRO)', annee: 1938,
    texte: 'Au tournoi AVRO de 1938, aux Pays-Bas, le jeune Mikhaïl Botvinnik bat l\'ancien champion du monde Capablanca. La fin de la partie, une combinaison où Botvinnik sacrifie des pièces, compte parmi les plus célèbres de l\'histoire.',
  },
  {
    blancs: 'Donald Byrne', noirs: 'Fischer', debut: 'Nf3 Nf6 c4 g6 Nc3 Bg7', titre: 'La partie du siècle', lieu: 'New York', annee: 1956,
    texte: 'Bobby Fischer n\'a que 13 ans quand il joue cette partie à New York. Il sacrifie sa dame pour une attaque terrible, et la partie a été surnommée « la partie du siècle ».',
  },
  {
    blancs: 'Robert Byrne', noirs: 'Fischer', debut: 'd4 Nf6 c4 g6 g3 c6', titre: 'Le championnat parfait', lieu: 'New York', annee: 1963,
    texte: 'Au championnat des États-Unis 1963-1964, Bobby Fischer gagne ses 11 parties sur 11. Contre Robert Byrne, il lance une attaque si surprenante que des grands maîtres qui la commentaient dans une autre salle pensaient Byrne mieux placé… au moment même où il abandonnait !',
  },
  {
    blancs: 'Larsen', noirs: 'Spassky', debut: 'b3 e5 Bb2 Nc6 c4 Nf6', titre: 'Le match du siècle', lieu: 'Belgrade', annee: 1970,
    texte: 'Lors du « match du siècle », l\'URSS contre le reste du monde, Bent Larsen joue au premier échiquier du reste du monde, devant Fischer. Boris Spassky, champion du monde, le bat en seulement 17 coups.',
  },
  {
    blancs: 'Fischer', noirs: 'Spassky', debut: 'c4 e6 Nf3 d5 d4 Nf6', titre: 'Reykjavik 1972, 6e partie', lieu: 'Reykjavik', annee: 1972,
    texte: 'Sixième partie du match pour le titre mondial, à Reykjavik, en 1972. Bobby Fischer, qui commence presque toujours par 1.e4, ouvre cette fois avec 1.c4. Sa victoire est si belle que Spassky lui-même l\'aurait applaudie. À la fin du match, Fischer devient champion du monde.',
  },
  {
    blancs: 'Karpov', noirs: 'Kasparov', debut: 'e4 c5 Nf3 e6 d4 cxd4', titre: 'Le cavalier en d3', lieu: 'Moscou', annee: 1985,
    texte: 'Seizième partie du match pour le titre mondial de 1985, à Moscou. Garry Kasparov installe un cavalier en plein camp adverse, sur la case d3, d\'où il gêne toutes les pièces blanches. Quelques semaines plus tard, Kasparov devient champion du monde, à 22 ans.',
  },
  {
    blancs: 'Polgar', noirs: 'Spassky', debut: 'e4 e5 Nf3 Nc6 Bb5 a6', titre: 'Judit Polgar contre Spassky', lieu: 'Budapest', annee: 1993,
    texte: 'En 1993, à Budapest, Judit Polgar, 16 ans, affronte l\'ancien champion du monde Boris Spassky dans un match, et le gagne. Elle deviendra la meilleure joueuse de l\'histoire et battra beaucoup de champions du monde.',
    seulement: 1993,
  },
];
