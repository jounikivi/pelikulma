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

- Pelien tärkeimpien sääntöjen erottaminen puhtaiksi funktioiksi ja yksikkötestaus.
- Selaintestit pelien käynnistykselle, paluulinkeille ja ennätyksille.
- PWA-asennus ja offline-pelaaminen.

## Commitit

Tee yksi ymmärrettävä asia kerrallaan. Hyviä nimiä ovat esimerkiksi `Lisää Loisteeseen äänten kytkin` ja `Korjaa matopelin tauko puhelimella`. Tarkista Desktopin diffistä, että commitissa ovat vain tarkoitetut tiedostot.

## Tallennukset

Vanhojen ennätysten avaimet säilytettiin: `mato2-<pelimuoto>-<vaikeus>` ja `loiste-best`. Aiemman tiedostoversion, localhostin ja julkaistun sivun tallennukset eivät välttämättä näy toisilleen, koska selain erottaa tallennukset sivuston alkuperän perusteella.

## Puhelin- ja tablettikäyttöliittymä

Molemmat pelit käyttävät yhteistä `assets/game-ui.css`-tyylitiedostoa ja `assets/dialog.js`-skriptiä. Yhteiset valikot ovat tavallisia HTML-elementtejä: niiden sisältö vierittyy matalalla näytöllä ja näppäimistön kohdistus pysyy avoimessa valikossa. Taustalla oleva peli ei vastaanota valikon napautuksia.

Pystyasennossa ohjaimet ovat kentän alla. Vähintään 560 pikseliä leveässä vaakanäkymässä ne siirtyvät oikealle. Pelikentät sovitetaan jäljelle jäävään tilaan, ja pelin aikana tapahtuva kentän koon muutos tauottaa pelin. Näin esimerkiksi laitteen kääntäminen ei kuluta peliaikaa.

MATOssa suuntapainikkeet voi piilottaa asetuksista. Pyyhkäisyt käsitellään vain pelikentällä, jotta asetuksia voi vierittää normaalisti. Pelimuoto, vaikeus, äänet, seinien läpi kulkeminen ja painikkeiden näkyvyys tallentuvat avaimeen `pelikulma-mato-settings`.

LOISTEessa valikot ja pisteet ovat HTML:ää ja pelikenttä Canvasia. Ensimmäinen lähtö käynnistää nousevan pimeyden. Tauko pysäyttää simulaation, ja näkyvyysmuutos tauottaa pelin automaattisesti. Ääniasetus tallentuu avaimeen `pelikulma-loiste-sound`.
