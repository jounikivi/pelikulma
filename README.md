# PELIKULMA

Pieni selainpelikokoelma puhelimelle ja tietokoneelle. Pelit on tehty HTML:llä, CSS:llä ja JavaScriptillä ilman pelimoottoria tai ulkoisia kirjastoja.

## Pelit

| Peli             | Idea                                                                                                                                                | Ohjaus                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **MATO**         | Kerää hedelmiä, kasva ja väistä törmäyksiä. LCD-ruudun puhelinmato: Perinteinen, Taskutwist, Arcade, Sokkelo ja Aikahaaste sekä kolme vaikeustasoa. | Puhelinnäppäimet 2/4/6/8, ruudun painikkeet, pyyhkäisy, nuolet tai WASD. 5 tai välilyönti: tauko.     |
| **LOISTE**       | Ajoita lähtö kiertoradalta seuraavalle ennen kuin nouseva pimeys saavuttaa sinut.                                                                   | Lennä-painike, kentän napautus tai välilyönti.                                                        |
| **POMPPU**       | Kuusi palikanmurskauskenttää, kolme palloa ja ladattava kipinälyönti.                                                                               | Sormen tai hiiren liike, liukusäädin, nuolet tai A/D. Välilyönti lähettää pallon, K virittää kipinän. |
| **TAIVASKIPINÄ** | Oma pystyräiskintäkampanja: viisi aluetta ja pomoa, kolme vaikeustasoa, aseparannukset ja torjuntapulssi.                                           | Liu’utus kentällä tai ohjausalueella, nuolet tai WASD. Välilyönti tai X: pulssi. P tai Esc: tauko.    |

Ennätykset tallennetaan selaimen `localStorage`-muistiin. Ne ovat selain- ja sivustokohtaisia. MATO-valikkokortti näyttää Perinteinen / Normaali -yhdistelmän ennätyksen; muut yhdistelmät näkyvät pelin sisällä.

Puhelimella ohjaimet ovat kentän alla ja vaakanäkymässä sen vieressä. Kaikissa peleissä on taukovalikko, uudelleenaloitus ja äänten kytkin. MATO-pelin lisäasetukset löytyvät kohdasta **Asetukset ja ohjaus**.

## Käynnistä omalla koneella

Tarvitset [Node.js:n](https://nodejs.org/) version 22 tai uudemman.

1. Avaa projektikansio editorissa tai terminaalissa.
2. Suorita `npm start`.
3. Avaa selaimessa **http://localhost:5173**.
4. Sulje palvelin terminaalissa painamalla **Ctrl+C**.

Erillistä `npm install` -vaihetta ei tarvita: projektilla ei ole asennettavia riippuvuuksia. Käytä kehityksessä paikallista palvelinta: MATO, POMPPU ja TAIVASKIPINÄ käyttävät JavaScript-moduuleja, jotka eivät toimi luotettavasti suoraan tiedostona avattaessa.

## Vie projekti GitHubiin GitHub Desktopilla

Tämä projektikansio on alustettu paikalliseksi Git-repositorioksi. Ensimmäinen commit tehdään Desktopissa.

1. Avaa **GitHub Desktop** ja kirjaudu sisään GitHub-tilillesi.
2. Valitse **File → Add Local Repository…**.
3. Valitse tämän projektin kansio: `E:\peliohjelmointi\pelikulma`.
4. Valitse **Add Repository**.
5. Tarkista **Changes**-välilehden tiedostot. Kirjoita Summary-kenttään esimerkiksi `Pelikulman ensimmäinen projektiversio` ja paina **Commit to main**.
6. Valitse **Publish repository**. Nimeksi sopii `pelikulma`. Valitse itse, pidetäänkö repository yksityisenä kohdasta **Keep this code private**.
7. Vahvista **Publish Repository**.

Ohje: [projektin lisääminen GitHub Desktopilla](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop).

## Tavallinen kehityskierros

1. Hae muiden koneiden muutokset GitHub Desktopin **Fetch origin / Pull origin** -toiminnolla.
2. Tee muutokset editorissa ja kokeile niitä selaimessa (`npm start`).
3. Aja `npm run check` ja `npm test`.
4. Tarkista muutokset Desktopissa ja tee selkeästi nimetty commit.
5. Lähetä commit GitHubiin painamalla **Push origin**.

Isompaa ominaisuutta varten luo ensin **Branch → New branch…**, esimerkiksi `uusi-peli`. Näin saat kehitettyä ja tarkistettua ominaisuuden ennen yhdistämistä `main`-haaraan.

## Tiedostorakenne

```text
pelikulma/
├── index.html                 Pelivalikko
├── assets/
│   ├── menu.css               Valikon ulkoasu
│   ├── menu.js                Valikon ennätykset
│   └── favicon.svg            Selaimen kuvake
├── games/
│   ├── mato/
│   │   ├── index.html         Matopelin käyttöliittymä
│   │   ├── mato.css           Matopelin ulkoasu
│   │   ├── mato.js            Matopelin toiminta ja asetukset
│   │   └── mato-rules.js      Liikkumisen ja Taskutwistin säännöt
│   ├── loiste/
│   │   ├── index.html         Loiste-pelin sivu
│   │   ├── loiste.css         Loiste-pelin ulkoasu
│   │   └── loiste.js          Loiste-pelin toiminta ja asetukset
│   ├── pomppu/
│   │   ├── index.html         POMPUN käyttöliittymä
│   │   ├── pomppu.css         Arcade-ulkoasu
│   │   ├── pomppu.js          Ohjaus, piirto ja valikot
│   │   └── pomppu-engine.js   Pelifysiikka ja kuusi kenttää
│   └── taivaskipina/
│       ├── index.html         Lentokampanjan käyttöliittymä
│       ├── style.css          Ilme ja mobiiliasettelu
│       ├── game.js            Piirto, ohjaus ja tallentaminen
│       └── engine.js          Aallot, pomot ja pelisäännöt
├── tests/                     Pelien sääntöjen ja fysiikan testit
├── scripts/                   Paikallinen palvelin ja tarkistukset
├── docs/                      Kehitys- ja testausohjeet
└── .github/                   Automaattinen tarkistus ja ilmoituspohjat
```

## Mitä muokkaan?

- **Pelien nopeudet, vaikeus ja säännöt:** kyseisen pelin `.js`-tiedoston alun `CFG`-asetukset.
- **Värit, fontit ja asettelu:** valikon tai pelin `.css`-tiedosto.
- **Valikon kortit ja tekstit:** juuren `index.html`.
- **Uusi peli:** luo oma hakemisto `games/`-kansioon ja lisää kortti valikkoon.

Taskutwistissä joka viides omena tuo X-merkillä näkyvän katkaisupalan. Sen nappaaminen kahdeksassa sekunnissa antaa 30 pistettä ja lyhentää häntää neljällä ruudulla. Madosta jää aina vähintään neljä ruutua. Perinteinen-tilassa ei ole katkaisupaloja.

POMPUSSA viisi palikkaosumaa lataa kipinälyönnin. Viritä kipinä ja ota pallo mailaan: läpäisevä teho kestää kuusi sekuntia peliaikaa. Vahvistetut palikat kestävät kaksi tavallista osumaa, mutta kipinä läpäisee ne kerralla. Kentän läpäisystä saa 100 bonuspistettä. Ennätys tallentuu avaimeen `pomppu-best`.

TAIVASKIPINÄ tallentaa jatkopaikan aina alueen alkuun. Valitse aloitusvalikosta **Jatka**, kun palaat peliin. Nykyinen alue alkaa alusta sen aloituspisteillä ja varusteilla. Vaikeustasoilla on omat ennätyksensä (`taivaskipina-best-easy`, `taivaskipina-best-normal`, `taivaskipina-best-hard`), ja etusivu näyttää normaalin tilan ennätyksen.

Katso [kehitysohje](docs/KEHITYS.md) ja [testauslista](docs/TESTAUS.md).

## Tarkistukset

`npm run check` tarkistaa JavaScriptin syntaksin sekä HTML-tiedostojen paikalliset linkit, tyylitiedostot ja skriptiviittaukset. `npm test` tarkistaa madon säännöt sekä POMPUN törmäykset, elämät, kentät ja kipinälyönnin. Automaattinen pelisimulaatio käy kaikki kuusi kenttää läpi sekä tavallisella että kompaktilla kentällä. Molemmat tarkistukset suoritetaan GitHub Actionsissa pushin ja pull requestin yhteydessä. Se ei korvaa pelaamista selaimessa.

## Julkaise pelattavaksi GitHub Pagesissa

Kun repository on GitHubissa:

1. Avaa repository selaimessa ja valitse **Settings → Pages**.
2. Valitse **Source → Deploy from a branch**.
3. Valitse **main** ja **/(root)**, sitten **Save**.
4. Odota julkaisua. Pages näyttää sivuston osoitteen asetussivulla.

Tämä on staattinen sivusto, joten erillistä build-komentoa ei tarvita. Suhteelliset tiedostopolut toimivat myös repositoryn alihakemistossa. GitHub Pagesin saatavuus yksityiselle repositorylle riippuu GitHub-tilauksesta.

Ohje: [GitHub Pagesin julkaisulähteen valinta](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Lisenssi

Projektille ei ole vielä valittu avoimen lähdekoodin lisenssiä. Päätä lisenssi ennen kuin tarjoat koodia muiden vapaasti käytettäväksi; pelkkä julkinen GitHub-repository ei anna yleistä käyttöoikeutta.
