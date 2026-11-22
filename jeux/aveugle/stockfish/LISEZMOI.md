# Stockfish dans « À l'aveugle »

L'ordinateur de « À l'aveugle » est **Stockfish 18**, dans sa version pour navigateur
[Stockfish.js](https://github.com/nmrugg/stockfish.js) (Nathan Rugg, Chess.com), édition « lite single-threaded » :

- `stockfish-18-lite-single.js` et `stockfish-18-lite-single.wasm` : copiés tels quels du paquet npm
  [`stockfish` 18.0.8](https://www.npmjs.com/package/stockfish/v/18.0.8), sans modification ;
- le moteur tourne dans un Web Worker, à part du reste du site ; la page lui parle avec le protocole UCI
  (`../moteur.js`).

## Licence

Stockfish et Stockfish.js sont des logiciels libres sous licence **GNU GPL version 3** : le texte complet est dans
`COPYING.txt`, à côté. Ils sont distribués ici sans garantie.

Code source correspondant (la version exacte utilisée) :

- Stockfish.js : <https://github.com/nmrugg/stockfish.js>, commit `93c994592dcf3b4b21052ab925e9b534df9c0918`
  (paquet npm `stockfish` 18.0.8) ;
- Stockfish : <https://github.com/official-stockfish/Stockfish> (version 18) ;
- réseau NNUE (`nn-9067e33176e`, de Linmiao Xu) : <https://tests.stockfishchess.org/nns>.

Le reste du site Pom'chess n'est pas sous GPL (voir le README du dépôt) : il utilise Stockfish comme un programme
séparé, auquel il envoie des positions et dont il lit les coups.

## Mettre à jour

```bash
npm pack stockfish@<version>
tar xzf stockfish-<version>.tgz
cp package/bin/stockfish-*-lite-single.js package/bin/stockfish-*-lite-single.wasm package/Copying.txt jeux/aveugle/stockfish/
```

(renommer `Copying.txt` en `COPYING.txt`, et le nom des fichiers dans `../aveugle.js` si la version change).
