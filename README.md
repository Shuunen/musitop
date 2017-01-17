# Musitop

It delete music you don't like and move the one you want to keep.


## Install

Install npm dependencies and set your "input" music folder.

Optional : if you want to move your favorite music, set the "keep" music folder.


## Use

Open command line and npm start.

Musitop will play music files found in input folder.

If you like or dislike, click on the appropriate icons, Musitop will delete bad music and move good music into "keep" folder.


## Thanks

* 1by1 & Vlc : for their great music players
* Paomedia & Aha-Soft : for their pretty icons
* Minimist : for easy argument parsing
* Node-notifier : for easy desktop notification
* Shuffle-array : for easy array shuffling
* Artists : for creating amazing music
* Electron : for their great app
* Config-prompt : for their [configuration lib](https://github.com/ironSource/node-config-prompt)
* Hero patterns : for their [nice & simple resources](http://www.heropatterns.com/)


## TODO

* handle case when no music left in input folder
* handle case when no music left in playlist
* handle case when song cannot be moved (eg. when destination already exists)
* add links in thanks
* add a gif demo usage
* add desktop notifications like http://singhharkirat.com/notification-logger/


## FAQ

** What about a generic cross-platform audio player ? **
It's a fu***ng utopia.

** What did you mean about a "generic cross-platform audio player" ? **
I mean a npm package that come with libraries that can play audio files
on Windows, Linux & Mac. In this way user does not need to install
any package before "npm install".

** What about including pre-compiled binaries in your repo ? **
Yes it's not so bad if there are one or just a few files to copy.
But it's not that simple to find. For example 1by1.exe is a one file
player that fit in 180kb. Great.
I did not find any equivalent binary to include for Linux. Help needed !

** Why not use installed software on the machine ? **
On Linux yes it's pretty cool & easy, for example we just have to test if
"mplayer" or "vlc" is here and use them, but in Windows, when use install
Vlc, depending on Windows version & user choice Vlc is not located every
time in the same place, so it's far way boring & complicated compared to
a "npm install myLib" where myLib is simply downloaded & usable in seconds.

** The package "speaker"/"lame"/"lib123" should do the work no ? **
It does not works with Node 6.x.
