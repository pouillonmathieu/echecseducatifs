/* Mode tout-petits : un animal par colonne (sa première lettre se prononce comme la lettre)
   et des mains qui montrent les chiffres avec les doigts (on compte à partir de l'index, le pouce vient en 5e).
   Les dessins sont ajoutés une fois dans la page sous forme de symboles SVG. */
(function () {
  const T = '#2A2E38'; // trait des illustrations (identique en thème clair et sombre)

  const ANIMAUX = {
    a: { nom: 'abeille', dessin: `
      <ellipse cx="18" cy="15" rx="6" ry="9" transform="rotate(-25 18 15)" fill="#DCEFFF" stroke="${T}" stroke-width="1.5"/>
      <ellipse cx="26" cy="14" rx="5.5" ry="8.5" transform="rotate(20 26 14)" fill="#DCEFFF" stroke="${T}" stroke-width="1.5"/>
      <path d="M8.5 28 3 29 8.5 31Z" fill="${T}"/>
      <ellipse cx="21" cy="29" rx="13" ry="10" fill="#F7C548"/>
      <rect x="17" y="19.4" width="4" height="19.2" fill="${T}"/>
      <path d="M25 19.5 29 21.1V36.9L25 38.5Z" fill="${T}"/>
      <ellipse cx="21" cy="29" rx="13" ry="10" fill="none" stroke="${T}" stroke-width="1.8"/>
      <path d="M38 21C38 17 40 15 42.5 14M35.5 21C34.5 17 34.5 15 35.5 12.5" fill="none" stroke="${T}" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="42.5" cy="14" r="1.4" fill="${T}"/><circle cx="35.5" cy="12.5" r="1.4" fill="${T}"/>
      <circle cx="37" cy="27" r="6.5" fill="${T}"/>
      <circle cx="39.2" cy="25.6" r="1.9" fill="#fff"/>` },
    b: { nom: 'baleine', dessin: `
      <path d="M15 13C14 9 11 7 8 7M15 13C16 9 19 7 22 7M15 13V6" fill="none" stroke="#8CC2F2" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M5 28C5 19 13 14 24 15 32 16 37 20 39 25L43 19C44 17 47 18 46 21L44 28 47 33C48 36 45 37 44 35L39 30C36 37 29 41 20 41 11 41 5 36 5 28Z" fill="#4F8FD8" stroke="${T}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M7.5 31.5C10 37 15 39.2 21 39.2 28 39.2 33 36 36 32 28 34.5 16 34.5 7.5 31.5Z" fill="#CFE4F8"/>
      <circle cx="13" cy="24.5" r="1.9" fill="${T}"/>
      <path d="M8.5 29.5C10.5 31 13 31.4 16 31" fill="none" stroke="${T}" stroke-width="1.4" stroke-linecap="round"/>` },
    c: { nom: 'crocodile', dessin: `
      <path d="M31 27.5 45 26.5 43 31Z" fill="#E07A7A"/>
      <path d="M10 34.5V40H14V36M20 35V40H24V35.5" fill="#5BAA5A" stroke="${T}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M8 22.6 10 20 12 22.4M13.5 21.6 15.5 19 17.5 21.4" fill="#4A9449" stroke="${T}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M3 30C3 25 8 22 14 22L18 20.5C19 17.5 23 16.5 25 18.5L28 20.5 45 23C47 23.5 47 26 45 26.5L31 27.5 43 31C45 31.5 44.5 34 42.5 34L28 33.5 24 36H14C7 36 3 34 3 30Z" fill="#5BAA5A" stroke="${T}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M34 27.3 35 28.9 36 27.2M38 27 39 28.6 40 26.9M41.6 26.8 42.5 28.3 43.4 26.6" fill="#fff" stroke="${T}" stroke-width=".8" stroke-linejoin="round"/>
      <path d="M35 28.9 36 27.6 37 29.3M39 30 40 28.6 41 30.3" fill="#fff" stroke="${T}" stroke-width=".8" stroke-linejoin="round"/>
      <circle cx="24" cy="19.5" r="3.8" fill="#5BAA5A" stroke="${T}" stroke-width="1.5"/>
      <circle cx="24.8" cy="19" r="1.8" fill="${T}"/><circle cx="25.3" cy="18.5" r=".6" fill="#fff"/>
      <circle cx="44" cy="23.8" r=".9" fill="${T}"/>` },
    d: { nom: 'dauphin', dessin: `
      <path d="M24 17C25 13 27 10 30.5 9 29.5 12 29.5 14 30.5 16.5Z" fill="#7EA6CC" stroke="${T}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M10 34C7 34 4 33 2 31 4 35 5 38 6 41.5 8 39.5 10 38.5 12.5 37.5Z" fill="#7EA6CC" stroke="${T}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M7 37C9 24 20 15 33 15 37 15 40 16 42 17.5L46 18.5C47 19 47 20.5 46 21L41.5 21.5C40 23 37.5 23.5 35 22.8 25 21 16 26 12 35Z" fill="#7EA6CC" stroke="${T}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M14.5 32C18.5 27 25 23.8 34 23.3 30 25 22.5 28.5 16.5 34.5Z" fill="#D6E6F3"/>
      <path d="M24 24.5C22 28 22 30 23 32.5 25 30.5 27 27.5 28 24.3Z" fill="#6A93BA" stroke="${T}" stroke-width="1.4" stroke-linejoin="round"/>
      <circle cx="37" cy="18.6" r="1.8" fill="${T}"/>` },
    e: { nom: 'éléphant', dessin: `
      <ellipse cx="11" cy="23" rx="9" ry="11" fill="#A7B0BE" stroke="${T}" stroke-width="1.8"/>
      <ellipse cx="12" cy="23" rx="5.5" ry="7.5" fill="#E9B8BE"/>
      <ellipse cx="37" cy="23" rx="9" ry="11" fill="#A7B0BE" stroke="${T}" stroke-width="1.8"/>
      <ellipse cx="36" cy="23" rx="5.5" ry="7.5" fill="#E9B8BE"/>
      <path d="M24 27C24 36 23 40 27.5 42" fill="none" stroke="${T}" stroke-width="9.6" stroke-linecap="round"/>
      <path d="M14 22C14 13 19 9 24 9S34 13 34 22C34 28 31 31 28 32H20C17 31 14 28 14 22Z" fill="#A7B0BE" stroke="${T}" stroke-width="1.8"/>
      <path d="M24 26C24 36 23 40 27.5 42" fill="none" stroke="#A7B0BE" stroke-width="6.2" stroke-linecap="round"/>
      <path d="M19.5 29.5Q18.3 34 20.5 36.5L21.3 30.5ZM28.5 29.5Q29.7 34 27.5 36.5L26.7 30.5Z" fill="#FFFDF5" stroke="${T}" stroke-width="1" stroke-linejoin="round"/>
      <circle cx="19.5" cy="20" r="1.7" fill="${T}"/><circle cx="28.5" cy="20" r="1.7" fill="${T}"/>` },
    f: { nom: 'fourmi', dessin: `
      <path d="M24 28 19 34 16 40M26.5 29 26.5 35 24.5 41M29 28 33 34 36 40" fill="none" stroke="${T}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M38 18.5C39 14.5 41 12.5 44 12M35 18C35 14 36 11 38.5 9.5" fill="none" stroke="${T}" stroke-width="1.6" stroke-linecap="round"/>
      <ellipse cx="13" cy="25" rx="9" ry="7" fill="#9A4A2E" stroke="${T}" stroke-width="1.8"/>
      <circle cx="22.5" cy="26.5" r="2.2" fill="#9A4A2E" stroke="${T}" stroke-width="1.4"/>
      <ellipse cx="27.5" cy="26.5" rx="5" ry="3.9" fill="#9A4A2E" stroke="${T}" stroke-width="1.6"/>
      <circle cx="36" cy="23" r="5.6" fill="#9A4A2E" stroke="${T}" stroke-width="1.7"/>
      <circle cx="38.2" cy="22" r="1.7" fill="#fff"/><circle cx="38.7" cy="22" r=".9" fill="${T}"/>
      <ellipse cx="10" cy="22" rx="3.2" ry="1.6" fill="#fff" opacity=".35"/>` },
    g: { nom: 'guépard', dessin: `
      <path d="M12.5 16 11 5.5 20 10Z" fill="#E6A93E" stroke="${T}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M35.5 16 37 5.5 28 10Z" fill="#E6A93E" stroke="${T}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M13.5 13.5 12.8 8.5 17.5 10.8ZM34.5 13.5 35.2 8.5 30.5 10.8Z" fill="${T}"/>
      <circle cx="24" cy="25" r="15.5" fill="#EDB04A" stroke="${T}" stroke-width="1.8"/>
      <ellipse cx="24" cy="32.5" rx="7.8" ry="6.2" fill="#FAE8C2"/>
      <g fill="${T}"><circle cx="17" cy="14.5" r="1.2"/><circle cx="21.5" cy="12.5" r="1.1"/><circle cx="26.5" cy="12.5" r="1.1"/><circle cx="31" cy="14.5" r="1.2"/><circle cx="24" cy="16" r="1"/><circle cx="12" cy="23" r="1.2"/><circle cx="36" cy="23" r="1.2"/><circle cx="13.5" cy="29.5" r="1.1"/><circle cx="34.5" cy="29.5" r="1.1"/></g>
      <ellipse cx="18.5" cy="23" rx="2.7" ry="2.3" fill="#F5D35B" stroke="${T}" stroke-width="1"/>
      <ellipse cx="29.5" cy="23" rx="2.7" ry="2.3" fill="#F5D35B" stroke="${T}" stroke-width="1"/>
      <circle cx="18.7" cy="23" r="1.2" fill="${T}"/><circle cx="29.3" cy="23" r="1.2" fill="${T}"/>
      <path d="M17.6 25.4C17 29 18 32 20.2 34.5M30.4 25.4C31 29 30 32 27.8 34.5" fill="none" stroke="${T}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M21.5 28.5H26.5L24 31.5Z" fill="${T}" stroke="${T}" stroke-width="1" stroke-linejoin="round"/>
      <path d="M24 31.5V33.5M24 33.5C23 34.7 21.4 34.9 20.4 34.1M24 33.5C25 34.7 26.6 34.9 27.6 34.1" fill="none" stroke="${T}" stroke-width="1.3" stroke-linecap="round"/>` },
    h: { nom: 'hibou', dessin: `
      <path d="M19 42 17.5 45.5M21 42V45.5M27 42V45.5M29 42 30.5 45.5" stroke="#E8913A" stroke-width="2" stroke-linecap="round"/>
      <path d="M13 14 11 5 19.5 10ZM35 14 37 5 28.5 10Z" fill="#94704C" stroke="${T}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M24 8C33 8 38 15 38 25S32 43 24 43 10 35 10 25 15 8 24 8Z" fill="#94704C" stroke="${T}" stroke-width="1.8"/>
      <ellipse cx="24" cy="33.5" rx="9" ry="8.3" fill="#E7D3B1"/>
      <path d="M19.5 31 21 32.5 22.5 31M25.5 31 27 32.5 28.5 31M22.5 35.5 24 37 25.5 35.5" fill="none" stroke="#94704C" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="18" cy="20" r="6" fill="#FFF8E6" stroke="${T}" stroke-width="1.2"/>
      <circle cx="30" cy="20" r="6" fill="#FFF8E6" stroke="${T}" stroke-width="1.2"/>
      <circle cx="18" cy="20" r="3.3" fill="#F2B33D"/><circle cx="30" cy="20" r="3.3" fill="#F2B33D"/>
      <circle cx="18" cy="20" r="1.8" fill="${T}"/><circle cx="30" cy="20" r="1.8" fill="${T}"/>
      <circle cx="18.8" cy="19.2" r=".6" fill="#fff"/><circle cx="30.8" cy="19.2" r=".6" fill="#fff"/>
      <path d="M22.5 24H25.5L24 28.2Z" fill="#E8913A" stroke="${T}" stroke-width="1" stroke-linejoin="round"/>` },
  };

  // Une main (paume face à nous) avec n doigts levés : index, majeur, annulaire, auriculaire, puis pouce.
  // Doigts levés longs et écartés ; doigts repliés plus foncés, posés sur la paume.
  const PEAU = '#F7C873';
  const PEAU_OMBRE = '#E0A445';
  const DOIGTS = [ // base x, base y, angle, longueur : index, majeur, annulaire, auriculaire
    [17, 27, -16, 19], [23, 25.5, -4, 21], [29, 26, 8, 19], [34.2, 28.5, 22, 15],
  ];
  function main(n) {
    const trait = `stroke="${T}" stroke-width="2.2" stroke-linejoin="round"`;
    let leves = '', replies = '';
    // pouce : levé vers la gauche, ou replié en travers de la paume
    if (n >= 5) leves += `<rect x="9.5" y="17" width="7" height="17" rx="3.5" transform="rotate(-48 13 33)" fill="${PEAU}" ${trait}/>`;
    else replies += `<rect x="14" y="33" width="15" height="6.5" rx="3.25" transform="rotate(-12 21 36)" fill="${PEAU_OMBRE}" ${trait}/>`;
    DOIGTS.forEach(([x, y, angle, long], i) => {
      if (n >= i + 1) {
        leves += `<rect x="${x - 3.2}" y="${y - long}" width="6.4" height="${long + 4}" rx="3.2" transform="rotate(${angle} ${x} ${y})" fill="${PEAU}" ${trait}/>`;
      } else {
        replies += `<rect x="${x - 3}" y="${y - 3.5}" width="6" height="8" rx="3" transform="rotate(${angle / 2} ${x} ${y})" fill="${PEAU_OMBRE}" ${trait}/>`;
      }
    });
    const paume = `<rect x="17.5" y="42" width="15" height="9" rx="3" fill="${PEAU}" ${trait}/>` +
      `<rect x="12" y="25" width="26.5" height="21" rx="9" fill="${PEAU}" ${trait}/>`;
    return leves + paume + replies;
  }

  function injecterSprite() {
    if (document.getElementById('sprite-tout-petits')) return;
    let symboles = '';
    for (const [lettre, a] of Object.entries(ANIMAUX)) {
      symboles += `<symbol id="animal-${lettre}" viewBox="0 0 48 48">${a.dessin}</symbol>`;
    }
    for (let n = 0; n <= 5; n++) {
      // main « droite » (pouce à gauche) et son miroir, la main « gauche » (pouce à droite)
      symboles += `<symbol id="main-${n}" viewBox="0 0 48 52">${main(n)}</symbol>`;
      symboles += `<symbol id="main-${n}-miroir" viewBox="0 0 48 52"><g transform="translate(48 0) scale(-1 1)">${main(n)}</g></symbol>`;
    }
    const boite = document.createElement('div');
    boite.innerHTML = `<svg id="sprite-tout-petits" width="0" height="0" style="position:absolute" aria-hidden="true">${symboles}</svg>`;
    document.body.prepend(boite.firstChild);
  }

  // <svg> d'un animal (colonne a à h)
  const animal = (lettre, classe = 'animal') =>
    `<svg class="${classe}" viewBox="0 0 48 48" aria-hidden="true"><use href="#animal-${lettre}"/></svg>`;

  // <svg> d'une ou deux mains montrant n (1 à 10)
  function mains(n, classe = 'mains') {
    // deux mains : comme un enfant face à nous, les pouces tournés vers l'intérieur
    if (n <= 5) return `<svg class="${classe}" viewBox="0 0 48 52" aria-hidden="true"><use href="#main-${n}-miroir"/></svg>`;
    return `<svg class="${classe} deux" viewBox="0 0 92 52" aria-hidden="true"><use href="#main-5-miroir" x="-2" width="48" height="52"/><use href="#main-${n - 5}" x="46" width="48" height="52"/></svg>`;
  }

  window.ToutPetits = { ANIMAUX, injecterSprite, animal, mains };
})();
