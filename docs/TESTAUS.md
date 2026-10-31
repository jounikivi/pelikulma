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

## POMPPU

- Lähetä pallo -painike aloittaa kierroksen.
- Maila seuraa sormea, hiirtä, liukusäädintä sekä nuoli- ja A/D-näppäimiä.
- Mailan reunaan osuva pallo lähtee vinommin kuin keskelle osuva.
- Palikkaosumat kasvattavat pisteitä ja latausta, vahvistetut palikat kestävät kaksi tavallista osumaa.
- Täysi kipinä voidaan virittää, seuraava mailaosuma aktivoi teholennon ja teho päättyy kuuden pelisekunnin jälkeen.
- Pallon menetys vähentää yhden kolmesta pallosta. Kolmas menetys avaa tulosnäkymän.
- Kaikki palikat rikkova pelaaja etenee seuraavaan kuudesta kentästä, ja viimeinen kenttä avaa voittonäkymän.
- Tauko, välilehden vaihto ja laitteen kääntäminen pysäyttävät pelin.
- Ennätys säilyy latauksessa ja näkyy etusivun POMPPU-kortissa.

Automaattiset testit tarkistavat myös täyden pelin läpäisyn sekä tavallisella että kompaktilla kentällä. Fyysinen kosketustuntuma on tarkistettava erikseen puhelimella ja tabletilla.

### POMPUN tarkistus 31.10.2026

Kaikki 44 koodi- ja linkkitarkistusta sekä 16 regressiotestiä läpäistiin. Testeissä käytiin läpi myös kuuden kentän kokonainen peli sekä 360 että 540 yksikön korkuisella kentällä. Pelisimulaatio käytti tavallisia mailan ohjaus-, pallon lähetys- ja kipinän viritystoimintoja.

Selaimessa kokeiltiin aloitus, pallon lähetys, liukusäädin, tauko, kolme pallon menetystä ja tulosnäkymä. Selaimessa kerätty 30 pisteen ennätys näkyi paluun ja uudelleenlatauksen jälkeen myös etusivun uudessa pelikortissa. Etusivun pelimäärä päivittyi kolmeen ja leveässä näkymässä kaikki kolme korttia näkyivät rinnakkain.

## TAIVASKIPINÄ

- Kaikki kolme vaikeustasoa käynnistyvät ja ennätykset pysyvät erillään.
- Automaattinen tuli, suhteellinen sormiohjaus sekä näppäimistö toimivat.
- Pulssi tyhjentää lähiluodit, antaa lyhyen suojan ja kuluttaa energian.
- Aseparannus, korjaus ja energiapala toimivat, ja täysi ase/runko muuttaa kerättävän pisteiksi.
- Neljä aaltoa ja pomotaistelu toistuvat viidellä eri alueella. Pomot käyttävät erilaisia kuvioita.
- Alueen läpäisy avaa seuraavan alueen; viimeisen pomon tuhoaminen avaa lopetuksen.
- Normaalissa ja Haasteessa yksi osuma kuluttaa koneen; Rennossa runko kestää kolme osumaa. Kolmas menetetty kone päättää lennon.
- Tauko ja laitteen kääntäminen pysäyttävät toiminnan.
- Sivun lataaminen tuo Jatka-painikkeen, joka palauttaa nykyisen alueen alun. Häviö ja voitto poistavat jatkopaikan.
- Pelikortti avaa oikean sivun, ja normaalin tilan ennätys näkyy etusivulla.

Automaattinen kampanjatesti käyttää haavoittumatonta pilottia ja vahvistaa aaltojen, aseiden, pomojen ja lopetuksen etenemisen. Ihmispelaajan läpäisy ja vaikeustasojen pelituntuma on arvioitava erikseen. Fyysisten puhelinten kosketusohjauksen testausta ei korvaa selaimen näyttökokojen vaihtaminen.

### TAIVASKIPINÄN tarkistus 31.10.2026

56 syntaksi- ja linkkitarkistusta sekä kaikki 24 regressiotestiä läpäistiin. Kampanjatesti eteni viiden alueen ja viiden pomotaistelun kautta voittoon haavoittumattomalla testipilotilla; erilliset testit tarkistivat runkovauriot ja kolmen koneen menettämisen.

Selaimessa käynnistettiin kaikki kolme vaikeustasoa. Automaattinen tuli, ensimmäiset vihollisaallot, pisteet, liu'utettava ohjausalue, pulssi, tauko ja tallennetun lennon palauttaminen kokeiltiin. Näkymät tarkistettiin koossa 320 × 568, 390 × 844, 768 × 1024 ja 1024 × 768. Tabletin kääntäminen avasi taukovalikon. Etusivu tunnisti neljä peliä ja näytti normaalin tilan ennätyksen. Näissä selaintesteissä ei havaittu konsolivirheitä.

## Arcade-tuntuman regressiot

- Väistö aktivoituu heti, suojaa 0,9 sekuntia, ei tyhjennä luoteja ja kuluttaa yhden kolmesta käyttökerrasta. Tauko pysäyttää väistön ajan. Alueen vaihto palauttaa kolme väistöä.
- Lisätykit, tulinopeus, hajonta ja siipikoneet muuttavat näkyvää tulitusta. Täysi varustus ampuu seitsemän luotia kerralla. Osuma poistaa lisävarusteita.
- Kevyt kone kääntyy alapuolelta takaisin kerran, ja poistuu paluun jälkeen yläreunasta. Muodostelmat toistuvat samalla tavalla uusissa peleissä.
- Vanha tallennus palautuu, ja uusi tallennus säilyttää kaikki lisävarusteet ja väistöt.
- Oma taustamusiikki voidaan kytkeä päälle ja pois; tauko pysäyttää uusien nuottien soiton.
- Pelifiilis pitää vielä arvioida pelaamalla. Sääntö- ja kampanjasimulaatiot eivät todista identtistä tuntumaa C64-peliin.

### Arcade-päivityksen tarkistus

Kaikki 30 testiä sekä 56 koodi- ja linkkitarkistusta läpäistiin. Uudet testit varmistavat kolme välittömästi suojaavaa väistöä, täyden seitsemän laukauksen varustuksen, palautuvat koneet, muodostelmabonuksen, raskaan koneen varustepudotuksen, yhden osuman koneet ja tallennusversion muutoksen.

Selaimessa kokeiltiin väistö painikkeella ja välilyönnillä, musiikkikytkin, tauko ja uuden kampanjan käynnistys. Pienen 320 × 568 -näytön painikkeet mahtuivat näkyviin ja koon vaihtaminen tablettinäkymään avasi tauon. Näissä kokeissa ei havaittu konsolivirheitä.
