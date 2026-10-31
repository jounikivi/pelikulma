# Pelikulman kehittäminen

## Lähtökohta

Projekti erotettiin alkuperäisestä `PELIKULMA.html`-tiedostosta. Pelit ovat nyt erillisiä sivuja, joiden HTML, CSS ja JavaScript ovat omissa tiedostoissaan. Sivulta toiselle siirrytään tavallisilla linkeillä. Alkuperäistä ladattua tiedostoa ei muutettu.

Pelilogiikka on kummankin pelin omassa suljetussa funktiossa. Pelisilmukka käyttää `requestAnimationFrame`-kutsua ja piirtää Canvasille. Pelien muuttaminen ei edellytä palvelinkoodin tuntemista.

## Lisää kolmas peli

1. Luo `games/pelin-nimi/` ja sinne `index.html`, `pelin-nimi.css` ja `pelin-nimi.js`.
2. Linkitä CSS ja JavaScript HTML:ään suhteellisilla poluilla. Käytä skriptille `defer`-attribuuttia.
3. Lisää peliin paluulinkki `../../index.html`.
4. Lisää juuren `index.html`-tiedostoon uusi kortti osoitteeseen `./games/pelin-nimi/`.
5. Anna ennätykselle yksilöllinen `localStorage`-avain. Älä muuta vanhojen pelien avaimia ilman tallennusten siirtoa.
6. Kokeile peliä puhelinnäkymässä ja tietokoneella, aja `npm run check` ja tee commit.

## Sopivia seuraavia kehitysaskelia

Nämä ovat kehitysideoita, eivät vielä toteutettuja ominaisuuksia:

- LOISTE-peliin tauko ja äänten kytkin.
- Selkeät näppäimistöohjeet pelien aloitusnäkymiin.
- MATO-pelin valikon mukautus mataliin vaakanäkymiin.
- Pelien tärkeimpien sääntöjen erottaminen puhtaiksi funktioiksi ja yksikkötestaus.
- Selaintestit pelien käynnistykselle, paluulinkeille ja ennätyksille.
- PWA-asennus ja offline-pelaaminen.

## Commitit

Tee yksi ymmärrettävä asia kerrallaan. Hyviä nimiä ovat esimerkiksi `Lisää Loisteeseen äänten kytkin` ja `Korjaa matopelin tauko puhelimella`. Tarkista Desktopin diffistä, että commitissa ovat vain tarkoitetut tiedostot.

## Tallennukset

Vanhojen ennätysten avaimet säilytettiin: `mato2-<pelimuoto>-<vaikeus>` ja `loiste-best`. Aiemman tiedostoversion, localhostin ja julkaistun sivun tallennukset eivät välttämättä näy toisilleen, koska selain erottaa tallennukset sivuston alkuperän perusteella.
