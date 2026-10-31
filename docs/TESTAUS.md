# Testaus ennen julkaisua

Aja `npm run check`. Käynnistä sitten `npm start` ja käy läpi alla olevat kohdat. Lista on tarkoitettu myös tulevien muutosten testaamiseen, eikä sen olemassaolo tarkoita, että kaikki laitteet olisi jo testattu.

## Valikko

- MATO- ja LOISTE-kortit avaavat oikean pelin.
- Molemmista peleistä pääsee takaisin valikkoon.
- Ennätykset päivittyvät paluun jälkeen.
- Kortteihin pääsee Tab-näppäimellä ja peli avautuu Enterillä.

## MATO

- Kaikki neljä pelimuotoa käynnistyvät ja kolme vaikeustasoa toimivat.
- Nuolinäppäimet, WASD ja pyyhkäisy ohjaavat matoa.
- Hedelmä kasvattaa matoa ja pisteitä.
- Seinään ja omaan vartaloon osuminen päättää pelin.
- Seinän läpi -asetus toimii.
- Tauko, jatkaminen ja uudelleenaloitus toimivat.
- Arcade-tilassa viholliset, energia, kilpi ja hidastus toimivat.
- Maze-tilassa näkyy esteitä ja Time Attackissa aika vähenee.
- Ennätys säilyy sivun uudelleenlatauksen jälkeen.

## LOISTE

- Napautus tai välilyönti käynnistää pelin.
- Seuraava napautus laukaisee aluksen kiertoradalta.
- Seuraavalle planeetalle pääsy nostaa pisteitä.
- Pimeys nousee ja päättää pelin saavuttaessaan aluksen.
- Uudelleenaloitus ja ennätyksen tallennus toimivat.

## Laitteet

- Tarkista kapea puhelinnäkymä, esimerkiksi 390 × 844.
- Tarkista matala vaakanäkymä ja ettei tarvittavia painikkeita jää piiloon.
- Tarkista tavallinen tietokoneen selainikkuna.
- Käy toisella välilehdellä kesken pelin ja palaa takaisin.
- Tarkista selaimen kehittäjätyökalujen Console virheiden varalta.
