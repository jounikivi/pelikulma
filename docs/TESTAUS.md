# Testaus ennen julkaisua

Aja `npm run check`. Käynnistä sitten `npm start` ja käy läpi alla olevat kohdat. Lista on tarkoitettu myös tulevien muutosten testaamiseen, eikä sen olemassaolo tarkoita, että kaikki laitteet olisi jo testattu.

## Valikko

- MATO- ja LOISTE-kortit avaavat oikean pelin.
- Molemmista peleistä pääsee takaisin valikkoon.
- Ennätykset päivittyvät paluun jälkeen.
- Kortteihin pääsee Tab-näppäimellä ja peli avautuu Enterillä.

## MATO

- Kaikki viisi pelimuotoa käynnistyvät ja kolme vaikeustasoa toimivat.
- Näppäimet 2/4/6/8, nuolinäppäimet, WASD, pyyhkäisy ja ruudun suuntapainikkeet ohjaavat matoa.
- Näppäin 5 avaa taukovalikon.
- Taskutwistissä joka viides omena tuo katkaisupalan, joka antaa 30 pistettä ja lyhentää häntää enintään neljällä ruudulla.
- Katkaisupalan kahdeksan sekunnin aika ei kulu tauolla.
- Perinteisessä tilassa katkaisupaloja ei tule.
- Suuntapainikkeiden piilottaminen ja asetusten tallentuminen toimivat.
- Hedelmä kasvattaa matoa ja pisteitä.
- Seinään ja omaan vartaloon osuminen päättää pelin.
- Seinän läpi -asetus toimii.
- Tauko, jatkaminen ja uudelleenaloitus toimivat.
- Arcade-tilassa viholliset, energia, kilpi ja hidastus toimivat.
- Maze-tilassa näkyy esteitä ja Time Attackissa aika vähenee.
- Ennätys säilyy sivun uudelleenlatauksen jälkeen.

## LOISTE

- Aloita peli -painike käynnistää pelin.
- Kentän napautus, Lennä-painike ja välilyönti laukaisevat aluksen kiertoradalta.
- Pimeys pysyy paikallaan ennen ensimmäistä lähtöä.
- Tauko, jatkaminen, uudelleenaloitus ja äänten kytkin toimivat.
- Seuraavalle planeetalle pääsy nostaa pisteitä.
- Pimeys nousee ja päättää pelin saavuttaessaan aluksen.
- Uudelleenaloitus ja ennätyksen tallennus toimivat.

## Laitteet

- Tarkista kapea puhelinnäkymä, esimerkiksi 390 × 844.
- Tarkista matala vaakanäkymä ja ettei tarvittavia painikkeita jää piiloon.
- Tarkista tavallinen tietokoneen selainikkuna.
- Käy toisella välilehdellä kesken pelin ja palaa takaisin.
- Tarkista selaimen kehittäjätyökalujen Console virheiden varalta.

- Käännä laite kesken pelin: peli tauottuu ja ohjaimet asettuvat uudelleen.
- Avaa asetukset pienellä näytöllä ja varmista, että niitä voi vierittää.

## Mobiiliuudistuksen tarkistus 31.10.2026

Paikallisessa selaintestissä käytettiin näyttökokoja 320 × 568, 390 × 844, 667 × 375, 768 × 1024 ja 1024 × 768. Näkymiä tarkastettiin kuvista ja pelikentän sekä ohjaimien sijainneista.

- Kaikkien neljän MATO-pelimuodon käynnistys sekä tauko ja jatkaminen kokeiltiin.
- MATO-pelin suuntapainike, tulosnäkymä, uudelleenaloitus ja pelimuodon vaihto kokeiltiin.
- Suuntapainikkeiden piilotus säilyi sivun uudelleenlatauksessa, minkä jälkeen painikkeet palautettiin näkyviin.
- LOISTEen aloitus, Lennä-painike, tauko, jatkaminen, tulosnäkymä ja uudelleenaloitus kokeiltiin.
- Näyttökoon vaihto tauotti käynnissä olevan pelin molemmissa peleissä.
- Näissä selaintesteissä ei havaittu konsolivirheitä. `npm run check` läpäisi 25 syntaksi- ja linkkitarkistusta.

Nämä olivat selaimen näyttökoon vaihteluun perustuvia tarkistuksia. Fyysisten puhelinten ja tablettien kosketustuntumaa, selainten ylä- ja alapalkkeja tai kaikkia pelisääntöjä ei testattu kattavasti.

## Pocket-version tarkistus 31.10.2026

- `npm test`: viisi regressiotestiä läpäistiin. Ne kattavat kasvun, vapautuvan häntäruudun, hännän katkaisun, vähimmäispituuden ja bonusvälin.
- Kaikkien viiden pelimuodon aloitus sekä tauko kokeiltiin selaimessa. Numeronäppäimillä ohjaus ja 5-näppäimen tauko kokeiltiin myös painikkeen ollessa kohdistettuna.
- Näkymä tarkistettiin 320 × 568-, 390 × 844-, 667 × 375-, 768 × 1024- ja 1024 × 768 -koossa. Tabletin kääntäminen tauottaa pelin myös silloin, kun pelikentän pikselikoko ei muutu.
- Taskutwistin pelin päättyminen ja tulosnäkymä kokeiltiin. Vanhojen pelimuotojen ennätysavaimet säilyivät ennallaan; Taskutwistillä on erillinen avain.
- Kosketustuntuman testaus fyysisillä laitteilla ja katkaisupalojen kerääminen kokonaisen pelisession aikana jäävät käsin pelattavaan testauslistaan. Säännöt on tarkistettu automaattitesteillä.
