# PELIKULMA

Pieni selainpelikokoelma puhelimelle ja tietokoneelle. Pelit on tehty HTML:llä, CSS:llä ja JavaScriptillä ilman pelimoottoria tai ulkoisia kirjastoja.

## Pelit

| Peli       | Idea                                                                                                      | Ohjaus                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **MATO**   | Kerää hedelmiä, kasva ja väistä törmäyksiä. Classic, Arcade, Maze ja Time Attack sekä kolme vaikeustasoa. | Pyyhkäisy, nuolinäppäimet tai WASD. Välilyönti: tauko. |
| **LOISTE** | Ajoita lähtö kiertoradalta seuraavalle ennen kuin nouseva pimeys saavuttaa sinut.                         | Napautus, hiiren napsautus, välilyönti tai Enter.      |

Ennätykset tallennetaan selaimen `localStorage`-muistiin. Ne ovat selain- ja sivustokohtaisia. MATO-valikkokortti näyttää Classic / Normaali -yhdistelmän ennätyksen; muut yhdistelmät näkyvät pelin sisällä.

## Käynnistä omalla koneella

Tarvitset [Node.js:n](https://nodejs.org/) version 22 tai uudemman.

1. Avaa projektikansio editorissa tai terminaalissa.
2. Suorita `npm start`.
3. Avaa selaimessa **http://localhost:5173**.
4. Sulje palvelin terminaalissa painamalla **Ctrl+C**.

Erillistä `npm install` -vaihetta ei tarvita: projektilla ei ole asennettavia riippuvuuksia. Voit avata myös `index.html`-tiedoston suoraan selaimessa, mutta kehityksessä kannattaa käyttää aina samaa paikallista osoitetta, jotta tallennukset toimivat johdonmukaisesti.

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
3. Aja `npm run check`.
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
│   │   └── mato.js            Matopelin toiminta ja asetukset
│   └── loiste/
│       ├── index.html         Loiste-pelin sivu
│       ├── loiste.css         Loiste-pelin ulkoasu
│       └── loiste.js          Loiste-pelin toiminta ja asetukset
├── scripts/                   Paikallinen palvelin ja tarkistukset
├── docs/                      Kehitys- ja testausohjeet
└── .github/                   Automaattinen tarkistus ja ilmoituspohjat
```

## Mitä muokkaan?

- **Pelien nopeudet, vaikeus ja säännöt:** kyseisen pelin `.js`-tiedoston alun `CFG`-asetukset.
- **Värit, fontit ja asettelu:** valikon tai pelin `.css`-tiedosto.
- **Valikon kortit ja tekstit:** juuren `index.html`.
- **Uusi peli:** luo oma hakemisto `games/`-kansioon ja lisää kortti valikkoon.

Katso [kehitysohje](docs/KEHITYS.md) ja [testauslista](docs/TESTAUS.md).

## Tarkistukset

`npm run check` tarkistaa JavaScriptin syntaksin sekä HTML-tiedostojen paikalliset linkit, tyylitiedostot ja skriptiviittaukset. Sama tarkistus suoritetaan GitHub Actionsissa pushin ja pull requestin yhteydessä. Se ei korvaa pelaamista selaimessa.

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
