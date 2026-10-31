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

## MATO Pocket ja Taskutwist

MATO piirretään kiinteään 160 × 160 pikselin LCD-näkymään. Ruutu skaalautuu ilman pehmennystä. Puhelimen kuori, pistelaskuri ja 2/4/5/6/8-näppäimet ovat HTML:ää ja CSS:ää.

Pelimuoto `twist` käyttää omaa ennätysavainta `mato2-twist-<vaikeus>`. Vanhojen pelimuotojen avaimet säilyvät. Katkaisupala ilmestyy joka viidennestä omenasta, on näkyvissä kahdeksan sekuntia ja antaa 30 pistettä. Se ei kasvata matoa, vaan poistaa enintään neljä häntäruutua; vähimmäispituus on neljä.

Liikkuminen ja törmäyksen keskeinen häntäsääntö on erotettu moduuliin `games/mato/mato-rules.js`. Suorita regressiotestit komennolla `npm test`. Peli käyttää ES-moduuleja, joten käynnistä se palvelimella (`npm start`) tai julkaistulta sivulta.

## POMPPU

Pelin puhdas fysiikka ja kenttäkuviot ovat tiedostossa `games/pomppu/pomppu-engine.js`. UI, ohjaus, äänet ja piirto ovat tiedostossa `pomppu.js`. Kuusi kenttää on kuvattu `LEVELS`-taulukossa: 0 = tyhjä, 1 = tavallinen ja 2 = vahvistettu palikka.

Pelin leveys on 360 yksikköä. Uuden pelin korkeus sovitetaan näytön tilaan välille 360–640 yksikköä, ja pallon nopeus sovitetaan kentän korkeuteen. Käynnissä olevan pelin logiikan korkeus säilyy laitteen kääntämisessä; peli tauottuu ja piirto sovitetaan uudelleen. Uudelleenaloitus valitsee uuden näyttöön sopivan korkeuden.

Kipinä latautuu 20 prosenttia per palikkaosuma. Pelaaja varaa täyden latauksen painikkeella, ja seuraava mailaosuma aktivoi kuuden pelisekunnin läpäisytehon. Tauko pysäyttää myös tehoajan. Varattu kipinä ja lataus siirtyvät seuraavaan kenttään. Pallon menetys sammuttaa teholennon ja varauksen.

Fysiikka käyttää pieniä osavaiheita, jotta nopea pallo ei hyppää palikan läpi. `npm test` kattaa törmäykset, vahvistetut palikat, elämät, kipinän sekä täyden pelin läpäisyn ohjaussimulaatiolla.

## TAIVASKIPINÄ

Oma lentävien saarten maailma ja pikselispritet piirretään Canvasille tiedostossa `games/taivaskipina/game.js`. Pelisäännöt, viisi aluetta, vihollisaallot, pomojen erilaiset luotikuviot ja tallennuksen validointi ovat moduulissa `engine.js`. Grafiikka, kartat, nimet ja äänet ovat tämän projektin oma toteutus.

Kampanjassa on viisi aluetta, neljä vihollisaaltoa aluetta kohti ja lopuksi pomokone. Vaikeustaso säätää luotinopeutta, ampumisväliä ja pistekerrointa. Aseessa on kolme tasoa, rungossa viisi osumapistettä ja koneita kolme. Uusi kone saa kolmen sekunnin suojan. Törmäysalue on pieni valkoinen piste; siivet eivät ole osuma-alue.

Pulssi vaatii 100 energiaa ja torjuu 190 yksikön säteellä olevat luodit. Se vahingoittaa lähivihollisia ja antaa lyhyen suojan. Energia palautuu ajan myötä ja tuhotuista koneista. Kerättävät W, R ja E parantavat asetta, korjaavat runkoa ja lataavat energiaa.

Jatkopaikka tallentuu avaimella `taivaskipina-save` vain alueen alussa, jotta uudelleenlataus ei monista pisteitä. Tallennus sisältää vaikeuden, alueen, aloituspisteet, rungon, koneet, asetehon ja energian. `restore` hylkää virheelliset kentät ja tuntemattomat vaikeustasot. Tallennettu lento jatkuu alueen alusta. Häviö ja kampanjan läpäisy poistavat jatkopaikan. Eri vaikeuksilla on eri ennätysavaimet.

`npm test` tarkistaa liikkeen, automaattisen ampumisen, suojan, kolmen koneen menettämisen, kerättävät, pulssin, tallennukset, viisi eri pomokuviota ja koko kampanjan etenemisen. Kampanjan etenemistestissä pilotti on haavoittumaton, joten se ei yksin arvioi vaikeustasojen ihmispelaajalle sopivaa tasapainoa.
